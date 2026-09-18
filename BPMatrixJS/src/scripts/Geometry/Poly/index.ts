import { CreatePath, Cross, JoinNormal, Nonnegative, Segments, Triangulate } from "./Path.js";
import type { Path } from "./Path.js";
import type {
    PolyPoint,
    PolyNode,
    PolyOptions,
    PolyBorderAlign,
    PolyGeometryData,
    PolyBorderGeometryData,
    PolyLineGeometryData,
    PolyPointGeometryData,
    PolyLike,
} from "./types.js";
/**
 * 将轮廓属性和临时数值数组整理为类型化几何数据。
 * @param path 路径
 * @param geometry 顶点
 * @param normal 法线
 * @param uv 纹理坐标
 * @param index 索引
 * @example
 * Pack(path, geometry, normal, uv, index);
 * @returns 类型化几何数组
 */
const Pack = (
    path: Path,
    geometry: number[] = [],
    normal: number[] = [],
    uv: number[] = [],
    index: number[] = [],
): PolyGeometryData => {
    let indices: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
    // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
    if (geometry.length / 2 > 65536) {
        indices = new Uint32Array(index);
    } else {
        indices = new Uint16Array(index);
    }
    return {
        geometry: new Float32Array(geometry),
        normal: new Float32Array(normal),
        uv: new Float32Array(uv),
        index: indices,
        width: path.width,
        height: path.height,
        minX: path.minX,
        minY: path.minY,
        closed: path.closed,
    };
};
/**
 * 圆盘使用中心扇形，圆环逐段缝合内外圈；不会用扇形跨过内孔。
 * @param path 轮廓
 * @example
 * Fill(path);
 * @returns 填充三角面；关闭 solid 时返回空数组
 */
const Fill = (path: Path): PolyGeometryData => {
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (path.solid && path.normals.length !== 0) {
        const geometry: number[] = [];
        const normal: number[] = [];
        const uv: number[] = [];
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let i = 0; i < path.points.length; i++) {
            const p = path.points[i];
            const n = JoinNormal(path, i);
            geometry.push(p.x, p.y);
            normal.push(n[0], n[1]);
            let u: number = 0.5;
            let v: number = 0.5;
            // 零尺寸轴不参与除法，保持 UV 和尺寸结果为有限值。
            if (path.width !== 0) {
                u = (p.x - path.minX) / path.width;
            }
            // 零尺寸轴不参与除法，保持 UV 和尺寸结果为有限值。
            if (path.height !== 0) {
                v = (p.y - path.minY) / path.height;
            }
            uv.push(u, v);
        }
        return Pack(path, geometry, normal, uv, Triangulate(path));
    } else {
        return Pack(path);
    }
};
/**
 * 沿原始轮廓生成独立线段，不增加圆角细分点。
 * @param path 轮廓
 * @param uvRepeat 顺向重复次数
 * @example
 * Line(path, uvRepeat);
 * @returns line-list 数据，不输出圆接细分点
 */
const Line = (path: Path, uvRepeat: number): PolyLineGeometryData => {
    Nonnegative(uvRepeat, "uvRepeat");
    const geometry: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const index: number[] = [];
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (path.normals.length === 0) {
        return { ...Pack(path), uvRepeat };
    } else {
        let count;
        // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
        if (path.closed) {
            count = path.points.length + 1;
        } else {
            count = path.points.length;
        }
        // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
        for (let i = 0; i < count; i++) {
            const id = i % path.points.length;
            const p = path.points[id];
            const n = JoinNormal(path, id);
            geometry.push(p.x, p.y);
            normal.push(n[0], n[1]);
            uv.push((path.distances[i] / path.length) * uvRepeat, 0.5);
            // 从第二个点开始连接上一点，避免生成无效的负索引。
            if (i > 0) {
                index.push(i - 1, i);
            }
        }
        return { ...Pack(path, geometry, normal, uv, index), uvRepeat };
    }
};
/**
 * 生成与 Rect 相同的 Shader 外扩载体，端点为 butt 平头。
 * 尖角使用斜接；圆接只细分转弯外侧，内侧交点避免重复叠色。
 * 圆接精度不移动中心节点，也不增加中心线周长；连接处 U 保持节点处的值。
 * @param path 路径
 * @param lineWidth 统一线宽；不在 geometry 中烘焙，需要 Shader 外扩
 * @param uvRepeat 沿中心线完整长度的重复次数
 * @param align 闭合路径内中外；开放路径 inset 为左侧、outset 为右侧
 * @example
 * Border(path, lineWidth, uvRepeat, align);
 * @returns 边框载体三角面及 normal/miterScale/uv
 */
const Border = (
    path: Path,
    lineWidth: number,
    uvRepeat: number,
    align: PolyBorderAlign,
): PolyBorderGeometryData => {
    Nonnegative(lineWidth, "lineWidth");
    Nonnegative(uvRepeat, "uvRepeat");
    // 按内外侧和对齐方式计算边框偏移，保持宽度方向一致。
    if (!["inset", "normal", "outset"].includes(align)) {
        throw new Error("Unknown Poly border align.");
    }
    const geometry: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const indices: number[] = [];
    const miterScale: number[] = [];
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (path.normals.length === 0) {
        return { ...Pack(path), miterScale: new Float32Array(0), lineWidth, uvRepeat, align };
    } else {
        const expanded: PolyNode[] = [];
        /**
         * 计算相邻边的有向转角，供连接处圆弧细分使用。
         * @param _ 当前元素，此回调只使用下标
         * @param i 当前元素下标
         * @example
         * GetTurnAngle(_, i);
         * @returns 有向转角弧度。
         */
        const GetTurnAngle = (_: PolyNode, i: number): number => {
            // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
            if (path.closed || (i !== 0 && i !== path.points.length - 1)) {
                const a = path.normals[(i + path.normals.length - 1) % path.normals.length];
                const b = path.normals[i];
                return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
            } else {
                return 0;
            }
        };
        const turn = path.points.map(GetTurnAngle);
        /**
         * 计算每个原始轮廓节点的角平分线及宽度补偿。
         * @param _ 当前元素，此回调只使用下标
         * @param i 当前元素下标
         * @example
         * GetJoinNormal(_, i);
         * @returns 二维法线分量和斜接补偿倍率。
         */
        const GetJoinNormal = (_: PolyNode, i: number): [number, number, number] => JoinNormal(path, i);
        const joins = path.points.map(GetJoinNormal);
        /**
         * 写入一个顶点的坐标及配套属性，返回新顶点下标。
         * @param node 节点
         * @param n 法线
         * @param factor 斜接倍率
         * @param u 顺向 UV
         * @param side 内侧0/外侧1
         * @example
         * Vertex(node, n, factor, u, side);
         * @returns 新顶点下标
         */
        const Vertex = (
            node: number,
            n: readonly number[],
            factor: number,
            u: number,
            side: number,
        ): number => {
            const p = path.points[node];
            const index = geometry.length / 2;
            geometry.push(p.x, p.y);
            normal.push(n[0], n[1]);
            miterScale.push(factor);
            uv.push(u, side);
            // 用统一中线偏移确定正面，不按当前 align 删除退化面，允许 Shader 后续切换对齐。
            let halfWidth: number = 0.5;
            // 按内外侧和对齐方式计算边框偏移，保持宽度方向一致。
            if (side === 0) {
                halfWidth = -0.5;
            }
            const offset = halfWidth * factor;
            expanded.push({ x: p.x + n[0] * offset, y: p.y + n[1] * offset });
            return index;
        };
        /**
         * 按约定绕序追加非退化三角面索引。
         * @param a 下标
         * @param b 下标
         * @param c 下标
         * @example
         * Triangle(a, b, c);
         * @returns 无返回值。
         */
        const Triangle = (a: number, b: number, c: number): void => {
            const area = Cross(expanded[a], expanded[b], expanded[c]);
            // 处理转向与退化边界，避免零面积三角面或不稳定法线。
            if (Math.abs(area) <= Number.EPSILON === false) {
                // 处理转向与退化边界，避免零面积三角面或不稳定法线。
                if (area > 0) {
                    indices.push(a, c, b);
                } else {
                    indices.push(a, b, c);
                }
            } else {
                return;
            }
        };
        /**
         * 按连接类型选择边端点的法线，并生成对应边框顶点。
         * @param node 节点
         * @param edge 当前边
         * @param side 内外侧
         * @param u 顺向 UV
         * @example
         * End(node, edge, side, u);
         * @returns 段端点顶点
         */
        const End = (node: number, edge: number, side: number, u: number): number => {
            const rounded = path.points[node].round && Math.abs(turn[node]) > 1e-8;
            let outerSide;
            // 处理转向与退化边界，避免零面积三角面或不稳定法线。
            if (turn[node] > 0) {
                outerSide = 1;
            } else {
                outerSide = 0;
            }
            let n;
            // 按内外侧和对齐方式计算边框偏移，保持宽度方向一致。
            if (rounded && side === outerSide) {
                n = path.normals[edge];
            } else {
                n = joins[node];
            }
            let factor: number = 1;
            // 角平分线带有斜接补偿，普通边法线使用默认一倍宽度。
            if (n.length === 3) {
                factor = n[2];
            }
            return Vertex(node, n, factor, u, side);
        };
        // 只有正线宽才生成实体边框三角面。
        if (lineWidth > 0) {
            // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
            for (let edge = 0; edge < path.normals.length; edge++) {
                const next = (edge + 1) % path.points.length;
                const u0 = (path.distances[edge] / path.length) * uvRepeat;
                const u1 = (path.distances[edge + 1] / path.length) * uvRepeat;
                const a = End(edge, edge, 0, u0);
                const b = End(edge, edge, 1, u0);
                const c = End(next, edge, 0, u1);
                const d = End(next, edge, 1, u1);
                Triangle(a, b, c);
                Triangle(b, d, c);
            }
            // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
            for (let i = 0; i < path.points.length; i++) {
                const angle = turn[i];
                // 圆接节点存在实际转角时才插入细分弧，直线连接不增加顶点。
                if (path.points[i].round && Math.abs(angle) <= 1e-8 === false) {
                    let side;
                    // 转角符号决定外侧边框位于哪一侧。
                    if (angle > 0) {
                        side = 1;
                    } else {
                        side = 0;
                    }
                    const u = (path.distances[i] / path.length) * uvRepeat;
                    const anchor = Vertex(i, joins[i], joins[i][2], u, 1 - side);
                    const previous = path.normals[(i + path.normals.length - 1) % path.normals.length];
                    const start = Math.atan2(previous[1], previous[0]);
                    const segments = path.points[i].segments ?? 8;
                    let last = Vertex(i, previous, 1, u, side);
                    // 按当前范围逐项处理，确保下标不越过有效数据。
                    for (let step = 1; step <= segments; step++) {
                        const theta = start + (angle * step) / segments;
                        const next = Vertex(i, [Math.cos(theta), Math.sin(theta)], 1, u, side);
                        Triangle(anchor, last, next);
                        last = next;
                    }
                } else {
                    continue;
                }
            }
        }
        return {
            ...Pack(path, geometry, normal, uv, indices),
            miterScale: new Float32Array(miterScale),
            lineWidth,
            uvRepeat,
            align,
        };
    }
};
/**
 * 顶点点型和线段中点合并成一次三角面绘制的数据。
 * 开放端点的相邻边长之和只计算实际存在的一条边。
 * @param path 路径
 * @param pointRadius 点型半径，四边形为半宽半高
 * @param sides 点型边数，4 为正方形
 * @param vertexPoints 是否生成原始节点点位
 * @param midpointPoints 是否生成每条边中点；不能与 vertexPoints 同时关闭
 * @param vertexThreshold 节点相邻边长之和的严格下限
 * @param midpointThreshold 单条边长的严格下限
 * @example
 * Points(path, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
 * @returns 点位几何，UV 使用各点包围盒归一化，绝不沿轮廓重复
 */
const Points = (
    path: Path,
    pointRadius: number,
    sides: number,
    vertexPoints: boolean,
    midpointPoints: boolean,
    vertexThreshold: number,
    midpointThreshold: number,
): PolyPointGeometryData => {
    Nonnegative(pointRadius, "pointRadius");
    Segments(sides, 3);
    Nonnegative(vertexThreshold, "vertexThreshold");
    Nonnegative(midpointThreshold, "midpointThreshold");
    // 顶点与中点必须至少启用一种，避免调用生成器却没有选择任何点。
    if (!vertexPoints && !midpointPoints) {
        throw new Error("Enable vertexPoints or midpointPoints.");
    }
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (path.normals.length === 0) {
        return { ...Pack(path), position: new Float32Array(0), pointRadius, sides, pointCount: 0 };
    } else {
        const centers: PolyNode[] = [];
        // 启用顶点标记后，再按相邻边长合计筛选有效节点。
        if (vertexPoints) {
            // 按当前范围逐项处理，确保下标不越过有效数据。
            for (let i = 0; i < path.points.length; i++) {
                let previous;
                // 首点按轮廓闭合状态取前边长度，开放端点没有前边。
                if (i === 0) {
                    // 区分闭合轮廓与开放折线，端点不能错误连接到另一端。
                    if (path.closed) {
                        previous = path.lengths.at(-1) ?? 0;
                    } else {
                        previous = 0;
                    }
                } else {
                    previous = path.lengths[i - 1];
                }
                const next = path.lengths[i] ?? 0;
                // 相邻两边长度之和超过阈值才生成顶点标记。
                if (previous + next > vertexThreshold) {
                    centers.push(path.points[i]);
                }
            }
        }
        // 中点标记独立于顶点标记，可只生成线段中点。
        if (midpointPoints) {
            // 按当前范围逐项处理，确保下标不越过有效数据。
            for (let i = 0; i < path.lengths.length; i++) {
                // 单条边超过中点阈值后才在其中心放置标记。
                if (path.lengths[i] <= midpointThreshold === false) {
                    const a = path.points[i];
                    const b = path.points[(i + 1) % path.points.length];
                    centers.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
                } else {
                    continue;
                }
            }
        }
        const geometry: number[] = [];
        const normal: number[] = [];
        const uv: number[] = [];
        const indices: number[] = [];
        const position: number[] = [];
        // 区分直角、圆角或零尺寸，避免生成退化圆弧。
        if (pointRadius > 0) {
            // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
            for (const center of centers) {
                const base = geometry.length / 2;
                geometry.push(center.x, center.y);
                normal.push(0, 0);
                uv.push(0.5, 0.5);
                position.push(center.x, center.y);
                // 按索引顺序处理三角面，保持绕序及属性下标一致。
                for (let side = 0; side < sides; side++) {
                    let startAngle: number = 0;
                    // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
                    if (sides === 4) {
                        startAngle = Math.PI / 4;
                    }
                    const angle = startAngle - (Math.PI * 2 * side) / sides;
                    const nx = Math.cos(angle);
                    const ny = Math.sin(angle);
                    let scale;
                    // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
                    if (sides === 4) {
                        scale = Math.SQRT2;
                    } else {
                        scale = 1;
                    }
                    const x = nx * scale;
                    const y = ny * scale;
                    geometry.push(center.x + x * pointRadius, center.y + y * pointRadius);
                    normal.push(nx, ny);
                    position.push(center.x, center.y);
                    uv.push(x / 2 + 0.5, y / 2 + 0.5);
                    indices.push(base, base + side + 1, base + ((side + 1) % sides) + 1);
                }
            }
        }
        let pointCount: number = 0;
        // 区分直角、圆角或零尺寸，避免生成退化圆弧。
        if (pointRadius > 0) {
            pointCount = centers.length;
        }
        return {
            ...Pack(path, geometry, normal, uv, indices),
            position: new Float32Array(position),
            pointRadius,
            sides,
            pointCount,
        };
    }
};
/** 单轮廓多边形/折线生成器，不持有任何 GPU 资源。 */
class Poly implements PolyLike {
    private _path: Path;
    private _data: PolyGeometryData;
    private _borderData: PolyBorderGeometryData | undefined;
    private _lineData: PolyLineGeometryData | undefined;
    private _pointData: PolyPointGeometryData | undefined;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param points 有序节点，默认空集；点数不足时不生成几何
     * @param options 默认闭合并生成填充
     * @example
     * const poly = new Poly(points, options);
     * @returns 创建的 Poly 对象。
     */
    public constructor(points: readonly PolyPoint[] = [], options: PolyOptions = {}) {
        this._path = CreatePath(points, options);
        this._data = Fill(this._path);
    }
    /**
     * 规范化后的只读节点；闭合轮廓统一逆时针。
     * @example
     * const value = poly.points;
     * @returns 规范化后的只读节点；闭合轮廓统一逆时针。
     */
    public get points(): readonly PolyNode[] {
        return this._path.points;
    }
    /**
     * 原始轮廓包围盒宽度。
     * @example
     * const value = poly.width;
     * @returns 原始轮廓包围盒宽度。
     */
    public get width(): number {
        return this._path.width;
    }
    /**
     * 原始轮廓包围盒高度。
     * @example
     * const value = poly.height;
     * @returns 原始轮廓包围盒高度。
     */
    public get height(): number {
        return this._path.height;
    }
    /**
     * 是否闭合。
     * @example
     * const value = poly.closed;
     * @returns 是否闭合。
     */
    public get closed(): boolean {
        return this._path.closed;
    }
    /**
     * 是否生成实体面。
     * @example
     * const value = poly.solid;
     * @returns 是否生成实体面。
     */
    public get solid(): boolean {
        return this._path.solid;
    }
    /**
     * 填充数组，关闭 solid 时为空数组。
     * @example
     * const value = poly.data;
     * @returns 填充数组，关闭 solid 时为空数组。
     */
    public get data(): PolyGeometryData {
        return this._data;
    }
    /**
     * 最近生成的边框载体。
     * @example
     * const value = poly.borderData;
     * @returns 最近生成的边框载体。
     */
    public get borderData(): PolyBorderGeometryData | undefined {
        return this._borderData;
    }
    /**
     * 最近生成的 line-list 数据。
     * @example
     * const value = poly.lineData;
     * @returns 最近生成的 line-list 数据。
     */
    public get lineData(): PolyLineGeometryData | undefined {
        return this._lineData;
    }
    /**
     * 最近生成的点型数据。
     * @example
     * const value = poly.pointData;
     * @returns 最近生成的点型数据。
     */
    public get pointData(): PolyPointGeometryData | undefined {
        return this._pointData;
    }
    /**
     * 更新输入参数并使已有生成结果失效。
     * @param points 新节点
     * @param options 未传时保留当前开关
     * @example
     * poly.set(points, options);
     * @returns 当前生成器；旧附加数据失效
     */
    public set(points: readonly PolyPoint[], options: PolyOptions = {}): this {
        const path = CreatePath(points, {
            closed: options.closed ?? this.closed,
            solid: options.solid ?? this.solid,
        });
        const data = Fill(path);
        this._path = path;
        this._data = data;
        this._borderData = undefined;
        this._lineData = undefined;
        this._pointData = undefined;
        return this;
    }
    /**
     * 计算当前轮廓周长，供顺向 UV 重复量等计算使用。
     * @example
     * poly.getPerimeter();
     * @returns 中心轮廓长度，开放路径不包含末点到首点
     */
    public getPerimeter(): number {
        return this._path.length;
    }
    /**
     * 生成带宽度边框的三角面及其法线、UV 和索引。
     * @param lineWidth 统一边框宽度
     * @param uvRepeat 顺向重复次数
     * @param align 边框对齐
     * @example
     * poly.createBorderGeometry(lineWidth, uvRepeat, align);
     * @returns Shader 外扩载体
     */
    public createBorderGeometry(
        lineWidth: number,
        uvRepeat: number = 1,
        align: PolyBorderAlign = "normal",
    ): PolyBorderGeometryData {
        this._borderData = Border(this._path, lineWidth, uvRepeat, align);
        return this._borderData;
    }
    /**
     * 生成沿轮廓连接的 line-list 顶点与索引数据。
     * @param uvRepeat 顺向重复次数
     * @example
     * poly.createLineGeometry(uvRepeat);
     * @returns line-list 顶点与索引
     */
    public createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData {
        this._lineData = Line(this._path, uvRepeat);
        return this._lineData;
    }
    /**
     * 按顶点与中点选项生成合并点型几何。
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 顶点开关
     * @param midpointPoints 中点开关
     * @param vertexThreshold 共边长度合计阈值
     * @param midpointThreshold 单边长度阈值
     * @example
     * poly.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 合并点型几何
     */
    public createPointGeometry(
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): PolyPointGeometryData {
        this._pointData = Points(
            this._path,
            pointRadius,
            sides,
            vertexPoints,
            midpointPoints,
            vertexThreshold,
            midpointThreshold,
        );
        return this._pointData;
    }
}
/**
 * 生成单条多边形轮廓的填充几何。
 * @param points 有序节点
 * @param options 闭合/填充开关
 * @example
 * CreatePolyGeometry(points, options);
 * @returns 填充三角面
 */
const CreatePolyGeometry = (points: readonly PolyPoint[], options: PolyOptions = {}): PolyGeometryData =>
    Fill(CreatePath(points, options));
/**
 * 生成多边形或折线的带宽度边框。
 * @param points 有序节点
 * @param lineWidth 边框宽度
 * @param uvRepeat 顺向重复次数
 * @param align 对齐方式
 * @param options 默认闭合；开放时设置 closed:false
 * @example
 * CreatePolyBorderGeometry(points, lineWidth, uvRepeat, align, options);
 * @returns 边框载体
 */
const CreatePolyBorderGeometry = (
    points: readonly PolyPoint[],
    lineWidth: number = 1,
    uvRepeat: number = 1,
    align: PolyBorderAlign = "normal",
    options: PolyOptions = {},
): PolyBorderGeometryData =>
    Border(CreatePath(points, { ...options, solid: options.solid ?? false }), lineWidth, uvRepeat, align);
/**
 * 生成多边形或折线的 line-list 几何。
 * @param points 有序节点
 * @param uvRepeat 顺向重复次数
 * @param options 闭合开关
 * @example
 * CreatePolyLineGeometry(points, uvRepeat, options);
 * @returns line-list 数据
 */
const CreatePolyLineGeometry = (
    points: readonly PolyPoint[],
    uvRepeat: number = 1,
    options: PolyOptions = {},
): PolyLineGeometryData => Line(CreatePath(points, { ...options, solid: options.solid ?? false }), uvRepeat);
/**
 * 生成多边形或折线的顶点和中点标记。
 * @param points 有序节点
 * @param pointRadius 点型半径
 * @param sides 点型边数
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 共边长度合计阈值
 * @param midpointThreshold 单边长度阈值
 * @param options 闭合开关
 * @example
 * CreatePolyPointGeometry(points, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold, options);
 * @returns 合并点型几何
 */
const CreatePolyPointGeometry = (
    points: readonly PolyPoint[],
    pointRadius: number = 2,
    sides: number = 4,
    vertexPoints: boolean = true,
    midpointPoints: boolean = false,
    vertexThreshold: number = 0,
    midpointThreshold: number = 0,
    options: PolyOptions = {},
): PolyPointGeometryData =>
    Points(
        CreatePath(points, { ...options, solid: options.solid ?? false }),
        pointRadius,
        sides,
        vertexPoints,
        midpointPoints,
        vertexThreshold,
        midpointThreshold,
    );
/**
 * 计算多边形或折线的有效边长总和。
 * @param points 有序节点
 * @param options 闭合开关
 * @example
 * GetPolyPerimeter(points, options);
 * @returns 实际轮廓长度
 */
const GetPolyPerimeter = (points: readonly PolyPoint[], options: PolyOptions = {}): number =>
    CreatePath(points, { ...options, solid: options.solid ?? false }).length;
export {
    Poly,
    CreatePolyGeometry,
    CreatePolyBorderGeometry,
    CreatePolyLineGeometry,
    CreatePolyPointGeometry,
    GetPolyPerimeter,
};
export type * from "./types.js";
export default Poly;
