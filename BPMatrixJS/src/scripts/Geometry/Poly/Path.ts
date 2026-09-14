import type { PolyNode, PolyOptions, PolyPoint } from "./types.js";

interface Path {
    points: readonly PolyNode[];
    closed: boolean;
    solid: boolean;
    normals: [number, number][];
    lengths: number[];
    distances: number[];
    length: number;
    width: number;
    height: number;
    minX: number;
    minY: number;
    epsilon: number;
}

/**
 * @param a 起点
 * @param b 第二点
 * @param c 第三点
 * @returns 有向两倍面积
 */
const Cross = (a: PolyNode, b: PolyNode, c: PolyNode): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

/**
 * @param value 数值
 * @param name 参数名
 * @returns 有限非负数
 */
const Nonnegative = (value: number, name: string): number => {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(name + " must be finite and nonnegative.");
    return value;
};

/**
 * @param value 段数
 * @param minimum 最小值
 * @returns 验证后的整数
 */
const Segments = (value: number, minimum: number): number => {
    if (!Number.isInteger(value) || value < minimum || value > 4096) throw new RangeError("Segments must be an integer in [" + String(minimum) + ", 4096].");
    return value;
};

/**
 * 复制单条轮廓，允许空集、自交和回折；连续重复节点合并，避免零长度法线。
 * 闭合轮廓按有向面积统一方向，自交路径不保证全局内外侧语义。
 * @param input 输入节点
 * @param options 闭合、填充开关
 * @returns 轮廓及长度、法线、包围盒信息
 */
const CreatePath = (input: readonly PolyPoint[], options: PolyOptions = {}): Path => {
    const closed = options.closed ?? true;
    const solid = options.solid ?? true;
    if (solid && !closed) throw new Error("Solid Poly must be closed; use solid:false for an open path.");
    const points: PolyNode[] = [];
    for (const value of input) {
        const node: PolyNode = "x" in value ? value : { x: value[0], y: value[1] };
        if (!Number.isFinite(Math.fround(node.x)) || !Number.isFinite(Math.fround(node.y))) throw new RangeError("Poly coordinates must fit finite Float32 values.");
        const previous = points.at(-1);
        if (previous?.x === node.x && previous.y === node.y) continue;
        points.push(Object.freeze({ x: node.x, y: node.y, round: node.round ?? false, segments: Segments(node.segments ?? 8, 1) }));
    }
    if (closed && points.length > 1 && points[0].x === points.at(-1)?.x && points[0].y === points.at(-1)?.y) points.pop();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
    if (points.length === 0) { minX = 0; minY = 0; maxX = 0; maxY = 0; }
    const size = Math.max(maxX - minX, maxY - minY);
    const epsilon = Math.max(size * 1e-10, Number.EPSILON);
    const areaEpsilon = epsilon * size;
    // 创建/编辑过程允许点数不足，所有生成器通过空边表返回空几何。
    const edgeCount = points.length < (closed ? 3 : 2) ? 0 : closed ? points.length : points.length - 1;
    if (closed) {
        let area = 0;
        for (let i = 1; i < points.length - 1; i++) area += Cross(points[0], points[i], points[i + 1]);
        if (area < 0) points.reverse();
    }
    const normals: [number, number][] = [], lengths: number[] = [], distances: number[] = [0];
    let length = 0;
    for (let i = 0; i < edgeCount; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const dx = b.x - a.x, dy = b.y - a.y, edgeLength = Math.hypot(dx, dy);
        normals.push([dy / edgeLength, -dx / edgeLength]);
        lengths.push(edgeLength); length += edgeLength; distances.push(length);
    }
    return { points: Object.freeze(points), closed, solid, normals, lengths, distances, length, minX, minY, width: maxX - minX, height: maxY - minY, epsilon: areaEpsilon };
};

/**
 * @param path 轮廓
 * @param index 节点下标
 * @returns 单位角平分线法线和斜接补偿倍率
 */
const JoinNormal = (path: Path, index: number): [number, number, number] => {
    const last = path.normals.length - 1;
    const a = path.normals[index === 0 ? (path.closed ? last : 0) : index - 1];
    const b = path.normals[index > last ? last : index];
    const x = a[0] + b[0], y = a[1] + b[1], length = Math.hypot(x, y);
    // 回折没有唯一角平分线，使用出边法线降级，避免阻断线框绘制或产生无穷倍率。
    if (length < 1e-6) return [b[0], b[1], 1];
    const nx = x / length, ny = y / length;
    return [nx, ny, 1 / Math.max(nx * b[0] + ny * b[1], 1e-6)];
};

/**
 * 耳切法支持简单凹多边形；只剔除填充剖分中的共线节点，线框和辅助点保留它们。
 * 自交等路径可能无法耳切，剩余区域改用扇形降级；不实现 evenodd/nonzero 填充规则。
 * @param path 闭合轮廓
 * @returns 顺时针三角面索引，与 Rect 的正面方向一致
 */
const Triangulate = (path: Path): number[] => {
    const p = path.points, remaining = p.map((_, i): number => i), result: number[] = [];
    if (remaining.length < 3) return result;
    /** @param a 顶点 @param b 顶点 @param c 顶点；跳过退化面并保持 CW */
    const Triangle = (a: number, b: number, c: number): void => {
        const area = Cross(p[a], p[b], p[c]);
        if (Math.abs(area) <= path.epsilon) return;
        if (area > 0) result.push(a, c, b); else result.push(a, b, c);
    };
    let changed = true;
    while (changed && remaining.length > 3) {
        changed = false;
        for (let i = 0; i < remaining.length; i++) {
            if (Math.abs(Cross(p[remaining[(i + remaining.length - 1) % remaining.length]], p[remaining[i]], p[remaining[(i + 1) % remaining.length]])) <= path.epsilon) {
                remaining.splice(i, 1); changed = true; break;
            }
        }
    }
    while (remaining.length > 3) {
        let found = false;
        for (let i = 0; i < remaining.length; i++) {
            const a = remaining[(i + remaining.length - 1) % remaining.length], b = remaining[i], c = remaining[(i + 1) % remaining.length];
            if (Cross(p[a], p[b], p[c]) <= path.epsilon) continue;
            const contains = remaining.some((v): boolean => v !== a && v !== b && v !== c
                && Cross(p[a], p[b], p[v]) >= -path.epsilon && Cross(p[b], p[c], p[v]) >= -path.epsilon && Cross(p[c], p[a], p[v]) >= -path.epsilon);
            if (contains) continue;
            result.push(a, c, b); remaining.splice(i, 1); found = true; break;
        }
        if (!found) {
            // 有界退出，不因无法找到耳朵而中断整帧；自交区域允许重叠和不规则填充。
            for (let i = 1; i < remaining.length - 1; i++) Triangle(remaining[0], remaining[i], remaining[i + 1]);
            return result;
        }
    }
    Triangle(remaining[0], remaining[1], remaining[2]);
    return result;
};

export { CreatePath, Cross, JoinNormal, Nonnegative, Segments, Triangulate };
export type { Path };
