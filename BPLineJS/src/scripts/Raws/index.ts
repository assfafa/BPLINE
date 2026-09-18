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
    /**
     * 接收原始实例记录变化，更新该记录对应的连续数组。
     * @param raw 变化来源的实例原始记录
     * @param change 变化来源、区域及字段信息
     * @example
     * rawSubscriber.onRawChange(raw, change);
     * @returns 无返回值。
     */
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
     * 创建对象并建立初始状态及依赖关联。
     * @param index 槽位
     * @param options 原始值，不复制 Vec2 / Style，允许共享并接收通知
     * @example
     * const raw = new Raw(index, options);
     * @returns 创建的 Raw 对象。
     */
    public constructor(index: number, options: RawOptions = {}) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isSafeInteger(index) || index < 0) {
            throw new RangeError("Invalid raw index.");
        }
        this.index = index;
        this._position = options.position ?? new Vec2();
        this._rotation = options.rotation ?? 0;
        this._scale = options.scale ?? new Vec2(1, 1);
        this._style = options.style ?? new Style();
        this._enabled = options.enabled ?? true;
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(this._rotation)) {
            throw new RangeError("Rotation must be finite.");
        }
        this._position.add(this, "position");
        this._scale.add(this, "scale");
        this._style.add(this);
    }
    /**
     * 任意原始值变化时递增；打包或扩容不会改变这个版本。
     * @example
     * const value = raw.version;
     * @returns 任意原始值变化时递增；打包或扩容不会改变这个版本。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 相对于 IMesh 的位置。
     * @example
     * const value = raw.position;
     * @returns 相对于 IMesh 的位置。
     */
    public get position(): Vec2 {
        return this._position;
    }
    /**
     * 相对于 IMesh 的位置。
     * @param value 位置引用，旧引用解除关联
     * @example
     * raw.position = value;
     * @returns 无返回值。
     */
    public set position(value: Vec2) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (value !== this._position) {
            this.assertActive();
            this._position.delete(this, "position");
            this._position = value;
            value.add(this, "position");
            this.notify("matrix");
        } else {
            return;
        }
    }
    /**
     * 局部旋转弧度。
     * @example
     * const value = raw.rotation;
     * @returns 局部旋转弧度。
     */
    public get rotation(): number {
        return this._rotation;
    }
    /**
     * 局部旋转弧度。
     * @param value 有限弧度
     * @example
     * raw.rotation = value;
     * @returns 无返回值。
     */
    public set rotation(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(value)) {
            throw new RangeError("Rotation must be finite.");
        }
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (value !== this._rotation) {
            this.assertActive();
            this._rotation = value;
            this.notify("matrix");
        } else {
            return;
        }
    }
    /**
     * 局部缩放。
     * @example
     * const value = raw.scale;
     * @returns 局部缩放。
     */
    public get scale(): Vec2 {
        return this._scale;
    }
    /**
     * 局部缩放。
     * @param value 缩放引用
     * @example
     * raw.scale = value;
     * @returns 无返回值。
     */
    public set scale(value: Vec2) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (value !== this._scale) {
            this.assertActive();
            this._scale.delete(this, "scale");
            this._scale = value;
            value.add(this, "scale");
            this.notify("matrix");
        } else {
            return;
        }
    }
    /**
     * 本条记录的独立样式，不覆盖共享 Geometry / Material.style。
     * @example
     * const value = raw.style;
     * @returns 本条记录的独立样式，不覆盖共享 Geometry / Material.style。
     */
    public get style(): Style {
        return this._style;
    }
    /**
     * 本条记录的独立样式，不覆盖共享 Geometry / Material.style。
     * @param value 新样式引用
     * @example
     * raw.style = value;
     * @returns 无返回值。
     */
    public set style(value: Style) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (value !== this._style) {
            this.assertActive();
            this._style.delete(this);
            this._style = value;
            value.add(this);
            this.notify("texture");
        } else {
            return;
        }
    }
    /**
     * 是否绘制此槽位；关闭不删除记录或移动其他 index。
     * @example
     * const value = raw.enabled;
     * @returns 是否绘制此槽位；关闭不删除记录或移动其他 index。
     */
    public get enabled(): boolean {
        return this._enabled;
    }
    /**
     * 是否绘制此槽位；关闭不删除记录或移动其他 index。
     * @param value 是否绘制
     * @example
     * raw.enabled = value;
     * @returns 无返回值。
     */
    public set enabled(value: boolean) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (value !== this._enabled) {
            this.assertActive();
            this._enabled = value;
            this.notify("style");
        } else {
            return;
        }
    }
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param subscriber 接收下一帧更新通知的管理者
     * @example
     * raw.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: RawSubscriber): void {
        this.assertActive();
        this._subscribers.add(subscriber);
    }
    /**
     * 解除消费者关联，不销毁被共享的对象。
     * @param subscriber 解除关联的管理者
     * @example
     * raw.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: RawSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 接收数学对象的变化通知，更新对应字段的消费者版本。
     * @param source 数学对象
     * @param field 关联字段
     * @example
     * raw.onMathChange(source, field);
     * @returns 无返回值。
     */
    public onMathChange(source: VersionedMath, field: string): void {
        // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
        if (
            (field === "position" && source === this._position) ||
            (field === "scale" && source === this._scale)
        ) {
            this.notify("matrix");
        }
    }
    /**
     * 接收共享样式的字段变化，通知当前对象的使用者。
     * @param change 样式变化，图片像素变化不重打包数值
     * @example
     * raw.onStyleChange(change);
     * @returns 无返回值。
     */
    public onStyleChange(change: StyleChange): void {
        // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
        if (change.source === this._style) {
            const field = change.field;
            // 根据变化字段选择更新范围，避免无关属性触发资源重建。
            if (field === "texture") {
                this.notify("texture");
            } else if (field === "textureData") {
                // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                this.notify("textureData");
            } else if (field === "addressModeU" || field === "addressModeV") {
                // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                this.notify("sampler");
            } else {
                this.notify("style");
            }
        } else {
            return;
        }
    }
    /**
     * 解绑原始对象；不销毁共享 Vec2、Style 或 Texture。
     * @example
     * raw.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._position.delete(this, "position");
        this._scale.delete(this, "scale");
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }
    /**
     * 防止已解绑的记录重新产生部分关联。
     * @example
     * this.assertActive();
     * @returns 无返回值。
     */
    private assertActive(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed Raw cannot be reused.");
        }
    }
    /**
     * 向当前订阅者发送变化通知，由接收方安排后续更新。
     * @param change 本次需要重新打包的区域
     * @example
     * this.notify(change);
     * @returns 无返回值。
     */
    private notify(change: RawChange): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed) {
            this._version++;
            // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
            for (const subscriber of this._subscribers) {
                subscriber.onRawChange(this, change);
            }
        } else {
            return;
        }
    }
}
/** 由 IMesh 持有的原始记录索引；外部使用 map.get(id) 后修改记录，不直接增删 Map。 */
class Raws {
    private readonly _map = new Map<number, Raw>();
    /**
     * 只读 Map，避免外部删除记录后遗留订阅或数组空洞。
     * @example
     * const value = raws.map;
     * @returns 只读 Map，避免外部删除记录后遗留订阅或数组空洞。
     */
    public get map(): ReadonlyMap<number, Raw> {
        return this._map;
    }
    /**
     * 记录数量，raw=false 时始终为 0。
     * @example
     * const value = raws.size;
     * @returns 记录数量，raw=false 时始终为 0。
     */
    public get size(): number {
        return this._map.size;
    }
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param raw 由 IMesh 创建的记录
     * @internal
     * @example
     * raws.add(raw);
     * @returns 无返回值。
     */
    public add(raw: Raw): void {
        this._map.set(raw.id, raw);
    }
    /**
     * 由 IMesh.clear / dispose 调用，解除全部订阅。
     * @internal
     * @example
     * raws.clear();
     * @returns 无返回值。
     */
    public clear(): void {
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const raw of this._map.values()) {
            raw.dispose();
        }
        this._map.clear();
    }
}
export default Raws;
