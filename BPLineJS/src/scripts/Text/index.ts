import { Text as MatrixText } from "bpmatrixjs/Geometry/Text";
import type { TextAlign, TextBaseline, TextOptions as MatrixTextOptions } from "bpmatrixjs/Geometry/Text";
import Geo from "../Geometry/Geo";
import type { GeoData, GeoPartDataLike } from "../Geometry/Geo";
import Font from "./font";

/** 常规横排，或列从右往左、字从上往下的竖排。 */
type TextWritingMode = "horizontal-tb" | "vertical-rl";

interface Text2DOptions extends MatrixTextOptions {
    /** 排列顺序，默认 horizontal-tb。 */
    writingMode?: TextWritingMode;
}

/**
 * 选择静态字体表中最先注册的字体作为默认字体。
 * @example
 * const fontFamily = GetDefaultFontFamily();
 * @returns 首个字体名称；空字体表时抛出明确错误。
 */
const GetDefaultFontFamily = (): string => {
    const first = Font.map.keys().next();
    // 创建文字前必须先完成至少一份字体的异步注册。
    if (first.done) {
        throw new Error("Register a font with Font.register before creating Text.");
    } else {
        return first.value;
    }
};

interface Text2DLike extends GeoData {
    text: string;
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    letterSpacing: number;
    textAlign: TextAlign;
    baseline: TextBaseline;
    writingMode: TextWritingMode;
    readonly layoutText: string;
    readonly width: number;
    readonly height: number;
    readonly advanceWidth: number;
    readonly anchorX: number;
    readonly anchorY: number;
    readonly perimeter: number;
}

/**
 * 将每个输入行作为一列，并按上到下、右到左转成横排生成器可读的行。
 * @param text 用户输入的原始文字，换行分隔竖排列。
 * @param writingMode 文字排列顺序。
 * @example
 * ConvertText("你好\n世界", "vertical-rl"); // "世你\n界好"
 * @returns 交给 BPMatrixJS 的文字。
 */
const ConvertText = (text: string, writingMode: TextWritingMode): string => {
    // 横排保持原文；BPMatrixJS 自行规范化换行符。
    if (writingMode === "horizontal-tb") {
        return text;
    } else {
        const lines = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
        const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        const columns: string[][] = [];
        let rowCount = 0;
        // 字素簇保持组合符号和 emoji 完整，输入的每一行对应一列。
        for (const line of lines) {
            const column: string[] = [];
            // 每次只取完整字素，避免将组合字符拆成独立单元。
            for (const segment of segmenter.segment(line)) {
                column.push(segment.segment);
            }
            columns.push(column);
            rowCount = Math.max(rowCount, column.length);
        }
        const rows: string[] = [];
        // 逆序取列，使首个输入行位于最右侧，行内字符继续从上往下。
        for (let row = 0; row < rowCount; row += 1) {
            const cells: string[] = [];
            for (let column = columns.length - 1; column >= 0; column -= 1) {
                // 全角空格保留短列中的缺字位置，防止后续列向左收缩。
                cells.push(columns[column][row] ?? "\u3000");
            }
            rows.push(cells.join(""));
        }
        return rows.join("\n");
    }
};

/** 可编辑文字几何；填充、实体边框、关键点和线框共享同一次字体排版。 */
class Text extends Geo implements Text2DLike {
    /** 用于材质和管线选择的几何类型。 */
    public readonly type: string = "Text";
    private _text: string = "";
    private _layoutText: string = "";
    private _fontSize: number = 16;
    private _fontFamily: string = "";
    private _lineSpacing: number = 0;
    private _letterSpacing: number = 0;
    private _textAlign: TextAlign = "center";
    private _baseline: TextBaseline = "middle";
    private _writingMode: TextWritingMode = "horizontal-tb";
    private _width: number = 0;
    private _height: number = 0;
    private _advanceWidth: number = 0;
    private _anchorX: number = 0;
    private _anchorY: number = 0;
    private _perimeter: number = 0;

    /**
     * 创建文字几何。字体须先通过 Font.register 加载。
     * @param text 支持换行的原始文字。
     * @param fontSize 几何字号，默认 16。
     * @param fontFamily 已注册的字体名称，默认字体表首项。
     * @param options 可省略的行距、字距、对齐与排列顺序。
     * @example
     * const text = new Text("你好");
     * const vertical = new Text("你好\n世界", 48, "MiSans", { writingMode: "vertical-rl" });
     * @returns 创建的文字几何。
     */
    public constructor(
        text: string,
        fontSize: number = 16,
        fontFamily: string = GetDefaultFontFamily(),
        options: Text2DOptions | null = null,
    ) {
        super();
        const settings = options ?? {};
        try {
            this.fontSize = fontSize;
            this.fontFamily = fontFamily;
            this.lineSpacing = settings.lineSpacing ?? 0;
            this.letterSpacing = settings.letterSpacing ?? 0;
            this.textAlign = settings.textAlign ?? "center";
            this.baseline = settings.baseline ?? "middle";
            this.writingMode = settings.writingMode ?? "horizontal-tb";
            this.text = text;
            this.updateGeometry();
        } catch (error) {
            this.dispose();
            throw error;
        }
    }

    /** @example text.text; @returns 未经排列转换的输入文字。 */
    public get text(): string {
        return this._text;
    }

    /**
     * 设置原文，并根据 writingMode 转成几何生成器使用的行文本。
     * @param value 支持换行的原始文字。
     * @example
     * text.text = "你好\n世界";
     * @returns 无返回值。
     */
    public set text(value: string) {
        const layoutText = ConvertText(value, this._writingMode);
        // 原文或排列后的内容变化才通知几何消费者。
        if (this._text !== value || this._layoutText !== layoutText) {
            this._text = value;
            this._layoutText = layoutText;
            this.updateVersion();
        }
    }

    /** @example text.layoutText; @returns 实际交给字体几何生成器的文字。 */
    public get layoutText(): string {
        return this._layoutText;
    }

    /** @example text.fontSize; @returns 当前几何字号。 */
    public get fontSize(): number {
        return this._fontSize;
    }

    /**
     * 修改字号，在下次生成时重新计算排版与轮廓。
     * @param value 有限非负字号。
     * @example
     * text.fontSize = 64;
     * @returns 无返回值。
     */
    public set fontSize(value: number) {
        // 字号必须可以转换为有限 Float32 坐标。
        if (!Number.isFinite(Math.fround(value)) || value < 0) {
            throw new RangeError("Text fontSize must be finite and nonnegative.");
        }
        // 相同字号复用当前 CPU 顶点，变化时才安排重建。
        if (this._fontSize !== value) {
            this._fontSize = value;
            this.updateVersion();
        }
    }

    /** @example text.fontFamily; @returns 已注册的字体名称。 */
    public get fontFamily(): string {
        return this._fontFamily;
    }

    /**
     * 切换到另一份已加载字体。
     * @param value 通过 Font.register 注册的字体名称。
     * @example
     * text.fontFamily = "MiSans";
     * @returns 无返回值。
     */
    public set fontFamily(value: string) {
        Font.get(value);
        // 字体名称变化后，下一帧须用新字形重新剖分。
        if (this._fontFamily !== value) {
            this._fontFamily = value;
            this.updateVersion();
        }
    }

    /** @example text.lineSpacing; @returns 当前额外行距。 */
    public get lineSpacing(): number {
        return this._lineSpacing;
    }

    /**
     * 修改额外行距。
     * @param value 有限非负行距。
     * @example
     * text.lineSpacing = 8;
     * @returns 无返回值。
     */
    public set lineSpacing(value: number) {
        // 生成器用行距计算基线位置，非法值会污染全部顶点。
        if (!Number.isFinite(Math.fround(value)) || value < 0) {
            throw new RangeError("Text lineSpacing must be finite and nonnegative.");
        }
        // 同值赋值不重复生成整批字形轮廓。
        if (this._lineSpacing !== value) {
            this._lineSpacing = value;
            this.updateVersion();
        }
    }

    /** @example text.letterSpacing; @returns 当前额外字距。 */
    public get letterSpacing(): number {
        return this._letterSpacing;
    }

    /**
     * 修改额外字距，允许负值。
     * @param value 有限字距。
     * @example
     * text.letterSpacing = 2;
     * @returns 无返回值。
     */
    public set letterSpacing(value: number) {
        // 允许紧排的负值，但坐标必须保持有限。
        if (!Number.isFinite(Math.fround(value))) {
            throw new RangeError("Text letterSpacing must be finite.");
        }
        // 字距变化会影响各字形位置，按版本延后重建。
        if (this._letterSpacing !== value) {
            this._letterSpacing = value;
            this.updateVersion();
        }
    }

    /** @example text.textAlign; @returns 水平对齐方式。 */
    public get textAlign(): TextAlign {
        return this._textAlign;
    }

    /**
     * 修改行文本的水平对齐方式。
     * @param value left、center 或 right。
     * @example
     * text.textAlign = "left";
     * @returns 无返回值。
     */
    public set textAlign(value: TextAlign) {
        // 未知对齐方式不能交给排版生成器静默处理。
        if (!["left", "center", "right"].includes(value)) {
            throw new RangeError("Text textAlign must be left, center or right.");
        }
        // 对齐变化只在实际修改时重新布局。
        if (this._textAlign !== value) {
            this._textAlign = value;
            this.updateVersion();
        }
    }

    /** @example text.baseline; @returns 基线锚点方式。 */
    public get baseline(): TextBaseline {
        return this._baseline;
    }

    /**
     * 修改顶部、中线或底部基线锚点。
     * @param value top、middle 或 bottom。
     * @example
     * text.baseline = "top";
     * @returns 无返回值。
     */
    public set baseline(value: TextBaseline) {
        // 基线锚点只接受生成器支持的三个位置。
        if (!["top", "middle", "bottom"].includes(value)) {
            throw new RangeError("Text baseline must be top, middle or bottom.");
        }
        // 改变锚点后刷新测量值，重复设置不触发几何重建。
        if (this._baseline !== value) {
            this._baseline = value;
            this.updateVersion();
        }
    }

    /** @example text.writingMode; @returns 当前文字排列顺序。 */
    public get writingMode(): TextWritingMode {
        return this._writingMode;
    }

    /**
     * 切换横排或从上到下、从右到左的竖排，并重算原文转换。
     * @param value horizontal-tb 或 vertical-rl。
     * @example
     * text.writingMode = "vertical-rl";
     * @returns 无返回值。
     */
    public set writingMode(value: TextWritingMode) {
        // 运行时字符串也必须限制在两种可转换的排版顺序内。
        if (!["horizontal-tb", "vertical-rl"].includes(value)) {
            throw new RangeError("Text writingMode must be horizontal-tb or vertical-rl.");
        }
        // 顺序变化时从保留的原文重算，而不是再次转置旧布局。
        if (this._writingMode !== value) {
            this._writingMode = value;
            this._layoutText = ConvertText(this._text, value);
            this.updateVersion();
        }
    }

    /** @example text.width; @returns 居中可见包围盒宽度。 */
    public get width(): number {
        this.ensureGeometry();
        return this._width;
    }

    /** @example text.height; @returns 居中可见包围盒高度。 */
    public get height(): number {
        this.ensureGeometry();
        return this._height;
    }

    /** @example text.advanceWidth; @returns 排版后的最大行宽。 */
    public get advanceWidth(): number {
        this.ensureGeometry();
        return this._advanceWidth;
    }

    /** @example text.anchorX; @returns 按 textAlign 选取的局部水平锚点。 */
    public get anchorX(): number {
        this.ensureGeometry();
        return this._anchorX;
    }

    /** @example text.anchorY; @returns 按 baseline 选取的局部垂直锚点。 */
    public get anchorY(): number {
        this.ensureGeometry();
        return this._anchorY;
    }

    /** @example text.perimeter; @returns 可见字形边界总长度。 */
    public get perimeter(): number {
        this.ensureGeometry();
        return this._perimeter;
    }

    /**
     * 按当前排版与样式重建填充、实体边框、关键点及线框。
     * @example
     * text.updateGeometry();
     * @returns 当前文字几何。
     */
    public updateGeometry(): this {
        // 字体必须由 Font 静态类加载，避免几何对象隐式下载资源。
        Font.get(this._fontFamily);
        const shape = new MatrixText(this._layoutText, this._fontSize, this._fontFamily, {
            lineSpacing: this._lineSpacing,
            letterSpacing: this._letterSpacing,
            textAlign: this._textAlign,
            baseline: this._baseline,
        });
        const parts: { data: GeoPartDataLike; vertexType: number }[] = [];
        // 只生成启用的样式分区，使空白文字不会留下旧顶点。
        if (this.style.solid.enabled) {
            parts.push({ data: shape.data, vertexType: 0 });
        }
        const edge = this.style.edge;
        // 只有启用实体边框且宽度有效时才建立宽边框顶点。
        if (edge.enabled && edge.width > 0) {
            parts.push({
                data: shape.createBorderGeometry(edge.width, edge.uvRepeat, edge.borderAlign),
                vertexType: 0.5,
            });
        }
        const points = this.style.points;
        // 点型至少要选顶点或边中点之一。
        if (points.enabled && (points.vertices || points.midpoints)) {
            parts.push({
                data: shape.createPointGeometry(
                    points.radius,
                    points.segments,
                    points.vertices,
                    points.midpoints,
                    points.minPointsLength,
                    points.minEdgePointsLength,
                ),
                vertexType: 1,
            });
        }
        this.mergeGeometry(parts);
        // 原生线框独立于三角面缓冲，关闭时清除上一次生成的线。
        if (this.style.wireframe.enabled) {
            this.linePoints = shape.createLineGeometry();
        } else {
            this.linePoints = undefined;
        }
        this._width = shape.width;
        this._height = shape.height;
        this._advanceWidth = shape.advanceWidth;
        this._anchorX = shape.data.anchorX;
        this._anchorY = shape.data.anchorY;
        this._perimeter = shape.getPerimeter();
        // 多边形着色器使用第四个 f32 外扩边框，其余值提供文字包围盒。
        this.uniformData.set([this._width, this._height, 0, edge.width]);
        super.updateGeometry();
        return this;
    }
}

export { Font, Text };
export type { Text2DLike, Text2DOptions, TextWritingMode };
export type { TextGeometryFactory } from "./font";
export default Text;
