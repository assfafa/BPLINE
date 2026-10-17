import { CheckPrecision } from "../../Utils/Precision.js";
import type { TextMetadata } from "./Buffers.js";
import { CreateBorderBuffers, CreateFillBuffers, CreateLineBuffers, CreatePointBuffers } from "./Buffers.js";
import { GetTextFont, HasTextFont, RegisterTextFont, TextFont, UnregisterTextFont } from "./Fonts.js";
import type { TextCacheStats, TextGlyph, TextGlyphPosition, TextRun } from "./Fonts.js";
import type { TextOutline } from "./Outline.js";
import { CreateTextOutline } from "./Outline.js";
import type {
    TextAlign,
    TextWritingMode,
    TextBaseline,
    TextBorderAlign,
    TextBorderGeometryData,
    TextGeometryData,
    TextLike,
    TextLineGeometryData,
    TextOptions,
    TextPointGeometryData,
} from "./types.js";

/**
 * WOFF2 等字体的二维文字几何生成器。
 * 字体数据须预先使用 RegisterTextFont 注册；填充网格按可见包围盒居中。
 * @implements TextLike
 */
class Text implements TextLike {
    private _metadata: TextMetadata;
    private _originPrecision: number;
    private _outline: TextOutline;
    private _data: TextGeometryData;
    private _borderData: TextBorderGeometryData | undefined;
    private _lineData: TextLineGeometryData | undefined;
    private _pointData: TextPointGeometryData | undefined;

    /**
     * 创建文字几何，默认居中且没有额外行距和字距。
     * @param text 支持换行的文字
     * @param fontSize 几何字号
     * @param fontFamily 已注册的字体名称
     * @param options 行距、字距与对齐方式
     * @example
     * const textGeometry = new Text("你好\n世界", 32, "MiSans", { lineSpacing: 4 });
     * @returns 文字几何生成器
     */
    public constructor(text: string, fontSize: number, fontFamily: string, options: TextOptions = {}) {
        const normalized = NormalizeOptions(options);
        this._originPrecision = normalized.precision;
        this._metadata = { text, fontSize, fontFamily, ...normalized };
        this._outline = CreateTextOutline(
            text,
            fontSize,
            fontFamily,
            normalized.lineSpacing,
            normalized.letterSpacing,
            normalized.textAlign,
            4 / normalized.precision,
            normalized.writingMode,
        );
        this._data = CreateFillBuffers(this._outline, this._metadata);
    }

    /**
     * 原子更新文字及排版设置，并使边框、线框和点位缓存失效。
     * @param text 支持换行的文字
     * @param fontSize 几何字号，未传时沿用当前值
     * @param fontFamily 已注册的字体名称，未传时沿用当前值
     * @param options 新排版选项，未指定的字段沿用当前值
     * @example
     * textGeometry.set("B\n中", 40, "MiSans", { textAlign: "left" });
     * @returns 当前文字几何生成器
     */
    public set(text: string, fontSize: number = this.fontSize, fontFamily: string = this.fontFamily, options: TextOptions = {}): this {
        const normalized = NormalizeOptions({
            precision: options.precision ?? this.precision,
            lineSpacing: options.lineSpacing ?? this.lineSpacing,
            letterSpacing: options.letterSpacing ?? this.letterSpacing,
            textAlign: options.textAlign ?? this.textAlign,
            baseline: options.baseline ?? this.baseline,
            writingMode: options.writingMode ?? this.writingMode,
        });
        const metadata: TextMetadata = { text, fontSize, fontFamily, ...normalized };
        const outline = CreateTextOutline(
            text,
            fontSize,
            fontFamily,
            normalized.lineSpacing,
            normalized.letterSpacing,
            normalized.textAlign,
            4 / normalized.precision,
            normalized.writingMode,
        );
        const data = CreateFillBuffers(outline, metadata);
        this._metadata = metadata;
        this._originPrecision = normalized.precision;
        this._outline = outline;
        this._data = data;
        this._borderData = undefined;
        this._lineData = undefined;
        this._pointData = undefined;
        return this;
    }

    /**
     * 获取所有可见字形边界的周长。
     * @example
     * textGeometry.getPerimeter();
     * @returns 总周长
     */
    public getPerimeter(): number {
        return this._outline.perimeter;
    }

    /**
     * 生成双顶点边框载体，边框宽度由 Shader 使用。
     * @param lineWidth 边框宽度
     * @param uvRepeat 每条轮廓的 UV 重复次数
     * @param align 边框相对填充区域的对齐方式
     * @example
     * textGeometry.createBorderGeometry(2, 1, "normal");
     * @returns 边框几何数据
     */
    public createBorderGeometry(
        lineWidth: number = 1,
        uvRepeat: number = 1,
        align: TextBorderAlign = "normal",
    ): TextBorderGeometryData {
        const safeLineWidth = Nonnegative(lineWidth, "lineWidth");
        const safeUvRepeat = Nonnegative(uvRepeat, "uvRepeat");
        // 对齐方式决定 Shader 外扩幅度，未知值不能静默换成居中。
        if (!["inset", "normal", "outset"].includes(align)) {
            throw new RangeError("align must be inset, normal or outset.");
        }
        this._borderData = CreateBorderBuffers(this._outline, this._metadata, safeLineWidth, safeUvRepeat, align);
        return this._borderData;
    }

    /**
     * 生成所有可见字形边界的 line-list。
     * @param uvRepeat 每条轮廓的 UV 重复次数
     * @example
     * textGeometry.createLineGeometry(1);
     * @returns 线框几何数据
     */
    public createLineGeometry(uvRepeat: number = 1): TextLineGeometryData {
        this._lineData = CreateLineBuffers(this._outline, this._metadata, Nonnegative(uvRepeat, "uvRepeat"));
        return this._lineData;
    }

    /**
     * 沿字形边界生成可独立绘制的顶点和中点标记。
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 是否生成边界顶点
     * @param midpointPoints 是否生成边界中点
     * @param vertexThreshold 相邻边长度之和的严格下限
     * @param midpointThreshold 当前边长度的严格下限
     * @example
     * textGeometry.createPointGeometry(2, 4, true, false, 0, 0);
     * @returns 点位几何数据
     */
    public createPointGeometry(
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): TextPointGeometryData {
        // 至少选择一种点位类型，保持与 Rect 相同的调用约束。
        if (!vertexPoints && !midpointPoints) {
            throw new RangeError("vertexPoints and midpointPoints cannot both be false.");
        } else if (!Number.isSafeInteger(sides) || sides < 3) {
            // 点型至少需要三边，索引计算依赖整数边数。
            throw new RangeError("sides must be an integer greater than or equal to 3.");
        }
        const safeRadius = Nonnegative(pointRadius, "pointRadius");
        const safeVertexThreshold = Nonnegative(vertexThreshold, "vertexThreshold");
        const safeMidpointThreshold = Nonnegative(midpointThreshold, "midpointThreshold");
        // 零半径不创建退化点型，其他参数仍要完成校验。
        if (safeRadius === 0) {
            this._pointData = CreatePointBuffers(
                { ...this._outline, contours: [] },
                this._metadata,
                safeRadius,
                sides,
                vertexPoints,
                midpointPoints,
                safeVertexThreshold,
                safeMidpointThreshold,
            );
        } else {
            this._pointData = CreatePointBuffers(
                this._outline,
                this._metadata,
                safeRadius,
                sides,
                vertexPoints,
                midpointPoints,
                safeVertexThreshold,
                safeMidpointThreshold,
            );
        }
        return this._pointData;
    }

    /** @example textGeometry.precision; @returns 当前字体曲线精度，误差为 4 / precision。 */
    public get precision(): number {
        return this._metadata.precision;
    }
    /** @param value 新精度 @example textGeometry.precision = 16; @returns 无返回值，重建曲线并清理附加缓存。 */
    public set precision(value: number) {
        this.set(this.text, this.fontSize, this.fontFamily, { precision: CheckPrecision(value) });
    }
    /** @example textGeometry.originPrecision; @returns 用户最后指定的精度。 */
    public get originPrecision(): number {
        return this._originPrecision;
    }

    /** @example textGeometry.text; @returns 当前文字内容 */
    public get text(): string {
        return this._metadata.text;
    }
    /** @example textGeometry.fontSize; @returns 当前字号 */
    public get fontSize(): number {
        return this._metadata.fontSize;
    }
    /** @example textGeometry.fontFamily; @returns 当前字体名称 */
    public get fontFamily(): string {
        return this._metadata.fontFamily;
    }
    /** @example textGeometry.width; @returns 可见文字包围盒宽度 */
    public get width(): number {
        return this._data.width;
    }
    /** @example textGeometry.height; @returns 可见文字包围盒高度 */
    public get height(): number {
        return this._data.height;
    }
    /** @example textGeometry.advanceWidth; @returns 最大行的排版宽度 */
    public get advanceWidth(): number {
        return this._data.advanceWidth;
    }
    /** @example textGeometry.lineSpacing; @returns 当前额外行距 */
    public get lineSpacing(): number {
        return this._metadata.lineSpacing;
    }
    /** @example textGeometry.letterSpacing; @returns 当前额外字距 */
    public get letterSpacing(): number {
        return this._metadata.letterSpacing;
    }
    /** @example textGeometry.textAlign; @returns 当前水平对齐方式 */
    public get textAlign(): TextAlign {
        return this._metadata.textAlign;
    }
    /** @example textGeometry.writingMode; @returns 当前横排或从右向左竖排方向。 */
    public get writingMode(): TextWritingMode {
        return this._metadata.writingMode;
    }
    /** @example textGeometry.baseline; @returns 当前垂直基线锚点 */
    public get baseline(): TextBaseline {
        return this._metadata.baseline;
    }
    /** @example textGeometry.data; @returns 填充三角面数据 */
    public get data(): TextGeometryData {
        return this._data;
    }
    /** @example textGeometry.contours; @returns 全部可见外圈与孔圈的独立 Float32 副本，不含剖分添加的直边节点。 */
    public get contours(): Float32Array[] {
        const result: Float32Array[] = [];
        // Copy at the geometry boundary so callers cannot mutate shared outline caches.
        for (const contour of this._outline.contours) {
            const coordinates = new Float32Array(contour.length * 2);
            // Keep the original contour nodes, without horizontal-band subdivision points.
            for (let index = 0; index < contour.length; index += 1) {
                coordinates[index * 2] = contour[index][0];
                coordinates[index * 2 + 1] = contour[index][1];
            }
            result.push(coordinates);
        }
        return result;
    }
    /** @example textGeometry.borderData; @returns 最近生成的边框数据 */
    public get borderData(): TextBorderGeometryData | undefined {
        return this._borderData;
    }
    /** @example textGeometry.lineData; @returns 最近生成的线框数据 */
    public get lineData(): TextLineGeometryData | undefined {
        return this._lineData;
    }
    /** @example textGeometry.pointData; @returns 最近生成的点位数据 */
    public get pointData(): TextPointGeometryData | undefined {
        return this._pointData;
    }

    /**
     * 静态创建填充三角面，与 CreateTextGeometry 等价。
     * @param text 文字
     * @param fontSize 字号
     * @param fontFamily 已注册字体名称
     * @param options 排版选项
     * @example
     * Text.CreateGeometry("你好", 32, "MiSans");
     * @returns 填充几何数据
     */
    public static CreateGeometry(text: string, fontSize: number, fontFamily: string, options: TextOptions = {}): TextGeometryData {
        return CreateTextGeometry(text, fontSize, fontFamily, options);
    }

    /**
     * 静态创建边框载体，与 CreateTextBorderGeometry 等价。
     * @param text 文字
     * @param fontSize 字号
     * @param fontFamily 已注册字体名称
     * @param lineWidth 边框宽度
     * @param uvRepeat 每条轮廓的 UV 重复次数
     * @param align 边框对齐方式
     * @param options 排版选项
     * @example
     * Text.CreateBorderGeometry("你好", 32, "MiSans", 2);
     * @returns 边框载体数据
     */
    public static CreateBorderGeometry(
        text: string,
        fontSize: number,
        fontFamily: string,
        lineWidth: number = 1,
        uvRepeat: number = 1,
        align: TextBorderAlign = "normal",
        options: TextOptions = {},
    ): TextBorderGeometryData {
        return CreateTextBorderGeometry(text, fontSize, fontFamily, lineWidth, uvRepeat, align, options);
    }

    /**
     * 静态创建 line-list，与 CreateTextLineGeometry 等价。
     * @param text 文字
     * @param fontSize 字号
     * @param fontFamily 已注册字体名称
     * @param uvRepeat 每条轮廓的 UV 重复次数
     * @param options 排版选项
     * @example
     * Text.CreateLineGeometry("你好", 32, "MiSans");
     * @returns 线框数据
     */
    public static CreateLineGeometry(
        text: string,
        fontSize: number,
        fontFamily: string,
        uvRepeat: number = 1,
        options: TextOptions = {},
    ): TextLineGeometryData {
        return CreateTextLineGeometry(text, fontSize, fontFamily, uvRepeat, options);
    }

    /**
     * 静态创建边界关键点，与 CreateTextPointGeometry 等价。
     * @param text 文字
     * @param fontSize 字号
     * @param fontFamily 已注册字体名称
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 顶点开关
     * @param midpointPoints 中点开关
     * @param vertexThreshold 顶点阈值
     * @param midpointThreshold 中点阈值
     * @param options 排版选项
     * @example
     * Text.CreatePointGeometry("你好", 32, "MiSans");
     * @returns 点位数据
     */
    public static CreatePointGeometry(
        text: string,
        fontSize: number,
        fontFamily: string,
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
        options: TextOptions = {},
    ): TextPointGeometryData {
        return CreateTextPointGeometry(
            text,
            fontSize,
            fontFamily,
            pointRadius,
            sides,
            vertexPoints,
            midpointPoints,
            vertexThreshold,
            midpointThreshold,
            options,
        );
    }

    /**
     * 静态取得可见边界周长。
     * @param text 文字
     * @param fontSize 字号
     * @param fontFamily 已注册字体名称
     * @param options 排版选项
     * @example
     * Text.GetPerimeter("你好", 32, "MiSans");
     * @returns 总周长
     */
    public static GetPerimeter(text: string, fontSize: number, fontFamily: string, options: TextOptions = {}): number {
        return GetTextPerimeter(text, fontSize, fontFamily, options);
    }
}

/**
 * 校验有限非负的几何参数。
 * @param value 输入参数
 * @param name 参数名称
 * @example
 * Nonnegative(2, "lineWidth");
 * @returns 有效参数
 */
const Nonnegative = (value: number, name: string): number => {
    // 负数和非有限值不能用于 GPU 几何或 UV。
    if (Number.isFinite(value) && value >= 0) {
        return value;
    } else {
        throw new RangeError(name + " must be finite and nonnegative.");
    }
};

/**
 * 标准化新增的文字排版参数。
 * @param options 用户设置
 * @example
 * NormalizeOptions({ lineSpacing: 4 });
 * @returns 完整排版参数
 */
const NormalizeOptions = (options: TextOptions): Omit<TextMetadata, "text" | "fontSize" | "fontFamily"> => {
    const lineSpacing = Nonnegative(options.lineSpacing ?? 0, "lineSpacing");
    const letterSpacing = options.letterSpacing ?? 0;
    const textAlign = options.textAlign ?? "center";
    const baseline = options.baseline ?? "middle";
    const writingMode = options.writingMode ?? "horizontal-tb";
    // 方向属于排版缓存与原生形状生成参数，未知值不能静默回落。
    if (!["horizontal-tb", "vertical-rl"].includes(writingMode)) {
        throw new RangeError("writingMode must be horizontal-tb or vertical-rl.");
    }
    // 负字距可以用于紧排，但必须保持有限。
    if (!Number.isFinite(letterSpacing)) {
        throw new RangeError("letterSpacing must be finite.");
    }
    // 字形排布需要明确的对齐模式，避免无法定位锚点。
    if (!["left", "center", "right"].includes(textAlign)) {
        throw new RangeError("textAlign must be left, center or right.");
    }
    // 垂直基线只选择锚点，未知名称会误导调用方定位。
    if (!["top", "middle", "bottom"].includes(baseline)) {
        throw new RangeError("baseline must be top, middle or bottom.");
    }
    return { lineSpacing, letterSpacing, textAlign, baseline, writingMode, precision: CheckPrecision(options.precision ?? 8) };
};

/**
 * 直接创建文字填充几何。
 * @param text 文字
 * @param fontSize 字号
 * @param fontFamily 已注册字体名称
 * @param options 行距、字距及对齐选项
 * @example
 * CreateTextGeometry("你好", 32, "MiSans");
 * @returns 填充几何数据
 */
const CreateTextGeometry = (
    text: string,
    fontSize: number,
    fontFamily: string,
    options: TextOptions = {},
): TextGeometryData => new Text(text, fontSize, fontFamily, options).data;

/**
 * 直接创建文字边框载体。
 * @param text 文字
 * @param fontSize 字号
 * @param fontFamily 已注册字体名称
 * @param lineWidth 边框宽度
 * @param uvRepeat 每条轮廓的 UV 重复次数
 * @param align 边框对齐方式
 * @param options 行距、字距及对齐选项
 * @example
 * CreateTextBorderGeometry("你好", 32, "MiSans", 2);
 * @returns 边框载体数据
 */
const CreateTextBorderGeometry = (
    text: string,
    fontSize: number,
    fontFamily: string,
    lineWidth: number = 1,
    uvRepeat: number = 1,
    align: TextBorderAlign = "normal",
    options: TextOptions = {},
): TextBorderGeometryData => new Text(text, fontSize, fontFamily, options).createBorderGeometry(lineWidth, uvRepeat, align);

/**
 * 直接创建文字 line-list。
 * @param text 文字
 * @param fontSize 字号
 * @param fontFamily 已注册字体名称
 * @param uvRepeat 每条轮廓的 UV 重复次数
 * @param options 行距、字距及对齐选项
 * @example
 * CreateTextLineGeometry("你好", 32, "MiSans");
 * @returns 线框数据
 */
const CreateTextLineGeometry = (
    text: string,
    fontSize: number,
    fontFamily: string,
    uvRepeat: number = 1,
    options: TextOptions = {},
): TextLineGeometryData => new Text(text, fontSize, fontFamily, options).createLineGeometry(uvRepeat);

/**
 * 直接创建文字边界关键点。
 * @param text 文字
 * @param fontSize 字号
 * @param fontFamily 已注册字体名称
 * @param pointRadius 点型半径
 * @param sides 点型边数
 * @param vertexPoints 顶点开关
 * @param midpointPoints 中点开关
 * @param vertexThreshold 顶点边长阈值
 * @param midpointThreshold 中点边长阈值
 * @param options 行距、字距及对齐选项
 * @example
 * CreateTextPointGeometry("你好", 32, "MiSans");
 * @returns 点位数据
 */
const CreateTextPointGeometry = (
    text: string,
    fontSize: number,
    fontFamily: string,
    pointRadius: number = 2,
    sides: number = 4,
    vertexPoints: boolean = true,
    midpointPoints: boolean = false,
    vertexThreshold: number = 0,
    midpointThreshold: number = 0,
    options: TextOptions = {},
): TextPointGeometryData => new Text(text, fontSize, fontFamily, options).createPointGeometry(
    pointRadius,
    sides,
    vertexPoints,
    midpointPoints,
    vertexThreshold,
    midpointThreshold,
);

/**
 * 取得文字所有可见边界的总周长。
 * @param text 文字
 * @param fontSize 字号
 * @param fontFamily 已注册字体名称
 * @param options 行距、字距及对齐选项
 * @example
 * GetTextPerimeter("你好", 32, "MiSans");
 * @returns 总周长
 */
const GetTextPerimeter = (
    text: string,
    fontSize: number,
    fontFamily: string,
    options: TextOptions = {},
): number => new Text(text, fontSize, fontFamily, options).getPerimeter();

export {
    CreateTextBorderGeometry, CreateTextGeometry, CreateTextLineGeometry,
    CreateTextPointGeometry,
    GetTextFont, GetTextPerimeter, HasTextFont, RegisterTextFont, Text, TextFont, UnregisterTextFont,
};
export type {
    TextCacheStats, TextGlyph, TextGlyphPosition, TextRun,
    TextAlign,
    TextWritingMode,
    TextBaseline, TextBorderAlign, TextBorderGeometryData, TextGeometryData, TextLike, TextLineGeometryData, TextOptions, TextPointGeometryData,
};
export default Text;
