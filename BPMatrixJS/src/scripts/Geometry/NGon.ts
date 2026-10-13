import { Fill, GetBounds, Merge, Nodes, Normalize } from "./NGon/geometry.js";
import type { NGonLike, NGonOptions, NGonUVMode, Settings } from "./NGon/types.js";
import Poly from "./Poly/index.js";

import type { PolyBorderAlign, PolyBorderGeometryData, PolyGeometryData, PolyLineGeometryData, PolyNode, PolyPointGeometryData } from "./Poly/types.js";

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

export {
    CreateNGonBorderGeometry, CreateNGonGeometry, CreateNGonLineGeometry,
    CreateNGonPointGeometry,
    GetNGonPerimeter, NGon,
};

export type { NGonLike, NGonOptions, NGonUVMode };


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

export default NGon;
