import { CreatePath, Cross, JoinNormal, Nonnegative, Segments, Triangulate } from "./Path.js";
import type { Path } from "./Path.js";
import type { PolyPoint, PolyNode, PolyOptions, PolyBorderAlign, PolyGeometryData, PolyBorderGeometryData, PolyLineGeometryData, PolyPointGeometryData, PolyLike } from "./types.js";

/**
 * @param path 路径
 * @param geometry 顶点
 * @param normal 法线
 * @param uv 纹理坐标
 * @param index 索引
 * @returns 类型化几何数组
 */
const Pack = (path: Path, geometry: number[] = [], normal: number[] = [], uv: number[] = [], index: number[] = []): PolyGeometryData => ({
    geometry: new Float32Array(geometry), normal: new Float32Array(normal), uv: new Float32Array(uv),
    index: geometry.length / 2 > 65536 ? new Uint32Array(index) : new Uint16Array(index),
    width: path.width, height: path.height, minX: path.minX, minY: path.minY, closed: path.closed,
});

/**
 * @param path 轮廓
 * @returns 填充三角面；关闭 solid 时返回空数组
 */
const Fill = (path: Path): PolyGeometryData => {
    if (!path.solid || path.normals.length === 0) return Pack(path);
    const geometry: number[] = [], normal: number[] = [], uv: number[] = [];
    for (let i = 0; i < path.points.length; i++) {
        const p = path.points[i], n = JoinNormal(path, i);
        geometry.push(p.x, p.y); normal.push(n[0], n[1]);
        uv.push(path.width === 0 ? 0.5 : (p.x - path.minX) / path.width, path.height === 0 ? 0.5 : (p.y - path.minY) / path.height);
    }
    return Pack(path, geometry, normal, uv, Triangulate(path));
};

/**
 * @param path 轮廓
 * @param uvRepeat 顺向重复次数
 * @returns line-list 数据，不输出圆接细分点
 */
const Line = (path: Path, uvRepeat: number): PolyLineGeometryData => {
    Nonnegative(uvRepeat, "uvRepeat");
    const geometry: number[] = [], normal: number[] = [], uv: number[] = [], index: number[] = [];
    if (path.normals.length === 0) return { ...Pack(path), uvRepeat };
    const count = path.closed ? path.points.length + 1 : path.points.length;
    for (let i = 0; i < count; i++) {
        const id = i % path.points.length, p = path.points[id], n = JoinNormal(path, id);
        geometry.push(p.x, p.y); normal.push(n[0], n[1]);
        uv.push(path.distances[i] / path.length * uvRepeat, 0.5);
        if (i > 0) index.push(i - 1, i);
    }
    return { ...Pack(path, geometry, normal, uv, index), uvRepeat };
};

/**
 * 生成与 Rect 相同的 Shader 外扩载体，端点为 butt 平头。
 * 尖角使用斜接；圆接只细分转弯外侧，内侧交点避免重复叠色。
 * 圆接精度不移动中心节点，也不增加中心线周长；连接处 U 保持节点处的值。
 * @param path 路径
 * @param lineWidth 统一线宽；不在 geometry 中烘焙，需要 Shader 外扩
 * @param uvRepeat 沿中心线完整长度的重复次数
 * @param align 闭合路径内中外；开放路径 inset 为左侧、outset 为右侧
 * @returns 边框载体三角面及 normal/miterScale/uv
 */
const Border = (path: Path, lineWidth: number, uvRepeat: number, align: PolyBorderAlign): PolyBorderGeometryData => {
    Nonnegative(lineWidth, "lineWidth"); Nonnegative(uvRepeat, "uvRepeat");
    if (!["inset", "normal", "outset"].includes(align)) throw new Error("Unknown Poly border align.");
    const geometry: number[] = [], normal: number[] = [], uv: number[] = [], indices: number[] = [], miterScale: number[] = [];
    if (path.normals.length === 0) return { ...Pack(path), miterScale: new Float32Array(0), lineWidth, uvRepeat, align };
    const expanded: PolyNode[] = [];
    const turn = path.points.map((_, i): number => {
        if (!path.closed && (i === 0 || i === path.points.length - 1)) return 0;
        const a = path.normals[(i + path.normals.length - 1) % path.normals.length], b = path.normals[i];
        return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
    });
    const joins = path.points.map((_, i): [number, number, number] => JoinNormal(path, i));
    /**
     * @param node 节点
     * @param n 法线
     * @param factor 斜接倍率
     * @param u 顺向 UV
     * @param side 内侧0/外侧1
     * @returns 新顶点下标
     */
    const Vertex = (node: number, n: readonly number[], factor: number, u: number, side: number): number => {
        const p = path.points[node], index = geometry.length / 2;
        geometry.push(p.x, p.y); normal.push(n[0], n[1]); miterScale.push(factor); uv.push(u, side);
        // 用统一中线偏移确定正面，不按当前 align 删除退化面，允许 Shader 后续切换对齐。
        const offset = (side === 0 ? -0.5 : 0.5) * factor;
        expanded.push({ x: p.x + n[0] * offset, y: p.y + n[1] * offset });
        return index;
    };
    /**
     * @param a 下标
     * @param b 下标
     * @param c 下标
     */
    const Triangle = (a: number, b: number, c: number): void => {
        const area = Cross(expanded[a], expanded[b], expanded[c]);
        if (Math.abs(area) <= Number.EPSILON) return;
        if (area > 0) indices.push(a, c, b); else indices.push(a, b, c);
    };
    /**
     * @param node 节点
     * @param edge 当前边
     * @param side 内外侧
     * @param u 顺向 UV
     * @returns 段端点顶点
     */
    const End = (node: number, edge: number, side: number, u: number): number => {
        const rounded = path.points[node].round && Math.abs(turn[node]) > 1e-8;
        const outerSide = turn[node] > 0 ? 1 : 0;
        const n = rounded && side === outerSide ? path.normals[edge] : joins[node];
        return Vertex(node, n, n.length === 3 ? n[2] : 1, u, side);
    };
    if (lineWidth > 0) {
        for (let edge = 0; edge < path.normals.length; edge++) {
            const next = (edge + 1) % path.points.length;
            const u0 = path.distances[edge] / path.length * uvRepeat, u1 = path.distances[edge + 1] / path.length * uvRepeat;
            const a = End(edge, edge, 0, u0), b = End(edge, edge, 1, u0);
            const c = End(next, edge, 0, u1), d = End(next, edge, 1, u1);
            Triangle(a, b, c); Triangle(b, d, c);
        }
        for (let i = 0; i < path.points.length; i++) {
            const angle = turn[i];
            if (!path.points[i].round || Math.abs(angle) <= 1e-8) continue;
            const side = angle > 0 ? 1 : 0, u = path.distances[i] / path.length * uvRepeat;
            const anchor = Vertex(i, joins[i], joins[i][2], u, 1 - side);
            const previous = path.normals[(i + path.normals.length - 1) % path.normals.length];
            const start = Math.atan2(previous[1], previous[0]), segments = path.points[i].segments ?? 8;
            let last = Vertex(i, previous, 1, u, side);
            for (let step = 1; step <= segments; step++) {
                const theta = start + angle * step / segments;
                const next = Vertex(i, [Math.cos(theta), Math.sin(theta)], 1, u, side);
                Triangle(anchor, last, next); last = next;
            }
        }
    }
    return { ...Pack(path, geometry, normal, uv, indices), miterScale: new Float32Array(miterScale), lineWidth, uvRepeat, align };
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
 * @returns 点位几何，UV 使用各点包围盒归一化，绝不沿轮廓重复
 */
const Points = (path: Path, pointRadius: number, sides: number, vertexPoints: boolean, midpointPoints: boolean, vertexThreshold: number, midpointThreshold: number): PolyPointGeometryData => {
    Nonnegative(pointRadius, "pointRadius"); Segments(sides, 3);
    Nonnegative(vertexThreshold, "vertexThreshold"); Nonnegative(midpointThreshold, "midpointThreshold");
    if (!vertexPoints && !midpointPoints) throw new Error("Enable vertexPoints or midpointPoints.");
    if (path.normals.length === 0) return { ...Pack(path), position: new Float32Array(0), pointRadius, sides, pointCount: 0 };
    const centers: PolyNode[] = [];
    if (vertexPoints) {
        for (let i = 0; i < path.points.length; i++) {
            const previous = i === 0 ? (path.closed ? path.lengths.at(-1) ?? 0 : 0) : path.lengths[i - 1];
            const next = path.lengths[i] ?? 0;
            if (previous + next > vertexThreshold) centers.push(path.points[i]);
        }
    }
    if (midpointPoints) {
        for (let i = 0; i < path.lengths.length; i++) {
            if (path.lengths[i] <= midpointThreshold) continue;
            const a = path.points[i], b = path.points[(i + 1) % path.points.length];
            centers.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        }
    }
    const geometry: number[] = [], normal: number[] = [], uv: number[] = [], indices: number[] = [], position: number[] = [];
    if (pointRadius > 0) {
        for (const center of centers) {
            const base = geometry.length / 2;
            geometry.push(center.x, center.y); normal.push(0, 0); uv.push(0.5, 0.5); position.push(center.x, center.y);
            for (let side = 0; side < sides; side++) {
                const angle = (sides === 4 ? Math.PI / 4 : 0) - Math.PI * 2 * side / sides;
                const nx = Math.cos(angle), ny = Math.sin(angle), scale = sides === 4 ? Math.SQRT2 : 1;
                const x = nx * scale, y = ny * scale;
                geometry.push(center.x + x * pointRadius, center.y + y * pointRadius);
                normal.push(nx, ny); position.push(center.x, center.y); uv.push(x / 2 + 0.5, y / 2 + 0.5);
                indices.push(base, base + side + 1, base + (side + 1) % sides + 1);
            }
        }
    }
    return { ...Pack(path, geometry, normal, uv, indices), position: new Float32Array(position), pointRadius, sides, pointCount: pointRadius > 0 ? centers.length : 0 };
};

/** 单轮廓多边形/折线生成器，不持有任何 GPU 资源。 */
class Poly implements PolyLike {
    private _path: Path;
    private _data: PolyGeometryData;
    private _borderData: PolyBorderGeometryData | undefined;
    private _lineData: PolyLineGeometryData | undefined;
    private _pointData: PolyPointGeometryData | undefined;

    /**
     * @param points 有序节点，默认空集；点数不足时不生成几何
     * @param options 默认闭合并生成填充
     */
    public constructor(points: readonly PolyPoint[] = [], options: PolyOptions = {}) {
        this._path = CreatePath(points, options);
        this._data = Fill(this._path);
    }
    /** 规范化后的只读节点；闭合轮廓统一逆时针。 */
    public get points(): readonly PolyNode[] { return this._path.points; }
    /** 原始轮廓包围盒宽度。 */
    public get width(): number { return this._path.width; }
    /** 原始轮廓包围盒高度。 */
    public get height(): number { return this._path.height; }
    /** 是否闭合。 */
    public get closed(): boolean { return this._path.closed; }
    /** 是否生成实体面。 */
    public get solid(): boolean { return this._path.solid; }
    /** 填充数组，关闭 solid 时为空数组。 */
    public get data(): PolyGeometryData { return this._data; }
    /** 最近生成的边框载体。 */
    public get borderData(): PolyBorderGeometryData | undefined { return this._borderData; }
    /** 最近生成的 line-list 数据。 */
    public get lineData(): PolyLineGeometryData | undefined { return this._lineData; }
    /** 最近生成的点型数据。 */
    public get pointData(): PolyPointGeometryData | undefined { return this._pointData; }

    /**
     * @param points 新节点
     * @param options 未传时保留当前开关
     * @returns 当前生成器；旧附加数据失效
     */
    public set(points: readonly PolyPoint[], options: PolyOptions = {}): this {
        const path = CreatePath(points, { closed: options.closed ?? this.closed, solid: options.solid ?? this.solid });
        const data = Fill(path);
        this._path = path; this._data = data;
        this._borderData = undefined; this._lineData = undefined; this._pointData = undefined;
        return this;
    }
    /** @returns 中心轮廓长度，开放路径不包含末点到首点 */
    public getPerimeter(): number { return this._path.length; }
    /**
     * @param lineWidth 统一边框宽度
     * @param uvRepeat 顺向重复次数
     * @param align 边框对齐
     * @returns Shader 外扩载体
     */
    public createBorderGeometry(lineWidth: number, uvRepeat: number = 1, align: PolyBorderAlign = "normal"): PolyBorderGeometryData {
        this._borderData = Border(this._path, lineWidth, uvRepeat, align);
        return this._borderData;
    }
    /**
     * @param uvRepeat 顺向重复次数
     * @returns line-list 顶点与索引
     */
    public createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData {
        this._lineData = Line(this._path, uvRepeat); return this._lineData;
    }
    /**
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 顶点开关
     * @param midpointPoints 中点开关
     * @param vertexThreshold 共边长度合计阈值
     * @param midpointThreshold 单边长度阈值
     * @returns 合并点型几何
     */
    public createPointGeometry(pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0): PolyPointGeometryData {
        this._pointData = Points(this._path, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
        return this._pointData;
    }
}

/**
 * @param points 有序节点
 * @param options 闭合/填充开关
 * @returns 填充三角面
 */
const CreatePolyGeometry = (points: readonly PolyPoint[], options: PolyOptions = {}): PolyGeometryData => Fill(CreatePath(points, options));
/**
 * @param points 有序节点
 * @param lineWidth 边框宽度
 * @param uvRepeat 顺向重复次数
 * @param align 对齐方式
 * @param options 默认闭合；开放时设置 closed:false
 * @returns 边框载体
 */
const CreatePolyBorderGeometry = (points: readonly PolyPoint[], lineWidth: number = 1, uvRepeat: number = 1, align: PolyBorderAlign = "normal", options: PolyOptions = {}): PolyBorderGeometryData => Border(CreatePath(points, { ...options, solid: options.solid ?? false }), lineWidth, uvRepeat, align);
/**
 * @param points 有序节点
 * @param uvRepeat 顺向重复次数
 * @param options 闭合开关
 * @returns line-list 数据
 */
const CreatePolyLineGeometry = (points: readonly PolyPoint[], uvRepeat: number = 1, options: PolyOptions = {}): PolyLineGeometryData => Line(CreatePath(points, { ...options, solid: options.solid ?? false }), uvRepeat);
/**
 * @param points 有序节点
 * @param pointRadius 点型半径
 * @param sides 点型边数
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 共边长度合计阈值
 * @param midpointThreshold 单边长度阈值
 * @param options 闭合开关
 * @returns 合并点型几何
 */
const CreatePolyPointGeometry = (points: readonly PolyPoint[], pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, options: PolyOptions = {}): PolyPointGeometryData => Points(CreatePath(points, { ...options, solid: options.solid ?? false }), pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
/**
 * @param points 有序节点
 * @param options 闭合开关
 * @returns 实际轮廓长度
 */
const GetPolyPerimeter = (points: readonly PolyPoint[], options: PolyOptions = {}): number => CreatePath(points, { ...options, solid: options.solid ?? false }).length;

export { Poly, CreatePolyGeometry, CreatePolyBorderGeometry, CreatePolyLineGeometry, CreatePolyPointGeometry, GetPolyPerimeter };
export type * from "./types.js";
export default Poly;
