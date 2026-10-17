import { GetTextFont } from "./Fonts.js";
import type { TextAlign, TextWritingMode } from "./types.js";

type TextPoint = readonly [number, number];

interface TextOutline {
    readonly contours: readonly (readonly TextPoint[])[];
    readonly triangles: readonly TextPoint[];
    readonly width: number;
    readonly height: number;
    readonly minX: number;
    readonly minY: number;
    readonly advanceWidth: number;
    readonly perimeter: number;
}

/**
 * 读取 WASM 排版及三角化结果，按完整生成参数共享内部缓存。
 * @param text 原文 @param fontSize 字号 @param fontFamily 注册名称
 * @param lineSpacing 附加行距 @param letterSpacing 附加字距
 * @param textAlign 行对齐方式 @param tolerance 曲线误差 @param writingMode 排版方向
 * @example CreateTextOutline("你好", 16, "MiSans");
 * @returns 按可见包围盒居中的填充与全部孔洞边界。
 */
const CreateTextOutline = (text: string, fontSize: number, fontFamily: string,
    lineSpacing: number = 0, letterSpacing: number = 0, textAlign: TextAlign = "center", tolerance: number = 0.5, writingMode: TextWritingMode = "horizontal-tb"): TextOutline => {
    // Geometry coordinates must remain representable by downstream GPU buffers.
    if (Number.isFinite(Math.fround(fontSize)) && fontSize >= 0 &&
        Number.isFinite(Math.fround(lineSpacing)) && lineSpacing >= 0 &&
        Number.isFinite(Math.fround(letterSpacing)) && Number.isFinite(tolerance) && tolerance > 0) {
        const align = ["left", "center", "right"].indexOf(textAlign);
        // Reject invalid runtime strings instead of changing text placement silently.
        if (align >= 0) {
            const font = GetTextFont(fontFamily);
            const key = JSON.stringify([text, fontSize, lineSpacing, letterSpacing, align, tolerance, writingMode]);
            /** @example Create(); @returns 从原生结果解包的只读轮廓。 */
            const Create = (): TextOutline => {
                const data = font.mesh(text, fontSize, lineSpacing, letterSpacing, align, tolerance, writingMode);
                let offset = 8;
                /** @param count 顶点数 @example Points(3); @returns 冻结的点数组，禁止缓存污染。 */
                const Points = (count: number): readonly TextPoint[] => {
                    const points: TextPoint[] = [];
                    // Freeze nested points because Font can be inspected by callers.
                    for (let index = 0; index < count; index += 1) {
                        points.push(Object.freeze([data[offset], data[offset + 1]] as const));
                        offset += 2;
                    }
                    return Object.freeze(points);
                };
                const triangles = Points(data[6]);
                const contours: (readonly TextPoint[])[] = [];
                // Each contour has an explicit count; holes remain independent rings.
                for (let index = 0; index < data[7]; index += 1) {
                    const count = data[offset];
                    offset += 1;
                    contours.push(Points(count));
                }
                return Object.freeze({ width: data[0], height: data[1], minX: data[2], minY: data[3],
                    advanceWidth: data[4], perimeter: data[5], triangles, contours: Object.freeze(contours) });
            };
            return font.outline(key, Create);
        } else {
            throw new RangeError("textAlign must be left, center or right.");
        }
    } else {
        throw new RangeError("Text size and line spacing must be finite and nonnegative; spacing finite; tolerance positive.");
    }
};

export { CreateTextOutline };
export type { TextOutline, TextPoint };
