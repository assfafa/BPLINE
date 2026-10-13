import { Vec2 } from "bpmatrixjs/Math/Vec2";
import Rect2D from "../../Geometry/Rect2D";
import Mesh from "../../Mesh";
import {
    NearbySnapPoints,
    RotationSnapTargets,
} from "../Snap";
import { FindRotationSnap } from "../Snap/RotationSnap";
import { ToLocal, ToParent, TransformWorldMatrix, WorldToLocalMatrix } from "./geometry";
import type RectEditTool from "./index";
import type { AffineTransform, EditGesture, RectBounds, RectHandle, ResizeEdges } from "./types";

/** Rect 编辑器的 resize 操作，复用主编辑器的实时配置和通知。 */
class RectResize {
    private readonly _tool: RectEditTool;
    private readonly _hooks: RectResizeHooks;

    /** @param tool 主编辑器 @param hooks 状态和通知入口 @example new RectResize(tool, hooks); @returns 操作模块。 */
    public constructor(tool: RectEditTool, hooks: RectResizeHooks) {
        this._tool = tool;
        this._hooks = hooks;
    }


    /**
     * 将世界坐标投影吸附到以零为起点的步进网格。
     * @param coordinate 世界坐标或世界轴上的投影值
     * @example
     * const x = this.snapWorldCoordinate(17);
     * @returns 最近的全局网格坐标。
     */
    public snapWorldCoordinate(coordinate: number): number {
        return Math.round(coordinate / this._tool.translationStep) * this._tool.translationStep;
    }


    /**
     * 将被拖动的局部边投影到世界轴，并吸附到从世界原点开始的网格。
     * @param matrix 按下时矩形的世界矩阵
     * @param coordinate 被拖动边的局部 X 或 Y 坐标
     * @param axis 被拖动边移动所沿的局部轴
     * @example
     * const right = this.snapEdgeToWorldGrid(matrix, 43, "x");
     * @returns 吸附后的局部边坐标；轴退化时保持原坐标。
     */
    public snapEdgeToWorldGrid(matrix: ArrayLike<number>, coordinate: number, axis: "x" | "y"): number {
        let axisX = matrix[0];
        let axisY = matrix[1];
        // 纵向边沿矩形第二个世界轴移动。
        if (axis === "y") {
            axisX = matrix[3];
            axisY = matrix[4];
        }
        const axisLength = Math.hypot(axisX, axisY);
        // 零长度轴无法把世界步长换回局部尺寸。
        if (axisLength > Number.EPSILON) {
            const projectedOrigin = (matrix[6] * axisX + matrix[7] * axisY) / axisLength;
            const projectedEdge = projectedOrigin + coordinate * axisLength;
            const snappedEdge = this.snapWorldCoordinate(projectedEdge);
            return (snappedEdge - projectedOrigin) / axisLength;
        } else {
            return coordinate;
        }
    }


    /**
     * 尺寸手势中让活动角贴合其他矩形顶点；与步进同时开启时采用屏幕距离较近者。
     * @param gesture 当前尺寸手势
     * @param matrix 按下时的世界矩阵
     * @param handle 被拖动的边或角
     * @param raw 未经过步进的局部边界
     * @param stepped 已经过步进的局部边界
     * @param width 按下时的宽度
     * @param height 按下时的高度
     * @example
     * const edges = this.snapResizeVertices(gesture, matrix, handle, raw, stepped, width, height);
     * @returns 最近的有效顶点吸附边界，或原步进结果。
     */
    public snapResizeVertices(
        gesture: EditGesture,
        matrix: ArrayLike<number>,
        handle: RectHandle,
        raw: ResizeEdges,
        stepped: ResizeEdges,
        width: number,
        height: number,
    ): ResizeEdges {
        // 未启用顶点吸附时保持已有的世界网格步进结果。
        if (this._tool.snap) {
            // 第一次需要目标顶点时冻结场景快照，避免拖动过程中目标改变。
            if (gesture.snapTargets === undefined) {
                this._hooks.captureMoveSnapVertices(gesture);
            }
            const targetGeometry = gesture.snapGeometry ?? { vertices: [], segments: [] };
            const movingX: ("left" | "right")[] = [];
            const movingY: ("bottom" | "top")[] = [];
            // 横向手柄只允许对应的活动边移动，纯纵向手柄保留两端角。
            if (handle.includes("w")) {
                movingX.push("left");
            } else {
                // 右边手柄只移动右侧；无横向分量时上下两个端点都可吸附。
                if (handle.includes("e")) {
                    movingX.push("right");
                } else {
                    movingX.push("left", "right");
                }
            }
            // 纵向手柄也只更新活动边，避免吸附拖动固定对边。
            if (handle.includes("s")) {
                movingY.push("bottom");
            } else {
                // 上边手柄只移动上侧；纯横向边有两个可吸附端点。
                if (handle.includes("n")) {
                    movingY.push("top");
                } else {
                    movingY.push("bottom", "top");
                }
            }
            let best: ResizeEdges | null = null;
            let bestDistance = this._tool.radius + Number.EPSILON;
            const corner = movingX.length === 1 && movingY.length === 1;
            // 只有活动角的轨迹可以触发吸附；固定边对应的角不会带动尺寸。
            for (const xSide of movingX) {
                // 单边拥有两个端点，四角手柄只有一个活动端点。
                for (const ySide of movingY) {
                    const rawX = raw[xSide];
                    const rawY = raw[ySide];
                    const rawWorld = new Vec2(
                        matrix[0] * rawX + matrix[3] * rawY + matrix[6],
                        matrix[1] * rawX + matrix[4] * rawY + matrix[7],
                    );
                    const rawClient = this._tool.camera.worldToWindow(rawWorld, this._tool.render);
                    const targets = NearbySnapPoints(rawWorld, targetGeometry, this._tool.snapOptions,
                        this._tool.radius, this._tool.camera, this._tool.render);
                    const stepWorld = new Vec2(
                        matrix[0] * stepped[xSide] + matrix[3] * stepped[ySide] + matrix[6],
                        matrix[1] * stepped[xSide] + matrix[4] * stepped[ySide] + matrix[7],
                    );
                    const stepClient = this._tool.camera.worldToWindow(stepWorld, this._tool.render);
                    let stepDistance = Infinity;
                    // 没有启用步进时，顶点候选无需与网格候选比较。
                    if (this._tool.translationStepEnabled) {
                        stepDistance = Math.hypot(stepClient.x - rawClient.x, stepClient.y - rawClient.y);
                    }
                    // 只检查冻结的其他矩形角点，保证一次操作内目标稳定。
                    for (const target of targets) {
                        const targetClient = this._tool.camera.worldToWindow(target, this._tool.render);
                        const distance = Math.hypot(targetClient.x - rawClient.x, targetClient.y - rawClient.y);
                        // 顶点必须在容差内且比当前步进候选更靠近原始拖动位置。
                        if (distance < bestDistance && distance < stepDistance) {
                            const local = ToLocal(matrix, target);
                            // 无法把世界目标映射回源矩形时不修改尺寸。
                            if (local !== null) {
                                const candidate: ResizeEdges = { ...raw };
                                // 等比角缩放必须沿固定角到活动角的同一条射线。
                                if (this._tool.constrain && corner) {
                                    let fixedX = -width * 0.5;
                                    let fixedY = -height * 0.5;
                                    // 被拖动左角时对角右边保持固定。
                                    if (xSide === "left") {
                                        fixedX = width * 0.5;
                                    }
                                    // 被拖动下角时对角上边保持固定。
                                    if (ySide === "bottom") {
                                        fixedY = height * 0.5;
                                    }
                                    let directionX = width;
                                    let directionY = height;
                                    // 越过固定角后沿新的水平方向继续等比缩放。
                                    if (rawX < fixedX) {
                                        directionX = -width;
                                    }
                                    // 垂直方向也保留越过固定角后的拖动方向。
                                    if (rawY < fixedY) {
                                        directionY = -height;
                                    }
                                    const factor = ((local.x - fixedX) * directionX +
                                        (local.y - fixedY) * directionY) /
                                        (directionX * directionX + directionY * directionY);
                                    // 反向或零倍率会让矩形塌缩，交给原始尺寸逻辑处理。
                                    if (factor > 0) {
                                        candidate[xSide] = fixedX + directionX * factor;
                                        candidate[ySide] = fixedY + directionY * factor;
                                    }
                                } else {
                                    // 单边仅在该边的轴向上对齐，另一轴必须原本就贴合目标。
                                    if (movingX.length === 1) {
                                        candidate[xSide] = local.x;
                                    }
                                    // 纵向活动边同理，不移动其固定横坐标。
                                    if (movingY.length === 1) {
                                        candidate[ySide] = local.y;
                                    }
                                }
                                const snappedWorld = new Vec2(
                                    matrix[0] * candidate[xSide] + matrix[3] * candidate[ySide] + matrix[6],
                                    matrix[1] * candidate[xSide] + matrix[4] * candidate[ySide] + matrix[7],
                                );
                                const snappedClient = this._tool.camera.worldToWindow(snappedWorld, this._tool.render);
                                const alignment = Math.hypot(snappedClient.x - targetClient.x, snappedClient.y - targetClient.y);
                                // 单边与等比操作只有在目标确实处于可移动轨迹上时才吸附。
                                if (alignment <= 0.5) {
                                    best = candidate;
                                    bestDistance = distance;
                                }
                            }
                        }
                    }
                }
            }
            // 没有更近且精确的顶点时保留步进或原始尺寸。
            if (best === null) {
                return stepped;
            } else {
                return best;
            }
        } else {
            return stepped;
        }
    }


    /**
     * 拖动边或角时修改一个 Rect2D 的局部宽高及中心位置。
     * @param gesture 本次尺寸编辑快照
     * @example
     * this.applyResize(gesture);
     * @returns 无返回值。
     */
    public applyResize(gesture: EditGesture): void {
        const mesh = gesture.target;
        const handle = gesture.handle;
        const matrix = gesture.matrix;
        const width = gesture.width;
        const height = gesture.height;
        const state = gesture.snapshots.at(0);
        // 尺寸编辑需要按下时的矩阵和几何快照。
        if (mesh !== undefined && handle !== undefined && matrix !== undefined && width !== undefined && height !== undefined && state !== undefined) {
            const start = ToLocal(matrix, gesture.startWorld);
            const current = ToLocal(matrix, gesture.currentWorld);
            // 父级变换不可逆时无法可靠移动边或角。
            if (start !== null && current !== null) {
                let left = -width * 0.5;
                let right = width * 0.5;
                let bottom = -height * 0.5;
                let top = height * 0.5;
                const moveLeft = handle.includes("w");
                const moveRight = handle.includes("e");
                const moveBottom = handle.includes("s");
                const moveTop = handle.includes("n");
                // 保留越过对边后的移动坐标，后续据此交换左右边。
                if (moveLeft) {
                    left += current.x - start.x;
                }
                // 右侧手柄固定左边，改变右边坐标。
                if (moveRight) {
                    right += current.x - start.x;
                }
                // 下侧手柄固定上边，改变下边坐标。
                if (moveBottom) {
                    bottom += current.y - start.y;
                }
                // 上侧手柄固定下边，改变上边坐标。
                if (moveTop) {
                    top += current.y - start.y;
                }
                const rawEdges: ResizeEdges = { left, right, bottom, top };
                // 吸附被拖动边的世界位置，固定的对边继续留在原位。
                if (this._tool.translationStepEnabled && Number.isFinite(this._tool.translationStep) && this._tool.translationStep > 0) {
                    // 只有参与本次手势的边才会改变网格位置。
                    if (moveLeft) {
                        left = this.snapEdgeToWorldGrid(matrix, left, "x");
                    }
                    // 右边手柄独立吸附，左边固定不动。
                    if (moveRight) {
                        right = this.snapEdgeToWorldGrid(matrix, right, "x");
                    }
                    // 下边手柄独立吸附，上边固定不动。
                    if (moveBottom) {
                        bottom = this.snapEdgeToWorldGrid(matrix, bottom, "y");
                    }
                    // 上边手柄独立吸附，下边固定不动。
                    if (moveTop) {
                        top = this.snapEdgeToWorldGrid(matrix, top, "y");
                    }
                }
                const snappedEdges = this.snapResizeVertices(
                    gesture, matrix, handle, rawEdges, { left, right, bottom, top }, width, height,
                );
                left = snappedEdges.left;
                right = snappedEdges.right;
                bottom = snappedEdges.bottom;
                top = snappedEdges.top;
                const rawWidth = Math.abs(right - left);
                const rawHeight = Math.abs(top - bottom);
                let newWidth = width;
                let newHeight = height;
                const corner = (moveLeft || moveRight) && (moveTop || moveBottom);
                // 四角约束使用同一个倍率；固定对角点仍由后面的边界重建处理。
                if (this._tool.constrain && corner && width > 0 && height > 0) {
                    const widthFactor = rawWidth / width;
                    const heightFactor = rawHeight / height;
                    let factor = widthFactor;
                    // 采用变化更明显的轴，单轴拖动四角也能缩放整个矩形。
                    if (Math.abs(heightFactor - 1) > Math.abs(widthFactor - 1)) {
                        factor = heightFactor;
                    }
                    const minimumFactor = Math.max(this._tool.minWidth / width, this._tool.minHeight / height, 0.000001);
                    const maximumFactor = Math.min(
                        this._tool.maxWidth / width,
                        this._tool.maxHeight / height,
                        Math.sqrt(this._tool.max / (width * height)),
                    );
                    // 无法满足最小与最大尺寸时保留按下前的尺寸。
                    if (minimumFactor <= maximumFactor) {
                        factor = Math.max(minimumFactor, Math.min(maximumFactor, factor));
                        newWidth = width * factor;
                        newHeight = height * factor;
                    }
                } else if (moveLeft || moveRight) {
                    // 单边或普通四角调整沿横轴限制宽度。
                    const widthLimit = Math.min(this._tool.maxWidth, this._tool.max / Math.max(rawHeight, Number.EPSILON));
                    newWidth = Math.max(this._tool.minWidth, 0.000001, Math.min(widthLimit, rawWidth));
                }
                // 等比四角已共同算出宽高，其余情况再单独限制纵向尺寸。
                if ((!this._tool.constrain || !corner) && (moveTop || moveBottom)) {
                    const heightLimit = Math.min(this._tool.maxHeight, this._tool.max / Math.max(newWidth, Number.EPSILON));
                    newHeight = Math.max(this._tool.minHeight, 0.000001, Math.min(heightLimit, rawHeight));
                }
                // 宽度以按下时的对边为锚，过界后拖动边改成另一侧。
                if (moveLeft || moveRight) {
                    let fixedX = -width * 0.5;
                    let movingX = right;
                    let direction = 1;
                    // 从左边开始时固定的是原始右边。
                    if (moveLeft) {
                        fixedX = width * 0.5;
                        movingX = left;
                        direction = -1;
                    }
                    // 手柄越过固定边后继续沿相反方向展开。
                    if ((movingX - fixedX) * direction < 0) {
                        direction = -direction;
                    }
                    const endX = fixedX + direction * newWidth;
                    left = Math.min(fixedX, endX);
                    right = Math.max(fixedX, endX);
                }
                // 高度同样以按下时的对边为锚，允许上下交换。
                if (moveBottom || moveTop) {
                    let fixedY = -height * 0.5;
                    let movingY = top;
                    let direction = 1;
                    // 从下边开始时固定的是原始上边。
                    if (moveBottom) {
                        fixedY = height * 0.5;
                        movingY = bottom;
                        direction = -1;
                    }
                    // 手柄越过固定边后继续沿相反方向展开。
                    if ((movingY - fixedY) * direction < 0) {
                        direction = -direction;
                    }
                    const endY = fixedY + direction * newHeight;
                    bottom = Math.min(fixedY, endY);
                    top = Math.max(fixedY, endY);
                }
                const centerX = (left + right) * 0.5;
                const centerY = (bottom + top) * 0.5;
                const candidateBounds = this.resizedWorldBounds(matrix, centerX, centerY, newWidth, newHeight);
                // 超出尺寸、面积或世界活动区域的结果不予写入。
                if (this.isAllowed(candidateBounds) && Number.isFinite(newWidth) && Number.isFinite(newHeight) &&
                    newWidth >= this._tool.minWidth && newWidth <= this._tool.maxWidth &&
                    newHeight >= this._tool.minHeight && newHeight <= this._tool.maxHeight && newWidth * newHeight <= this._tool.max) {
                    const worldCenter = new Vec2(
                        matrix[0] * centerX + matrix[3] * centerY + matrix[6],
                        matrix[1] * centerX + matrix[4] * centerY + matrix[7],
                    );
                    const parentCenter = ToParent(mesh, worldCenter);
                    // 父级变换不可逆时保留原矩形。
                    if (parentCenter !== null) {
                        const geometry = mesh.data as Rect2D;
                        const sizeChanged = geometry.width !== newWidth || geometry.height !== newHeight;
                        const positionChanged = mesh.position.x !== parentCenter.x || mesh.position.y !== parentCenter.y;
                        // 尺寸或中心发生实际变化后才更新 GPU 数据。
                        if (sizeChanged || positionChanged) {
                            // 共享几何体只在真实尺寸变化时复制，平移中心无需分离。
                            if (sizeChanged) {
                                const editableGeometry = this._hooks.uniqueGeometry(mesh);
                                editableGeometry.width = newWidth;
                                editableGeometry.height = newHeight;
                            }
                            mesh.position.set(parentCenter.x, parentCenter.y);
                            // 保留组缩放后可能出现的仿射轴，参数更新不能把它重建成旧 TRS。
                            mesh.matrix.set([
                                state.localMatrix[0], state.localMatrix[1], 0,
                                state.localMatrix[3], state.localMatrix[4], 0,
                                parentCenter.x, parentCenter.y, 1,
                            ]);
                            // 矩形局部宽高确实改变时才报告 resize。
                            if (sizeChanged) {
                                this._hooks.emitCallbacks(this._hooks.onResize, mesh);
                            }
                            // 中心变化与局部宽高变化分别通知。
                            if (positionChanged) {
                                this._hooks.emitCallbacks(this._hooks.onPositionChange, [mesh]);
                            }
                            this._hooks.emitCallbacks(this._hooks.onEdit, [mesh]);
                        }
                    }
                }
            }
        }
    }


    /**
     * 绕单个矩形自身中心旋转完整仿射轴，同时保留父级层次与历史快照。
     * @param gesture 从单体旋转端点开始的手势
     * @example
     * this.applyRectRotation(gesture);
     * @returns 无返回值。
     */
    public applyRectRotation(gesture: EditGesture): void {
        const target = gesture.target;
        const state = gesture.snapshots[0];
        // 手势中途关闭旋转后不再修改对象。
        if (this._tool.rotationEnabled && target !== undefined && gesture.snapshots.length > 0) {
            const geometry = target.data;
            // 只处理仍然带有 Rect2D 几何的选中对象。
            if (geometry instanceof Rect2D) {
                const initialAngle = Math.atan2(
                    gesture.startWorld.y - state.worldY,
                    gesture.startWorld.x - state.worldX,
                );
                const currentAngle = Math.atan2(
                    gesture.currentWorld.y - state.worldY,
                    gesture.currentWorld.x - state.worldX,
                );
                const previousAngle = gesture.rotationPointerAngle ?? initialAngle;
                let increment = currentAngle - previousAngle;
                // 越过 atan2 的正负 π 分界时继续沿原方向累计。
                if (increment > Math.PI) {
                    increment -= Math.PI * 2;
                } else if (increment < -Math.PI) {
                    // 从负 π 跳到正 π 也应继续累计同一方向的旋转。
                    increment += Math.PI * 2;
                }
                gesture.rotationPointerAngle = currentAngle;
                gesture.rotationTotal = (gesture.rotationTotal ?? 0) + increment;
                const rawAngle = gesture.rotationTotal;
                let angle = rawAngle;
                let stepAngle: number | null = null;
                // 步进按累计转角而非上一帧矩阵舍入，避免连续拖动抖动。
                if (this._tool.rotationStepEnabled && Number.isFinite(this._tool.rotationStep) && this._tool.rotationStep > 0) {
                    const stepRadians = this._tool.rotationStep * Math.PI / 180;
                    angle = Math.round(angle / stepRadians) * stepRadians;
                    stepAngle = angle;
                }
                // 顶点目标决定旋转方向，屏幕容差由当前指针到中心的距离换算。
                if (this._tool.snap) {
                    // 首次参与旋转吸附时冻结源和目标角点。
                    if (gesture.snapSources === undefined || gesture.snapTargets === undefined) {
                        this._hooks.captureMoveSnapVertices(gesture);
                    }
                    const snapped = FindRotationSnap({
                        pivot: new Vec2(state.worldX, state.worldY),
                        sources: gesture.snapSources ?? [],
                        targets: RotationSnapTargets(new Vec2(state.worldX, state.worldY),
                            gesture.snapSources ?? [], rawAngle,
                            gesture.snapGeometry ?? { vertices: [], segments: [] }, this._tool.snapOptions,
                            this._tool.radius, this._tool.camera, this._tool.render),
                        rawAngle,
                        stepAngle,
                        cursor: gesture.currentClient,
                        radius: this._tool.radius,
                        camera: this._tool.camera,
                        render: this._tool.render,
                    });
                    // 只有顶点目标比角度步进更靠近鼠标时覆盖步进角度。
                    if (snapped !== null) {
                        angle = snapped;
                    }
                }
                const cosine = Math.cos(angle);
                const sine = Math.sin(angle);
                const transform: AffineTransform = {
                    xx: cosine,
                    xy: -sine,
                    yx: sine,
                    yy: cosine,
                    x: state.worldX - cosine * state.worldX + sine * state.worldY,
                    y: state.worldY - sine * state.worldX - cosine * state.worldY,
                    basisXX: cosine,
                    basisXY: -sine,
                    basisYX: sine,
                    basisYY: cosine,
                };
                const worldMatrix = TransformWorldMatrix(transform, state.worldMatrix);
                const localMatrix = WorldToLocalMatrix(target, worldMatrix);
                const bounds = this.resizedWorldBounds(worldMatrix, 0, 0, geometry.width, geometry.height);
                // 旋转后的每个角仍须位于允许的世界区域内。
                if (localMatrix !== null && this.isAllowed(bounds)) {
                    const previous = target.ensureMatrix().data;
                    let changed = false;
                    // 步进停留在同一档位时避免重复写入矩阵与发出事件。
                    for (let index = 0; index < localMatrix.length; index++) {
                        // 只要一个仿射分量变化，就需要同步 Mesh。
                        if (previous[index] !== localMatrix[index]) {
                            changed = true;
                        }
                    }
                    // 真正发生旋转才通知监听与撤销系统。
                    if (changed) {
                        target.rotation = state.rotation + angle;
                        target.position.set(localMatrix[6], localMatrix[7]);
                        target.matrix.set(localMatrix);
                        this._hooks.emitCallbacks(this._hooks.onRotate, [target]);
                        this._hooks.emitCallbacks(this._hooks.onEdit, [target]);
                    }
                }
            }
        }
    }


    /**
     * 读取矩形候选尺寸对应的世界轴向包围盒。
     * @param matrix 按下时的世界矩阵
     * @param centerX 新局部中心 X
     * @param centerY 新局部中心 Y
     * @param width 新局部宽度
     * @param height 新局部高度
     * @example
     * const bounds = this.resizedWorldBounds(matrix, x, y, width, height);
     * @returns 变换后四角的世界并集。
     */
    public resizedWorldBounds(matrix: ArrayLike<number>, centerX: number, centerY: number, width: number, height: number): RectBounds {
        const worldX = matrix[0] * centerX + matrix[3] * centerY + matrix[6];
        const worldY = matrix[1] * centerX + matrix[4] * centerY + matrix[7];
        const halfX = (Math.abs(matrix[0]) * width + Math.abs(matrix[3]) * height) * 0.5;
        const halfY = (Math.abs(matrix[1]) * width + Math.abs(matrix[4]) * height) * 0.5;
        return { left: worldX - halfX, right: worldX + halfX, bottom: worldY - halfY, top: worldY + halfY };
    }


    /**
     * 检查候选对象是否完全在世界活动区域内。
     * @param bounds 世界轴向包围盒
     * @example
     * const allowed = this.isAllowed(bounds);
     * @returns 是否位于限制范围内。
     */
    public isAllowed(bounds: RectBounds): boolean {
        return bounds.left >= this._tool.left && bounds.right <= this._tool.right &&
            bounds.bottom >= this._tool.bottom && bounds.top <= this._tool.top;
    }
}

interface RectResizeHooks {
/**
     * 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。
     * @param gesture 尚未缓存顶点的移动手势
     * @example
     * this.captureMoveSnapVertices(gesture);
     * @returns 无返回值。
     */
    captureMoveSnapVertices(gesture: EditGesture): void;
    /**
     * 避免缩放一个 Mesh 时意外改变共用同一 Geometry 的其他实例。
     * @param mesh 被调整的矩形
     * @example
     * const geometry = this.uniqueGeometry(mesh);
     * @returns 仅由该 Mesh 使用的 Rect2D。
     */
    uniqueGeometry(mesh: Mesh): Rect2D;
    /**
     * 触发同一事件的全部具名监听，参数使用调用处提供的快照。
     * @param callbacks 该事件的监听集合
     * @param args 传给每个监听的参数
     * @example
     * this.emitCallbacks(this._onSelect, added, actives);
     * @returns 无返回值。
     */
    emitCallbacks<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void;
    /** 主编辑器当前的 onResize 状态。 */
    readonly onResize: Map<string, (mesh: Mesh) => void>;
    /** 主编辑器当前的 onPositionChange 状态。 */
    readonly onPositionChange: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onEdit 状态。 */
    readonly onEdit: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onRotate 状态。 */
    readonly onRotate: Map<string, (actives: Mesh[]) => void>;
}

export default RectResize;
export type { RectResizeHooks };
