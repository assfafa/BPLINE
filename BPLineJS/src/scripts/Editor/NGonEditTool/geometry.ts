import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { ContainsPolygonPoint, InverseTransformPoint2D, SegmentDistanceSquared } from "bpmatrixjs/Utils";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import NGon2D from "../../Geometry/NGon2D";
import Rect2D from "../../Geometry/Rect2D";
import BaseMaterial from "../../Material/baseMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import Style from "../../Style";

interface NGonBounds {
    left: number;
    right: number;
    bottom: number;
    top: number;
    center: Vec2;
    width: number;
    height: number;
}

interface GroupFrameScreenState {
    width: number;
    height: number;
    horizontalScale: number;
    verticalScale: number;
    horizontalNormalScale: number;
    verticalNormalScale: number;
}

const groupFrameScreenStates = new WeakMap<Mesh, GroupFrameScreenState>();

/**
 * 将世界点转换到指定矩阵的局部坐标系。
 * @param matrix 三乘三列主序矩阵
 * @param point 世界坐标
 * @example
 * const local = ToLocal(matrix, point);
 * @returns 局部点；矩阵不可逆时为 null
 */
const ToLocal = (matrix: ArrayLike<number>, point: Vec2): Vec2 | null => {
    return InverseTransformPoint2D(matrix, point);
};

/**
 * 把世界点写入 Mesh 父级的坐标系。
 * @param mesh 目标 Mesh
 * @param point 世界坐标
 * @example
 * const parentPoint = ToParent(mesh, point);
 * @returns 父级局部点；父级不可逆时为 null
 */
const ToParent = (mesh: Mesh, point: Vec2): Vec2 | null => {
    const parent = mesh.parent;
    // 场景根节点不改变坐标，嵌套组须消去父级变换。
    if (parent === null) {
        return point.clone();
    } else {
        return ToLocal(parent.ensureWorldMatrix().data, point);
    }
};

/**
 * 读取正多边形外圈或内圈的实际世界顶点。
 * @param mesh 正多边形 Mesh
 * @param inner 是否读取内圈
 * @param camera 可见尺寸补偿所用相机；省略时读取逻辑世界轮廓
 * @example
 * const corners = WorldVertices(mesh);
 * @returns 有序世界顶点
 */
const WorldVertices = (mesh: Mesh, inner: boolean = false, camera?: Camera): Vec2[] => {
    const geometry = mesh.data;
    const vertices: Vec2[] = [];
    // 其他形状不属于本编辑器，返回空顶点序列。
    if (geometry instanceof NGon2D) {
        let matrix = mesh.ensureWorldMatrix().data;
        // 编辑轮廓应与屏幕中抵消 zoom 后的实体一致。
        if (camera !== undefined) {
            matrix = mesh.getRenderMatrix(camera).data;
        }
        let radius = geometry.outer;
        // 内圈仅供孔洞命中判断，普通吸附只取外圈。
        if (inner) {
            radius = geometry.inner;
        }
        // 按当前边数和起始角逐个计算可见轮廓顶点。
        for (let index = 0; index < geometry.sides; index++) {
            const angle = geometry.startAngle + index * Math.PI * 2 / geometry.sides;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            vertices.push(new Vec2(
                matrix[0] * x + matrix[3] * y + matrix[6],
                matrix[1] * x + matrix[4] * y + matrix[7],
            ));
        }
    }
    return vertices;
};

/**
 * 把正多边形轮廓投影到窗口坐标。
 * @param mesh 正多边形 Mesh
 * @param camera 当前相机
 * @param render 当前渲染器
 * @param inner 是否读取内圈
 * @example
 * const points = ScreenVertices(mesh, camera, render);
 * @returns CSS 像素顶点序列
 */
const ScreenVertices = (mesh: Mesh, camera: Camera, render: Render, inner: boolean = false): Vec2[] => {
    const result: Vec2[] = [];
    // 投影只发生在编辑命中和预览时，不修改几何体本身。
    for (const world of WorldVertices(mesh, inner, camera)) {
        result.push(camera.worldToWindow(world, render));
    }
    return result;
};

/**
 * 计算窗口点到有限线段的距离。
 * @param point 窗口点
 * @param first 线段起点
 * @param second 线段终点
 * @example
 * const distance = SegmentDistance(point, a, b);
 * @returns CSS 像素距离
 */
const SegmentDistance = (point: Vec2, first: Vec2, second: Vec2): number => {
    return Math.sqrt(SegmentDistanceSquared(point, first, second));
};

/**
 * 用半开射线判定点是否位于闭合轮廓内部。
 * @param point 待测窗口点
 * @param vertices 闭合轮廓顶点
 * @example
 * const inside = ContainsPoint(point, vertices);
 * @returns 是否位于轮廓内部
 */
const ContainsPoint = (point: Vec2, vertices: readonly Vec2[]): boolean => {
    return ContainsPolygonPoint(point, vertices, "evenodd");
};

/**
 * 合并一组正多边形的世界顶点包围盒。
 * @param meshes 候选 Mesh
 * @param camera 可见尺寸补偿所用相机；省略时汇总逻辑世界范围
 * @example
 * const bounds = BoundsOfMeshes(meshes);
 * @returns 世界包围盒；空集合为 null
 */
const BoundsOfMeshes = (meshes: readonly Mesh[], camera?: Camera): NGonBounds | null => {
    let left = Infinity;
    let right = -Infinity;
    let bottom = Infinity;
    let top = -Infinity;
    // 真实顶点比未旋转的局部半径盒更贴合当前组边界。
    for (const mesh of meshes) {
        // 每个外圈顶点都可能扩展世界包围盒。
        for (const point of WorldVertices(mesh, false, camera)) {
            left = Math.min(left, point.x);
            right = Math.max(right, point.x);
            bottom = Math.min(bottom, point.y);
            top = Math.max(top, point.y);
        }
    }
    // 至少有一个轮廓顶点时才能返回有限包围盒。
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
 * 创建不参与拾取的半透明矩形框，用于拉框预览。
 * @example
 * const frame = CreateSelectionFrame();
 * @returns 独立的辅助 Mesh
 */
const CreateSelectionFrame = (): Mesh => {
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#73d8ff");
    style.solid.opacity = 0.12;
    style.edge.enabled = true;
    style.edge.width = 2;
    style.edge.color.setHex("#73d8ff");
    const material = new BaseMaterial(style);
    material.transparent = true;
    // 屏幕 Y 轴与世界 Y 轴相反，选框矩阵可能翻转三角形朝向。
    material.cullMode = "none";
    const frame = new Mesh(new Rect2D({ width: 0, height: 0, style }), material, style);
    frame.noSelect = true;
    frame.order = 1000001;
    return frame;
};

/**
 * 按浏览器窗口的两角更新选框，不受相机旋转影响。
 * @param frame 选框 Mesh
 * @param first 起点窗口坐标
 * @param second 终点窗口坐标
 * @param camera 当前相机
 * @param render 当前渲染器
 * @param centered 是否以按下点为中心向四周展开
 * @example
 * UpdateSelectionFrame(frame, start, end, camera, render);
 * @returns 无返回值
 */
const UpdateSelectionFrame = (
    frame: Mesh,
    first: Vec2,
    second: Vec2,
    camera: Camera,
    render: Render,
    centered: boolean = false,
): void => {
    const geometry = frame.data;
    // 只有本编辑器创建的矩形辅助框参与更新。
    if (geometry instanceof Rect2D) {
        let center = new Vec2((first.x + second.x) / 2, (first.y + second.y) / 2);
        let width = Math.abs(second.x - first.x);
        let height = Math.abs(second.y - first.y);
        // Shift 画框时，按下点为中心，鼠标距离代表半宽和半高。
        if (centered) {
            center = first.clone();
            width *= 2;
            height *= 2;
        }
        const origin = camera.windowToWorld(center, render);
        const right = camera.windowToWorld(new Vec2(center.x + 1, center.y), render);
        const up = camera.windowToWorld(new Vec2(center.x, center.y + 1), render);
        geometry.width = width;
        geometry.height = height;
        frame.position.set(origin.x, origin.y);
        frame.matrix.set([
            right.x - origin.x, right.y - origin.y, 0,
            up.x - origin.x, up.y - origin.y, 0,
            origin.x, origin.y, 1,
        ]);
    }
};

/**
 * 创建世界空间的黄色虚线组框。
 * @param bounds 初始包围盒
 * @example
 * const frame = CreateGroupFrame(bounds);
 * @returns 非拾取辅助 Mesh
 */
const CreateGroupFrame = (bounds: NGonBounds): Mesh => {
    const width = Math.max(bounds.width, 1);
    const height = Math.max(bounds.height, 1);
    const corners = [
        new Vec2(-width / 2, -height / 2),
        new Vec2(width / 2, -height / 2),
        new Vec2(width / 2, height / 2),
        new Vec2(-width / 2, height / 2),
    ];
    const vertices: number[] = [];
    // 每条边分割为短矩形，组变换只更新外层 Mesh 矩阵。
    for (let edge = 0; edge < corners.length; edge++) {
        const first = corners[edge];
        const second = corners[(edge + 1) % corners.length];
        const length = Math.hypot(second.x - first.x, second.y - first.y);
        const dx = (second.x - first.x) / length;
        const dy = (second.y - first.y) / length;
        const normalX = -dy;
        const normalY = dx;
        // 初始几何只供创建时占位，后续由屏幕比例重建虚线。
        for (let offset = 0; offset < length; offset += 20) {
            const end = Math.min(length, offset + 12);
            const ax = first.x + dx * offset;
            const ay = first.y + dy * offset;
            const bx = first.x + dx * end;
            const by = first.y + dy * end;
            vertices.push(
                ax + normalX, ay + normalY, bx + normalX, by + normalY, bx - normalX, by - normalY,
                ax + normalX, ay + normalY, bx - normalX, by - normalY, ax - normalX, ay - normalY,
            );
        }
    }
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#ffe66a");
    const material = new BaseMaterial(style);
    // 组框跨过固定边时矩阵行列式会变号，虚线仍需从两面可见。
    material.cullMode = "none";
    const frame = new Mesh(new Base2D({ vertices: new Float32Array(vertices), contours: [], style }), material, style);
    frame.position.set(bounds.center.x, bounds.center.y);
    frame.noSelect = true;
    frame.order = 1000000;
    return frame;
};

/**
 * 按当前组矩阵与相机投影重建虚线，使横纵线宽和虚线长度保持屏幕像素大小。
 * @param frame 需要更新的虚线 Mesh
 * @param width 局部范围宽度
 * @param height 局部范围高度
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example UpdateGroupFrameScreen(frame, 100, 80, camera, render);
 * @returns 无返回值。
 */
const UpdateGroupFrameScreen = (frame: Mesh, width: number, height: number,
    camera: Camera, render: Render): void => {
    const geometry = frame.data;
    // 组框使用直接三角面，普通对象的几何不能被辅助样式改写。
    if (geometry instanceof Base2D) {
        const matrix = frame.getRenderMatrix(camera).data;
        const origin = camera.worldToWindow(new Vec2(matrix[6], matrix[7]), render);
        const horizontal = camera.worldToWindow(new Vec2(matrix[6] + matrix[0], matrix[7] + matrix[1]), render);
        const vertical = camera.worldToWindow(new Vec2(matrix[6] + matrix[3], matrix[7] + matrix[4]), render);
        const horizontalX = horizontal.x - origin.x;
        const horizontalY = horizontal.y - origin.y;
        const verticalX = vertical.x - origin.x;
        const verticalY = vertical.y - origin.y;
        const horizontalScale = Math.hypot(horizontalX, horizontalY);
        const verticalScale = Math.hypot(verticalX, verticalY);
        const areaScale = Math.abs(horizontalX * verticalY - horizontalY * verticalX);
        // 奇异或不可见的组矩阵不能可靠换算像素线宽。
        if (Number.isFinite(areaScale) && areaScale > Number.EPSILON &&
            horizontalScale > Number.EPSILON && verticalScale > Number.EPSILON) {
            const state: GroupFrameScreenState = {
                width,
                height,
                horizontalScale,
                verticalScale,
                horizontalNormalScale: areaScale / horizontalScale,
                verticalNormalScale: areaScale / verticalScale,
            };
            const previous = groupFrameScreenStates.get(frame);
            const changed = previous?.width !== state.width || previous.height !== state.height ||
                previous.horizontalScale !== state.horizontalScale || previous.verticalScale !== state.verticalScale ||
                previous.horizontalNormalScale !== state.horizontalNormalScale ||
                previous.verticalNormalScale !== state.verticalNormalScale;
            // 平移不会改变局部线段尺寸；仅在投影比例或范围变化时重建三角面。
            if (changed) {
                const vertices: number[] = [];
                const corners = [
                    new Vec2(-width / 2, -height / 2), new Vec2(width / 2, -height / 2),
                    new Vec2(width / 2, height / 2), new Vec2(-width / 2, height / 2),
                ];
                // 两组边分别用沿线比例和垂直比例换算，避免非等比缩放把竖线拉粗。
                for (let edge = 0; edge < corners.length; edge++) {
                    const first = corners[edge];
                    const second = corners[(edge + 1) % corners.length];
                    const length = Math.hypot(second.x - first.x, second.y - first.y);
                    const dx = (second.x - first.x) / Math.max(length, Number.EPSILON);
                    const dy = (second.y - first.y) / Math.max(length, Number.EPSILON);
                    let alongScale = state.horizontalScale;
                    let normalScale = state.horizontalNormalScale;
                    // 竖边按纵轴投影测算，不沿用横边的像素尺度。
                    if (edge % 2 === 1) {
                        alongScale = state.verticalScale;
                        normalScale = state.verticalNormalScale;
                    }
                    const pixelLength = length * alongScale;
                    const periodPixels = Math.max(20, pixelLength / 4096);
                    const period = periodPixels / alongScale;
                    const dash = period * 0.6;
                    const halfThickness = 1 / normalScale;
                    const normalX = -dy * halfThickness;
                    const normalY = dx * halfThickness;
                    // 极长的离屏边最多约 4096 段，普通可见范围仍为 12/8 像素虚线。
                    for (let offset = 0; offset < length; offset += period) {
                        const end = Math.min(length, offset + dash);
                        const ax = first.x + dx * offset;
                        const ay = first.y + dy * offset;
                        const bx = first.x + dx * end;
                        const by = first.y + dy * end;
                        vertices.push(
                            ax + normalX, ay + normalY, bx + normalX, by + normalY, bx - normalX, by - normalY,
                            ax + normalX, ay + normalY, bx - normalX, by - normalY, ax - normalX, ay - normalY,
                        );
                    }
                }
                // 虚线片段不是可编辑轮廓，无需从大量小矩形反推边界环。
                geometry.setData({ vertices: new Float32Array(vertices), contours: [], style: geometry.style });
                groupFrameScreenStates.set(frame, state);
            }
        }
    }
};

/**
 * 把窗口点限制到画布范围，避免在页面其他控件上创建模型。
 * @param client 浏览器窗口点
 * @param render 当前渲染器
 * @example
 * const inside = IsCanvasPoint(client, render);
 * @returns 是否落在画布内
 */
const IsCanvasPoint = (client: Vec2, render: Render): boolean => {
    const bounds = render.canvas.getBoundingClientRect();
    return client.x >= bounds.left && client.x <= bounds.right && client.y >= bounds.top && client.y <= bounds.bottom;
};

export {
    BoundsOfMeshes,
    ContainsPoint,
    CreateGroupFrame, CreateSelectionFrame,
    IsCanvasPoint,
    ScreenVertices,
    SegmentDistance,
    ToLocal,
    ToParent, UpdateGroupFrameScreen, UpdateSelectionFrame,
    WorldVertices,
};
export type { NGonBounds };
