import NGon from "bpmatrixjs/Geometry/NGon";
import Poly from "bpmatrixjs/Geometry/Poly";
import type { Mat3 } from "bpmatrixjs/Math";
import { HasSeparatingAxis, SignedDoubleArea, TriangleOverlapArea } from "bpmatrixjs/Utils";
import NGon2D from "../Geometry/NGon2D";
import Poly2D from "../Geometry/Poly2D";
import type Mesh from "../Mesh";
import {
    ContainsWorldPoint,
    CreateRectFootprint,
    CreateWorldOutline,
} from "./RectSelectTool/RectSelectGeometry";
import type { RectFootprint, SelectBounds, SelectPoint } from "./RectSelectTool/RectSelectGeometry";
import type { SelectTriangle } from "./SelectionGeometry";

interface SelectionArea {
    bounds: SelectBounds;
    rectangle?: RectFootprint;
    triangles: SelectTriangle[];
    outline?: SelectPoint[];
}

interface IndexedFill {
    geometry: Float32Array;
    index: Uint16Array | Uint32Array;
}

/**
 * 将形状的局部坐标投影到 Mesh 的世界坐标。
 * @param matrix 选择框的世界矩阵。
 * @param x 局部 X 坐标。
 * @param y 局部 Y 坐标。
 * @example
 * const point = ToWorld(matrix, 10, 20);
 * @returns 世界坐标点。
 */
const ToWorld = (matrix: Mat3, x: number, y: number): SelectPoint => {
    const values = matrix.data;
    return {
        x: values[0] * x + values[3] * y + values[6],
        y: values[1] * x + values[4] * y + values[7],
    };
};

/**
 * 从非矩形填充三角面构建紧凑的世界轴向包围盒。
 * @param triangles 世界三角面。
 * @example
 * const bounds = BoundsFromTriangles(triangles);
 * @returns 三角面顶点的世界包围盒。
 */
const BoundsFromTriangles = (triangles: readonly SelectTriangle[]): SelectBounds => {
    const bounds = {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
    };
    // 只使用填充面顶点，边框与编辑关键点不扩大选择范围。
    for (const triangle of triangles) {
        // 每个三角形的三点都可能决定轴向范围。
        for (const point of triangle) {
            bounds.minX = Math.min(bounds.minX, point.x);
            bounds.maxX = Math.max(bounds.maxX, point.x);
            bounds.minY = Math.min(bounds.minY, point.y);
            bounds.maxY = Math.max(bounds.maxY, point.y);
        }
    }
    return bounds;
};

/**
 * 将 BPMatrixJS 的填充索引转换成世界三角面，保持凹面及内孔的剖分。
 * @param fill 独立于显示样式生成的实体面。
 * @param matrix 选择框的世界矩阵。
 * @example
 * const triangles = WorldTriangles(poly.data, mesh.ensureWorldMatrix());
 * @returns 所有非退化世界三角面。
 */
const WorldTriangles = (fill: IndexedFill, matrix: Mat3): SelectTriangle[] => {
    const triangles: SelectTriangle[] = [];
    // 填充索引每三个组成一个实体面，不读取边框和关键点分区。
    for (let offset = 0; offset + 2 < fill.index.length; offset += 3) {
        const firstIndex = fill.index[offset] * 2;
        const secondIndex = fill.index[offset + 1] * 2;
        const thirdIndex = fill.index[offset + 2] * 2;
        const first = ToWorld(matrix, fill.geometry[firstIndex], fill.geometry[firstIndex + 1]);
        const second = ToWorld(matrix, fill.geometry[secondIndex], fill.geometry[secondIndex + 1]);
        const third = ToWorld(matrix, fill.geometry[thirdIndex], fill.geometry[thirdIndex + 1]);
        const doubledArea = (second.x - first.x) * (third.y - first.y) -
            (second.y - first.y) * (third.x - first.x);
        // 零面积或非法变换不能形成可选择的二维区域。
        if (Number.isFinite(doubledArea) && Math.abs(doubledArea) > Number.EPSILON) {
            triangles.push([first, second, third]);
        }
    }
    return triangles;
};

/**
 * 根据 Mesh 的几何类型取得独立于显示样式的选择范围。
 * @param mesh 可不在 Scene 中的 Rect2D、Poly2D 或 NGon2D Mesh。
 * @example
 * const area = CreateSelectionArea(frame);
 * @returns 有面积的选择区域；其他类型或退化形状返回 undefined。
 */
const CreateSelectionArea = (mesh: Mesh): SelectionArea | undefined => {
    const rectangle = CreateRectFootprint(mesh);
    // 非矩形区域由填充剖分定义，矩形保留原有精确圆角路径。
    if (rectangle === undefined) {
        const geometry = mesh.data;
        let fill: IndexedFill | undefined;
        // 与渲染器使用同一个 BPMatrixJS 多边形剖分，凹形不退化为外接框。
        if (geometry instanceof Poly2D && geometry.closed) {
            const points: { x: number; y: number }[] = [];
            // 原始节点顺序决定多边形边界和耳切结果。
            for (let offset = 0; offset + 1 < geometry.points.length; offset += 2) {
                points.push({ x: geometry.points[offset], y: geometry.points[offset + 1] });
            }
            fill = new Poly(points, { closed: true, solid: true }).data;
        } else if (geometry instanceof NGon2D) {
            // NGon 的内环必须启用孔洞剖分，不能当完整圆盘选中。
            fill = new NGon({
                outer: geometry.outer,
                inter: geometry.inner,
                hole: geometry.inner > 0,
                sides: geometry.sides,
                startAngle: geometry.startAngle,
                solid: true,
            }).data;
        }
        // 开放多边形、其他类型以及没有填充面索引的形状都不构成框选区域。
        if (fill !== undefined) {
            const triangles = WorldTriangles(fill, mesh.ensureWorldMatrix());
            // 剖分后确实存在面积时才返回，避免无限包围盒进入粗筛。
            if (triangles.length > 0) {
                return { bounds: BoundsFromTriangles(triangles), triangles };
            }
        }
        return undefined;
    } else {
        return { bounds: rectangle.bounds, rectangle, triangles: [] };
    }
};

/**
 * 将凸圆角矩形的采样边界分割为实体三角面。
 * @param rectangle 候选 Rect2D 的世界轮廓。
 * @example
 * const triangles = RectFootprintTriangles(candidate);
 * @returns 填充候选矩形的世界三角面。
 */
const RectFootprintTriangles = (rectangle: RectFootprint): SelectTriangle[] => {
    const outline = CreateWorldOutline(rectangle);
    const triangles: SelectTriangle[] = [];
    // 圆角矩形始终为凸形，首点扇形剖分不会跨出其轮廓。
    for (let index = 1; index + 1 < outline.length; index += 1) {
        triangles.push([outline[0], outline[index], outline[index + 1]]);
    }
    return triangles;
};

/**
 * 判断候选实体三角面是否全部落在选择区域内。
 * @param selection 矩形或剖分后的多边形选择区域。
 * @param candidates 候选 Mesh 的实体三角面。
 * @example
 * const contained = ContainsSelectionTriangles(selection, triangles);
 * @returns 所有候选三角面是否完全被覆盖。
 */
const ContainsSelectionTriangles = (selection: SelectionArea, candidates: readonly SelectTriangle[]): boolean => {
    // 没有填充面时不能因为空循环而被视为全包。
    if (candidates.length > 0) {
        // 凸矩形只检查三角形顶点即可，沿用精确圆角点包含函数。
        if (selection.rectangle !== undefined) {
            // 三角形全部顶点都在凸矩形中等价于完整覆盖。
            for (const triangle of candidates) {
                // 单个顶点落在圆角外就不能算作全包。
                for (const point of triangle) {
                    if (ContainsWorldPoint(selection.rectangle, point)) {
                        // 当前顶点位于凸选择区域中，继续检查下一顶点。
                    } else {
                        return false;
                    }
                }
            }
        } else {
            // 凹形和带孔区域需要比较覆盖面积；只检查顶点会误收穿过凹口或孔洞的三角形。
            for (const candidate of candidates) {
                const candidateArea = Math.abs(SignedDoubleArea(candidate)) * 0.5;
                let coveredArea = 0;
                // 填充三角形的并集定义可选区域，按每片交集面积累加。
                for (const triangle of selection.triangles) {
                    coveredArea += TriangleOverlapArea(candidate, triangle);
                }
                const tolerance = Math.max(1e-5, candidateArea * 1e-6);
                // 候选面积有任意显著部分在区域外时拒绝该 Mesh。
                if (coveredArea >= candidateArea - tolerance) {
                    // 这一三角面被完整覆盖，继续检查候选的其余实体面。
                } else {
                    return false;
                }
            }
        }
        return true;
    } else {
        return false;
    }
};

/**
 * 判断候选实体三角面是否与选择区域相交或相切。
 * @param selection 矩形或剖分后的多边形选择区域。
 * @param candidates 候选 Mesh 的实体三角面。
 * @example
 * const intersects = IntersectsSelectionTriangles(selection, triangles);
 * @returns 是否存在任何实体面交集。
 */
const IntersectsSelectionTriangles = (selection: SelectionArea, candidates: readonly SelectTriangle[]): boolean => {
    // 矩形采样轮廓在同一批候选中只生成一次。
    if (selection.rectangle !== undefined) {
        selection.outline ??= CreateWorldOutline(selection.rectangle);
        // 任一三角面与凸矩形相交即可命中。
        for (const candidate of candidates) {
            // 双方凸轮廓的分离轴都不存在时，当前三角面与矩形相交。
            if (!HasSeparatingAxis(candidate, selection.outline) &&
                !HasSeparatingAxis(selection.outline, candidate)) {
                return true;
            }
        }
    } else {
        // 凹形或带孔区域逐三角面求交，孔内不包含填充三角面。
        for (const candidate of candidates) {
            // 一块有效面接触任意填充三角面就满足 any/right。
            for (const triangle of selection.triangles) {
                // 带孔轮廓只对实体剖分做 SAT，孔洞不会产生误命中。
                if (!HasSeparatingAxis(candidate, triangle) &&
                    !HasSeparatingAxis(triangle, candidate)) {
                    return true;
                }
            }
        }
    }
    return false;
};

export { ContainsSelectionTriangles, CreateSelectionArea, IntersectsSelectionTriangles, RectFootprintTriangles };
export type { SelectionArea };
