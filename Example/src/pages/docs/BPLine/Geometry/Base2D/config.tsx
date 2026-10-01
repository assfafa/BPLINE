import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Base2D",
    intro: {
        cn: "直接传入二维三角面顶点和可选属性的几何体，适合外部剖分器、动态图形和自定义 WGSL。",
        en: "Supply 2D triangle vertices and optional attributes directly, useful for external triangulators, dynamic geometry, and custom WGSL.",
    },
    detail: {
        cn: "vertices 是按 x、y 排列的 Float32Array；没有 index 时，每连续三个顶点组成一个三角形。几何体不会自动从顶点生成边框或关键点，需提供对应的 vertexType、normal、position 和 miterScale 数据。",
        en: "vertices is a Float32Array of x/y pairs. Without index, each three consecutive vertices form a triangle. Borders and point markers are not inferred from vertices; provide matching vertexType, normal, position, and miterScale attributes when needed.",
    },
    code: `import { Base2D, BaseMaterial, Mesh, Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
const geometry = new Base2D({
    vertices: new Float32Array([-50, -40, 50, -40, 0, 50]),
    uv: new Float32Array([0, 0, 1, 0, 0.5, 1]),
    style,
});
const material = new BaseMaterial(style);
material.cullMode = "none";
const mesh = new Mesh(geometry, material, false);`,
    properties: [
        entry("readonly type: \"Base2D\"", "可用于区分直接顶点几何。", "Identifies direct-vertex geometry."),
        entry("vertices: Float32Array", "每个顶点占两个浮点数；顺序索引要求完整三角形。", "Two floats per vertex; sequential input requires complete triangles."),
        entry("uv; normal; position?: Float32Array", "每项长度与 vertices 相同。", "Each array has the same length as vertices."),
        entry("index?: Uint16Array | Uint32Array", "可选三角形索引；未提供时按顶点顺序生成。", "Optional triangle indices; generated sequentially when omitted."),
        entry("vertexType; miterScale?: Float32Array", "每项长度等于顶点数；实体面类型为 0，边框为 0.5，关键点为 1。", "One value per vertex; section types are 0 for fill, 0.5 for edge, and 1 for points."),
    ],
    methods: [
        entry("new Base2D(options: Base2DOptions)", "复制并校验传入的顶点和属性。", "Copy and validate the supplied vertices and attributes."),
        entry("setData(options: Base2DOptions): void", "整体替换几何数据；缓冲尺寸不变时复用 GPUBuffer。", "Replace all geometry data; reuse GPU buffers when sizes match."),
    ],
    links: [
        { label: "Geo", to: "/docs/bpline/geometry/geo" },
        { label: "WGSLMaterial", to: "/docs/bpline/material/wgsl-material" },
        { label: "Custom shader example", to: "/example/material/custom" },
    ],
};
