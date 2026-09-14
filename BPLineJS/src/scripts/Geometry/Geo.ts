import { GETID } from "../ID";
import Style from "../Style";
import type { StyleChange, StyleSubscriber } from "../Style";

/** 边框对齐类型沿用 Style 定义。 */
import type { BorderAlign } from "../Style";
interface GeoBuffersLike {
    vertex?: number;
    normal?: number;
    uv?: number;
    index?: number;
}
/** 单个几何分区的顶点属性。 */
interface GeoPartDataLike {
    geometry: Float32Array;
    normal: Float32Array;
    uv: Float32Array;
    index: Uint16Array | Uint32Array;
    /** 点型逐顶点中心坐标，长度与 geometry 相同。 */
    position?: Float32Array;
    /** 每个顶点的用途：0 为实体面，0.5 为宽边框，1 为关键点。 */
    vertexType?: Float32Array;
    miterScale?: Float32Array;
}


/** 几何消费者；通知只标记后续工作，不在回调中生成几何或操作 GPU。 */
interface GeometrySubscriber {
    onGeometryChange(geometry: GeoData): void;
}

interface GeoData extends StyleSubscriber {
    readonly id: number;
    readonly type: string;
    readonly version: number;
    style: Style;
    geometry: Float32Array | undefined;
    normal: Float32Array | undefined;
    uv: Float32Array | undefined;
    index: Uint16Array | Uint32Array | undefined;
    linePoints: GeoPartDataLike | undefined;
    vertexType: Float32Array | undefined;
    position: Float32Array | undefined;
    miterScale: Float32Array | undefined;
    readonly uniformData: Float32Array<ArrayBuffer>;
    add(subscriber: GeometrySubscriber): void;
    delete(subscriber: GeometrySubscriber): void;
    updateVersion(): void;
    ensureGeometry(): this;
    updateGeometry(): this;
    dispose(): void;
}

/** CPU 几何及其单一版本；样式订阅只响应影响几何生成的字段。 */
class Geo implements GeoData {
    /** 全局几何 ID。 */
    public readonly id: number = GETID();
    /** 对象类型。 */
    public readonly type: string = "Geo";
    private _version: number = 0;
    private _generatedVersion: number = -1;
    private _style: Style;
    private _disposed: boolean = false;
    private readonly _subscribers = new Set<GeometrySubscriber>();
    /** 合并三角面坐标。 */
    protected _geometry: Float32Array | undefined;
    /** 逐顶点二维轮廓法线。 */
    public normal: Float32Array | undefined;
    /** 逐顶点 UV。 */
    public uv: Float32Array | undefined;
    /** 合并三角面索引。 */
    public index: Uint16Array | Uint32Array | undefined;
    /** 独立 line-list 几何。 */
    public linePoints: GeoPartDataLike | undefined;
    /** 顶点用途：0 实体面、0.5 边框、1 关键点。 */
    public vertexType: Float32Array | undefined;
    /** 关键点中心，其他顶点填零。 */
    public position: Float32Array | undefined;
    /** 边框连接倍率，其他顶点填一。 */
    public miterScale: Float32Array | undefined;
    /** 宽高、圆角和实体边框宽度。 */
    public readonly uniformData: Float32Array<ArrayBuffer> = new Float32Array(4);

    /** @param style 共享样式，默认四个分区全部关闭 */
    public constructor(style: Style = new Style()) {
        this._style = style;
        style.add(this);
    }
    /** 当前共享样式，分区 enabled 决定生成内容。 */
    public get style(): Style { return this._style; }
    /** @param value 新样式，先解绑旧样式并使全部几何缓存失效 */
    public set style(value: Style) {
        if (this._disposed) throw new Error("Disposed geometry cannot be reused.");
        if (this._style === value) return;
        this._style.delete(this);
        this._style = value;
        value.add(this);
        this.updateVersion();
    }
    /**
     * 只让几何依赖的字段触发重建，颜色和透明度不影响顶点。
     * @param change 样式通知
     */
    public onStyleChange(change: StyleChange): void {
        if (this._disposed || change.source !== this._style) return;
        if (change.field === "enabled"
            || (change.area === "join" && this.type === "Poly2D")
            || (change.area === "edge" && ["width", "borderAlign", "uvRepeat"].includes(change.field))
            || (change.area === "points" && ["vertices", "midpoints", "radius", "segments", "minPointsLength", "minEdgePointsLength"].includes(change.field))) {
            this.updateVersion();
        }
    }
    /** 最终停止使用时解绑 Style；不等于从 Scene 移除，不销毁 Render 缓存。 */
    public dispose(): void {
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }

    /**
     * 关联使用当前几何的消费者，重复关联不会重复通知。
     * @param subscriber Mesh 或其他几何消费者
     */
    public add(subscriber: GeometrySubscriber): void {
        if (this._disposed) throw new Error("Disposed geometry cannot be reused.");
        this._subscribers.add(subscriber);
    }

    /**
     * 解绑消费者，不销毁共享几何或 GPU 缓存。
     * @param subscriber 需要解绑的消费者
     */
    public delete(subscriber: GeometrySubscriber): void {
        this._subscribers.delete(subscriber);
    }

    /**
     * 获取合并三角面的二维顶点数组。
     * @returns 顶点数组，未生成三角面时为 undefined
     */
    public get geometry(): Float32Array | undefined {
        return this._geometry;
    }

    /**
     * 替换合并三角面顶点数组并通知 GPU 缓存更新。
     * 已生成的 CPU 数据直接提交；尚未生成的参数变化仍由 ensureGeometry 处理。
     * @param geometry 新顶点数组
     */
    public set geometry(geometry: Float32Array | undefined) {
        if (this._geometry === geometry) {
            return;
        }

        const generatedVersion: number = this._generatedVersion;
        const previousVersion: number = this._version;
        this._geometry = geometry;
        this.updateVersion();
        if (generatedVersion === previousVersion) {
            this._generatedVersion = this._version;
        }
    }


    /**
     * 按实体面、宽边框、关键点顺序合并全部三角面并补齐顶点属性。
     * 索引按顶点偏移重新定位，顶点数量超过 Uint16 范围时自动升级位宽。
     * @param parts 本次启用的几何分区
     * @returns 无返回值
     */
    protected mergeGeometry(parts: { data: GeoPartDataLike; vertexType: number }[]): void {
        const vertexCount: number = parts.reduce((sum, part): number => sum + part.data.geometry.length / 2, 0);
        const indexCount: number = parts.reduce((sum, part): number => sum + part.data.index.length, 0);
        if (indexCount === 0) {
            this._geometry = undefined;
            this.normal = undefined;
            this.uv = undefined;
            this.index = undefined;
            this.vertexType = undefined;
            this.position = undefined;
            this.miterScale = undefined;
            return;
        }
        this._geometry = new Float32Array(vertexCount * 2);
        this.normal = new Float32Array(vertexCount * 2);
        this.uv = new Float32Array(vertexCount * 2);
        this.position = new Float32Array(vertexCount * 2);
        this.vertexType = new Float32Array(vertexCount);
        this.miterScale = new Float32Array(vertexCount).fill(1);
        this.index = vertexCount > 65536 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);

        let vertexOffset: number = 0;
        let indexOffset: number = 0;
        for (const part of parts) {
            const data = part.data;
            const count: number = data.geometry.length / 2;
            this._geometry.set(data.geometry, vertexOffset * 2);
            this.normal.set(data.normal, vertexOffset * 2);
            this.uv.set(data.uv, vertexOffset * 2);
            this.vertexType.fill(part.vertexType, vertexOffset, vertexOffset + count);
            if (data.position !== undefined) this.position.set(data.position, vertexOffset * 2);
            if (data.miterScale !== undefined) this.miterScale.set(data.miterScale, vertexOffset);
            for (const index of data.index) {
                this.index[indexOffset] = index + vertexOffset;
                indexOffset += 1;
            }
            vertexOffset += count;
        }
    }

    /** 当前几何版本。 */
    public get version(): number { return this._version; }
    /** 通知 CPU 生成器及每个 Render 更新缓存。 */
    public updateVersion(): void {
        this._version++;
        for (const subscriber of [...this._subscribers]) subscriber.onGeometryChange(this);
    }
    /** 参数变化后延迟生成，一帧内多次改值只生成一次。 */
    public ensureGeometry(): this {
        if (this._disposed) throw new Error("Disposed geometry cannot be rendered.");
        if (this._generatedVersion !== this._version) this.updateGeometry();
        return this;
    }
    /** 提交生成的数据；手动调用也会递增版本，通知每个 Render。 */
    public updateGeometry(): this {
        this.updateVersion();
        this._generatedVersion = this._version;
        return this;
    }
}
export default Geo;
export type { BorderAlign, GeoBuffersLike, GeoData, GeoPartDataLike, GeometrySubscriber };
