import { Bounds, BoundsOverlap } from "./Input.js";
import { BoolRuntime } from "./Runtime.js";
import { UUID } from "../UUID.js";
import type { BoolGeometry, BoolShape, BoolSource, PreparedInput } from "./types.js";

/** @param shapes 输出连通分量 @param owner 结果的来源归属 @param part 来源内分片编号 @param sources 面积贡献来源 @example CreateOutput(shapes, owner, 0, sources); @returns 可复用的局部几何和恢复世界坐标的矩阵。 */
const CreateOutput = (shapes: BoolShape[], owner: PreparedInput, part: number, sources: BoolSource[]): BoolGeometry => {
    const bounds = Bounds(shapes.flat());
    // 空集由上层 changes 记录，不伪造零尺寸实体。
    if (bounds !== null) {
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const centerX = bounds.minX + width / 2;
        const centerY = bounds.minY + height / 2;
        const localShapes: BoolShape[] = [];
        const vertices: number[] = [];
        const indices: number[] = [];
        // 每个独立分量单独三角化，孔始终与自己的外圈一起传入。
        for (const shape of shapes) {
            const local: BoolShape = [];
            // 先去掉大坐标平移，再做剖分及 Float32 输出，减少抵消误差。
            for (const contour of shape) {
                const points = contour.slice();
                // 同一中心用于所有分量，保证返回一个对象时相对位置保持不变。
                for (let offset = 0; offset < points.length; offset += 2) {
                    points[offset] -= centerX;
                    points[offset + 1] -= centerY;
                }
                local.push(points);
            }
            localShapes.push(local);
            const mesh = BoolRuntime.Run(8, local);
            const vertexCount = mesh[0];
            const base = vertices.length / 2;
            // typed array 大段数据逐项追加，避免 spread 超过 JS 参数栈上限。
            for (let index = 1; index <= vertexCount * 2; index += 1) {
                vertices.push(mesh[index]);
            }
            const indexStart = vertexCount * 2 + 2;
            // 索引按每个分量的顶点偏移合并，不桥接不同岛或孔。
            for (let index = indexStart; index < mesh.length; index += 1) {
                indices.push(base + mesh[index]);
            }
        }
        const geometry = new Float32Array(vertices);
        // 在 CPU 拓扑有效但 GPU 尺寸超范围时明确报错。
        if (geometry.every(Number.isFinite) && Number.isFinite(Math.fround(width)) && Number.isFinite(Math.fround(height))) {
            const uv = new Float32Array(geometry.length);
            // 新切面使用结果包围盒 UV，不继承无法唯一确定的源纹理映射。
            for (let index = 0; index < geometry.length; index += 2) {
                uv[index] = (geometry[index] + width / 2) / width;
                uv[index + 1] = (geometry[index + 1] + height / 2) / height;
            }
            let type: "poly" | "base" = "base";
            const points: [number, number][] = [];
            // 单个无孔闭合轮廓可继续交给多边形编辑器。
            if (localShapes.length === 1 && localShapes[0].length === 1) {
                type = "poly";
                const contour = localShapes[0][0];
                // 有序边界保留双精度，供下一次布尔或编辑使用。
                for (let index = 0; index < contour.length; index += 2) {
                    points.push([contour[index], contour[index + 1]]);
                }
            }
            const contourCounts: number[] = [];
            // 显式存分量关系，禁止后续只保留第一个孔。
            for (const shape of localShapes) {
                contourCounts.push(shape.length);
            }
            return {
                id: UUID(), sourceId: owner.input.id, side: owner.source.side, part, type,
                metadata: owner.input.metadata, sources,
                matrix: [1, 0, 0, 0, 1, 0, centerX, centerY, 1],
                data: { geometry, index: new Uint32Array(indices), normal: new Float32Array(geometry.length),
                    uv, width, height, minX: -width / 2, minY: -height / 2, closed: true,
                    contours: localShapes.flat(), contourCounts, points },
            };
        } else {
            throw new RangeError("Boolean result exceeds Float32 geometry size.");
        }
    } else {
        throw new Error("Cannot create a Boolean geometry from empty contours.");
    }
};

/** @param shapes 待追踪分量 @param inputs 候选来源 @example Contributors(shapes, inputs); @returns 与输出有实体交集的输入引用说明。 */
const Contributors = (shapes: BoolShape[], inputs: readonly PreparedInput[]): BoolSource[] => {
    const paths = shapes.flat();
    const bounds = Bounds(paths);
    const sources: BoolSource[] = [];
    // 包围盒先排除大部分来源，精确谓词只对候选运行且不生成三角面。
    for (const input of inputs) {
        // 仅边界接触不代表对结果填充面积有贡献。
        if (BoundsOverlap(bounds, input.bounds) && BoolRuntime.Run(7, paths, input.paths)[0] === 1) {
            sources.push({ ...input.source });
        }
    }
    return sources;
};

export { Contributors, CreateOutput };
