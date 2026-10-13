import Style from "../../Style";

/**
 * 创建蓝色填充的绘制模板；每次调用均独立持有颜色及样式分区。
 * @example const style = CreateDrawingStyle();
 * @returns 仅启用 solid、填充色为 #5b90d8 的样式。
 */
const CreateDrawingStyle = (): Style => {
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#5b90d8");
    return style;
};

/**
 * 创建黄色边框与节点显示模板；矩形可额外显示边中点。
 * @param midpoints 是否启用边中点
 * @example const style = CreateSelectionStyle(true);
 * @returns 独立样式，边宽 3、关键点半径 4，颜色 #ffe66a。
 */
const CreateSelectionStyle = (midpoints: boolean): Style => {
    const style = new Style();
    style.edge.enabled = true;
    style.edge.width = 3;
    style.edge.color.setHex("#ffe66a");
    style.points.enabled = true;
    style.points.vertices = true;
    style.points.midpoints = midpoints;
    style.points.radius = 4;
    style.points.color.setHex("#ffe66a");
    return style;
};

export { CreateDrawingStyle, CreateSelectionStyle };
