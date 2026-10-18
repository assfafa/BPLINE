import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Utils",
    intro: {
        cn: "BPMatrixJS 的独立工具：数值、坐标、时间、UUID 和不依赖渲染器的二维几何计算。公开入口为 bpmatrixjs/Utils。",
        en: "BPMatrixJS utilities cover numbers, coordinates, timing, UUIDs, and renderer-independent 2D geometry. Import them from bpmatrixjs/Utils.",
    },
    detail: {
        cn: "HasSeparatingAxis 只测试第一个凸轮廓的边法线；完整 SAT 检测需交换两个轮廓再调用一次。TriangleOverlapArea 返回面积，边界相切时为 0。",
        en: "HasSeparatingAxis checks axes from its first convex outline only; swap the outlines and call it again for a full SAT test. TriangleOverlapArea returns zero for boundary-only contact.",
    },
    code: `import { Clamp, GetInner, Time, UUID, TriangleOverlapArea } from "bpmatrixjs/Utils";

const limited = Clamp(12, 0, 10); // 10
const size = GetInner();
const clock = new Time();
const id = UUID();
const firstTriangle = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }] as const;
const secondTriangle = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }] as const;
const overlap = TriangleOverlapArea(firstTriangle, secondTriangle);`,
    methods: [
        entry("Bool: WASM Boolean operations", "await Bool.ready() 后使用 Union/Difference/Intersection/Xor，支持连续轮廓与三角网混合输入、孔和来源追踪；详见 Bool。", "Await Bool.ready() before Union/Difference/Intersection/Xor, supporting mixed contours and triangle meshes, holes and source tracking; see Bool."),
        entry("CheckPrecision(value: number): number", "曲线细分整数校验，范围 1…4095。", "Validate an integer curve subdivision value in 1…4095."),
        entry("TransformPoint2D / InverseTransformPoint2D / ProjectSegmentPoint / ContainsPolygonPoint", "公共双精度变换、线段投影和单轮廓包含判断，详见 PointGeometry。", "Shared double-precision transforms, segment projection and contour containment; see PointGeometry."),
        entry("Clamp(value: number, min: number, max: number): number", "把数值限制在最小值与最大值之间。", "Constrain a number between minimum and maximum values."),
        entry("SignedDoubleArea(points: readonly Point2D[]): number", "按顶点顺序计算有向两倍面积；符号表示绕向。", "Compute signed double area; its sign indicates winding."),
        entry("HasSeparatingAxis(axesSource: readonly Point2D[], other: readonly Point2D[]): boolean", "查找来自第一个凸轮廓的分离轴；相切不算分离。", "Find a separating axis from the first convex outline; touching is not separated."),
        entry("ContainsTrianglePoint(triangle: Triangle2D, point: Point2D): boolean", "判断点是否位于三角形内部或边界。", "Test whether a point lies inside or on a triangle."),
        entry("SegmentDistanceSquared(point: Point2D, start: Point2D, end: Point2D): number", "计算点到有限线段的平方距离，支持零长度线段。", "Return squared distance to a finite segment, including zero-length segments."),
        entry("TriangleOverlapArea(candidate: Triangle2D, selection: Triangle2D): number", "计算两个三角形的交叠面积，支持两种绕向。", "Compute overlap area for two triangles regardless of winding."),
    ],
    links: [
        { label: "Bool", to: "/docs/utils/bool" },
        { label: "PointGeometry", to: "/docs/utils/point-geometry" },
        { label: "PlanarGeometry", to: "/docs/utils/planar-geometry" },
        { label: "CheckPrecision", to: "/docs/utils/precision" },
        { label: "Inner", to: "/docs/utils/inner" },
        { label: "Time", to: "/docs/utils/time" },
        { label: "UUID", to: "/docs/utils/uuid" },
    ],
};
