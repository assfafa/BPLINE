import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Bloom",
    intro: {
        cn: "根据各对象的 style.bloom 生成发光，配合 post.add(\"bloom\", new Bloom()) 使用。颜色、强度、半径等都保存在 Style 中。",
        en: "Generate per-object glow from style.bloom using post.add(\"bloom\", new Bloom()). Color, intensity, radius and other effect settings belong to Style.",
    },
    detail: {
        cn: "按实际参数值分组，相同参数的独立 Style 或 IMesh 实例共享一次遮罩和模糊。遮罩保留原场景深度、顺序和片元透明度：被上层实体挡住的区域不参与发光。不同组光晕重叠时，先应用强度/透明度，再按亮度保留最强的一份完整颜色，最后只与原画面合成一次；不是逐 RGB 通道取最大值。强度很大时 SDR 仍可能饱和。",
        en: "Group by actual parameter values: separate Styles or IMesh instances with matching settings share mask and blur work. Masks preserve scene depth, draw order and fragment alpha, so occluded regions do not emit. Overlapping glow groups are compared after intensity/opacity; the strongest full color by luminance is retained and composed with the original image once, rather than taking independent RGB maxima. High intensity can still saturate SDR.",
    },
    code: `import { Bloom, Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
style.bloom.enabled = true;
style.bloom.color.setHex("#45baff");
style.bloom.radius = 24;
style.bloom.intensity = 1.2;
style.bloom.threshold = 0;
const bloom = new Bloom();
// Assign style to the mesh, then: post.add("bloom", bloom);`,
    properties: [
        entry("enabled: boolean = true", "整个 Bloom 通道开关；对象的 style.bloom.enabled 默认 false，还需单独启用。", "Pass-wide switch; each object's style.bloom.enabled starts false and must also be enabled."),
        entry("style.bloom: BloomStyle", "对象级参数及默认值见 BloomStyle。无启用对象或强度为 0 时跳过对应效果。", "See BloomStyle for per-object values and defaults. Disabled objects and zero-intensity groups are skipped."),
        entry("render.hdrEnabled", "为 true 时 Bloom 输出使用 rgba16float，允许 RGB > 1，后续通道保留浮点范围；普通材质 0–1 颜色不会统一放大。", "When true, Bloom outputs rgba16float and allows RGB above 1, retained by later passes. Ordinary material colors in 0–1 are not globally scaled."),
    ],
    methods: [
        entry("new Bloom()", "无需传效果参数，加入 PostProcess 后读取原始场景 Style。", "No effect arguments; once added to PostProcess it reads Styles from the source scene."),
    ],
    links: [
        { label: "BloomStyle", to: "/docs/bpline/style/bloom-style" },
        { label: "PostProcess", to: "/docs/bpline/post-process" },
        { label: "Render HDR", to: "/docs/bpline/render" },
        { label: "Bloom example", to: "/example/post-process/bloom" },
    ],
};
