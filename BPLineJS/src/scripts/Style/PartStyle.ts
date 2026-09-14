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
     */
    public constructor(area: Exclude<StyleArea, "whole">) {
        this.area = area;
        this._color.add(this, "color");
    }
    /** 是否生成并显示该分区，默认关闭。 */
    public get enabled(): boolean { return this._enabled; }
    /** @param value 是否启用该分区 */
    public set enabled(value: boolean) {
        if (this._enabled === value) return;
        this._enabled = value;
        this.notify("enabled");
    }
    /** 该分区独立颜色，默认不透明白色。 */
    public get color(): Color { return this._color; }
    /** @param value 新颜色引用；先解绑旧颜色，再订阅新颜色 */
    public set color(value: Color) {
        if (this._color === value) return;
        this._color.delete(this, "color");
        this._color = value;
        value.add(this, "color");
        this.notify("color");
    }
    /** 该分区独立透明度，作用于最终输出 alpha。 */
    public get opacity(): number { return this._opacity; }
    /** @param value 透明度，钳制到 0 到 1 */
    public set opacity(value: number) {
        value = NormalizeSize(value);
        value = Math.min(1, value);
        if (this._opacity === value) return;
        this._opacity = value;
        this.notify("opacity");
    }
    /** @param subscriber 分区变化接收者 */
    public add(subscriber: PartSubscriber): void { this._subscribers.add(subscriber); }
    /** @param subscriber 要解除的接收者；不销毁对象或 GPU 缓存 */
    public delete(subscriber: PartSubscriber): void { this._subscribers.delete(subscriber); }
    /** 最终停止使用时解除颜色订阅及分区订阅；不销毁共享 Color。 */
    public dispose(): void {
        this._color.delete(this, "color");
        this._subscribers.clear();
    }
    /**
     * 接收颜色的字段级通知。
     * @param color 来源颜色
     * @param field 颜色属性名
     */
    public onColorChange(color: Color, field: string): void {
        if (field === "color" && color !== this._color) return;
        this.notify(field);
    }
    /** @param field 实际变化的字段名 */
    protected notify(field: string): void {
        for (const subscriber of [...this._subscribers]) subscriber.onPartChange(this.area, field);
    }
}
/**
 * 验证尺寸参数并钳制负值；拒绝非有限值，避免污染几何和 GPU 数据。
 * @param value 待验证数值
 * @returns 非负有限值
 */
export const NormalizeSize = (value: number): number => {
    if (!Number.isFinite(value)) throw new RangeError("Style values must be finite.");
    return Math.max(0, value);
};
export default PartStyle;
