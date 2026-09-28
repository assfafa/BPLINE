import type { TextOutline, TextPoint } from "./Outline.js";
import type {
    TextBorderAlign,
    TextBorderGeometryData,
    TextGeometryData,
    TextLineGeometryData,
    TextPointGeometryData,
} from "./types.js";

type TextMetadata = Pick<
    TextGeometryData,
    "text" | "fontSize" | "fontFamily" | "lineSpacing" | "letterSpacing" | "textAlign" | "baseline"
>;

/**
 * 根据总顶点数挑选索引位宽。
 * @param count 顶点数量
 * @param values 索引值
 * @example
 * PackIndices(3, [0, 1, 2]);
 * @returns 类型化索引数组
 */
const PackIndices = (count: number, values: readonly number[]): Uint16Array | Uint32Array => {
    // Uint16 可表示下标 65535，共 65536 个顶点。
    if (count > 65536) {
        return new Uint32Array(values);
    } else {
        return new Uint16Array(values);
    }
};

/**
 * 包装文字几何公共度量及缓冲。
 * @param outline 居中轮廓
 * @param metadata 文本参数
 * @param geometry 顶点
 * @param normal 法线
 * @param uv 纹理坐标
 * @param index 索引
 * @example
 * Pack(outline, metadata, geometry, normal, uv, index);
 * @returns 公共几何结构
 */
const Pack = (
    outline: TextOutline,
    metadata: TextMetadata,
    geometry: readonly number[],
    normal: readonly number[],
    uv: readonly number[],
    index: readonly number[],
): TextGeometryData => {
    let anchorX = 0;
    let anchorY = 0;
    // 对齐方式只选择锚点，不移动已经居中的网格。
    if (metadata.textAlign === "left") {
        anchorX = outline.minX;
    } else if (metadata.textAlign === "right") {
        // 右对齐锚点对应整个可见包围盒的右边界。
        anchorX = outline.minX + outline.width;
    }
    // 基线锚点只改变返回坐标，保证顶点继续以可见包围盒居中。
    if (metadata.baseline === "top") {
        anchorY = outline.minY + outline.height;
    } else if (metadata.baseline === "bottom") {
        // 底部锚点对应可见包围盒的下边界。
        anchorY = outline.minY;
    }
    return {
        geometry: new Float32Array(geometry),
        normal: new Float32Array(normal),
        uv: new Float32Array(uv),
        index: PackIndices(geometry.length / 2, index),
        width: outline.width,
        height: outline.height,
        minX: outline.minX,
        minY: outline.minY,
        advanceWidth: outline.advanceWidth,
        anchorX,
        anchorY,
        ...metadata,
    };
};

/**
 * 为填充区域生成包围盒 UV；零尺寸轴返回中线 UV。
 * @param point 顶点
 * @param outline 文字包围盒
 * @example
 * FillUv(point, outline);
 * @returns UV 坐标
 */
const FillUv = (point: TextPoint, outline: TextOutline): TextPoint => {
    let u = 0.5;
    let v = 0.5;
    // 空白或单轴零尺寸时不能做零除。
    if (outline.width > 0) {
        u = (point[0] - outline.minX) / outline.width;
    }
    // Y 轴独立处理，窄或退化字形仍能得到有限 UV。
    if (outline.height > 0) {
        v = (point[1] - outline.minY) / outline.height;
    }
    return [u, v];
};

/**
 * 将剖分器输出的三角面统一改为顺时针绕序。
 * @param outline 居中轮廓和三角面
 * @param metadata 文本参数
 * @example
 * CreateFillBuffers(outline, metadata);
 * @returns 填充几何数据
 */
const CreateFillBuffers = (outline: TextOutline, metadata: TextMetadata): TextGeometryData => {
    const geometry: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];
    const unique = new Map<string, number>();
    const boundaryNormal = new Map<string, TextPoint>();
    // 填充顶点在边界处沿用轮廓外法线，内部剖分顶点保留零法线。
    for (const contour of outline.contours) {
        // 每个轮廓节点的切线由相邻两边决定。
        for (let pointIndex = 0; pointIndex < contour.length; pointIndex += 1) {
            const point = contour[pointIndex];
            const join = GetJoin(contour, pointIndex);
            const key = String(point[0]) + "," + String(point[1]);
            boundaryNormal.set(key, [join[0], join[1]]);
        }
    }
    /**
     * 合并相同坐标的填充顶点，节约大段文字的显存。
     * @param point 三角顶点
     * @example
     * GetVertex(point);
     * @returns 输出顶点下标
     */
    const GetVertex = (point: TextPoint): number => {
        const key = String(point[0]) + "," + String(point[1]);
        const found = unique.get(key);
        // 重用已写入的同坐标顶点，保证三角面索引有效。
        if (found === undefined) {
            const next = geometry.length / 2;
            const pointUv = FillUv(point, outline);
            const pointNormal = boundaryNormal.get(key) ?? [0, 0];
            geometry.push(point[0], point[1]);
            normal.push(pointNormal[0], pointNormal[1]);
            uv.push(pointUv[0], pointUv[1]);
            unique.set(key, next);
            return next;
        } else {
            return found;
        }
    };
    // 剖分器的顶点每三项组成一个三角面，输出统一使用 Rect 的 CW 正面。
    for (let offset = 0; offset + 2 < outline.triangles.length; offset += 3) {
        const a = outline.triangles[offset];
        const b = outline.triangles[offset + 1];
        const c = outline.triangles[offset + 2];
        const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        // 退化面没有可见面积；避免上传到 GPU。
        if (Math.abs(cross) > 1e-12) {
            const first = GetVertex(a);
            const second = GetVertex(b);
            const third = GetVertex(c);
            // 剖分器可能混用绕序，上传前逐面统一为 CW。
            if (cross > 0) {
                index.push(first, third, second);
            } else {
                index.push(first, second, third);
            }
        }
    }
    return Pack(outline, metadata, geometry, normal, uv, index);
};

/**
 * 计算字形轮廓在一个节点处的外法线和斜接倍数。
 * 剖分器边界的填充总在路径左侧，右法线指向非填充区，包括内孔。
 * @param contour 当前闭合轮廓
 * @param index 当前顶点
 * @example
 * GetJoin(contour, index);
 * @returns 外法线和倍率
 */
const GetJoin = (contour: readonly TextPoint[], index: number): readonly [number, number, number] => {
    const previous = contour[(index + contour.length - 1) % contour.length];
    const point = contour[index];
    const next = contour[(index + 1) % contour.length];
    const previousDx = point[0] - previous[0];
    const previousDy = point[1] - previous[1];
    const nextDx = next[0] - point[0];
    const nextDy = next[1] - point[1];
    const previousLength = Math.hypot(previousDx, previousDy);
    const nextLength = Math.hypot(nextDx, nextDy);
    // 边界输出理论上没有零边；保底法线防止坏字形产生 NaN。
    if (previousLength === 0 || nextLength === 0) {
        return [0, 0, 0];
    } else {
        const firstX = previousDy / previousLength;
        const firstY = -previousDx / previousLength;
        const secondX = nextDy / nextLength;
        const secondY = -nextDx / nextLength;
        const sumX = firstX + secondX;
        const sumY = firstY + secondY;
        const length = Math.hypot(sumX, sumY);
        // 180 度回折没有确定斜接方向，退回到出边法线。
        if (length <= 1e-6) {
            return [secondX, secondY, 1];
        } else {
            const normalX = sumX / length;
            const normalY = sumY / length;
            const projection = normalX * secondX + normalY * secondY;
            return [normalX, normalY, Math.min(8, 1 / Math.max(projection, 1e-6))];
        }
    }
};

/**
 * 计算闭合边界各节点的累计长度和总长。
 * @param contour 闭合轮廓
 * @example
 * GetDistances(contour);
 * @returns 累计长度与周长
 */
const GetDistances = (contour: readonly TextPoint[]): { distances: number[]; length: number } => {
    const distances: number[] = [0];
    let length = 0;
    // 闭合边最后一段回到首点，UV 接缝使用完整长度。
    for (let index = 0; index < contour.length; index += 1) {
        const point = contour[index];
        const next = contour[(index + 1) % contour.length];
        length += Math.hypot(next[0] - point[0], next[1] - point[1]);
        distances.push(length);
    }
    return { distances, length };
};

/**
 * 生成每条填充边界独立闭合的 line-list。
 * @param outline 居中轮廓
 * @param metadata 文本参数
 * @param uvRepeat 每条轮廓的 U 重复次数
 * @example
 * CreateLineBuffers(outline, metadata, 1);
 * @returns 线框几何数据
 */
const CreateLineBuffers = (outline: TextOutline, metadata: TextMetadata, uvRepeat: number): TextLineGeometryData => {
    const geometry: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];
    // 每个字形外圈与内孔分别建立接缝，不能跨环连接。
    for (const contour of outline.contours) {
        const base = geometry.length / 2;
        const path = GetDistances(contour);
        // 末尾复制首点，以保留每个闭合边界的独立 U 接缝。
        for (let position = 0; position <= contour.length; position += 1) {
            const sourceIndex = position % contour.length;
            const point = contour[sourceIndex];
            const join = GetJoin(contour, sourceIndex);
            geometry.push(point[0], point[1]);
            normal.push(join[0], join[1]);
            let u = 0;
            // 零长度边界没有可归一化的周长。
            if (path.length > 0) {
                u = path.distances[position] / path.length * uvRepeat;
            }
            uv.push(u, 0.5);
            // 闭合复制点只作为上一边终点，不重复建立首边。
            if (position < contour.length) {
                index.push(base + position, base + position + 1);
            }
        }
    }
    return { ...Pack(outline, metadata, geometry, normal, uv, index), uvRepeat };
};

/**
 * 生成与 Rect 一致的双顶点 Shader 外扩边框载体。
 * @param outline 居中轮廓
 * @param metadata 文本参数
 * @param lineWidth 边框宽度
 * @param uvRepeat 每条轮廓的 U 重复次数
 * @param align 相对填充区域的对齐方式
 * @example
 * CreateBorderBuffers(outline, metadata, 2, 1, "normal");
 * @returns 边框几何数据
 */
const CreateBorderBuffers = (
    outline: TextOutline,
    metadata: TextMetadata,
    lineWidth: number,
    uvRepeat: number,
    align: TextBorderAlign,
): TextBorderGeometryData => {
    const geometry: number[] = [];
    const normal: number[] = [];
    const miterScale: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];
    // 填充轮廓均沿填充域左侧行走，索引顺序需反转以保持 CW 正面。
    for (const contour of outline.contours) {
        const base = geometry.length / 2;
        const path = GetDistances(contour);
        // 每个边界追加一对接缝顶点，使纹理从 0 延续到 uvRepeat。
        for (let position = 0; position <= contour.length; position += 1) {
            const sourceIndex = position % contour.length;
            const point = contour[sourceIndex];
            const join = GetJoin(contour, sourceIndex);
            let u = 0;
            // 零周长时仍保留有限 UV。
            if (path.length > 0) {
                u = path.distances[position] / path.length * uvRepeat;
            }
            geometry.push(point[0], point[1], point[0], point[1]);
            normal.push(join[0], join[1], join[0], join[1]);
            miterScale.push(join[2], join[2]);
            uv.push(u, 0, u, 1);
            // 相邻两对顶点连接成一节独立边框载体。
            if (position < contour.length) {
                const inner = base + position * 2;
                const outer = inner + 1;
                const nextInner = inner + 2;
                const nextOuter = inner + 3;
                index.push(inner, nextOuter, outer, inner, nextInner, nextOuter);
            }
        }
    }
    return {
        ...Pack(outline, metadata, geometry, normal, uv, index),
        miterScale: new Float32Array(miterScale),
        lineWidth,
        uvRepeat,
        align,
    };
};

/**
 * 收集经过长度筛选的边界节点和线段中点。
 * @param outline 居中轮廓
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 相邻边长之和阈值
 * @param midpointThreshold 当前边长阈值
 * @example
 * CollectPointCenters(outline, true, false, 0, 0);
 * @returns 点型中心列表
 */
const CollectPointCenters = (
    outline: TextOutline,
    vertexPoints: boolean,
    midpointPoints: boolean,
    vertexThreshold: number,
    midpointThreshold: number,
): TextPoint[] => {
    const centers: TextPoint[] = [];
    // 每条字形边界独立筛选，不在字形之间制造虚构边。
    for (const contour of outline.contours) {
        // 首尾按闭合边界连接，过滤接缝复制点。
        for (let index = 0; index < contour.length; index += 1) {
            const previous = contour[(index + contour.length - 1) % contour.length];
            const point = contour[index];
            const next = contour[(index + 1) % contour.length];
            const previousLength = Math.hypot(point[0] - previous[0], point[1] - previous[1]);
            const nextLength = Math.hypot(next[0] - point[0], next[1] - point[1]);
            // 顶点阈值基于两侧边长总和，与 Rect 的筛选约定一致。
            if (vertexPoints && previousLength + nextLength > vertexThreshold) {
                centers.push(point);
            }
            // 中点只取当前边的长度，不受相邻边影响。
            if (midpointPoints && nextLength > midpointThreshold) {
                centers.push([(point[0] + next[0]) * 0.5, (point[1] + next[1]) * 0.5]);
            }
        }
    }
    return centers;
};

/**
 * 在筛选后的边界关键点上生成独立点型三角面。
 * @param outline 居中轮廓
 * @param metadata 文本参数
 * @param pointRadius 点型半径
 * @param sides 点型边数
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 顶点边长阈值
 * @param midpointThreshold 中点边长阈值
 * @example
 * CreatePointBuffers(outline, metadata, 2, 4, true, false, 0, 0);
 * @returns 点位几何数据
 */
const CreatePointBuffers = (
    outline: TextOutline,
    metadata: TextMetadata,
    pointRadius: number,
    sides: number,
    vertexPoints: boolean,
    midpointPoints: boolean,
    vertexThreshold: number,
    midpointThreshold: number,
): TextPointGeometryData => {
    const centers = CollectPointCenters(
        outline,
        vertexPoints,
        midpointPoints,
        vertexThreshold,
        midpointThreshold,
    );
    const geometry: number[] = [];
    const position: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];
    // 点型为独立三角扇；中心记录供 Shader 固定像素大小使用。
    for (const center of centers) {
        const base = geometry.length / 2;
        geometry.push(center[0], center[1]);
        position.push(center[0], center[1]);
        normal.push(0, 0);
        uv.push(0.5, 0.5);
        // 每个中心展开为独立的 CW 扇形，不在相邻点型之间共用顶点。
        for (let side = 0; side < sides; side += 1) {
            const angle = Math.PI * 0.5 - side * Math.PI * 2 / sides;
            let x = Math.cos(angle);
            let y = Math.sin(angle);
            // 四边形与 Rect 点型一致，使用轴对齐正方形。
            if (sides === 4) {
                const corners: readonly TextPoint[] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
                x = corners[side][0];
                y = corners[side][1];
            }
            const length = Math.hypot(x, y);
            geometry.push(center[0] + x * pointRadius, center[1] + y * pointRadius);
            position.push(center[0], center[1]);
            normal.push(x / length, y / length);
            uv.push(x * 0.5 + 0.5, y * 0.5 + 0.5);
            index.push(base, base + side + 1, base + (side + 1) % sides + 1);
        }
    }
    return {
        ...Pack(outline, metadata, geometry, normal, uv, index),
        position: new Float32Array(position),
        pointRadius,
        sides,
        pointCount: centers.length,
    };
};

export { CreateFillBuffers, CreateBorderBuffers, CreateLineBuffers, CreatePointBuffers };
export type { TextMetadata };
