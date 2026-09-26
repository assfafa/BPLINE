import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Material",
    intro: {
        cn: "抽象材质基类，定义着色器和固定管线状态。直接使用内置 BaseMaterial；自定义 WGSL 时继承 Material。",
        en: "Abstract material base for shaders and fixed pipeline state. Use BaseMaterial directly, or extend Material for custom WGSL.",
    },
    code: `import { BaseMaterial } from "bplinejs";

const material = new BaseMaterial();
material.transparent = true;
material.depthTest = true;
material.depthWrite = false;`,
    properties: [
        entry("style: Style", "与材质关联的共享样式。", "Shared style associated with the material."),
        entry("transparent: boolean", "透明绘制开关。", "Transparent rendering switch."),
        entry("depthTest: boolean; depthWrite: boolean", "深度测试和深度写入分别控制。", "Control depth testing and writing independently."),
        entry("cullMode: GPUCullMode", "三角面剔除方式。", "Triangle culling mode."),
        entry("rectVertexShader / rectFragmentShader: string | undefined", "矩形几何使用的可替换 WGSL。", "Replaceable WGSL for rectangle geometry."),
        entry("polyVertexShader / polyFragmentShader: string | undefined", "多边形几何使用的可替换 WGSL。", "Replaceable WGSL for polygon geometry."),
        entry("ngonVertexShader / ngonFragmentShader: string | undefined", "正多边形几何使用的可替换 WGSL。", "Replaceable WGSL for regular-polygon geometry."),
    ],
    methods: [
        entry("dispose(): void", "不再使用材质时解除样式关联。", "Release style subscriptions when the material is no longer used."),
    ],
};
