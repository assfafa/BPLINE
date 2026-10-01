import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Material",
    intro: {
        cn: "抽象材质基类，定义着色器和固定管线状态。使用 BaseMaterial、按分区着色的 CompositeMaterial，或完整 WGSL 的 WGSLMaterial。",
        en: "Abstract material base for shaders and fixed pipeline state. Choose BaseMaterial, section-based CompositeMaterial, or full-source WGSLMaterial.",
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
        entry("key: string", "由着色器源码、固定状态、Style.key 和具名值布局组成的 Pipeline 缓存键。", "Pipeline cache key derived from shader sources, fixed state, Style.key, and named-value layout."),
        entry("rectVertexShader / rectFragmentShader: string | undefined", "矩形几何使用的可替换 WGSL。", "Replaceable WGSL for rectangle geometry."),
        entry("polyVertexShader / polyFragmentShader: string | undefined", "多边形几何使用的可替换 WGSL。", "Replaceable WGSL for polygon geometry."),
        entry("ngonVertexShader / ngonFragmentShader: string | undefined", "正多边形几何使用的可替换 WGSL。", "Replaceable WGSL for regular-polygon geometry."),
    ],
    methods: [
        entry("getPipelineKey(geometryType): string", "按几何类型取得可复用的管线键。", "Get the reusable pipeline key for a geometry type."),
        entry("dispose(): void", "不再使用材质时解除样式关联。", "Release style subscriptions when the material is no longer used."),
    ],
    links: [
        { label: "BaseMaterial", to: "/docs/bpline/material/base-material" },
        { label: "CompositeMaterial", to: "/docs/bpline/material/composite-material" },
        { label: "WGSLMaterial", to: "/docs/bpline/material/wgsl-material" },
    ],
};
