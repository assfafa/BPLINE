import type { Mat3 } from "bpmatrixjs/Math";
import { HasSeparatingAxis } from "bpmatrixjs/Utils";
import Rect2D from "../../Geometry/Rect2D";
import type Mesh from "../../Mesh";

interface SelectPoint {
    x: number;
    y: number;
}

interface SelectBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

interface RectFootprint {
    width: number;
    height: number;
    radius: number;
    worldMatrix: Mat3;
    corners: SelectPoint[];
    bounds: SelectBounds;
    outline?: SelectPoint[];
}

const SELECT_EPSILON = 1e-7;

/**
 * 将矩形局部坐标变换为世界坐标。
 * @param matrix Mesh 当前的世界矩阵。
 * @param x 局部 X 坐标。
 * @param y 局部 Y 坐标。
 * @example
 * const point = ToWorld(mesh.worldMatrix, 10, 20);
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
 * 取得世界点在矩形自身坐标系中的位置。
 * @param matrix Mesh 当前的世界矩阵。
 * @param point 世界坐标点。
 * @example
 * const local = ToLocal(mesh.worldMatrix, worldPoint);
 * @returns 局部坐标点；奇异矩阵返回 undefined。
 */
const ToLocal = (matrix: Mat3, point: SelectPoint): SelectPoint | undefined => {
    const values = matrix.data;
    const determinant = values[0] * values[4] - values[3] * values[1];
    // 零缩放或非法矩阵没有可选取的二维面积。
    if (Number.isFinite(determinant) && Math.abs(determinant) > Number.EPSILON) {
        const dx = point.x - values[6];
        const dy = point.y - values[7];
        return {
            x: (values[4] * dx - values[3] * dy) / determinant,
            y: (values[0] * dy - values[1] * dx) / determinant,
        };
    } else {
        return undefined;
    }
};

/**
 * 获取四个未裁圆角的矩形角点。
 * @param matrix Mesh 当前的世界矩阵。
 * @param width 矩形宽度。
 * @param height 矩形高度。
 * @example
 * const corners = CreateCorners(matrix, width, height);
 * @returns 逆时针排列的世界角点。
 */
const CreateCorners = (matrix: Mat3, width: number, height: number): SelectPoint[] => {
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    return [
        ToWorld(matrix, halfWidth, halfHeight),
        ToWorld(matrix, -halfWidth, halfHeight),
        ToWorld(matrix, -halfWidth, -halfHeight),
        ToWorld(matrix, halfWidth, -halfHeight),
    ];
};

/**
 * 计算世界角点的轴向包围盒，作为大量对象的第一层筛选。
 * @param points 未裁圆角的矩形角点。
 * @example
 * const bounds = CreateBounds(corners);
 * @returns 世界坐标轴向包围盒。
 */
const CreateBounds = (points: readonly SelectPoint[]): SelectBounds => {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    // 未裁圆角的四角足以包住仿射变换后的整个圆角矩形。
    for (const point of points) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }
    return { minX, maxX, minY, maxY };
};

/**
 * 从 Mesh 的 Rect2D 几何和世界矩阵建立一次选择快照。
 * @param mesh 场景中的普通 Mesh。
 * @example
 * const footprint = CreateRectFootprint(mesh);
 * @returns 可选择的矩形快照；非矩形或退化矩形返回 undefined。
 */
const CreateRectFootprint = (mesh: Mesh): RectFootprint | undefined => {
    const geometry = mesh.data;
    // 选择器只处理有实际面积的 Rect2D，其他几何交给各自工具。
    if (
        geometry instanceof Rect2D &&
        Number.isFinite(geometry.width) &&
        Number.isFinite(geometry.height) &&
        geometry.width > 0 &&
        geometry.height > 0
    ) {
        const worldMatrix = mesh.ensureWorldMatrix();
        const values = worldMatrix.data;
        const determinant = values[0] * values[4] - values[3] * values[1];
        // 非法变换会产生 NaN 包围盒，必须在 SAT 粗筛之前排除。
        const finiteMatrix = values.every(Number.isFinite);
        // 零缩放及非法变换不能提供稳定的二维选择区域。
        if (finiteMatrix && Number.isFinite(determinant) && Math.abs(determinant) > Number.EPSILON) {
            let radius = geometry.radius;
            // Rect2D 在重建几何时会做相同的圆角范围限制。
            if (Number.isFinite(radius)) {
                radius = Math.max(0, Math.min(radius, geometry.width * 0.5, geometry.height * 0.5));
            } else {
                radius = 0;
            }
            const corners = CreateCorners(worldMatrix, geometry.width, geometry.height);
            return {
                width: geometry.width,
                height: geometry.height,
                radius,
                worldMatrix,
                corners,
                bounds: CreateBounds(corners),
            };
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
};

/**
 * 判断世界点是否落在圆角矩形内部或边界上。
 * @param rectangle 待测矩形。
 * @param point 世界坐标点。
 * @example
 * const hit = ContainsWorldPoint(rectangle, point);
 * @returns 点是否命中矩形填充轮廓。
 */
const ContainsWorldPoint = (rectangle: RectFootprint, point: SelectPoint): boolean => {
    // 世界包围盒先排除绝大多数远离对象的点。
    if (
        point.x < rectangle.bounds.minX - SELECT_EPSILON ||
        point.x > rectangle.bounds.maxX + SELECT_EPSILON ||
        point.y < rectangle.bounds.minY - SELECT_EPSILON ||
        point.y > rectangle.bounds.maxY + SELECT_EPSILON
    ) {
        return false;
    } else {
        const local = ToLocal(rectangle.worldMatrix, point);
        // CreateRectFootprint 已排除奇异矩阵，此分支也防范外部矩阵原地修改。
        if (local !== undefined) {
            const halfWidth = rectangle.width * 0.5;
            const halfHeight = rectangle.height * 0.5;
            const absX = Math.abs(local.x);
            const absY = Math.abs(local.y);
            // 未裁圆角的主体矩形是快速的局部坐标筛选。
            if (absX <= halfWidth + SELECT_EPSILON && absY <= halfHeight + SELECT_EPSILON) {
                const cornerX = Math.max(0, absX - (halfWidth - rectangle.radius));
                const cornerY = Math.max(0, absY - (halfHeight - rectangle.radius));
                return cornerX * cornerX + cornerY * cornerY <= rectangle.radius * rectangle.radius + SELECT_EPSILON;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
};

/**
 * 先用未裁圆角的矩形判断两对象是否可能相交。
 * @param first 第一矩形。
 * @param second 第二矩形。
 * @example
 * const possible = MayIntersect(first, second);
 * @returns 无圆角矩形是否相交或相切。
 */
const MayIntersect = (first: RectFootprint, second: RectFootprint): boolean => {
    // 轴向包围盒筛选在 SAT 前避免大量投影计算。
    if (
        first.bounds.maxX < second.bounds.minX - SELECT_EPSILON ||
        second.bounds.maxX < first.bounds.minX - SELECT_EPSILON ||
        first.bounds.maxY < second.bounds.minY - SELECT_EPSILON ||
        second.bounds.maxY < first.bounds.minY - SELECT_EPSILON
    ) {
        return false;
    } else {
        return !HasSeparatingAxis(first.corners, second.corners) &&
            !HasSeparatingAxis(second.corners, first.corners);
    }
};

/**
 * 生成用于圆角窄阶段检测的世界轮廓；直角矩形复用四角。
 * @param rectangle 待测矩形。
 * @example
 * const outline = CreateWorldOutline(rectangle);
 * @returns 世界坐标中的凸轮廓点。
 */
const CreateWorldOutline = (rectangle: RectFootprint): SelectPoint[] => {
    // 同一次 Selector 调用会对比多个 Mesh，选择框的圆角采样只需生成一次。
    if (rectangle.outline === undefined) {
        // 直角矩形已经有精确的四角，无需重新分配轮廓。
        if (rectangle.radius === 0) {
            rectangle.outline = rectangle.corners;
        } else {
            const halfWidth = rectangle.width * 0.5;
            const halfHeight = rectangle.height * 0.5;
            const insetX = halfWidth - rectangle.radius;
            const insetY = halfHeight - rectangle.radius;
            const maxAngle = Math.acos(Math.max(-1, 1 - 0.2 / rectangle.radius));
            const segments = Math.min(64, Math.max(2, Math.ceil((Math.PI * 0.5) / maxAngle)));
            const centers: SelectPoint[] = [
                { x: insetX, y: insetY },
                { x: -insetX, y: insetY },
                { x: -insetX, y: -insetY },
                { x: insetX, y: -insetY },
            ];
            const points: SelectPoint[] = [];
            // 仅在粗筛通过后采样四段圆角；采样弦与渲染轮廓一样形成凸边界。
            for (let corner = 0; corner < centers.length; corner += 1) {
                const center = centers[corner];
                // 每段包括端点，使长直边连接相邻圆角。
                for (let step = 0; step <= segments; step += 1) {
                    const angle = (corner + step / segments) * Math.PI * 0.5;
                    const x = center.x + Math.cos(angle) * rectangle.radius;
                    const y = center.y + Math.sin(angle) * rectangle.radius;
                    points.push(ToWorld(rectangle.worldMatrix, x, y));
                }
            }
            rectangle.outline = points;
        }
    }
    return rectangle.outline;
};

/**
 * 判断候选矩形的整个填充轮廓是否位于选择矩形内。
 * @param selection 选择矩形。
 * @param candidate 候选矩形。
 * @example
 * const selected = ContainsFootprint(selection, candidate);
 * @returns 是否完全包含候选矩形。
 */
const ContainsFootprint = (selection: RectFootprint, candidate: RectFootprint): boolean => {
    // 无圆角的粗筛失败时，精细轮廓也不可能完全包含。
    if (MayIntersect(selection, candidate)) {
        const outline = CreateWorldOutline(candidate);
        // 圆角矩形为凸形；逐点检查其边界即可判定采样轮廓的包含关系。
        for (const point of outline) {
            // 任意边界点落在选择区域外，就不是全包模式。
            if (ContainsWorldPoint(selection, point)) {
                // 此边界点通过测试，继续检查剩余轮廓。
            } else {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
};

/**
 * 判断两个圆角矩形的填充轮廓是否相交。
 * @param selection 选择矩形。
 * @param candidate 候选矩形。
 * @example
 * const selected = IntersectsFootprints(selection, candidate);
 * @returns 是否有任意交集或相切。
 */
const IntersectsFootprints = (selection: RectFootprint, candidate: RectFootprint): boolean => {
    // 先排除无圆角矩形，再为幸存者生成圆角轮廓和检查分离轴。
    if (MayIntersect(selection, candidate)) {
        // 双方都无圆角时粗筛已经是精确结果。
        if (selection.radius === 0 && candidate.radius === 0) {
            return true;
        } else {
            const selectionOutline = CreateWorldOutline(selection);
            const candidateOutline = CreateWorldOutline(candidate);
            return !HasSeparatingAxis(selectionOutline, candidateOutline) &&
                !HasSeparatingAxis(candidateOutline, selectionOutline);
        }
    } else {
        return false;
    }
};

export {
    ContainsFootprint,
    ContainsWorldPoint,
    CreateRectFootprint,
    CreateWorldOutline,
    IntersectsFootprints,
};
export type { RectFootprint, SelectBounds, SelectPoint };
