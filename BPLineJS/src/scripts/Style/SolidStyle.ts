import Color from "../Color";
import TexturedStyle from "./TexturedStyle";
import { NormalizeSize } from "./PartStyle";
import type { BorderAlign, PixelAligned } from "./types";

/** 实体面样式，SDF 边框属于此分区，不与 EdgeStyle 共用参数。 */
class SolidStyle extends TexturedStyle {
    private _borderColor: Color = new Color("#000000");
    /** 创建关闭的实体面样式。 */
    public constructor() {
        super("solid");
        this._borderColor.add(this, "borderColor");
    }
    /** SDF 边框独立颜色。 */
    public get borderColor(): Color { return this._borderColor; }
    /** @param value SDF 边框颜色引用 */
    public set borderColor(value: Color) {
        if (this._borderColor === value) return;
        this._borderColor.delete(this, "borderColor");
        this._borderColor = value;
        value.add(this, "borderColor");
        this.notify("borderColor");
    }
    /** 最终停止使用时解除 SDF 边框色与填充色的订阅。 */
    public dispose(): void {
        this._borderColor.delete(this, "borderColor");
        super.dispose();
    }
    /**
     * 校验字段仍引用当前颜色，忽略已替换颜色发出的过期通知。
     * @param color 来源颜色
     * @param field 颜色字段
     */
    public onColorChange(color: Color, field: string): void {
        if (field === "borderColor" && color !== this._borderColor) return;
        super.onColorChange(color, field);
    }

    private _borderWidth: number = 0;
    /** SDF 边框宽度，0 表示关闭 SDF 边框。 */
    public get borderWidth(): number { return this._borderWidth; }
    /** @param value SDF 边框宽度，0 表示关闭 SDF 边框。 */
    public set borderWidth(value: number) {
        value = NormalizeSize(value);
        if (this._borderWidth === value) return;
        this._borderWidth = value;
        this.notify("borderWidth");
    }

    private _borderAlign: BorderAlign = "normal";
    /** 边框对齐：inset / normal / outset。 */
    public get borderAlign(): BorderAlign { return this._borderAlign; }
    /** @param value 边框对齐：inset / normal / outset。 */
    public set borderAlign(value: BorderAlign) {
        if (!["inset", "normal", "outset"].includes(value)) throw new TypeError("Invalid border alignment.");
        if (this._borderAlign === value) return;
        this._borderAlign = value;
        this.notify("borderAlign");
    }

    private _pixelAligned: PixelAligned = "px";
    /** px 固定像素，zoom 随相机缩放。 */
    public get pixelAligned(): PixelAligned { return this._pixelAligned; }
    /** @param value px 固定像素，zoom 随相机缩放。 */
    public set pixelAligned(value: PixelAligned) {
        if (!["px", "zoom"].includes(value)) throw new TypeError("Invalid pixel alignment.");
        if (this._pixelAligned === value) return;
        this._pixelAligned = value;
        this.notify("pixelAligned");
    }

}
export default SolidStyle;
