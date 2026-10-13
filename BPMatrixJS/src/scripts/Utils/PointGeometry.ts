import { Vec2 } from "../Math/Vec2.js";
import type { Point2D } from "./PlanarGeometry.js";

/** 闭合单轮廓的射线填充判定规则。 */
type PolygonFillRule = "nonzero" | "evenodd";

/** @param matrix 列主序三阶仿射矩阵 @param point 局部点 @example const world = TransformPoint2D(matrix, point); @returns 使用双精度系数计算的世界点。 */
const TransformPoint2D = (matrix: ArrayLike<number>, point: Point2D): Vec2 => {
    return new Vec2(matrix[0] * point.x + matrix[3] * point.y + matrix[6],
        matrix[1] * point.x + matrix[4] * point.y + matrix[7]);
};

/** @param matrix 列主序三阶仿射矩阵 @param point 世界点 @example const local = InverseTransformPoint2D(matrix, point); @returns 双精度局部点，矩阵不可逆或非有限时返回 null。 */
const InverseTransformPoint2D = (matrix: ArrayLike<number>, point: Point2D): Vec2 | null => {
    const determinant = matrix[0] * matrix[4] - matrix[3] * matrix[1];
    // 零缩放和非有限矩阵没有唯一的局部位置，不能用于编辑坐标换算。
    if (Number.isFinite(determinant) && determinant !== 0) {
        const x = point.x - matrix[6];
        const y = point.y - matrix[7];
        const localX = (matrix[4] * x - matrix[3] * y) / determinant;
        const localY = (matrix[0] * y - matrix[1] * x) / determinant;
        // 非有限位移、输入点或除法溢出不能作为后续编辑的局部坐标。
        if (Number.isFinite(localX) && Number.isFinite(localY)) {
            return new Vec2(localX, localY);
        } else {
            return null;
        }
    } else {
        return null;
    }
};

/** @param point 待投影点 @param start 有限线段起点 @param end 有限线段终点 @param epsilon 退化线段的平方长度阈值 @example const nearest = ProjectSegmentPoint(point, start, end); @returns 线段上的最近点；退化边返回独立的起点副本。 */
const ProjectSegmentPoint = (point: Point2D, start: Point2D, end: Point2D, epsilon: number = Number.EPSILON): Vec2 => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const squaredLength = dx * dx + dy * dy;
    // 退化边只有一个端点，不对接近零的长度做除法。
    if (squaredLength > epsilon) {
        const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength;
        const fraction = Math.max(0, Math.min(1, projection));
        return new Vec2(start.x + dx * fraction, start.y + dy * fraction);
    } else {
        return new Vec2(start.x, start.y);
    }
};

/** @param point 待测点 @param vertices 闭合单轮廓顶点 @param rule 填充规则，默认非零环绕 @example const inside = ContainsPolygonPoint(point, vertices, "nonzero"); @returns 是否在填充区域内；采用半开射线规则，不额外扩大边界容差。 */
const ContainsPolygonPoint = (point: Point2D, vertices: readonly Point2D[], rule: PolygonFillRule = "nonzero"): boolean => {
    let winding = 0;
    let inside = false;
    // 每条边只对一侧端点包含射线高度，防止经过轮廓顶点时重复计数。
    for (let index = 0; index < vertices.length; index++) {
        const first = vertices[index];
        const second = vertices[(index + 1) % vertices.length];
        // 奇偶规则只计算射线右侧交点，与简单凸轮廓和组框的历史行为一致。
        if (rule === "evenodd") {
            // 水平边不会跨越射线高度，无需计算交点。
            if ((first.y > point.y) !== (second.y > point.y)) {
                const crossX = first.x + (point.y - first.y) * (second.x - first.x) / (second.y - first.y);
                // 每次从射线右侧穿过轮廓都切换内外状态。
                if (crossX > point.x) {
                    inside = !inside;
                }
            }
        } else {
            const cross = (second.x - first.x) * (point.y - first.y) -
                (point.x - first.x) * (second.y - first.y);
            // 向上穿过射线且位于有向边左侧时增加绕数。
            if (first.y <= point.y && second.y > point.y && cross > 0) {
                winding += 1;
            } else if (first.y > point.y && second.y <= point.y && cross < 0) {
                // 反向穿越扣减绕数，自交区域按净绕数判断。
                winding -= 1;
            }
        }
    }
    // 两种规则分别保留奇偶结果与方向累加结果。
    if (rule === "evenodd") {
        return inside;
    } else {
        return winding !== 0;
    }
};

export { ContainsPolygonPoint, InverseTransformPoint2D, ProjectSegmentPoint, TransformPoint2D };
export type { PolygonFillRule };
