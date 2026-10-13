import PartStyle from "./PartStyle";

/** 原生 line-list 样式，仅有独立开关、颜色和透明度，不提供无效的线宽选项。 */
class WireframeStyle extends PartStyle {
    /**
     * 创建默认关闭的原生线框。
     * @example
     * const wireframeStyle = new WireframeStyle();
     * @returns 创建的 WireframeStyle 对象。
     */
    public constructor() {
        super("wireframe");
    }
    /**
     * 复制线框开关、颜色与透明度。
     * @param source 来源线框样式
     * @example
     * target.copy(source);
     * @returns 当前线框样式。
     */
    public override copy(source: WireframeStyle): this {
        super.copy(source);
        return this;
    }

    /**
     * 创建独立的线框样式。
     * @example
     * const duplicate = wireframeStyle.clone();
     * @returns 新线框样式。
     */
    public override clone(): WireframeStyle {
        return new WireframeStyle().copy(this);
    }
}

export default WireframeStyle;
