import { GetTextFont } from "bpmatrixjs/Geometry/Text/Fonts";
import type Text from "./index";
import type { TextCell, TextLayout } from "./layout";

/** 用与 WASM 相同的竖排字形定位度量计算包围盒和原文字符区域。
 * @param text 已注册字体的竖排文字 @example MeasureVerticalText(text);
 * @returns 居中可见范围、输入面尺寸与原文字符区域。
 */
const MeasureVerticalText = (text: Text): TextLayout => {
    const font = GetTextFont(text.fontFamily);
    const scale = text.fontSize / font.unitsPerEm;
    const ascent = font.ascent * scale;
    const descent = font.descent * scale;
    const lineHeight = (font.ascent - font.descent + font.lineGap) * scale + text.lineSpacing;
    const lines = text.text.split(/\r\n|\r|\n/);
    const starts = [0];
    // 原文的 CRLF 需要保留两个 UTF-16 单元，不能从规范化字符串反推下标。
    for (const newline of text.text.matchAll(/\r\n|\r|\n/g)) {
        starts.push(newline.index + newline[0].length);
    }
    /** @param value 一列文字 @example Shape("Hello"); @returns 向下排版的字形和定位度量。 */
    const Shape = (value: string) => font.shape(value, "vertical-rl");
    /** @param run 一列塑形结果 @example Advance(run); @returns 包含额外字距的列长度。 */
    const Advance = (run: ReturnType<typeof Shape>): number =>
        run.advanceWidth * scale + Math.max(0, run.glyphs.length - 1) * text.letterSpacing;
    const runs = lines.map(Shape);
    const advances = runs.map(Advance);
    const advance = Math.max(0, ...advances);
    const cells: TextCell[] = [];
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // 首列位于最右侧；对齐仅改变各列起始 Y，不改变列的 X。
    for (let row = 0; row < lines.length; row++) {
        const line = lines[row];
        const run = runs[row];
        const columnX = -row * lineHeight;
        let offset = 0;
        // center 支持半个字高的偏移，短列不会向左或右挤到其他列。
        if (text.textAlign === "center") {
            offset = (advance - advances[row]) / 2;
        } else if (text.textAlign === "right") {
            // right 对应竖排的下端，与最长列底部对齐。
            offset = advance - advances[row];
        }
        let penX = columnX;
        let penY = -offset;
        // 只读字体边界和 advance，拾取与编辑不访问三角面。
        for (let index = 0; index < run.glyphs.length; index++) {
            const bounds = run.glyphs[index].bbox;
            const position = run.positions[index];
            // 空格占据排版长度，但不会改变可见几何中心。
            if (bounds.maxX > bounds.minX && bounds.maxY > bounds.minY) {
                minX = Math.min(minX, penX + (position.xOffset + bounds.minX) * scale);
                maxX = Math.max(maxX, penX + (position.xOffset + bounds.maxX) * scale);
                minY = Math.min(minY, penY + (position.yOffset + bounds.minY) * scale);
                maxY = Math.max(maxY, penY + (position.yOffset + bounds.maxY) * scale);
            }
            penX += position.xAdvance * scale;
            penY += position.yAdvance * scale - text.letterSpacing;
        }
        const segments = [...segmenter.segment(line)];
        let previous = 0;
        // 一格对应一个完整字素，位置使用前缀塑形，保留组合字符和 UTF-16 边界。
        for (let column = 0; column < segments.length; column++) {
            const segment = segments[column];
            const end = segment.index + segment.segment.length;
            const next = Advance(Shape(line.slice(0, end)));
            cells.push({ row, column, index: starts[row] + segment.index, end: starts[row] + end,
                left: columnX - lineHeight / 2, right: columnX + lineHeight / 2,
                top: -offset - previous, bottom: -offset - next });
            previous = next;
        }
        cells.push({ row, column: segments.length, index: starts[row] + line.length, end: starts[row] + line.length,
            left: columnX - lineHeight / 2, right: columnX + lineHeight / 2,
            top: -offset - advances[row], bottom: -offset - advances[row] });
    }
    // 空文本没有可见字形，仍提供一个 em 大小的输入区域。
    if (Number.isFinite(minX)) {
        // 上面的字体度量已得到有效可见范围。
    } else {
        minX = 0;
        maxX = 0;
        minY = 0;
        maxY = 0;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const em = Math.max(text.fontSize, 0.001);
    const inputWidth = Math.max(em, lines.length * Math.max(lineHeight, 0.001));
    const inputHeight = Math.max(em, advance) + 1;
    const inputLeft = lineHeight / 2 - inputWidth - centerX;
    let inputTop = -centerY;
    // 输入面额外留白也沿列方向补偿，避免 center/end 光标错位。
    if (text.textAlign === "center") {
        inputTop += (inputHeight - advance) / 2;
    } else if (text.textAlign === "right") {
        // 末端对齐补偿输入面的额外高度，保持最后一个光标不偏移。
        inputTop += inputHeight - advance;
    }
    // 全部交互区域转换到同一个可见包围盒中心。
    for (const cell of cells) {
        cell.left -= centerX;
        cell.right -= centerX;
        cell.bottom -= centerY;
        cell.top -= centerY;
    }
    const left = Math.min(-em / 2, minX - centerX, inputLeft);
    const right = Math.max(em / 2, maxX - centerX, inputLeft + inputWidth);
    const bottom = Math.min(-em / 2, minY - centerY, inputTop - inputHeight);
    const top = Math.max(em / 2, maxY - centerY, inputTop);
    return { width: right - left, height: top - bottom, left, right, bottom, top,
        centerX, centerY, ascent, descent, lineHeight, advance,
        inputLeft, inputTop, inputWidth, inputHeight, cells };
};

export { MeasureVerticalText };
