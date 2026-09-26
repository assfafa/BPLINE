import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "EdgeStyle",
    intro: {
        cn: "以实体三角面绘制有宽度的边框，独立于原生线框和 SDF 边框。",
        en: "Draw a wide border from triangles, independently of native wireframe and the SDF border.",
    },
    code: `import { Style } from "bplinejs";

const style = new Style();
style.edge.enabled = true;
style.edge.width = 6;
style.edge.color.setHex("#8bd5ff");`,
    properties: [
        entry("enabled: boolean; color: Color; opacity: number", "边框开关、颜色与透明度。", "Border switch, color, and opacity."),
        entry("width: number; borderAlign: BorderAlign", "线宽与 inset、normal、outset 对齐。", "Width and inset, normal, or outset alignment."),
        entry("pixelAligned: PixelAligned", "使用固定像素或随相机缩放的宽度。", "Use fixed-pixel or zoom-scaled width."),
        entry("uvRepeat: number", "贴图沿轮廓的重复次数。", "Texture repetitions along the contour."),
        entry("texture: Texture | undefined", "可选边框贴图。", "Optional border texture."),
        entry("addressModeU / addressModeV: GPUAddressMode", "贴图寻址模式。", "Texture address modes."),
    ],
    methods: [entry("new EdgeStyle()", "创建默认关闭的实体边框样式。", "Create a wide-edge style that starts disabled.")],
};
