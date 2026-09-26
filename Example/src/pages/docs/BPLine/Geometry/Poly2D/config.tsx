import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Poly2D",
    intro: {
        cn: "用 Float32Array 的 [x, y, ...] 节点创建单轮廓多边形或开放折线。输入会复制，坐标不会自动居中。",
        en: "Create a single-contour polygon or open path from Float32Array [x, y, ...] points. Input is copied without recentering.",
    },
    detail: {
        cn: "开放路径使用 { closed: false }，并关闭 style.solid.enabled。",
        en: "For an open path, use { closed: false } and disable style.solid.enabled.",
    },
    code: `import { BaseMaterial, Mesh, Poly2D, Style } from "bplinejs";

const geometry = new Poly2D(new Float32Array([0, 0, 80, 0, 40, 60]));
const style = new Style();
style.solid.enabled = true;
const mesh = new Mesh(geometry, new BaseMaterial(), style);`,
    properties: [
        entry("points: Float32Array", "有序节点数组；整体赋值会复制并重建几何。", "Ordered points; replacing the array copies and rebuilds geometry."),
        entry("closed: boolean", "轮廓是否闭合。", "Whether the contour is closed."),
        entry("width: number; height: number", "节点包围盒尺寸。", "Bounding dimensions of the points."),
        entry("perimeter: number", "当前轮廓长度。", "Current contour length."),
    ],
    methods: [
        entry("new Poly2D(points?: Float32Array, style?: Style | null, options?: Poly2DOptions)", "创建多边形，options.closed 默认 true。", "Create a polygon; options.closed defaults to true."),
    ],
};
