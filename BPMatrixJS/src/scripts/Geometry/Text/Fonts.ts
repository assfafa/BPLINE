import { TextCache } from "../Wasm/Cache.js";
import { ReadResult, TextWasm, WithText } from "../Wasm/index.js";
import type { TextWasmModule } from "../Wasm/index.js";
import type { TextWritingMode } from "./types.js";
import type { TextOutline } from "./Outline.js";

/** 已注册的 WASM 字体；字体字节、曲线和三角化均由 C++ 管理。 */
class TextFont {
    public readonly version: number;
    public readonly unitsPerEm: number;
    public readonly ascent: number;
    public readonly descent: number;
    public readonly lineGap: number;
    private readonly _module: TextWasmModule;
    private _disposed = false;
    private readonly _shapes = new TextCache<TextRun>();
    private readonly _outlines = new TextCache<TextOutline>();

    /** @param module 原生模块 @param metrics 注册句柄及度量 @example new TextFont(module, metrics); @returns 原生字体的 JS 所有者。 */
    public constructor(module: TextWasmModule, metrics: Float64Array) {
        this._module = module;
        this.version = metrics[0];
        this.unitsPerEm = metrics[1];
        this.ascent = metrics[2];
        this.descent = metrics[3];
        this.lineGap = metrics[4];
    }

    /** @param text 单行原文 @param writingMode 排版方向，默认横排 @example font.shape("你好"); @returns 只读字形定位和 UTF-16 簇信息，不生成三角面。 */
    public shape(text: string, writingMode: TextWritingMode = "horizontal-tb"): TextRun {
        this.requireActive();
        const key = JSON.stringify([text, writingMode]);
        const vertical = Number(writingMode === "vertical-rl");
        const cached = this._shapes.get(key);
        // Repeated editor measurements reuse HarfBuzz output.
        if (cached) {
            return cached;
        } else {
            /** @param pointer UTF-16 地址 @param length 码元数 @example Shape(pointer, 2); @returns 排版数组。 */
            const Shape = (pointer: number, length: number): Float64Array =>
                ReadResult(this._module, this._module._text_shape(this.version, pointer, length, vertical));
            const data = WithText(this._module, text, Shape);
            const glyphs: TextGlyph[] = [];
            const positions: TextGlyphPosition[] = [];
            // Each native record contains ten scalar fields.
            for (let index = 0; index < data[1]; index += 1) {
                const offset = 2 + index * 10;
                glyphs.push(Object.freeze({ id: data[offset], cluster: data[offset + 1],
                    bbox: Object.freeze({ minX: data[offset + 6], minY: data[offset + 7],
                        maxX: data[offset + 8], maxY: data[offset + 9] }) }));
                positions.push(Object.freeze({ xAdvance: data[offset + 2], yAdvance: data[offset + 3],
                    xOffset: data[offset + 4], yOffset: data[offset + 5] }));
            }
            const run = Object.freeze({ advanceWidth: data[0], glyphs: Object.freeze(glyphs), positions: Object.freeze(positions) });
            this._shapes.set(key, run, text.length * 2 + glyphs.length * 256);
            return run;
        }
    }

    /** @param key 完整参数 @param create 原生构建回调 @example font.outline(key, Create); @returns 内部共享的只读轮廓。 */
    public outline(key: string, create: () => TextOutline): TextOutline {
        this.requireActive();
        const cached = this._outlines.get(key);
        // Identical requests skip WASM entirely; public geometry buffers are still independent.
        if (cached) {
            return cached;
        } else {
            const outline = create();
            let points = outline.triangles.length;
            // Account conservatively for nested JS point arrays.
            for (const contour of outline.contours) {
                points += contour.length;
            }
            this._outlines.set(key, outline, key.length * 2 + points * 80 + outline.contours.length * 64);
            return outline;
        }
    }

    /**
     * 调用 C++ 的完整文字几何管线。
     * @param text 原文 @param fontSize 字号 @param lineSpacing 附加行距
     * @param letterSpacing 附加字距 @param align 左/中/右的 0/1/2 编码 @param tolerance 曲线误差 @param writingMode 排版方向
     * @example font.mesh("你好", 16, 0, 0, 0, 0.5);
     * @returns 原生双精度结果副本。
     */
    public mesh(text: string, fontSize: number, lineSpacing: number, letterSpacing: number,
        align: number, tolerance: number, writingMode: TextWritingMode = "horizontal-tb"): Float64Array {
        this.requireActive();
        const vertical = Number(writingMode === "vertical-rl");
        /** @param pointer UTF-16 地址 @param length 码元数 @example Build(pointer, 2); @returns 几何数组。 */
        const Build = (pointer: number, length: number): Float64Array => ReadResult(this._module,
            this._module._text_mesh(this.version, pointer, length, fontSize, lineSpacing, letterSpacing, align, tolerance, vertical));
        return WithText(this._module, text, Build);
    }

    /** @example font.cacheStats; @returns 缓存命中、构建次数及内存估算快照。 */
    public get cacheStats(): TextCacheStats {
        this.requireActive();
        const data = ReadResult(this._module, this._module._text_stats(this.version));
        return { glyphHits: data[0], glyphBuilds: data[1], glyphBytes: data[2],
            shapeHits: this._shapes.hits, shapeBuilds: this._shapes.misses,
            textHits: this._outlines.hits, textBuilds: this._outlines.misses,
            textBytes: this._outlines.bytes, shapeBytes: this._shapes.bytes };
    }

    /** @example font.clearCache(); @returns 清空缓存及统计，保留字体注册。 */
    public clearCache(): void {
        this.requireActive();
        ReadResult(this._module, this._module._text_clear(this.version));
        this._shapes.clear();
        this._outlines.clear();
    }

    /** @example font.dispose(); @returns 释放字体及缓存，重复调用安全。 */
    public dispose(): void {
        // Replaced registrations may still have stale JS references.
        if (this._disposed === false) {
            this._module._text_unregister(this.version);
            this._shapes.clear();
            this._outlines.clear();
            this._disposed = true;
        }
    }

    /** @example font.requireActive(); @returns 已释放字体抛错，避免访问无效句柄。 */
    private requireActive(): void {
        // Check lifetime before returning cached data or touching native memory.
        if (this._disposed) {
            throw new Error("Text font has been unregistered or replaced.");
        }
    }
}

interface TextGlyph {
    readonly id: number;
    readonly cluster: number;
    readonly bbox: Readonly<{ minX: number; minY: number; maxX: number; maxY: number }>;
}
interface TextGlyphPosition {
    readonly xAdvance: number;
    readonly yAdvance: number;
    readonly xOffset: number;
    readonly yOffset: number;
}
interface TextRun {
    readonly advanceWidth: number;
    readonly glyphs: readonly TextGlyph[];
    readonly positions: readonly TextGlyphPosition[];
}
interface TextCacheStats {
    glyphHits: number;
    glyphBuilds: number;
    glyphBytes: number;
    shapeHits: number;
    shapeBuilds: number;
    textHits: number;
    textBuilds: number;
    textBytes: number;
    shapeBytes: number;
}

const fonts = new Map<string, TextFont>();
const revisions = new Map<string, symbol>();

/**
 * 异步初始化 WASM 并注册字体，完成后可同步创建几何。
 * @param fontFamily 注册名称 @param data TTF/OTF/WOFF/WOFF2 字节，立即复制
 * @example await RegisterTextFont("MiSans", await response.arrayBuffer());
 * @returns 注册名称；同名替换自动释放旧字体及缓存。
 */
const RegisterTextFont = async (fontFamily: string, data: ArrayBuffer | Uint8Array): Promise<string> => {
    // Own bytes before awaiting initialization so later caller mutation cannot alter the font.
    if (fontFamily.trim().length > 0 && data.byteLength > 0 && data.byteLength <= 64 * 1024 * 1024) {
        const bytes = new Uint8Array(new Uint8Array(data));
        const revision = Symbol(fontFamily);
        revisions.set(fontFamily, revision);
        try {
            const module = await TextWasm.ready();
            // Unregister and newer registrations invalidate pending requests for this name.
            if (revisions.get(fontFamily) === revision) {
                const pointer = module._malloc(bytes.length);
                // Preserve the previous registration if replacement parsing fails.
                if (pointer > 0) {
                    try {
                        module.HEAPU8.set(bytes, pointer);
                        const metrics = ReadResult(module, module._text_register(pointer, bytes.length));
                        const font = new TextFont(module, metrics);
                        fonts.get(fontFamily)?.dispose();
                        fonts.set(fontFamily, font);
                    } finally {
                        module._free(pointer);
                    }
                    return fontFamily;
                } else {
                    throw new Error("Could not allocate font bytes in WASM.");
                }
            } else {
                throw new Error("Text font registration was superseded: " + fontFamily);
            }
        } finally {
            // Revision markers only live for the duration of a pending request.
            if (revisions.get(fontFamily) === revision) {
                revisions.delete(fontFamily);
            }
        }
    } else {
        throw new RangeError("fontFamily must not be empty; font data must contain 1–67108864 bytes.");
    }
};

/** @param fontFamily 字体名称 @example HasTextFont("MiSans"); @returns 注册完成状态。 */
const HasTextFont = (fontFamily: string): boolean => fonts.has(fontFamily);

/** @param fontFamily 字体名称 @example UnregisterTextFont("MiSans"); @returns 是否删除已有字体；同时取消在途注册。 */
const UnregisterTextFont = (fontFamily: string): boolean => {
    revisions.delete(fontFamily);
    fonts.get(fontFamily)?.dispose();
    return fonts.delete(fontFamily);
};

/** @param fontFamily 字体名称 @example GetTextFont("MiSans").shape("你好"); @returns 已注册 WASM 字体。 */
const GetTextFont = (fontFamily: string): TextFont => {
    const font = fonts.get(fontFamily);
    // Unknown names must not silently fall back to a font with different bounds.
    if (font) {
        return font;
    } else {
        throw new Error("Text font is not registered: " + fontFamily);
    }
};

export { GetTextFont, HasTextFont, RegisterTextFont, TextFont, UnregisterTextFont };
export type { TextCacheStats, TextGlyph, TextGlyphPosition, TextRun };
