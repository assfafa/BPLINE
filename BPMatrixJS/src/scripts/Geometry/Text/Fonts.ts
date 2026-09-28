import { create } from "fontkit";
import type { Font } from "fontkit";

const fonts = new Map<string, Font>();

/**
 * 按名称注册字体字节；字体解析由 fontkit 完成，注册结果供所有 Text 实例共享。
 * @param fontFamily 用户指定的字体名称
 * @param data TTF、OTF、WOFF 或 WOFF2 的二进制数据
 * @example
 * RegisterTextFont("MiSans", await response.arrayBuffer());
 * @returns 注册名称
 */
const RegisterTextFont = (fontFamily: string, data: ArrayBuffer | Uint8Array): string => {
    // 名称保持明确，避免空字符串意外覆盖其他字体。
    if (fontFamily.length > 0) {
        const bytes = new Uint8Array(data);
        // 字体字节由调用方持有，因此解析前复制，避免后续外部修改。
        const ownedBytes = new Uint8Array(bytes);
        // fontkit 2.x 运行时接受 Uint8Array；其 DefinitelyTyped 声明仍写为 Node Buffer。
        const parsed = create(ownedBytes as Buffer);
        // 字体集合需要指定具体成员；当前 API 只注册单个字体文件。
        if ("layout" in parsed) {
            fonts.set(fontFamily, parsed);
            return fontFamily;
        } else {
            throw new Error("Font collections require a selected font face.");
        }
    } else {
        throw new RangeError("fontFamily must not be empty.");
    }
};

/**
 * 查询字体名称是否已注册。
 * @param fontFamily 字体名称
 * @example
 * HasTextFont("MiSans");
 * @returns 注册状态
 */
const HasTextFont = (fontFamily: string): boolean => fonts.has(fontFamily);

/**
 * 注销字体名称；已创建的几何缓冲不受影响。
 * @param fontFamily 字体名称
 * @example
 * UnregisterTextFont("MiSans");
 * @returns 是否删除已有字体
 */
const UnregisterTextFont = (fontFamily: string): boolean => fonts.delete(fontFamily);

/**
 * 获取已注册的字体，避免每次构建几何时重复解析。
 * @param fontFamily 字体名称
 * @example
 * GetTextFont("MiSans");
 * @returns fontkit 字体对象
 */
const GetTextFont = (fontFamily: string): Font => {
    const font = fonts.get(fontFamily);
    // 未注册的字体不能静默退化为其他字形，否则尺寸和内容会错误。
    if (font === undefined) {
        throw new Error("Text font is not registered: " + fontFamily);
    } else {
        return font;
    }
};

export { RegisterTextFont, HasTextFont, UnregisterTextFont, GetTextFont };
