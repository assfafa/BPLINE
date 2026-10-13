import { GetTextFont } from "bpmatrixjs/Geometry/Text/Fonts";
import type Text from "./index";

/** 光标位置使用原文 UTF-16 下标；行、列从零开始，列以完整字素计数。 */
interface TextCell {
    index: number;
    end: number;
    row: number;
    column: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
}

/** 只读取字体排版度量，不访问字形轮廓、三角面或关键点。 */
interface TextLayout {
    width: number;
    height: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
    centerX: number;
    centerY: number;
    ascent: number;
    descent: number;
    lineHeight: number;
    advance: number;
    /** 原生输入面与交互边界共用的局部位置及尺寸。 */
    inputLeft: number;
    inputTop: number;
    inputWidth: number;
    inputHeight: number;
    cells: TextCell[];
}

const layouts = new WeakMap<Text, { key: string; layout: TextLayout }>();

/**
 * 测量文字的可交互矩形及字符区域，空文字至少保留一个 em 方框。
 * @param text 已注册字体的文字几何
 * @example const layout = MeasureText(text);
 * @returns 独立于生成样式的排版度量，参数未变时复用缓存。
 */
const MeasureText = (text: Text): TextLayout => {
    const key = JSON.stringify([text.text, text.fontFamily, text.fontSize, text.letterSpacing,
        text.lineSpacing, text.textAlign, text.writingMode]);
    const cached = layouts.get(text);
    // 相机和选中样式变化不会改变字体排版。
    if (cached?.key === key) {
        return cached.layout;
    } else {
        const font = GetTextFont(text.fontFamily);
        const scale = text.fontSize / font.unitsPerEm;
        const ascent = font.ascent * scale;
        const descent = font.descent * scale;
        const lineHeight = (font.ascent - font.descent + font.lineGap) * scale + text.lineSpacing;
        const lines = text.layoutText.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
        const sourceLines = text.text.split(/\r\n|\r|\n/);
        const sourceStarts = [0];
        // 原文保留 CRLF 的两个 UTF-16 单元，不能用规范化后的换行长度计算光标。
        for (const newline of text.text.matchAll(/\r\n|\r|\n/g)) {
            sourceStarts.push(newline.index + newline[0].length);
        }
        /** @param line 一行布局文字 @example Shape("Hello"); @returns 字体塑形与定位度量。 */
        const Shape = (line: string) => font.layout(line);
        const runs = lines.map(Shape);
        /** @param run 一行塑形结果 @example Advance(run); @returns 包含额外字距的行宽。 */
        const Advance = (run: ReturnType<typeof Shape>): number => run.advanceWidth * scale +
            Math.max(0, run.glyphs.length - 1) * text.letterSpacing;
        const widths = runs.map(Advance);
        const advance = Math.max(0, ...widths);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let cells: TextCell[] = [];
        const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        // 字体边界度量确定与居中几何一致的原点；不展开任何路径。
        for (let row = 0; row < lines.length; row++) {
            const sourceIndex = sourceStarts[row] ?? 0;
            const run = runs[row];
            let left = 0;
            // 各行相对最长行对齐，再统一移到可见范围中心。
            if (text.textAlign === "center") {
                left = (advance - widths[row]) / 2;
            } else if (text.textAlign === "right") {
                // 右对齐以最长行右端为共同参照。
                left = advance - widths[row];
            }
            let penX = left;
            let penY = -row * lineHeight;
            // 字形 bbox 是字体元数据，不等于生成全部字形三角面。
            for (let index = 0; index < run.glyphs.length; index++) {
                const glyph = run.glyphs[index];
                const position = run.positions[index];
                const bounds = glyph.bbox;
                // 空白字形不改变可见几何中心，但仍保留光标的 advance 区域。
                if (bounds.maxX > bounds.minX && bounds.maxY > bounds.minY) {
                    minX = Math.min(minX, penX + (position.xOffset + bounds.minX) * scale);
                    maxX = Math.max(maxX, penX + (position.xOffset + bounds.maxX) * scale);
                    minY = Math.min(minY, penY + (position.yOffset + bounds.minY) * scale);
                    maxY = Math.max(maxY, penY + (position.yOffset + bounds.maxY) * scale);
                }
                penX += position.xAdvance * scale + text.letterSpacing;
                penY += position.yAdvance * scale;
            }
            const segments = [...segmenter.segment(lines[row])];
            let previous = 0;
            // 前缀塑形保留 kerning/组合字符，光标不会拆开代理项或组合符。
            for (let column = 0; column < segments.length; column++) {
                const segment = segments[column];
                const end = segment.index + segment.segment.length;
                const next = Advance(Shape(lines[row].slice(0, end)));
                cells.push({ index: sourceIndex + segment.index, end: sourceIndex + end, row, column,
                    left: left + previous, right: left + next,
                    bottom: -row * lineHeight + descent, top: -row * lineHeight + ascent });
                previous = next;
            }
            // 空行和每行末尾也提供可点到的插入位置。
            cells.push({ index: sourceIndex + lines[row].length, end: sourceIndex + lines[row].length,
                row, column: segments.length, left: left + widths[row], right: left + widths[row],
                bottom: -row * lineHeight + descent, top: -row * lineHeight + ascent });
        }
        // 纯空白与空串没有可见字形，其排版原点保持在零点。
        if (Number.isFinite(minX)) {
            // 实际字体边界已由上面的度量累积。
        } else {
            minX = 0;
            maxX = 0;
            minY = 0;
            maxY = 0;
        }
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const em = Math.max(text.fontSize, 0.001);
        const inputWidth = Math.max(em, advance) + 1;
        const inputHeight = Math.max(em, lines.length * Math.max(lineHeight, 0.001));
        const leading = (lineHeight - (ascent - descent)) / 2;
        let inputLeft = -centerX;
        // 输入控件的最小宽度和光标留白不能改变字体排版的共同对齐点。
        if (text.textAlign === "center") {
            inputLeft -= (inputWidth - advance) / 2;
        } else if (text.textAlign === "right") {
            // 右对齐也抵消输入面额外宽度，避免末尾光标向右漂移。
            inputLeft -= inputWidth - advance;
        }
        const inputTop = ascent + leading - centerY;
        let left = Math.min(-em / 2, minX - centerX, inputLeft);
        let right = Math.max(em / 2, maxX - centerX, inputLeft + inputWidth);
        let bottom = Math.min(-em / 2, minY - centerY, inputTop - inputHeight);
        let top = Math.max(em / 2, maxY - centerY, inputTop);
        // 把字体度量中心转换成居中几何的局部坐标。
        for (const cell of cells) {
            cell.left -= centerX;
            cell.right -= centerX;
            cell.bottom -= centerY;
            cell.top -= centerY;
        }
        // 竖排的原文下标属于输入列，转换布局的填充空格不应变成可编辑文字。
        if (text.writingMode === "vertical-rl") {
            const mapped: TextCell[] = [];
            // 将转置排版的行列映射回原文列，保持 UTF-16 下标。
            for (const cell of cells) {
                const sourceColumn = sourceLines.length - 1 - cell.column;
                // 转置后的行尾不是原文里的换行位置。
                if (sourceColumn >= 0 && sourceColumn < sourceLines.length) {
                    const column = sourceLines[sourceColumn];
                    const segments = [...segmenter.segment(column)];
                    const segment = segments.at(cell.row);
                    cell.index = sourceStarts[sourceColumn] + column.length;
                    cell.end = cell.index;
                    // 缺字位置使用该输入列的末尾插入点。
                    if (segment !== undefined) {
                        cell.index = sourceStarts[sourceColumn] + segment.index;
                        cell.end = cell.index + segment.segment.length;
                    }
                    const originalRow = cell.row;
                    cell.row = sourceColumn;
                    cell.column = originalRow;
                    mapped.push(cell);
                }
            }
            cells = mapped;
        }
        // 极小字号仍保持可逆的交互范围。
        left = Math.min(left, right - 0.001);
        bottom = Math.min(bottom, top - 0.001);
        right = Math.max(right, left + 0.001);
        top = Math.max(top, bottom + 0.001);
        const layout: TextLayout = { width: right - left, height: top - bottom,
            left, right, bottom, top, centerX, centerY, ascent, descent, lineHeight, advance,
            inputLeft, inputTop, inputWidth, inputHeight, cells };
        layouts.set(text, { key, layout });
        return layout;
    }
};

export { MeasureText };
export type { TextCell, TextLayout };
