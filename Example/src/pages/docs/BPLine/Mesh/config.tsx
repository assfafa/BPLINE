import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Mesh",
    intro: {
        cn: "把几何、材质和可选样式组合为场景节点；继承 ObjectNode 的位置、旋转与缩放。",
        en: "Combine geometry, material, and optional style in a scene node. Mesh inherits position, rotation, and scale from ObjectNode.",
    },
    code: `import { BaseMaterial, Mesh, Rect2D, Style } from "bplinejs";

const geometry = new Rect2D({ width: 180, height: 110, radius: 18 });
const material = new BaseMaterial();
const style = new Style();
style.solid.enabled = true;
const mesh = new Mesh(geometry, material, style);
mesh.rotation = Math.PI / 8;
mesh.bounding = true;
const bounds = mesh.boundingBox;
// bounds?.local / bounds?.world: { x, y, width, height }`,
    properties: [
        entry("data: Geometry2d | undefined", "当前几何体，可替换。", "Current replaceable geometry."),
        entry("material: Material2d | undefined", "当前材质，可替换。", "Current replaceable material."),
        entry("style: Style | undefined", "网格体的外观样式。", "Appearance style for the mesh."),
        entry("position: Vec2; rotation: number; scale: Vec2", "继承自 ObjectNode 的局部变换。", "Local transform inherited from ObjectNode."),
        entry("bounding: boolean", "按需计算自身几何的包围盒，默认 false；开关变化会更新 Mesh 版本。", "Enable on-demand bounds for this mesh's geometry. Defaults to false; changing it updates the Mesh version."),
        entry("readonly boundingBox: MeshBoundingBox | null", "返回局部和世界轴向范围，各含 x、y、width、height；关闭或无有效顶点时为 null。几何、位置、旋转和缩放变化后按需更新，不包含子节点。", "Return local and world axis-aligned bounds with x, y, width, and height. Null when disabled or empty. Recomputed after geometry or transform changes; child nodes are excluded."),
    ],
    methods: [
        entry("new Mesh(data: Geometry2d, material: Material2d, style?: Style | boolean)", "组合几何与材质，并可传入样式。", "Combine geometry and material with an optional style."),
        entry("init(data: Geometry2d, material: Material2d): this", "重新绑定几何与材质。", "Rebind geometry and material."),
        entry("dispose(): void", "解除几何、材质和样式关联。", "Release geometry, material, and style subscriptions."),
    ],
};
