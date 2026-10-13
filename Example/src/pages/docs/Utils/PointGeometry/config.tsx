import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "PointGeometry",
    intro: { cn: "通用二维双精度坐标转换、最近点投影和单轮廓点包含判定，不依赖渲染器。", en: "Shared double-precision affine transforms, segment projection and single-contour point containment, independent of the renderer." },
    code: "import { ProjectSegmentPoint } from \"bpmatrixjs/Utils\";\nconst nearest = ProjectSegmentPoint({ x: 4, y: 6 }, { x: 0, y: 0 }, { x: 10, y: 0 });",
    properties: [

    ],
    methods: [
        entry("TransformPoint2D(matrix: ArrayLike<number>, point: Point2D): Vec2", "列主序 Mat3 仿射变换。", "Column-major Mat3 affine transform."),
        entry("InverseTransformPoint2D(matrix, point): Vec2 | null", "求局部坐标，矩阵退化或数据非有限时返回 null。", "Recover local coordinates; return null for singular matrices or non-finite values."),
        entry("ProjectSegmentPoint(point, start, end, epsilon = Number.EPSILON): Vec2", "最近线段点；epsilon 为平方长度退化阈值，退化时返回起点副本。", "Nearest segment point; epsilon is the squared-length degeneracy threshold. Degenerate segments return a copy of start."),
        entry("ContainsPolygonPoint(point, vertices, rule = \"nonzero\"): boolean", "nonzero/evenodd 点包含规则；半开射线，不扩大边界容差。规则只用于点判定，不表示 Poly 填充支持 evenodd。", "nonzero/evenodd point containment using a half-open ray without boundary expansion. The point rule does not imply Poly fill supports evenodd."),
    ],
};
