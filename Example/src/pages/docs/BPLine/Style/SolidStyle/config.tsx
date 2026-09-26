import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "SolidStyle",
    intro: {
        cn: "控制实体填充及其 SDF 边框；SDF 边框与 EdgeStyle 的几何边框互相独立。",
        en: "Control solid fill and its SDF border. The SDF border is separate from EdgeStyle geometry edges.",
    },
    code: `import { Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5577ee");
style.solid.borderWidth = 3;
style.solid.borderColor.setHex("#ffffff");`,
    properties: [
        entry("enabled: boolean; color: Color; opacity: number", "实体面开关、填充色与透明度。", "Fill switch, color, and opacity."),
        entry("texture: Texture | undefined", "可选实体贴图。", "Optional fill texture."),
        entry("borderWidth: number; borderColor: Color", "SDF 边框宽度与颜色。", "SDF border width and color."),
        entry("borderAlign: BorderAlign", "SDF 边框的 inset、normal 或 outset 对齐。", "SDF border alignment: inset, normal, or outset."),
        entry("pixelAligned: PixelAligned", "边框使用固定像素或随相机缩放。", "Border size in fixed pixels or camera zoom units."),
        entry("addressModeU / addressModeV: GPUAddressMode", "贴图在两个轴的寻址模式。", "Texture address modes on both axes."),
    ],
    methods: [entry("new SolidStyle()", "创建默认关闭的实体面样式。", "Create a solid style that starts disabled.")],
};
