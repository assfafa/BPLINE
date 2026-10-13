import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "PlanarGeometry",
    intro: { cn: "公共三角面求交与二维线段距离函数，供选择器和吸附复用。", en: "Shared triangle intersection and segment-distance functions reused by selection and snapping." },
    code: "import { SegmentDistanceSquared } from \"bpmatrixjs/Utils\";\nconst distanceSquared = SegmentDistanceSquared({ x: 2, y: 3 }, { x: 0, y: 0 }, { x: 4, y: 0 });",
    properties: [

    ],
    methods: [
        entry("SignedDoubleArea(points: readonly Point2D[]): number", "有符号两倍多边形面积，少于三个点返回 0。", "Signed double polygon area; fewer than three points yield zero."),
        entry("SegmentDistanceSquared(point, start, end): number", "点到有限线段的距离平方。", "Squared distance from a point to a finite segment."),
        entry("ContainsTrianglePoint(triangle, point): boolean", "三角形内或边界包含判断。", "Containment inside or on a triangle."),
        entry("HasSeparatingAxis(first, second): boolean", "检查第一凸轮廓的分离轴；完整 SAT 需交换参数再调用一次。", "Check separating axes from the first convex contour; swap arguments and call again for complete SAT."),
        entry("TriangleOverlapArea(first, second): number", "两三角形重叠面积。", "Overlap area of two triangles."),
    ],
};
