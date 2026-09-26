import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Rect",
    intro: {
        cn: "生成中心位于原点的矩形或圆角矩形。radius 会限制为宽高较小值的一半。",
        en: "Build a rectangle or rounded rectangle centered at the origin. radius is clamped to half the smaller side.",
    },
    code: `import { Rect, GetRectPerimeter } from "bpmatrixjs/Geometry/Rect";

const rectangle = new Rect(180, 110, 18);
const fill = rectangle.data;
const border = rectangle.createBorderGeometry(6);
const perimeter = GetRectPerimeter(180, 110, 18);`,
    properties: [
        entry("width: number; height: number", "矩形当前宽高。", "Current rectangle dimensions."),
        entry("radius: number", "实际使用的圆角半径。", "Effective corner radius."),
        entry("data: RectGeometryData", "填充顶点、法线、UV 与索引数据。", "Fill vertices, normals, UVs, and indices."),
        entry("borderData / lineData / pointData", "最近一次按需生成的边框、线框或点型数据。", "Most recently generated border, line, or point data."),
    ],
    methods: [
        entry("new Rect(width: number, height: number, radius?: number)", "创建矩形；radius 默认 0。", "Create a rectangle; radius defaults to zero."),
        entry("set(width: number, height: number, radius?: number): this", "更新尺寸和圆角并重新生成填充。", "Update dimensions and corner radius, then rebuild fill data."),
        entry("getPerimeter(): number", "计算当前离散轮廓的周长。", "Calculate the perimeter of the generated contour."),
        entry("createBorderGeometry(lineWidth, uvRepeat?, align?)", "生成指定宽度与对齐方式的边框数据。", "Build border data with width and alignment."),
        entry("createLineGeometry(uvRepeat?): RectLineGeometryData", "生成闭合矩形轮廓的线段数据。", "Build line segments for the closed outline."),
        entry("createPointGeometry(pointRadius?, sides?, vertexPoints?, midpointPoints?, vertexThreshold?, midpointThreshold?)", "按阈值生成顶点或边中点标记。", "Build vertex or midpoint markers using length thresholds."),
        entry("GetRectPerimeter / CreateRectGeometry", "独立函数直接计算周长或生成填充数据。", "Standalone helpers calculate perimeter or build fill data."),
        entry("CreateRectBorderGeometry / CreateRectLineGeometry / CreateRectPointGeometry", "独立函数按需生成附加几何。", "Standalone helpers build border, line, and point data."),
    ],
};
