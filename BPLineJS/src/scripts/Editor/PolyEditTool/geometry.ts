import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { ContainsPolygonPoint, ProjectSegmentPoint } from "bpmatrixjs/Utils";
import type Camera from "../../Camera";
import Poly2D from "../../Geometry/Poly2D";
import Mesh from "../../Mesh";
import type Render from "../../Render";

/** 多边形组框的世界坐标范围。 */
interface PolyBounds {
    left: number;
    right: number;
    bottom: number;
    top: number;
    center: Vec2;
    width: number;
    height: number;
}

/**
 * 读取多边形的有序世界顶点。
 * @param mesh 多边形 Mesh
 * @param camera 可见尺寸补偿所用相机；省略时读取逻辑世界轮廓
 * @example
 * const points = WorldVertices(mesh);
 * @returns 按轮廓顺序排列的世界坐标
 */
const WorldVertices = (mesh: Mesh, camera?: Camera): Vec2[] => {
    const result: Vec2[] = [];
    const geometry = mesh.data;
    // 编辑语义只来自 Poly2D 的原始轮廓，不能从三角面反推顶点。
    if (geometry instanceof Poly2D) {
        const points = geometry.points;
        let matrix = mesh.ensureWorldMatrix().data;
        // 编辑轮廓应与屏幕中抵消 zoom 后的实体一致。
        if (camera !== undefined) {
            matrix = mesh.getRenderMatrix(camera).data;
        }
        // 按原始节点次序转换；首尾闭合由 geometry.closed 表达，不重复末点。
        for (let offset = 0; offset < points.length; offset += 2) {
            const x = points[offset];
            const y = points[offset + 1];
            result.push(new Vec2(
                matrix[0] * x + matrix[3] * y + matrix[6],
                matrix[1] * x + matrix[4] * y + matrix[7],
            ));
        }
    }
    return result;
};

/**
 * 读取多边形轮廓的屏幕坐标。
 * @param mesh 多边形 Mesh
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example
 * const points = ScreenVertices(mesh, camera, render);
 * @returns CSS 像素坐标
 */
const ScreenVertices = (mesh: Mesh, camera: Camera, render: Render): Vec2[] => {
    const result: Vec2[] = [];
    // 顶点拾取误差必须以屏幕像素计算，与缩放级别无关。
    for (const point of WorldVertices(mesh, camera)) {
        result.push(camera.worldToWindow(point, render));
    }
    return result;
};

/**
 * 合并一组多边形的世界包围盒。
 * @param meshes 待测 Mesh
 * @param camera 可见尺寸补偿所用相机；省略时汇总逻辑世界范围
 * @example
 * const bounds = BoundsOfMeshes(meshes);
 * @returns 非空包围盒或 null
 */
const BoundsOfMeshes = (meshes: readonly Mesh[], camera?: Camera): PolyBounds | null => {
    let left = Infinity;
    let right = -Infinity;
    let bottom = Infinity;
    let top = -Infinity;
    // 所有多边形使用实际轮廓坐标，旋转和父级变换都被计入。
    for (const mesh of meshes) {
        // 一件 Mesh 的每个原始节点都可能扩展总包围盒。
        for (const point of WorldVertices(mesh, camera)) {
            left = Math.min(left, point.x);
            right = Math.max(right, point.x);
            bottom = Math.min(bottom, point.y);
            top = Math.max(top, point.y);
        }
    }
    // 没有任何顶点时不能把无穷坐标交给辅助框。
    if (Number.isFinite(left)) {
        return {
            left,
            right,
            bottom,
            top,
            center: new Vec2((left + right) / 2, (bottom + top) / 2),
            width: right - left,
            height: top - bottom,
        };
    } else {
        return null;
    }
};

/**
 * 读取轮廓在 Mesh 局部坐标系中的包围盒，供随对象旋转的选中框使用。
 * @param mesh 多边形 Mesh
 * @example
 * const bounds = LocalBounds(mesh);
 * @returns 局部包围盒；轮廓为空时为 null
 */
const LocalBounds = (mesh: Mesh): PolyBounds | null => {
    const geometry = mesh.data;
    // 空轮廓无法定义选中框的中心或尺寸。
    if (geometry instanceof Poly2D && geometry.points.length >= 2) {
        let left = Infinity;
        let right = -Infinity;
        let bottom = Infinity;
        let top = -Infinity;
        // 按原始节点求范围，使旋转和父级变换只作用于最终辅助框。
        for (let offset = 0; offset < geometry.points.length; offset += 2) {
            const x = geometry.points[offset];
            const y = geometry.points[offset + 1];
            left = Math.min(left, x);
            right = Math.max(right, x);
            bottom = Math.min(bottom, y);
            top = Math.max(top, y);
        }
        return {
            left,
            right,
            bottom,
            top,
            center: new Vec2((left + right) / 2, (bottom + top) / 2),
            width: right - left,
            height: top - bottom,
        };
    } else {
        return null;
    }
};

/**
 * 求鼠标在边线上的最近点，用于从点击位置插入新节点。
 * @param point 鼠标窗口坐标
 * @param first 边线起点
 * @param second 边线终点
 * @example
 * const nearest = ProjectSegment(pointer, a, b);
 * @returns 有限线段上的窗口坐标
 */
const ProjectSegment = (point: Vec2, first: Vec2, second: Vec2): Vec2 => {
    return ProjectSegmentPoint(point, first, second);
};

/**
 * 按 Poly2D 填充使用的非零环绕规则命中自交单轮廓。
 * @param point 待测屏幕坐标
 * @param vertices 有序屏幕轮廓
 * @example
 * const inside = ContainsWindingPoint(pointer, vertices);
 * @returns 是否处于非零环绕填充区域
 */
const ContainsWindingPoint = (point: Vec2, vertices: readonly Vec2[]): boolean => {
    return ContainsPolygonPoint(point, vertices, "nonzero");
};

export {
    ContainsPoint,
    CreateGroupFrame,
    CreateSelectionFrame,
    IsCanvasPoint,
    SegmentDistance,
    ToLocal,
    ToParent,
    UpdateSelectionFrame,
} from "../NGonEditTool/geometry";
export { BoundsOfMeshes, ContainsWindingPoint, LocalBounds, ProjectSegment, ScreenVertices, WorldVertices };
export type { PolyBounds };
