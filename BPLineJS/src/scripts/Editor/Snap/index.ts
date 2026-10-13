import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import NGon2D from "../../Geometry/NGon2D";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import { ComputeMinorGridStep } from "../../Helper/GridStep";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import Text from "../../Text";
import { MeasureText } from "../../Text/layout";

/** 吸附总开关之外的四类独立候选，均默认开启。 */
interface SnapOptions {
    /** 原始轮廓顶点；NGon 超过九边时不提供此类目标。 */
    vertex: boolean;
    /** 轮廓边段内部的最近投影点。 */
    edge: boolean;
    /** 两条轮廓边段实际相交的位置。 */
    intersection: boolean;
    /** 以世界原点为基准的 HelperGrid 细格交点。 */
    grid: boolean;
}

interface SnapSegment {
    start: Vec2;
    end: Vec2;
}

interface SnapGeometry {
    vertices: Vec2[];
    segments: SnapSegment[];
}

/** @returns 四项全部开启的独立吸附配置。 @example const options = CreateSnapOptions(); */
const CreateSnapOptions = (): SnapOptions => ({ vertex: true, edge: true, intersection: true, grid: true });

/**
 * 将几何局部点投影到 Mesh 的世界坐标。
 * @param matrix 三乘三列主序世界矩阵
 * @param x 局部横坐标
 * @param y 局部纵坐标
 * @example const world = TransformSnapPoint(matrix, 2, 3);
 * @returns 世界坐标点
 */
const TransformSnapPoint = (matrix: ArrayLike<number>, x: number, y: number): Vec2 => new Vec2(
    matrix[0] * x + matrix[3] * y + matrix[6],
    matrix[1] * x + matrix[4] * y + matrix[7],
);

/**
 * 判断目标世界点是否落在鼠标的屏幕容差内。
 * @param point 目标世界点
 * @param cursor 鼠标屏幕位置
 * @param radius 屏幕像素半径
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example const near = IsNearSnapPoint(point, cursor, 10, camera, render);
 * @returns 是否在容差范围内
 */
const IsNearSnapPoint = (point: Vec2, cursor: Vec2, radius: number, camera: Camera, render: Render): boolean => {
    const projected = camera.worldToWindow(point, render);
    return Math.hypot(projected.x - cursor.x, projected.y - cursor.y) <= radius;
};

/**
 * 把轮廓节点变换成世界坐标；不读取填充三角化生成的内部顶点。
 * @param mesh 场景中的几何对象
 * @param camera 可见尺寸补偿所用相机
 * @returns 轮廓与闭合状态，或不支持的 null
 * @example const outline = ReadSnapOutline(mesh);
 */
const ReadSnapOutline = (mesh: Mesh, camera?: Camera): { contours: { vertices: Vec2[]; closed: boolean }[]; allowVertices: boolean } | null => {
    const geometry = mesh.data;
    let matrix = mesh.ensureWorldMatrix().data;
    // 吸附到实际绘制的轮廓，不能使用抵消 zoom 前的逻辑尺寸。
    if (camera !== undefined) {
        matrix = mesh.getRenderMatrix(camera).data;
    }
    // 矩形忽略圆角，以设计尺寸外框参与吸附。
    if (geometry instanceof Rect2D) {
        const halfWidth = geometry.width / 2;
        const halfHeight = geometry.height / 2;
        return {
            contours: [{
                vertices: [
                    TransformSnapPoint(matrix, -halfWidth, -halfHeight),
                    TransformSnapPoint(matrix, halfWidth, -halfHeight),
                    TransformSnapPoint(matrix, halfWidth, halfHeight),
                    TransformSnapPoint(matrix, -halfWidth, halfHeight),
                ],
                closed: true,
            }],
            allowVertices: true,
        };
    } else if (geometry instanceof Text) {
        // 字体吸附只有排版框四角与四边，字形内部点不参与候选。
        const bounds = MeasureText(geometry);
        return {
            contours: [{
                vertices: [
                    TransformSnapPoint(matrix, bounds.left, bounds.bottom),
                    TransformSnapPoint(matrix, bounds.right, bounds.bottom),
                    TransformSnapPoint(matrix, bounds.right, bounds.top),
                    TransformSnapPoint(matrix, bounds.left, bounds.top),
                ],
                closed: true,
            }],
            allowVertices: true,
        };
    } else if (geometry instanceof NGon2D) {
        // 正多边形含内孔时外圈和内圈分别参与边线求交。
        const contours: { vertices: Vec2[]; closed: boolean }[] = [];
        // 内孔也提供真实轮廓边；密集正多边形的顶点吸附仍按既有规则关闭。
        for (const radius of [geometry.outer, geometry.inner]) {
            // 零半径内圈不形成可绘制边界。
            if (radius > 0) {
                const vertices: Vec2[] = [];
                // 按原始边数生成轮廓，不以三角化结果作为边线。
                for (let index = 0; index < geometry.sides; index++) {
                    const angle = geometry.startAngle + index * Math.PI * 2 / geometry.sides;
                    vertices.push(TransformSnapPoint(matrix, Math.cos(angle) * radius, Math.sin(angle) * radius));
                }
                contours.push({ vertices, closed: true });
            }
        }
        return { contours, allowVertices: geometry.sides <= 9 };
    } else if (geometry instanceof Poly2D) {
        // 多边形开放状态由原始 closed 标志保留。
        const vertices: Vec2[] = [];
        // 开放折线仅取原始有序节点，不补末点到首点。
        for (let offset = 0; offset < geometry.points.length; offset += 2) {
            vertices.push(TransformSnapPoint(matrix, geometry.points[offset], geometry.points[offset + 1]));
        }
        return { contours: [{ vertices, closed: geometry.closed }], allowVertices: true };
    } else {
        return null;
    }
};

/**
 * 收集可吸附的对象轮廓，一次手势可缓存，避免每帧重建场景拓扑。
 * @param scene 当前场景
 * @param excluded 本次被编辑对象，不允许吸附到自身旧轮廓
 * @param camera 可见尺寸补偿所用相机；省略时使用逻辑世界轮廓
 * @returns 世界轮廓节点和有序边
 * @example const targets = CollectSnapGeometry(scene, moving);
 */
const CollectSnapGeometry = (scene: Scene, excluded: ReadonlySet<Mesh> = new Set(), camera?: Camera): SnapGeometry => {
    const targets: SnapGeometry = { vertices: [], segments: [] };
    // 场景绘制列表已经排除不在树上的 Mesh，辅助对象由 noSelect 再过滤。
    for (const candidate of scene.ensureLists()) {
        // 冻结手势时排除被移动对象，避免吸到操作前的自身位置。
        if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect &&
            !excluded.has(candidate) && candidate.material !== undefined) {
            const outline = ReadSnapOutline(candidate, camera);
            // 仅标准二维轮廓具有这里定义的可吸附边。
            if (outline !== null) {
                // 多轮廓 NGon 的内外圈分别形成封闭边。
                for (const contour of outline.contours) {
                    // 高边数 NGon 仍提供边，但不提供密集顶点目标。
                    if (outline.allowVertices) {
                        targets.vertices.push(...contour.vertices);
                    }
                    let edgeCount = contour.vertices.length - 1;
                    // 只有闭合轮廓才连接最后一个节点与第一个节点。
                    if (contour.closed) {
                        edgeCount = contour.vertices.length;
                    }
                    // 非闭合路径不能凭空生成末点到首点的边。
                    for (let index = 0; index < edgeCount; index++) {
                        targets.segments.push({
                            start: contour.vertices[index],
                            end: contour.vertices[(index + 1) % contour.vertices.length],
                        });
                    }
                }
            }
        }
    }
    return targets;
};

/**
 * 两条非平行线段的内部交点；共享端点由顶点开关负责。
 * @param first 第一条世界边
 * @param second 第二条世界边
 * @returns 真正相交的世界点，否则 null
 * @example const crossing = SegmentIntersection(first, second);
 */
const SegmentIntersection = (first: SnapSegment, second: SnapSegment): Vec2 | null => {
    const ax = first.end.x - first.start.x;
    const ay = first.end.y - first.start.y;
    const bx = second.end.x - second.start.x;
    const by = second.end.y - second.start.y;
    const denominator = ax * by - ay * bx;
    // 平行或重叠边没有唯一交点，交给边线吸附处理。
    if (Math.abs(denominator) > Number.EPSILON) {
        const dx = second.start.x - first.start.x;
        const dy = second.start.y - first.start.y;
        const firstFraction = (dx * by - dy * bx) / denominator;
        const secondFraction = (dx * ay - dy * ax) / denominator;
        const firstWithin = firstFraction >= -0.000001 && firstFraction <= 1.000001;
        const secondWithin = secondFraction >= -0.000001 && secondFraction <= 1.000001;
        const firstInterior = firstFraction > 0.000001 && firstFraction < 0.999999;
        const secondInterior = secondFraction > 0.000001 && secondFraction < 0.999999;
        // T 形相接有一个内部交点；共用端点留给顶点吸附处理。
        if (firstWithin && secondWithin && (firstInterior || secondInterior)) {
            return new Vec2(first.start.x + ax * firstFraction, first.start.y + ay * firstFraction);
        }
    }
    return null;
};

/**
 * 取原始位置附近的顶点、边投影、交点和细格点，统一用屏幕半径筛选。
 * @param world 未吸附世界点
 * @param targets 固定的目标轮廓
 * @param options 各类吸附开关
 * @param radius 屏幕像素容差
 * @param camera 当前相机
 * @param render 当前渲染器
 * @returns 容差内的吸附世界点
 * @example const points = NearbySnapPoints(world, targets, options, 10, camera, render);
 */
const NearbySnapPoints = (
    world: Vec2, targets: SnapGeometry, options: SnapOptions, radius: number,
    camera: Camera, render: Render,
): Vec2[] => {
    const candidates: Vec2[] = [];
    const cursor = camera.worldToWindow(world, render);
    // 顶点开关只负责真实轮廓节点，不与边线候选混合。
    if (options.vertex) {
        // 顶点查询数量通常远小于填充三角形数。
        for (const vertex of targets.vertices) {
            // 目标超出屏幕容差时不参与竞争。
            if (IsNearSnapPoint(vertex, cursor, radius, camera, render)) {
                candidates.push(vertex);
            }
        }
    }
    const localSegments: SnapSegment[] = [];
    // 交点只需比较鼠标附近的边，避免每帧全场景两两相交。
    if (options.edge || options.intersection) {
        // 边线投影始终在屏幕空间完成，容差不随相机缩放改变。
        for (const segment of targets.segments) {
            const start = camera.worldToWindow(segment.start, render);
            const end = camera.worldToWindow(segment.end, render);
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const squaredLength = dx * dx + dy * dy;
            // 零长度轮廓边不能产生稳定投影。
            if (squaredLength > Number.EPSILON) {
                const fraction = Math.max(0, Math.min(1,
                    ((cursor.x - start.x) * dx + (cursor.y - start.y) * dy) / squaredLength));
                const projected = new Vec2(start.x + dx * fraction, start.y + dy * fraction);
                // 只有鼠标附近的线段需要做交点与边线候选计算。
                if (Math.hypot(projected.x - cursor.x, projected.y - cursor.y) <= radius) {
                    localSegments.push(segment);
                    // 端点由 vertex 控制，关闭顶点吸附时边线不重新引入端点。
                    if (options.edge && fraction > 0.000001 && fraction < 0.999999) {
                        candidates.push(new Vec2(
                            segment.start.x + (segment.end.x - segment.start.x) * fraction,
                            segment.start.y + (segment.end.y - segment.start.y) * fraction,
                        ));
                    }
                }
            }
        }
    }
    // 交点包括跨物体相交与同一路径的自交，但不重复普通共用端点。
    if (options.intersection) {
        // 局部线段集先经过鼠标邻域筛选，二次遍历不扫描整场景。
        for (let first = 0; first < localSegments.length; first++) {
            // 每对线段只求交一次。
            for (let second = first + 1; second < localSegments.length; second++) {
                const crossing = SegmentIntersection(localSegments[first], localSegments[second]);
                // 远离鼠标的几何交点不应吸附。
                if (crossing !== null && IsNearSnapPoint(crossing, cursor, radius, camera, render)) {
                    candidates.push(crossing);
                }
            }
        }
    }
    // 网格与 HelperGrid 共用同一动态细格计算，原点始终是世界零点。
    if (options.grid) {
        const step = ComputeMinorGridStep(camera, render);
        // 视口暂未布局时不能启用网格吸附。
        if (step > 0) {
            const gridPoint = new Vec2(
                Math.round(world.x / step) * step,
                Math.round(world.y / step) * step,
            );
            // 网格点仍受屏幕容差约束，避免远距离跳跃。
            if (IsNearSnapPoint(gridPoint, cursor, radius, camera, render)) {
                candidates.push(gridPoint);
            }
        }
    }
    return candidates;
};

/**
 * 在四类目标中返回离原始指针最近的一项。
 * @param world 未吸附世界点
 * @param targets 目标轮廓
 * @param options 吸附分项
 * @param radius 屏幕像素容差
 * @param camera 当前相机
 * @param render 当前渲染器
 * @returns 最佳目标及屏幕距离，或 null
 * @example const candidate = FindPointSnap(world, targets, options, 10, camera, render);
 */
const FindPointSnap = (
    world: Vec2, targets: SnapGeometry, options: SnapOptions, radius: number,
    camera: Camera, render: Render,
): { point: Vec2; distance: number } | null => {
    const cursor = camera.worldToWindow(world, render);
    let best: { point: Vec2; distance: number } | null = null;
    // 四种候选在同一屏幕距离下竞争，调用方可继续与步进结果比较。
    for (const candidate of NearbySnapPoints(world, targets, options, radius, camera, render)) {
        const screen = camera.worldToWindow(candidate, render);
        const distance = Math.hypot(screen.x - cursor.x, screen.y - cursor.y);
        // 同距离维持较早候选，顶点因而先于边与网格。
        if (best === null || distance < best.distance) {
            best = { point: candidate, distance };
        }
    }
    return best;
};

/**
 * 为旋转中的每个源点生成边、交点和网格候选，并保留全部目标顶点射线。
 * @param pivot 世界旋转中心
 * @param sources 按下时的世界顶点
 * @param angle 原始旋转增量
 * @param targets 固定目标轮廓
 * @param options 吸附分项
 * @param radius 屏幕容差
 * @param camera 当前相机
 * @param render 当前渲染器
 * @returns 旋转角度函数可用的目标点
 * @example const points = RotationSnapTargets(pivot, sources, angle, targets, options, 10, camera, render);
 */
const RotationSnapTargets = (
    pivot: Vec2, sources: readonly Vec2[], angle: number, targets: SnapGeometry,
    options: SnapOptions, radius: number, camera: Camera, render: Render,
): Vec2[] => {
    const result: Vec2[] = [];
    // 顶点旋转按方向比较，可使用全部目标顶点；其余候选只取当前位置附近。
    if (options.vertex) {
        result.push(...targets.vertices);
    }
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const dynamicOptions: SnapOptions = { ...options, vertex: false };
    // 每个源顶点旋转到原始鼠标角度，再寻找边、交点和网格目标。
    for (const source of sources) {
        const dx = source.x - pivot.x;
        const dy = source.y - pivot.y;
        const proposed = new Vec2(pivot.x + dx * cosine - dy * sine, pivot.y + dx * sine + dy * cosine);
        result.push(...NearbySnapPoints(proposed, targets, dynamicOptions, radius, camera, render));
    }
    return result;
};

/**
 * 为等比缩放中的每个源点生成边、交点和网格候选。
 * @param pivot 世界缩放中心
 * @param sources 按下时的世界顶点
 * @param factor 原始缩放倍率
 * @param targets 固定目标轮廓
 * @param options 吸附分项
 * @param radius 屏幕容差
 * @param camera 当前相机
 * @param render 当前渲染器
 * @returns 等比缩放函数可用的目标点
 * @example const points = UniformScaleSnapTargets(pivot, sources, factor, targets, options, 10, camera, render);
 */
const UniformScaleSnapTargets = (
    pivot: Vec2, sources: readonly Vec2[], factor: number, targets: SnapGeometry,
    options: SnapOptions, radius: number, camera: Camera, render: Render,
): Vec2[] => {
    const result: Vec2[] = [];
    // 等比倍率可能让远处顶点同向对齐，保留全部目标顶点。
    if (options.vertex) {
        result.push(...targets.vertices);
    }
    const dynamicOptions: SnapOptions = { ...options, vertex: false };
    // 先预测原始倍率下的位置，再生成局部连续边线候选。
    for (const source of sources) {
        const proposed = new Vec2(
            pivot.x + (source.x - pivot.x) * factor,
            pivot.y + (source.y - pivot.y) * factor,
        );
        result.push(...NearbySnapPoints(proposed, targets, dynamicOptions, radius, camera, render));
    }
    return result;
};

export {
    CollectSnapGeometry, CreateSnapOptions, FindPointSnap, NearbySnapPoints,
    ReadSnapOutline, RotationSnapTargets, UniformScaleSnapTargets,
};
export type { SnapGeometry, SnapOptions, SnapSegment };
