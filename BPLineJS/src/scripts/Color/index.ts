/** 接收颜色变化的对象；字段标识允许同一对象的多个属性共用一个 Color。 */
export interface ColorSubscriber {
    onColorChange(color: Color, field: string): void;
}

/** 归一化 RGBA 颜色；所有修改入口都会在值实际变化后通知订阅者。 */
class Color {
    private readonly _data: number[] = [1, 1, 1, 1];
    private readonly _subscribers = new Map<ColorSubscriber, Set<string>>();

    /**
     * 创建颜色，默认不透明白色；数字十六进制按 RRGGBB 解释。
     * @param hex #RGB、#RGBA、#RRGGBB、#RRGGBBAA 或 0xRRGGBB
     */
    public constructor(hex: string | number = "#ffffff") {
        this.setHex(hex);
    }

    /** 获取红分量，范围 0 到 1。 */
    public get r(): number { return this._data[0]; }
    /**
     * 设置红分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     */
    public set r(value: number) {
        const data = [...this._data];
        data[0] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }

    /** 获取绿分量，范围 0 到 1。 */
    public get g(): number { return this._data[1]; }
    /**
     * 设置绿分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     */
    public set g(value: number) {
        const data = [...this._data];
        data[1] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }

    /** 获取蓝分量，范围 0 到 1。 */
    public get b(): number { return this._data[2]; }
    /**
     * 设置蓝分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     */
    public set b(value: number) {
        const data = [...this._data];
        data[2] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }

    /** 获取透明度分量，范围 0 到 1。 */
    public get a(): number { return this._data[3]; }
    /**
     * 设置透明度分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     */
    public set a(value: number) {
        const data = [...this._data];
        data[3] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }

    /**
     * 批量设置 RGB，保留当前 alpha，只通知一次。
     * @param r 红色，0 到 1
     * @param g 绿色，0 到 1
     * @param b 蓝色，0 到 1
     * @returns 当前颜色
     */
    public setRGB(r: number, g: number, b: number): this {
        return this.setRGBA(r, g, b, this.a);
    }

    /**
     * 批量设置 RGBA，验证成功后统一提交，只通知一次。
     * @param r 红色，0 到 1
     * @param g 绿色，0 到 1
     * @param b 蓝色，0 到 1
     * @param a 透明度，0 到 1
     * @returns 当前颜色
     */
    public setRGBA(r: number, g: number, b: number, a: number = 1): this {
        const values = [r, g, b, a];
        if (!values.every(Number.isFinite)) throw new RangeError("Color components must be finite.");
        const normalized = values.map((value: number): number => Math.min(1, Math.max(0, value)));
        if (normalized.every((value: number, index: number): boolean => value === this._data[index])) return this;
        this._data.splice(0, 4, ...normalized);
        for (const [subscriber, fields] of [...this._subscribers]) {
            for (const field of [...fields]) subscriber.onColorChange(this, field);
        }
        return this;
    }

    /**
     * 设置十六进制颜色；没有 alpha 的格式使用不透明值。
     * @param hex #RGB、#RGBA、#RRGGBB、#RRGGBBAA 或 0xRRGGBB
     * @returns 当前颜色
     */
    public setHex(hex: string | number): this {
        if (typeof hex === "number" && (!Number.isInteger(hex) || hex < 0 || hex > 0xffffff)) {
            throw new RangeError("Numeric hex colors must be between 0x000000 and 0xffffff.");
        }
        let text: string = typeof hex === "number" ? hex.toString(16).padStart(6, "0") : hex.replace(/^#/, "");
        if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) {
            throw new TypeError("Invalid hex color.");
        }
        if (text.length <= 4) text = text.replace(/./g, (digit: string): string => digit + digit);
        if (text.length === 6) text += "ff";
        return this.setRGBA(...[0, 2, 4, 6].map((offset: number): number => parseInt(text.slice(offset, offset + 2), 16) / 255) as [number, number, number, number]);
    }

    /**
     * 转为十六进制文本，不做额外颜色空间变换。
     * @param alpha 是否包含 alpha
     * @returns #rrggbb 或 #rrggbbaa
     */
    public toHex(alpha: boolean = false): string {
        return "#" + this._data.slice(0, alpha ? 4 : 3)
            .map((value: number): string => Math.round(value * 255).toString(16).padStart(2, "0")).join("");
    }

    /**
     * 将 RGBA 写入调用者数组，不暴露内部可变数据。
     * @param target 目标数组
     * @param offset 分量偏移，不是字节偏移
     * @returns 目标数组
     */
    public writeTo(target: Float32Array<ArrayBuffer>, offset: number = 0): Float32Array<ArrayBuffer> {
        target.set(this._data, offset);
        return target;
    }

    /**
     * 复制颜色数值，不共享订阅者。
     * @param color 来源颜色
     * @returns 当前颜色
     */
    public copy(color: Color): this { return this.setRGBA(color.r, color.g, color.b, color.a); }

    /** 创建没有订阅者的独立颜色副本。 */
    public clone(): Color { return new Color().copy(this); }

    /**
     * 登记订阅关系，同一对象的不同颜色字段分别计数。
     * @param subscriber 接收变化的对象
     * @param field 对象内的颜色字段名
     */
    public add(subscriber: ColorSubscriber, field: string = "color"): void {
        const fields = this._subscribers.get(subscriber) ?? new Set<string>();
        fields.add(field);
        this._subscribers.set(subscriber, fields);
    }

    /**
     * 解除单个字段订阅；省略字段时解除该对象全部订阅。
     * @param subscriber 接收变化的对象
     * @param field 要解除的颜色字段
     */
    public delete(subscriber: ColorSubscriber, field?: string): void {
        if (field === undefined) { this._subscribers.delete(subscriber); return; }
        const fields = this._subscribers.get(subscriber);
        fields?.delete(field);
        if (fields?.size === 0) this._subscribers.delete(subscriber);
    }
}
export default Color;
