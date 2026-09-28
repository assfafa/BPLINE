import { CreateTextGeometry, HasTextFont, RegisterTextFont } from "bpmatrixjs/Geometry/Text";
import type { TextGeometryData, TextOptions } from "bpmatrixjs/Geometry/Text";

/** 按指定字号和排版设置创建已注册字体的填充三角面。 */
type TextGeometryFactory = (text: string, fontSize?: number, options?: TextOptions) => TextGeometryData;

interface PendingFont {
    url: string;
    promise: Promise<TextGeometryFactory>;
}

/** 按名称共享已加载字体，供后续文字几何直接使用。 */
class Font {
    private static readonly _urls = new Map<string, string>();
    private static readonly _factories = new Map<string, TextGeometryFactory>();
    private static readonly _pending = new Map<string, PendingFont>();

    /**
     * 已成功注册的字体名称与几何创建函数。返回同一个只读 Map 视图。
     * @example
     * const geometry = Font.map.get("MiSans")?.("啊");
     * @returns 字体名称到几何创建函数的只读 Map。
     */
    public static get map(): ReadonlyMap<string, TextGeometryFactory> {
        return Font._factories;
    }

    /**
     * 下载并注册字体；同名同址的并发调用共用一次请求。
     * @param fontFamily 供文字几何使用的注册名称。
     * @param url TTF、OTF、WOFF 或 WOFF2 字体文件地址。
     * @example
     * const createGeometry = await Font.register("MiSans", fontUrl);
     * const geometry = createGeometry("啊", 32);
     * @returns 几何创建函数；下载或解析失败时拒绝 Promise。
     */
    public static register(fontFamily: string, url: string): Promise<TextGeometryFactory> {
        // 空名称和地址无法形成可复用的字体注册项。
        if (fontFamily.trim().length === 0 || url.trim().length === 0) {
            throw new RangeError("Font family and URL must not be empty.");
        }

        const registeredUrl = Font._urls.get(fontFamily);
        // 已注册的字体无需再次下载；不同来源必须使用新的名称。
        if (registeredUrl !== undefined && HasTextFont(fontFamily)) {
            // 只允许原地址复用，避免一个名称指向两份不同的字形数据。
            if (registeredUrl === url) {
                return Promise.resolve(Font.get(fontFamily));
            } else {
                throw new Error(`Font family is already registered from another URL: ${fontFamily}`);
            }
        }

        const pendingFont = Font._pending.get(fontFamily);
        // 在途请求也按名称去重，避免较慢的请求覆盖较新的字体。
        if (pendingFont !== undefined) {
            // 相同来源共享请求，不同来源等当前请求结束后再决定名称。
            if (pendingFont.url === url) {
                return pendingFont.promise;
            } else {
                throw new Error(`Font family is already loading from another URL: ${fontFamily}`);
            }
        }

        /**
         * 请求结束时移除在途记录，使失败后能够再次尝试。
         * @example
         * await promise.finally(ClearPending);
         * @returns 无返回值。
         */
        const ClearPending = (): void => {
            Font._pending.delete(fontFamily);
        };
        const promise = Font.load(fontFamily, url).finally(ClearPending);
        Font._pending.set(fontFamily, { url, promise });
        return promise;
    }

    /**
     * 根据注册名称取得可调用的文字几何创建函数。
     * @param fontFamily 已注册的字体名称。
     * @example
     * const geometry = Font.get("MiSans")("啊");
     * @returns 创建填充三角面的函数。
     */
    public static get(fontFamily: string): TextGeometryFactory {
        const createGeometry = Font._factories.get(fontFamily);
        // 注册表与 BPMatrixJS 字体表必须同时有效，避免调用过期函数。
        if (createGeometry !== undefined && HasTextFont(fontFamily)) {
            return createGeometry;
        } else {
            throw new Error(`Font is not registered: ${fontFamily}`);
        }
    }

    /**
     * 查询字体是否已完成注册。
     * @param fontFamily 注册名称。
     * @example
     * Font.has("MiSans");
     * @returns 字体是否可用于文字几何。
     */
    public static has(fontFamily: string): boolean {
        return Font._factories.has(fontFamily) && HasTextFont(fontFamily);
    }

    /**
     * 下载字体字节并提交到 BPMatrixJS 的字体表。
     * @param fontFamily 注册名称。
     * @param url 字体文件地址。
     * @example
     * await Font.register("MiSans", fontUrl);
     * @returns 几何创建函数。
     */
    private static async load(fontFamily: string, url: string): Promise<TextGeometryFactory> {
        const response = await fetch(url);
        // HTTP 错误不能交给字体解析器处理，否则会掩盖实际下载问题。
        if (response.ok) {
            const data = await response.arrayBuffer();
            RegisterTextFont(fontFamily, data);
            /**
             * 使用当前已注册字体创建填充三角面，并允许每次设置字号与排版。
             * @param text 支持换行的文字。
             * @param fontSize 几何字号，默认 16。
             * @param options 行距、字距及对齐方式。
             * @example
             * CreateGeometry("啊", 32);
             * @returns 顶点、索引及排版度量。
             */
            const CreateGeometry: TextGeometryFactory = (text, fontSize = 16, options = {}) => {
                return CreateTextGeometry(text, fontSize, fontFamily, options);
            };
            Font._urls.set(fontFamily, url);
            Font._factories.set(fontFamily, CreateGeometry);
            return CreateGeometry;
        } else {
            throw new Error(`Font download failed (${String(response.status)}): ${url}`);
        }
    }
}

export default Font;
export type { TextGeometryFactory };
