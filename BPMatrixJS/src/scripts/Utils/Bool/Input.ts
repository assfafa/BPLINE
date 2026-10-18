import { CreatePerimeterPoints, DefaultRectPrecision, NormalizeRectParameters } from "../../Geometry/Rect/perimeter.js";
import { CheckPrecision } from "../Precision.js";
import { BoolRuntime } from "./Runtime.js";
import type { BoolBounds, BoolFillRule, BoolInput, BoolSide, BoolTriangles, PreparedInput } from "./types.js";

/** @param inputs 同一侧输入 @param side 来源侧 @example Prepare(inputs, "a"); @returns 独立规范化轮廓，不修改输入。 */
const Prepare = (inputs: readonly BoolInput[], side: BoolSide): PreparedInput[] => {
    const ids = new Set<string | number>();
    const result: PreparedInput[] = [];
    // 在进入原生运算前验证标识，避免分片追踪对应到错误对象。
    for (const input of inputs) {
        const validId = typeof input.id === "string" || (typeof input.id === "number" && Number.isFinite(input.id));
        // 同一 id 可在 A/B 各出现一次，但同一侧必须唯一。
        if (validId && ids.has(input.id) === false) {
            ids.add(input.id);
            const paths = ReadPaths(input);
            let fill: BoolFillRule = "nonzero";
            // 显式路径支持 evenodd；原生几何及三角网按 nonzero 统一实体区域。
            if (input.type === "contours") {
                fill = input.data.fillRule ?? "nonzero";
                // 运行时 JS 也必须给出受支持的填充规则。
                if (["nonzero", "evenodd"].includes(fill)) {
                    // 填充语义已确定，保留轮廓绕向以表示孔。
                } else {
                    throw new TypeError("Unknown Boolean fillRule.");
                }
            }
            const shapes = BoolRuntime.Shapes(4, paths, [], fill);
            const normalized = shapes.flat();
            result.push({ input, source: { id: input.id, type: input.type, side },
                paths: normalized, shapes, bounds: Bounds(normalized) });
        } else {
            throw new TypeError("Boolean input ids must be finite numbers or strings, unique within each side.");
        }
    }
    return result;
};

/** @param input 原始几何及可选矩阵 @example ReadPaths(input); @returns 共同空间中的路径；三角网输出同绕向三角形。 */
const ReadPaths = (input: BoolInput): Float64Array[] => {
    let paths: Float64Array[];
    // 连续轮廓类型直接读参数，不生成或扫描三角面。
    switch (input.type) {
        case "rect": {
            const rect = input.data;
            const parameters = NormalizeRectParameters(rect.width, rect.height, rect.radius ?? 0);
            const precision = CheckPrecision(rect.precision ?? DefaultRectPrecision(rect.width, rect.height, rect.radius ?? 0));
            const points = CreatePerimeterPoints(parameters.halfWidth, parameters.halfHeight, parameters.radius, precision, true);
            paths = [new Float64Array(points.flat())];
            break;
        }
        case "ngon": {
            const ngon = input.data;
            const inner = ngon.inter ?? 0.5;
            const angle = ngon.startAngle ?? 0;
            // 与 NGon 的有效边数、非负半径契约保持一致。
            if (Number.isInteger(ngon.sides) && ngon.sides >= 2 && ngon.sides <= 65536 &&
                Number.isFinite(ngon.outer) && ngon.outer >= 0 && Number.isFinite(inner) && inner >= 0 && Number.isFinite(angle)) {
                paths = [];
                // 两边或零半径没有填充区域；相等的内外圈会在 nonzero 中抵消。
                if (ngon.sides >= 3 && ngon.outer > 0) {
                    paths.push(NGonPath(ngon.sides, ngon.outer, angle, false));
                    // 内圈反向以表示孔，不能与外圈同向累加。
                    if (ngon.hole === true && inner > 0) {
                        paths.push(NGonPath(ngon.sides, Math.min(inner, ngon.outer), angle, true));
                    }
                }
            } else {
                throw new RangeError("Invalid Boolean NGon parameters.");
            }
            break;
        }
        case "poly": {
            // 开放折线没有定义面积，禁止自动闭合改变用户的几何。
            if (input.data.closed === false) {
                throw new TypeError("Boolean operations require closed polygon areas.");
            } else {
                const path = new Float64Array(input.data.points.length * 2);
                let cursor = 0;
                // 兼容数学库 Poly 的对象节点及简写元组。
                for (const point of input.data.points) {
                    // PolyNode 有 x/y；元组按序读取，不依赖 class 身份。
                    if ("x" in point) {
                        path[cursor++] = point.x;
                        path[cursor++] = point.y;
                    } else {
                        path[cursor++] = point[0];
                        path[cursor++] = point[1];
                    }
                }
                paths = [path];
            }
            break;
        }
        case "base":
        case "text": {
            let triangles = input.data;
            // Text 实例使用 data，原始 Base 数组则可直接传入。
            if ("data" in triangles) {
                triangles = triangles.data;
            }
            paths = TrianglePaths(triangles);
            break;
        }
        case "contours": {
            paths = [];
            // 复制外部路径，后面的矩阵变换不会改写调用方数组。
            for (const contour of input.data.contours) {
                paths.push(new Float64Array(contour));
            }
            break;
        }
        default:
            throw new TypeError("Unsupported Boolean geometry type.");
    }
    const matrix = ReadMatrix(input);
    // 仿射变换保持同一实体内部的相对绕向；镜像后 nonzero 仍可正确解释孔。
    for (const path of paths) {
        // 原生协议只接受成对 xy，避免截断最后一个分量。
        if (path.length % 2 === 0 && path.length <= 2000000) {
            // 双精度完成世界变换，GPU Float32 数据只在输出阶段生成。
            for (let index = 0; index < path.length; index += 2) {
                const x = path[index];
                const y = path[index + 1];
                const worldX = matrix[0] * x + matrix[3] * y + matrix[6];
                const worldY = matrix[1] * x + matrix[4] * y + matrix[7];
                // 避免非有限值进入原生整数坐标映射。
                if (Number.isFinite(worldX) && Number.isFinite(worldY) && Math.abs(worldX) <= 1e100 && Math.abs(worldY) <= 1e100) {
                    path[index] = worldX;
                    path[index + 1] = worldY;
                } else {
                    throw new RangeError("Boolean coordinates must be finite and within +/-1e100.");
                }
            }
        } else {
            throw new RangeError("Boolean contours require paired xy coordinates and at most 1000000 points.");
        }
    }
    return paths;
};

/** @param input 带可选仿射变换的输入 @example ReadMatrix(input); @returns 九个有限的列主序矩阵分量。 */
const ReadMatrix = (input: BoolInput): ArrayLike<number> => {
    let matrix: ArrayLike<number> = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    // Mat3 与直接数组均可使用，避免数学库引用渲染层对象。
    if (input.matrix !== undefined) {
        // 结构类型既支持库实例，也支持普通可序列化数组。
        if ("data" in input.matrix) {
            matrix = input.matrix.data;
        } else {
            matrix = input.matrix;
        }
    }
    // 投影变换不属于二维编辑器布尔运算的输入契约。
    if (matrix.length === 9 && Array.from(matrix).every(Number.isFinite) && matrix[2] === 0 && matrix[5] === 0 && matrix[8] === 1) {
        return matrix;
    } else {
        throw new TypeError("Boolean matrix must be a finite affine column-major Mat3.");
    }
};

/** @param sides 边数 @param radius 半径 @param angle 起始角 @param reverse 是否反转 @example NGonPath(6, 10, 0, false); @returns 仅边界节点。 */
const NGonPath = (sides: number, radius: number, angle: number, reverse: boolean): Float64Array => {
    const points = new Float64Array(sides * 2);
    // 使用与 NGon 相同的角度公式，保留外圈和内圈的顶点对应关系。
    for (let index = 0; index < sides; index += 1) {
        let vertex = index;
        // 反转整个轮廓，不改变采样的角度集合。
        if (reverse) {
            vertex = sides - index - 1;
        }
        const radians = angle + vertex * Math.PI * 2 / sides;
        points[index * 2] = Math.cos(radians) * radius;
        points[index * 2 + 1] = Math.sin(radians) * radius;
    }
    return points;
};

/** @param data 实体三角网 @example TrianglePaths(data); @returns 同绕向三角轮廓，重叠三角形按并集而不是奇偶抵消。 */
const TrianglePaths = (data: BoolTriangles): Float64Array[] => {
    const vertices = data.geometry;
    const count = vertices.length / 2;
    let indices: ArrayLike<number> = data.index ?? [];
    // 缺省索引为顺序三角形；显式空索引保持空面。
    if (data.index === undefined) {
        indices = Uint32Array.from({ length: count }, SequentialIndex);
    }
    // 拒绝不完整输入，不能让无效索引变成坐标 NaN。
    if (Number.isInteger(count) && count <= 1000000 && indices.length % 3 === 0 &&
        (data.vertexType === undefined || data.vertexType.length === count)) {
        const paths: Float64Array[] = [];
        // 每个三角形只编码实体，不让渲染边框/点型参与布尔面积。
        for (let offset = 0; offset < indices.length; offset += 3) {
            const a = indices[offset];
            const b = indices[offset + 1];
            const c = indices[offset + 2];
            const valid = [a, b, c].every(IsIndex);
            // 上界依赖当前数组，不能只检查整数性。
            if (valid && a < count && b < count && c < count) {
                const types = data.vertexType;
                // 非实体三角形忽略，但已校验索引合法性。
                if (types === undefined || (types[a] === 0 && types[b] === 0 && types[c] === 0)) {
                    const ax = vertices[a * 2];
                    const ay = vertices[a * 2 + 1];
                    const bx = vertices[b * 2];
                    const by = vertices[b * 2 + 1];
                    const cx = vertices[c * 2];
                    const cy = vertices[c * 2 + 1];
                    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
                    // 校验先于退化剔除，防止 NaN 被误当成零面积。
                    if ([ax, ay, bx, by, cx, cy, cross].every(Number.isFinite)) {
                        // 统一为 CCW，镜像变换后整组三角形会一起反向。
                        if (cross > 0) {
                            paths.push(new Float64Array([ax, ay, bx, by, cx, cy]));
                        } else if (cross < 0) {
                            // 负绕向的三角形翻转，零面积三角形被忽略。
                            paths.push(new Float64Array([ax, ay, cx, cy, bx, by]));
                        }
                    } else {
                        throw new RangeError("Boolean triangles contain non-finite coordinates.");
                    }
                }
            } else {
                throw new RangeError("Boolean triangle index is out of range.");
            }
        }
        return paths;
    } else {
        throw new RangeError("Invalid Boolean triangle buffer lengths.");
    }
};

/** @param value 索引值 @example IsIndex(3); @returns 是否为非负整数。 */
const IsIndex = (value: number): boolean => Number.isInteger(value) && value >= 0;
/** @param _ 未使用元素 @param index 顺序下标 @example SequentialIndex(undefined, 0); @returns 下标。 */
const SequentialIndex = (_: unknown, index: number): number => index;

/** @param paths 同一坐标空间的轮廓 @example Bounds(paths); @returns 包围盒；空路径返回 null。 */
const Bounds = (paths: readonly Float64Array[]): BoolBounds | null => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // 所有路径都参与包围盒，包括独立分量与孔。
    for (const path of paths) {
        // 配对遍历不创建临时点对象。
        for (let index = 0; index < path.length; index += 2) {
            minX = Math.min(minX, path[index]);
            minY = Math.min(minY, path[index + 1]);
            maxX = Math.max(maxX, path[index]);
            maxY = Math.max(maxY, path[index + 1]);
        }
    }
    // 空几何不应因零点包围盒与其他几何误判相交。
    if (Number.isFinite(minX)) {
        return { minX, minY, maxX, maxY };
    } else {
        return null;
    }
};

/** @param a 第一个包围盒 @param b 第二个包围盒 @example BoundsOverlap(a, b); @returns 包围盒是否接触或重叠，true 仍需精确检测。 */
const BoundsOverlap = (a: BoolBounds | null, b: BoolBounds | null): boolean => {
    // 接触边也保留到精确检测，避免宽相位漏掉边界碰撞。
    if (a !== null && b !== null) {
        return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
    } else {
        return false;
    }
};

export { Bounds, BoundsOverlap, Prepare, ReadPaths };
