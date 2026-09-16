import Poly from "./Poly/index.js";
import type { PolyBorderAlign, PolyBorderGeometryData, PolyGeometryData, PolyLineGeometryData, PolyNode, PolyPointGeometryData } from "./Poly/types.js";

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
    set(options: NGonOptions): this;
    getPerimeter(): number;
    createBorderGeometry(lineWidth: number, uvRepeat?: number, align?: PolyBorderAlign): PolyBorderGeometryData;
    createLineGeometry(uvRepeat?: number): PolyLineGeometryData;
    createPointGeometry(pointRadius?: number, sides?: number, vertexPoints?: boolean, midpointPoints?: boolean, vertexThreshold?: number, midpointThreshold?: number): PolyPointGeometryData;
}

type Settings = Readonly<Required<NGonOptions>>;
interface Bounds { width: number; height: number; minX: number; minY: number }
type Part = PolyGeometryData & { miterScale?: Float32Array; position?: Float32Array };

/** @param options 待验证参数 @returns 规范化参数，先验证再更新对象 */
const Normalize = (options: Required<NGonOptions>): Settings => {
    if (!Number.isInteger(options.sides) || options.sides < 2 || options.sides > 65536) throw new RangeError("NGon sides must be an integer in [2, 65536].");
    if (!(new Set<string>(["bounding", "polar"])).has(options.nvMode)) throw new TypeError("Invalid NGon nvMode.");
    if (typeof options.hole !== "boolean" || typeof options.solid !== "boolean") throw new TypeError("NGon switches must be boolean.");
    for (const radius of [options.outer, options.inter]) {
        if (radius < 0 || !Number.isFinite(Math.fround(radius * 2))) throw new RangeError("NGon radii must be finite, nonnegative Float32 sizes.");
    }
    if (!Number.isFinite(options.startAngle)) throw new RangeError("NGon startAngle must be finite.");
    return Object.freeze({ ...options, startAngle: options.startAngle % (Math.PI * 2), inter: Math.min(options.inter, options.outer) });
};

/** @param settings 参数 @param radius 半径 @returns 逆时针节点，圆心保持在原点 */
const Nodes = (settings: Settings, radius: number): PolyNode[] => {
    if (radius === 0) return [];
    return Array.from({ length: settings.sides }, (_, i): PolyNode => {
        const angle = settings.startAngle + i * Math.PI * 2 / settings.sides;
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
};

/** @param nodes 外圈节点 @returns 实际包围盒，空集返回零 */
const GetBounds = (nodes: readonly PolyNode[]): Bounds => {
    if (nodes.length === 0) return { width: 0, height: 0, minX: 0, minY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of nodes) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
    return { minX, minY, width: maxX - minX, height: maxY - minY };
};

/** @param bounds 包围盒 @returns 空几何，退化或关闭填充时使用 */
const Empty = (bounds: Bounds): PolyGeometryData => ({
    ...bounds, closed: true, geometry: new Float32Array(0), normal: new Float32Array(0), uv: new Float32Array(0), index: new Uint16Array(0),
});

/**
 * 圆盘使用中心扇形，圆环逐段缝合内外圈；不会用扇形跨过内孔。
 * @param settings 参数
 * @param nodes 外圈节点
 * @param bounds 包围盒
 * @returns CW 三角面，polar 在 U=0/1 的接缝复制顶点
 */
const Fill = (settings: Settings, nodes: readonly PolyNode[], bounds: Bounds): PolyGeometryData => {
    const inner = settings.hole ? settings.inter : 0;
    if (!settings.solid || settings.sides === 2 || settings.outer === 0 || inner === settings.outer) return Empty(bounds);
    const geometry: number[] = [], normal: number[] = [], uv: number[] = [], indices: number[] = [];
    /** @param p 坐标 @param u 极坐标 U @param v 极坐标 V @param sign 外法线方向 @returns 顶点索引 */
    const Vertex = (p: PolyNode, u: number, v: number, sign: number): number => {
        const id = geometry.length / 2, length = Math.hypot(p.x, p.y);
        geometry.push(p.x, p.y);
        normal.push(length === 0 ? 0 : sign * p.x / length, length === 0 ? 0 : sign * p.y / length);
        uv.push(settings.nvMode === "polar" ? u : (p.x - bounds.minX) / bounds.width,
            settings.nvMode === "polar" ? v : (p.y - bounds.minY) / bounds.height);
        return id;
    };
    for (let i = 0; i <= settings.sides; i++) {
        // 接缝严格复用首点坐标，避免 sin(2π) 带来的微小裂缝。
        const p = nodes[i % settings.sides], u = i / settings.sides;
        if (inner > 0) Vertex({ x: p.x * inner / settings.outer, y: p.y * inner / settings.outer }, u, 0, -1);
        Vertex(p, u, 1, 1);
    }
    const center = inner === 0 && settings.nvMode === "bounding" ? Vertex({ x: 0, y: 0 }, 0.5, 0, 0) : -1;
    for (let i = 0; i < settings.sides; i++) {
        if (inner > 0) {
            const a = i * 2;
            indices.push(a, a + 3, a + 1, a, a + 2, a + 3);
        } else {
            // 极坐标在中心有奇点，每扇区独立中心 U，避免跨越接缝的大跨度插值。
            const c = center >= 0 ? center : Vertex({ x: 0, y: 0 }, (i + 0.5) / settings.sides, 0, 0);
            indices.push(c, i + 1, i);
        }
    }
    return { ...bounds, closed: true, geometry: new Float32Array(geometry), normal: new Float32Array(normal), uv: new Float32Array(uv),
        index: geometry.length / 2 > 65536 ? new Uint32Array(indices) : new Uint16Array(indices) };
};

/**
 * 合并独立内外轮廓，索引仅做偏移，不额外连接两圈。
 * @param parts 内外圈数据
 * @param bounds 完整外圈包围盒
 * @returns 合并数组及可选辅助属性
 */
const Merge = (parts: readonly Part[], bounds: Bounds): PolyGeometryData & { miterScale: Float32Array<ArrayBuffer>; position: Float32Array<ArrayBuffer> } => {
    const vertices = parts.reduce((sum, p): number => sum + p.geometry.length / 2, 0);
    const count = parts.reduce((sum, p): number => sum + p.index.length, 0);
    const result = { ...Empty(bounds), geometry: new Float32Array(vertices * 2), normal: new Float32Array(vertices * 2), uv: new Float32Array(vertices * 2),
        index: vertices > 65536 ? new Uint32Array(count) : new Uint16Array(count), miterScale: new Float32Array(vertices).fill(1), position: new Float32Array(vertices * 2) };
    let offset = 0, indexOffset = 0;
    for (const p of parts) {
        result.geometry.set(p.geometry, offset * 2); result.normal.set(p.normal, offset * 2); result.uv.set(p.uv, offset * 2);
        if (p.miterScale !== undefined) result.miterScale.set(p.miterScale, offset);
        if (p.position !== undefined) result.position.set(p.position, offset * 2);
        for (const index of p.index) result.index[indexOffset++] = index + offset;
        offset += p.geometry.length / 2;
    }
    return result;
};

/** 以原点为圆心的正多边形、圆盘或圆环；圆是增加 sides 后的多边形近似。 */
class NGon implements NGonLike {
    private _settings: Settings;
    private _nodes: readonly PolyNode[];
    private _data: PolyGeometryData;
    private _borderData: PolyBorderGeometryData | undefined;
    private _lineData: PolyLineGeometryData | undefined;
    private _pointData: PolyPointGeometryData | undefined;

    /** @param options 边数、内外半径、孔洞和 UV 参数 */
    public constructor(options: NGonOptions = {}) {
        this._settings = Normalize({ sides: options.sides ?? 32, hole: options.hole ?? false, nvMode: options.nvMode ?? "bounding",
            outer: options.outer ?? 1, inter: options.inter ?? 0.5, startAngle: options.startAngle ?? 0, solid: options.solid ?? true });
        this._nodes = Nodes(this._settings, this._settings.outer);
        this._data = Fill(this._settings, this._nodes, GetBounds(this._nodes));
    }
    /** 边数；2 为退化直线，仅生成线、边框和点型。 */
    public get sides(): number { return this._settings.sides; }
    /** @param value 2 到 65536 的整数 */
    public set sides(value: number) { this.set({ sides: value }); }
    /** 是否生成孔洞。 */
    public get hole(): boolean { return this._settings.hole; }
    /** @param value 孔洞开关 */
    public set hole(value: boolean) { this.set({ hole: value }); }
    /** 填充 UV 模式。 */
    public get nvMode(): NGonUVMode { return this._settings.nvMode; }
    /** @param value bounding 或 polar */
    public set nvMode(value: NGonUVMode) { this.set({ nvMode: value }); }
    /** 外接圆半径。 */
    public get outer(): number { return this._settings.outer; }
    /** @param value 非负半径，缩小时同时钳制 inter */
    public set outer(value: number) { this.set({ outer: value }); }
    /** 内轮廓半径，hole=false 时保留但不使用。 */
    public get inter(): number { return this._settings.inter; }
    /** @param value 非负半径，限制到 outer */
    public set inter(value: number) { this.set({ inter: value }); }
    /** 第一节点角度，单位弧度。 */
    public get startAngle(): number { return this._settings.startAngle; }
    /** @param value 有限弧度 */
    public set startAngle(value: number) { this.set({ startAngle: value }); }
    /** 是否生成填充数组。 */
    public get solid(): boolean { return this._settings.solid; }
    /** @param value 填充生成开关 */
    public set solid(value: boolean) { this.set({ solid: value }); }
    /** 原始外圈包围盒宽度，不包含额外边框。 */
    public get width(): number { return this._data.width; }
    /** 原始外圈包围盒高度。 */
    public get height(): number { return this._data.height; }
    /** 当前填充面，包含 geometry/normal/uv/index 和包围盒。 */
    public get data(): PolyGeometryData { return this._data; }
    /** 最近一次生成的内外圈边框载体。 */
    public get borderData(): PolyBorderGeometryData | undefined { return this._borderData; }
    /** 最近一次生成的内外圈 line-list。 */
    public get lineData(): PolyLineGeometryData | undefined { return this._lineData; }
    /** 最近一次生成的内外圈辅助点。 */
    public get pointData(): PolyPointGeometryData | undefined { return this._pointData; }

    /**
     * 原子更新参数、立即重建填充并清除附加数组；传入的字段之外保留原值。
     * @param options 新参数
     * @returns 当前对象
     */
    public set(options: NGonOptions): this {
        const settings = Normalize({ ...this._settings, ...options });
        const nodes = Nodes(settings, settings.outer), data = Fill(settings, nodes, GetBounds(nodes));
        this._settings = settings; this._nodes = nodes; this._data = data;
        this._borderData = undefined; this._lineData = undefined; this._pointData = undefined;
        return this;
    }
    /** @returns 所有可见边界的总长度，圆环包含内外圈；sides=2 按单条直线计算 */
    public getPerimeter(): number {
        const radii = this.outer + (this.hole && this.inter > 0 && this.inter < this.outer ? this.inter : 0);
        return this.sides === 2 ? radii * 2 : 2 * this.sides * radii * Math.sin(Math.PI / this.sides);
    }
    /** @returns 独立内外轮廓；两点按开放线段处理，零半径不生成 */
    private contours(): { poly: Poly; inner: boolean }[] {
        if (this.outer === 0) return [];
        const result = [{ poly: new Poly(this._nodes, { closed: this.sides > 2, solid: false }), inner: false }];
        if (this.hole && this.inter > 0 && this.inter < this.outer) result.push({ poly: new Poly(Nodes(this._settings, this.inter), { closed: this.sides > 2, solid: false }), inner: true });
        return result;
    }
    /**
     * 生成内外圈边框载体，需 Shader 使用 normal*miterScale*线宽 外扩。
     * 内孔法线指向孔内，inset 表示边框位于实体材料内侧。
     * @param lineWidth 线宽
     * @param uvRepeat 每个独立轮廓的顺向重复次数
     * @param align 内中外对齐
     * @returns 合并边框数组
     */
    public createBorderGeometry(lineWidth: number, uvRepeat: number = 1, align: PolyBorderAlign = "normal"): PolyBorderGeometryData {
        // 空形状仍校验显式参数，保持与 Poly 一致的调用行为。
        new Poly([], { solid: false }).createBorderGeometry(lineWidth, uvRepeat, align);
        const radii: number[] = this.outer > 0 ? [this.outer] : [];
        if (this.hole && this.inter > 0 && this.inter < this.outer) radii.push(this.inter);
        // Poly 用单位外扩判定三角面朝向；先标准化半径，避免小轮廓被参考外扩翻转。
        // 正多边形缩放不改变 normal/miterScale，只需还原中心线坐标。
        const template = radii.length > 0
            ? new Poly(Nodes(this._settings, 10), { closed: this.sides > 2, solid: false }).createBorderGeometry(lineWidth, uvRepeat, align)
            : undefined;
        const parts = radii.map((radius, contour): PolyBorderGeometryData => {
            if (template === undefined) throw new Error("Missing NGon border template.");
            const part: PolyBorderGeometryData = {
                ...template,
                geometry: template.geometry.map((value): number => value * radius / 10),
                normal: template.normal.slice(),
                index: template.index.slice(),
            };
            const inner = contour > 0;
            if (inner) {
                for (let i = 0; i < part.normal.length; i++) part.normal[i] *= -1;
                // 反转法线后标准外扩三角面翻面，交换索引以保持 CW。
                for (let i = 0; i < part.index.length; i += 3) [part.index[i + 1], part.index[i + 2]] = [part.index[i + 2], part.index[i + 1]];
            }
            return part;
        });
        this._borderData = { ...Merge(parts, this._data), lineWidth, uvRepeat, align };
        return this._borderData;
    }
    /** @param uvRepeat 每圈顺向重复次数 @returns 两圈分别闭合，不产生横跨孔洞的连线 */
    public createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData {
        new Poly([], { solid: false }).createLineGeometry(uvRepeat);
        const parts = this.contours().map(({ poly, inner }): PolyLineGeometryData => {
            const part = poly.createLineGeometry(uvRepeat);
            if (inner) for (let i = 0; i < part.normal.length; i++) part.normal[i] *= -1;
            return part;
        });
        this._lineData = { ...Merge(parts, this._data), uvRepeat };
        return this._lineData;
    }
    /**
     * 生成内外圈顶点/边中点的辅助几何，UV 在每个点型自身包围盒内归一化。
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 顶点开关
     * @param midpointPoints 边中点开关
     * @param vertexThreshold 相邻边长合计阈值
     * @param midpointThreshold 单边长度阈值
     * @returns 合并辅助点和逐顶点中心
     */
    public createPointGeometry(pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0): PolyPointGeometryData {
        new Poly([], { solid: false }).createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
        const parts = this.contours().map(({ poly }): PolyPointGeometryData => poly.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold));
        this._pointData = { ...Merge(parts, this._data), pointRadius, sides, pointCount: parts.reduce((sum, p): number => sum + p.pointCount, 0) };
        return this._pointData;
    }
}

/** @param options 正多边形参数 @returns 填充面 */
const CreateNGonGeometry = (options: NGonOptions = {}): PolyGeometryData => new NGon(options).data;
/** @param options 正多边形参数 @param lineWidth 线宽 @param uvRepeat 每圈重复次数 @param align 对齐方式 @returns 边框载体 */
const CreateNGonBorderGeometry = (options: NGonOptions = {}, lineWidth: number = 1, uvRepeat: number = 1, align: PolyBorderAlign = "normal"): PolyBorderGeometryData => new NGon({ ...options, solid: false }).createBorderGeometry(lineWidth, uvRepeat, align);
/** @param options 正多边形参数 @param uvRepeat 每圈重复次数 @returns line-list */
const CreateNGonLineGeometry = (options: NGonOptions = {}, uvRepeat: number = 1): PolyLineGeometryData => new NGon({ ...options, solid: false }).createLineGeometry(uvRepeat);
/** @param options 正多边形参数 @param pointRadius 点型半径 @param sides 点型边数 @param vertexPoints 顶点开关 @param midpointPoints 中点开关 @param vertexThreshold 共边长度阈值 @param midpointThreshold 单边长度阈值 @returns 辅助点 */
const CreateNGonPointGeometry = (options: NGonOptions = {}, pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0): PolyPointGeometryData => new NGon({ ...options, solid: false }).createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
/** @param options 正多边形参数 @returns 内外轮廓总周长 */
const GetNGonPerimeter = (options: NGonOptions = {}): number => new NGon({ ...options, solid: false }).getPerimeter();

export { NGon, CreateNGonGeometry, CreateNGonBorderGeometry, CreateNGonLineGeometry, CreateNGonPointGeometry, GetNGonPerimeter };
export type { NGonOptions, NGonLike, NGonUVMode };
export default NGon;
