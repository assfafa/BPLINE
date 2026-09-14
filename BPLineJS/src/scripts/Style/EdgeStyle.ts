import TexturedStyle from "./TexturedStyle";
import { NormalizeSize } from "./PartStyle";
import type { BorderAlign, PixelAligned } from "./types";

/** 有宽度的实体三角面边框样式。 */
class EdgeStyle extends TexturedStyle {
    /** 创建关闭的实体边框，顺向重复、横向固定。 */
    public constructor() {
        super("edge");
        this.addressModeV = "clamp-to-edge";
    }

    private _width: number = 1;
    /** 实体边框宽度，0 不生成边框。 */
    public get width(): number { return this._width; }
    /** @param value 实体边框宽度，0 不生成边框。 */
    public set width(value: number) {
        value = NormalizeSize(value);
        if (this._width === value) return;
        this._width = value;
        this.notify("width");
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


    private _uvRepeat: number = 1;
    /** 沿完整轮廓的 UV 重复次数。 */
    public get uvRepeat(): number { return this._uvRepeat; }
    /** @param value 沿完整轮廓的 UV 重复次数。 */
    public set uvRepeat(value: number) {
        value = NormalizeSize(value);
        if (this._uvRepeat === value) return;
        this._uvRepeat = value;
        this.notify("uvRepeat");
    }

}
export default EdgeStyle;
