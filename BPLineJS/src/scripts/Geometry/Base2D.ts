import type { PolyPoint } from "bpmatrixjs/Geometry/Poly";
import { CreatePolyBorderGeometry, CreatePolyPointGeometry } from "bpmatrixjs/Geometry/Poly";
import type Style from "../Style";
import type { GeoData, GeoPartDataLike } from "./Geo";
import Geo from "./Geo";
import { InferContours } from "./BaseContours";

/** 用户直接提供已三角剖分的顶点；缺省属性补零，索引缺省为顺序三角形。 */
class Base2D extends Geo implements Base2DLike {
    public readonly type = "Base2D" as const;
    private _input: Base2DOptions;

    /**
     * 创建直接顶点几何体；未提供轮廓时尝试从规则三角网提取外环与内环。
     * @param options 顶点及可选属性
     * @example
     * const geometry = new Base2D({ vertices: new Float32Array([0, 0, 1, 0, 0, 1]) });
     * @returns 几何对象。
     */
    public constructor(options: Base2DOptions) {
        super(options.style);
        this._input = CopyOptions(options);
        this.updateGeometry();
    }

    /** @example const rings = base.contours; @returns 外轮廓与内轮廓的独立坐标副本。 */
    public get contours(): readonly Float32Array[] {
        const contours = this._input.contours ?? [];
        return contours.map(CloneContour);
    }

    /** @example const input = base.getData(); @returns 原始输入数组的独立副本，不含按 Style 生成的辅助边框和关键点。 */
    public getData(): Base2DOptions {
        return CopyOptions(this._input);
    }

    /**
     * 移动一个轮廓节点，并同步所有位于原位置的三角面顶点。
     * @param contourIndex 轮廓编号
     * @param vertexIndex 轮廓中的节点编号
     * @param x 新的局部 X 坐标
     * @param y 新的局部 Y 坐标
     * @example base.setContourPoint(0, 2, 10, 20);
     * @returns 是否找到对应轮廓节点。
     */
    public setContourPoint(contourIndex: number, vertexIndex: number, x: number, y: number): boolean {
        const contour = this._input.contours?.[contourIndex];
        // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
        if (contour !== undefined && Number.isFinite(x) && Number.isFinite(y) &&
            Number.isInteger(vertexIndex) && vertexIndex >= 0 && vertexIndex * 2 + 1 < contour.length) {
            const offset = vertexIndex * 2;
            const oldX = contour[offset];
            const oldY = contour[offset + 1];
            const deltaX = x - oldX;
            const deltaY = y - oldY;
            const vertices = this._input.vertices.slice();
            const position = this._input.position?.slice();
            // 同一轮廓点在分离的三角形与边框中可能有多份顶点，须一起移动。
            for (let index = 0; index < vertices.length; index += 2) {
                // 逐顶点同步相关属性，防止三角面接缝或索引越界。
                if (vertices[index] === oldX && vertices[index + 1] === oldY) {
                    vertices[index] = x;
                    vertices[index + 1] = y;
                } else if (position !== undefined && this._input.vertexType?.[index / 2] === 1 &&
                    position[index] === oldX && position[index + 1] === oldY) {
                    // 点图标的三角形围绕中心展开，全部顶点和中心须一起平移。
                    vertices[index] += deltaX;
                    vertices[index + 1] += deltaY;
                }
                // 逐顶点同步相关属性，防止三角面接缝或索引越界。
                if (position?.[index] === oldX && position[index + 1] === oldY) {
                    position[index] = x;
                    position[index + 1] = y;
                }
            }
            const nextContours = this._input.contours?.map(CloneContour) ?? [];
            // 两个边界共享同一坐标时保持同一个节点位置，避免裂缝。
            for (const ring of nextContours) {
                // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
                for (let point = 0; point < ring.length; point += 2) {
                    // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
                    if (ring[point] === oldX && ring[point + 1] === oldY) {
                        ring[point] = x;
                        ring[point + 1] = y;
                    }
                }
            }
            const linePoints = this._input.linePoints;
            let nextLinePoints = linePoints;
            // 输入必须保持完整且有限，避免无效坐标进入 GPU 缓冲。
            if (linePoints !== undefined) {
                const geometry = linePoints.geometry.slice();
                // 只有可用的几何数据进入变换，缺失数据保持原样。
                for (let point = 0; point < geometry.length; point += 2) {
                    // 只有可用的几何数据进入变换，缺失数据保持原样。
                    if (geometry[point] === oldX && geometry[point + 1] === oldY) {
                        geometry[point] = x;
                        geometry[point + 1] = y;
                    }
                }
                nextLinePoints = { ...linePoints, geometry };
            }
            this.setData({ ...this._input, vertices, position, linePoints: nextLinePoints,
                contours: nextContours, style: this.style });
            return true;
        } else {
            return false;
        }
    }

    /**
     * 拆分轮廓边上的实体三角形，插入一个可继续拖动的边界节点。
     * @param contourIndex 轮廓编号
     * @param edgeIndex 起点节点编号，末节点连接首节点
     * @param ratio 新节点沿当前边的比例，须在 0 与 1 之间
     * @example base.insertContourPoint(0, 1, 0.5);
     * @returns 是否找到对应的实体三角形边并完成插入。
     */
    public insertContourPoint(contourIndex: number, edgeIndex: number, ratio: number): boolean {
        const contour = this._input.contours?.[contourIndex];
        // 只拆分有两个不同端点的已闭合轮廓边。
        if (contour !== undefined && contour.length >= 6 && Number.isInteger(edgeIndex) &&
            edgeIndex >= 0 && edgeIndex < contour.length / 2 && Number.isFinite(ratio) &&
            ratio > 0 && ratio < 1) {
            const endIndex = (edgeIndex + 1) % (contour.length / 2);
            const startX = contour[edgeIndex * 2];
            const startY = contour[edgeIndex * 2 + 1];
            const endX = contour[endIndex * 2];
            const endY = contour[endIndex * 2 + 1];
            const pointX = Math.fround(startX + (endX - startX) * ratio);
            const pointY = Math.fround(startY + (endY - startY) * ratio);
            const input = this._input;
            const indices = input.index;
            const triangleCount = (indices?.length ?? input.vertices.length / 2) / 3;
            const rebuilt: BaseTriangleData = {
                vertices: [],
            };
            // 显式顶点属性与实体三角面一起拆分，缺省属性仍保持缺省。
            if (input.uv !== undefined) {
                rebuilt.uv = [];
            }
            // 法线保留原来的可选状态。
            if (input.normal !== undefined) {
                rebuilt.normal = [];
            }
            // 坐标中心属性与新三角面保持一致。
            if (input.position !== undefined) {
                rebuilt.position = [];
            }
            // 已提供的斜接比例也按边插值。
            if (input.miterScale !== undefined) {
                rebuilt.miterScale = [];
            }
            let splitCount = 0;
            // 只保留实体面；轮廓编辑后由当前样式重新生成边框和关键点。
            for (let triangle = 0; triangle < triangleCount; triangle++) {
                const corners = [
                    indices?.[triangle * 3] ?? triangle * 3,
                    indices?.[triangle * 3 + 1] ?? triangle * 3 + 1,
                    indices?.[triangle * 3 + 2] ?? triangle * 3 + 2,
                ];
                let solid = true;
                // 任一角来自边框或关键点时，整个三角形都属于装饰分区。
                for (const vertex of corners) {
                    // 边框和关键点不能参与实体面的拆分。
                    if (input.vertexType !== undefined && input.vertexType[vertex] !== 0) {
                        solid = false;
                    }
                }
                // 装饰三角面不能作为可编辑轮廓的实体边。
                if (solid) {
                    let matchingEdge = -1;
                    // 两个端点可能与三角形的方向相反，因此按坐标识别边。
                    for (let edge = 0; edge < 3; edge++) {
                        const first = corners[edge];
                        const second = corners[(edge + 1) % 3];
                        const firstX = input.vertices[first * 2];
                        const firstY = input.vertices[first * 2 + 1];
                        const secondX = input.vertices[second * 2];
                        const secondY = input.vertices[second * 2 + 1];
                        const forward = firstX === startX && firstY === startY &&
                            secondX === endX && secondY === endY;
                        const backward = firstX === endX && firstY === endY &&
                            secondX === startX && secondY === startY;
                        // 命中的实体边拆成两个同向三角形。
                        if (forward || backward) {
                            matchingEdge = edge;
                        }
                    }
                    // 保持三角形绕向以及全部输入顶点属性。
                    if (matchingEdge >= 0) {
                        const first = corners[matchingEdge];
                        const second = corners[(matchingEdge + 1) % 3];
                        const opposite = corners[(matchingEdge + 2) % 3];
                        let interpolation = ratio;
                        // 反向边的属性插值也需要跟随实际三角形方向。
                        if (input.vertices[first * 2] === endX && input.vertices[first * 2 + 1] === endY) {
                            interpolation = 1 - ratio;
                        }
                        AppendBaseVertex(rebuilt, input, first);
                        AppendBaseEdgeVertex(rebuilt, input, first, second, interpolation, pointX, pointY);
                        AppendBaseVertex(rebuilt, input, opposite);
                        AppendBaseEdgeVertex(rebuilt, input, first, second, interpolation, pointX, pointY);
                        AppendBaseVertex(rebuilt, input, second);
                        AppendBaseVertex(rebuilt, input, opposite);
                        splitCount += 1;
                    } else {
                        // 其他实体三角形照原顺序复制，不改变内部剖分。
                        for (const vertex of corners) {
                            AppendBaseVertex(rebuilt, input, vertex);
                        }
                    }
                }
            }
            // 找不到共享实体边时不生成仅有手柄、没有面对应的假节点。
            const atStart = pointX === startX && pointY === startY;
            const atEnd = pointX === endX && pointY === endY;
            // 投影过于靠近端点时由顶点拾取负责，不制造重合的轮廓节点。
            if (splitCount > 0 && !atStart && !atEnd) {
                const nextContours = input.contours?.map(CloneContour) ?? [];
                const before = Array.from(contour.slice(0, (edgeIndex + 1) * 2));
                const after = Array.from(contour.slice((edgeIndex + 1) * 2));
                nextContours[contourIndex] = new Float32Array([...before, pointX, pointY, ...after]);
                this.setData({
                    vertices: new Float32Array(rebuilt.vertices),
                    uv: ToFloat32(rebuilt.uv),
                    normal: ToFloat32(rebuilt.normal),
                    position: ToFloat32(rebuilt.position),
                    miterScale: ToFloat32(rebuilt.miterScale),
                    contours: nextContours,
                    style: this.style,
                });
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
    /** @param source 来源基础几何体 @example target.copy(source); @returns 当前基础几何体。 */
    public override copy(source: Base2D): this {
        this.copyPrecision(source);
        this.setData({ ...source._input, style: source.style.clone() });
        return this;
    }

    /** @example const duplicate = base.clone(); @returns 独立顶点数组和样式的基础几何体。 */
    public override clone(): Base2D {
        return new Base2D({ ...this._input, style: this.style.clone() });
    }

    /**
     * 替换顶点与属性；同尺寸更新在 Render 中复用 GPUBuffer。
     * @param options 新的完整几何描述
     * @example
     * geometry.setData({ vertices: nextVertices, uv: nextUv, index: nextIndices });
     * @returns 无返回值。
     */
    public setData(options: Base2DOptions): void {
        this._input = CopyOptions(options);
        // 显式传入样式时同步几何的生成设置。
        if (options.style !== undefined && options.style !== this.style) {
            this.style = options.style;
        }
        this.updateGeometry();
    }

    /**
     * 将输入数组装入 Geo 的统一三角面结构。
     * @example
     * geometry.updateGeometry();
     * @returns 当前几何对象。
     */
    public override updateGeometry(): this {
        const input = this._input;
        const vertices = input.vertices;
        const vertexCount = vertices.length / 2;
        this._geometry = vertices;
        this.normal = input.normal ?? new Float32Array(vertices.length);
        this.uv = input.uv ?? new Float32Array(vertices.length);
        this.position = input.position ?? new Float32Array(vertices.length);
        this.vertexType = input.vertexType ?? new Float32Array(vertexCount);
        this.miterScale = input.miterScale ?? new Float32Array(vertexCount).fill(1);
        this.linePoints = input.linePoints;
        // 没有索引时按连续三点生成一个三角形。
        if (input.index === undefined) {
            let index: Uint16Array | Uint32Array;
            // Uint16 索引的最大合法顶点编号为 65535。
            if (vertexCount > 65536) {
                index = new Uint32Array(vertexCount);
            } else {
                index = new Uint16Array(vertexCount);
            }
            // 填写顺序索引，保持用户给出的三角形顺序。
            for (let vertex = 0; vertex < vertexCount; vertex += 1) {
                index[vertex] = vertex;
            }
            this.index = index;
        } else {
            this.index = input.index;
        }
        // 原始 Base 三角网没有参数化点型时，按轮廓生成与 Poly2D 相同的关键点分区。
        /** @param type 输入顶点分区值 @example IsPointVertex(1); @returns 是否已带点型分区。 */
        const IsPointVertex = (type: number): boolean => type === 1;
        const hasPointVertices = input.vertexType?.some(IsPointVertex) ?? false;
        /** @param type 输入顶点分区值 @example IsEdgeVertex(0.5); @returns 是否已带边框分区。 */
        const IsEdgeVertex = (type: number): boolean => type === 0.5;
        const hasEdgeVertices = input.vertexType?.some(IsEdgeVertex) ?? false;
        // 已烘焙的边框与点型不重复生成，其余轮廓分区由当前 Style 决定。
        if ((!hasEdgeVertices && this.style.edge.enabled) ||
            (!hasPointVertices && this.style.points.enabled)) {
            this.appendContourDecorations(hasEdgeVertices, hasPointVertices);
        }
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        // 根据原始顶点计算局部包围盒，供基础材质使用。
        for (let offset = 0; offset < vertices.length; offset += 2) {
            minX = Math.min(minX, vertices[offset]);
            maxX = Math.max(maxX, vertices[offset]);
            minY = Math.min(minY, vertices[offset + 1]);
            maxY = Math.max(maxY, vertices[offset + 1]);
        }
        let width = 0;
        let height = 0;
        // 空几何使用零尺寸，避免 Infinity 进入 uniform。
        if (vertexCount > 0) {
            width = maxX - minX;
            height = maxY - minY;
        }
        this.uniformData.set([width, height, 0, this.style.edge.width]);
        super.updateGeometry();
        return this;
    }

    /** @param hasEdge 已带边框 @param hasPoint 已带点型 @example this.appendContourDecorations(false, false); @returns 无返回值。 */
    private appendContourDecorations(hasEdge: boolean, hasPoint: boolean): void {
        const point = this.style.points;
        const edge = this.style.edge;
        const contours = this._input.contours ?? [];
        const parts: { data: GeoPartDataLike; type: number }[] = [];
        // 外环和孔环分别生成边框，避免不相邻的环被错误连接。
        for (const contour of contours) {
            const nodes: PolyPoint[] = [];
            // 输入轮廓中的坐标成对排列。
            for (let offset = 0; offset < contour.length; offset += 2) {
                nodes.push({ x: contour[offset], y: contour[offset + 1] });
            }
            // 退化轮廓不能形成有面积的宽边框。
            if (nodes.length >= 3 && edge.enabled && edge.width > 0 && !hasEdge) {
                parts.push({
                    data: CreatePolyBorderGeometry(nodes, edge.width, edge.uvRepeat,
                        edge.borderAlign, { closed: true, solid: false }),
                    type: 0.5,
                });
            }
        }
        // 关键点排在边框之后，保证点标记覆盖自身的边框。
        for (const contour of contours) {
            const nodes: PolyPoint[] = [];
            // 与边框使用同一有序轮廓，内部剖分节点不会进入点分区。
            for (let offset = 0; offset < contour.length; offset += 2) {
                nodes.push({ x: contour[offset], y: contour[offset + 1] });
            }
            // 顶点与边中点可独立开关；两者都关时没有点分区。
            if (nodes.length >= 2 && point.enabled && !hasPoint && (point.vertices || point.midpoints)) {
                parts.push({
                    data: CreatePolyPointGeometry(nodes, point.radius, point.segments,
                        point.vertices, point.midpoints, point.minPointsLength,
                        point.minEdgePointsLength, { closed: true, solid: false }),
                    type: 1,
                });
            }
        }
        const baseVertices = this._geometry ?? new Float32Array(0);
        const baseCount = baseVertices.length / 2;
        let addedVertices = 0;
        let addedIndices = 0;
        // 先算完整容量，后续只做一次数组分配。
        for (const part of parts) {
            addedVertices += part.data.geometry.length / 2;
            addedIndices += part.data.index.length;
        }
        // 空点分区维持原始缓冲，不触碰直接输入的三角面。
        if (addedIndices > 0) {
            const count = baseCount + addedVertices;
            const geometry = new Float32Array(count * 2);
            const normal = new Float32Array(count * 2);
            const uv = new Float32Array(count * 2);
            const position = new Float32Array(count * 2);
            const vertexType = new Float32Array(count);
            const miterScale = new Float32Array(count).fill(1);
            let index: Uint16Array | Uint32Array;
            // 合并后的顶点编号超过 Uint16 时提升为 Uint32。
            if (count > 65536) {
                index = new Uint32Array((this.index?.length ?? 0) + addedIndices);
            } else {
                index = new Uint16Array((this.index?.length ?? 0) + addedIndices);
            }
            geometry.set(baseVertices);
            normal.set(this.normal ?? new Float32Array(baseVertices.length));
            uv.set(this.uv ?? new Float32Array(baseVertices.length));
            position.set(this.position ?? new Float32Array(baseVertices.length));
            vertexType.set(this.vertexType ?? new Float32Array(baseCount));
            miterScale.set(this.miterScale ?? new Float32Array(baseCount).fill(1));
            index.set(this.index ?? new Uint16Array(0));
            let vertexOffset = baseCount;
            let indexOffset = this.index?.length ?? 0;
            // 每个独立轮廓的索引都加上前面分区的顶点偏移。
            for (const part of parts) {
                const data = part.data;
                const partCount = data.geometry.length / 2;
                geometry.set(data.geometry, vertexOffset * 2);
                normal.set(data.normal, vertexOffset * 2);
                uv.set(data.uv, vertexOffset * 2);
                position.set(data.position ?? new Float32Array(data.geometry.length), vertexOffset * 2);
                miterScale.set(data.miterScale ?? new Float32Array(partCount).fill(1), vertexOffset);
                vertexType.fill(part.type, vertexOffset, vertexOffset + partCount);
                // 输入索引仍为该环的局部下标，写入时换成合并下标。
                for (const originalIndex of data.index) {
                    index[indexOffset] = originalIndex + vertexOffset;
                    indexOffset += 1;
                }
                vertexOffset += partCount;
            }
            this._geometry = geometry;
            this.normal = normal;
            this.uv = uv;
            this.position = position;
            this.vertexType = vertexType;
            this.miterScale = miterScale;
            this.index = index;
        }
    }
}

interface Base2DOptions {
    vertices: Float32Array;
    /** 可编辑的外轮廓与内轮廓；每条轮廓使用局部 [x, y, ...] 坐标。 */
    contours?: readonly Float32Array[];
    uv?: Float32Array;
    normal?: Float32Array;
    index?: Uint16Array | Uint32Array;
    vertexType?: Float32Array;
    position?: Float32Array;
    miterScale?: Float32Array;
    /** 可选的原生线段；参数化图形转成 Base2D 后仍可保留线框。 */
    linePoints?: GeoPartDataLike;
    style?: Style;
}

interface Base2DLike extends GeoData {
    readonly type: "Base2D";
    /** 仅包含可编辑的外轮廓和内轮廓，不包含内部剖分节点。 */
    readonly contours: readonly Float32Array[];
    /** @example const input = base.getData(); @returns 原始顶点属性与轮廓的独立数组副本。 */
    getData(): Base2DOptions;
    /**
     * 替换完整的顶点数据。
     * @param options 顶点和属性
     * @example
     * geometry.setData({ vertices });
     * @returns 无返回值。
     */
    setData(options: Base2DOptions): void;
    /**
     * 修改一个轮廓节点及对应的实体顶点。
     * @param contourIndex 轮廓编号
     * @param vertexIndex 节点编号
     * @param x 新的局部 X 坐标
     * @param y 新的局部 Y 坐标
     * @example geometry.setContourPoint(0, 1, 10, 20);
     * @returns 是否成功修改。
     */
    setContourPoint(contourIndex: number, vertexIndex: number, x: number, y: number): boolean;
    /**
     * 在轮廓边上插入一个可编辑节点。
     * @param contourIndex 轮廓编号
     * @param edgeIndex 边的起点编号
     * @param ratio 边上的插入比例
     * @example geometry.insertContourPoint(0, 1, 0.5);
     * @returns 是否成功拆分实体边。
     */
    insertContourPoint(contourIndex: number, edgeIndex: number, ratio: number): boolean;
}

interface BaseTriangleData {
    vertices: number[];
    uv?: number[];
    normal?: number[];
    position?: number[];
    miterScale?: number[];
}

/** @param values 可选数字属性 @example ToFloat32([0, 1]); @returns 新数组或 undefined。 */
const ToFloat32 = (values: number[] | undefined): Float32Array | undefined => {
    let result: Float32Array | undefined;
    // 未提供的属性让 Base2D 保持默认生成方式。
    if (values !== undefined) {
        result = new Float32Array(values);
    }
    return result;
};

/**
 * 把源顶点或边上插值点的全部属性写入新的实体三角面。
 * @param target 正在构建的三角面数组
 * @param source 原始几何输入
 * @param first 起点顶点编号
 * @param second 可选终点顶点编号
 * @param ratio 从起点到终点的插值比例
 * @example AppendBaseVertex(target, source, 0, 1, 0.5);
 * @returns 无返回值。
 */
const AppendBaseVertex = (target: BaseTriangleData, source: Base2DOptions,
    first: number, second: number = first, ratio: number = 0): void => {
    /** @param values 顶点属性数组 @example ReadPair(source.uv); @returns 插值后的二维属性。 */
    const ReadPair = (values: Float32Array): [number, number] => {
        const x = values[first * 2] + (values[second * 2] - values[first * 2]) * ratio;
        const y = values[first * 2 + 1] + (values[second * 2 + 1] - values[first * 2 + 1]) * ratio;
        return [x, y];
    };
    target.vertices.push(...ReadPair(source.vertices));
    // 缺省属性继续保持缺省；显式属性按同一插值比例写入。
    // 保留所有实际输入的数值格式，以免新插入顶点出现材质接缝。
    if (source.uv !== undefined && target.uv !== undefined) {
        target.uv.push(...ReadPair(source.uv));
    }
    // 每项属性各自可选，因此分别检查后再插值。
    if (source.normal !== undefined && target.normal !== undefined) {
        target.normal.push(...ReadPair(source.normal));
    }
    // 关键点中心属性须跟随几何位置。
    if (source.position !== undefined && target.position !== undefined) {
        target.position.push(...ReadPair(source.position));
    }
    // 缩放辅助属性同样沿新节点所在的边连续变化。
    if (source.miterScale !== undefined && target.miterScale !== undefined) {
        const scale = source.miterScale[first] +
            (source.miterScale[second] - source.miterScale[first]) * ratio;
        target.miterScale.push(scale);
    }
};

/**
 * 插入边界节点时固定几何与轮廓使用同一 Float32 坐标。
 * @param target 正在构建的三角面数组
 * @param source 原始几何输入
 * @param first 三角形边的起点编号
 * @param second 三角形边的终点编号
 * @param ratio 属性插值比例
 * @param x 轮廓节点的 X 坐标
 * @param y 轮廓节点的 Y 坐标
 * @example AppendBaseEdgeVertex(target, source, 0, 1, 0.5, 10, 20);
 * @returns 无返回值。
 */
const AppendBaseEdgeVertex = (target: BaseTriangleData, source: Base2DOptions,
    first: number, second: number, ratio: number, x: number, y: number): void => {
    AppendBaseVertex(target, source, first, second, ratio);
    const last = target.vertices.length - 2;
    target.vertices[last] = x;
    target.vertices[last + 1] = y;
};

/**
 * 复制并验证全部顶点数组，避免外部原地修改绕过版本通知。
 * @param options 输入数据
 * @example
 * CopyOptions(options);
 * @returns 自有数组构成的输入快照。
 */
const CopyOptions = (options: Base2DOptions): Base2DOptions => {
    const vertices = options.vertices;
    // 顶点必须由完整的 x/y 对组成。
    if (!(vertices instanceof Float32Array) || vertices.length % 2 !== 0) {
        throw new TypeError("Base2D vertices must be complete Float32Array x/y pairs.");
    }
    const vertexCount = vertices.length / 2;
    const contours: Float32Array[] = [];
    // 显式轮廓优先；普通共享边三角网可以通过只出现一次的边恢复边界。
    for (const contour of options.contours ?? []) {
        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
        if (!(contour instanceof Float32Array) || contour.length < 4 || contour.length % 2 !== 0) {
            throw new TypeError("Base2D contours must contain complete Float32Array x/y pairs.");
        }
        // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
        for (const coordinate of contour) {
            // 输入必须保持完整且有限，避免无效坐标进入 GPU 缓冲。
            if (!Number.isFinite(coordinate)) {
                throw new RangeError("Base2D contour coordinates must be finite.");
            }
        }
        contours.push(contour.slice());
    }
    // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
    if (options.contours === undefined) {
        contours.push(...InferContours(options));
    }
    // 顺序顶点必须能组成完整三角形。
    if (options.index === undefined && vertexCount % 3 !== 0) {
        throw new RangeError("Base2D sequential vertices must form complete triangles.");
    }
    const attributes = [options.uv, options.normal, options.position];
    // 每个 vec2 属性都与顶点一一对应。
    for (const attribute of attributes) {
        // 缺省属性会在 updateGeometry 中补齐。
        if (attribute !== undefined && (!(attribute instanceof Float32Array) || attribute.length !== vertices.length)) {
            throw new RangeError("Base2D vec2 attributes must match vertices length.");
        }
    }
    // 分区标记按顶点数量校验。
    if (options.vertexType !== undefined && options.vertexType.length !== vertexCount) {
        throw new RangeError("Base2D vertexType length must match vertex count.");
    }
    // 斜接比例按顶点数量校验。
    if (options.miterScale !== undefined && options.miterScale.length !== vertexCount) {
        throw new RangeError("Base2D miterScale length must match vertex count.");
    }
    const index = options.index;
    // 显式索引必须是三角形列表，且不越界。
    if (index !== undefined) {
        // GPU 索引格式仅支持 16 位或 32 位无符号整数。
        if (!(index instanceof Uint16Array) && !(index instanceof Uint32Array)) {
            throw new TypeError("Base2D index must be Uint16Array or Uint32Array.");
        }
        // 三角形列表每三个索引为一组。
        if (index.length % 3 !== 0) {
            throw new RangeError("Base2D indices must form complete triangles.");
        }
        // 避免 GPU 索引读取越过顶点缓冲。
        for (const vertex of index) {
            // 最大索引必须小于顶点总数。
            if (vertex >= vertexCount) {
                throw new RangeError("Base2D index exceeds vertex count.");
            }
        }
    }
    let uv: Float32Array | undefined;
    let normal: Float32Array | undefined;
    let copiedIndex: Uint16Array | Uint32Array | undefined;
    let vertexType: Float32Array | undefined;
    let position: Float32Array | undefined;
    let miterScale: Float32Array | undefined;
    let linePoints: GeoPartDataLike | undefined;
    // 只复制用户提供的可选属性，由几何更新过程补齐缺省值。
    if (options.uv !== undefined) {
        uv = new Float32Array(options.uv);
    }
    // 法线可由调用方完整指定。
    if (options.normal !== undefined) {
        normal = new Float32Array(options.normal);
    }
    // 保留原有索引位宽。
    if (index instanceof Uint32Array) {
        copiedIndex = new Uint32Array(index);
    }
    // 16 位索引复制后保持原位宽。
    if (index instanceof Uint16Array) {
        copiedIndex = new Uint16Array(index);
    }
    // 三角面类型支持实体面、边框面和关键点面。
    if (options.vertexType !== undefined) {
        vertexType = new Float32Array(options.vertexType);
    }
    // 关键点中心和边框斜接比例可以由调用方指定。
    if (options.position !== undefined) {
        position = new Float32Array(options.position);
    }
    // 缺省斜接比例在 updateGeometry 中设为一。
    if (options.miterScale !== undefined) {
        miterScale = new Float32Array(options.miterScale);
    }
    // 输入必须保持完整且有限，避免无效坐标进入 GPU 缓冲。
    if (options.linePoints !== undefined) {
        linePoints = {
            geometry: options.linePoints.geometry.slice(),
            normal: options.linePoints.normal.slice(),
            uv: options.linePoints.uv.slice(),
            index: options.linePoints.index.slice(),
            position: options.linePoints.position?.slice(),
            vertexType: options.linePoints.vertexType?.slice(),
            miterScale: options.linePoints.miterScale?.slice(),
        };
    }
    return {
        vertices: new Float32Array(vertices),
        contours,
        uv,
        normal,
        index: copiedIndex,
        vertexType,
        position,
        miterScale,
        linePoints,
        style: options.style,
    };
};

/** @param contour 来源轮廓 @example const copy = CloneContour(contour); @returns 自有坐标数组。 */
const CloneContour = (contour: Float32Array): Float32Array => contour.slice();

export default Base2D;
export type { Base2DLike, Base2DOptions };
