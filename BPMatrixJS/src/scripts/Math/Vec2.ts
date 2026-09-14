import type { Mat3Like } from "./Mat3.js";
import Subscriptions, { type MathSubscriber } from "./Subscriptions.js";

/** 向量分量数组。 */
type Vec2Data = [number, number];

interface Vec2Like {
    x: number;
    y: number;
}

/**
 * 2D向量
 * @class
 * @implements Vec2Like
 * @description 2D向量类
 * @example
 * ```ts
 * const vec2 = new Vec2(x, y);
 * ```
 */
class Vec2 implements Vec2Like {
    /**
     * X分量
     */
    private _data: Vec2Data;
    private _version: number = 0;
    private readonly _subscriptions = new Subscriptions();

    /**
     * Y分量
     */
    /** 当前变化版本，只读。 */
    public get version(): number { return this._version; }
    /** 只读分量视图；整体赋值使用 data setter，分量使用 x/y。 */
    public get data(): Readonly<Vec2Data> { return this._data; }
    /** @param value 新分量数组，复制数值而不持有外部数组 */
    public set data(value: Readonly<Vec2Data>) { this.set(value[0], value[1]); }
    /** X 分量。 */
    public get x(): number { return this._data[0]; }
    /** @param value 新 X 分量 */
    public set x(value: number) { this.set(value, this.y); }
    /** Y 分量。 */
    public get y(): number { return this._data[1]; }
    /** @param value 新 Y 分量 */
    public set y(value: number) { this.set(this.x, value); }

    /** @param subscriber 消费者 @param field 省略时解绑其全部字段 */
    public delete(subscriber: MathSubscriber, field?: string): void {
        this._subscriptions.delete(subscriber, field);
    }

    /** 手动提交原地修改的底层数据；通常使用 x/y、set 或 data setter。 */
    public updateVersion(): void {
        this._version++;
        this._subscriptions.notify(this);
    }

    /**
     * 创建2D向量
     * @param x X分量
     * @param y Y分量
     */
    public constructor(x: number = 0, y: number = 0) {
        this._data = [x, y];
    }

    /**
     * 传 Vec2Like 执行加法；传 MathSubscriber 登记订阅，不修改分量。
     * @param value 目标向量或消费者
     * @param field 订阅关联字段，默认 value
     * @returns 当前向量
     */
    public add(vec2: Readonly<Vec2Like>): this;
    public add(subscriber: MathSubscriber, field?: string): this;
    public add(value: Readonly<Vec2Like> | MathSubscriber, field: string = "value"): this {
        if ("onMathChange" in value) {
            this._subscriptions.add(value, field);
            return this;
        }
        return this.set(this.x + value.x, this.y + value.y);
    }

    /**
     * 当前向量减去目标向量
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public sub(vec2: Readonly<Vec2Like>): this {
        return this.set(this.x - vec2.x, this.y - vec2.y);
    }

    /**
     * 当前向量按分量乘以目标向量
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public mul(vec2: Readonly<Vec2Like>): this {
        return this.set(this.x * vec2.x, this.y * vec2.y);
    }

    /**
     * 当前向量按分量除以目标向量
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public div(vec2: Readonly<Vec2Like>): this {
        return this.set(this.x / vec2.x, this.y / vec2.y);
    }

    /**
     * 计算与目标向量的点乘
     * @param vec2 目标向量
     * @returns 点乘结果
     */
    public dot(vec2: Readonly<Vec2Like>): number {
        return this.x * vec2.x + this.y * vec2.y;
    }

    /**
     * 计算与目标向量的叉乘
     * @param vec2 目标向量
     * @returns 叉乘结果
     */
    public crs(vec2: Readonly<Vec2Like>): number {
        return this.x * vec2.y - this.y * vec2.x;
    }

    /**
     * 计算与目标向量的距离
     * @param vec2 目标向量
     * @returns 距离
     */
    public dist(vec2: Readonly<Vec2Like>): number {
        return Math.sqrt(this.distSq(vec2));
    }

    /**
     * 计算与目标向量的距离平方
     * @param vec2 目标向量
     * @returns 距离平方
     */
    public distSq(vec2: Readonly<Vec2Like>): number {
        const dx = this.x - vec2.x;
        const dy = this.y - vec2.y;

        return dx * dx + dy * dy;
    }

    /**
     * 获取向量长度
     * @returns 向量长度
     */
    public len(): number {
        return Math.sqrt(this.lenSq());
    }

    /**
     * 获取向量长度平方
     * @returns 向量长度平方
     */
    public lenSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 将当前向量归一化
     * @returns 当前向量
     */
    public normal(): this {
        const length = this.len();

        if (length === 0) {
            return this;
        }

        return this.set(this.x / length, this.y / length);
    }

    /**
     * 复制目标向量的分量到当前向量
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public copy(vec2: Readonly<Vec2Like>): this {
        return this.set(vec2.x, vec2.y);
    }

    /**
     * 克隆当前向量
     * @returns 新的向量实例
     */
    public clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    /**
     * 设置向量分量
     * @param x X分量
     * @param y Y分量
     * @returns 当前向量
     */
    public set(x: number, y: number): this {
        if (Object.is(this.x, x) && Object.is(this.y, y)) return this;
        this._data[0] = x;
        this._data[1] = y;
        this.updateVersion();
        return this;
    }

    /**
     * 设置X分量
     * @param x X分量
     * @returns 当前向量
     */
    public setX(x: number): this {
        return this.set(x, this.y);
    }

    /**
     * 设置Y分量
     * @param y Y分量
     * @returns 当前向量
     */
    public setY(y: number): this {
        return this.set(this.x, y);
    }

    /**
     * 应用矩阵变换
     * @param mat3 目标矩阵
     * @returns 当前向量
     */
    public apply(mat3: Readonly<Mat3Like>): this {
        const x = this.x;
        const y = this.y;

        return this.set(
            mat3.data[0] * x + mat3.data[3] * y + mat3.data[6],
            mat3.data[1] * x + mat3.data[4] * y + mat3.data[7],
        );
    }

    /**
     * 按分量取较大值
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public max(vec2: Readonly<Vec2Like>): this {
        return this.set(Math.max(this.x, vec2.x), Math.max(this.y, vec2.y));
    }

    /**
     * 按分量取较小值
     * @param vec2 目标向量
     * @returns 当前向量
     */
    public min(vec2: Readonly<Vec2Like>): this {
        return this.set(Math.min(this.x, vec2.x), Math.min(this.y, vec2.y));
    }

    /**
     * 将当前向量限制在最小值和最大值之间
     * @param min 最小向量
     * @param max 最大向量
     * @returns 当前向量
     */
    public clamp(min: Readonly<Vec2Like>, max: Readonly<Vec2Like>): this {
        return this.set(Math.min(Math.max(this.x, min.x), max.x), Math.min(Math.max(this.y, min.y), max.y));
    }

    /**
     * 乘以标量
     * @param value 标量
     * @returns 当前向量
     */
    public scl(value: number): this {
        return this.set(this.x * value, this.y * value);
    }

    /**
     * 获取向量弧度
     * 传入目标向量时，返回与目标向量的夹角弧度
     * @param vec2 目标向量
     * @returns 弧度值
     */
    public angle(vec2?: Readonly<Vec2Like>): number {
        if (vec2 === undefined) {
            return Math.atan2(this.y, this.x);
        }

        return Math.atan2(this.crs(vec2), this.dot(vec2));
    }

    /**
     * 判断是否与目标向量完全相等
     * @param vec2 目标向量
     * @returns 是否相等
     */
    public equals(vec2: Readonly<Vec2Like>): boolean {
        return this.x === vec2.x && this.y === vec2.y;
    }
}

export { Vec2 };
export type { Vec2Data, Vec2Like };
export type { MathSubscriber, VersionedMath } from "./Subscriptions.js";
