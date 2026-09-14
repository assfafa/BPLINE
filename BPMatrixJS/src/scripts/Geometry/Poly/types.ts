/** 节点选项只控制边框连接，不改变填充轮廓或设置独立线宽。 */
interface PolyNode {
    readonly x: number;
    readonly y: number;
    /** true 为圆接，false 为尖角斜接；默认 false。 */
    readonly round?: boolean;
    /** 当前圆接的细分段数，默认 8，至少 1。 */
    readonly segments?: number;
}

/** 简单节点可直接使用 [x, y]，需要圆接时使用 PolyNode。 */
type PolyPoint = readonly [number, number] | PolyNode;
type PolyBorderAlign = "inset" | "normal" | "outset";

interface PolyOptions {
    /** 默认 true；开放路径只生成线、边框或辅助点。 */
    readonly closed?: boolean;
    /** 默认 true；solid=true 且 closed=false 会报错。 */
    readonly solid?: boolean;
}

interface PolyGeometryData {
    geometry: Float32Array<ArrayBuffer>;
    normal: Float32Array<ArrayBuffer>;
    uv: Float32Array<ArrayBuffer>;
    index: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
    /** 包围盒尺寸，坐标保持输入值，不自动移到中心。 */
    width: number;
    height: number;
    minX: number;
    minY: number;
    closed: boolean;
}

interface PolyBorderGeometryData extends PolyGeometryData {
    /** geometry 保存中心线载体；normal*miterScale 是偏移方向和补偿。 */
    miterScale: Float32Array<ArrayBuffer>;
    lineWidth: number;
    uvRepeat: number;
    align: PolyBorderAlign;
}

interface PolyLineGeometryData extends PolyGeometryData {
    uvRepeat: number;
}

interface PolyPointGeometryData extends PolyGeometryData {
    /** 每个点型顶点的中心坐标，用于 Shader 保持固定像素大小。 */
    position: Float32Array<ArrayBuffer>;
    pointRadius: number;
    sides: number;
    pointCount: number;
}

interface PolyLike {
    readonly width: number;
    readonly height: number;
    readonly points: readonly PolyNode[];
    readonly closed: boolean;
    readonly solid: boolean;
    readonly data: PolyGeometryData;
    readonly borderData: PolyBorderGeometryData | undefined;
    readonly lineData: PolyLineGeometryData | undefined;
    readonly pointData: PolyPointGeometryData | undefined;
    set(points: readonly PolyPoint[], options?: PolyOptions): this;
    getPerimeter(): number;
    createBorderGeometry(lineWidth: number, uvRepeat?: number, align?: PolyBorderAlign): PolyBorderGeometryData;
    createLineGeometry(uvRepeat?: number): PolyLineGeometryData;
    createPointGeometry(pointRadius?: number, sides?: number, vertexPoints?: boolean, midpointPoints?: boolean, vertexThreshold?: number, midpointThreshold?: number): PolyPointGeometryData;
}

export type { PolyNode, PolyPoint, PolyOptions, PolyBorderAlign, PolyGeometryData, PolyBorderGeometryData, PolyLineGeometryData, PolyPointGeometryData, PolyLike };
