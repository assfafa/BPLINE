import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "JoinStyle",
    intro: {
        cn: "控制多边形边框节点的连接形式；属于几何生成参数，不单独控制颜色或线宽。",
        en: "Control polygon border joins. This affects geometry generation and does not separately set color or width.",
    },
    code: `import { Style } from "bplinejs";

const style = new Style();
style.join.type = "round";
style.join.seg = 8;`,
    properties: [
        entry("type: \"miter\" | \"round\" | \"bevel\"", "尖角、圆接或切角连接。", "Miter, round, or bevel joins."),
        entry("seg: number", "圆接细分段数；只有 round 使用。", "Round-join segment count; used only for round."),
    ],
    methods: [entry("new JoinStyle()", "创建默认 miter 连接样式。", "Create the default miter join style.")],
};
