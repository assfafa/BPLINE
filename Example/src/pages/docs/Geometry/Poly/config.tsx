import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Poly",
    intro: {
        cn: "用有序节点生成单轮廓多边形或开放折线。节点可写为 [x, y]，也可为带 round、segments 的对象。",
        en: "Build a single-contour polygon or open path from ordered points. A point is [x, y] or an object with round and segments options.",
    },
    detail: {
        cn: "默认闭合并填充。开放路径须设 closed: false、solid: false；节点圆接只影响边框连接，不改变填充轮廓。",
        en: "Paths are closed and filled by default. Open paths need closed: false and solid: false; rounded nodes affect border joins only.",
    },
    code: `import { Poly } from "bpmatrixjs/Geometry/Poly";

const triangle = new Poly([[0, 0], [80, 0], [40, 60]]);
const outline = new Poly([[0, 0], [80, 0], [40, 60]], {
    closed: false,
    solid: false,
});
const border = outline.createBorderGeometry(4);`,
    properties: [
        entry("points: PolyNode[]", "规范化后的节点列表。", "Normalized point list."),
        entry("width: number; height: number", "输入轮廓的包围盒尺寸。", "Bounding dimensions of the input contour."),
        entry("closed: boolean; solid: boolean", "闭合与填充开关。", "Closure and fill switches."),
        entry("data: PolyGeometryData", "填充数据；关闭 solid 时为空。", "Fill data; empty when solid is disabled."),
        entry("borderData / lineData / pointData", "最近一次生成的附加几何数据。", "Most recently generated auxiliary geometry."),
    ],
    methods: [
        entry("new Poly(points?: PolyPoint[], options?: PolyOptions)", "创建多边形或折线。", "Create a polygon or path."),
        entry("set(points: PolyPoint[], options?: PolyOptions): this", "更新节点和选项，重建填充并清除旧附加结果。", "Update points and options, rebuild fill, and clear old auxiliary data."),
        entry("getPerimeter(): number", "返回轮廓长度；开放路径不包含首尾连线。", "Return contour length; open paths omit the closing edge."),
        entry("createBorderGeometry(lineWidth, uvRepeat?, align?)", "生成带宽度的边框数据。", "Build border data with a selected width."),
        entry("createLineGeometry(uvRepeat?): PolyLineGeometryData", "生成轮廓线段数据。", "Build contour line segments."),
        entry("createPointGeometry(pointRadius?, sides?, vertexPoints?, midpointPoints?, vertexThreshold?, midpointThreshold?)", "按阈值生成顶点与边中点标记。", "Build vertex and midpoint markers using thresholds."),
        entry("GetPolyPerimeter / CreatePolyGeometry", "独立函数直接计算周长或填充数据。", "Standalone helpers calculate perimeter or fill data."),
        entry("CreatePolyBorderGeometry / CreatePolyLineGeometry / CreatePolyPointGeometry", "独立函数按需生成附加几何。", "Standalone helpers build auxiliary geometry."),
    ],
};
