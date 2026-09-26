import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Color",
    intro: {
        cn: "保存 RGBA 分量，可从十六进制颜色创建，也可原地修改和复制。",
        en: "Store RGBA components, initialize from hex, and edit or copy colors in place.",
    },
    code: `import { Color } from "bplinejs";

const color = new Color("#5577ee");
color.setRGBA(0.2, 0.4, 0.8, 1);
const hex = color.toHex();`,
    properties: [
        entry("r: number; g: number; b: number; a: number", "归一化红、绿、蓝和透明度分量。", "Normalized red, green, blue, and alpha components."),
    ],
    methods: [
        entry("new Color(hex?: string | number)", "用十六进制颜色创建实例。", "Create a color from a hexadecimal value."),
        entry("setRGB(r: number, g: number, b: number): this", "设置 RGB 分量。", "Set RGB components."),
        entry("setRGBA(r: number, g: number, b: number, a?: number): this", "设置 RGBA 分量。", "Set RGBA components."),
        entry("setHex(hex: string | number): this", "解析十六进制颜色。", "Parse a hexadecimal color."),
        entry("toHex(alpha?: boolean): string", "输出十六进制颜色，可包含透明度。", "Return a hex color, optionally including alpha."),
        entry("copy(color: Color): this", "复制另一颜色的分量。", "Copy another color's components."),
        entry("clone(): Color", "创建独立的颜色副本。", "Create an independent color copy."),
    ],
};
