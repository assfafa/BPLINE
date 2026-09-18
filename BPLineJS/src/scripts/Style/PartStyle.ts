import Color from "../Color";
import type { ColorSubscriber } from "../Color";
import type { PartSubscriber, StyleArea } from "./types";
/** 四个样式分区的共同基础，仅管理显示、颜色、透明度和订阅。 */
class PartStyle implements ColorSubscriber {
    /** 分区身份。 */
    public readonly area: Exclude<StyleArea, "whole">;
    private readonly _subscribers = new Set<PartSubscriber>();
    private _enabled: boolean = false;
    private _color: Color = new Color();
    private _opacity: number = 1;
    /**
     * 创建分区并订阅默认颜色。
     * @param area 分区身份
     * @example
     * const partStyle = new PartStyle(area);
     * @returns 创建的 PartStyle 对象。
     */
    public constructor(area: Exclude<StyleArea, "whole">) {
        this.area = area;
        this._color.add(this, "color");
    }
    /**
     * 是否生成并显示该分区，默认关闭。
     * @example
     * const value = partStyle.enabled;
     * @returns 是否生成并显示该分区，默认关闭。
     */
    public get enabled(): boolean {
        return this._enabled;
    }
    /**
     * 是否生成并显示该分区，默认关闭。
     * @param value 是否启用该分区
     * @example
     * partStyle.enabled = value;
     * @returns 无返回值。
     */
    public set enabled(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._enabled !== value) {
            this._enabled = value;
            this.notify("enabled");
        } else {
            return;
        }
    }
    /**
     * 该分区独立颜色，默认不透明白色。
     * @example
     * const value = partStyle.color;
     * @returns 该分区独立颜色，默认不透明白色。
     */
    public get color(): Color {
        return this._color;
    }
    /**
     * 该分区独立颜色，默认不透明白色。
     * @param value 新颜色引用；先解绑旧颜色，再订阅新颜色
     * @example
     * partStyle.color = value;
     * @returns 无返回值。
     */
    public set color(value: Color) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._color !== value) {
            this._color.delete(this, "color");
            this._color = value;
            value.add(this, "color");
            this.notify("color");
        } else {
            return;
        }
    }
    /**
     * 该分区独立透明度，作用于最终输出 alpha。
     * @example
     * const value = partStyle.opacity;
     * @returns 该分区独立透明度，作用于最终输出 alpha。
     */
    public get opacity(): number {
        return this._opacity;
    }
    /**
     * 该分区独立透明度，作用于最终输出 alpha。
     * @param value 透明度，钳制到 0 到 1
     * @example
     * partStyle.opacity = value;
     * @returns 无返回值。
     */
    public set opacity(value: number) {
        value = NormalizeSize(value);
        value = Math.min(1, value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._opacity !== value) {
            this._opacity = value;
            this.notify("opacity");
        } else {
            return;
        }
    }
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param subscriber 分区变化接收者
     * @example
     * partStyle.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: PartSubscriber): void {
        this._subscribers.add(subscriber);
    }
    /**
     * 解除消费者关联，不销毁被共享的对象。
     * @param subscriber 要解除的接收者；不销毁对象或 GPU 缓存
     * @example
     * partStyle.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: PartSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 最终停止使用时解除颜色订阅及分区订阅；不销毁共享 Color。
     * @example
     * partStyle.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._color.delete(this, "color");
        this._subscribers.clear();
    }
    /**
     * 接收颜色的字段级通知。
     * @param color 来源颜色
     * @param field 颜色属性名
     * @example
     * partStyle.onColorChange(color, field);
     * @returns 无返回值。
     */
    public onColorChange(color: Color, field: string): void {
        // 根据变化字段选择更新范围，避免无关属性触发资源重建。
        if (field !== "color" || color === this._color) {
            this.notify(field);
        } else {
            return;
        }
    }
    /**
     * 向当前订阅者发送变化通知，由接收方安排后续更新。
     * @param field 实际变化的字段名
     * @example
     * this.notify(field);
     * @returns 无返回值。
     */
    protected notify(field: string): void {
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onPartChange(this.area, field);
        }
    }
}
/**
 * 验证尺寸参数并钳制负值；拒绝非有限值，避免污染几何和 GPU 数据。
 * @param value 待验证数值
 * @example
 * NormalizeSize(value);
 * @returns 非负有限值
 */
export const NormalizeSize = (value: number): number => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isFinite(value)) {
        throw new RangeError("Style values must be finite.");
    }
    return Math.max(0, value);
};
export default PartStyle;
