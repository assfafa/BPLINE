import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "FXAA",
    intro: {
        cn: "继承 WgslPass 的单步骤快速近似抗锯齿。检测颜色亮度和透明轮廓，沿边缘方向混合像素。",
        en: "A single-step fast approximate anti-aliasing pass extending WgslPass. It detects luminance and alpha edges and blends pixels along their direction.",
    },
    detail: {
        cn: "通常添加在发光、阴影之后，保留透明背景和 HDR 颜色范围。与 SMAA 通常二选一。默认全分辨率；resolutionScale 从 WgslPass 继承，降低分辨率也会改变细节，默认保持 1。",
        en: "Usually place it after bloom and shadow; transparent backgrounds and HDR color range are preserved. Normally choose FXAA or SMAA. The inherited resolutionScale defaults to 1; reducing it also changes image detail.",
    },
    code: `import { FXAA } from "bplinejs";

const antialias = new FXAA();
antialias.enabled = true;
// post.add("aa", antialias);`,
    properties: [
        entry("enabled: boolean = true", "通道开关；关闭时跳过。", "Enable or skip this pass."),
        entry("resolutionScale: number = 1", "继承 WgslPass，输出尺寸相对原始输入 viewport；正常抗锯齿保持 1。", "Inherited from WgslPass; output size relative to the original input viewport. Keep 1 for normal anti-aliasing."),
    ],
    methods: [
        entry("new FXAA()", "构建时已装入 FXAA 片元源码，无需配置 raw.fragmentShader。", "Includes the FXAA fragment shader; no raw.fragmentShader setup is needed."),
    ],
    links: [
        { label: "WgslPass", to: "/docs/bpline/post-process/wgsl" },
        { label: "SMAA", to: "/docs/bpline/post-process/smaa" },
        { label: "FXAA example", to: "/example/post-process/fxaa" },
    ],
};
