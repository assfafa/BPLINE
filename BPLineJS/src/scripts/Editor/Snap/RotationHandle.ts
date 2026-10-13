import Base2D from "../../Geometry/Base2D";
import BaseMaterial from "../../Material/baseMaterial";
import Mesh from "../../Mesh";
import Style from "../../Style";

/**
 * 建立连接线与环形箭头图标；局部单位是屏幕 CSS 像素。
 * @example
 * const handle = CreateRotationHandle();
 * @returns 不参与场景拾取的辅助 Mesh。
 */
const CreateRotationHandle = (): Mesh => {
    const vertices: number[] = [
        -1, 0, 1, 0, 1, 18,
        -1, 0, 1, 18, -1, 18,
    ];
    const centerY = 24;
    const outerRadius = 7;
    const innerRadius = 4.5;
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const segments = 24;
    // 缺口环带与末端箭头明确区分旋转和普通尺寸控制点。
    for (let segment = 0; segment < segments; segment++) {
        const first = startAngle + (endAngle - startAngle) * segment / segments;
        const second = startAngle + (endAngle - startAngle) * (segment + 1) / segments;
        vertices.push(
            Math.cos(first) * innerRadius, centerY + Math.sin(first) * innerRadius,
            Math.cos(first) * outerRadius, centerY + Math.sin(first) * outerRadius,
            Math.cos(second) * outerRadius, centerY + Math.sin(second) * outerRadius,
            Math.cos(first) * innerRadius, centerY + Math.sin(first) * innerRadius,
            Math.cos(second) * outerRadius, centerY + Math.sin(second) * outerRadius,
            Math.cos(second) * innerRadius, centerY + Math.sin(second) * innerRadius,
        );
    }
    const endX = Math.cos(endAngle) * (innerRadius + outerRadius) * 0.5;
    const endY = centerY + Math.sin(endAngle) * (innerRadius + outerRadius) * 0.5;
    const tangentX = -Math.sin(endAngle);
    const tangentY = Math.cos(endAngle);
    vertices.push(
        endX + tangentX * 4, endY + tangentY * 4,
        endX - tangentY * 4, endY + tangentX * 4,
        endX + tangentY * 4, endY - tangentX * 4,
    );
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#ffe66a");
    const material = new BaseMaterial(style);
    // 屏幕基向量可能与世界坐标反向，箭头两面都应显示。
    material.cullMode = "none";
    const handle = new Mesh(new Base2D({ vertices: new Float32Array(vertices), style }), material, style);
    handle.noSelect = true;
    handle.order = 1000002;
    return handle;
};

export { CreateRotationHandle };
