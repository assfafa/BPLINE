import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "SMAA",
    intro: {
        cn: "SMAA 1x Medium 抗锯齿预置：边缘检测、查找表权重、邻域混合。自动包含所需查找表，无需用户额外加载图片。",
        en: "An SMAA 1x Medium preset with edge detection, lookup-table weights and neighborhood blending. Required lookup tables are included automatically.",
    },
    detail: {
        cn: "没有时间累积或额外多重采样。通常在发光、阴影之后添加，保留透明背景与 HDR 颜色范围。和 FXAA 是两种选择，通常选其中一种；当前质量预设固定，未暴露阈值或质量档位参数。",
        en: "Uses no temporal history or extra multisampling. Usually place it after bloom and shadow; transparency and HDR color range are preserved. SMAA and FXAA are alternatives, so normally choose one. The quality preset is fixed, with no public threshold or quality-level controls.",
    },
    code: `import { SMAA } from "bplinejs";

const antialias = new SMAA();
antialias.enabled = true;
// post.add("aa", antialias);
// Toggle antialias.enabled to compare the same input.`,
    properties: [
        entry("enabled: boolean = true", "开关控制整套 SMAA 步骤；关闭时直接传递输入。", "Enable or skip the full SMAA sequence; disabled passes pass the input through."),
    ],
    methods: [
        entry("new SMAA()", "创建固定 Medium 预设，内部资源归 PostProcess 管理。", "Create the fixed Medium preset; PostProcess owns its internal resources."),
    ],
    links: [
        { label: "PostProcess", to: "/docs/bpline/post-process" },
        { label: "FXAA", to: "/docs/bpline/post-process/fxaa" },
        { label: "SMAA example", to: "/example/post-process/smaa" },
    ],
};
