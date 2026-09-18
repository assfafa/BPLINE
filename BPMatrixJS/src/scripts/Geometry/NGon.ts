import Poly from "./Poly/index.js";
import type {
    PolyBorderAlign,
    PolyBorderGeometryData,
    PolyGeometryData,
    PolyLineGeometryData,
    PolyNode,
    PolyPointGeometryData,
} from "./Poly/types.js";
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
/**
 * 校验并整理几何选项，保证后续生成器使用一致的参数。
 * @param options 待验证参数
 * @example
 * Normalize(options);
 * @returns 规范化参数，先验证再更新对象
 */
const Normalize = (options: Required<NGonOptions>): Settings => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isInteger(options.sides) || options.sides < 2 || options.sides > 65536) {
        throw new RangeError("NGon sides must be an integer in [2, 65536].");
    }
    // 按 UV 模式选择角度映射或包围盒映射。
    if (!new Set<string>(["bounding", "polar"]).has(options.nvMode)) {
        throw new TypeError("Invalid NGon nvMode.");
    }
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (typeof options.hole !== "boolean" || typeof options.solid !== "boolean") {
        throw new TypeError("NGon switches must be boolean.");
    }
    // 逐项处理 [options.outer, options.inter]，保持集合中的既定顺序。
    for (const radius of [options.outer, options.inter]) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (radius < 0 || !Number.isFinite(Math.fround(radius * 2))) {
            throw new RangeError("NGon radii must be finite, nonnegative Float32 sizes.");
        }
    }
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isFinite(options.startAngle)) {
        throw new RangeError("NGon startAngle must be finite.");
    }
    return Object.freeze({
        ...options,
        startAngle: options.startAngle % (Math.PI * 2),
        inter: Math.min(options.inter, options.outer),
    });
};
/**
 * 按边数和起始角生成等边形轮廓节点。
 * @param settings 参数
 * @param radius 半径
 * @example
 * Nodes(settings, radius);
 * @returns 逆时针节点，圆心保持在原点
 */
const Nodes = (settings: Settings, radius: number): PolyNode[] => {
    // 区分直角、圆角或零尺寸，避免生成退化圆弧。
    if (radius === 0) {
        return [];
    } else {
        /**
         * 按节点下标计算角度，在指定半径上生成轮廓点。
         * @param _ 当前元素，此回调只使用下标
         * @param i 当前元素下标
         * @example
         * CreatePolygonNode(_, i);
         * @returns 轮廓节点坐标。
         */
        const CreatePolygonNode = (_: unknown, i: number): PolyNode => {
            const angle = settings.startAngle + (i * Math.PI * 2) / settings.sides;
            return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
        };
        return Array.from({ length: settings.sides }, CreatePolygonNode);
    }
};
/**
 * 计算轮廓包围盒，供 UV 映射和尺寸查询使用。
 * @param nodes 外圈节点
 * @example
 * GetBounds(nodes);
 * @returns 实际包围盒，空集返回零
 */
const GetBounds = (nodes: readonly PolyNode[]): Bounds => {
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (nodes.length === 0) {
        return { width: 0, height: 0, minX: 0, minY: 0 };
    } else {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        // 逐项处理 nodes，保持集合中的既定顺序。
        for (const p of nodes) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, width: maxX - minX, height: maxY - minY };
    }
};
/**
 * 创建保留包围盒信息但不包含可绘制顶点的几何结果。
 * @param bounds 包围盒
 * @example
 * Empty(bounds);
 * @returns 空几何，退化或关闭填充时使用
 */
const Empty = (bounds: Bounds): PolyGeometryData => ({
    ...bounds,
    closed: true,
    geometry: new Float32Array(0),
    normal: new Float32Array(0),
    uv: new Float32Array(0),
    index: new Uint16Array(0),
});
/**
 * 圆盘使用中心扇形，圆环逐段缝合内外圈；不会用扇形跨过内孔。
 * @param settings 参数
 * @param nodes 外圈节点
 * @param bounds 包围盒
 * @example
 * Fill(settings, nodes, bounds);
 * @returns CW 三角面，polar 在 U=0/1 的接缝复制顶点
 */
const Fill = (settings: Settings, nodes: readonly PolyNode[], bounds: Bounds): PolyGeometryData => {
    let inner;
    // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
    if (settings.hole) {
        inner = settings.inter;
    } else {
        inner = 0;
    }
    // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
    if (settings.solid && settings.sides !== 2 && settings.outer !== 0 && inner !== settings.outer) {
        const geometry: number[] = [];
        const normal: number[] = [];
        const uv: number[] = [];
        const indices: number[] = [];
        /**
         * 写入一个顶点的坐标及配套属性，返回新顶点下标。
         * @param p 坐标
         * @param u 极坐标 U
         * @param v 极坐标 V
         * @param sign 外法线方向
         * @example
         * Vertex(p, u, v, sign);
         * @returns 顶点索引
         */
        const Vertex = (p: PolyNode, u: number, v: number, sign: number): number => {
            const id = geometry.length / 2;
            const length = Math.hypot(p.x, p.y);
            geometry.push(p.x, p.y);
            let normalX: number = 0;
            let normalY: number = 0;
            // 区分空数据和有效内容，空集合不创建可绘制资源。
            if (length !== 0) {
                normalX = (sign * p.x) / length;
                normalY = (sign * p.y) / length;
            }
            normal.push(normalX, normalY);
            // 按 UV 模式选择角度映射或包围盒映射。
            if (settings.nvMode === "polar") {
                uv.push(u, v);
            } else {
                uv.push((p.x - bounds.minX) / bounds.width, (p.y - bounds.minY) / bounds.height);
            }
            return id;
        };
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let i = 0; i <= settings.sides; i++) {
            // 接缝严格复用首点坐标，避免 sin(2π) 带来的微小裂缝。
            const p = nodes[i % settings.sides];
            const u = i / settings.sides;
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner > 0) {
                Vertex({ x: (p.x * inner) / settings.outer, y: (p.y * inner) / settings.outer }, u, 0, -1);
            }
            Vertex(p, u, 1, 1);
        }
        let center;
        // 按 UV 模式选择角度映射或包围盒映射。
        if (inner === 0 && settings.nvMode === "bounding") {
            center = Vertex({ x: 0, y: 0 }, 0.5, 0, 0);
        } else {
            center = -1;
        }
        // 按索引顺序处理三角面，保持绕序及属性下标一致。
        for (let i = 0; i < settings.sides; i++) {
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner > 0) {
                const a = i * 2;
                indices.push(a, a + 3, a + 1, a, a + 2, a + 3);
            } else {
                // 极坐标在中心有奇点，每扇区独立中心 U，避免跨越接缝的大跨度插值。
                let c;
                // 包围盒 UV 复用中心顶点；极坐标模式按扇区创建中心，避免跨接缝插值。
                if (center >= 0) {
                    c = center;
                } else {
                    c = Vertex({ x: 0, y: 0 }, (i + 0.5) / settings.sides, 0, 0);
                }
                indices.push(c, i + 1, i);
            }
        }
        let index: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
        // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
        if (geometry.length / 2 > 65536) {
            index = new Uint32Array(indices);
        } else {
            index = new Uint16Array(indices);
        }
        return {
            ...bounds,
            closed: true,
            geometry: new Float32Array(geometry),
            normal: new Float32Array(normal),
            uv: new Float32Array(uv),
            index,
        };
    } else {
        return Empty(bounds);
    }
};
/**
 * 合并独立内外轮廓，索引仅做偏移，不额外连接两圈。
 * @param parts 内外圈数据
 * @param bounds 完整外圈包围盒
 * @example
 * Merge(parts, bounds);
 * @returns 合并数组及可选辅助属性
 */
const Merge = (
    parts: readonly Part[],
    bounds: Bounds,
): PolyGeometryData & {
    miterScale: Float32Array<ArrayBuffer>;
    position: Float32Array<ArrayBuffer>;
} => {
    /**
     * 累计几何分区的顶点数，用于一次分配合并数组。
     * @param sum 已累计的数值
     * @param p 当前轮廓节点或几何分区
     * @example
     * CountVertices(sum, p);
     * @returns 累计顶点数。
     */
    const CountVertices = (sum: number, p: Part): number => sum + p.geometry.length / 2;
    const vertices = parts.reduce(CountVertices, 0);
    /**
     * 累计几何分区的索引数，用于一次分配索引数组。
     * @param sum 已累计的数值
     * @param p 当前轮廓节点或几何分区
     * @example
     * CountIndices(sum, p);
     * @returns 累计索引数。
     */
    const CountIndices = (sum: number, p: Part): number => sum + p.index.length;
    const count = parts.reduce(CountIndices, 0);
    let index: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
    // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
    if (vertices > 65536) {
        index = new Uint32Array(count);
    } else {
        index = new Uint16Array(count);
    }
    const result = {
        ...Empty(bounds),
        geometry: new Float32Array(vertices * 2),
        normal: new Float32Array(vertices * 2),
        uv: new Float32Array(vertices * 2),
        index,
        miterScale: new Float32Array(vertices).fill(1),
        position: new Float32Array(vertices * 2),
    };
    let offset = 0;
    let indexOffset = 0;
    // 逐个处理独立几何分区，合并时保留各自的轮廓边界。
    for (const p of parts) {
        result.geometry.set(p.geometry, offset * 2);
        result.normal.set(p.normal, offset * 2);
        result.uv.set(p.uv, offset * 2);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (p.miterScale !== undefined) {
            result.miterScale.set(p.miterScale, offset);
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (p.position !== undefined) {
            result.position.set(p.position, offset * 2);
        }
        // 逐项处理 p.index，保持集合中的既定顺序。
        for (const index of p.index) {
            result.index[indexOffset++] = index + offset;
        }
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
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param options 边数、内外半径、孔洞和 UV 参数
     * @example
     * const nGon = new NGon(options);
     * @returns 创建的 NGon 对象。
     */
    public constructor(options: NGonOptions = {}) {
        this._settings = Normalize({
            sides: options.sides ?? 32,
            hole: options.hole ?? false,
            nvMode: options.nvMode ?? "bounding",
            outer: options.outer ?? 1,
            inter: options.inter ?? 0.5,
            startAngle: options.startAngle ?? 0,
            solid: options.solid ?? true,
        });
        this._nodes = Nodes(this._settings, this._settings.outer);
        this._data = Fill(this._settings, this._nodes, GetBounds(this._nodes));
    }
    /**
     * 边数；2 为退化直线，仅生成线、边框和点型。
     * @example
     * const value = nGon.sides;
     * @returns 边数；2 为退化直线，仅生成线、边框和点型。
     */
    public get sides(): number {
        return this._settings.sides;
    }
    /**
     * 边数；2 为退化直线，仅生成线、边框和点型。
     * @param value 2 到 65536 的整数
     * @example
     * nGon.sides = value;
     * @returns 无返回值。
     */
    public set sides(value: number) {
        this.set({ sides: value });
    }
    /**
     * 是否生成孔洞。
     * @example
     * const value = nGon.hole;
     * @returns 是否生成孔洞。
     */
    public get hole(): boolean {
        return this._settings.hole;
    }
    /**
     * 是否生成孔洞。
     * @param value 孔洞开关
     * @example
     * nGon.hole = value;
     * @returns 无返回值。
     */
    public set hole(value: boolean) {
        this.set({ hole: value });
    }
    /**
     * 填充 UV 模式。
     * @example
     * const value = nGon.nvMode;
     * @returns 填充 UV 模式。
     */
    public get nvMode(): NGonUVMode {
        return this._settings.nvMode;
    }
    /**
     * 填充 UV 模式。
     * @param value bounding 或 polar
     * @example
     * nGon.nvMode = value;
     * @returns 无返回值。
     */
    public set nvMode(value: NGonUVMode) {
        this.set({ nvMode: value });
    }
    /**
     * 外接圆半径。
     * @example
     * const value = nGon.outer;
     * @returns 外接圆半径。
     */
    public get outer(): number {
        return this._settings.outer;
    }
    /**
     * 外接圆半径。
     * @param value 非负半径，缩小时同时钳制 inter
     * @example
     * nGon.outer = value;
     * @returns 无返回值。
     */
    public set outer(value: number) {
        this.set({ outer: value });
    }
    /**
     * 内轮廓半径，hole=false 时保留但不使用。
     * @example
     * const value = nGon.inter;
     * @returns 内轮廓半径，hole=false 时保留但不使用。
     */
    public get inter(): number {
        return this._settings.inter;
    }
    /**
     * 内轮廓半径，hole=false 时保留但不使用。
     * @param value 非负半径，限制到 outer
     * @example
     * nGon.inter = value;
     * @returns 无返回值。
     */
    public set inter(value: number) {
        this.set({ inter: value });
    }
    /**
     * 第一节点角度，单位弧度。
     * @example
     * const value = nGon.startAngle;
     * @returns 第一节点角度，单位弧度。
     */
    public get startAngle(): number {
        return this._settings.startAngle;
    }
    /**
     * 第一节点角度，单位弧度。
     * @param value 有限弧度
     * @example
     * nGon.startAngle = value;
     * @returns 无返回值。
     */
    public set startAngle(value: number) {
        this.set({ startAngle: value });
    }
    /**
     * 是否生成填充数组。
     * @example
     * const value = nGon.solid;
     * @returns 是否生成填充数组。
     */
    public get solid(): boolean {
        return this._settings.solid;
    }
    /**
     * 是否生成填充数组。
     * @param value 填充生成开关
     * @example
     * nGon.solid = value;
     * @returns 无返回值。
     */
    public set solid(value: boolean) {
        this.set({ solid: value });
    }
    /**
     * 原始外圈包围盒宽度，不包含额外边框。
     * @example
     * const value = nGon.width;
     * @returns 原始外圈包围盒宽度，不包含额外边框。
     */
    public get width(): number {
        return this._data.width;
    }
    /**
     * 原始外圈包围盒高度。
     * @example
     * const value = nGon.height;
     * @returns 原始外圈包围盒高度。
     */
    public get height(): number {
        return this._data.height;
    }
    /**
     * 当前填充面，包含 geometry/normal/uv/index 和包围盒。
     * @example
     * const value = nGon.data;
     * @returns 当前填充面，包含 geometry/normal/uv/index 和包围盒。
     */
    public get data(): PolyGeometryData {
        return this._data;
    }
    /**
     * 最近一次生成的内外圈边框载体。
     * @example
     * const value = nGon.borderData;
     * @returns 最近一次生成的内外圈边框载体。
     */
    public get borderData(): PolyBorderGeometryData | undefined {
        return this._borderData;
    }
    /**
     * 最近一次生成的内外圈 line-list。
     * @example
     * const value = nGon.lineData;
     * @returns 最近一次生成的内外圈 line-list。
     */
    public get lineData(): PolyLineGeometryData | undefined {
        return this._lineData;
    }
    /**
     * 最近一次生成的内外圈辅助点。
     * @example
     * const value = nGon.pointData;
     * @returns 最近一次生成的内外圈辅助点。
     */
    public get pointData(): PolyPointGeometryData | undefined {
        return this._pointData;
    }
    /**
     * 原子更新参数、立即重建填充并清除附加数组；传入的字段之外保留原值。
     * @param options 新参数
     * @example
     * nGon.set(options);
     * @returns 当前对象
     */
    public set(options: NGonOptions): this {
        const settings = Normalize({ ...this._settings, ...options });
        const nodes = Nodes(settings, settings.outer);
        const data = Fill(settings, nodes, GetBounds(nodes));
        this._settings = settings;
        this._nodes = nodes;
        this._data = data;
        this._borderData = undefined;
        this._lineData = undefined;
        this._pointData = undefined;
        return this;
    }
    /**
     * 计算当前轮廓周长，供顺向 UV 重复量等计算使用。
     * @example
     * nGon.getPerimeter();
     * @returns 所有可见边界的总长度，圆环包含内外圈；sides=2 按单条直线计算
     */
    public getPerimeter(): number {
        let radii: number = this.outer;
        // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
        if (this.hole && this.inter > 0 && this.inter < this.outer) {
            radii += this.inter;
        }
        // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
        if (this.sides === 2) {
            return radii * 2;
        } else {
            return 2 * this.sides * radii * Math.sin(Math.PI / this.sides);
        }
    }
    /**
     * 分别构建有效的内外轮廓，避免将独立轮廓错误连接。
     * @example
     * this.contours();
     * @returns 独立内外轮廓；两点按开放线段处理，零半径不生成
     */
    private contours(): {
        poly: Poly;
        inner: boolean;
    }[] {
        // 外半径为零时返回空轮廓，不生成重叠在原点的边。
        if (this.outer === 0) {
            return [];
        } else {
            const result = [
                { poly: new Poly(this._nodes, { closed: this.sides > 2, solid: false }), inner: false },
            ];
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (this.hole && this.inter > 0 && this.inter < this.outer) {
                result.push({
                    poly: new Poly(Nodes(this._settings, this.inter), {
                        closed: this.sides > 2,
                        solid: false,
                    }),
                    inner: true,
                });
            }
            return result;
        }
    }
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
    public createBorderGeometry(
        lineWidth: number,
        uvRepeat: number = 1,
        align: PolyBorderAlign = "normal",
    ): PolyBorderGeometryData {
        // 空形状仍校验显式参数，保持与 Poly 一致的调用行为。
        new Poly([], { solid: false }).createBorderGeometry(lineWidth, uvRepeat, align);
        let radii: number[];
        // 有效外半径才参与轮廓生成，零尺寸不分配边框顶点。
        if (this.outer > 0) {
            radii = [this.outer];
        } else {
            radii = [];
        }
        // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
        if (this.hole && this.inter > 0 && this.inter < this.outer) {
            radii.push(this.inter);
        }
        // Poly 用单位外扩判定三角面朝向；先标准化半径，避免小轮廓被参考外扩翻转。
        // 正多边形缩放不改变 normal/miterScale，只需还原中心线坐标。
        let template;
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (radii.length > 0) {
            template = new Poly(Nodes(this._settings, 10), {
                closed: this.sides > 2,
                solid: false,
            }).createBorderGeometry(lineWidth, uvRepeat, align);
        } else {
            template = undefined;
        }
        /**
         * 将标准边框模板缩放到当前半径，并处理内外轮廓方向。
         * @param radius 圆角或点型半径
         * @param contour 当前轮廓下标，零表示外圈
         * @example
         * CreateContourBorder(radius, contour);
         * @returns 当前轮廓的实体边框数据。
         */
        const CreateContourBorder = (radius: number, contour: number): PolyBorderGeometryData => {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (template === undefined) {
                throw new Error("Missing NGon border template.");
            }
            /**
             * 将固定半径模板的坐标还原为当前轮廓半径。
             * @param value 本次输入值
             * @example
             * ScaleTemplateCoordinate(value);
             * @returns 缩放后的单个坐标分量。
             */
            const ScaleTemplateCoordinate = (value: number): number => (value * radius) / 10;
            const part: PolyBorderGeometryData = {
                ...template,
                geometry: template.geometry.map(ScaleTemplateCoordinate),
                normal: template.normal.slice(),
                index: template.index.slice(),
            };
            const inner = contour > 0;
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner) {
                // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
                for (let i = 0; i < part.normal.length; i++) {
                    part.normal[i] *= -1;
                }
                // 反转法线后标准外扩三角面翻面，交换索引以保持 CW。
                for (let i = 0; i < part.index.length; i += 3) {
                    [part.index[i + 1], part.index[i + 2]] = [part.index[i + 2], part.index[i + 1]];
                }
            }
            return part;
        };
        const parts = radii.map(CreateContourBorder);
        this._borderData = { ...Merge(parts, this._data), lineWidth, uvRepeat, align };
        return this._borderData;
    }
    /**
     * 生成沿轮廓连接的 line-list 顶点与索引数据。
     * @param uvRepeat 每圈顺向重复次数
     * @example
     * nGon.createLineGeometry(uvRepeat);
     * @returns 两圈分别闭合，不产生横跨孔洞的连线
     */
    public createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData {
        new Poly([], { solid: false }).createLineGeometry(uvRepeat);
        /**
         * 生成单个轮廓的线段数据，内圈法线朝孔内。
         * @param contour 当前轮廓及其是否为内圈的标识
         * @example
         * CreateContourLines(contour);
         * @returns 当前轮廓的 line-list 数据。
         */
        const CreateContourLines = (contour: { poly: Poly; inner: boolean }): PolyLineGeometryData => {
            const { poly, inner } = contour;
            const part = poly.createLineGeometry(uvRepeat);
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner) {
                // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
                for (let i = 0; i < part.normal.length; i++) {
                    part.normal[i] *= -1;
                }
            }
            return part;
        };
        const parts = this.contours().map(CreateContourLines);
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
     * @example
     * nGon.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 合并辅助点和逐顶点中心
     */
    public createPointGeometry(
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): PolyPointGeometryData {
        new Poly([], { solid: false }).createPointGeometry(
            pointRadius,
            sides,
            vertexPoints,
            midpointPoints,
            vertexThreshold,
            midpointThreshold,
        );
        /**
         * 为独立轮廓生成顶点和中点标记。
         * @param contour 当前轮廓及其是否为内圈的标识
         * @example
         * CreateContourMarkers(contour);
         * @returns 当前轮廓的辅助点几何。
         */
        const CreateContourMarkers = (contour: { poly: Poly; inner: boolean }): PolyPointGeometryData =>
            contour.poly.createPointGeometry(
                pointRadius,
                sides,
                vertexPoints,
                midpointPoints,
                vertexThreshold,
                midpointThreshold,
            );
        const parts = this.contours().map(CreateContourMarkers);
        /**
         * 累计独立轮廓中的辅助点数量。
         * @param sum 已累计的数值
         * @param p 当前轮廓节点或几何分区
         * @example
         * CountMarkers(sum, p);
         * @returns 累计点型数量。
         */
        const CountMarkers = (sum: number, p: PolyPointGeometryData): number => sum + p.pointCount;
        this._pointData = {
            ...Merge(parts, this._data),
            pointRadius,
            sides,
            pointCount: parts.reduce(CountMarkers, 0),
        };
        return this._pointData;
    }
}
/**
 * 生成等边形或圆环的填充几何。
 * @param options 正多边形参数
 * @example
 * CreateNGonGeometry(options);
 * @returns 填充面
 */
const CreateNGonGeometry = (options: NGonOptions = {}): PolyGeometryData => new NGon(options).data;
/**
 * 生成等边形内外轮廓的实体边框几何。
 * @param options 正多边形参数
 * @param lineWidth 线宽
 * @param uvRepeat 每圈重复次数
 * @param align 对齐方式
 * @example
 * CreateNGonBorderGeometry(options, lineWidth, uvRepeat, align);
 * @returns 边框载体
 */
const CreateNGonBorderGeometry = (
    options: NGonOptions = {},
    lineWidth: number = 1,
    uvRepeat: number = 1,
    align: PolyBorderAlign = "normal",
): PolyBorderGeometryData =>
    new NGon({ ...options, solid: false }).createBorderGeometry(lineWidth, uvRepeat, align);
/**
 * 生成等边形内外轮廓的 line-list 几何。
 * @param options 正多边形参数
 * @param uvRepeat 每圈重复次数
 * @example
 * CreateNGonLineGeometry(options, uvRepeat);
 * @returns line-list
 */
const CreateNGonLineGeometry = (options: NGonOptions = {}, uvRepeat: number = 1): PolyLineGeometryData =>
    new NGon({ ...options, solid: false }).createLineGeometry(uvRepeat);
/**
 * 生成等边形轮廓的顶点和线段中点标记。
 * @param options 正多边形参数
 * @param pointRadius 点型半径
 * @param sides 点型边数
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 共边长度阈值
 * @param midpointThreshold 单边长度阈值
 * @example
 * CreateNGonPointGeometry(options, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
 * @returns 辅助点
 */
const CreateNGonPointGeometry = (
    options: NGonOptions = {},
    pointRadius: number = 2,
    sides: number = 4,
    vertexPoints: boolean = true,
    midpointPoints: boolean = false,
    vertexThreshold: number = 0,
    midpointThreshold: number = 0,
): PolyPointGeometryData =>
    new NGon({ ...options, solid: false }).createPointGeometry(
        pointRadius,
        sides,
        vertexPoints,
        midpointPoints,
        vertexThreshold,
        midpointThreshold,
    );
/**
 * 计算等边形有效轮廓的总周长。
 * @param options 正多边形参数
 * @example
 * GetNGonPerimeter(options);
 * @returns 内外轮廓总周长
 */
const GetNGonPerimeter = (options: NGonOptions = {}): number =>
    new NGon({ ...options, solid: false }).getPerimeter();
export {
    NGon,
    CreateNGonGeometry,
    CreateNGonBorderGeometry,
    CreateNGonLineGeometry,
    CreateNGonPointGeometry,
    GetNGonPerimeter,
};
export type { NGonOptions, NGonLike, NGonUVMode };
export default NGon;
