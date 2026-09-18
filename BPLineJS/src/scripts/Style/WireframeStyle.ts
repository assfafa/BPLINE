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
}
export default WireframeStyle;
