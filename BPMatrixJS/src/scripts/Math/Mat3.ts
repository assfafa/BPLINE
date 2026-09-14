import { Vec2, type Vec2Like } from "./Vec2.js";
import Subscriptions, { type MathSubscriber } from "./Subscriptions.js";

type Mat3Data = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
];

interface Mat3Like {
    data: Readonly<Mat3Data>;
    readonly GPUData: Float32Array<ArrayBuffer>;
}

/**
 * 3x3矩阵
 * @class
 * @implements Mat3Like
 * @example
 * ```ts
 * const mat3 = new Mat3([1, 0, 0, 0, 1, 0, 0, 0, 1]);
 * ```
 */
class Mat3 implements Mat3Like {
    /**
     * 矩阵数组
     * 采用列主序:
     * [m00, m10, m20, m01, m11, m21, m02, m12, m22]
     */
    private _data: Mat3Data;
    private readonly _committedData: Mat3Data = CreateIdentityData();
    private _version: number = 0;
    private readonly _subscriptions = new Subscriptions();

    /** 当前矩阵版本，只读。 */
    public get version(): number { return this._version; }
    /** 列主序只读视图；整体赋值和 set 会同步 GPUData 并通知。 */
    public get data(): Readonly<Mat3Data> { return this._data; }
    /** @param value 新矩阵数组，复制数值而不持有外部数组 */
    public set data(value: Readonly<Mat3Data>) { this.set(value); }

    /** @param subscriber 消费者 @param field 关联字段 */
    public add(subscriber: MathSubscriber, field: string = "value"): this {
        this._subscriptions.add(subscriber, field);
        return this;
    }

    /** @param subscriber 消费者 @param field 省略时解绑全部字段 */
    public delete(subscriber: MathSubscriber, field?: string): void {
        this._subscriptions.delete(subscriber, field);
    }

    /** 提交原地数据变化；GPUData 同步完成后通知，数值未变时不递增版本。 */
    public updateVersion(): void { this.updateGPUData(); }

    /**
     * WebGPU uniform 使用的矩阵数组。
     * 每列补齐到 vec4，共 12 个 f32。
     */
    public readonly GPUData: Float32Array<ArrayBuffer>;

    /**
     * 创建3x3矩阵
     * @param data 矩阵数组
     */
    public constructor(data?: Readonly<Mat3Data>) {
        this._data = CreateIdentityData();
        this.GPUData = new Float32Array(12);

        if (data !== undefined) {
            this.set(data);

            return;
        }

        this.updateGPUData();
    }

    /**
     * 设置为单位矩阵
     * @returns 当前矩阵
     */
    public identity(): this {
        this._data[0] = 1;
        this._data[1] = 0;
        this._data[2] = 0;
        this._data[3] = 0;
        this._data[4] = 1;
        this._data[5] = 0;
        this._data[6] = 0;
        this._data[7] = 0;
        this._data[8] = 1;
        this.updateGPUData();

        return this;
    }

    /**
     * 设置矩阵数组
     * @param data 矩阵数组
     * @returns 当前矩阵
     */
    public set(data: Readonly<Mat3Data>): this {
        this._data[0] = data[0];
        this._data[1] = data[1];
        this._data[2] = data[2];
        this._data[3] = data[3];
        this._data[4] = data[4];
        this._data[5] = data[5];
        this._data[6] = data[6];
        this._data[7] = data[7];
        this._data[8] = data[8];
        this.updateGPUData();

        return this;
    }

    /**
     * 设置平移分量
     * @param vec2 平移向量
     * @returns 当前矩阵
     */
    public setTranslate(vec2: Readonly<Vec2Like>): this {
        this._data[6] = vec2.x;
        this._data[7] = vec2.y;
        this.updateGPUData();

        return this;
    }

    /**
     * 设置缩放分量
     * @param vec2 缩放向量
     * @returns 当前矩阵
     */
    public setScale(vec2: Readonly<Vec2Like>): this {
        const rotation = this.getRotation();
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        this._data[0] = cos * vec2.x;
        this._data[1] = sin * vec2.x;
        this._data[3] = -sin * vec2.y;
        this._data[4] = cos * vec2.y;
        this.updateGPUData();

        return this;
    }

    /**
     * 设置旋转分量
     * @param angle 弧度
     * @returns 当前矩阵
     */
    public setRotation(angle: number): this {
        const scale = this.getScale();
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        this._data[0] = cos * scale.x;
        this._data[1] = sin * scale.x;
        this._data[3] = -sin * scale.y;
        this._data[4] = cos * scale.y;
        this.updateGPUData();

        return this;
    }

    /**
     * 获取平移分量
     * @param vec2 输出向量
     * @returns 输出向量
     */
    public getTranslate(vec2: Vec2Like = new Vec2()): Vec2Like {
        if (vec2 instanceof Vec2) return vec2.set(this._data[6], this._data[7]);
        vec2.x = this._data[6];
        vec2.y = this._data[7];

        return vec2;
    }

    /**
     * 获取缩放分量
     * @param vec2 输出向量
     * @returns 输出向量
     */
    public getScale(vec2: Vec2Like = new Vec2()): Vec2Like {
        if (vec2 instanceof Vec2) return vec2.set(
            Math.hypot(this._data[0], this._data[1]),
            Math.hypot(this._data[3], this._data[4]),
        );
        vec2.x = Math.hypot(this._data[0], this._data[1]);
        vec2.y = Math.hypot(this._data[3], this._data[4]);

        return vec2;
    }

    /**
     * 获取旋转弧度
     * @returns 旋转弧度
     */
    public getRotation(): number {
        return Math.atan2(this._data[1], this._data[0]);
    }

    /**
     * 矩阵乘法
     * 传入标量时执行标量乘法
     * 传入一个矩阵时执行当前矩阵右乘目标矩阵
     * 传入两个矩阵时执行 a * b 并写回当前矩阵
     * @param value 标量或矩阵a
     * @param mat3 矩阵b
     * @returns 当前矩阵
     */
    public mul(value: number | Readonly<Mat3Like>, mat3?: Readonly<Mat3Like>): this {
        if (typeof value === "number") {
            this._data[0] *= value;
            this._data[1] *= value;
            this._data[2] *= value;
            this._data[3] *= value;
            this._data[4] *= value;
            this._data[5] *= value;
            this._data[6] *= value;
            this._data[7] *= value;
            this._data[8] *= value;
            this.updateGPUData();

            return this;
        }

        const left = mat3 === undefined ? this._data : value.data;
        const right = mat3 === undefined ? value.data : mat3.data;

        return this.multiplyData(left, right);
    }

    /**
     * 转置矩阵
     * @returns 当前矩阵
     */
    public transpose(): this {
        const m01 = this._data[3];
        const m02 = this._data[6];
        const m12 = this._data[7];

        this._data[3] = this._data[1];
        this._data[6] = this._data[2];
        this._data[7] = this._data[5];
        this._data[1] = m01;
        this._data[2] = m02;
        this._data[5] = m12;
        this.updateGPUData();

        return this;
    }

    /**
     * 求矩阵行列式
     * @returns 行列式
     */
    public det(): number {
        const a00 = this._data[0];
        const a10 = this._data[1];
        const a20 = this._data[2];
        const a01 = this._data[3];
        const a11 = this._data[4];
        const a21 = this._data[5];
        const a02 = this._data[6];
        const a12 = this._data[7];
        const a22 = this._data[8];

        return a00 * (a11 * a22 - a21 * a12)
            - a01 * (a10 * a22 - a20 * a12)
            + a02 * (a10 * a21 - a20 * a11);
    }

    /**
     * 求逆矩阵
     * 不可逆时保持原矩阵不变
     * @returns 当前矩阵
     */
    public invert(): this {
        const a00 = this._data[0];
        const a10 = this._data[1];
        const a20 = this._data[2];
        const a01 = this._data[3];
        const a11 = this._data[4];
        const a21 = this._data[5];
        const a02 = this._data[6];
        const a12 = this._data[7];
        const a22 = this._data[8];

        const b00 = a11 * a22 - a21 * a12;
        const b01 = -(a10 * a22 - a20 * a12);
        const b02 = a10 * a21 - a20 * a11;
        const b10 = -(a01 * a22 - a21 * a02);
        const b11 = a00 * a22 - a20 * a02;
        const b12 = -(a00 * a21 - a20 * a01);
        const b20 = a01 * a12 - a11 * a02;
        const b21 = -(a00 * a12 - a10 * a02);
        const b22 = a00 * a11 - a10 * a01;
        const determinant = a00 * b00 + a01 * b01 + a02 * b02;

        if (determinant === 0) {
            return this;
        }

        const inverseDeterminant = 1 / determinant;

        this._data[0] = b00 * inverseDeterminant;
        this._data[1] = b01 * inverseDeterminant;
        this._data[2] = b02 * inverseDeterminant;
        this._data[3] = b10 * inverseDeterminant;
        this._data[4] = b11 * inverseDeterminant;
        this._data[5] = b12 * inverseDeterminant;
        this._data[6] = b20 * inverseDeterminant;
        this._data[7] = b21 * inverseDeterminant;
        this._data[8] = b22 * inverseDeterminant;
        this.updateGPUData();

        return this;
    }

    /**
     * 复制目标矩阵
     * @param mat3 目标矩阵
     * @returns 当前矩阵
     */
    public copy(mat3: Readonly<Mat3Like>): this {
        return this.set(mat3.data);
    }

    /**
     * 克隆矩阵
     * @returns 新的矩阵实例
     */
    public clone(): Mat3 {
        return new Mat3(this._data);
    }

    /**
     * 判断矩阵是否完全相等
     * @param mat3 目标矩阵
     * @returns 是否相等
     */
    public equals(mat3: Readonly<Mat3Like>): boolean {
        return this._data[0] === mat3.data[0]
            && this._data[1] === mat3.data[1]
            && this._data[2] === mat3.data[2]
            && this._data[3] === mat3.data[3]
            && this._data[4] === mat3.data[4]
            && this._data[5] === mat3.data[5]
            && this._data[6] === mat3.data[6]
            && this._data[7] === mat3.data[7]
            && this._data[8] === mat3.data[8];
    }

    private multiplyData(left: Readonly<Mat3Data>, right: Readonly<Mat3Data>): this {
        const a00 = left[0];
        const a10 = left[1];
        const a20 = left[2];
        const a01 = left[3];
        const a11 = left[4];
        const a21 = left[5];
        const a02 = left[6];
        const a12 = left[7];
        const a22 = left[8];

        const b00 = right[0];
        const b10 = right[1];
        const b20 = right[2];
        const b01 = right[3];
        const b11 = right[4];
        const b21 = right[5];
        const b02 = right[6];
        const b12 = right[7];
        const b22 = right[8];

        this._data[0] = a00 * b00 + a01 * b10 + a02 * b20;
        this._data[1] = a10 * b00 + a11 * b10 + a12 * b20;
        this._data[2] = a20 * b00 + a21 * b10 + a22 * b20;
        this._data[3] = a00 * b01 + a01 * b11 + a02 * b21;
        this._data[4] = a10 * b01 + a11 * b11 + a12 * b21;
        this._data[5] = a20 * b01 + a21 * b11 + a22 * b21;
        this._data[6] = a00 * b02 + a01 * b12 + a02 * b22;
        this._data[7] = a10 * b02 + a11 * b12 + a12 * b22;
        this._data[8] = a20 * b02 + a21 * b12 + a22 * b22;
        this.updateGPUData();

        return this;
    }

    /**
     * 同步 WebGPU uniform 使用的 16 字节对齐矩阵数组。
     * 每 3 个矩阵分量后补 1 个 f32 占位。
     */
    private updateGPUData(): void {
        this.GPUData[0] = this._data[0];
        this.GPUData[1] = this._data[1];
        this.GPUData[2] = this._data[2];
        this.GPUData[3] = 0;
        this.GPUData[4] = this._data[3];
        this.GPUData[5] = this._data[4];
        this.GPUData[6] = this._data[5];
        this.GPUData[7] = 0;
        this.GPUData[8] = this._data[6];
        this.GPUData[9] = this._data[7];
        this.GPUData[10] = this._data[8];
        this.GPUData[11] = 0;
        if (this._data.some((value: number, index: number): boolean => !Object.is(value, this._committedData[index]))) {
            for (let index: number = 0; index < 9; index++) this._committedData[index] = this._data[index];
            this._version++;
            this._subscriptions.notify(this);
        }
    }
}

const CreateIdentityData = (): Mat3Data => {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
};

export { Mat3 };
export type { Mat3Data, Mat3Like };
export type { MathSubscriber, VersionedMath } from "./Subscriptions.js";
