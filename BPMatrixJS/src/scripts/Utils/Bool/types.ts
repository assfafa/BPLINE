import type { PolyPoint } from "../../Geometry/Poly/types.js";

/** 稳定来源标识；同一侧输入不允许重复。 */
type BoolId = string | number;
type BoolSide = "a" | "b";
type BoolKeep = BoolSide | "both";
type BoolFillRule = "nonzero" | "evenodd";
type BoolContour = ArrayLike<number>;
type BoolShape = Float64Array[];

interface BoolSource {
    id: BoolId;
    type: BoolInput["type"];
    side: BoolSide;
}

interface BoolInputBase {
    id: BoolId;
    /** 列主序仿射 Mat3 或其 data；运算在变换后的共同坐标空间进行。 */
    matrix?: ArrayLike<number> | { readonly data: ArrayLike<number> };
    /** 材质、业务标识等由调用方解释，原样传给对应的结果。 */
    metadata?: unknown;
}

interface BoolTriangles {
    /** 仅实体面的 xy，不能把边框/关键点三角形混入；vertexType 可筛选合并数据。 */
    geometry: ArrayLike<number>;
    index?: ArrayLike<number>;
    vertexType?: ArrayLike<number>;
}

/** 结构类型可直接接收数学库 Rect、NGon、Poly、Text，不依赖 BPLineJS。 */
type BoolInput = BoolInputBase & (
    | { type: "rect"; data: { readonly width: number; readonly height: number; readonly radius?: number; readonly precision?: number } }
    | { type: "ngon"; data: { readonly sides: number; readonly outer: number; readonly inter?: number; readonly hole?: boolean; readonly startAngle?: number } }
    | { type: "poly"; data: { readonly points: readonly PolyPoint[]; readonly closed?: boolean } }
    | { type: "base" | "text"; data: BoolTriangles | { readonly data: BoolTriangles } }
    | { type: "contours"; data: { readonly contours: readonly BoolContour[]; readonly fillRule?: BoolFillRule } }
);

interface BoolGeometryData {
    /** 包围盒中心为原点的 CW 实体三角面，使用结果 matrix 回到运算坐标空间。 */
    geometry: Float32Array;
    normal: Float32Array;
    uv: Float32Array;
    index: Uint32Array;
    width: number;
    height: number;
    minX: number;
    minY: number;
    closed: true;
    /** 局部外边界 CCW、孔边界 CW，包含所有轮廓，无内部三角剖分点。 */
    contours: Float64Array[];
    /** 每个连通分量占用的轮廓数，第一条是外圈，其余是孔。 */
    contourCounts: number[];
    /** poly 结果唯一的有序轮廓；base 返回空数组。 */
    points: PolyPoint[];
}

interface BoolGeometry {
    /** 新几何的 UUID，可把整个 items 数组直接用于下一次运算。 */
    id: string;
    /** 归属对象的输入 id；多个分片共享 sourceId，part 在该来源内递增。 */
    sourceId: BoolId;
    side: BoolSide;
    part: number;
    type: "poly" | "base";
    data: BoolGeometryData;
    /** 仅平移的列主序 Mat3，可直接作为下一次布尔输入的 matrix。 */
    matrix: number[];
    metadata?: unknown;
    /** 对本片段有实体面积贡献的原始输入。 */
    sources: BoolSource[];
}

interface BoolChange {
    id: BoolId;
    side: BoolSide;
    status: "unchanged" | "modified" | "split" | "removed" | "merged" | "operand";
    /** 对应 result.items 的下标；被减空时为空。 */
    outputs: number[];
}

interface BoolResult {
    items: BoolGeometry[];
    changes: BoolChange[];
}

interface BoolBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

interface PreparedInput {
    input: BoolInput;
    source: BoolSource;
    paths: Float64Array[];
    shapes: BoolShape[];
    bounds: BoolBounds | null;
}

export type {
    BoolBounds, BoolChange, BoolContour, BoolFillRule, BoolGeometry, BoolGeometryData,
    BoolId, BoolInput, BoolKeep, BoolResult, BoolShape, BoolSide, BoolSource, BoolTriangles, PreparedInput,
};
