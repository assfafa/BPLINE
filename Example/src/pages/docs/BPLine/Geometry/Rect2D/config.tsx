import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Rect2D",
    intro: {
        cn: "创建矩形或圆角矩形网格体的几何部分。宽高、圆角可直接修改；填充和附加效果由 Mesh 的 Style 决定。",
        en: "Geometry for rectangular or rounded meshes. Edit dimensions and radius directly; the Mesh Style controls fill and other effects.",
    },
    code: `import { BaseMaterial, Mesh, Rect2D, Style } from "bplinejs";

const geometry = new Rect2D({ width: 180, height: 110, radius: 18 });
const style = new Style();
style.solid.enabled = true;
const mesh = new Mesh(geometry, new BaseMaterial(), style);`,
    properties: [
        entry("width: number; height: number", "矩形尺寸，赋值后重建几何。", "Rectangle dimensions; assignment rebuilds geometry."),
        entry("radius: number", "圆角半径，会限制到半宽、半高的较小值。", "Corner radius, clamped to half the smaller side."),
        entry("perimeter: number", "当前轮廓周长。", "Current contour perimeter."),
    ],
    methods: [
        entry("new Rect2D(options?: Rect2DOptions)", "接受 width、height、radius；可选共享 style。", "Accept width, height, radius, and optional shared style."),
    ],
};
