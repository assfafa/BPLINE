/** 接收颜色变化的对象；字段标识允许同一对象的多个属性共用一个 Color。 */
export interface ColorSubscriber {
    /**
     * 接收颜色变化通知，将更新转发给使用该颜色的样式。
     * @param color 变化来源颜色
     * @param field 发生变化的关联字段
     * @example
     * colorSubscriber.onColorChange(color, field);
     * @returns 无返回值。
     */
    onColorChange(color: Color, field: string): void;
}
/** 归一化 RGBA 颜色；所有修改入口都会在值实际变化后通知订阅者。 */
class Color {
    private readonly _data: number[] = [1, 1, 1, 1];
    private readonly _subscribers = new Map<ColorSubscriber, Set<string>>();
    /**
     * 创建颜色，默认不透明白色；数字十六进制按 RRGGBB 解释。
     * @param hex #RGB、#RGBA、#RRGGBB、#RRGGBBAA 或 0xRRGGBB
     * @example
     * const color = new Color(hex);
     * @returns 创建的 Color 对象。
     */
    public constructor(hex: string | number = "#ffffff") {
        this.setHex(hex);
    }
    /**
     * 获取红分量，范围 0 到 1。
     * @example
     * const value = color.r;
     * @returns 获取红分量，范围 0 到 1。
     */
    public get r(): number {
        return this._data[0];
    }
    /**
     * 设置红分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     * @example
     * color.r = value;
     * @returns 无返回值。
     */
    public set r(value: number) {
        const data = [...this._data];
        data[0] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }
    /**
     * 获取绿分量，范围 0 到 1。
     * @example
     * const value = color.g;
     * @returns 获取绿分量，范围 0 到 1。
     */
    public get g(): number {
        return this._data[1];
    }
    /**
     * 设置绿分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     * @example
     * color.g = value;
     * @returns 无返回值。
     */
    public set g(value: number) {
        const data = [...this._data];
        data[1] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }
    /**
     * 获取蓝分量，范围 0 到 1。
     * @example
     * const value = color.b;
     * @returns 获取蓝分量，范围 0 到 1。
     */
    public get b(): number {
        return this._data[2];
    }
    /**
     * 设置蓝分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     * @example
     * color.b = value;
     * @returns 无返回值。
     */
    public set b(value: number) {
        const data = [...this._data];
        data[2] = value;
        this.setRGBA(data[0], data[1], data[2], data[3]);
    }
    /**
     * 获取透明度分量，范围 0 到 1。
     * @example
     * const value = color.a;
     * @returns 获取透明度分量，范围 0 到 1。
     */
    public get a(): number {
        return this._data[3];
    }
    /**
     * 设置透明度分量，有限值会钳制到 0 到 1。
     * @param value 归一化分量
     * @example
     * color.a = value;
     * @returns 无返回值。
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
     * @example
     * color.setRGB(r, g, b);
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
     * @example
     * color.setRGBA(r, g, b, a);
     * @returns 当前颜色
     */
    public setRGBA(r: number, g: number, b: number, a: number = 1): this {
        const values = [r, g, b, a];
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!values.every(Number.isFinite)) {
            throw new RangeError("Color components must be finite.");
        }
        /**
         * 将颜色分量钳制到零到一，保持打包颜色范围一致。
         * @param value 本次输入值
         * @example
         * ClampColorComponent(value);
         * @returns 钳制后的颜色分量。
         */
        const ClampColorComponent = (value: number): number => Math.min(1, Math.max(0, value));
        const normalized = values.map(ClampColorComponent);
        /**
         * 比较归一化颜色与当前分量，避免相同颜色重复通知。
         * @param value 本次输入值
         * @param index 从零开始的记录或顶点下标
         * @example
         * HasSameColorComponent(value, index);
         * @returns 该颜色分量是否未改变。
         */
        const HasSameColorComponent = (value: number, index: number): boolean => value === this._data[index];
        const unchanged: boolean = normalized.every(HasSameColorComponent);
        // 比较归一化后的分量，只有实际变化才通知消费者。
        if (unchanged === false) {
            this._data.splice(0, 4, ...normalized);
            // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
            for (const [subscriber, fields] of [...this._subscribers]) {
                // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
                for (const field of [...fields]) {
                    subscriber.onColorChange(this, field);
                }
            }
        }
        return this;
    }
    /**
     * 设置十六进制颜色；没有 alpha 的格式使用不透明值。
     * @param hex #RGB、#RGBA、#RRGGBB、#RRGGBBAA 或 0xRRGGBB
     * @example
     * color.setHex(hex);
     * @returns 当前颜色
     */
    public setHex(hex: string | number): this {
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof hex === "number" && (!Number.isInteger(hex) || hex < 0 || hex > 0xffffff)) {
            throw new RangeError("Numeric hex colors must be between 0x000000 and 0xffffff.");
        }
        let text: string;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof hex === "number") {
            text = hex.toString(16).padStart(6, "0");
        } else {
            text = hex.replace(/^#/, "");
        }
        // 按输入格式选择解析方式，避免不同文本格式混用。
        if (!/^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) {
            throw new TypeError("Invalid hex color.");
        }
        // 将短格式 #RGB/#RGBA 展开为每个分量两位的标准格式。
        if (text.length <= 4) {
            /**
             * 将短格式颜色的一位分量展开为重复的两位。
             * @param digit 短格式颜色中的单个十六进制位
             * @example
             * ExpandHexDigit(digit);
             * @returns 两位十六进制分量文本。
             */
            const ExpandHexDigit = (digit: string): string => digit + digit;
            text = text.replace(/./g, ExpandHexDigit);
        }
        // 未提供 alpha 的六位颜色补为完全不透明。
        if (text.length === 6) {
            text += "ff";
        }
        /**
         * 读取两位十六进制分量并归一化到零到一。
         * @param offset 目标数组中的写入偏移
         * @example
         * ParseHexComponent(offset);
         * @returns 归一化颜色分量。
         */
        const ParseHexComponent = (offset: number): number =>
            parseInt(text.slice(offset, offset + 2), 16) / 255;
        return this.setRGBA(...([0, 2, 4, 6].map(ParseHexComponent) as [number, number, number, number]));
    }
    /**
     * 转为十六进制文本，不做额外颜色空间变换。
     * @param alpha 是否包含 alpha
     * @example
     * color.toHex(alpha);
     * @returns #rrggbb 或 #rrggbbaa
     */
    public toHex(alpha: boolean = false): string {
        let channelCount: number = 3;
        // 调用者要求 alpha 时输出四个通道，否则只输出 RGB。
        if (alpha) {
            channelCount = 4;
        }
        /**
         * 将归一化分量编码为补齐两位的十六进制文本。
         * @param value 本次输入值
         * @example
         * FormatHexComponent(value);
         * @returns 两位十六进制分量文本。
         */
        const FormatHexComponent = (value: number): string =>
            Math.round(value * 255)
                .toString(16)
                .padStart(2, "0");
        return "#" + this._data.slice(0, channelCount).map(FormatHexComponent).join("");
    }
    /**
     * 将 RGBA 写入调用者数组，不暴露内部可变数据。
     * @param target 目标数组
     * @param offset 分量偏移，不是字节偏移
     * @example
     * color.writeTo(target, offset);
     * @returns 目标数组
     */
    public writeTo(target: Float32Array<ArrayBuffer>, offset: number = 0): Float32Array<ArrayBuffer> {
        target.set(this._data, offset);
        return target;
    }
    /**
     * 复制颜色数值，不共享订阅者。
     * @param color 来源颜色
     * @example
     * color.copy(color);
     * @returns 当前颜色
     */
    public copy(color: Color): this {
        return this.setRGBA(color.r, color.g, color.b, color.a);
    }
    /**
     * 创建没有订阅者的独立颜色副本。
     * @example
     * color.clone();
     * @returns 计算得到的 Color 结果。
     */
    public clone(): Color {
        return new Color().copy(this);
    }
    /**
     * 登记订阅关系，同一对象的不同颜色字段分别计数。
     * @param subscriber 接收变化的对象
     * @param field 对象内的颜色字段名
     * @example
     * color.add(subscriber, field);
     * @returns 无返回值。
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
     * @example
     * color.delete(subscriber, field);
     * @returns 无返回值。
     */
    public delete(subscriber: ColorSubscriber, field?: string): void {
        // 根据变化字段选择更新范围，避免无关属性触发资源重建。
        if (field === undefined) {
            this._subscribers.delete(subscriber);
            return;
        } else {
            const fields = this._subscribers.get(subscriber);
            fields?.delete(field);
            // 区分空数据和有效内容，空集合不创建可绘制资源。
            if (fields?.size === 0) {
                this._subscribers.delete(subscriber);
            }
        }
    }
}
export default Color;
