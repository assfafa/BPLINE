import { NormalizeSize } from "./PartStyle";
import TexturedStyle from "./TexturedStyle";
import type { BorderAlign, PixelAligned } from "./types";

/** 有宽度的实体三角面边框样式。 */
class EdgeStyle extends TexturedStyle {
    /** 边框横向 UV 固定，避免跨越边框宽度重复贴图。 */
    protected override _addressModeV: GPUAddressMode = "clamp-to-edge";
    private _width: number = 1;
    private _borderAlign: BorderAlign = "normal";
    private _pixelAligned: PixelAligned = "px";
    private _uvRepeat: number = 1;
    /**
     * 创建关闭的实体边框，顺向重复、横向固定。
     * @example
     * const edgeStyle = new EdgeStyle();
     * @returns 创建的 EdgeStyle 对象。
     */
    public constructor() {
        super("edge");
    }
    /**
     * 复制边框宽度、对齐和贴图重复设置。
     * @param source 来源边框样式
     * @example
     * target.copy(source);
     * @returns 当前边框样式。
     */
    public override copy(source: EdgeStyle): this {
        super.copy(source);
        this.width = source.width;
        this.borderAlign = source.borderAlign;
        this.pixelAligned = source.pixelAligned;
        this.uvRepeat = source.uvRepeat;
        return this;
    }

    /**
     * 创建独立的边框样式。
     * @example
     * const duplicate = edgeStyle.clone();
     * @returns 新边框样式。
     */
    public override clone(): EdgeStyle {
        return new EdgeStyle().copy(this);
    }
    /**
     * 实体边框宽度，0 不生成边框。
     * @example
     * const value = edgeStyle.width;
     * @returns 实体边框宽度，0 不生成边框。
     */
    public get width(): number {
        return this._width;
    }
    /**
     * 实体边框宽度，0 不生成边框。
     * @param value 实体边框宽度，0 不生成边框。
     * @example
     * edgeStyle.width = value;
     * @returns 无返回值。
     */
    public set width(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._width !== value) {
            this._width = value;
            this.notify("width");
        } else {
            return;
        }
    }
    /**
     * 边框对齐：inset / normal / outset。
     * @example
     * const value = edgeStyle.borderAlign;
     * @returns 边框对齐：inset / normal / outset。
     */
    public get borderAlign(): BorderAlign {
        return this._borderAlign;
    }
    /**
     * 边框对齐：inset / normal / outset。
     * @param value 边框对齐：inset / normal / outset。
     * @example
     * edgeStyle.borderAlign = value;
     * @returns 无返回值。
     */
    public set borderAlign(value: BorderAlign) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["inset", "normal", "outset"].includes(value)) {
            throw new TypeError("Invalid border alignment.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._borderAlign !== value) {
            this._borderAlign = value;
            this.notify("borderAlign");
        } else {
            return;
        }
    }
    /**
     * px 固定像素，zoom 随相机缩放。
     * @example
     * const value = edgeStyle.pixelAligned;
     * @returns px 固定像素，zoom 随相机缩放。
     */
    public get pixelAligned(): PixelAligned {
        return this._pixelAligned;
    }
    /**
     * px 固定像素，zoom 随相机缩放。
     * @param value px 固定像素，zoom 随相机缩放。
     * @example
     * edgeStyle.pixelAligned = value;
     * @returns 无返回值。
     */
    public set pixelAligned(value: PixelAligned) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["px", "zoom"].includes(value)) {
            throw new TypeError("Invalid pixel alignment.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._pixelAligned !== value) {
            this._pixelAligned = value;
            this.notify("pixelAligned");
        } else {
            return;
        }
    }
    /**
     * 沿完整轮廓的 UV 重复次数。
     * @example
     * const value = edgeStyle.uvRepeat;
     * @returns 沿完整轮廓的 UV 重复次数。
     */
    public get uvRepeat(): number {
        return this._uvRepeat;
    }
    /**
     * 沿完整轮廓的 UV 重复次数。
     * @param value 沿完整轮廓的 UV 重复次数。
     * @example
     * edgeStyle.uvRepeat = value;
     * @returns 无返回值。
     */
    public set uvRepeat(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._uvRepeat !== value) {
            this._uvRepeat = value;
            this.notify("uvRepeat");
        } else {
            return;
        }
    }
}

export default EdgeStyle;
