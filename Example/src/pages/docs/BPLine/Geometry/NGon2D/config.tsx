import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "NGon2D",
    intro: {
        cn: "创建正多边形、近似圆盘或圆环。inner 大于 0 时生成内孔；公开选项使用 inner 和 uvMode。",
        en: "Create a regular polygon, approximate disk, or ring. An inner radius above zero creates a hole; public options use inner and uvMode.",
    },
    code: `import { BaseMaterial, Mesh, NGon2D, Style } from "bplinejs";

const geometry = new NGon2D({ sides: 32, outer: 60, inner: 25 });
const style = new Style();
style.solid.enabled = true;
const mesh = new Mesh(geometry, new BaseMaterial(), style);`,
    properties: [
        entry("outer: number; inner: number", "外环和内环半径；inner 不超过 outer。", "Outer and inner radii; inner cannot exceed outer."),
        entry("sides: number", "边数，至少为 2。", "Number of sides, at least 2."),
        entry("uvMode: \"bounding\" | \"polar\"", "填充面的 UV 映射模式。", "Fill UV mapping mode."),
        entry("startAngle: number", "首点朝向，单位弧度。", "First-point angle in radians."),
        entry("width: number; height: number", "轮廓包围盒尺寸。", "Bounding dimensions of the contour."),
        entry("perimeter: number", "当前可见轮廓周长。", "Current visible contour length."),
    ],
    methods: [
        entry("new NGon2D(options?: NGon2DOptions)", "接受 outer、inner、sides、uvMode、startAngle 和可选 style。", "Accept outer, inner, sides, uvMode, startAngle, and optional style."),
    ],
};
