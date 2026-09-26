import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Geo",
    intro: {
        cn: "BPLineJS 几何体的基类，统一管理样式关联和 CPU 几何数据。通常直接创建 Rect2D、Poly2D 或 NGon2D。",
        en: "Base geometry class for style binding and CPU geometry data. Usually create Rect2D, Poly2D, or NGon2D directly.",
    },
    code: `import { Geo, Style } from "bplinejs";

const geometry = new Geo(new Style());
geometry.style = new Style();`,
    properties: [
        entry("style: Style", "影响填充、边框、线框和辅助点生成的共享样式。", "Shared style controlling fill, borders, wireframe, and point markers."),
    ],
    methods: [
        entry("new Geo(style?: Style)", "创建几何体基类。", "Create a base geometry."),
        entry("dispose(): void", "解除样式关联并释放对象引用。", "Release style subscriptions and object references."),
    ],
};
