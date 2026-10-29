import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Style",
    intro: {
        cn: "一个 Style 包含实体面、原生线框、实体边框、辅助点、连接样式，以及 bloom 发光和 shadow 阴影。显示与效果分区默认关闭；后处理效果还需在 PostProcess 中添加对应 Pass。",
        en: "A Style contains solid, native wireframe, edge, point and join settings, plus bloom and shadow effects. Display and effect parts start disabled; effects also require their corresponding pass in PostProcess.",
    },
    code: `import { Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5577ee");
style.edge.enabled = true;
style.edge.width = 6;`,
    properties: [
        entry("solid: SolidStyle", "实体面和 SDF 边框设置。", "Solid fill and SDF border settings."),
        entry("wireframe: WireframeStyle", "原生 line-list 线框设置。", "Native line-list wireframe settings."),
        entry("edge: EdgeStyle", "实体三角面边框设置。", "Triangle-based edge settings."),
        entry("points: PointsStyle", "顶点和边中点标记设置。", "Vertex and edge midpoint marker settings."),
        entry("join: JoinStyle", "边框节点连接类型和精度。", "Border join type and precision."),
        entry("bloom: BloomStyle", "对象发光参数；启用 Bloom 通道后读取，相同参数的对象按值合批。", "Per-object glow settings read by the Bloom pass; matching parameter values batch together."),
        entry("shadow: ShadowStyle", "对象内外阴影参数，配合 Shadow 通道使用。", "Per-object inner and outer shadow settings, used with the Shadow pass."),
        entry("readonly type: string", "对象类型为 Style。", "Object type is Style."),
        entry("readonly key: string", "影响 Pipeline 选择的样式状态键；颜色等显示数值不会产生新管线。", "Style state key for pipeline selection; color changes do not create a new pipeline."),
    ],
    methods: [
        entry("copy(source: Style): this / clone(): Style", "复制各样式分量和独立 Color，包括 bloom/shadow；纹理及 RenderTarget 保留引用。各子样式也提供 copy/clone。", "Copy all style components and independent Colors, including bloom/shadow, while retaining texture and RenderTarget references. Each component also provides copy/clone."),
        entry("new Style()", "创建全部显示分区默认关闭的样式。", "Create a style with all display parts disabled."),
        entry("dispose(): void", "所有使用者停止引用后解除关联。", "Release subscriptions after all users stop referencing the style."),
    ],
    links: [
        { label: "SolidStyle", to: "/docs/bpline/style/solid-style" },
        { label: "WireframeStyle", to: "/docs/bpline/style/wireframe-style" },
        { label: "EdgeStyle", to: "/docs/bpline/style/edge-style" },
        { label: "PointsStyle", to: "/docs/bpline/style/points-style" },
        { label: "JoinStyle", to: "/docs/bpline/style/join-style" },
        { label: "BloomStyle", to: "/docs/bpline/style/bloom-style" },
        { label: "ShadowStyle", to: "/docs/bpline/style/shadow-style" },
        { label: "PostProcess", to: "/docs/bpline/post-process" },
    ],
};
