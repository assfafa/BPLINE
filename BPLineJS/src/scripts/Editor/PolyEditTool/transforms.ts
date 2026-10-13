import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { TransformPoint2D as TransformPoint } from "bpmatrixjs/Utils";
import Poly2D from "../../Geometry/Poly2D";
import Mesh from "../../Mesh";
import { HistoryMesh } from "../History/records";
import type { SnapGeometry } from "../Snap";
import {
    CollectSnapGeometry,
    NearbySnapPoints,
    RotationSnapTargets,
} from "../Snap";
import { FindRotationSnap } from "../Snap/RotationSnap";
import type { PolyBounds } from "./geometry";
import {
    BoundsOfMeshes,
    ToLocal,
    ToParent,
    WorldVertices,
} from "./geometry";
import type PolyEditTool from "./index";
import type { GroupHandle, PolyGesture, PolyMatrix } from "./types";

/** Poly 编辑器的 transforms 操作，复用主编辑器的实时配置和通知。 */
class PolyTransforms {
    private readonly _tool: PolyEditTool;
    private readonly _hooks: PolyTransformsHooks;

    /** @param tool 主编辑器 @param hooks 状态和通知入口 @example new PolyTransforms(tool, hooks); @returns 操作模块。 */
    public constructor(tool: PolyEditTool, hooks: PolyTransformsHooks) {
        this._tool = tool;
        this._hooks = hooks;
    }


    /**
     * 一次手势只冻结一次外部对象轮廓，后续用原始鼠标位置筛选边和交点。
     * @param gesture 当前手势
     * @returns 外部对象的世界顶点和边
     * @example const targets = this.getSnapGeometry(gesture);
     */
    public getSnapGeometry(gesture: PolyGesture): SnapGeometry {
        if (gesture.snapGeometry === undefined) {
            // 手势首次吸附时收集静止目标，后续移动复用同一基准集合。
            const moving = new Set(gesture.snapshots.map(HistoryMesh));
            gesture.snapGeometry = CollectSnapGeometry(this._tool.scene, moving, this._tool.camera);
        }
        return gesture.snapGeometry;
    }


    /**
     * 按当前指针位置读取启用的吸附候选。
     * @param gesture 当前手势
     * @param world 未吸附的世界点
     * @returns 容差内的目标点
     * @example const targets = this.getSnapTargets(gesture, world);
     */
    public getSnapTargets(gesture: PolyGesture, world: Vec2): Vec2[] {
        return NearbySnapPoints(world, this.getSnapGeometry(gesture), this._tool.snapOptions,
            this._tool.radius, this._tool.camera, this._tool.render);
    }


    /** @param mesh 候选 Mesh @example const valid = this.withinWorldLimits(mesh); @returns 所有外圈顶点是否在活动区域内。 */
    public withinWorldLimits(mesh: Mesh): boolean {
        let allowed = true;
        for (const point of WorldVertices(mesh, this._tool.camera)) {
            // 完整轮廓的顶点都参与活动范围检查，不能只限制中心。
            if (point.x < this._tool.left || point.x > this._tool.right || point.y < this._tool.bottom || point.y > this._tool.top) {
                // 任一顶点越界便拒绝整笔变换。
                allowed = false;
            }
        }
        return allowed;
    }


    /** @param mesh 候选 Mesh @example const allowed = this.isAllowedPolygon(mesh); @returns 是否满足尺寸与面积限制。 */
    public isAllowedPolygon(mesh: Mesh): boolean {
        const geometry = mesh.data;
        const bounds = BoundsOfMeshes([mesh], this._tool.camera);
        if (geometry instanceof Poly2D && bounds !== null) {
            // 有多边形几何和有效范围时验证面积及宽高限制。
            const points = geometry.points;
            let signedArea = 0;
            // 开放路径没有填充面积；闭合轮廓才接受面积上限约束。
            if (geometry.closed) {
                for (let offset = 0; offset < points.length; offset += 2) {
                    // 闭合路径按相邻节点计算有向面积，再取绝对值用于上限检查。
                    const next = (offset + 2) % points.length;
                    signedArea += points[offset] * points[next + 1] - points[next] * points[offset + 1];
                }
            }
            const matrix = mesh.getRenderMatrix(this._tool.camera).data;
            const determinant = Math.abs(matrix[0] * matrix[4] - matrix[1] * matrix[3]);
            const area = Math.abs(signedArea) * determinant / 2;
            return bounds.width >= this._tool.minWidth && bounds.width <= this._tool.maxWidth &&
                bounds.height >= this._tool.minHeight && bounds.height <= this._tool.maxHeight && area <= this._tool.max;
        } else {
            return false;
        }
    }


    /**
     * 找出移动候选中距原始鼠标轨迹最近的步进或顶点吸附修正。
     * @param gesture 当前移动手势
     * @param rawX 原始世界 X 平移
     * @param rawY 原始世界 Y 平移
     * @returns 修正后的平移向量
     * @example
     * const delta = this.moveDelta(gesture, dx, dy);
     */
    public moveDelta(gesture: PolyGesture, rawX: number, rawY: number): Vec2 {
        let result = new Vec2(rawX, rawY);
        let bestDistance = Infinity;
        const anchor = gesture.snapshots.at(0)?.center;
        // 以第一件对象中心对齐世界原点网格，多选共享同一平移量。
        if (this._tool.translationStepEnabled && this._tool.translationStep > 0 && anchor !== undefined) {
            const snappedX = Math.round((anchor.x + rawX) / this._tool.translationStep) * this._tool.translationStep;
            const snappedY = Math.round((anchor.y + rawY) / this._tool.translationStep) * this._tool.translationStep;
            const source = this._tool.camera.worldToWindow(new Vec2(anchor.x + rawX, anchor.y + rawY), this._tool.render);
            const target = this._tool.camera.worldToWindow(new Vec2(snappedX, snappedY), this._tool.render);
            bestDistance = Math.hypot(target.x - source.x, target.y - source.y);
            result = new Vec2(snappedX - anchor.x, snappedY - anchor.y);
        }
        // 顶点吸附以原轮廓为准，不从填充三角形读取交点。
        if (this._tool.snap) {
            for (const snapshot of gesture.snapshots) {
                // 每个移动对象都可贡献吸附源，最终取整批中最近的候选。
                for (const sourceVertex of snapshot.vertices) {
                    // 使用冻结顶点加原始偏移，避免吸附误差逐帧累积。
                    const proposed = new Vec2(sourceVertex.x + rawX, sourceVertex.y + rawY);
                    const proposedScreen = this._tool.camera.worldToWindow(proposed, this._tool.render);
                    for (const targetVertex of this.getSnapTargets(gesture, proposed)) {
                        // 将所有目标转为屏幕坐标，步进与吸附使用同一距离尺度。
                        const targetScreen = this._tool.camera.worldToWindow(targetVertex, this._tool.render);
                        const distance = Math.hypot(targetScreen.x - proposedScreen.x, targetScreen.y - proposedScreen.y);
                        if (distance <= this._tool.radius && distance < bestDistance) {
                            // 只采用容差内且更近的候选，使整批对象保持同一位移。
                            bestDistance = distance;
                            result = new Vec2(
                                rawX + targetVertex.x - proposed.x,
                                rawY + targetVertex.y - proposed.y,
                            );
                        }
                    }
                }
            }
        }
        return result;
    }


    /** @param gesture 当前手势 @example this.applyMove(gesture); @returns 无返回值。 */
    public applyMove(gesture: PolyGesture): void {
        let current = gesture.currentClient;
        // 屏幕轴锁定只保留首先显著偏离的方向。
        if (this._tool.constrain) {
            const dx = current.x - gesture.startClient.x;
            const dy = current.y - gesture.startClient.y;
            if (gesture.lockedAxis === null && Math.hypot(dx, dy) > 3) {
                // 超过三像素再锁定首个移动轴，避免按下抖动决定方向。
                if (Math.abs(dx) >= Math.abs(dy)) {
                    // 首段水平分量较大时锁定横轴，否则锁定纵轴。
                    gesture.lockedAxis = "x";
                } else {
                    gesture.lockedAxis = "y";
                }
            }
            if (gesture.lockedAxis === "x") {
                // 锁定横轴时保留起始屏幕高度。
                current = new Vec2(current.x, gesture.startClient.y);
            } else if (gesture.lockedAxis === "y") {
                // 锁定纵轴时保留起始屏幕横坐标。
                current = new Vec2(gesture.startClient.x, current.y);
            }
        } else {
            gesture.lockedAxis = null;
        }
        const world = this._tool.camera.windowToWorld(current, this._tool.render);
        const delta = this.moveDelta(gesture, world.x - gesture.startWorld.x, world.y - gesture.startWorld.y);
        let valid = true;
        for (const snapshot of gesture.snapshots) {
            // 将统一世界偏移分别换算到每个对象的父级坐标。
            const target = new Vec2(snapshot.center.x + delta.x, snapshot.center.y + delta.y);
            const parentPoint = ToParent(snapshot.mesh, target);
            if (parentPoint !== null) {
                // 父级可逆时写入位置并检查活动范围。
                snapshot.mesh.position.set(parentPoint.x, parentPoint.y);
                if (!this.withinWorldLimits(snapshot.mesh)) {
                    // 任何成员越界都会回退整批移动。
                    valid = false;
                }
            } else {
                valid = false;
            }
        }
        if (valid) {
            // 全部成员合法后才发送移动和编辑通知。
            if (gesture.mode === "groupMove" && this._hooks.groupFrame !== null && gesture.frameCenter !== null) {
                // 移动被拒绝时组框也回到手势开始位置。
                this._hooks.groupFrame.position.set(
                    gesture.frameCenter.x + delta.x,
                    gesture.frameCenter.y + delta.y,
                );
            }
            const changed = gesture.snapshots.map(HistoryMesh);
            this._hooks.emit(this._hooks.onMove, changed);
            this._hooks.emit(this._hooks.onPositionChange, changed);
            this._hooks.emit(this._hooks.onEdit, changed);
        } else {
            // 任一对象越界时整组回到按下前位置。
            for (const snapshot of gesture.snapshots) {
                snapshot.mesh.position.set(snapshot.position.x, snapshot.position.y);
            }
            if (gesture.mode === "groupMove" && this._hooks.groupFrame !== null && gesture.frameCenter !== null) {
                // 移动被拒绝时组框也回到手势开始位置。
                this._hooks.groupFrame.position.set(gesture.frameCenter.x, gesture.frameCenter.y);
            }
        }
    }


    /** @param gesture 顶点拖动手势 @example this.applyVertex(gesture); @returns 无返回值。 */
    public applyVertex(gesture: PolyGesture): void {
        const snapshot = gesture.snapshots.at(0);
        const mesh = gesture.target;
        const index = gesture.vertexIndex;
        if (mesh !== undefined && snapshot !== undefined && index !== undefined) {
            // 目标、冻结轮廓及节点编号齐全才修改单个顶点。
            const geometry = this._hooks.uniqueGeometry(mesh);
            const originalPoints = gesture.editPoints ?? snapshot.points;
            const originalWorld = TransformPoint(snapshot.matrix, new Vec2(
                originalPoints[index * 2], originalPoints[index * 2 + 1],
            ));
            const anchor = this._tool.camera.worldToWindow(originalWorld, this._tool.render);
            let client = gesture.currentClient;
            // Shift 经过顶点原位置锁定屏幕轴，允许鼠标命中存在像素容差。
            if (this._tool.constrain) {
                const dx = client.x - anchor.x;
                const dy = client.y - anchor.y;
                if (gesture.lockedAxis === null && Math.hypot(dx, dy) > 3) {
                    // 超过点击抖动阈值才确定本次顶点拖动的约束轴。
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        // 首段横向位移更大时锁定横轴，否则锁定纵轴。
                        gesture.lockedAxis = "x";
                    } else {
                        gesture.lockedAxis = "y";
                    }
                }
                if (gesture.lockedAxis === "x") {
                    // 横向拖动保持顶点初始屏幕高度。
                    client = new Vec2(client.x, anchor.y);
                } else if (gesture.lockedAxis === "y") {
                    // 纵向拖动保持顶点初始屏幕横坐标。
                    client = new Vec2(anchor.x, client.y);
                }
            } else {
                gesture.lockedAxis = null;
            }
            let world = this._tool.camera.windowToWorld(client, this._tool.render);
            let distance = Infinity;
            // 步进以世界原点为基准，和顶点吸附比较屏幕距离。
            if (this._tool.translationStepEnabled && this._tool.translationStep > 0) {
                let stepped = new Vec2(
                    Math.round(world.x / this._tool.translationStep) * this._tool.translationStep,
                    Math.round(world.y / this._tool.translationStep) * this._tool.translationStep,
                );
                let screen = this._tool.camera.worldToWindow(stepped, this._tool.render);
                // 锁轴优先于世界网格步进，避免步进使节点偏离屏幕直线。
                if (gesture.lockedAxis === "x") {
                    screen = new Vec2(screen.x, anchor.y);
                    stepped = this._tool.camera.windowToWorld(screen, this._tool.render);
                } else if (gesture.lockedAxis === "y") {
                    // 纵向约束优先于世界步进，节点不能偏离当前屏幕直线。
                    screen = new Vec2(anchor.x, screen.y);
                    stepped = this._tool.camera.windowToWorld(screen, this._tool.render);
                }
                distance = Math.hypot(screen.x - client.x, screen.y - client.y);
                world = stepped;
            }
            if (this._tool.snap) {
                // 把未拖动的自身节点加入外部目标，允许轮廓内部对齐。
                const rawWorld = this._tool.camera.windowToWorld(client, this._tool.render);
                const targetGeometry = this.getSnapGeometry(gesture);
                const selfGeometry: SnapGeometry = {
                    vertices: [...targetGeometry.vertices],
                    segments: [...targetGeometry.segments],
                };
                const points = gesture.editPoints ?? snapshot.points;
                const ownVertices: Vec2[] = [];
                for (let vertex = 0; vertex < points.length / 2; vertex++) {
                    // 按冻结显示矩阵还原自身节点的世界位置。
                    ownVertices.push(TransformPoint(snapshot.matrix, new Vec2(
                        points[vertex * 2], points[vertex * 2 + 1],
                    )));
                    if (vertex !== index) {
                        // 被拖节点不作为自身吸附目标，防止锁死在起始位置。
                        selfGeometry.vertices.push(ownVertices[vertex]);
                    }
                }
                let edgeCount = ownVertices.length;
                // 开放路径不包含末点到首点的边，避免吸附到并不存在的闭合边。
                if (geometry.closed === false) {
                    edgeCount -= 1;
                }
                // 与正在拖动的顶点相邻的边不能作为自身吸附目标。
                for (let edge = 0; edge < edgeCount; edge++) {
                    const next = (edge + 1) % ownVertices.length;
                    if (edge !== index && next !== index) {
                        // 排除与拖动节点相邻的边，保留其他稳定边线。
                        selfGeometry.segments.push({ start: ownVertices[edge], end: ownVertices[next] });
                    }
                }
                const targets = NearbySnapPoints(rawWorld, selfGeometry, this._tool.snapOptions,
                    this._tool.radius, this._tool.camera, this._tool.render);
                for (const target of targets) {
                    // 每个候选同时满足锁轴条件和屏幕容差才可采用。
                    const screen = this._tool.camera.worldToWindow(target, this._tool.render);
                    // 锁轴时只接受严格位于同一屏幕直线上的吸附目标。
                    const onAxis = gesture.lockedAxis === null ||
                        (gesture.lockedAxis === "x" && Math.abs(screen.y - anchor.y) <= 0.5) ||
                        (gesture.lockedAxis === "y" && Math.abs(screen.x - anchor.x) <= 0.5);
                    if (onAxis) {
                        // 锁轴操作只接受同一直线上的目标。
                        const candidateDistance = Math.hypot(screen.x - client.x, screen.y - client.y);
                        if (candidateDistance <= this._tool.radius && candidateDistance < distance) {
                            // 更近的有效候选替代步进位置。
                            world = target;
                            distance = candidateDistance;
                        }
                    }
                }
            }
            const local = ToLocal(snapshot.matrix, world);
            if (local !== null) {
                // 鼠标点可映射到局部坐标时才提交新轮廓。
                const source = gesture.editPoints ?? snapshot.points;
                const originX = source[index * 2];
                const originY = source[index * 2 + 1];
                const points = new Float32Array(source.length);
                // 按下时就把被拖节点放在局部原点；后续帧只写入很小的局部位移。
                for (let offset = 0; offset < source.length; offset += 2) {
                    points[offset] = source[offset] - originX;
                    points[offset + 1] = source[offset + 1] - originY;
                }
                points[index * 2] = local.x - originX;
                points[index * 2 + 1] = local.y - originY;
                const originalMatrix = snapshot.localMatrix;
                const rebasedMatrix = [...originalMatrix];
                let originScale = 1;
                // 移动局部原点时，世界位移也要消去固定屏幕尺寸的倍率。
                if (mesh.ignoreZoom) {
                    originScale = 1 / this._tool.camera.zoom;
                }
                rebasedMatrix[6] += (originalMatrix[0] * originX + originalMatrix[3] * originY) * originScale;
                rebasedMatrix[7] += (originalMatrix[1] * originX + originalMatrix[4] * originY) * originScale;
                mesh.position.set(rebasedMatrix[6], rebasedMatrix[7]);
                mesh.matrix.set(rebasedMatrix as PolyMatrix);
                geometry.points = points;
                if (this.withinWorldLimits(mesh) && this.isAllowedPolygon(mesh)) {
                    // 修改后通过形状与范围限制才通知，否则还原原始节点与矩阵。
                    this._hooks.emit(this._hooks.onResize, mesh);
                    this._hooks.emit(this._hooks.onEdit, [mesh]);
                } else {
                    geometry.points = new Float32Array(source);
                    mesh.position.set(originalMatrix[6], originalMatrix[7]);
                    mesh.matrix.set(originalMatrix as PolyMatrix);
                }
            }
        }
    }


    /** @param gesture 单体旋转手势 @example this.applyRotate(gesture); @returns 无返回值。 */
    public applyRotate(gesture: PolyGesture): void {
        const snapshot = gesture.snapshots.at(0);
        const mesh = gesture.target;
        if (mesh !== undefined && snapshot !== undefined && this._hooks.rotationEnabled) {
            // 目标存在且允许旋转时使用冻结角度，避免旋转漂移。
            const start = Math.atan2(gesture.startWorld.y - snapshot.center.y, gesture.startWorld.x - snapshot.center.x);
            const current = Math.atan2(gesture.currentWorld.y - snapshot.center.y, gesture.currentWorld.x - snapshot.center.x);
            const rawAngle = current - start;
            let rotation = snapshot.rotation + rawAngle;
            let stepAngle: number | null = null;
            if (this._tool.rotationStepEnabled && this._tool.rotationStep > 0) {
                // 先生成绝对角度的步进候选，再与方向吸附比较。
                const radians = this._tool.rotationStep * Math.PI / 180;
                rotation = Math.round(rotation / radians) * radians;
                stepAngle = rotation - snapshot.rotation;
            }
            // 旋转吸附只改变角度，让源顶点沿鼠标方向与其他轮廓节点同向。
            if (this._tool.snap) {
                const snapped = FindRotationSnap({
                    pivot: snapshot.center,
                    sources: snapshot.vertices,
                    targets: RotationSnapTargets(snapshot.center, snapshot.vertices, rawAngle,
                        this.getSnapGeometry(gesture), this._tool.snapOptions, this._tool.radius, this._tool.camera, this._tool.render),
                    rawAngle,
                    stepAngle,
                    cursor: gesture.currentClient,
                    radius: this._tool.radius,
                    camera: this._tool.camera,
                    render: this._tool.render,
                });
                if (snapped !== null) {
                    // 更近的方向候选替换本次旋转增量。
                    rotation = snapshot.rotation + snapped;
                }
            }
            mesh.rotation = rotation;
            if (this.withinWorldLimits(mesh) && this.isAllowedPolygon(mesh)) {
                // 旋转后的轮廓满足活动范围和形状约束时才发送事件。
                this._hooks.emit(this._hooks.onRotate, [mesh]);
                this._hooks.emit(this._hooks.onEdit, [mesh]);
            } else {
                mesh.rotation = snapshot.rotation;
            }
        }
    }


    /**
     * 让组缩放中的某个轮廓顶点精确落在其他多边形的节点上。
     * @param gesture 当前组手势
     * @param frameMatrix 按下时的组框世界矩阵
     * @param handle 当前边或角
     * @param anchorX 组框局部 X 锚点
     * @param anchorY 组框局部 Y 锚点
     * @param raw 未经过网格步进的倍率
     * @param stepped 已经过网格步进的倍率
     * @example
     * const factors = this.findGroupScaleSnap(gesture, matrix, handle, ax, ay, raw, stepped);
     * @returns 比网格更接近鼠标轨迹的顶点倍率，或 null
     */
    public findGroupScaleSnap(
        gesture: PolyGesture,
        frameMatrix: ArrayLike<number>,
        handle: GroupHandle,
        anchorX: number,
        anchorY: number,
        raw: Vec2,
        stepped: Vec2,
    ): Vec2 | null {
        let best: Vec2 | null = null;
        let bestDistance = this._tool.radius + Number.EPSILON;
        const changeX = handle.includes("e") || handle.includes("w");
        const changeY = handle.includes("n") || handle.includes("s");
        // 对比每个源轮廓节点和外部目标，整个组只采用一个共同倍率。
        for (const snapshot of gesture.snapshots) {
            for (const source of snapshot.vertices) {
                // 尝试用每个源节点求统一组缩放比例。
                const local = ToLocal(frameMatrix, source);
                if (local !== null) {
                    // 源节点可映射到冻结组框坐标时才计算倍率。
                    const rawPoint = TransformPoint(frameMatrix, new Vec2(
                        anchorX + (local.x - anchorX) * raw.x,
                        anchorY + (local.y - anchorY) * raw.y,
                    ));
                    const rawClient = this._tool.camera.worldToWindow(rawPoint, this._tool.render);
                    const targets = this.getSnapTargets(gesture, rawPoint);
                    const stepPoint = TransformPoint(frameMatrix, new Vec2(
                        anchorX + (local.x - anchorX) * stepped.x,
                        anchorY + (local.y - anchorY) * stepped.y,
                    ));
                    const stepClient = this._tool.camera.worldToWindow(stepPoint, this._tool.render);
                    let stepDistance = Infinity;
                    if (this._tool.translationStepEnabled) {
                        // 步进开启时记录它的屏幕误差，吸附必须比它更近。
                        stepDistance = Math.hypot(stepClient.x - rawClient.x, stepClient.y - rawClient.y);
                    }
                    for (const target of targets) {
                        // 比较当前源节点附近的各个吸附目标。
                        const targetClient = this._tool.camera.worldToWindow(target, this._tool.render);
                        const distance = Math.hypot(targetClient.x - rawClient.x, targetClient.y - rawClient.y);
                        if (distance < bestDistance && distance < stepDistance) {
                            // 候选同时优于已有目标和步进时才求精确比例。
                            const targetLocal = ToLocal(frameMatrix, target);
                            if (targetLocal !== null) {
                                // 目标可换算到组框坐标系后分别解活动轴的比例。
                                let candidateX = raw.x;
                                let candidateY = raw.y;
                                // 未参与本次拉伸的轴维持原倍率，只有活动轴求精确交点。
                                if (changeX && Math.abs(local.x - anchorX) > Number.EPSILON) {
                                    candidateX = (targetLocal.x - anchorX) / (local.x - anchorX);
                                }
                                if (changeY && Math.abs(local.y - anchorY) > Number.EPSILON) {
                                    // 纵向分量非退化时求纵轴倍率，避免零长度除法。
                                    candidateY = (targetLocal.y - anchorY) / (local.y - anchorY);
                                }
                                if (this._tool.constrain && changeX && changeY) {
                                    // 等比角点操作共用横轴倍率，随后验证目标是否仍准确对齐。
                                    candidateY = candidateX;
                                }
                                const aligned = TransformPoint(frameMatrix, new Vec2(
                                    anchorX + (local.x - anchorX) * candidateX,
                                    anchorY + (local.y - anchorY) * candidateY,
                                ));
                                const alignedClient = this._tool.camera.worldToWindow(aligned, this._tool.render);
                                const error = Math.hypot(alignedClient.x - targetClient.x,
                                    alignedClient.y - targetClient.y);
                                if (error <= 0.5 && Number.isFinite(candidateX) && Number.isFinite(candidateY) &&
                                    Math.abs(candidateX) > 0.000001 && Math.abs(candidateY) > 0.000001) {
                                    // 只接受误差小于半像素且有限非退化的倍率。
                                    best = new Vec2(candidateX, candidateY);
                                    bestDistance = distance;
                                }
                            }
                        }
                    }
                }
            }
        }
        return best;
    }


    /** @param gesture 组自由缩放手势 @example this.applyGroupScale(gesture); @returns 无返回值。 */
    public applyGroupScale(gesture: PolyGesture): void {
        const handle = gesture.groupHandle;
        const frameMatrix = gesture.frameMatrix;
        const bounds = this._hooks.groupBounds;
        if (handle !== undefined && frameMatrix !== undefined && bounds !== null) {
            // 组手柄、冻结矩阵和初始范围齐全时才能缩放。
            const start = ToLocal(frameMatrix, gesture.startWorld);
            const current = ToLocal(frameMatrix, gesture.currentWorld);
            if (start !== null && current !== null && bounds.width > Number.EPSILON && bounds.height > Number.EPSILON) {
                // 组框两轴尺寸非零且坐标可逆时才求缩放比例。
                const changeX = current.x - start.x;
                const changeY = current.y - start.y;
                let factorX = 1;
                let factorY = 1;
                let anchorX = 0;
                let anchorY = 0;
                // 活动边只改变自身轴，固定对边作为该轴缩放锚点。
                if (handle.includes("e")) {
                    factorX += changeX / bounds.width;
                    anchorX = -bounds.width / 2;
                } else if (handle.includes("w")) {
                    // 拖左边以右边为固定锚点，允许跨过锚点形成反向比例。
                    factorX -= changeX / bounds.width;
                    anchorX = bounds.width / 2;
                }
                if (handle.includes("n")) {
                    // 拖上边以底边为固定锚点。
                    factorY += changeY / bounds.height;
                    anchorY = -bounds.height / 2;
                } else if (handle.includes("s")) {
                    // 拖下边以顶边为固定锚点。
                    factorY -= changeY / bounds.height;
                    anchorY = bounds.height / 2;
                }
                const corner = handle.length === 2;
                // Shift 保留现有等比约束；默认角点可以分别改变两个比例。
                if (this._tool.constrain && corner) {
                    let factor = factorX;
                    if (Math.abs(factorY - 1) > Math.abs(factorX - 1)) {
                        // 等比操作采用变化更明显的轴作为统一倍率。
                        factor = factorY;
                    }
                    factorX = factor;
                    factorY = factor;
                }
                const rawFactors = new Vec2(factorX, factorY);
                // 世界网格步进通过组框实际轴长折算为缩放倍率。
                if (this._tool.translationStepEnabled && this._tool.translationStep > 0) {
                    const widthWorld = Math.hypot(frameMatrix[0], frameMatrix[1]) * bounds.width;
                    const heightWorld = Math.hypot(frameMatrix[3], frameMatrix[4]) * bounds.height;
                    if (handle.includes("e") || handle.includes("w")) {
                        // 只有横向活动手柄才量化组框世界宽度。
                        factorX = Math.round(factorX * widthWorld / this._tool.translationStep) *
                            this._tool.translationStep / widthWorld;
                    }
                    if (handle.includes("n") || handle.includes("s")) {
                        // 只有纵向活动手柄才量化组框世界高度。
                        factorY = Math.round(factorY * heightWorld / this._tool.translationStep) *
                            this._tool.translationStep / heightWorld;
                    }
                    // 等比约束时两个网格候选取离原始倍率更近的一个，再共用该倍率。
                    if (this._tool.constrain && corner) {
                        let factor = factorX;
                        if (Math.abs(factorY - rawFactors.y) < Math.abs(factorX - rawFactors.x)) {
                            // 等比步进选离原始倍率更近的轴，再同步另一个轴。
                            factor = factorY;
                        }
                        factorX = factor;
                        factorY = factor;
                    }
                }
                if (this._tool.snap) {
                    // 吸附开启时收集整组选中对象的轮廓源。
                    const snapped = this.findGroupScaleSnap(gesture, frameMatrix, handle, anchorX, anchorY,
                        rawFactors, new Vec2(factorX, factorY));
                    if (snapped !== null) {
                        // 吸附求得有效比例时采用它作为统一组缩放。
                        factorX = snapped.x;
                        factorY = snapped.y;
                    }
                }
                const validFactors = Number.isFinite(factorX) && Number.isFinite(factorY) &&
                    Math.abs(factorX) > 0.000001 && Math.abs(factorY) > 0.000001;
                if (validFactors) {
                    // 拒绝非有限和接近零的比例，避免生成不可逆矩阵。
                    let valid = true;
                    // 源轮廓在冻结的组框坐标系内缩放，再映射回原 Mesh 局部坐标。
                    for (const snapshot of gesture.snapshots) {
                        const next = new Float32Array(snapshot.points.length);
                        for (let vertex = 0; vertex < snapshot.vertices.length; vertex++) {
                            // 逐个映射原始节点，保留拓扑和节点顺序。
                            const framePoint = ToLocal(frameMatrix, snapshot.vertices[vertex]);
                            if (framePoint !== null) {
                                // 源节点可转为组框局部点时应用两轴缩放。
                                const scaled = new Vec2(
                                    anchorX + (framePoint.x - anchorX) * factorX,
                                    anchorY + (framePoint.y - anchorY) * factorY,
                                );
                                const target = TransformPoint(frameMatrix, scaled);
                                const local = ToLocal(snapshot.matrix, target);
                                if (local !== null) {
                                    // 结果能回到实体局部坐标时写入新节点。
                                    next[vertex * 2] = local.x;
                                    next[vertex * 2 + 1] = local.y;
                                } else {
                                    valid = false;
                                }
                            } else {
                                valid = false;
                            }
                        }
                        if (valid) {
                            // 此前成员均合法时提交当前轮廓，再继续检查限制。
                            this._hooks.uniqueGeometry(snapshot.mesh).points = next;
                            if (!this.withinWorldLimits(snapshot.mesh) || !this.isAllowedPolygon(snapshot.mesh)) {
                                // 任意成员越界或不满足形状限制都回退整个组。
                                valid = false;
                            }
                        }
                    }
                    if (valid) {
                        // 所有成员通过限制后统一提交组框与事件。
                        const frame = this._hooks.groupFrame;
                        if (frame !== null) {
                            // 组框使用相同锚点与倍率，反向缩放后仍跟随实体。
                            const translationX = frameMatrix[6] + frameMatrix[0] * anchorX * (1 - factorX) +
                                frameMatrix[3] * anchorY * (1 - factorY);
                            const translationY = frameMatrix[7] + frameMatrix[1] * anchorX * (1 - factorX) +
                                frameMatrix[4] * anchorY * (1 - factorY);
                            frame.position.set(translationX, translationY);
                            frame.matrix.set([
                                frameMatrix[0] * factorX, frameMatrix[1] * factorX, 0,
                                frameMatrix[3] * factorY, frameMatrix[4] * factorY, 0,
                                translationX, translationY, 1,
                            ]);
                        }
                        const changed = gesture.snapshots.map(HistoryMesh);
                        for (const mesh of changed) {
                            // 缩放回调逐个发送，位置和编辑回调保持整批发送。
                            this._hooks.emit(this._hooks.onScale, mesh);
                        }
                        this._hooks.emit(this._hooks.onEdit, changed);
                    } else {
                        // 任意一件越界就让整组回到按下前，避免局部形变。
                        for (const snapshot of gesture.snapshots) {
                            this._hooks.uniqueGeometry(snapshot.mesh).points = new Float32Array(snapshot.points);
                        }
                    }
                }
            }
        }
    }

    /** @param gesture 组旋转手势 @example this.applyGroupRotate(gesture); @returns 无返回值。 */
    public applyGroupRotate(gesture: PolyGesture): void {
        const center = gesture.frameCenter;
        if (center !== null && this._hooks.rotationEnabled) {
            // 允许旋转且中心存在时才处理组旋转。
            const start = Math.atan2(gesture.startWorld.y - center.y, gesture.startWorld.x - center.x);
            const current = Math.atan2(gesture.currentWorld.y - center.y, gesture.currentWorld.x - center.x);
            const rawAngle = current - start;
            let angle = rawAngle;
            let stepAngle: number | null = null;
            if (this._tool.rotationStepEnabled && this._tool.rotationStep > 0) {
                // 角度步进先量化组旋转增量。
                const radians = this._tool.rotationStep * Math.PI / 180;
                angle = Math.round(angle / radians) * radians;
                stepAngle = angle;
            }
            if (this._tool.snap) {
                // 方向吸附以冻结轮廓比较当前鼠标指向。
                const sources: Vec2[] = [];
                // 组内所有原始节点共享同一个旋转中心和角度。
                for (const snapshot of gesture.snapshots) {
                    sources.push(...snapshot.vertices);
                }
                const snapped = FindRotationSnap({
                    pivot: center,
                    sources,
                    targets: RotationSnapTargets(center, sources, rawAngle,
                        this.getSnapGeometry(gesture), this._tool.snapOptions, this._tool.radius, this._tool.camera, this._tool.render),
                    rawAngle,
                    stepAngle,
                    cursor: gesture.currentClient,
                    radius: this._tool.radius,
                    camera: this._tool.camera,
                    render: this._tool.render,
                });
                if (snapped !== null) {
                    // 吸附角度更合适时替代原始或步进角度。
                    angle = snapped;
                }
            }
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            let valid = true;
            for (const snapshot of gesture.snapshots) {
                // 失败旋转恢复每个对象的原始中心和角度。
                const dx = snapshot.center.x - center.x;
                const dy = snapshot.center.y - center.y;
                const target = new Vec2(
                    center.x + dx * cosine - dy * sine,
                    center.y + dx * sine + dy * cosine,
                );
                const parentPoint = ToParent(snapshot.mesh, target);
                if (parentPoint !== null) {
                    // 成功换算到父级后同时更新位置和单体朝向。
                    snapshot.mesh.position.set(parentPoint.x, parentPoint.y);
                    snapshot.mesh.rotation = snapshot.rotation + angle;
                    if (!this.withinWorldLimits(snapshot.mesh) || !this.isAllowedPolygon(snapshot.mesh)) {
                        // 组旋转中任意成员越界或形状不合法都会回退整批。
                        valid = false;
                    }
                } else {
                    valid = false;
                }
            }
            if (valid) {
                // 所有成员合法后同步组框并通知整批旋转。
                if (this._hooks.groupFrame !== null) {
                    // 失败时组框也恢复开始角度。
                    this._hooks.groupFrame.rotation = gesture.frameRotation + angle;
                }
                const changed = gesture.snapshots.map(HistoryMesh);
                this._hooks.emit(this._hooks.onRotate, changed);
                this._hooks.emit(this._hooks.onPositionChange, changed);
                this._hooks.emit(this._hooks.onEdit, changed);
            } else {
                for (const snapshot of gesture.snapshots) {
                    // 失败旋转恢复每个对象的原始中心和角度。
                    snapshot.mesh.position.set(snapshot.position.x, snapshot.position.y);
                    snapshot.mesh.rotation = snapshot.rotation;
                }
                if (this._hooks.groupFrame !== null) {
                    // 失败时组框也恢复开始角度。
                    this._hooks.groupFrame.rotation = gesture.frameRotation;
                }
            }
        }
    }
}

interface PolyTransformsHooks {
    /** 主编辑器当前的 groupFrame 状态。 */
    groupFrame: Mesh | null;
    /**
     * 按注册顺序通知同一事件的全部监听。
     * @param callbacks 具名监听集合
     * @param args 本次事件参数
     * @example
     * this.emit(this._onEdit, meshes);
     * @returns 无返回值
     */
    emit<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void;
    /** 主编辑器当前的 onMove 状态。 */
    readonly onMove: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onPositionChange 状态。 */
    readonly onPositionChange: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onEdit 状态。 */
    readonly onEdit: Map<string, (actives: Mesh[]) => void>;
    /**
     * 分离共享几何，避免一件对象的编辑改变其他 Mesh。
     * @param mesh 目标 Mesh
     * @example
     * const geometry = this.uniqueGeometry(mesh);
     * @returns 只由该 Mesh 持有的多边形几何
     */
    uniqueGeometry(mesh: Mesh): Poly2D;
    /** 主编辑器当前的 onResize 状态。 */
    readonly onResize: Map<string, (mesh: Mesh) => void>;
    /** 主编辑器当前的 rotationEnabled 状态。 */
    rotationEnabled: boolean;
    /** 主编辑器当前的 onRotate 状态。 */
    readonly onRotate: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 groupBounds 状态。 */
    groupBounds: PolyBounds | null;
    /** 主编辑器当前的 onScale 状态。 */
    readonly onScale: Map<string, (mesh: Mesh) => void>;
}

export default PolyTransforms;
export type { PolyTransformsHooks };
