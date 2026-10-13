import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { ContainsPolygonPoint, InverseTransformPoint2D, SegmentDistanceSquared } from "bpmatrixjs/Utils";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import Rect2D from "../../Geometry/Rect2D";
import type { Material2d } from "../../global-types";
import BaseMaterial from "../../Material/baseMaterial";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import { CreateRectFootprint } from "../../Select/RectSelectTool/RectSelectGeometry";
import Style from "../../Style";
import type { AffineTransform, DrawFrame, MatrixValues, RankedMesh, RectBounds } from "./types";

/**
 * 将世界点投到变换矩阵的局部平面，奇异矩阵不能用于编辑。
 * @param matrix 三乘三列主序矩阵数据
 * @param point 世界坐标
 * @example
 * const local = ToLocal(matrix, point);
 * @returns 局部坐标，矩阵不可逆时为 null。
 */
const ToLocal = (matrix: ArrayLike<number>, point: Vec2): Vec2 | null => {
    return InverseTransformPoint2D(matrix, point);
};

/**
 * 把世界点转换到 Mesh 父节点的坐标系。
 * @param mesh 当前网格
 * @param point 世界坐标
 * @example
 * const parentPoint = ToParent(mesh, point);
 * @returns 父节点坐标，父级不可逆时为 null。
 */
const ToParent = (mesh: Mesh, point: Vec2): Vec2 | null => {
    const parent = mesh.parent;
    // 根节点直接使用世界坐标；有父节点时需要消去父级变换。
    if (parent === null) {
        return point.clone();
    } else {
        return ToLocal(parent.ensureWorldMatrix().data, point);
    }
};

/**
 * 按深度层和场景绘制次序排列命中候选，上层优先。
 * @param first 第一个候选
 * @param second 第二个候选
 * @example
 * candidates.sort(CompareRankedMeshes);
 * @returns 用于 Array.sort 的比较值。
 */
const CompareRankedMeshes = (first: RankedMesh, second: RankedMesh): number => {
    return second.layer - first.layer || second.rank - first.rank;
};

/**
 * 求鼠标与屏幕线段的最近距离。
 * @param point 鼠标浏览器坐标
 * @param first 线段起点
 * @param second 线段终点
 * @example
 * const distance = SegmentDistance(point, first, second);
 * @returns CSS 像素距离。
 */
const SegmentDistance = (point: Vec2, first: Vec2, second: Vec2): number => {
    return Math.sqrt(SegmentDistanceSquared(point, first, second));
};

/**
 * 对一个世界点应用组手势的二维仿射变换。
 * @param transform 组手势的世界仿射变换
 * @param point 原世界坐标
 * @example
 * const moved = TransformPoint(transform, point);
 * @returns 变换后的世界坐标。
 */
const TransformPoint = (transform: AffineTransform, point: Vec2): Vec2 => {
    return new Vec2(
        transform.xx * point.x + transform.xy * point.y + transform.x,
        transform.yx * point.x + transform.yy * point.y + transform.y,
    );
};

/**
 * 将组仿射变换作用在按下时的 Mesh 世界矩阵上。
 * @param transform 组手势的世界仿射变换
 * @param matrix 按下时的世界矩阵
 * @example
 * const nextWorld = TransformWorldMatrix(transform, snapshot.worldMatrix);
 * @returns 新的列主序世界矩阵。
 */
const TransformWorldMatrix = (transform: AffineTransform, matrix: ArrayLike<number>): MatrixValues => {
    return [
        transform.basisXX * matrix[0] + transform.basisXY * matrix[1],
        transform.basisYX * matrix[0] + transform.basisYY * matrix[1],
        0,
        transform.basisXX * matrix[3] + transform.basisXY * matrix[4],
        transform.basisYX * matrix[3] + transform.basisYY * matrix[4],
        0,
        transform.xx * matrix[6] + transform.xy * matrix[7] + transform.x,
        transform.yx * matrix[6] + transform.yy * matrix[7] + transform.y,
        1,
    ];
};

/**
 * 把期望的世界矩阵转换回对象父节点的局部矩阵。
 * @param mesh 接收矩阵的对象
 * @param worldMatrix 目标世界矩阵
 * @example
 * const local = WorldToLocalMatrix(mesh, nextWorld);
 * @returns 父级可逆时的局部矩阵，否则为 null。
 */
const WorldToLocalMatrix = (mesh: Mesh, worldMatrix: ArrayLike<number>): MatrixValues | null => {
    const center = ToParent(mesh, new Vec2(worldMatrix[6], worldMatrix[7]));
    const right = ToParent(mesh, new Vec2(worldMatrix[6] + worldMatrix[0], worldMatrix[7] + worldMatrix[1]));
    const up = ToParent(mesh, new Vec2(worldMatrix[6] + worldMatrix[3], worldMatrix[7] + worldMatrix[4]));
    // 任一父级投影无效时，整组保持按下前状态。
    if (center !== null && right !== null && up !== null) {
        return [right.x - center.x, right.y - center.y, 0,
            up.x - center.x, up.y - center.y, 0,
            center.x, center.y, 1];
    } else {
        return null;
    }
};

/**
 * 汇总选中矩形当前的世界轴向范围。
 * @param meshes 需要合并的矩形网格
 * @param camera 可见尺寸补偿所用相机；省略时汇总逻辑世界范围
 * @example
 * const bounds = MeshBounds(meshes);
 * @returns 有效矩形的并集范围；没有有效矩形时为 null。
 */
const MeshBounds = (meshes: readonly Mesh[], camera?: Camera): RectBounds | null => {
    let bounds: RectBounds | null = null;
    // 组操作使用实际世界角点，而不是未考虑旋转的 position 和 width。
    for (const mesh of meshes) {
        let matrix = mesh.ensureWorldMatrix();
        // 集合边界必须包含固定尺寸矩形的实际可见四角。
        if (camera !== undefined) {
            matrix = mesh.getRenderMatrix(camera);
        }
        const footprint = CreateRectFootprint(mesh, matrix);
        // 退化或不可见的矩形不参与选中集合的世界范围。
        if (footprint !== undefined) {
            // 旋转后的四角都可能成为范围的极值。
            for (const corner of footprint.corners) {
                // 首个角点建立范围，其余角点再扩展四个方向。
                if (bounds === null) {
                    bounds = { left: corner.x, right: corner.x, bottom: corner.y, top: corner.y };
                } else {
                    bounds.left = Math.min(bounds.left, corner.x);
                    bounds.right = Math.max(bounds.right, corner.x);
                    bounds.bottom = Math.min(bounds.bottom, corner.y);
                    bounds.top = Math.max(bounds.top, corner.y);
                }
            }
        }
    }
    return bounds;
};

/**
 * 复制材质配置，让选中样式不会改变共用材质的其他 Mesh。
 * @param source 当前材质
 * @example
 * const copy = CopyMaterial(material);
 * @returns 同类型的独立材质。
 */
const CopyMaterial = (source: Material2d): Material2d => {
    return CloneMaterial(source, source.style);
};

/**
 * 判断世界点是否落入可旋转的组框内。
 * @param points 依次排列的组框角点
 * @param point 当前世界点
 * @example
 * const inside = ContainsFrame(frame, pointer);
 * @returns 点是否位于组框内。
 */
const ContainsFrame = (points: readonly Vec2[], point: Vec2): boolean => {
    return ContainsPolygonPoint(point, points, "evenodd");
};

/**
 * 用一份可独立变换的三角面 Mesh 显示组虚线框。
 * @param drawFrame 当前选中对象的屏幕包围框换算结果
 * @example
 * const frame = CreateGroupFrame(drawFrame);
 * @returns 不参与拾取的虚线边框 Mesh。
 */
const CreateGroupFrame = (drawFrame: DrawFrame): Mesh => {
    const width = drawFrame.width;
    const height = drawFrame.height;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;
    const corners = [
        new Vec2(-halfWidth, -halfHeight),
        new Vec2(halfWidth, -halfHeight),
        new Vec2(halfWidth, halfHeight),
        new Vec2(-halfWidth, halfHeight),
    ];
    const vertices: number[] = [];
    const dashLength = 12;
    const gapLength = 8;
    const thickness = 2;
    // 每条边拆成独立短矩形，组旋转和缩放只更新 Mesh 矩阵。
    for (let edge = 0; edge < corners.length; edge++) {
        const start = corners[edge];
        const end = corners[(edge + 1) % corners.length];
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        // 零尺寸边不会形成可见的三角面。
        if (length > 0) {
            const dx = (end.x - start.x) / length;
            const dy = (end.y - start.y) / length;
            const normalX = -dy * thickness * 0.5;
            const normalY = dx * thickness * 0.5;
            // 一个短矩形由两个三角形组成，间隙不进入几何缓冲。
            for (let offset = 0; offset < length; offset += dashLength + gapLength) {
                const endOffset = Math.min(length, offset + dashLength);
                const firstX = start.x + dx * offset;
                const firstY = start.y + dy * offset;
                const secondX = start.x + dx * endOffset;
                const secondY = start.y + dy * endOffset;
                vertices.push(
                    firstX + normalX, firstY + normalY,
                    secondX + normalX, secondY + normalY,
                    secondX - normalX, secondY - normalY,
                    firstX + normalX, firstY + normalY,
                    secondX - normalX, secondY - normalY,
                    firstX - normalX, firstY - normalY,
                );
            }
        }
    }
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#ffe66a");
    const frame = new Mesh(new Base2D({ vertices: new Float32Array(vertices), style }), new BaseMaterial(style), style);
    frame.noSelect = true;
    frame.order = 1000000;
    return frame;
};

/**
 * 创建由框组管理的画框预览 Mesh。
 * @example
 * const preview = CreatePreviewFrame();
 * @returns 无法被选择器拾取的预览 Mesh。
 */
const CreatePreviewFrame = (): Mesh => {
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#73d8ff");
    style.solid.opacity = 0.12;
    style.edge.enabled = true;
    style.edge.width = 2;
    style.edge.color.setHex("#73d8ff");
    const material = new BaseMaterial(style);
    material.transparent = true;
    const frame = new Mesh(new Rect2D({ width: 0, height: 0, radius: 0, style }), material, style);
    frame.noSelect = true;
    frame.order = 1000001;
    return frame;
};

export { CompareRankedMeshes, ContainsFrame, CopyMaterial, CreateGroupFrame, CreatePreviewFrame, MeshBounds, SegmentDistance, ToLocal, ToParent, TransformPoint, TransformWorldMatrix, WorldToLocalMatrix };
