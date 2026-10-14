import type { Base2DOptions } from "./Base2D";

interface BoundaryPoint {
    key: string;
    x: number;
    y: number;
}

interface BoundaryEdge {
    start: BoundaryPoint;
    end: BoundaryPoint;
    count: number;
}

interface EdgeNode {
    point: BoundaryPoint;
    ratio: number;
}

/**
 * 从实体三角网提取所有闭合边界，包括分离的外环和多个孔环。
 * @param options 原始顶点、索引和分区标记
 * @example const rings = InferContours(options);
 * @returns 可闭合的边界环；非流形或开放边界不猜测轮廓。
 */
const InferContours = (options: Base2DOptions): Float32Array[] => {
    const vertices = options.vertices;
    const indices = options.index;
    const triangleCount = (indices?.length ?? vertices.length / 2) / 3;
    const edges = new Map<string, BoundaryEdge>();
    const positions = new Map<string, BoundaryPoint>();
    /** @param index 顶点编号 @example const point = ReadVertex(0); @returns 按精确坐标合并的顶点。 */
    const ReadVertex = (index: number): BoundaryPoint => {
        const x = vertices[index * 2];
        const y = vertices[index * 2 + 1];
        const key = String(x) + "," + String(y);
        let point = positions.get(key);
        // 分离三角面可以使用不同索引表达同一个几何节点。
        if (point === undefined) {
            point = { key, x, y };
            positions.set(key, point);
        }
        return point;
    };
    // 宽边和关键点图标不属于实体填充的边界。
    for (let triangle = 0; triangle < triangleCount; triangle++) {
        const first = indices?.[triangle * 3] ?? triangle * 3;
        const second = indices?.[triangle * 3 + 1] ?? triangle * 3 + 1;
        const third = indices?.[triangle * 3 + 2] ?? triangle * 3 + 2;
        const solid = options.vertexType === undefined ||
            (options.vertexType[first] === 0 && options.vertexType[second] === 0 && options.vertexType[third] === 0);
        // 仅让实体三角形参与共享边抵消。
        if (solid) {
            const corners = [ReadVertex(first), ReadVertex(second), ReadVertex(third)];
            // 第一次抵消端点一致的共享边，减少后续共线节点查询。
            for (let edge = 0; edge < 3; edge++) {
                AddEdge(edges, corners[edge], corners[(edge + 1) % 3]);
            }
        }
    }
    const boundaryEdges = SplitBoundaryEdges(edges);
    const adjacent = new Map<string, BoundaryPoint[]>();
    // 拆分后只出现一次的子边才属于实际外环或孔环。
    for (const edge of boundaryEdges.values()) {
        // 内部的长边与多个短边现在能够正确抵消。
        if (edge.count === 1) {
            adjacent.set(edge.start.key, [...(adjacent.get(edge.start.key) ?? []), edge.end]);
            adjacent.set(edge.end.key, [...(adjacent.get(edge.end.key) ?? []), edge.start]);
        }
    }
    const contours: Float32Array[] = [];
    const visited = new Set<string>();
    // 每个连通的边界分量独立闭合，不限制外环或孔环的数量。
    for (const start of adjacent.keys()) {
        const initial = positions.get(start);
        // 已遍历的环不能再次生成相同轮廓。
        if (initial !== undefined && visited.has(start) === false) {
            const ring: number[] = [];
            let current = initial;
            let previous: string | null = null;
            let closed = false;
            // 分叉或开放的三角网不提供不可靠的编辑环。
            for (let step = 0; step <= adjacent.size; step++) {
                const nextPoints = adjacent.get(current.key);
                // 规则闭合边界的每个节点只能连接两个邻居。
                if (nextPoints?.length === 2) {
                    visited.add(current.key);
                    ring.push(current.x, current.y);
                    let next = nextPoints[0];
                    // 跳过来路，继续沿当前轮廓前进。
                    if (next.key === previous) {
                        next = nextPoints[1];
                    }
                    // 回到起点才算完整闭合，而不是在中途拼接另一条环。
                    if (next.key === start) {
                        closed = true;
                        break;
                    } else if (visited.has(next.key)) {
                        // 中途到达已走过的节点表示分叉，不把残缺路径当成完整轮廓。
                        break;
                    }
                    previous = current.key;
                    current = next;
                } else {
                    break;
                }
            }
            // 两点折返不能生成有面积的轮廓。
            if (closed && ring.length >= 6) {
                contours.push(new Float32Array(ring));
            }
        }
    }
    /** @param first 第一轮廓 @param second 第二轮廓 @example CompareContourArea(outer, inner); @returns 面积降序的比较值。 */
    const CompareContourArea = (first: Float32Array, second: Float32Array): number =>
        Math.abs(ContourArea(second)) - Math.abs(ContourArea(first));
    // 保持最大的外轮廓在前，但不把后续分量限定为同一个外环的孔。
    contours.sort(CompareContourArea);
    return contours;
};

/**
 * 记录无向边的出现次数，忽略重合端点形成的零长度边。
 * @param edges 边计数表
 * @param start 边起点
 * @param end 边终点
 * @example AddEdge(edges, first, second);
 * @returns 无返回值。
 */
const AddEdge = (edges: Map<string, BoundaryEdge>, start: BoundaryPoint, end: BoundaryPoint): void => {
    // 零长度边没有可供闭合或拆分的方向。
    if (start.key !== end.key) {
        const key = [start.key, end.key].sort().join("|");
        const existing = edges.get(key);
        // 共享的无向边属于内部，单次出现的边留给边界遍历。
        if (existing !== undefined) {
            existing.count++;
        } else {
            edges.set(key, { start, end, count: 1 });
        }
    }
};

/**
 * 将未抵消的长边按共线节点拆分，使 T 接点两侧的长短边能够逐段抵消。
 * @param edges 已完成精确端点抵消的边计数表
 * @example const splitEdges = SplitBoundaryEdges(edges);
 * @returns 子边计数表；只用于边界推导，不修改原填充三角面。
 */
const SplitBoundaryEdges = (edges: ReadonlyMap<string, BoundaryEdge>): Map<string, BoundaryEdge> => {
    const remaining: BoundaryEdge[] = [];
    const positions = new Map<string, BoundaryPoint>();
    // 已配对的完整内部边无需查询其他顶点。
    for (const edge of edges.values()) {
        // T 接点的长边与短边端点不同，第一次计数后都只出现一次。
        if (edge.count === 1) {
            remaining.push(edge);
            positions.set(edge.start.key, edge.start);
            positions.set(edge.end.key, edge.end);
        }
    }
    /** @param first 第一节点 @param second 第二节点 @example points.sort(CompareX); @returns X 坐标升序值。 */
    const CompareX = (first: BoundaryPoint, second: BoundaryPoint): number => first.x - second.x;
    /** @param first 第一节点 @param second 第二节点 @example points.sort(CompareY); @returns Y 坐标升序值。 */
    const CompareY = (first: BoundaryPoint, second: BoundaryPoint): number => first.y - second.y;
    const sortedX = [...positions.values()].sort(CompareX);
    const sortedY = [...positions.values()].sort(CompareY);
    const result = new Map<string, BoundaryEdge>();
    // 双轴范围查询避免每条边都扫描整段文字的全部节点。
    for (const edge of remaining) {
        const dx = edge.end.x - edge.start.x;
        const dy = edge.end.y - edge.start.y;
        const lengthSquared = dx * dx + dy * dy;
        const magnitude = Math.max(Math.abs(edge.start.x), Math.abs(edge.start.y),
            Math.abs(edge.end.x), Math.abs(edge.end.y));
        // 烘焙仿射变换后 Float32 舍入可能让共线点偏离一小部分像素。
        const tolerance = magnitude * 2 ** -23;
        const minX = Math.min(edge.start.x, edge.end.x) - tolerance;
        const maxX = Math.max(edge.start.x, edge.end.x) + tolerance;
        const minY = Math.min(edge.start.y, edge.end.y) - tolerance;
        const maxY = Math.max(edge.start.y, edge.end.y) + tolerance;
        const xStart = LowerBound(sortedX, "x", minX);
        const xEnd = LowerBound(sortedX, "x", maxX, true);
        const yStart = LowerBound(sortedY, "y", minY);
        const yEnd = LowerBound(sortedY, "y", maxY, true);
        let candidates = sortedX;
        let from = xStart;
        let to = xEnd;
        // 选择候选更少的轴；横竖边和斜边都能利用坐标排序。
        if (yEnd - yStart < xEnd - xStart) {
            candidates = sortedY;
            from = yStart;
            to = yEnd;
        }
        const nodes: EdgeNode[] = [{ point: edge.start, ratio: 0 }, { point: edge.end, ratio: 1 }];
        const crossTolerance = tolerance * Math.sqrt(lengthSquared);
        // 只检查边包围盒范围内的其他未配对边端点。
        for (let index = from; index < to; index++) {
            const point = candidates[index];
            const withinBounds = point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
            // 端点已在列表中，不能再插入零长度子边。
            if (withinBounds && point.key !== edge.start.key && point.key !== edge.end.key) {
                const relativeX = point.x - edge.start.x;
                const relativeY = point.y - edge.start.y;
                const ratio = (relativeX * dx + relativeY * dy) / lengthSquared;
                const cross = dx * relativeY - dy * relativeX;
                // 严格位于边内的共线点才拆边，边的延长线不参与抵消。
                if (ratio > 0 && ratio < 1 && Math.abs(cross) <= crossTolerance) {
                    nodes.push({ point, ratio });
                }
            }
        }
        /** @param first 第一节点 @param second 第二节点 @example nodes.sort(CompareRatio); @returns 从起点到终点的节点顺序。 */
        const CompareRatio = (first: EdgeNode, second: EdgeNode): number => first.ratio - second.ratio;
        nodes.sort(CompareRatio);
        // 每条长边拆为与另一侧短边相同的端点对后重新计数。
        for (let index = 0; index + 1 < nodes.length; index++) {
            AddEdge(result, nodes[index].point, nodes[index + 1].point);
        }
    }
    return result;
};

/**
 * 在已排序的节点中查找坐标范围边界。
 * @param points 坐标升序节点
 * @param axis 要查询的坐标轴
 * @param value 范围边界值
 * @param exclusive 是否跳过与边界相等的节点
 * @example const start = LowerBound(points, "x", minX);
 * @returns 第一个不小于边界的下标，exclusive 时返回第一个大于边界的下标。
 */
const LowerBound = (points: readonly BoundaryPoint[], axis: "x" | "y", value: number,
    exclusive: boolean = false): number => {
    let low = 0;
    let high = points.length;
    // 每次缩小一半范围，避免多条边重复线性扫描字形顶点。
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        const coordinate = points[middle][axis];
        // 上界查询包含等值节点，下界查询保留等值节点。
        if (coordinate < value || (exclusive && coordinate === value)) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
};

/** @param contour 有序闭合环 @example const area = ContourArea(ring); @returns 有向面积。 */
const ContourArea = (contour: Float32Array): number => {
    let twiceArea = 0;
    // 面积只用于边界排序，不修改轮廓与原三角面顶点的对应关系。
    for (let offset = 0; offset < contour.length; offset += 2) {
        const next = (offset + 2) % contour.length;
        twiceArea += contour[offset] * contour[next + 1] - contour[next] * contour[offset + 1];
    }
    return twiceArea / 2;
};

export { InferContours };
