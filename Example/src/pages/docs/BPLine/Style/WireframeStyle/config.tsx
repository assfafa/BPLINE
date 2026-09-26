import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "WireframeStyle",
    intro: {
        cn: "原生 line-list 线框分区，拥有独立的开关、颜色和透明度；不提供线宽。",
        en: "Native line-list wireframe part with its own enabled switch, color, and opacity. It does not set line width.",
    },
    code: `import { Style } from "bplinejs";

const style = new Style();
style.wireframe.enabled = true;
style.wireframe.color.setHex("#ffffff");`,
    properties: [
        entry("enabled: boolean", "启用原生线框。", "Enable native wireframe drawing."),
        entry("color: Color; opacity: number", "线框颜色和透明度。", "Wireframe color and opacity."),
    ],
    methods: [entry("new WireframeStyle()", "创建默认关闭的线框样式。", "Create a wireframe style that starts disabled.")],
};
