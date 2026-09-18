import Color from "../Color";
import TexturedStyle from "./TexturedStyle";
import { NormalizeSize } from "./PartStyle";
import type { BorderAlign, PixelAligned } from "./types";
/** 实体面样式，SDF 边框属于此分区，不与 EdgeStyle 共用参数。 */
class SolidStyle extends TexturedStyle {
    private _borderColor: Color = new Color("#000000");
    /**
     * 创建关闭的实体面样式。
     * @example
     * const solidStyle = new SolidStyle();
     * @returns 创建的 SolidStyle 对象。
     */
    public constructor() {
        super("solid");
        this._borderColor.add(this, "borderColor");
    }
    /**
     * SDF 边框独立颜色。
     * @example
     * const value = solidStyle.borderColor;
     * @returns SDF 边框独立颜色。
     */
    public get borderColor(): Color {
        return this._borderColor;
    }
    /**
     * SDF 边框独立颜色。
     * @param value SDF 边框颜色引用
     * @example
     * solidStyle.borderColor = value;
     * @returns 无返回值。
     */
    public set borderColor(value: Color) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._borderColor !== value) {
            this._borderColor.delete(this, "borderColor");
            this._borderColor = value;
            value.add(this, "borderColor");
            this.notify("borderColor");
        } else {
            return;
        }
    }
    /**
     * 最终停止使用时解除 SDF 边框色与填充色的订阅。
     * @example
     * solidStyle.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._borderColor.delete(this, "borderColor");
        super.dispose();
    }
    /**
     * 校验字段仍引用当前颜色，忽略已替换颜色发出的过期通知。
     * @param color 来源颜色
     * @param field 颜色字段
     * @example
     * solidStyle.onColorChange(color, field);
     * @returns 无返回值。
     */
    public onColorChange(color: Color, field: string): void {
        // 根据变化字段选择更新范围，避免无关属性触发资源重建。
        if (field !== "borderColor" || color === this._borderColor) {
            super.onColorChange(color, field);
        } else {
            return;
        }
    }
    private _borderWidth: number = 0;
    /**
     * SDF 边框宽度，0 表示关闭 SDF 边框。
     * @example
     * const value = solidStyle.borderWidth;
     * @returns SDF 边框宽度，0 表示关闭 SDF 边框。
     */
    public get borderWidth(): number {
        return this._borderWidth;
    }
    /**
     * SDF 边框宽度，0 表示关闭 SDF 边框。
     * @param value SDF 边框宽度，0 表示关闭 SDF 边框。
     * @example
     * solidStyle.borderWidth = value;
     * @returns 无返回值。
     */
    public set borderWidth(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._borderWidth !== value) {
            this._borderWidth = value;
            this.notify("borderWidth");
        } else {
            return;
        }
    }
    private _borderAlign: BorderAlign = "normal";
    /**
     * 边框对齐：inset / normal / outset。
     * @example
     * const value = solidStyle.borderAlign;
     * @returns 边框对齐：inset / normal / outset。
     */
    public get borderAlign(): BorderAlign {
        return this._borderAlign;
    }
    /**
     * 边框对齐：inset / normal / outset。
     * @param value 边框对齐：inset / normal / outset。
     * @example
     * solidStyle.borderAlign = value;
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
    private _pixelAligned: PixelAligned = "px";
    /**
     * px 固定像素，zoom 随相机缩放。
     * @example
     * const value = solidStyle.pixelAligned;
     * @returns px 固定像素，zoom 随相机缩放。
     */
    public get pixelAligned(): PixelAligned {
        return this._pixelAligned;
    }
    /**
     * px 固定像素，zoom 随相机缩放。
     * @param value px 固定像素，zoom 随相机缩放。
     * @example
     * solidStyle.pixelAligned = value;
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
}
export default SolidStyle;
