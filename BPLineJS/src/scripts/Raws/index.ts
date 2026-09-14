import { Vec2 } from "bpmatrixjs/Math";
import type { MathSubscriber, VersionedMath } from "bpmatrixjs/Math";
import { GETID } from "../ID";
import Style from "../Style";
import type { StyleChange, StyleSubscriber } from "../Style";

/** push / updateAt 使用的完整快照；省略项分别为原点、0、单位缩放和默认样式。 */
export interface RawOptions {
    position?: Vec2;
    rotation?: number;
    scale?: Vec2;
    style?: Style;
    enabled?: boolean;
}

/** 原始值变化的影响范围，版本仍只有 Raw.version 一个。 */
export type RawChange = "matrix" | "style" | "texture" | "textureData" | "sampler";

/** 原始值管理者，不在回调内分配 GPU 资源。 */
export interface RawSubscriber {
    onRawChange(raw: Raw, change: RawChange): void;
}

/** 一条实例原始记录；id 稳定，index 对应连续数组中的槽位。 */
export class Raw implements MathSubscriber, StyleSubscriber {
    /** 全局唯一 ID，不随扩容改变。 */
    public readonly id: number = GETID();
    /** 连续数组槽位，不是字节偏移。 */
    public readonly index: number;
    private _position: Vec2;
    private _rotation: number;
    private _scale: Vec2;
    private _style: Style;
    private _enabled: boolean;
    private _version: number = 0;
    private readonly _subscribers = new Set<RawSubscriber>();
    private _disposed: boolean = false;

    /**
     * @param index 槽位
     * @param options 原始值，不复制 Vec2 / Style，允许共享并接收通知
     */
    public constructor(index: number, options: RawOptions = {}) {
        if (!Number.isSafeInteger(index) || index < 0) throw new RangeError("Invalid raw index.");
        this.index = index;
        this._position = options.position ?? new Vec2();
        this._rotation = options.rotation ?? 0;
        this._scale = options.scale ?? new Vec2(1, 1);
        this._style = options.style ?? new Style();
        this._enabled = options.enabled ?? true;
        if (!Number.isFinite(this._rotation)) throw new RangeError("Rotation must be finite.");
        this._position.add(this, "position");
        this._scale.add(this, "scale");
        this._style.add(this);
    }

    /** 任意原始值变化时递增；打包或扩容不会改变这个版本。 */
    public get version(): number { return this._version; }
    /** 相对于 IMesh 的位置。 */
    public get position(): Vec2 { return this._position; }
    /** @param value 位置引用，旧引用解除关联 */
    public set position(value: Vec2) {
        if (value === this._position) return;
        this.assertActive();
        this._position.delete(this, "position");
        this._position = value;
        value.add(this, "position");
        this.notify("matrix");
    }
    /** 局部旋转弧度。 */
    public get rotation(): number { return this._rotation; }
    /** @param value 有限弧度 */
    public set rotation(value: number) {
        if (!Number.isFinite(value)) throw new RangeError("Rotation must be finite.");
        if (value === this._rotation) return;
        this.assertActive();
        this._rotation = value;
        this.notify("matrix");
    }
    /** 局部缩放。 */
    public get scale(): Vec2 { return this._scale; }
    /** @param value 缩放引用 */
    public set scale(value: Vec2) {
        if (value === this._scale) return;
        this.assertActive();
        this._scale.delete(this, "scale");
        this._scale = value;
        value.add(this, "scale");
        this.notify("matrix");
    }
    /** 本条记录的独立样式，不覆盖共享 Geometry / Material.style。 */
    public get style(): Style { return this._style; }
    /** @param value 新样式引用 */
    public set style(value: Style) {
        if (value === this._style) return;
        this.assertActive();
        this._style.delete(this);
        this._style = value;
        value.add(this);
        this.notify("texture");
    }
    /** 是否绘制此槽位；关闭不删除记录或移动其他 index。 */
    public get enabled(): boolean { return this._enabled; }
    /** @param value 是否绘制 */
    public set enabled(value: boolean) {
        if (value === this._enabled) return;
        this.assertActive();
        this._enabled = value;
        this.notify("style");
    }
    /** @param subscriber 接收下一帧更新通知的管理者 */
    public add(subscriber: RawSubscriber): void { this.assertActive(); this._subscribers.add(subscriber); }
    /** @param subscriber 解除关联的管理者 */
    public delete(subscriber: RawSubscriber): void { this._subscribers.delete(subscriber); }
    /** @param source 数学对象 @param field 关联字段 */
    public onMathChange(source: VersionedMath, field: string): void {
        if ((field === "position" && source === this._position) || (field === "scale" && source === this._scale)) this.notify("matrix");
    }
    /** @param change 样式变化，图片像素变化不重打包数值 */
    public onStyleChange(change: StyleChange): void {
        if (change.source !== this._style) return;
        const field = change.field;
        this.notify(field === "texture" ? "texture" : field === "textureData" ? "textureData"
            : field === "addressModeU" || field === "addressModeV" ? "sampler" : "style");
    }
    /** 解绑原始对象；不销毁共享 Vec2、Style 或 Texture。 */
    public dispose(): void {
        this._position.delete(this, "position");
        this._scale.delete(this, "scale");
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }
    /** 防止已解绑的记录重新产生部分关联。 */
    private assertActive(): void {
        if (this._disposed) throw new Error("Disposed Raw cannot be reused.");
    }
    /** @param change 本次需要重新打包的区域 */
    private notify(change: RawChange): void {
        if (this._disposed) return;
        this._version++;
        for (const subscriber of this._subscribers) subscriber.onRawChange(this, change);
    }
}

/** 由 IMesh 持有的原始记录索引；外部使用 map.get(id) 后修改记录，不直接增删 Map。 */
class Raws {
    private readonly _map = new Map<number, Raw>();
    /** 只读 Map，避免外部删除记录后遗留订阅或数组空洞。 */
    public get map(): ReadonlyMap<number, Raw> { return this._map; }
    /** 记录数量，raw=false 时始终为 0。 */
    public get size(): number { return this._map.size; }
    /** @param raw 由 IMesh 创建的记录 @internal */
    public add(raw: Raw): void { this._map.set(raw.id, raw); }
    /** 由 IMesh.clear / dispose 调用，解除全部订阅。 @internal */
    public clear(): void {
        for (const raw of this._map.values()) raw.dispose();
        this._map.clear();
    }
}

export default Raws;
