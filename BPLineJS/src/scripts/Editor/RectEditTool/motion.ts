import { Vec2 } from "bpmatrixjs/Math/Vec2";
import Rect2D from "../../Geometry/Rect2D";
import Mesh from "../../Mesh";
import {
    CollectSnapGeometry,
    NearbySnapPoints,
} from "../Snap";
import { ToParent } from "./geometry";
import type RectEditTool from "./index";
import type { EditGesture, MoveSnapCandidate, RectBounds } from "./types";

/** Rect 编辑器的 motion 操作，复用主编辑器的实时配置和通知。 */
class RectMotion {
    private readonly _tool: RectEditTool;
    private readonly _hooks: RectMotionHooks;

    /** @param tool 主编辑器 @param hooks 状态和通知入口 @example new RectMotion(tool, hooks); @returns 操作模块。 */
    public constructor(tool: RectEditTool, hooks: RectMotionHooks) {
        this._tool = tool;
        this._hooks = hooks;
    }


    /**
     * 按世界空间位移移动选中对象，并将联合边界限制在活动区域中。
     * @param gesture 本次移动快照
     * @example
     * this.applyMove(gesture);
     * @returns 无返回值。
     */
    public applyMove(gesture: EditGesture): void {
        const bounds = gesture.bounds;
        // 没有可计算的选中范围时不能执行平移。
        if (bounds !== null) {
            let currentWorld = gesture.currentWorld;
            // 第一次有效拖动决定屏幕轴，后续指针即使斜向移动也保持该轴。
            if (this._tool.constrain) {
                // 每次拖动只选择一次轴，避免指针越过对角线时改变方向。
                if (gesture.lockedAxis === undefined) {
                    const horizontalDistance = Math.abs(gesture.currentClient.x - gesture.startClient.x);
                    const verticalDistance = Math.abs(gesture.currentClient.y - gesture.startClient.y);
                    // 同距离时优先水平轴，选择结果保持确定。
                    if (horizontalDistance >= verticalDistance) {
                        gesture.lockedAxis = "horizontal";
                    } else {
                        gesture.lockedAxis = "vertical";
                    }
                }
                let constrainedClient = gesture.currentClient;
                // 屏幕轴经相机反投影后仍与用户看到的水平或垂直方向一致。
                if (gesture.lockedAxis === "horizontal") {
                    constrainedClient = new Vec2(gesture.currentClient.x, gesture.startClient.y);
                } else {
                    constrainedClient = new Vec2(gesture.startClient.x, gesture.currentClient.y);
                }
                currentWorld = this._tool.camera.windowToWorld(constrainedClient, this._tool.render);
            } else {
                // 关闭约束后允许在同一次手势中重新选择锁定轴。
                gesture.lockedAxis = undefined;
            }
            const rawX = currentWorld.x - gesture.startWorld.x;
            const rawY = currentWorld.y - gesture.startWorld.y;
            let requestedX = rawX;
            let requestedY = rawY;
            let lockedWorldAxis: Vec2 | null = null;
            // 屏幕轴锁定必须先换算为世界方向，步进与顶点吸附才能使用同一方向。
            if (this._tool.constrain && gesture.lockedAxis !== undefined) {
                let axisClient = new Vec2(gesture.startClient.x + 1, gesture.startClient.y);
                // 屏幕纵向锁定使用向下一个 CSS 像素对应的世界方向。
                if (gesture.lockedAxis === "vertical") {
                    axisClient = new Vec2(gesture.startClient.x, gesture.startClient.y + 1);
                }
                const axisWorld = this._tool.camera.windowToWorld(axisClient, this._tool.render);
                const axisX = axisWorld.x - gesture.startWorld.x;
                const axisY = axisWorld.y - gesture.startWorld.y;
                const axisLength = Math.hypot(axisX, axisY);
                // 可逆的相机投影才有可靠的锁定轴。
                if (axisLength > Number.EPSILON) {
                    lockedWorldAxis = new Vec2(axisX / axisLength, axisY / axisLength);
                }
            }
            let stepDistance = Infinity;
            // 选中对象以被拖动矩形为锚，组操作以组框中心为锚；两者都落在世界网格上。
            if (this._tool.translationStepEnabled && Number.isFinite(this._tool.translationStep) && this._tool.translationStep > 0) {
                let anchorX = (bounds.left + bounds.right) * 0.5;
                let anchorY = (bounds.bottom + bounds.top) * 0.5;
                // 组框可能已经旋转，使用按下时保存的组框中心。
                if (gesture.frameState !== undefined) {
                    anchorX = gesture.frameState.worldX;
                    anchorY = gesture.frameState.worldY;
                } else if (gesture.target !== undefined) {
                    // 多选编辑移动时，以指针命中的矩形中心为锚，其他对象保持相对距离。
                    for (const state of gesture.snapshots) {
                        // 只取被命中的对象，避免集合顺序改变吸附结果。
                        if (state.mesh === gesture.target) {
                            anchorX = state.worldX;
                            anchorY = state.worldY;
                            break;
                        }
                    }
                }
                // 锁定屏幕轴后沿该世界方向投影吸附，避免相机旋转时产生斜移。
                if (lockedWorldAxis !== null) {
                    const anchorProjection = anchorX * lockedWorldAxis.x + anchorY * lockedWorldAxis.y;
                    const requestedProjection = anchorProjection + rawX * lockedWorldAxis.x + rawY * lockedWorldAxis.y;
                    const snappedProjection = this._hooks.snapWorldCoordinate(requestedProjection);
                    const projectedDelta = snappedProjection - anchorProjection;
                    requestedX = lockedWorldAxis.x * projectedDelta;
                    requestedY = lockedWorldAxis.y * projectedDelta;
                } else {
                    // 普通平移分别吸附对象的世界 X/Y 坐标，而非本次拖动的位移。
                    requestedX = this._hooks.snapWorldCoordinate(anchorX + requestedX) - anchorX;
                    requestedY = this._hooks.snapWorldCoordinate(anchorY + requestedY) - anchorY;
                }
                const stepX = Math.max(this._tool.left - bounds.left, Math.min(this._tool.right - bounds.right, requestedX));
                const stepY = Math.max(this._tool.bottom - bounds.bottom, Math.min(this._tool.top - bounds.top, requestedY));
                const rawAnchor = this._tool.camera.worldToWindow(new Vec2(anchorX + rawX, anchorY + rawY), this._tool.render);
                const stepAnchor = this._tool.camera.worldToWindow(new Vec2(anchorX + stepX, anchorY + stepY), this._tool.render);
                stepDistance = Math.hypot(stepAnchor.x - rawAnchor.x, stepAnchor.y - rawAnchor.y);
            }
            // 两种吸附都可用时，以拖动原始位置到候选位置的屏幕距离决胜。
            if (this._tool.snap && this._tool.radius >= 0) {
                const vertexCandidate = this.findMoveVertexSnap(gesture, rawX, rawY, bounds, lockedWorldAxis);
                // 步进关闭时 stepDistance 为无穷大，顶点候选只受半径限制。
                if (vertexCandidate !== null && vertexCandidate.distance <= this._tool.radius &&
                    vertexCandidate.distance < stepDistance) {
                    requestedX = vertexCandidate.deltaX;
                    requestedY = vertexCandidate.deltaY;
                }
            }
            // 活动区域小于选中集合时没有合法位置，维持本次手势前的状态。
            if (this._tool.left - bounds.left <= this._tool.right - bounds.right &&
                this._tool.bottom - bounds.bottom <= this._tool.top - bounds.top) {
                const deltaX = Math.max(this._tool.left - bounds.left, Math.min(this._tool.right - bounds.right, requestedX));
                const deltaY = Math.max(this._tool.bottom - bounds.bottom, Math.min(this._tool.top - bounds.top, requestedY));
                const changed: Mesh[] = [];
                // 各对象保留自己的父级，位移需换算为父级局部坐标。
                for (const state of gesture.snapshots) {
                    const parentPoint = ToParent(state.mesh, new Vec2(state.worldX + deltaX, state.worldY + deltaY));
                    // 没有实际位置变化的对象无需触发回调。
                    if (parentPoint !== null && (state.mesh.position.x !== parentPoint.x || state.mesh.position.y !== parentPoint.y)) {
                        state.mesh.position.set(parentPoint.x, parentPoint.y);
                        state.mesh.matrix.set([
                            state.localMatrix[0], state.localMatrix[1], 0,
                            state.localMatrix[3], state.localMatrix[4], 0,
                            parentPoint.x, parentPoint.y, 1,
                        ]);
                        changed.push(state.mesh);
                    }
                }
                // 只通知本帧真正发生移动的对象。
                if (changed.length > 0) {
                    // 组框跟随同一按下快照平移，保留此前旋转和缩放。
                    if (gesture.frame !== undefined && gesture.frameState !== undefined && this._hooks.groupFrame !== null) {
                        const frameState = gesture.frameState;
                        const framePoint = ToParent(this._hooks.groupFrame, new Vec2(frameState.worldX + deltaX, frameState.worldY + deltaY));
                        // 父组不可逆时保留原组框，不写入无效位置。
                        if (framePoint !== null) {
                            this._hooks.groupFrame.position.set(framePoint.x, framePoint.y);
                            this._hooks.groupFrame.matrix.set([
                                frameState.localMatrix[0], frameState.localMatrix[1], 0,
                                frameState.localMatrix[3], frameState.localMatrix[4], 0,
                                framePoint.x, framePoint.y, 1,
                            ]);
                        }
                        const movedCorners: Vec2[] = [];
                        // 组框角点与 Mesh 位置使用同一世界位移。
                        for (const point of gesture.frame) {
                            movedCorners.push(new Vec2(point.x + deltaX, point.y + deltaY));
                        }
                        this._hooks.groupFrameCorners = movedCorners;
                        this._hooks.groupFrameCustomized = true;
                    }
                    this._hooks.emitCallbacks(this._hooks.onMove, [...changed]);
                    this._hooks.emitCallbacks(this._hooks.onPositionChange, [...changed]);
                    this._hooks.emitCallbacks(this._hooks.onEdit, [...changed]);
                }
            }
        }
    }


    /**
     * 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。
     * @param gesture 尚未缓存顶点的移动手势
     * @example
     * this.captureMoveSnapVertices(gesture);
     * @returns 无返回值。
     */
    public captureMoveSnapVertices(gesture: EditGesture): void {
        const sources: Vec2[] = [];
        const movingMeshes = new Set<Mesh>();
        // 源角点必须取按下时的世界矩阵，避免逐帧吸附产生累计位移。
        for (const state of gesture.snapshots) {
            movingMeshes.add(state.mesh);
            const geometry = state.mesh.data;
            // 只有有效的矩形四角能作为顶点吸附源。
            if (geometry instanceof Rect2D && geometry.width > 0 && geometry.height > 0) {
                const halfWidth = geometry.width * 0.5;
                const halfHeight = geometry.height * 0.5;
                const localCorners = [
                    new Vec2(halfWidth, halfHeight),
                    new Vec2(-halfWidth, halfHeight),
                    new Vec2(-halfWidth, -halfHeight),
                    new Vec2(halfWidth, -halfHeight),
                ];
                const matrix = state.mesh.getRenderMatrix(this._tool.camera).data;
                // 不读取圆角轮廓节点，只变换外接矩形的四个几何角。
                for (const corner of localCorners) {
                    sources.push(new Vec2(
                        matrix[0] * corner.x + matrix[3] * corner.y + matrix[6],
                        matrix[1] * corner.x + matrix[4] * corner.y + matrix[7],
                    ));
                }
            }
        }
        gesture.snapGeometry = CollectSnapGeometry(this._tool.snapScene,
            new Set([...movingMeshes, ...this._tool.snapExcluded]), this._tool.camera);
        gesture.snapSources = sources;
        gesture.snapTargets = gesture.snapGeometry.vertices;
    }


    /**
     * 查找原始拖动位置附近最近的矩形顶点，并返回整批对象共用的位移。
     * @param gesture 当前移动快照
     * @param rawX 尚未吸附的世界横向位移
     * @param rawY 尚未吸附的世界纵向位移
     * @param bounds 移动对象的联合世界边界
     * @param lockedAxis 屏幕轴锁定对应的世界方向，未锁定时为 null
     * @example
     * const candidate = this.findMoveVertexSnap(gesture, dx, dy, bounds, null);
     * @returns 半径内最近的合法顶点候选，或 null。
     */
    public findMoveVertexSnap(
        gesture: EditGesture,
        rawX: number,
        rawY: number,
        bounds: RectBounds,
        lockedAxis: Vec2 | null,
    ): MoveSnapCandidate | null {
        // 首次进入顶点吸附时建立本次手势的固定源和目标快照。
        if (gesture.snapSources === undefined || gesture.snapTargets === undefined) {
            this.captureMoveSnapVertices(gesture);
        }
        const sources = gesture.snapSources ?? [];
        const targetGeometry = gesture.snapGeometry ?? { vertices: [], segments: [] };
        let closest: MoveSnapCandidate | null = null;
        let closestDistanceSquared = this._tool.radius * this._tool.radius + Number.EPSILON;
        // 一批移动对象中任意一个角点靠近目标，都让整批对象保持相同位移。
        for (const source of sources) {
            const rawPoint = new Vec2(source.x + rawX, source.y + rawY);
            const rawClient = this._tool.camera.worldToWindow(rawPoint, this._tool.render);
            const targets = NearbySnapPoints(rawPoint, targetGeometry, this._tool.snapOptions,
                this._tool.radius, this._tool.camera, this._tool.render);
            // 先比较 CSS 像素距离，再计算候选位移与世界活动区域。
            for (const target of targets) {
                const targetClient = this._tool.camera.worldToWindow(target, this._tool.render);
                const distanceX = targetClient.x - rawClient.x;
                const distanceY = targetClient.y - rawClient.y;
                const distanceSquared = distanceX * distanceX + distanceY * distanceY;
                // 超出容差或不比已找到的目标更近时不替换候选。
                if (distanceSquared < closestDistanceSquared) {
                    let deltaX = target.x - source.x;
                    let deltaY = target.y - source.y;
                    // 锁轴时只允许沿屏幕轴移动，偏离该轴的顶点不能精确吸附。
                    if (lockedAxis !== null) {
                        const projectedDelta = deltaX * lockedAxis.x + deltaY * lockedAxis.y;
                        deltaX = projectedDelta * lockedAxis.x;
                        deltaY = projectedDelta * lockedAxis.y;
                    }
                    const snappedClient = this._tool.camera.worldToWindow(new Vec2(source.x + deltaX, source.y + deltaY), this._tool.render);
                    const alignmentError = Math.hypot(targetClient.x - snappedClient.x, targetClient.y - snappedClient.y);
                    const withinBounds = deltaX >= this._tool.left - bounds.left && deltaX <= this._tool.right - bounds.right &&
                        deltaY >= this._tool.bottom - bounds.bottom && deltaY <= this._tool.top - bounds.top;
                    // 浮点误差内才视为精确对齐，锁轴时不留下可见的顶点间隙。
                    if (alignmentError <= 0.001 && withinBounds) {
                        closest = { deltaX, deltaY, distance: Math.sqrt(distanceSquared) };
                        closestDistanceSquared = distanceSquared;
                    }
                }
            }
        }
        return closest;
    }
}

interface RectMotionHooks {
/**
     * 将世界坐标投影吸附到以零为起点的步进网格。
     * @param coordinate 世界坐标或世界轴上的投影值
     * @example
     * const x = this.snapWorldCoordinate(17);
     * @returns 最近的全局网格坐标。
     */
    snapWorldCoordinate(coordinate: number): number;
    /** 主编辑器当前的 groupFrame 状态。 */
    groupFrame: Mesh | null;
    /** 主编辑器当前的 groupFrameCorners 状态。 */
    groupFrameCorners: Vec2[] | null;
    /** 主编辑器当前的 groupFrameCustomized 状态。 */
    groupFrameCustomized: boolean;
    /**
     * 触发同一事件的全部具名监听，参数使用调用处提供的快照。
     * @param callbacks 该事件的监听集合
     * @param args 传给每个监听的参数
     * @example
     * this.emitCallbacks(this._onSelect, added, actives);
     * @returns 无返回值。
     */
    emitCallbacks<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void;
    /** 主编辑器当前的 onMove 状态。 */
    readonly onMove: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onPositionChange 状态。 */
    readonly onPositionChange: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onEdit 状态。 */
    readonly onEdit: Map<string, (actives: Mesh[]) => void>;
}

export default RectMotion;
export type { RectMotionHooks };
