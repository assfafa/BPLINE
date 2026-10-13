import type {
    PolyBorderAlign,
    PolyBorderGeometryData,
    PolyGeometryData,
    PolyLineGeometryData,
    PolyPointGeometryData,
} from "../Poly/types.js";

/** bounding 按外轮廓包围盒映射；polar 的 U 为角度，V 从中心/内环向外环递增。 */
type NGonUVMode = "bounding" | "polar";

interface NGonOptions {
    /** 边数，2 到 65536 的整数，默认 32；2 为退化线段，没有填充面。 */
    sides?: number;
    /** 是否留出内孔，默认 false。 */
    hole?: boolean;
    /** 填充面 UV 模式，默认 bounding，名称按公开接口保留 nvMode。 */
    nvMode?: NGonUVMode;
    /** 外接圆半径，默认 1，非负。 */
    outer?: number;
    /** 内接轮廓的外接圆半径，默认 0.5，钳制到 [0, outer]。 */
    inter?: number;
    /** 第一顶点角度，默认 0，即 +X 方向，单位弧度。 */
    startAngle?: number;
    /** 是否生成填充面，默认 true，关闭后仍可生成线框/边框/点型。 */
    solid?: boolean;
}

interface NGonLike {
    sides: number;
    hole: boolean;
    nvMode: NGonUVMode;
    outer: number;
    inter: number;
    startAngle: number;
    solid: boolean;
    readonly width: number;
    readonly height: number;
    readonly data: PolyGeometryData;
    readonly borderData: PolyBorderGeometryData | undefined;
    readonly lineData: PolyLineGeometryData | undefined;
    readonly pointData: PolyPointGeometryData | undefined;
    /**
     * 原子更新参数、立即重建填充并清除附加数组；传入的字段之外保留原值。
     * @param options 新参数
     * @example
     * nGon.set(options);
     * @returns 当前对象
     */
    set(options: NGonOptions): this;
    /**
     * 计算当前轮廓周长，供顺向 UV 重复量等计算使用。
     * @example
     * nGon.getPerimeter();
     * @returns 所有可见边界的总长度，圆环包含内外圈；sides=2 按单条直线计算
     */
    getPerimeter(): number;
    /**
     * 生成内外圈边框载体，需 Shader 使用 normal*miterScale*线宽 外扩。
     * 内孔法线指向孔内，inset 表示边框位于实体材料内侧。
     * @param lineWidth 线宽
     * @param uvRepeat 每个独立轮廓的顺向重复次数
     * @param align 内中外对齐
     * @example
     * nGon.createBorderGeometry(lineWidth, uvRepeat, align);
     * @returns 合并边框数组
     */
    createBorderGeometry(
        lineWidth: number,
        uvRepeat?: number,
        align?: PolyBorderAlign,
    ): PolyBorderGeometryData;
    /**
     * 生成沿轮廓连接的 line-list 顶点与索引数据。
     * @param uvRepeat 每圈顺向重复次数
     * @example
     * nGon.createLineGeometry(uvRepeat);
     * @returns 两圈分别闭合，不产生横跨孔洞的连线
     */
    createLineGeometry(uvRepeat?: number): PolyLineGeometryData;
    /**
     * 生成内外圈顶点/边中点的辅助几何，UV 在每个点型自身包围盒内归一化。
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 顶点开关
     * @param midpointPoints 边中点开关
     * @param vertexThreshold 相邻边长合计阈值
     * @param midpointThreshold 单边长度阈值
     * @example
     * nGon.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 合并辅助点和逐顶点中心
     */
    createPointGeometry(
        pointRadius?: number,
        sides?: number,
        vertexPoints?: boolean,
        midpointPoints?: boolean,
        vertexThreshold?: number,
        midpointThreshold?: number,
    ): PolyPointGeometryData;
}

type Settings = Readonly<Required<NGonOptions>>;

interface Bounds {
    width: number;
    height: number;
    minX: number;
    minY: number;
}

type Part = PolyGeometryData & {
    miterScale?: Float32Array;
    position?: Float32Array;
};

export type { Bounds, NGonLike, NGonOptions, NGonUVMode, Part, Settings };
