import type { ColorSubscriber } from "../../Color";
import Color from "../../Color";

/** 五个颜色字段分别订阅 Color；替换引用或修改颜色分量都会通知网格。 */
class HelperGridCustomStyle implements ColorSubscriber {
    private _gridMinorColor: Color = new Color("#2e333d");
    private _gridMajorColor: Color = new Color("#4a5463");
    private _rulerMinorColor: Color = new Color("#929aa6");
    private _rulerMajorColor: Color = new Color("#c9d1de");
    private _rulerTextColor: Color = new Color("#c9d1de");
    private readonly _subscribers = new Set<HelperGridCustomStyleSubscriber>();
    private _batching: boolean = false;
    private _pendingChange: boolean = false;
    private _version: number = 0;

    /**
     * 创建网格与标尺自定义配色。
     * @param colors 可选的五个 Color 引用
     * @example
     * const colors = new HelperGridCustomStyle();
     * @returns 可订阅的配色对象。
     */
    public constructor(colors?: HelperGridCustomColors) {
        this._gridMinorColor.add(this, "gridMinorColor");
        this._gridMajorColor.add(this, "gridMajorColor");
        this._rulerMinorColor.add(this, "rulerMinorColor");
        this._rulerMajorColor.add(this, "rulerMajorColor");
        this._rulerTextColor.add(this, "rulerTextColor");
        // 初始覆盖沿用与运行时相同的引用绑定方式。
        if (colors !== undefined) {
            this.setColors(colors);
        }
    }

    /** @example const version = colors.version; @returns 配色变化版本。 */
    public get version(): number {
        return this._version;
    }

    /** @example colors.gridMinorColor.setHex("#333333"); @returns 次栅格颜色。 */
    public get gridMinorColor(): Color {
        return this._gridMinorColor;
    }

    /** @param value 新的次栅格 Color 引用 @example colors.gridMinorColor = new Color("#333333"); @returns 无返回值。 */
    public set gridMinorColor(value: Color) {
        this.replaceColor("gridMinorColor", value);
    }

    /** @example const color = colors.gridMajorColor; @returns 主栅格颜色。 */
    public get gridMajorColor(): Color {
        return this._gridMajorColor;
    }

    /** @param value 新的主栅格 Color 引用 @example colors.gridMajorColor = new Color("#777777"); @returns 无返回值。 */
    public set gridMajorColor(value: Color) {
        this.replaceColor("gridMajorColor", value);
    }

    /** @example const color = colors.rulerMinorColor; @returns 标尺次刻度颜色。 */
    public get rulerMinorColor(): Color {
        return this._rulerMinorColor;
    }

    /** @param value 新的标尺次刻度 Color 引用 @example colors.rulerMinorColor = new Color("#999999"); @returns 无返回值。 */
    public set rulerMinorColor(value: Color) {
        this.replaceColor("rulerMinorColor", value);
    }

    /** @example const color = colors.rulerMajorColor; @returns 标尺主刻度颜色。 */
    public get rulerMajorColor(): Color {
        return this._rulerMajorColor;
    }

    /** @param value 新的标尺主刻度 Color 引用 @example colors.rulerMajorColor = new Color("#ffffff"); @returns 无返回值。 */
    public set rulerMajorColor(value: Color) {
        this.replaceColor("rulerMajorColor", value);
    }

    /** @example const color = colors.rulerTextColor; @returns 标尺数字颜色。 */
    public get rulerTextColor(): Color {
        return this._rulerTextColor;
    }

    /** @param value 新的标尺数字 Color 引用 @example colors.rulerTextColor = new Color("#ffffff"); @returns 无返回值。 */
    public set rulerTextColor(value: Color) {
        this.replaceColor("rulerTextColor", value);
    }

    /**
     * 批量替换五个颜色引用，一次提交变更通知。
     * @param colors 新的配色引用
     * @example
     * style.setColors(colors);
     * @returns 当前配色对象。
     */
    public setColors(colors: HelperGridCustomColors): this {
        const gridMinorColor = colors.gridMinorColor;
        const gridMajorColor = colors.gridMajorColor;
        const rulerMinorColor = colors.rulerMinorColor;
        const rulerMajorColor = colors.rulerMajorColor;
        const rulerTextColor = colors.rulerTextColor;
        const valid = gridMinorColor instanceof Color && gridMajorColor instanceof Color &&
            rulerMinorColor instanceof Color && rulerMajorColor instanceof Color && rulerTextColor instanceof Color;
        // 先验证全部字段，避免错误对象造成部分颜色已换、材质仍用旧值。
        if (valid) {
            this._batching = true;
            try {
                this.gridMinorColor = gridMinorColor;
                this.gridMajorColor = gridMajorColor;
                this.rulerMinorColor = rulerMinorColor;
                this.rulerMajorColor = rulerMajorColor;
                this.rulerTextColor = rulerTextColor;
            } finally {
                this._batching = false;
                // 五个 setter 在批量期间只标记变化，结束后通知一次。
                if (this._pendingChange) {
                    this._pendingChange = false;
                    this.notify();
                }
            }
            return this;
        } else {
            throw new TypeError("HelperGrid custom colors must be Color objects.");
        }
    }

    /**
     * 绑定网格消费者。
     * @param subscriber 接收配色变化的对象
     * @example
     * style.add(grid);
     * @returns 无返回值。
     */
    public add(subscriber: HelperGridCustomStyleSubscriber): void {
        this._subscribers.add(subscriber);
    }

    /**
     * 解除网格消费者。
     * @param subscriber 原来绑定的对象
     * @example
     * style.delete(grid);
     * @returns 无返回值。
     */
    public delete(subscriber: HelperGridCustomStyleSubscriber): void {
        this._subscribers.delete(subscriber);
    }

    /**
     * 将 Color 的原地修改转为配色变化。
     * @param color 来源颜色
     * @param field 发生变化的字段
     * @example
     * style.onColorChange(color, "gridMinorColor");
     * @returns 无返回值。
     */
    public onColorChange(color: Color, field: string): void {
        const current = this.getColor(field);
        // 被替换的旧引用若发出延迟通知，不再触发 GPU 更新。
        if (current === color) {
            this.notify();
        }
    }

    /** @example style.dispose(); @returns 无返回值。 */
    public dispose(): void {
        // 本对象只解除自己的订阅，调用方持有的 Color 不会被销毁。
        this._gridMinorColor.delete(this, "gridMinorColor");
        this._gridMajorColor.delete(this, "gridMajorColor");
        this._rulerMinorColor.delete(this, "rulerMinorColor");
        this._rulerMajorColor.delete(this, "rulerMajorColor");
        this._rulerTextColor.delete(this, "rulerTextColor");
        this._subscribers.clear();
    }

    /**
     * 取得字段当前绑定的 Color。
     * @param field 配色字段名称
     * @example
     * const color = style.getColor("gridMinorColor");
     * @returns 已知字段的 Color，未知字段为 null。
     */
    private getColor(field: string): Color | null {
        // 五个公开字段分别映射到当前绑定的 Color 引用。
        if (field === "gridMinorColor") {
            return this._gridMinorColor;
        } else if (field === "gridMajorColor") {
            // 主栅格颜色与次栅格独立维护。
            return this._gridMajorColor;
        } else if (field === "rulerMinorColor") {
            // 次刻度允许与网格线使用不同颜色。
            return this._rulerMinorColor;
        } else if (field === "rulerMajorColor") {
            // 主刻度单独选择颜色。
            return this._rulerMajorColor;
        } else if (field === "rulerTextColor") {
            // 数字颜色不继承主刻度颜色。
            return this._rulerTextColor;
        } else {
            return null;
        }
    }

    /**
     * 更换一个 Color 字段并重绑订阅。
     * @param field 配色字段名称
     * @param value 新 Color 引用
     * @example
     * style.replaceColor("gridMinorColor", color);
     * @returns 无返回值。
     */
    private replaceColor(field: keyof HelperGridCustomColors, value: Color): void {
        // 拒绝不带订阅接口的值，避免后续颜色修改无法通知 GPU。
        if (!(value instanceof Color)) {
            throw new TypeError("HelperGrid custom colors must be Color objects.");
        }
        const previous = this.getColor(field);
        // 相同引用不会更改版本或重复登记订阅。
        if (previous !== value && previous !== null) {
            previous.delete(this, field);
            // 先替换当前引用，再登记订阅以过滤旧 Color 的通知。
            if (field === "gridMinorColor") {
                this._gridMinorColor = value;
            } else if (field === "gridMajorColor") {
                // 主栅格色保留独立绑定。
                this._gridMajorColor = value;
            } else if (field === "rulerMinorColor") {
                // 次刻度色保留独立绑定。
                this._rulerMinorColor = value;
            } else if (field === "rulerMajorColor") {
                // 主刻度色保留独立绑定。
                this._rulerMajorColor = value;
            } else {
                this._rulerTextColor = value;
            }
            value.add(this, field);
            this.notify();
        }
    }

    /** @example this.notify(); @returns 无返回值。 */
    private notify(): void {
        // 批量赋值只发送最终颜色，单个字段变化立即通知。
        if (this._batching) {
            this._pendingChange = true;
        } else {
            this._version++;
            // 快照允许订阅者在回调中增删绑定。
            for (const subscriber of [...this._subscribers]) {
                subscriber.onHelperGridCustomStyleChange(this);
            }
        }
    }
}

interface HelperGridCustomColors {
    gridMinorColor: Color;
    gridMajorColor: Color;
    rulerMinorColor: Color;
    rulerMajorColor: Color;
    rulerTextColor: Color;
}

interface HelperGridCustomStyleSubscriber {
    /**
     * 接收网格自定义配色变化。
     * @param style 发生变化的配色对象
     * @example
     * subscriber.onHelperGridCustomStyleChange(style);
     * @returns 无返回值。
     */
    onHelperGridCustomStyleChange(style: HelperGridCustomStyle): void;
}

export default HelperGridCustomStyle;
export type { HelperGridCustomColors, HelperGridCustomStyleSubscriber };
