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
    /**
     * 接收几何变化通知，标记下一次渲染需要同步的数据。
     * @param geometry 几何对象或顶点数组
     * @example
     * geometrySubscriber.onGeometryChange(geometry);
     * @returns 无返回值。
     */
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
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param subscriber 接收变化通知的消费者
     * @example
     * geoData.add(subscriber);
     * @returns 无返回值。
     */
    add(subscriber: GeometrySubscriber): void;
    /**
     * 解除消费者关联，不销毁被共享的对象。
     * @param subscriber 接收变化通知的消费者
     * @example
     * geoData.delete(subscriber);
     * @returns 无返回值。
     */
    delete(subscriber: GeometrySubscriber): void;
    /**
     * 递增当前版本，使使用该对象的缓存能够识别变化。
     * @example
     * geoData.updateVersion();
     * @returns 无返回值。
     */
    updateVersion(): void;
    /**
     * 在参数版本变化后生成几何；版本未变时复用已有数组。
     * @example
     * geoData.ensureGeometry();
     * @returns 当前对象，可继续链式调用。
     */
    ensureGeometry(): this;
    /**
     * 重新生成并提交几何数组，使渲染器在下一帧更新缓存。
     * @example
     * geoData.updateGeometry();
     * @returns 当前对象，可继续链式调用。
     */
    updateGeometry(): this;
    /**
     * 释放当前对象持有的订阅关联，不代替 Render 销毁共享 GPU 资源。
     * @example
     * geoData.dispose();
     * @returns 无返回值。
     */
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
    /** 几何专属四个 f32；第四项统一为实体边框宽度，其余由对应 WGSL 解释。 */
    public readonly uniformData: Float32Array<ArrayBuffer> = new Float32Array(4);
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param style 共享样式，默认四个分区全部关闭
     * @example
     * const geo = new Geo(style);
     * @returns 创建的 Geo 对象。
     */
    public constructor(style: Style = new Style()) {
        this._style = style;
        style.add(this);
    }
    /**
     * 当前共享样式，分区 enabled 决定生成内容。
     * @example
     * const value = geo.style;
     * @returns 当前共享样式，分区 enabled 决定生成内容。
     */
    public get style(): Style {
        return this._style;
    }
    /**
     * 当前共享样式，分区 enabled 决定生成内容。
     * @param value 新样式，先解绑旧样式并使全部几何缓存失效
     * @example
     * geo.style = value;
     * @returns 无返回值。
     */
    public set style(value: Style) {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed geometry cannot be reused.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._style !== value) {
            this._style.delete(this);
            this._style = value;
            value.add(this);
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 只让几何依赖的字段触发重建，颜色和透明度不影响顶点。
     * @param change 样式通知
     * @example
     * geo.onStyleChange(change);
     * @returns 无返回值。
     */
    public onStyleChange(change: StyleChange): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed && change.source === this._style) {
            // 根据变化字段选择更新范围，避免无关属性触发资源重建。
            if (
                change.field === "enabled" ||
                (change.area === "join" && this.type === "Poly2D") ||
                (change.area === "edge" && ["width", "borderAlign", "uvRepeat"].includes(change.field)) ||
                (change.area === "points" &&
                    [
                        "vertices",
                        "midpoints",
                        "radius",
                        "segments",
                        "minPointsLength",
                        "minEdgePointsLength",
                    ].includes(change.field))
            ) {
                this.updateVersion();
            }
        } else {
            return;
        }
    }
    /**
     * 最终停止使用时解绑 Style；不等于从 Scene 移除，不销毁 Render 缓存。
     * @example
     * geo.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }
    /**
     * 关联使用当前几何的消费者，重复关联不会重复通知。
     * @param subscriber Mesh 或其他几何消费者
     * @example
     * geo.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: GeometrySubscriber): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed geometry cannot be reused.");
        }
        this._subscribers.add(subscriber);
    }
    /**
     * 解绑消费者，不销毁共享几何或 GPU 缓存。
     * @param subscriber 需要解绑的消费者
     * @example
     * geo.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: GeometrySubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 获取合并三角面的二维顶点数组。
     * @example
     * const value = geo.geometry;
     * @returns 顶点数组，未生成三角面时为 undefined
     */
    public get geometry(): Float32Array | undefined {
        return this._geometry;
    }
    /**
     * 替换合并三角面顶点数组并通知 GPU 缓存更新。
     * 已生成的 CPU 数据直接提交；尚未生成的参数变化仍由 ensureGeometry 处理。
     * @param geometry 新顶点数组
     * @example
     * geo.geometry = geometry;
     * @returns 顶点数组，未生成三角面时为 undefined
     */
    public set geometry(geometry: Float32Array | undefined) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (this._geometry !== geometry) {
            const generatedVersion: number = this._generatedVersion;
            const previousVersion: number = this._version;
            this._geometry = geometry;
            this.updateVersion();
            // 比较当前版本与处理快照，只同步尚未处理的变化。
            if (generatedVersion === previousVersion) {
                this._generatedVersion = this._version;
            }
        } else {
            return;
        }
    }
    /**
     * 按实体面、宽边框、关键点顺序合并全部三角面并补齐顶点属性。
     * 索引按顶点偏移重新定位，顶点数量超过 Uint16 范围时自动升级位宽。
     * @param parts 本次启用的几何分区
     * @example
     * this.mergeGeometry(parts);
     * @returns 无返回值
     */
    protected mergeGeometry(
        parts: {
            data: GeoPartDataLike;
            vertexType: number;
        }[],
    ): void {
        /**
         * 累计几何分区的顶点数，用于一次分配合并数组。
         * @param sum 已累计的数值
         * @param part 当前几何分区
         * @example
         * CountVertices(sum, part);
         * @returns 累计顶点数。
         */
        const CountVertices = (sum: number, part: { data: GeoPartDataLike; vertexType: number }): number =>
            sum + part.data.geometry.length / 2;
        const vertexCount: number = parts.reduce(CountVertices, 0);
        /**
         * 累计几何分区的索引数，用于一次分配索引数组。
         * @param sum 已累计的数值
         * @param part 当前几何分区
         * @example
         * CountIndices(sum, part);
         * @returns 累计索引数。
         */
        const CountIndices = (sum: number, part: { data: GeoPartDataLike; vertexType: number }): number =>
            sum + part.data.index.length;
        const indexCount: number = parts.reduce(CountIndices, 0);
        // 没有三角面时清除旧属性数组，避免继续绘制上一版几何。
        if (indexCount === 0) {
            this._geometry = undefined;
            this.normal = undefined;
            this.uv = undefined;
            this.index = undefined;
            this.vertexType = undefined;
            this.position = undefined;
            this.miterScale = undefined;
            return;
        } else {
            this._geometry = new Float32Array(vertexCount * 2);
            this.normal = new Float32Array(vertexCount * 2);
            this.uv = new Float32Array(vertexCount * 2);
            this.position = new Float32Array(vertexCount * 2);
            this.vertexType = new Float32Array(vertexCount);
            this.miterScale = new Float32Array(vertexCount).fill(1);
            // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
            if (vertexCount > 65536) {
                this.index = new Uint32Array(indexCount);
            } else {
                this.index = new Uint16Array(indexCount);
            }
            let vertexOffset: number = 0;
            let indexOffset: number = 0;
            // 逐个处理独立几何分区，合并时保留各自的轮廓边界。
            for (const part of parts) {
                const data = part.data;
                const count: number = data.geometry.length / 2;
                this._geometry.set(data.geometry, vertexOffset * 2);
                this.normal.set(data.normal, vertexOffset * 2);
                this.uv.set(data.uv, vertexOffset * 2);
                this.vertexType.fill(part.vertexType, vertexOffset, vertexOffset + count);
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (data.position !== undefined) {
                    this.position.set(data.position, vertexOffset * 2);
                }
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (data.miterScale !== undefined) {
                    this.miterScale.set(data.miterScale, vertexOffset);
                }
                // 逐项处理 data.index，保持集合中的既定顺序。
                for (const index of data.index) {
                    this.index[indexOffset] = index + vertexOffset;
                    indexOffset += 1;
                }
                vertexOffset += count;
            }
        }
    }
    /**
     * 当前几何版本。
     * @example
     * const value = geo.version;
     * @returns 当前几何版本。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 通知 CPU 生成器及每个 Render 更新缓存。
     * @example
     * geo.updateVersion();
     * @returns 无返回值。
     */
    public updateVersion(): void {
        this._version++;
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onGeometryChange(this);
        }
    }
    /**
     * 参数变化后延迟生成，一帧内多次改值只生成一次。
     * @example
     * geo.ensureGeometry();
     * @returns 当前对象，可继续链式调用。
     */
    public ensureGeometry(): this {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed geometry cannot be rendered.");
        }
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (this._generatedVersion !== this._version) {
            this.updateGeometry();
        }
        return this;
    }
    /**
     * 提交生成的数据；手动调用也会递增版本，通知每个 Render。
     * @example
     * geo.updateGeometry();
     * @returns 当前对象，可继续链式调用。
     */
    public updateGeometry(): this {
        this.updateVersion();
        this._generatedVersion = this._version;
        return this;
    }
}
export default Geo;
export type { BorderAlign, GeoBuffersLike, GeoData, GeoPartDataLike, GeometrySubscriber };
