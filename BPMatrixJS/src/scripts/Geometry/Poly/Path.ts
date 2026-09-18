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
 * 计算三个节点形成的有向两倍面积，用于判断转向和退化面。
 * @param a 起点
 * @param b 第二点
 * @param c 第三点
 * @example
 * Cross(a, b, c);
 * @returns 有向两倍面积
 */
const Cross = (a: PolyNode, b: PolyNode, c: PolyNode): number =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
/**
 * 检查有限非负数值，拒绝不适合几何计算的参数。
 * @param value 数值
 * @param name 参数名
 * @example
 * Nonnegative(value, name);
 * @returns 有限非负数
 */
const Nonnegative = (value: number, name: string): number => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isFinite(value) || value < 0) {
        throw new RangeError(name + " must be finite and nonnegative.");
    }
    return value;
};
/**
 * 检查细分段数的整数范围，避免异常数量的顶点分配。
 * @param value 段数
 * @param minimum 最小值
 * @example
 * Segments(value, minimum);
 * @returns 验证后的整数
 */
const Segments = (value: number, minimum: number): number => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isInteger(value) || value < minimum || value > 4096) {
        throw new RangeError("Segments must be an integer in [" + String(minimum) + ", 4096].");
    }
    return value;
};
/**
 * 复制单条轮廓，允许空集、自交和回折；连续重复节点合并，避免零长度法线。
 * 闭合轮廓按有向面积统一方向，自交路径不保证全局内外侧语义。
 * @param input 输入节点
 * @param options 闭合、填充开关
 * @example
 * CreatePath(input, options);
 * @returns 轮廓及长度、法线、包围盒信息
 */
const CreatePath = (input: readonly PolyPoint[], options: PolyOptions = {}): Path => {
    const closed = options.closed ?? true;
    const solid = options.solid ?? true;
    // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
    if (solid && !closed) {
        throw new Error("Solid Poly must be closed; use solid:false for an open path.");
    }
    const points: PolyNode[] = [];
    // 逐项处理 input，保持集合中的既定顺序。
    for (const value of input) {
        let node: PolyNode;
        // 同时接受命名坐标和二元坐标数组，先转换为统一节点格式。
        if ("x" in value) {
            node = value;
        } else {
            node = { x: value[0], y: value[1] };
        }
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(Math.fround(node.x)) || !Number.isFinite(Math.fround(node.y))) {
            throw new RangeError("Poly coordinates must fit finite Float32 values.");
        }
        const previous = points.at(-1);
        // 合并连续重合节点，避免零长度边造成法线除零。
        if (previous?.x !== node.x || previous.y !== node.y) {
            points.push(
                Object.freeze({
                    x: node.x,
                    y: node.y,
                    round: node.round ?? false,
                    segments: Segments(node.segments ?? 8, 1),
                }),
            );
        } else {
            continue;
        }
    }
    // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
    if (closed && points.length > 1 && points[0].x === points.at(-1)?.x && points[0].y === points.at(-1)?.y) {
        points.pop();
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
    for (const p of points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (points.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 0;
        maxY = 0;
    }
    const size = Math.max(maxX - minX, maxY - minY);
    const epsilon = Math.max(size * 1e-10, Number.EPSILON);
    const areaEpsilon = epsilon * size;
    // 创建/编辑过程允许点数不足，所有生成器通过空边表返回空几何。
    let edgeCount;
    let minimumPoints: number = 2;
    // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
    if (closed) {
        minimumPoints = 3;
    }
    // 编辑中的点数不足时保留空边表，不中断整个项目。
    if (points.length < minimumPoints) {
        edgeCount = 0;
    } else {
        // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
        if (closed) {
            edgeCount = points.length;
        } else {
            edgeCount = points.length - 1;
        }
    }
    // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
    if (closed) {
        let area = 0;
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let i = 1; i < points.length - 1; i++) {
            area += Cross(points[0], points[i], points[i + 1]);
        }
        // 处理转向与退化边界，避免零面积三角面或不稳定法线。
        if (area < 0) {
            points.reverse();
        }
    }
    const normals: [number, number][] = [];
    const lengths: number[] = [];
    const distances: number[] = [0];
    let length = 0;
    // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
    for (let i = 0; i < edgeCount; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const edgeLength = Math.hypot(dx, dy);
        normals.push([dy / edgeLength, -dx / edgeLength]);
        lengths.push(edgeLength);
        length += edgeLength;
        distances.push(length);
    }
    return {
        points: Object.freeze(points),
        closed,
        solid,
        normals,
        lengths,
        distances,
        length,
        minX,
        minY,
        width: maxX - minX,
        height: maxY - minY,
        epsilon: areaEpsilon,
    };
};
/**
 * 计算轮廓连接处的角平分线法线与斜接补偿倍率。
 * @param path 轮廓
 * @param index 节点下标
 * @example
 * JoinNormal(path, index);
 * @returns 单位角平分线法线和斜接补偿倍率
 */
const JoinNormal = (path: Path, index: number): [number, number, number] => {
    const last = path.normals.length - 1;
    let previousIndex: number = index - 1;
    // 首节点按闭合状态选择前一条边，开放折线不能连接到尾部。
    if (index === 0) {
        // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
        if (path.closed) {
            previousIndex = last;
        } else {
            previousIndex = 0;
        }
    }
    const nextIndex: number = Math.min(index, last);
    const a = path.normals[previousIndex];
    const b = path.normals[nextIndex];
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const length = Math.hypot(x, y);
    // 回折没有唯一角平分线，使用出边法线降级，避免阻断线框绘制或产生无穷倍率。
    if (length < 1e-6 === false) {
        const nx = x / length;
        const ny = y / length;
        return [nx, ny, 1 / Math.max(nx * b[0] + ny * b[1], 1e-6)];
    } else {
        return [b[0], b[1], 1];
    }
};
/**
 * 耳切法支持简单凹多边形；只剔除填充剖分中的共线节点，线框和辅助点保留它们。
 * 自交等路径可能无法耳切，剩余区域改用扇形降级；不实现 evenodd/nonzero 填充规则。
 * @param path 闭合轮廓
 * @example
 * Triangulate(path);
 * @returns 顺时针三角面索引，与 Rect 的正面方向一致
 */
const Triangulate = (path: Path): number[] => {
    const p = path.points;
    /**
     * 建立原始轮廓节点的下标表，供耳切过程删除候选节点。
     * @param _ 当前元素，此回调只使用下标
     * @param i 当前元素下标
     * @example
     * GetVertexIndex(_, i);
     * @returns 当前节点下标。
     */
    const GetVertexIndex = (_: PolyNode, i: number): number => i;
    const remaining = p.map(GetVertexIndex);
    const result: number[] = [];
    // 按轮廓转向和包含关系选择可剖分三角面，无法耳切时保留降级路径。
    if (remaining.length < 3 === false) {
        /**
         * 按约定绕序追加非退化三角面索引。
         * @param a 顶点
         * @param b 顶点
         * @param c 顶点；跳过退化面并保持 CW
         * @example
         * Triangle(a, b, c);
         * @returns 无返回值。
         */
        const Triangle = (a: number, b: number, c: number): void => {
            const area = Cross(p[a], p[b], p[c]);
            // 处理转向与退化边界，避免零面积三角面或不稳定法线。
            if (Math.abs(area) <= path.epsilon === false) {
                // 处理转向与退化边界，避免零面积三角面或不稳定法线。
                if (area > 0) {
                    result.push(a, c, b);
                } else {
                    result.push(a, b, c);
                }
            } else {
                return;
            }
        };
        let changed = true;
        // 逐步消耗待剖分轮廓，保留无法继续耳切时的降级出口。
        while (changed && remaining.length > 3) {
            changed = false;
            // 按当前范围逐项处理，确保下标不越过有效数据。
            for (let i = 0; i < remaining.length; i++) {
                // 按轮廓转向和包含关系选择可剖分三角面，无法耳切时保留降级路径。
                if (
                    Math.abs(
                        Cross(
                            p[remaining[(i + remaining.length - 1) % remaining.length]],
                            p[remaining[i]],
                            p[remaining[(i + 1) % remaining.length]],
                        ),
                    ) <= path.epsilon
                ) {
                    remaining.splice(i, 1);
                    changed = true;
                    break;
                }
            }
        }
        // 逐步消耗待剖分轮廓，保留无法继续耳切时的降级出口。
        while (remaining.length > 3) {
            let found = false;
            // 按当前范围逐项处理，确保下标不越过有效数据。
            for (let i = 0; i < remaining.length; i++) {
                const a = remaining[(i + remaining.length - 1) % remaining.length];
                const b = remaining[i];
                const c = remaining[(i + 1) % remaining.length];
                // 按轮廓转向和包含关系选择可剖分三角面，无法耳切时保留降级路径。
                if (Cross(p[a], p[b], p[c]) <= path.epsilon === false) {
                    /**
                     * 排除三角形自身顶点，再检查剩余点是否位于候选耳内部。
                     * @param v 待检测的轮廓顶点下标
                     * @example
                     * IsInsideEar(v);
                     * @returns 当前点是否阻止该三角形被剖分。
                     */
                    const IsInsideEar = (v: number): boolean =>
                        v !== a &&
                        v !== b &&
                        v !== c &&
                        Cross(p[a], p[b], p[v]) >= -path.epsilon &&
                        Cross(p[b], p[c], p[v]) >= -path.epsilon &&
                        Cross(p[c], p[a], p[v]) >= -path.epsilon;
                    const contains = remaining.some(IsInsideEar);
                    // 按轮廓转向和包含关系选择可剖分三角面，无法耳切时保留降级路径。
                    if (contains === false) {
                        result.push(a, c, b);
                        remaining.splice(i, 1);
                        found = true;
                        break;
                    } else {
                        continue;
                    }
                } else {
                    continue;
                }
            }
            // 按轮廓转向和包含关系选择可剖分三角面，无法耳切时保留降级路径。
            if (found) {
                continue;
            } else {
                // 有界退出，不因无法找到耳朵而中断整帧；自交区域允许重叠和不规则填充。
                for (let i = 1; i < remaining.length - 1; i++) {
                    Triangle(remaining[0], remaining[i], remaining[i + 1]);
                }
                return result;
            }
        }
        Triangle(remaining[0], remaining[1], remaining[2]);
        return result;
    } else {
        return result;
    }
};
export { CreatePath, Cross, JoinNormal, Nonnegative, Segments, Triangulate };
export type { Path };
