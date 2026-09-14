import { Clamp } from "../Utils/index.js";

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
    readonly data: RectGeometryData;
    readonly borderData: RectBorderGeometryData | undefined;
    readonly lineData: RectLineGeometryData | undefined;
    readonly pointData: RectPointGeometryData | undefined;
    set(width: number, height: number, radius?: number): this;
    getPerimeter(): number;
    createBorderGeometry(lineWidth: number, uvRepeat?: number, align?: RectBorderAlign): RectBorderGeometryData;
    createLineGeometry(uvRepeat?: number): RectLineGeometryData;
    createPointGeometry(pointRadius?: number, sides?: number, vertexPoints?: boolean, midpointPoints?: boolean, vertexThreshold?: number, midpointThreshold?: number): RectPointGeometryData;
}

/**
 * 矩形几何生成器。
 * 按需维护填充三角面、边框三角面、line-list 轮廓和线框点位数据。
 * @class
 * @implements RectLike
 */
class Rect implements RectLike {
    private _width: number = 0;
    private _height: number = 0;
    private _radius: number = 0;
    private _data: RectGeometryData = CreateEmptyGeometryData();
    private _borderData: RectBorderGeometryData | undefined;
    private _lineData: RectLineGeometryData | undefined;
    private _pointData: RectPointGeometryData | undefined;

    /**
     * 创建矩形几何生成器。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     */
    public constructor(width: number, height: number, radius: number = 0) {
        this.set(width, height, radius);
    }

    /**
     * 更新矩形参数并重新生成填充三角面。
     * 已生成的边框、line 和点位数据会失效，需要按需重新生成。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @returns 当前矩形生成器
     */
    public set(width: number, height: number, radius: number = 0): this {
        this._data = CreateRectGeometry(width, height, radius);
        this._width = this._data.width;
        this._height = this._data.height;
        this._radius = this._data.radius;
        this._borderData = undefined;
        this._lineData = undefined;
        this._pointData = undefined;
        return this;
    }

    /**
     * 生成由顶点着色器扩宽的矩形边框载体三角面。
     * geometry 中每个中心轮廓点重复两次，normal 保存单位外法线，
     * miterScale 保存直角连接处的扩展补偿倍率，
     * UV 的 V 分量使用 0 和 1 区分内外侧顶点。
     * U 沿完整闭合轮廓按 uvRepeat 重复，V 横跨线宽固定为 0 到 1。
     * @param lineWidth 边框宽度
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @param align 边框相对原始轮廓的对齐方式
     * @returns 边框三角面数据
     */
    public createBorderGeometry(
        lineWidth: number,
        uvRepeat: number = 1,
        align: RectBorderAlign = "normal",
    ): RectBorderGeometryData {
        this._borderData = CreateRectBorderGeometry(this._width, this._height, this._radius, lineWidth, uvRepeat, align);
        return this._borderData;
    }

    /**
     * 生成矩形轮廓的 line-list 顶点与索引。
     * U 沿完整闭合轮廓按 uvRepeat 重复。
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @returns line-list 轮廓数据
     */
    public createLineGeometry(uvRepeat: number = 1): RectLineGeometryData {
        this._lineData = CreateRectLineGeometry(this._width, this._height, this._radius, uvRepeat);
        return this._lineData;
    }

    /**
     * 在线框顶点及线段中点生成独立点型三角面，不会自动生成其他缓存。
     * @param pointRadius 点型半径，默认 2；四边形为半宽、半高
     * @param sides 点型边数，默认 4 为正方形，增加边数可近似圆形
     * @param vertexPoints 是否生成顶点点位，默认开启
     * @param midpointPoints 是否生成线段中点点位，默认关闭；两个开关不能同时关闭
     * @param vertexThreshold 顶点相邻两条边的长度之和必须严格大于此值
     * @param midpointThreshold 中点所在单条边的长度必须严格大于此值
     * @returns 点位三角面数据，并保存到 pointData
     */
    public createPointGeometry(
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): RectPointGeometryData {
        this._pointData = CreateRectPointGeometry(
            this._width, this._height, this._radius,
            pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold,
        );
        return this._pointData;
    }

    /**
     * 获取当前矩形实际离散轮廓的周长。
     * 结果使用与几何生成相同的圆角分段，可直接用于计算 UV 重复次数。
     * @returns 当前矩形轮廓周长
     */
    public getPerimeter(): number {
        return GetRectPerimeter(this._width, this._height, this._radius);
    }

    /**
     * 获取矩形宽度。
     * @returns 经过限制的矩形宽度
     */
    public get width(): number {
        return this._width;
    }

    /**
     * 获取矩形高度。
     * @returns 经过限制的矩形高度
     */
    public get height(): number {
        return this._height;
    }

    /**
     * 获取圆角半径。
     * @returns 经过限制的圆角半径
     */
    public get radius(): number {
        return this._radius;
    }

    /**
     * 获取填充三角面数据。
     * @returns 填充三角面数据
     */
    public get data(): RectGeometryData {
        return this._data;
    }

    /**
     * 获取最近一次生成的边框三角面数据。
     * @returns 边框三角面数据，尚未生成时为 undefined
     */
    public get borderData(): RectBorderGeometryData | undefined {
        return this._borderData;
    }

    /**
     * 获取最近一次生成的 line-list 数据。
     * @returns line-list 数据，尚未生成时为 undefined
     */
    public get lineData(): RectLineGeometryData | undefined {
        return this._lineData;
    }

    /**
     * 获取最近一次生成的点位三角面。
     * @returns 点位数据，尚未生成或矩形参数改变后为 undefined
     */
    public get pointData(): RectPointGeometryData | undefined {
        return this._pointData;
    }

    /**
     * 获取指定矩形实际离散轮廓的周长。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @returns 矩形轮廓周长
     */
    public static GetPerimeter(width: number, height: number, radius: number = 0): number {
        return GetRectPerimeter(width, height, radius);
    }

    /**
     * 直接生成矩形填充三角面。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @returns 填充三角面数据
     */
    public static CreateGeometry(width: number, height: number, radius: number = 0): RectGeometryData {
        return CreateRectGeometry(width, height, radius);
    }

    /**
     * 直接生成由顶点着色器扩宽的矩形边框载体三角面。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param lineWidth 边框宽度
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @param align 边框相对原始轮廓的对齐方式
     * @returns 边框三角面数据
     */
    public static CreateBorderGeometry(
        width: number,
        height: number,
        radius: number = 0,
        lineWidth: number = 1,
        uvRepeat: number = 1,
        align: RectBorderAlign = "normal",
    ): RectBorderGeometryData {
        return CreateRectBorderGeometry(width, height, radius, lineWidth, uvRepeat, align);
    }

    /**
     * 直接生成矩形 line-list 轮廓。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @returns line-list 轮廓数据
     */
    public static CreateLineGeometry(
        width: number,
        height: number,
        radius: number = 0,
        uvRepeat: number = 1,
    ): RectLineGeometryData {
        return CreateRectLineGeometry(width, height, radius, uvRepeat);
    }

    /**
     * 直接生成矩形线框点位。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 矩形圆角半径
     * @param pointRadius 点型半径，四边形为半宽、半高
     * @param sides 点型边数，默认 4
     * @param vertexPoints 是否生成顶点点位
     * @param midpointPoints 是否生成中点点位；不能与 vertexPoints 同时关闭
     * @param vertexThreshold 相邻两条边长度之和的严格下限
     * @param midpointThreshold 中点所在边长度的严格下限
     * @returns 点位三角面数据
     */
    public static CreatePointGeometry(
        width: number,
        height: number,
        radius: number = 0,
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): RectPointGeometryData {
        return CreateRectPointGeometry(
            width, height, radius,
            pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold,
        );
    }
}

/**
 * 获取矩形实际离散轮廓的周长。
 * 宽高和圆角使用与几何生成相同的限制及分段规则。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @returns 矩形轮廓周长
 */
const GetRectPerimeter = (width: number, height: number, radius: number = 0): number => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const points = CreatePerimeterPoints(
        parameters.halfWidth,
        parameters.halfHeight,
        parameters.radius,
    );

    return GetClosedPathLength(points);
};

/**
 * 生成矩形填充三角面。
 * 以 (0, 0) 为中心，圆角半径会自动限制到半宽半高的较小值。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @returns 填充三角面数据
 */
const CreateRectGeometry = (width: number, height: number, radius: number = 0): RectGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const segments = GetCornerSegments(parameters.radius);
    const preserveCornerSegments = parameters.radius > 0;
    const points = CreatePerimeterPoints(
        parameters.halfWidth,
        parameters.halfHeight,
        parameters.radius,
        segments,
        preserveCornerSegments,
    );
    const normalData = CreatePerimeterNormalData(
        points,
        CreateExtrudeReferencePoints(
            parameters.halfWidth,
            parameters.halfHeight,
            parameters.radius,
            segments,
            preserveCornerSegments,
        ),
    );

    return {
        geometry: CreateFillGeometryBuffer(points),
        normal: CreateFillNormalBuffer(normalData.normal),
        uv: CreateFillUvBuffer(points, parameters.width, parameters.height),
        index: CreateFillIndexBuffer(points),
        width: parameters.width,
        height: parameters.height,
        radius: parameters.radius,
    };
};

/**
 * 生成由顶点着色器扩宽的矩形边框载体三角面。
 * geometry 只保存中心轮廓，lineWidth 和 align 不会提前烘焙到顶点位置。
 * normal 保存单位外法线，miterScale 保存直角处的扩展补偿倍率。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param lineWidth 边框宽度
 * @param uvRepeat 贴图沿完整轮廓顺向重复次数
 * @param align 边框相对原始轮廓的对齐方式
 * @returns 边框三角面数据
 */
const CreateRectBorderGeometry = (
    width: number,
    height: number,
    radius: number = 0,
    lineWidth: number = 1,
    uvRepeat: number = 1,
    align: RectBorderAlign = "normal",
): RectBorderGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const safeLineWidth = ToNonNegativeFinite(lineWidth);
    const safeUvRepeat = ToNonNegativeFinite(uvRepeat);
    const safeAlign = NormalizeBorderAlign(align);
    const offsets = GetBorderOffsets(safeLineWidth, safeAlign);
    const outerRadius = parameters.radius === 0
        ? 0
        : parameters.radius + offsets.outset;
    const segments = GetCornerSegments(Math.max(parameters.radius, outerRadius));
    const borderPathData = parameters.radius === 0
        ? CreateSharpBorderPathData(parameters.halfWidth, parameters.halfHeight)
        : CreateRoundedBorderPathData(
            parameters.halfWidth,
            parameters.halfHeight,
            parameters.radius,
            segments,
        );
    const buffers = CreateBorderBuffers(
        borderPathData.points,
        borderPathData.normal,
        borderPathData.miterScale,
        safeUvRepeat,
    );

    return {
        geometry: buffers.geometry,
        normal: buffers.normal,
        uv: buffers.uv,
        index: buffers.index,
        miterScale: buffers.miterScale,
        width: parameters.width,
        height: parameters.height,
        radius: parameters.radius,
        lineWidth: safeLineWidth,
        uvRepeat: safeUvRepeat,
        align: safeAlign,
    };
};

/**
 * 创建圆角边框的中心轮廓、法线和 miter 数据。
 * @param halfWidth 矩形半宽
 * @param halfHeight 矩形半高
 * @param radius 圆角半径
 * @param segments 每个圆角分段数
 * @returns 圆角边框路径数据
 */
const CreateRoundedBorderPathData = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    segments: number,
): RectBorderPathData => {
    const points = CreatePerimeterPoints(
        halfWidth,
        halfHeight,
        radius,
        segments,
        true,
    );
    const normalData = CreatePerimeterNormalData(
        points,
        CreateExtrudeReferencePoints(
            halfWidth,
            halfHeight,
            radius,
            segments,
            true,
        ),
    );

    return {
        points,
        normal: normalData.normal,
        miterScale: normalData.miterScale,
    };
};

/**
 * 创建直角边框路径数据。
 * 每个角依次保存上一条边法线、斜向 miter 和下一条边法线。
 * 三个顶点共用位置与 U，GPU 扩宽后会生成直角连接面；角点最后一组顶点使用下一条边法线，
 * 随后直接进入下一条边，因此右边转下边时由下边接管，下边转左边时由左边接管。
 * @param halfWidth 矩形半宽
 * @param halfHeight 矩形半高
 * @returns 直角边框路径数据
 */
const CreateSharpBorderPathData = (
    halfWidth: number,
    halfHeight: number,
): RectBorderPathData => {
    if (halfWidth === 0 || halfHeight === 0) {
        return { points: [], normal: [], miterScale: [] };
    }

    const diagonal = Math.SQRT1_2;
    const miterScale = Math.SQRT2;

    return {
        points: [
            [halfWidth, halfHeight],
            [halfWidth, halfHeight],
            [halfWidth, halfHeight],
            [halfWidth, -halfHeight],
            [halfWidth, -halfHeight],
            [halfWidth, -halfHeight],
            [-halfWidth, -halfHeight],
            [-halfWidth, -halfHeight],
            [-halfWidth, -halfHeight],
            [-halfWidth, halfHeight],
            [-halfWidth, halfHeight],
            [-halfWidth, halfHeight],
        ],
        normal: [
            [0, 1],
            [diagonal, diagonal],
            [1, 0],
            [1, 0],
            [diagonal, -diagonal],
            [0, -1],
            [0, -1],
            [-diagonal, -diagonal],
            [-1, 0],
            [-1, 0],
            [-diagonal, diagonal],
            [0, 1],
        ],
        miterScale: [
            1,
            miterScale,
            1,
            1,
            miterScale,
            1,
            1,
            miterScale,
            1,
            1,
            miterScale,
            1,
        ],
    };
};

/**
 * 创建相对中心轮廓向外偏移一个单位的参考点。
 * 参考点与中心轮廓的差值用于拆分单位法线和 miter 补偿倍率。
 * @param halfWidth 矩形半宽
 * @param halfHeight 矩形半高
 * @param radius 圆角半径
 * @param segments 每个圆角分段数
 * @param preserveCornerSegments 是否保留圆角采样数量
 * @returns 向外偏移一个单位的参考轮廓点
 */
const CreateExtrudeReferencePoints = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    segments: number,
    preserveCornerSegments: boolean,
): RectPoint[] => {
    return CreatePerimeterPoints(
        halfWidth + 1,
        halfHeight + 1,
        radius === 0 ? 0 : radius + 1,
        segments,
        preserveCornerSegments,
    );
};

/**
 * 生成矩形轮廓的 line-list 顶点、UV 与索引。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param uvRepeat 贴图沿完整轮廓顺向重复次数
 * @returns line-list 轮廓数据
 */
const CreateRectLineGeometry = (
    width: number,
    height: number,
    radius: number = 0,
    uvRepeat: number = 1,
): RectLineGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const safeUvRepeat = ToNonNegativeFinite(uvRepeat);
    const segments = GetCornerSegments(parameters.radius);
    const preserveCornerSegments = parameters.radius > 0;
    const points = CreatePerimeterPoints(
        parameters.halfWidth,
        parameters.halfHeight,
        parameters.radius,
        segments,
        preserveCornerSegments,
    );
    const normalData = CreatePerimeterNormalData(
        points,
        CreateExtrudeReferencePoints(
            parameters.halfWidth,
            parameters.halfHeight,
            parameters.radius,
            segments,
            preserveCornerSegments,
        ),
    );
    const buffers = CreateLineBuffers(points, normalData.normal, safeUvRepeat);

    return {
        geometry: buffers.geometry,
        normal: buffers.normal,
        uv: buffers.uv,
        index: buffers.index,
        width: parameters.width,
        height: parameters.height,
        radius: parameters.radius,
        uvRepeat: safeUvRepeat,
    };
};

/**
 * 利用矩形的 indexed line-list 坐标生成线框点位三角面。
 * 圆角采样点也属于顶点；闭合处的重复顶点只生成一次，零长度边不参与筛选。
 * 每个点型独立使用以自身中心为 (0.5, 0.5) 的包围盒 UV，不随尺寸重复或畸变。
 * geometry 保留展开后的顶点，position 为逐顶点对应的点型中心坐标。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 矩形圆角半径
 * @param pointRadius 点型半径，默认 2；四边形为半宽、半高，其他多边形为外接圆半径
 * @param sides 点型边数，必须是至少为 3 的整数；默认 4 为轴对齐正方形
 * @param vertexPoints 是否生成顶点点位，默认开启
 * @param midpointPoints 是否生成中点点位，默认关闭；两个开关不能同时关闭
 * @param vertexThreshold 相邻两条边长度之和必须严格大于此值，例如 10 + 100 > 105
 * @param midpointThreshold 中点所在单条边的长度必须严格大于此值
 * @returns 独立点型的顶点、中心坐标、法线、UV 与索引；超过 65536 个顶点时使用 Uint32Array 索引
 * @throws {RangeError} 两个开关同时关闭，边数无效或阈值为 NaN 时抛出
 */
const CreateRectPointGeometry = (
    width: number,
    height: number,
    radius: number = 0,
    pointRadius: number = 2,
    sides: number = 4,
    vertexPoints: boolean = true,
    midpointPoints: boolean = false,
    vertexThreshold: number = 0,
    midpointThreshold: number = 0,
): RectPointGeometryData => {
    if (!vertexPoints && !midpointPoints) {
        throw new RangeError("vertexPoints and midpointPoints cannot both be false.");
    }
    if (!Number.isSafeInteger(sides) || sides < 3) {
        throw new RangeError("sides must be an integer greater than or equal to 3.");
    }
    if (Number.isNaN(vertexThreshold) || Number.isNaN(midpointThreshold)) {
        throw new RangeError("Point thresholds cannot be NaN.");
    }

    const line: RectLineGeometryData = CreateRectLineGeometry(width, height, radius);
    const safePointRadius: number = ToNonNegativeFinite(pointRadius);
    const centers: RectPoint[] = safePointRadius === 0 ? [] : CollectLinePointCenters(
        line, vertexPoints, midpointPoints, Math.max(0, vertexThreshold), Math.max(0, midpointThreshold),
    );
    const vertexCount: number = centers.length * (sides + 1);
    const geometry: Float32Array = new Float32Array(vertexCount * 2);
    const position: Float32Array = new Float32Array(vertexCount * 2);
    const normal: Float32Array = new Float32Array(vertexCount * 2);
    const uv: Float32Array = new Float32Array(vertexCount * 2);
    const index: Uint16Array | Uint32Array = vertexCount > 65536
        ? new Uint32Array(centers.length * sides * 3)
        : new Uint16Array(centers.length * sides * 3);
    const square: RectPoint[] = [[1, 1], [1, -1], [-1, -1], [-1, 1]];

    for (let pointIndex: number = 0; pointIndex < centers.length; pointIndex += 1) {
        const center: RectPoint = centers[pointIndex];
        const base: number = pointIndex * (sides + 1);
        geometry.set(center, base * 2);
        position.set(center, base * 2);
        uv.set([0.5, 0.5], base * 2);

        for (let side: number = 0; side < sides; side += 1) {
            const angle: number = Math.PI * 0.5 - side * Math.PI * 2 / sides;
            const x: number = sides === 4 ? square[side][0] : Math.cos(angle);
            const y: number = sides === 4 ? square[side][1] : Math.sin(angle);
            const offset: number = (base + side + 1) * 2;
            const length: number = Math.hypot(x, y);
            geometry.set([center[0] + x * safePointRadius, center[1] + y * safePointRadius], offset);
            position.set(center, offset);
            // 单位径向外法线；三角扇中心的法线保留为 [0, 0]。
            normal.set([x / length, y / length], offset);
            uv.set([x * 0.5 + 0.5, y * 0.5 + 0.5], offset);
            // 每个点型独立闭合，不能把相邻两个点型连接成三角面。
            index.set([base, base + side + 1, base + (side + 1) % sides + 1], (pointIndex * sides + side) * 3);
        }
    }

    return {
        geometry, position, normal, uv, index,
        width: line.width,
        height: line.height,
        radius: line.radius,
        pointRadius: safePointRadius,
        sides,
        pointCount: centers.length,
    };
};

/**
 * 从闭合 line-list 中筛选点型中心；先输出顶点，再输出中点。
 * @param line 矩形的 indexed line-list 数据
 * @param vertexPoints 是否保留符合阈值的顶点
 * @param midpointPoints 是否保留符合阈值的中点
 * @param vertexThreshold 顶点相邻边长之和的严格下限
 * @param midpointThreshold 单条线段长度的严格下限
 * @returns 去除闭合重复顶点后的点型中心
 */
const CollectLinePointCenters = (
    line: RectLineGeometryData,
    vertexPoints: boolean,
    midpointPoints: boolean,
    vertexThreshold: number,
    midpointThreshold: number,
): RectPoint[] => {
    const vertices = new Map<string, { point: RectPoint; adjacentLength: number }>();
    const midpoints: RectPoint[] = [];
    // 圆角相切处可能产生三角函数舍入残差，只合并机器精度级的重合点。
    const epsilon: number = Math.max(line.width, line.height) * Number.EPSILON * 16 || Number.MIN_VALUE;
    /**
     * 按坐标合并闭合接缝，并累加该顶点连接的边长。
     * @param point 线段端点
     * @param length 当前线段长度
     * @returns 无返回值
     */
    const AddAdjacentLength = (point: RectPoint, length: number): void => {
        const key: string = String(Math.round(point[0] / epsilon)) + "," + String(Math.round(point[1] / epsilon));
        const existing = vertices.get(key);
        if (existing !== undefined) {
            existing.adjacentLength += length;
        } else {
            vertices.set(key, { point, adjacentLength: length });
        }
    };

    for (let offset: number = 0; offset < line.index.length; offset += 2) {
        const startIndex: number = line.index[offset] * 2;
        const endIndex: number = line.index[offset + 1] * 2;
        const start: RectPoint = [line.geometry[startIndex], line.geometry[startIndex + 1]];
        const end: RectPoint = [line.geometry[endIndex], line.geometry[endIndex + 1]];
        const length: number = GetPointDistance(start, end);
        if (length <= epsilon) {
            continue;
        }
        if (vertexPoints) {
            AddAdjacentLength(start, length);
            AddAdjacentLength(end, length);
        }
        if (midpointPoints && length > midpointThreshold) {
            midpoints.push([(start[0] + end[0]) * 0.5, (start[1] + end[1]) * 0.5]);
        }
    }

    const centers: RectPoint[] = [];
    for (const vertex of vertices.values()) {
        // 判断两条相邻边的和，不要求其中每一条边分别超过阈值。
        if (vertex.adjacentLength > vertexThreshold) {
            centers.push(vertex.point);
        }
    }
    return centers.concat(midpoints);
};

/**
 * 生成按顺时针排列的矩形边界点。
 * 每个圆角都保留起点，圆角之间由矩形直边连接。
 * @param halfWidth 半宽
 * @param halfHeight 半高
 * @param radius 圆角半径
 * @param cornerSegments 每个圆角分段数
 * @param preserveCornerSegments 直角轮廓是否保留与圆角轮廓相同的采样数量
 * @returns 边界点列表
 */
const CreatePerimeterPoints = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    cornerSegments: number = GetCornerSegments(radius),
    preserveCornerSegments: boolean = false,
): RectPoint[] => {
    if (halfWidth === 0 || halfHeight === 0) {
        return [];
    }

    if (radius === 0 && !preserveCornerSegments) {
        return [
            [halfWidth, halfHeight],
            [halfWidth, -halfHeight],
            [-halfWidth, -halfHeight],
            [-halfWidth, halfHeight],
        ];
    }

    const points: RectPoint[] = [];

    PushArc(points, halfWidth - radius, halfHeight - radius, radius, Math.PI * 0.5, 0, cornerSegments);
    PushArc(points, halfWidth - radius, -halfHeight + radius, radius, 0, -Math.PI * 0.5, cornerSegments);
    PushArc(points, -halfWidth + radius, -halfHeight + radius, radius, -Math.PI * 0.5, -Math.PI, cornerSegments);
    PushArc(points, -halfWidth + radius, halfHeight - radius, radius, Math.PI, Math.PI * 0.5, cornerSegments);

    return points;
};

/**
 * 添加包含起点和终点的圆角圆弧点。
 * @param points 点数组
 * @param centerX 圆心 X
 * @param centerY 圆心 Y
 * @param radius 圆角半径
 * @param startAngle 起始弧度
 * @param endAngle 结束弧度
 * @param segments 分段数
 * @returns 无返回值
 */
const PushArc = (
    points: RectPoint[],
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    segments: number,
): void => {
    for (let index = 0; index <= segments; index += 1) {
        const progress = index / segments;
        const angle = startAngle + (endAngle - startAngle) * progress;

        points.push([
            centerX + Math.cos(angle) * radius,
            centerY + Math.sin(angle) * radius,
        ]);
    }
};

/**
 * 生成中心三角扇使用的填充顶点。
 * @param points 边界点列表
 * @returns 填充顶点缓冲
 */
const CreateFillGeometryBuffer = (points: readonly RectPoint[]): Float32Array => {
    if (points.length === 0) {
        return new Float32Array(0);
    }

    const geometry: number[] = [0, 0];

    for (const point of points) {
        geometry.push(point[0], point[1]);
    }

    return new Float32Array(geometry);
};

/**
 * 生成中心三角扇使用的二维轮廓外法线。
 * 中心顶点不属于边界，使用 [0, 0]；其余顶点与边界点一一对应。
 * @param normals 边界点单位外法线列表
 * @returns 填充顶点法线缓冲
 */
const CreateFillNormalBuffer = (normals: readonly RectPoint[]): Float32Array => {
    if (normals.length === 0) {
        return new Float32Array(0);
    }

    const normal: number[] = [0, 0];

    for (const pointNormal of normals) {
        normal.push(pointNormal[0], pointNormal[1]);
    }

    return new Float32Array(normal);
};

/**
 * 生成中心三角扇使用的填充 UV。
 * @param points 边界点列表
 * @param width 矩形宽度
 * @param height 矩形高度
 * @returns 填充 UV 缓冲
 */
const CreateFillUvBuffer = (
    points: readonly RectPoint[],
    width: number,
    height: number,
): Float32Array => {
    if (points.length === 0 || width === 0 || height === 0) {
        return new Float32Array(0);
    }

    const uv: number[] = [0.5, 0.5];
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    for (const point of points) {
        uv.push(
            (point[0] + halfWidth) / width,
            (point[1] + halfHeight) / height,
        );
    }

    return new Float32Array(uv);
};

/**
 * 生成中心三角扇使用的填充索引。
 * @param points 边界点列表
 * @returns 填充索引缓冲
 */
const CreateFillIndexBuffer = (points: readonly RectPoint[]): Uint16Array => {
    if (points.length < 3) {
        return new Uint16Array(0);
    }

    const index: number[] = [];

    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
        const current = pointIndex + 1;
        const next = pointIndex + 1 === points.length ? 1 : pointIndex + 2;

        index.push(0, current, next);
    }

    return new Uint16Array(index);
};

/**
 * 将向外偏移一个单位的参考轮廓拆分为单位法线与 miter 补偿倍率。
 * @param centerPoints 中心轮廓点
 * @param extrudePoints 向外偏移一个单位的参考轮廓点
 * @returns 每个轮廓点的单位外法线与 miter 补偿倍率
 */
const CreatePerimeterNormalData = (
    centerPoints: readonly RectPoint[],
    extrudePoints: readonly RectPoint[],
): { normal: RectPoint[]; miterScale: number[] } => {
    if (centerPoints.length !== extrudePoints.length) {
        return { normal: [], miterScale: [] };
    }

    const normal: RectPoint[] = [];
    const miterScale: number[] = [];

    for (let pointIndex = 0; pointIndex < centerPoints.length; pointIndex += 1) {
        const centerPoint = centerPoints[pointIndex];
        const extrudePoint = extrudePoints[pointIndex];
        const extrudeX = extrudePoint[0] - centerPoint[0];
        const extrudeY = extrudePoint[1] - centerPoint[1];
        const scale = Math.hypot(extrudeX, extrudeY);

        if (scale === 0) {
            normal.push([0, 0]);
            miterScale.push(0);
            continue;
        }

        normal.push([extrudeX / scale, extrudeY / scale]);
        miterScale.push(scale);
    }

    return { normal, miterScale };
};

/**
 * 生成中心轮廓载体组成的边框三角面、法线、miter 倍率、UV 与索引。
 * 闭合处复制首对顶点，使 U 可以从 0 连续增长到 uvRepeat。
 * @param centerPoints 原始中心轮廓点
 * @param normals 中心轮廓点单位外法线
 * @param miterScales 中心轮廓点 miter 补偿倍率
 * @param uvRepeat 顺线方向 UV 重复次数
 * @returns 边框缓冲数据
 */
const CreateBorderBuffers = (
    centerPoints: readonly RectPoint[],
    normals: readonly RectPoint[],
    miterScales: readonly number[],
    uvRepeat: number,
): Pick<RectBorderGeometryData, "geometry" | "normal" | "uv" | "index" | "miterScale"> => {
    const pointCount = centerPoints.length;

    if (pointCount < 2 || normals.length !== pointCount || miterScales.length !== pointCount) {
        return CreateEmptyBorderGeometryBuffers();
    }

    const pathProgress = CreatePathProgress(centerPoints);
    const geometry: number[] = [];
    const normal: number[] = [];
    const miterScale: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];

    for (let pointIndex = 0; pointIndex <= pointCount; pointIndex += 1) {
        const sourceIndex = pointIndex % pointCount;
        const u = pointIndex === pointCount
            ? uvRepeat
            : pathProgress[sourceIndex] * uvRepeat;
        const centerPoint = centerPoints[sourceIndex];
        const pointNormal = normals[sourceIndex];
        const pointMiterScale = miterScales[sourceIndex];

        geometry.push(centerPoint[0], centerPoint[1], centerPoint[0], centerPoint[1]);
        normal.push(pointNormal[0], pointNormal[1], pointNormal[0], pointNormal[1]);
        miterScale.push(pointMiterScale, pointMiterScale);
        uv.push(u, 0, u, 1);
    }

    for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
        const inner = pointIndex * 2;
        const outer = inner + 1;
        const nextInner = inner + 2;
        const nextOuter = inner + 3;

        index.push(inner, outer, nextOuter, inner, nextOuter, nextInner);
    }

    return {
        geometry: new Float32Array(geometry),
        normal: new Float32Array(normal),
        miterScale: new Float32Array(miterScale),
        uv: new Float32Array(uv),
        index: new Uint16Array(index),
    };
};

/**
 * 生成 line-list 使用的轮廓顶点、UV 与索引。
 * @param points 轮廓点列表
 * @param normals 轮廓点单位外法线
 * @param uvRepeat 顺线方向 UV 重复次数
 * @returns line-list 缓冲数据
 */
const CreateLineBuffers = (
    points: readonly RectPoint[],
    normals: readonly RectPoint[],
    uvRepeat: number,
): Pick<RectGeometryData, "geometry" | "normal" | "uv" | "index"> => {
    const pointCount = points.length;

    if (pointCount < 2 || normals.length !== pointCount) {
        return CreateEmptyGeometryBuffers();
    }

    const pathProgress = CreatePathProgress(points);
    const geometry: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];

    for (let pointIndex = 0; pointIndex <= pointCount; pointIndex += 1) {
        const sourceIndex = pointIndex % pointCount;
        const point = points[sourceIndex];
        const pointNormal = normals[sourceIndex];
        const u = pointIndex === pointCount
            ? uvRepeat
            : pathProgress[sourceIndex] * uvRepeat;

        geometry.push(point[0], point[1]);
        normal.push(pointNormal[0], pointNormal[1]);
        uv.push(u, 0);

        if (pointIndex < pointCount) {
            index.push(pointIndex, pointIndex + 1);
        }
    }

    return {
        geometry: new Float32Array(geometry),
        normal: new Float32Array(normal),
        uv: new Float32Array(uv),
        index: new Uint16Array(index),
    };
};

/**
 * 计算闭合轮廓中每个点沿路径的归一化累计距离。
 * @param points 闭合轮廓点列表
 * @returns 每个点对应的 0 到 1 路径进度
 */
const CreatePathProgress = (points: readonly RectPoint[]): number[] => {
    if (points.length < 2) {
        return points.map((): number => 0);
    }

    const cumulative: number[] = [0];
    let totalLength = 0;

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        totalLength += GetPointDistance(points[pointIndex - 1], points[pointIndex]);
        cumulative.push(totalLength);
    }

    totalLength += GetPointDistance(points[points.length - 1], points[0]);

    if (totalLength === 0) {
        return cumulative.map((): number => 0);
    }

    return cumulative.map((distance: number): number => {
        return distance / totalLength;
    });
};

/**
 * 累计闭合轮廓中所有线段的长度。
 * @param points 闭合轮廓点列表
 * @returns 闭合轮廓总长度
 */
const GetClosedPathLength = (points: readonly RectPoint[]): number => {
    if (points.length < 2) {
        return 0;
    }

    let totalLength = 0;

    for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
        const nextIndex = pointIndex + 1 === points.length ? 0 : pointIndex + 1;

        totalLength += GetPointDistance(points[pointIndex], points[nextIndex]);
    }

    return totalLength;
};

/**
 * 计算两个点之间的距离。
 * @param start 起点
 * @param end 终点
 * @returns 两点距离
 */
const GetPointDistance = (start: RectPoint, end: RectPoint): number => {
    return Math.hypot(end[0] - start[0], end[1] - start[1]);
};

/**
 * 计算每个圆角的分段数。
 * 上限保证边框双顶点和闭合复制点不会超过 Uint16 索引范围。
 * @param radius 圆角半径
 * @returns 圆角分段数
 */
const GetCornerSegments = (radius: number): number => {
    return Math.min(4095, Math.max(2, Math.ceil(radius / 8)));
};

/**
 * 根据边框对齐方式计算向内和向外的轮廓偏移量。
 * @param lineWidth 边框宽度
 * @param align 边框对齐方式
 * @returns 向内和向外偏移量
 */
const GetBorderOffsets = (lineWidth: number, align: RectBorderAlign): { inset: number; outset: number } => {
    if (align === "inset") {
        return { inset: lineWidth, outset: 0 };
    }

    if (align === "outset") {
        return { inset: 0, outset: lineWidth };
    }

    const halfLineWidth = lineWidth * 0.5;
    return { inset: halfLineWidth, outset: halfLineWidth };
};

/**
 * 规范化运行时传入的边框对齐方式。
 * @param align 边框对齐方式
 * @returns 安全边框对齐方式
 */
const NormalizeBorderAlign = (align: RectBorderAlign): RectBorderAlign => {
    if (align === "inset" || align === "outset") {
        return align;
    }

    return "normal";
};

/**
 * 规范化矩形参数。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @returns 安全矩形参数
 */
const NormalizeRectParameters = (width: number, height: number, radius: number) => {
    const safeWidth = ToNonNegativeFinite(width);
    const safeHeight = ToNonNegativeFinite(height);
    const halfWidth = safeWidth * 0.5;
    const halfHeight = safeHeight * 0.5;

    return {
        width: safeWidth,
        height: safeHeight,
        halfWidth,
        halfHeight,
        radius: Clamp(ToNonNegativeFinite(radius), 0, Math.min(halfWidth, halfHeight)),
    };
};

/**
 * 将数值限制为有限非负数。
 * @param value 输入值
 * @returns 有限非负数
 */
const ToNonNegativeFinite = (value: number): number => {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
};

/**
 * 创建空几何缓冲。
 * @returns 空顶点、法线、UV 与索引
 */
const CreateEmptyGeometryBuffers = (): Pick<RectGeometryData, "geometry" | "normal" | "uv" | "index"> => {
    return {
        geometry: new Float32Array(0),
        normal: new Float32Array(0),
        uv: new Float32Array(0),
        index: new Uint16Array(0),
    };
};

/**
 * 创建空边框载体缓冲。
 * @returns 空顶点、法线、miter 倍率、UV 与索引
 */
const CreateEmptyBorderGeometryBuffers = (): Pick<
    RectBorderGeometryData,
    "geometry" | "normal" | "uv" | "index" | "miterScale"
> => {
    return {
        ...CreateEmptyGeometryBuffers(),
        miterScale: new Float32Array(0),
    };
};

/**
 * 创建空矩形几何数据。
 * @returns 空矩形几何数据
 */
const CreateEmptyGeometryData = (): RectGeometryData => {
    return {
        ...CreateEmptyGeometryBuffers(),
        width: 0,
        height: 0,
        radius: 0,
    };
};

export { CreateRectBorderGeometry, CreateRectGeometry, CreateRectLineGeometry, CreateRectPointGeometry, GetRectPerimeter, Rect };
export type { RectBorderAlign, RectBorderGeometryData, RectGeometryData, RectLike, RectLineGeometryData, RectPointGeometryData };
