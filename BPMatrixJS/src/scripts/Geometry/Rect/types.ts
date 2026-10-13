
type RectPoint = [number, number];

type RectBorderAlign = "inset" | "normal" | "outset";

interface RectBorderPathData {
    /** 中心轮廓点。 */
    points: RectPoint[];
    /** 每个中心轮廓点对应的单位外法线。 */
    normal: RectPoint[];
    /** 每个中心轮廓点对应的 miter 扩展倍率。 */
    miterScale: number[];
}

interface RectGeometryData {
    geometry: Float32Array;
    normal: Float32Array;
    uv: Float32Array;
    index: Uint16Array;
    width: number;
    height: number;
    radius: number;
    precision: number;
}

interface RectBorderGeometryData extends RectGeometryData {
    miterScale: Float32Array;
    lineWidth: number;
    uvRepeat: number;
    align: RectBorderAlign;
}

interface RectLineGeometryData extends RectGeometryData {
    uvRepeat: number;
}

/** 线框点位的独立三角面；点数较多时索引自动使用 Uint32Array。 */
interface RectPointGeometryData extends Omit<RectGeometryData, "index"> {
    index: Uint16Array | Uint32Array;
    /**
     * 每个顶点所属点型的中心坐标，按 [x, y] 排列，长度与 geometry 相同。
     * 同一点型的中心和轮廓顶点重复保存同一中心；geometry - position 即局部偏移，
     * 供着色器独立调整点型大小而不改变其中心位置。
     */
    position: Float32Array;
    /** 点型半径；四边形使用此值作为半宽、半高。 */
    pointRadius: number;
    /** 每个点型的边数。 */
    sides: number;
    /** 筛选后实际生成的点型数量。 */
    pointCount: number;
}

interface RectLike {
    readonly width: number;
    readonly height: number;
    readonly radius: number;
    precision: number;
    readonly originPrecision: number;
    readonly data: RectGeometryData;
    readonly borderData: RectBorderGeometryData | undefined;
    readonly lineData: RectLineGeometryData | undefined;
    readonly pointData: RectPointGeometryData | undefined;
    /**
     * 更新矩形参数并重新生成填充三角面。
     * 已生成的边框、line 和点位数据会失效，需要按需重新生成。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用当前精度，范围 1–4095
     * @example
     * rect.set(width, height, radius);
     * @returns 当前矩形生成器
     */
    set(width: number, height: number, radius?: number, precision?: number): this;
    /**
     * 获取当前矩形实际离散轮廓的周长。
     * 结果使用与几何生成相同的圆角分段，可直接用于计算 UV 重复次数。
     * @example
     * rect.getPerimeter();
     * @returns 当前矩形轮廓周长
     */
    getPerimeter(): number;
    /**
     * 生成由顶点着色器扩宽的矩形边框载体三角面。
     * geometry 中每个中心轮廓点重复两次，normal 保存单位外法线，
     * miterScale 保存直角连接处的扩展补偿倍率，
     * UV 的 V 分量使用 0 和 1 区分内外侧顶点。
     * U 沿完整闭合轮廓按 uvRepeat 重复，V 横跨线宽固定为 0 到 1。
     * @param lineWidth 边框宽度
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @param align 边框相对原始轮廓的对齐方式
     * @example
     * rect.createBorderGeometry(lineWidth, uvRepeat, align);
     * @returns 边框三角面数据
     */
    createBorderGeometry(
        lineWidth: number,
        uvRepeat?: number,
        align?: RectBorderAlign,
    ): RectBorderGeometryData;
    /**
     * 生成矩形轮廓的 line-list 顶点与索引。
     * U 沿完整闭合轮廓按 uvRepeat 重复。
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @example
     * rect.createLineGeometry(uvRepeat);
     * @returns line-list 轮廓数据
     */
    createLineGeometry(uvRepeat?: number): RectLineGeometryData;
    /**
     * 在线框顶点及线段中点生成独立点型三角面，不会自动生成其他缓存。
     * @param pointRadius 点型半径，默认 2；四边形为半宽、半高
     * @param sides 点型边数，默认 4 为正方形，增加边数可近似圆形
     * @param vertexPoints 是否生成顶点点位，默认开启
     * @param midpointPoints 是否生成线段中点点位，默认关闭；两个开关不能同时关闭
     * @param vertexThreshold 顶点相邻两条边的长度之和必须严格大于此值
     * @param midpointThreshold 中点所在单条边的长度必须严格大于此值
     * @example
     * rect.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 点位三角面数据，并保存到 pointData
     */
    createPointGeometry(
        pointRadius?: number,
        sides?: number,
        vertexPoints?: boolean,
        midpointPoints?: boolean,
        vertexThreshold?: number,
        midpointThreshold?: number,
    ): RectPointGeometryData;
}

export type { RectBorderAlign, RectBorderGeometryData, RectBorderPathData, RectGeometryData, RectLike, RectLineGeometryData, RectPoint, RectPointGeometryData };
