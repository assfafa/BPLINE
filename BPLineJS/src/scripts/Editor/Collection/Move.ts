import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import { ToParent } from "../NGonEditTool/geometry";
import type { SnapGeometry, SnapOptions } from "../Snap";
import { CollectSnapGeometry, NearbySnapPoints, ReadSnapOutline } from "../Snap";

/** 普通编辑模式的多选平移；不创建组框，也不修改几何类型。 */
class CollectionMove {
    private readonly _scene: Scene;
    private readonly _render: Render;
    private readonly _camera: Camera;
    private readonly _onMove: (meshes: Mesh[]) => void;
    private _gesture: MoveGesture | null = null;

    /**
     * 建立跨几何类型的平移入口。
     * @param scene 吸附目标所在场景
     * @param render 屏幕坐标换算使用的渲染器
     * @param camera 当前相机
     * @param onMove 位置实际变化后的通知
     * @example const move = new CollectionMove(scene, render, camera, notifyMove);
     * @returns 集合平移控制器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera, onMove: (meshes: Mesh[]) => void) {
        this._scene = scene;
        this._render = render;
        this._camera = camera;
        this._onMove = onMove;
    }

    /** @example const roots = move.meshes; @returns 当前手势直接移动的根成员，子成员随父级移动。 */
    public get meshes(): Mesh[] {
        const meshes: Mesh[] = [];
        // 同时选中父子对象时，层级放置也只操作根成员。
        if (this._gesture !== null) {
            // 快照顺序与原选择顺序一致，不改变层级排序。
            for (const snapshot of this._gesture.snapshots) {
                meshes.push(snapshot.mesh);
            }
        }
        return meshes;
    }

    /**
     * 冻结整批选择的位置和实际显示轮廓，单击仍交给形状工具处理。
     * @param event 按下事件
     * @param meshes 完整选择集
     * @param anchor 鼠标命中的对象，步进以其世界原点为准
     * @param options 所属工具的实时交互配置
     * @example move.begin(event, editor.actives, pickedMesh, rectTool);
     * @returns 无返回值。
     */
    public begin(event: PointerEvent, meshes: readonly Mesh[], anchor: Mesh, options: MoveOptions): void {
        const selected = new Set(meshes);
        const snapshots: MoveSnapshot[] = [];
        const sources: MoveSource[] = [];
        const bounds = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
        // 所有成员贡献吸附源；只有没有选中祖先的成员直接修改局部位置。
        for (const mesh of meshes) {
            const outline = MoveVertices(mesh, this._camera);
            const vertices = outline.vertices;
            // 包围盒采用显示坐标，ignoreZoom 对象也遵循同一活动范围。
            for (const point of vertices) {
                sources.push({ point, allowVertices: outline.allowVertices });
                bounds.left = Math.min(bounds.left, point.x);
                bounds.right = Math.max(bounds.right, point.x);
                bounds.bottom = Math.min(bounds.bottom, point.y);
                bounds.top = Math.max(bounds.top, point.y);
            }
            // 只改根节点，避免父级位移再叠加到选中的子节点上。
            if (HasSelectedAncestor(mesh, selected) === false) {
                const world = mesh.ensureWorldMatrix().data;
                snapshots.push({ mesh, world: new Vec2(world[6], world[7]), local: [...mesh.ensureMatrix().data] });
            }
        }
        const excluded = new Set(meshes);
        // 未选中的子节点同样会随父级移动，不能成为本轮固定吸附目标。
        for (const candidate of this._scene.ensureLists()) {
            // 场景列表中的辅助节点也按祖先关系排除，避免吸回自己的旧位置。
            if (candidate instanceof Mesh && HasSelectedAncestor(candidate, selected)) {
                excluded.add(candidate);
            }
        }
        const startClient = new Vec2(event.clientX, event.clientY);
        const anchorWorld = anchor.ensureWorldMatrix().data;
        // 不可计算边界的选择集保持子工具原有处理。
        if (snapshots.length > 0 && Number.isFinite(bounds.left)) {
            this._gesture = {
                pointerId: event.pointerId,
                startClient,
                startWorld: this._camera.windowToWorld(startClient, this._render),
                anchor: new Vec2(anchorWorld[6], anchorWorld[7]),
                snapshots,
                selected: [...meshes],
                sources,
                targets: CollectSnapGeometry(this._scene, excluded, this._camera),
                bounds,
                options,
                axis: null,
            };
        } else {
            this._gesture = null;
        }
    }

    /**
     * 超过点击容差才接管，保留文字二次点击输入等原有点击行为。
     * @param event 当前移动或松开事件
     * @example const dragging = move.accepts(event);
     * @returns 是否属于本轮且已达到拖动距离。
     */
    public accepts(event: PointerEvent): boolean {
        const gesture = this._gesture;
        // 另一根手指或未越过容差的点击不能接管原工具。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            return Math.hypot(event.clientX - gesture.startClient.x, event.clientY - gesture.startClient.y) >= 3;
        } else {
            return false;
        }
    }

    /**
     * 将同一个世界位移应用到整批选择，保留原局部矩阵的线性部分。
     * @param event 当前指针位置
     * @example move.pointerMove(event);
     * @returns 无返回值。
     */
    public pointerMove(event: PointerEvent): void {
        const gesture = this._gesture;
        // 接管后的手势仍只接受最初的指针。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            const options = gesture.options;
            const delta = this.resolveDelta(gesture, new Vec2(event.clientX, event.clientY));
            const placements: { snapshot: MoveSnapshot; point: Vec2 }[] = [];
            let valid = true;
            // 先验证所有父矩阵可逆，再一次写入，避免部分对象移动。
            for (const snapshot of gesture.snapshots) {
                const point = ToParent(snapshot.mesh, new Vec2(snapshot.world.x + delta.x, snapshot.world.y + delta.y));
                // 一个不可逆父级不能让整批对象拆开移动。
                if (point !== null) {
                    placements.push({ snapshot, point });
                } else {
                    valid = false;
                }
            }
            const bounds = gesture.bounds;
            const fits = options.left - bounds.left <= options.right - bounds.right &&
                options.bottom - bounds.bottom <= options.top - bounds.top;
            // 活动范围能容纳整批对象时才执行这一帧。
            if (valid && fits) {
                let changed = false;
                // 子成员继承父级位移，其局部变换始终保留。
                for (const placement of placements) {
                    const { snapshot, point } = placement;
                    const mesh = snapshot.mesh;
                    const current = mesh.ensureMatrix().data;
                    // 相同位置不再发出重复编辑回调。
                    if (current[6] !== point.x || current[7] !== point.y) {
                        mesh.position.set(point.x, point.y);
                        mesh.matrix.set([
                            snapshot.local[0], snapshot.local[1], 0,
                            snapshot.local[3], snapshot.local[4], 0,
                            point.x, point.y, 1,
                        ]);
                        changed = true;
                    }
                }
                // 所有选中成员先完成变换，再通知各类型工具更新数据和辅助框。
                if (changed) {
                    this._onMove([...gesture.selected]);
                }
            }
        }
    }

    /** @example move.cancel(); @returns 无返回值，释放本轮快照。 */
    public cancel(): void {
        this._gesture = null;
    }

    /**
     * 按屏幕轴、世界步进和最近吸附目标计算本轮共同位移。
     * @param gesture 起笔快照
     * @param client 当前屏幕坐标
     * @example const delta = this.resolveDelta(gesture, client);
     * @returns 已处理约束与活动范围的世界位移。
     */
    private resolveDelta(gesture: MoveGesture, client: Vec2): Vec2 {
        const options = gesture.options;
        let current = client;
        let direction: Vec2 | null = null;
        // 轴锁定取第一次有效移动方向，相机旋转时也遵循屏幕横纵轴。
        if (options.constrain) {
            // 本轮首次开启约束时确定轴，释放 Shift 后可重新确定。
            if (gesture.axis === null) {
                const dx = Math.abs(client.x - gesture.startClient.x);
                const dy = Math.abs(client.y - gesture.startClient.y);
                // 同距离时与矩形工具一致，优先水平。
                if (dx >= dy) {
                    gesture.axis = "x";
                } else {
                    gesture.axis = "y";
                }
            }
            let axisClient = new Vec2(gesture.startClient.x + 1, gesture.startClient.y);
            // 锁定屏幕纵轴时用一个 CSS 像素求对应世界方向。
            if (gesture.axis === "x") {
                current = new Vec2(client.x, gesture.startClient.y);
            } else {
                current = new Vec2(gesture.startClient.x, client.y);
                axisClient = new Vec2(gesture.startClient.x, gesture.startClient.y + 1);
            }
            const axisWorld = this._camera.windowToWorld(axisClient, this._render);
            const dx = axisWorld.x - gesture.startWorld.x;
            const dy = axisWorld.y - gesture.startWorld.y;
            const length = Math.hypot(dx, dy);
            // 有效投影才参与步进和吸附方向限制。
            if (length > Number.EPSILON) {
                direction = new Vec2(dx / length, dy / length);
            }
        } else {
            gesture.axis = null;
        }
        const world = this._camera.windowToWorld(current, this._render);
        const raw = new Vec2(world.x - gesture.startWorld.x, world.y - gesture.startWorld.y);
        let requested = raw.clone();
        let bestDistance = Infinity;
        const anchor = gesture.anchor;
        const step = options.translationStep;
        // 多选统一以鼠标命中对象的原点对齐全局步进格。
        if (options.translationStepEnabled && Number.isFinite(step) && step > 0) {
            // 锁轴步进沿屏幕轴的世界方向投影，避免额外的侧向移动。
            if (direction !== null) {
                const projection = anchor.x * direction.x + anchor.y * direction.y;
                const proposed = projection + raw.x * direction.x + raw.y * direction.y;
                const distance = Math.round(proposed / step) * step - projection;
                requested = new Vec2(direction.x * distance, direction.y * distance);
            } else {
                requested = new Vec2(Math.round((anchor.x + raw.x) / step) * step - anchor.x,
                    Math.round((anchor.y + raw.y) / step) * step - anchor.y);
            }
            requested = ClampDelta(requested, gesture.bounds, options);
            bestDistance = ScreenDistance(new Vec2(anchor.x + raw.x, anchor.y + raw.y),
                new Vec2(anchor.x + requested.x, anchor.y + requested.y), this._camera, this._render);
        }
        // 任意成员轮廓吸附成功，整批对象使用同一修正量。
        if (options.snap && options.radius >= 0) {
            // 源点来自按下快照，不能吸到已经被平移的自己的旧轮廓。
            for (const source of gesture.sources) {
                const point = source.point;
                const proposed = new Vec2(point.x + raw.x, point.y + raw.y);
                const snapOptions = { ...options.snapOptions,
                    vertex: options.snapOptions.vertex && source.allowVertices };
                const targets = NearbySnapPoints(proposed, gesture.targets, snapOptions,
                    options.radius, this._camera, this._render);
                // 步进与四类吸附以相同屏幕距离比较。
                for (const target of targets) {
                    const distance = ScreenDistance(proposed, target, this._camera, this._render);
                    let candidate = new Vec2(target.x - point.x, target.y - point.y);
                    // 锁轴只接受能在该轴上精确对齐的候选。
                    if (direction !== null) {
                        const projection = candidate.x * direction.x + candidate.y * direction.y;
                        candidate = new Vec2(direction.x * projection, direction.y * projection);
                    }
                    const aligned = new Vec2(point.x + candidate.x, point.y + candidate.y);
                    const alignmentError = ScreenDistance(aligned, target, this._camera, this._render);
                    const bounded = ClampDelta(candidate, gesture.bounds, options);
                    const withinBounds = bounded.x === candidate.x && bounded.y === candidate.y;
                    // 超出活动范围或偏离锁定轴的目标不改变选择集位移。
                    if (distance <= options.radius && distance < bestDistance && alignmentError <= 0.001 && withinBounds) {
                        requested = candidate;
                        bestDistance = distance;
                    }
                }
            }
        }
        return ClampDelta(requested, gesture.bounds, options);
    }
}

/** 集合平移沿用被拖动对象所属工具的交互配置。 */
interface MoveOptions {
    constrain: boolean;
    translationStep: number;
    translationStepEnabled: boolean;
    snap: boolean;
    snapOptions: SnapOptions;
    radius: number;
    left: number;
    right: number;
    bottom: number;
    top: number;
}

interface MoveSnapshot {
    mesh: Mesh;
    world: Vec2;
    local: number[];
}

interface MoveSource {
    point: Vec2;
    allowVertices: boolean;
}

interface MoveBounds {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

interface MoveGesture {
    pointerId: number;
    startClient: Vec2;
    startWorld: Vec2;
    anchor: Vec2;
    snapshots: MoveSnapshot[];
    selected: Mesh[];
    sources: MoveSource[];
    targets: SnapGeometry;
    bounds: MoveBounds;
    options: MoveOptions;
    axis: "x" | "y" | null;
}

/**
 * 查找选中的祖先，避免层级中的同一世界位移重复生效。
 * @param node 场景成员
 * @param selected 本轮选择集
 * @example const inherited = HasSelectedAncestor(mesh, selected);
 * @returns 是否已有选中祖先。
 */
const HasSelectedAncestor = (node: { parent: Mesh["parent"] }, selected: ReadonlySet<Mesh>): boolean => {
    let parent = node.parent;
    let inherited = false;
    // 沿祖先链检查，不遍历兄弟节点或修改场景层级。
    while (parent !== null && inherited === false) {
        // Set 的键是 Mesh，其他 Group 节点只用于继续查祖先。
        if (parent instanceof Mesh && selected.has(parent)) {
            inherited = true;
        } else {
            parent = parent.parent;
        }
    }
    return inherited;
};

/**
 * 读取移动源轮廓；字体只使用排版框，Base 只使用边界节点。
 * @param mesh 选中成员
 * @param camera 实际显示矩阵所用相机
 * @example const vertices = MoveVertices(mesh, camera);
 * @returns 世界轮廓节点与顶点吸附许可；十边及以上 NGon 保留其他吸附类型。
 */
const MoveVertices = (mesh: Mesh, camera: Camera): { vertices: Vec2[]; allowVertices: boolean } => {
    const outline = ReadSnapOutline(mesh, camera);
    const vertices: Vec2[] = [];
    // 标准几何复用吸附模块的原始轮廓，不读取三角面内部点。
    if (outline !== null) {
        // 内外圈都包含在实际活动边界中。
        for (const contour of outline.contours) {
            vertices.push(...contour.vertices);
        }
    } else if (mesh.data instanceof Base2D) {
        // Base 没有参数化轮廓定义，读取它维护的外圈与孔边界。
        const matrix = mesh.getRenderMatrix(camera).data;
        // Base 的孔边界和外轮廓使用统一屏幕容差。
        for (const contour of mesh.data.contours) {
            // 有序轮廓已排除三角化产生的内部顶点。
            for (let offset = 0; offset < contour.length; offset += 2) {
                vertices.push(new Vec2(matrix[0] * contour[offset] + matrix[3] * contour[offset + 1] + matrix[6],
                    matrix[1] * contour[offset] + matrix[4] * contour[offset + 1] + matrix[7]));
            }
        }
    }
    return { vertices, allowVertices: outline?.allowVertices ?? true };
};

/**
 * 限制整批选择的联合边界，不单独裁切某个成员。
 * @param delta 候选世界位移
 * @param bounds 起笔时联合边界
 * @param options 世界活动区域
 * @example const limited = ClampDelta(delta, bounds, options);
 * @returns 限制后的共同位移。
 */
const ClampDelta = (delta: Vec2, bounds: MoveBounds, options: MoveOptions): Vec2 => new Vec2(
    Math.max(options.left - bounds.left, Math.min(options.right - bounds.right, delta.x)),
    Math.max(options.bottom - bounds.bottom, Math.min(options.top - bounds.top, delta.y)),
);

/**
 * 比较两个世界位置在屏幕上的距离。
 * @param first 第一个世界点
 * @param second 第二个世界点
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example const pixels = ScreenDistance(raw, snapped, camera, render);
 * @returns CSS 像素距离。
 */
const ScreenDistance = (first: Vec2, second: Vec2, camera: Camera, render: Render): number => {
    const start = camera.worldToWindow(first, render);
    const end = camera.worldToWindow(second, render);
    return Math.hypot(end.x - start.x, end.y - start.y);
};

export default CollectionMove;
export type { MoveOptions };
