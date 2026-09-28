import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Font",
    intro: {
        cn: "全局静态字体表，按名称注册字体地址。注册完成后可创建 BPLineJS Text，也可直接取得创建三角面顶点的函数。",
        en: "A global static font registry keyed by name. Once loaded, create BPLineJS Text objects or call a font's triangle geometry factory directly.",
    },
    code: `import { Font, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

await Font.register("MiSans", fontUrl);
const triangles = Font.get("MiSans")("啊", 48);
const text = new Text("你好", 48, "MiSans");`,
    properties: [
        entry("Font.map: ReadonlyMap<string, TextGeometryFactory>", "已加载字体名到几何创建函数的只读视图；首个字体是 Text 默认字体。", "Read-only view of loaded factories; its first font is Text's default family."),
    ],
    methods: [
        entry("Font.register(fontFamily: string, url: string): Promise<TextGeometryFactory>", "下载并注册字体；同名同址并发加载共用请求。", "Download and register a font; concurrent calls for the same name and URL share a request."),
        entry("Font.get(fontFamily: string): TextGeometryFactory", "获取可调用函数；如 Font.get(\"MiSans\")(\"啊\", 48)。", "Get a callable factory, for example Font.get(\"MiSans\")(\"啊\", 48)."),
        entry("Font.has(fontFamily: string): boolean", "查询字体是否已完成注册。", "Check whether a font has finished registering."),
        entry("TextGeometryFactory(text, fontSize?, options?): TextGeometryData", "按该字体生成填充三角面及排版度量。", "Generate fill triangles and layout metrics for this font."),
    ],
    links: [{ label: "Text", to: "/docs/bpline/geometry/text" }],
};
