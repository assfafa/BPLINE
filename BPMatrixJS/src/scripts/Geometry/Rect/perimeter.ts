import { Clamp } from "../../Utils/index.js";
import type { RectBorderAlign, RectBorderGeometryData, RectBorderPathData, RectGeometryData, RectLineGeometryData, RectPoint } from "./types.js";

/**
 * 创建圆角边框的中心轮廓、法线和 miter 数据。
 * @param halfWidth 矩形半宽
 * @param halfHeight 矩形半高
 * @param radius 圆角半径
 * @param segments 每个圆角分段数
 * @example
 * CreateRoundedBorderPathData(halfWidth, halfHeight, radius, segments);
 * @returns 圆角边框路径数据
 */
const CreateRoundedBorderPathData = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    segments: number,
): RectBorderPathData => {
    const points = CreatePerimeterPoints(halfWidth, halfHeight, radius, segments, true);
    const normalData = CreatePerimeterNormalData(
        points,
        CreateExtrudeReferencePoints(halfWidth, halfHeight, radius, segments, true),
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
 * @example
 * CreateSharpBorderPathData(halfWidth, halfHeight);
 * @returns 直角边框路径数据
 */
const CreateSharpBorderPathData = (halfWidth: number, halfHeight: number): RectBorderPathData => {
    // 宽高都有效时才生成矩形轮廓，退化尺寸保留空几何。
    if (halfWidth !== 0 && halfHeight !== 0) {
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
            miterScale: [1, miterScale, 1, 1, miterScale, 1, 1, miterScale, 1, 1, miterScale, 1],
        };
    } else {
        return { points: [], normal: [], miterScale: [] };
    }
};

/**
 * 创建相对中心轮廓向外偏移一个单位的参考点。
 * 参考点与中心轮廓的差值用于拆分单位法线和 miter 补偿倍率。
 * @param halfWidth 矩形半宽
 * @param halfHeight 矩形半高
 * @param radius 圆角半径
 * @param segments 每个圆角分段数
 * @param preserveCornerSegments 是否保留圆角采样数量
 * @example
 * CreateExtrudeReferencePoints(halfWidth, halfHeight, radius, segments, preserveCornerSegments);
 * @returns 向外偏移一个单位的参考轮廓点
 */
const CreateExtrudeReferencePoints = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    segments: number,
    preserveCornerSegments: boolean,
): RectPoint[] => {
    let expandedRadius: number = 0;
    // 区分直角、圆角或零尺寸，避免生成退化圆弧。
    if (radius > 0) {
        expandedRadius = radius + 1;
    }
    return CreatePerimeterPoints(
        halfWidth + 1,
        halfHeight + 1,
        expandedRadius,
        segments,
        preserveCornerSegments,
    );
};

/**
 * 从闭合 line-list 中筛选点型中心；先输出顶点，再输出中点。
 * @param line 矩形的 indexed line-list 数据
 * @param vertexPoints 是否保留符合阈值的顶点
 * @param midpointPoints 是否保留符合阈值的中点
 * @param vertexThreshold 顶点相邻边长之和的严格下限
 * @param midpointThreshold 单条线段长度的严格下限
 * @example
 * CollectLinePointCenters(line, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
 * @returns 去除闭合重复顶点后的点型中心
 */
const CollectLinePointCenters = (
    line: RectLineGeometryData,
    vertexPoints: boolean,
    midpointPoints: boolean,
    vertexThreshold: number,
    midpointThreshold: number,
): RectPoint[] => {
    const vertices = new Map<
        string,
        {
            point: RectPoint;
            adjacentLength: number;
        }
    >();
    const midpoints: RectPoint[] = [];
    // 圆角相切处可能产生三角函数舍入残差，只合并机器精度级的重合点。
    const epsilon: number = Math.max(line.width, line.height) * Number.EPSILON * 16 || Number.MIN_VALUE;
    /**
     * 按坐标合并闭合接缝，并累加该顶点连接的边长。
     * @param point 线段端点
     * @param length 当前线段长度
     * @example
     * AddAdjacentLength(point, length);
     * @returns 无返回值
     */
    const AddAdjacentLength = (point: RectPoint, length: number): void => {
        const key: string =
            String(Math.round(point[0] / epsilon)) + "," + String(Math.round(point[1] / epsilon));
        const existing = vertices.get(key);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (existing === undefined) {
            vertices.set(key, { point, adjacentLength: length });
        } else {
            existing.adjacentLength += length;
        }
    };
    // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
    for (let offset: number = 0; offset < line.index.length; offset += 2) {
        const startIndex: number = line.index[offset] * 2;
        const endIndex: number = line.index[offset + 1] * 2;
        const start: RectPoint = [line.geometry[startIndex], line.geometry[startIndex + 1]];
        const end: RectPoint = [line.geometry[endIndex], line.geometry[endIndex + 1]];
        const length: number = GetPointDistance(start, end);
        // 处理转向与退化边界，避免零面积三角面或不稳定法线。
        if (length <= epsilon === false) {
            // 启用顶点标记后，再按相邻边长合计筛选有效节点。
            if (vertexPoints) {
                AddAdjacentLength(start, length);
                AddAdjacentLength(end, length);
            }
            // 开启中点标记且边长超过阈值时才生成该边中点。
            if (midpointPoints && length > midpointThreshold) {
                midpoints.push([(start[0] + end[0]) * 0.5, (start[1] + end[1]) * 0.5]);
            }
        } else {
            continue;
        }
    }
    const centers: RectPoint[] = [];
    // 遍历当前缓存条目，按实际引用关系处理资源。
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
 * @example
 * CreatePerimeterPoints(halfWidth, halfHeight, radius, cornerSegments, preserveCornerSegments);
 * @returns 边界点列表
 */
const CreatePerimeterPoints = (
    halfWidth: number,
    halfHeight: number,
    radius: number,
    cornerSegments: number = GetCornerSegments(radius),
    preserveCornerSegments: boolean = false,
): RectPoint[] => {
    // 宽高都有效时才生成矩形轮廓，退化尺寸保留空几何。
    if (halfWidth !== 0 && halfHeight !== 0) {
        // 区分直角、圆角或零尺寸，避免生成退化圆弧。
        if (radius !== 0 || preserveCornerSegments) {
            const points: RectPoint[] = [];
            PushArc(
                points,
                halfWidth - radius,
                halfHeight - radius,
                radius,
                Math.PI * 0.5,
                0,
                cornerSegments,
            );
            PushArc(
                points,
                halfWidth - radius,
                -halfHeight + radius,
                radius,
                0,
                -Math.PI * 0.5,
                cornerSegments,
            );
            PushArc(
                points,
                -halfWidth + radius,
                -halfHeight + radius,
                radius,
                -Math.PI * 0.5,
                -Math.PI,
                cornerSegments,
            );
            PushArc(
                points,
                -halfWidth + radius,
                halfHeight - radius,
                radius,
                Math.PI,
                Math.PI * 0.5,
                cornerSegments,
            );
            return points;
        } else {
            return [
                [halfWidth, halfHeight],
                [halfWidth, -halfHeight],
                [-halfWidth, -halfHeight],
                [-halfWidth, halfHeight],
            ];
        }
    } else {
        return [];
    }
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
 * @example
 * PushArc(points, centerX, centerY, radius, startAngle, endAngle, segments);
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
    // 按当前范围逐项处理，确保下标不越过有效数据。
    for (let index = 0; index <= segments; index += 1) {
        const progress = index / segments;
        const angle = startAngle + (endAngle - startAngle) * progress;
        points.push([centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius]);
    }
};

/**
 * 生成中心三角扇使用的填充顶点。
 * @param points 边界点列表
 * @example
 * CreateFillGeometryBuffer(points);
 * @returns 填充顶点缓冲
 */
const CreateFillGeometryBuffer = (points: readonly RectPoint[]): Float32Array => {
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (points.length === 0) {
        return new Float32Array(0);
    } else {
        const geometry: number[] = [0, 0];
        // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
        for (const point of points) {
            geometry.push(point[0], point[1]);
        }
        return new Float32Array(geometry);
    }
};

/**
 * 生成中心三角扇使用的二维轮廓外法线。
 * 中心顶点不属于边界，使用 [0, 0]；其余顶点与边界点一一对应。
 * @param normals 边界点单位外法线列表
 * @example
 * CreateFillNormalBuffer(normals);
 * @returns 填充顶点法线缓冲
 */
const CreateFillNormalBuffer = (normals: readonly RectPoint[]): Float32Array => {
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (normals.length === 0) {
        return new Float32Array(0);
    } else {
        const normal: number[] = [0, 0];
        // 逐项处理 normals，保持集合中的既定顺序。
        for (const pointNormal of normals) {
            normal.push(pointNormal[0], pointNormal[1]);
        }
        return new Float32Array(normal);
    }
};

/**
 * 生成中心三角扇使用的填充 UV。
 * @param points 边界点列表
 * @param width 矩形宽度
 * @param height 矩形高度
 * @example
 * CreateFillUvBuffer(points, width, height);
 * @returns 填充 UV 缓冲
 */
const CreateFillUvBuffer = (points: readonly RectPoint[], width: number, height: number): Float32Array => {
    // 零尺寸轴不参与除法，保持 UV 和尺寸结果为有限值。
    if (points.length !== 0 && width !== 0 && height !== 0) {
        const uv: number[] = [0.5, 0.5];
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
        for (const point of points) {
            uv.push((point[0] + halfWidth) / width, (point[1] + halfHeight) / height);
        }
        return new Float32Array(uv);
    } else {
        return new Float32Array(0);
    }
};

/**
 * 生成中心三角扇使用的填充索引。
 * @param points 边界点列表
 * @example
 * CreateFillIndexBuffer(points);
 * @returns 填充索引缓冲
 */
const CreateFillIndexBuffer = (points: readonly RectPoint[]): Uint16Array => {
    // 至少三个轮廓点才有填充三角面。
    if (points.length >= 3) {
        const index: number[] = [];
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
            const current = pointIndex + 1;
            let next;
            // 末尾边连接回首点，保持闭合轮廓的索引连续。
            if (pointIndex + 1 === points.length) {
                next = 1;
            } else {
                next = pointIndex + 2;
            }
            index.push(0, current, next);
        }
        return new Uint16Array(index);
    } else {
        return new Uint16Array(0);
    }
};

/**
 * 将向外偏移一个单位的参考轮廓拆分为单位法线与 miter 补偿倍率。
 * @param centerPoints 中心轮廓点
 * @param extrudePoints 向外偏移一个单位的参考轮廓点
 * @example
 * CreatePerimeterNormalData(centerPoints, extrudePoints);
 * @returns 每个轮廓点的单位外法线与 miter 补偿倍率
 */
const CreatePerimeterNormalData = (
    centerPoints: readonly RectPoint[],
    extrudePoints: readonly RectPoint[],
): {
    normal: RectPoint[];
    miterScale: number[];
} => {
    // 中心轮廓与外扩轮廓一一对应时才能计算法线。
    if (centerPoints.length === extrudePoints.length) {
        const normal: RectPoint[] = [];
        const miterScale: number[] = [];
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let pointIndex = 0; pointIndex < centerPoints.length; pointIndex += 1) {
            const centerPoint = centerPoints[pointIndex];
            const extrudePoint = extrudePoints[pointIndex];
            const extrudeX = extrudePoint[0] - centerPoint[0];
            const extrudeY = extrudePoint[1] - centerPoint[1];
            const scale = Math.hypot(extrudeX, extrudeY);
            // 零长度偏移没有稳定方向，使用备用法线避免除零。
            if (scale === 0) {
                normal.push([0, 0]);
                miterScale.push(0);
                continue;
            } else {
                normal.push([extrudeX / scale, extrudeY / scale]);
                miterScale.push(scale);
            }
        }
        return { normal, miterScale };
    } else {
        return { normal: [], miterScale: [] };
    }
};

/**
 * 生成中心轮廓载体组成的边框三角面、法线、miter 倍率、UV 与索引。
 * 闭合处复制首对顶点，使 U 可以从 0 连续增长到 uvRepeat。
 * @param centerPoints 原始中心轮廓点
 * @param normals 中心轮廓点单位外法线
 * @param miterScales 中心轮廓点 miter 补偿倍率
 * @param uvRepeat 顺线方向 UV 重复次数
 * @example
 * CreateBorderBuffers(centerPoints, normals, miterScales, uvRepeat);
 * @returns 边框缓冲数据
 */
const CreateBorderBuffers = (
    centerPoints: readonly RectPoint[],
    normals: readonly RectPoint[],
    miterScales: readonly number[],
    uvRepeat: number,
): Pick<RectBorderGeometryData, "geometry" | "normal" | "uv" | "index" | "miterScale"> => {
    const pointCount = centerPoints.length;
    // 至少两个轮廓点且法线、补偿倍率数量一致时才生成边框。
    if (pointCount >= 2 && normals.length === pointCount && miterScales.length === pointCount) {
        const pathProgress = CreatePathProgress(centerPoints);
        const geometry: number[] = [];
        const normal: number[] = [];
        const miterScale: number[] = [];
        const uv: number[] = [];
        const index: number[] = [];
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let pointIndex = 0; pointIndex <= pointCount; pointIndex += 1) {
            const sourceIndex = pointIndex % pointCount;
            let u;
            // 接缝复用首点坐标，但 UV 使用完整重复次数以保持连续。
            if (pointIndex === pointCount) {
                u = uvRepeat;
            } else {
                u = pathProgress[sourceIndex] * uvRepeat;
            }
            const centerPoint = centerPoints[sourceIndex];
            const pointNormal = normals[sourceIndex];
            const pointMiterScale = miterScales[sourceIndex];
            geometry.push(centerPoint[0], centerPoint[1], centerPoint[0], centerPoint[1]);
            normal.push(pointNormal[0], pointNormal[1], pointNormal[0], pointNormal[1]);
            miterScale.push(pointMiterScale, pointMiterScale);
            uv.push(u, 0, u, 1);
        }
        // 按当前范围逐项处理，确保下标不越过有效数据。
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
    } else {
        return CreateEmptyBorderGeometryBuffers();
    }
};

/**
 * 生成 line-list 使用的轮廓顶点、UV 与索引。
 * @param points 轮廓点列表
 * @param normals 轮廓点单位外法线
 * @param uvRepeat 顺线方向 UV 重复次数
 * @example
 * CreateLineBuffers(points, normals, uvRepeat);
 * @returns line-list 缓冲数据
 */
const CreateLineBuffers = (
    points: readonly RectPoint[],
    normals: readonly RectPoint[],
    uvRepeat: number,
): Pick<RectGeometryData, "geometry" | "normal" | "uv" | "index"> => {
    const pointCount = points.length;
    // 轮廓点和法线一一对应时才生成带属性的线框。
    if (pointCount >= 2 && normals.length === pointCount) {
        const pathProgress = CreatePathProgress(points);
        const geometry: number[] = [];
        const normal: number[] = [];
        const uv: number[] = [];
        const index: number[] = [];
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let pointIndex = 0; pointIndex <= pointCount; pointIndex += 1) {
            const sourceIndex = pointIndex % pointCount;
            const point = points[sourceIndex];
            const pointNormal = normals[sourceIndex];
            let u;
            // 接缝复用首点坐标，但 UV 使用完整重复次数以保持连续。
            if (pointIndex === pointCount) {
                u = uvRepeat;
            } else {
                u = pathProgress[sourceIndex] * uvRepeat;
            }
            geometry.push(point[0], point[1]);
            normal.push(pointNormal[0], pointNormal[1]);
            uv.push(u, 0);
            // 接缝补点不再增加独立边，避免重复生成首条线段。
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
    } else {
        return CreateEmptyGeometryBuffers();
    }
};

/**
 * 计算闭合轮廓中每个点沿路径的归一化累计距离。
 * @param points 闭合轮廓点列表
 * @example
 * CreatePathProgress(points);
 * @returns 每个点对应的 0 到 1 路径进度
 */
const CreatePathProgress = (points: readonly RectPoint[]): number[] => {
    // 至少两个点才能计算边长或生成线段索引。
    if (points.length >= 2) {
        const cumulative: number[] = [0];
        let totalLength = 0;
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
            totalLength += GetPointDistance(points[pointIndex - 1], points[pointIndex]);
            cumulative.push(totalLength);
        }
        totalLength += GetPointDistance(points[points.length - 1], points[0]);
        // 零周长没有可归一化的顺向距离，统一返回零 UV。
        if (totalLength === 0) {
            /**
 * 为零周长轮廓提供有限的默认顺向 UV。

 * @example
 * ZeroDistanceUv();
 * @returns 零。
 */
            const ZeroDistanceUv = (): number => 0;
            return cumulative.map(ZeroDistanceUv);
        } else {
            /**
             * 用周长归一化累计距离，得到连续的顺向 UV。
             * @param distance 从轮廓起点累计的距离
             * @example
             * NormalizeDistanceUv(distance);
             * @returns 归一化累计距离。
             */
            const NormalizeDistanceUv = (distance: number): number => {
                return distance / totalLength;
            };
            return cumulative.map(NormalizeDistanceUv);
        }
    } else {
        /**
 * 为缺少有效边的节点提供默认 UV。

 * @example
 * CreateDefaultUv();
 * @returns 零。
 */
        const CreateDefaultUv = (): number => 0;
        return points.map(CreateDefaultUv);
    }
};

/**
 * 累计闭合轮廓中所有线段的长度。
 * @param points 闭合轮廓点列表
 * @example
 * GetClosedPathLength(points);
 * @returns 闭合轮廓总长度
 */
const GetClosedPathLength = (points: readonly RectPoint[]): number => {
    // 至少两个点才能计算边长或生成线段索引。
    if (points.length >= 2) {
        let totalLength = 0;
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
            let nextIndex;
            // 末尾边连接回首点，保持闭合轮廓的索引连续。
            if (pointIndex + 1 === points.length) {
                nextIndex = 0;
            } else {
                nextIndex = pointIndex + 1;
            }
            totalLength += GetPointDistance(points[pointIndex], points[nextIndex]);
        }
        return totalLength;
    } else {
        return 0;
    }
};

/**
 * 计算两个点之间的距离。
 * @param start 起点
 * @param end 终点
 * @example
 * GetPointDistance(start, end);
 * @returns 两点距离
 */
const GetPointDistance = (start: RectPoint, end: RectPoint): number => {
    return Math.hypot(end[0] - start[0], end[1] - start[1]);
};

/**
 * 计算每个圆角的分段数。
 * 上限保证边框双顶点和闭合复制点不会超过 Uint16 索引范围。
 * @param radius 圆角半径
 * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
 * @example
 * GetCornerSegments(radius);
 * @returns 圆角分段数
 */
const GetCornerSegments = (radius: number): number => {
    return Math.min(4095, Math.max(2, Math.ceil(radius / 8)));
};

/**
 * 省略精度时保留原有半径推算及尺寸规范化行为。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @param lineWidth 可选边框宽度
 * @param align 边框对齐方式
 * @example DefaultRectPrecision(100, 100, 50);
 * @returns 原有圆角分段数。
 */
const DefaultRectPrecision = (width: number, height: number, radius: number,
    lineWidth: number = 0, align: RectBorderAlign = "normal"): number => {
    const parameters = NormalizeRectParameters(width, height, radius);
    let outerRadius = parameters.radius;
    // 只有圆角宽边框按外侧半径提高旧默认采样，直角不生成圆弧。
    if (outerRadius > 0) {
        const safeWidth = ToNonNegativeFinite(lineWidth);
        // 原有外边框使用完整宽度，中边框使用一半宽度。
        if (align === "outset") {
            outerRadius += safeWidth;
        } else if (align !== "inset") {
            // 未识别的对齐值沿用原 normal 行为。
            outerRadius += safeWidth / 2;
        }
    }
    return GetCornerSegments(outerRadius);
};

/**
 * 规范化运行时传入的边框对齐方式。
 * @param align 边框对齐方式
 * @example
 * NormalizeBorderAlign(align);
 * @returns 安全边框对齐方式
 */
const NormalizeBorderAlign = (align: RectBorderAlign): RectBorderAlign => {
    // 按内外侧和对齐方式计算边框偏移，保持宽度方向一致。
    if (align !== "inset" && align !== "outset") {
        return "normal";
    } else {
        return align;
    }
};

/**
 * 规范化矩形参数。
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param radius 圆角半径
 * @example
 * NormalizeRectParameters(width, height, radius);
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
 * @example
 * ToNonNegativeFinite(value);
 * @returns 有限非负数
 */
const ToNonNegativeFinite = (value: number): number => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (Number.isFinite(value)) {
        return Math.max(0, value);
    } else {
        return 0;
    }
};

/**
 * 创建空几何缓冲。
 * @example
 * CreateEmptyGeometryBuffers();
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
 * @example
 * CreateEmptyBorderGeometryBuffers();
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
 * @example
 * CreateEmptyGeometryData();
 * @returns 空矩形几何数据
 */
const CreateEmptyGeometryData = (): RectGeometryData => {
    return {
        ...CreateEmptyGeometryBuffers(),
        width: 0,
        height: 0,
        radius: 0,
        precision: 8,
    };
};

export { CollectLinePointCenters, CreateBorderBuffers, CreateEmptyBorderGeometryBuffers, CreateEmptyGeometryBuffers, CreateEmptyGeometryData, CreateExtrudeReferencePoints, CreateFillGeometryBuffer, CreateFillIndexBuffer, CreateFillNormalBuffer, CreateFillUvBuffer, CreateLineBuffers, CreatePathProgress, CreatePerimeterNormalData, CreatePerimeterPoints, CreateRoundedBorderPathData, CreateSharpBorderPathData, DefaultRectPrecision, GetClosedPathLength, GetCornerSegments, GetPointDistance, NormalizeBorderAlign, NormalizeRectParameters, PushArc, ToNonNegativeFinite };
