/** 仅包含数值坐标的二维点，不依赖渲染对象。 */
interface Point2D {
    x: number;
    y: number;
}

/** 三个按轮廓顺序排列的二维顶点。 */
type Triangle2D = readonly [Point2D, Point2D, Point2D];

const GEOMETRY_EPSILON = 1e-7;

/**
 * 计算有向多边形的两倍面积，符号表示顶点绕向。
 * @param points 按轮廓顺序排列的顶点。
 * @example
 * const doubledArea = SignedDoubleArea(triangle);
 * @returns 有向两倍面积；少于三个点时为零。
 */
const SignedDoubleArea = (points: readonly Point2D[]): number => {
    let area = 0;
    // 闭合边也参与交叉积，使凸多边形裁剪能识别两种绕向。
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        area += current.x * next.y - current.y * next.x;
    }
    return area;
};

/**
 * 检查第一条凸轮廓的边法线是否能分开两条凸轮廓。
 * 完整 SAT 相交检测还需要交换参数再调用一次。
 * @param axesSource 提供分离轴的凸轮廓。
 * @param other 另一凸轮廓。
 * @example
 * const separated = HasSeparatingAxis(first, second) || HasSeparatingAxis(second, first);
 * @returns 是否存在来自第一轮廓的分离轴。
 */
const HasSeparatingAxis = (axesSource: readonly Point2D[], other: readonly Point2D[]): boolean => {
    // 每条非退化边提供一个待检验的法线。
    for (let index = 0; index < axesSource.length; index += 1) {
        const current = axesSource[index];
        const next = axesSource[(index + 1) % axesSource.length];
        const axisX = next.y - current.y;
        const axisY = current.x - next.x;
        // 重合点之间没有有效的分离轴。
        if (axisX !== 0 || axisY !== 0) {
            let firstMin = Number.POSITIVE_INFINITY;
            let firstMax = Number.NEGATIVE_INFINITY;
            let secondMin = Number.POSITIVE_INFINITY;
            let secondMax = Number.NEGATIVE_INFINITY;
            // 第一轮廓在当前轴上的投影区间。
            for (const point of axesSource) {
                const projection = point.x * axisX + point.y * axisY;
                firstMin = Math.min(firstMin, projection);
                firstMax = Math.max(firstMax, projection);
            }
            // 第二轮廓与第一轮廓使用相同的投影轴。
            for (const point of other) {
                const projection = point.x * axisX + point.y * axisY;
                secondMin = Math.min(secondMin, projection);
                secondMax = Math.max(secondMax, projection);
            }
            const tolerance = GEOMETRY_EPSILON * (Math.abs(axisX) + Math.abs(axisY));
            // 严格分离才算不相交；相切保留给调用方当成交集。
            if (firstMax < secondMin - tolerance || secondMax < firstMin - tolerance) {
                return true;
            }
        }
    }
    return false;
};

/**
 * 判断二维点是否位于三角形内部或边界上。
 * @param triangle 待测三角形。
 * @param point 待测点。
 * @example
 * const inside = ContainsTrianglePoint(triangle, point);
 * @returns 是否位于三角形内部或边界。
 */
const ContainsTrianglePoint = (triangle: Triangle2D, point: Point2D): boolean => {
    const first = triangle[0];
    const second = triangle[1];
    const third = triangle[2];
    const firstSide = (second.x - first.x) * (point.y - first.y) -
        (second.y - first.y) * (point.x - first.x);
    const secondSide = (third.x - second.x) * (point.y - second.y) -
        (third.y - second.y) * (point.x - second.x);
    const thirdSide = (first.x - third.x) * (point.y - third.y) -
        (first.y - third.y) * (point.x - third.x);
    const hasNegative = firstSide < -GEOMETRY_EPSILON ||
        secondSide < -GEOMETRY_EPSILON || thirdSide < -GEOMETRY_EPSILON;
    const hasPositive = firstSide > GEOMETRY_EPSILON ||
        secondSide > GEOMETRY_EPSILON || thirdSide > GEOMETRY_EPSILON;
    return !(hasNegative && hasPositive);
};

/**
 * 计算二维点到有限线段的平方距离，零长度线段按端点处理。
 * @param point 待测点。
 * @param start 线段起点。
 * @param end 线段终点。
 * @example
 * const distanceSquared = SegmentDistanceSquared(point, start, end);
 * @returns 与输入坐标相同单位的平方距离。
 */
const SegmentDistanceSquared = (point: Point2D, start: Point2D, end: Point2D): number => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    let ratio = 0;
    // 退化线段没有方向，保留起点作为最近点。
    if (lengthSquared > 0) {
        ratio = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
        ratio = Math.max(0, Math.min(1, ratio));
    }
    const nearestX = start.x + ratio * dx;
    const nearestY = start.y + ratio * dy;
    const distanceX = point.x - nearestX;
    const distanceY = point.y - nearestY;
    return distanceX * distanceX + distanceY * distanceY;
};

/**
 * 计算点到有向边的二维交叉积。
 * @param start 有向边起点。
 * @param end 有向边终点。
 * @param point 待测点。
 * @example
 * const side = EdgeSide(start, end, point);
 * @returns 有向交叉积。
 */
const EdgeSide = (start: Point2D, end: Point2D, point: Point2D): number => {
    return (end.x - start.x) * (point.y - start.y) -
        (end.y - start.y) * (point.x - start.x);
};

/**
 * 在一条裁剪边上插值得到输入线段的交点。
 * @param first 输入线段前一点。
 * @param second 输入线段后一点。
 * @param firstSide 前一点到裁剪边的有向距离。
 * @param secondSide 后一点到裁剪边的有向距离。
 * @example
 * const crossing = Crossing(first, second, firstSide, secondSide);
 * @returns 裁剪边与输入线段的交点。
 */
const Crossing = (
    first: Point2D,
    second: Point2D,
    firstSide: number,
    secondSide: number,
): Point2D => {
    const ratio = firstSide / (firstSide - secondSide);
    return {
        x: first.x + (second.x - first.x) * ratio,
        y: first.y + (second.y - first.y) * ratio,
    };
};

/**
 * 用三角形裁剪三角形，返回共同覆盖面积；两种绕向均可。
 * @param candidate 第一个三角形。
 * @param selection 第二个三角形，用作凸裁剪边界。
 * @example
 * const area = TriangleOverlapArea(candidate, selection);
 * @returns 非负交叠面积；仅相切时为零。
 */
const TriangleOverlapArea = (candidate: Triangle2D, selection: Triangle2D): number => {
    let clipped: Point2D[] = [...candidate];
    const winding = Math.sign(SignedDoubleArea(selection));
    // 每条选择三角形边裁去一次外部区域。
    for (let edge = 0; edge < 3; edge += 1) {
        const start = selection[edge];
        const end = selection[(edge + 1) % 3];
        const input = clipped;
        clipped = [];
        // 空交集保持为空，后续有向面积自然得到零。
        if (input.length > 0) {
            // 输入多边形的每条边可能产生一个交点和一个内部顶点。
            for (let index = 0; index < input.length; index += 1) {
                const first = input[index];
                const second = input[(index + 1) % input.length];
                const firstSide = EdgeSide(start, end, first) * winding;
                const secondSide = EdgeSide(start, end, second) * winding;
                const firstInside = firstSide >= -GEOMETRY_EPSILON;
                const secondInside = secondSide >= -GEOMETRY_EPSILON;
                // 跨越裁剪边时保存交点，边界上的顶点仍属于交集。
                if (firstInside !== secondInside) {
                    clipped.push(Crossing(first, second, firstSide, secondSide));
                }
                // 留下裁剪边内侧的线段终点。
                if (secondInside) {
                    clipped.push(second);
                }
            }
        }
    }
    return Math.abs(SignedDoubleArea(clipped)) * 0.5;
};

export {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
};
export type { Point2D, Triangle2D };
