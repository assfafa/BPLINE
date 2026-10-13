import { CheckPrecision } from "../../Utils/index.js";
import { CollectLinePointCenters, CreateBorderBuffers, CreateEmptyBorderGeometryBuffers, CreateEmptyGeometryBuffers, CreateEmptyGeometryData, CreateExtrudeReferencePoints, CreateFillGeometryBuffer, CreateFillIndexBuffer, CreateFillNormalBuffer, CreateFillUvBuffer, CreateLineBuffers, CreatePathProgress, CreatePerimeterNormalData, CreatePerimeterPoints, CreateRoundedBorderPathData, CreateSharpBorderPathData, DefaultRectPrecision, GetClosedPathLength, GetCornerSegments, GetPointDistance, NormalizeBorderAlign, NormalizeRectParameters, PushArc, ToNonNegativeFinite } from "./perimeter.js";

import type { RectBorderAlign, RectBorderGeometryData, RectGeometryData, RectLineGeometryData, RectPoint, RectPointGeometryData } from "./types.js";

/**
 * 获取矩形实际离散轮廓的周长。
 * 宽高和圆角使用与几何生成相同的限制及分段规则。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @example
 * GetRectPerimeter(width, height, radius);
 * @returns 矩形轮廓周长
 */
const GetRectPerimeter = (width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): number => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const points = CreatePerimeterPoints(parameters.halfWidth, parameters.halfHeight, parameters.radius, CheckPrecision(precision));
    return GetClosedPathLength(points);
};

/**
 * 生成矩形填充三角面。
 * 以 (0, 0) 为中心，圆角半径会自动限制到半宽半高的较小值。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @example
 * CreateRectGeometry(width, height, radius, precision);
 * @returns 填充三角面数据
 */
const CreateRectGeometry = (width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): RectGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const segments = CheckPrecision(precision);
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
        precision: CheckPrecision(precision),
    };
};

/**
 * 生成由顶点着色器扩宽的矩形边框载体三角面。
 * geometry 只保存中心轮廓，lineWidth 和 align 不会提前烘焙到顶点位置。
 * normal 保存单位外法线，miterScale 保存直角处的扩展补偿倍率。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @param lineWidth 边框宽度
 * @param uvRepeat 贴图沿完整轮廓顺向重复次数
 * @param align 边框相对原始轮廓的对齐方式
 * @example
 * CreateRectBorderGeometry(width, height, radius, lineWidth, uvRepeat, align, precision);
 * @returns 边框三角面数据
 */
const CreateRectBorderGeometry = (
    width: number,
    height: number,
    radius: number = 0,
    lineWidth: number = 1,
    uvRepeat: number = 1,
    align: RectBorderAlign = "normal",
    precision: number = DefaultRectPrecision(width, height, radius, lineWidth, align),
): RectBorderGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const safeLineWidth = ToNonNegativeFinite(lineWidth);
    const safeUvRepeat = ToNonNegativeFinite(uvRepeat);
    const safeAlign = NormalizeBorderAlign(align);
    const segments = CheckPrecision(precision);
    let borderPathData;
    // 区分直角、圆角或零尺寸，避免生成退化圆弧。
    if (parameters.radius === 0) {
        borderPathData = CreateSharpBorderPathData(parameters.halfWidth, parameters.halfHeight);
    } else {
        borderPathData = CreateRoundedBorderPathData(
            parameters.halfWidth,
            parameters.halfHeight,
            parameters.radius,
            segments,
        );
    }
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
        precision: CheckPrecision(precision),
        lineWidth: safeLineWidth,
        uvRepeat: safeUvRepeat,
        align: safeAlign,
    };
};

/**
 * 生成矩形轮廓的 line-list 顶点、UV 与索引。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @param uvRepeat 贴图沿完整轮廓顺向重复次数
 * @example
 * CreateRectLineGeometry(width, height, radius, uvRepeat, precision);
 * @returns line-list 轮廓数据
 */
const CreateRectLineGeometry = (
    width: number,
    height: number,
    radius: number = 0,
    uvRepeat: number = 1,
    precision: number = DefaultRectPrecision(width, height, radius),
): RectLineGeometryData => {
    const parameters = NormalizeRectParameters(width, height, radius);
    const safeUvRepeat = ToNonNegativeFinite(uvRepeat);
    const segments = CheckPrecision(precision);
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
        precision: CheckPrecision(precision),
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
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @param pointRadius 点型半径，默认 2；四边形为半宽、半高，其他多边形为外接圆半径
 * @param sides 点型边数，必须是至少为 3 的整数；默认 4 为轴对齐正方形
 * @param vertexPoints 是否生成顶点点位，默认开启
 * @param midpointPoints 是否生成中点点位，默认关闭；两个开关不能同时关闭
 * @param vertexThreshold 相邻两条边长度之和必须严格大于此值，例如 10 + 100 > 105
 * @param midpointThreshold 中点所在单条边的长度必须严格大于此值
 * @throws {RangeError} 两个开关同时关闭，边数无效或阈值为 NaN 时抛出
 * @example
 * CreateRectPointGeometry(width, height, radius, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
 * @returns 独立点型的顶点、中心坐标、法线、UV 与索引；超过 65536 个顶点时使用 Uint32Array 索引
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
    precision: number = DefaultRectPrecision(width, height, radius),
): RectPointGeometryData => {
    // 顶点与中点必须至少启用一种，避免调用生成器却没有选择任何点。
    if (!vertexPoints && !midpointPoints) {
        throw new RangeError("vertexPoints and midpointPoints cannot both be false.");
    }
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isSafeInteger(sides) || sides < 3) {
        throw new RangeError("sides must be an integer greater than or equal to 3.");
    }
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (Number.isNaN(vertexThreshold) || Number.isNaN(midpointThreshold)) {
        throw new RangeError("Point thresholds cannot be NaN.");
    }
    const line: RectLineGeometryData = CreateRectLineGeometry(width, height, radius, 1, precision);
    const safePointRadius: number = ToNonNegativeFinite(pointRadius);
    let centers: RectPoint[];
    // 区分直角、圆角或零尺寸，避免生成退化圆弧。
    if (safePointRadius === 0) {
        centers = [];
    } else {
        centers = CollectLinePointCenters(
            line,
            vertexPoints,
            midpointPoints,
            Math.max(0, vertexThreshold),
            Math.max(0, midpointThreshold),
        );
    }
    const vertexCount: number = centers.length * (sides + 1);
    const geometry: Float32Array = new Float32Array(vertexCount * 2);
    const position: Float32Array = new Float32Array(vertexCount * 2);
    const normal: Float32Array = new Float32Array(vertexCount * 2);
    const uv: Float32Array = new Float32Array(vertexCount * 2);
    let index: Uint16Array | Uint32Array;
    // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
    if (vertexCount > 65536) {
        index = new Uint32Array(centers.length * sides * 3);
    } else {
        index = new Uint16Array(centers.length * sides * 3);
    }
    const square: RectPoint[] = [
        [1, 1],
        [1, -1],
        [-1, -1],
        [-1, 1],
    ];
    // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
    for (let pointIndex: number = 0; pointIndex < centers.length; pointIndex += 1) {
        const center: RectPoint = centers[pointIndex];
        const base: number = pointIndex * (sides + 1);
        geometry.set(center, base * 2);
        position.set(center, base * 2);
        uv.set([0.5, 0.5], base * 2);
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let side: number = 0; side < sides; side += 1) {
            const angle: number = Math.PI * 0.5 - (side * Math.PI * 2) / sides;
            let x: number;
            // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
            if (sides === 4) {
                x = square[side][0];
            } else {
                x = Math.cos(angle);
            }
            let y: number;
            // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
            if (sides === 4) {
                y = square[side][1];
            } else {
                y = Math.sin(angle);
            }
            const offset: number = (base + side + 1) * 2;
            const length: number = Math.hypot(x, y);
            geometry.set([center[0] + x * safePointRadius, center[1] + y * safePointRadius], offset);
            position.set(center, offset);
            // 单位径向外法线；三角扇中心的法线保留为 [0, 0]。
            normal.set([x / length, y / length], offset);
            uv.set([x * 0.5 + 0.5, y * 0.5 + 0.5], offset);
            // 每个点型独立闭合，不能把相邻两个点型连接成三角面。
            index.set(
                [base, base + side + 1, base + ((side + 1) % sides) + 1],
                (pointIndex * sides + side) * 3,
            );
        }
    }
    return {
        geometry,
        position,
        normal,
        uv,
        index,
        width: line.width,
        height: line.height,
        radius: line.radius,
        precision: line.precision,
        pointRadius: safePointRadius,
        sides,
        pointCount: centers.length,
    };
};

export { CollectLinePointCenters, CreateBorderBuffers, CreateEmptyBorderGeometryBuffers, CreateEmptyGeometryBuffers, CreateEmptyGeometryData, CreateExtrudeReferencePoints, CreateFillGeometryBuffer, CreateFillIndexBuffer, CreateFillNormalBuffer, CreateFillUvBuffer, CreateLineBuffers, CreatePathProgress, CreatePerimeterNormalData, CreatePerimeterPoints, CreateRectBorderGeometry, CreateRectGeometry, CreateRectLineGeometry, CreateRectPointGeometry, CreateRoundedBorderPathData, CreateSharpBorderPathData, DefaultRectPrecision, GetClosedPathLength, GetCornerSegments, GetPointDistance, GetRectPerimeter, NormalizeBorderAlign, NormalizeRectParameters, PushArc, ToNonNegativeFinite };
