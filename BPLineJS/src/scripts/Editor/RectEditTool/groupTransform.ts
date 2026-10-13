import { Vec2 } from "bpmatrixjs/Math/Vec2";
import Rect2D from "../../Geometry/Rect2D";
import Mesh from "../../Mesh";
import {
    RotationSnapTargets, UniformScaleSnapTargets,
} from "../Snap";
import { FindRotationSnap } from "../Snap/RotationSnap";
import { FindUniformScaleSnap } from "../Snap/UniformScaleSnap";
import { TransformPoint, TransformWorldMatrix, WorldToLocalMatrix } from "./geometry";
import type RectEditTool from "./index";
import type { AffineTransform, EditGesture, GroupCandidate, MatrixValues, RectBounds } from "./types";

/** Rect 编辑器的 groupTransform 操作，复用主编辑器的实时配置和通知。 */
class RectGroupTransform {
    private readonly _tool: RectEditTool;
    private readonly _hooks: RectGroupTransformHooks;

    /** @param tool 主编辑器 @param hooks 状态和通知入口 @example new RectGroupTransform(tool, hooks); @returns 操作模块。 */
    public constructor(tool: RectEditTool, hooks: RectGroupTransformHooks) {
        this._tool = tool;
        this._hooks = hooks;
    }


    /**
     * 从被拖动的边或角构造组框局部轴上的缩放，越过对边时保留负比例。
     * @param gesture 本次组缩放手势
     * @returns 世界仿射变换；组框退化时为 null。
     * @example
     * const transform = this.groupScaleTransform(gesture);
     */
    public groupScaleTransform(gesture: EditGesture): AffineTransform | null {
        const frame = gesture.frame;
        const handle = gesture.handle;
        // 缩放需要原始组框和确定的边或角。
        if (frame !== undefined && handle !== undefined) {
            const origin = frame[0];
            const axisX = new Vec2(frame[1].x - origin.x, frame[1].y - origin.y);
            const axisY = new Vec2(frame[3].x - origin.x, frame[3].y - origin.y);
            const determinant = axisX.x * axisY.y - axisX.y * axisY.x;
            // 面积为零的组框没有可靠的局部坐标。
            if (Math.abs(determinant) > Number.EPSILON) {
                const deltaX = gesture.currentWorld.x - gesture.startWorld.x;
                const deltaY = gesture.currentWorld.y - gesture.startWorld.y;
                let horizontalDelta = (axisY.y * deltaX - axisY.x * deltaY) / determinant;
                let verticalDelta = (-axisX.y * deltaX + axisX.x * deltaY) / determinant;
                const rawHorizontalDelta = horizontalDelta;
                const rawVerticalDelta = verticalDelta;
                // 组框的活动边投影到世界轴后，以世界原点为步进起点。
                if (this._tool.translationStepEnabled && Number.isFinite(this._tool.translationStep) && this._tool.translationStep > 0) {
                    const horizontalLength = axisX.len();
                    const verticalLength = axisY.len();
                    // 横向活动边的当前投影减去按下时投影，得到吸附后的组框轴位移。
                    if (handle.includes("e") || handle.includes("w")) {
                        let movingCorner = frame[0];
                        // 右边使用右下角的投影，左边使用左下角的投影。
                        if (handle.includes("e")) {
                            movingCorner = frame[1];
                        }
                        const edgeProjection = (movingCorner.x * axisX.x + movingCorner.y * axisX.y) / horizontalLength;
                        const snappedProjection = this._hooks.snapWorldCoordinate(edgeProjection + horizontalDelta * horizontalLength);
                        horizontalDelta = (snappedProjection - edgeProjection) / horizontalLength;
                    }
                    // 纵向活动边同样独立吸附，拖角时两个方向都能对齐世界网格。
                    if (handle.includes("n") || handle.includes("s")) {
                        let movingCorner = frame[0];
                        // 上边使用左上角的投影，下边使用左下角的投影。
                        if (handle.includes("n")) {
                            movingCorner = frame[3];
                        }
                        const edgeProjection = (movingCorner.x * axisY.x + movingCorner.y * axisY.y) / verticalLength;
                        const snappedProjection = this._hooks.snapWorldCoordinate(edgeProjection + verticalDelta * verticalLength);
                        verticalDelta = (snappedProjection - edgeProjection) / verticalLength;
                    }
                }
                let factorX = 1;
                let factorY = 1;
                let anchorX = 0.5;
                let anchorY = 0.5;
                // 对边是横向固定锚点；越界后有符号比例自然翻转。
                if (handle.includes("e")) {
                    factorX += horizontalDelta;
                    anchorX = 0;
                } else if (handle.includes("w")) {
                    // 左边以右侧为锚点，方向与右边相反。
                    factorX -= horizontalDelta;
                    anchorX = 1;
                }
                // 纵向边沿组框自身的第二个局部轴移动。
                if (handle.includes("n")) {
                    factorY += verticalDelta;
                    anchorY = 0;
                } else if (handle.includes("s")) {
                    // 下边以顶部为锚点，方向与上边相反。
                    factorY -= verticalDelta;
                    anchorY = 1;
                }
                const corner = (handle.includes("e") || handle.includes("w")) &&
                    (handle.includes("n") || handle.includes("s"));
                // 组框四角在约束模式下共用同一个倍率，避免对象被拉成不同宽高比。
                if (this._tool.constrain && corner) {
                    let factor = factorX;
                    // 让位移更明显的组框轴决定统一缩放量。
                    if (Math.abs(factorY - 1) > Math.abs(factorX - 1)) {
                        factor = factorY;
                    }
                    factorX = factor;
                    factorY = factor;
                }
                // 独立矩形编辑器不生成斜切：整组与内部矩形共用同一缩放幅度。
                if (!this._tool.fromCollection) {
                    let magnitude = Math.abs(factorX);
                    const verticalEdge = (handle.includes("n") || handle.includes("s")) &&
                        !handle.includes("e") && !handle.includes("w");
                    // 单独拖动上下边时，纵向拖动量决定整组的倍率。
                    if (verticalEdge) {
                        magnitude = Math.abs(factorY);
                    } else if (corner && Math.abs(factorY - 1) > Math.abs(factorX - 1)) {
                        // 拖动角点时取变化更明显的轴，保持用户拖动的主方向。
                        magnitude = Math.abs(factorY);
                    }
                    // 穿过固定边时只翻转对应轴的位置映射，矩形本身继续正面显示。
                    if (factorX < 0) {
                        factorX = -magnitude;
                    } else {
                        factorX = magnitude;
                    }
                    // 另一轴同样只保留原来的翻转方向，不产生不等比基向量。
                    if (factorY < 0) {
                        factorY = -magnitude;
                    } else {
                        factorY = magnitude;
                    }
                }
                // 独立编辑器的组缩放保持等比；顶点吸附也只沿同一倍率射线求解。
                if (this._tool.snap && !this._tool.fromCollection) {
                    // 首次查询时冻结参与组缩放的顶点和场景目标。
                    if (gesture.snapSources === undefined || gesture.snapTargets === undefined) {
                        this._hooks.captureMoveSnapVertices(gesture);
                    }
                    const pivot = new Vec2(
                        origin.x + axisX.x * anchorX + axisY.x * anchorY,
                        origin.y + axisX.y * anchorX + axisY.y * anchorY,
                    );
                    let rawFactorX = 1;
                    let rawFactorY = 1;
                    // 从未经步进的指针位移恢复横向原始倍率，用于距离比较。
                    if (handle.includes("e")) {
                        rawFactorX += rawHorizontalDelta;
                    } else {
                        // 左边拖动时缩放方向与右边相反。
                        if (handle.includes("w")) {
                            rawFactorX -= rawHorizontalDelta;
                        }
                    }
                    // 纵向原始倍率同样保持上、下边不同的方向。
                    if (handle.includes("n")) {
                        rawFactorY += rawVerticalDelta;
                    } else {
                        // 下边从对边往回移动时缩小组框。
                        if (handle.includes("s")) {
                            rawFactorY -= rawVerticalDelta;
                        }
                    }
                    let rawMagnitude = Math.abs(rawFactorX);
                    const verticalEdge = (handle.includes("n") || handle.includes("s")) &&
                        !handle.includes("e") && !handle.includes("w");
                    // 垂直边和垂直位移占主导的角以纵向倍率为准。
                    if (verticalEdge || (corner && Math.abs(rawFactorY - 1) > Math.abs(rawFactorX - 1))) {
                        rawMagnitude = Math.abs(rawFactorY);
                    }
                    let signX = 1;
                    let signY = 1;
                    // 穿过固定边后的镜像只影响位置映射，模型仍保持正面。
                    if (rawFactorX < 0) {
                        signX = -1;
                    }
                    // 纵向穿过固定边时同步保留对应的符号。
                    if (rawFactorY < 0) {
                        signY = -1;
                    }
                    const signedSources: Vec2[] = [];
                    // 把源角映射到拖动方向的射线，再由共用倍率函数寻找目标。
                    for (const source of gesture.snapSources ?? []) {
                        const relativeX = source.x - pivot.x;
                        const relativeY = source.y - pivot.y;
                        const coordinateX = (axisY.y * relativeX - axisY.x * relativeY) / determinant;
                        const coordinateY = (-axisX.y * relativeX + axisX.x * relativeY) / determinant;
                        signedSources.push(new Vec2(
                            pivot.x + axisX.x * coordinateX * signX + axisY.x * coordinateY * signY,
                            pivot.y + axisX.y * coordinateX * signX + axisY.y * coordinateY * signY,
                        ));
                    }
                    let stepFactor: number | null = null;
                    // 启用步进时使用已吸附到网格的倍率作另一候选。
                    if (this._tool.translationStepEnabled && Number.isFinite(this._tool.translationStep) && this._tool.translationStep > 0) {
                        stepFactor = Math.abs(factorX);
                    }
                    const snapped = FindUniformScaleSnap({
                        pivot,
                        sources: signedSources,
                        targets: UniformScaleSnapTargets(pivot, signedSources, rawMagnitude,
                            gesture.snapGeometry ?? { vertices: [], segments: [] }, this._tool.snapOptions,
                            this._tool.radius, this._tool.camera, this._tool.render),
                        rawFactor: rawMagnitude,
                        stepFactor,
                        radius: this._tool.radius,
                        camera: this._tool.camera,
                        render: this._tool.render,
                    });
                    // 找到严格贴合且比步进更近的顶点时替换本次组缩放倍率。
                    if (snapped !== null) {
                        factorX = signX * snapped;
                        factorY = signY * snapped;
                    }
                }
                // 零面积组框无法开始下一轮编辑，保留极薄的正面矩形。
                if (Math.abs(factorX) < 0.000001) {
                    // 负向拖动经过零点时继续保持负的映射方向。
                    if (factorX < 0) {
                        factorX = -0.000001;
                    } else {
                        factorX = 0.000001;
                    }
                }
                // 两个轴分别跨越对边，竖向也避免退化到不可编辑。
                if (Math.abs(factorY) < 0.000001) {
                    // 纵向映射独立保持越界前后的符号。
                    if (factorY < 0) {
                        factorY = -0.000001;
                    } else {
                        factorY = 0.000001;
                    }
                }
                const xx = (axisX.x * factorX * axisY.y - axisY.x * factorY * axisX.y) / determinant;
                const xy = (axisY.x * factorY * axisX.x - axisX.x * factorX * axisY.x) / determinant;
                const yx = (axisX.y * factorX * axisY.y - axisY.y * factorY * axisX.y) / determinant;
                const yy = (axisY.y * factorY * axisX.x - axisX.y * factorX * axisY.x) / determinant;
                const positiveX = Math.abs(factorX);
                const positiveY = Math.abs(factorY);
                const basisXX = (axisX.x * positiveX * axisY.y - axisY.x * positiveY * axisX.y) / determinant;
                const basisXY = (axisY.x * positiveY * axisX.x - axisX.x * positiveX * axisY.x) / determinant;
                const basisYX = (axisX.y * positiveX * axisY.y - axisY.y * positiveY * axisX.y) / determinant;
                const basisYY = (axisY.y * positiveY * axisX.x - axisX.y * positiveX * axisY.x) / determinant;
                const fixedX = origin.x + axisX.x * anchorX + axisY.x * anchorY;
                const fixedY = origin.y + axisX.y * anchorX + axisY.y * anchorY;
                return {
                    xx,
                    xy,
                    yx,
                    yy,
                    x: fixedX - xx * fixedX - xy * fixedY,
                    y: fixedY - yx * fixedX - yy * fixedY,
                    basisXX,
                    basisXY,
                    basisYX,
                    basisYY,
                };
            }
        }
        return null;
    }


    /**
     * 在虚线组边界上缩放或在外侧旋转各个 Mesh，不改变它们的父节点。
     * @param gesture 组操作快照
     * @example
     * this.applyGroupTransform(gesture);
     * @returns 无返回值。
     */
    public applyGroupTransform(gesture: EditGesture): void {
        const frame = gesture.frame;
        // 组变换始终以按下时的组框为基准，避免多帧累计误差。
        if (frame !== undefined) {
            let transform: AffineTransform | null = null;
            let angle = 0;
            // 四边与四角按固定对边缩放，框外拖动才绕中心旋转。
            if (gesture.mode === "scale") {
                transform = this.groupScaleTransform(gesture);
            } else if (gesture.mode === "rotate" && this._tool.rotationEnabled) {
                // 框外旋转只使用组中心与指针之间的角度差。
                const pivotX = (frame[0].x + frame[2].x) * 0.5;
                const pivotY = (frame[0].y + frame[2].y) * 0.5;
                const initialX = gesture.startWorld.x - pivotX;
                const initialY = gesture.startWorld.y - pivotY;
                const currentX = gesture.currentWorld.x - pivotX;
                const currentY = gesture.currentWorld.y - pivotY;
                // 中心点没有可靠角度，不能启动旋转。
                if (Math.hypot(initialX, initialY) > Number.EPSILON) {
                    const rawAngle = Math.atan2(currentY, currentX) - Math.atan2(initialY, initialX);
                    angle = rawAngle;
                    let stepAngle: number | null = null;
                    // 角度步进采用度数配置，但组变换继续使用弧度。
                    if (this._tool.rotationStepEnabled && Number.isFinite(this._tool.rotationStep) && this._tool.rotationStep > 0) {
                        const stepRadians = this._tool.rotationStep * Math.PI / 180;
                        angle = Math.round(angle / stepRadians) * stepRadians;
                        stepAngle = angle;
                    }
                    if (this._tool.snap) {
                        // 整组对象共用一批按下时的四角作为吸附源。
                        if (gesture.snapSources === undefined || gesture.snapTargets === undefined) {
                            this._hooks.captureMoveSnapVertices(gesture);
                        }
                        const snapped = FindRotationSnap({
                            pivot: new Vec2(pivotX, pivotY),
                            sources: gesture.snapSources ?? [],
                            targets: RotationSnapTargets(new Vec2(pivotX, pivotY),
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
                        // 用最接近鼠标方向的顶点对齐角度更新组框和所有对象。
                        if (snapped !== null) {
                            angle = snapped;
                        }
                    }
                    const cosine = Math.cos(angle);
                    const sine = Math.sin(angle);
                    transform = {
                        xx: cosine,
                        xy: -sine,
                        yx: sine,
                        yy: cosine,
                        x: pivotX - cosine * pivotX + sine * pivotY,
                        y: pivotY - sine * pivotX - cosine * pivotY,
                        basisXX: cosine,
                        basisXY: -sine,
                        basisYX: sine,
                        basisYY: cosine,
                    };
                }
            }
            // 无效组框和无效旋转起点维持原有对象状态。
            if (transform !== null) {
                const candidates: GroupCandidate[] = [];
                let valid = true;
                // 先验证整批对象，再同时写入，避免某件越界后留下半组变化。
                for (const state of gesture.snapshots) {
                    const worldMatrix = TransformWorldMatrix(transform, state.worldMatrix);
                    const localMatrix = WorldToLocalMatrix(state.mesh, worldMatrix);
                    const geometry = state.mesh.data;
                    // 只对可逆父级下的普通 Rect2D 计算完整候选变换。
                    if (localMatrix !== null && geometry instanceof Rect2D) {
                        const effectiveWidth = geometry.width * Math.hypot(localMatrix[0], localMatrix[1]);
                        const effectiveHeight = geometry.height * Math.hypot(localMatrix[3], localMatrix[4]);
                        const effectiveArea = geometry.width * geometry.height *
                            Math.abs(localMatrix[0] * localMatrix[4] - localMatrix[1] * localMatrix[3]);
                        const worldBounds = this._hooks.resizedWorldBounds(worldMatrix, 0, 0, geometry.width, geometry.height);
                        // 尺寸、面积和世界活动区域都须满足当前编辑器限制。
                        if (Number.isFinite(effectiveWidth) && Number.isFinite(effectiveHeight) &&
                            effectiveWidth >= this._tool.minWidth && effectiveWidth <= this._tool.maxWidth &&
                            effectiveHeight >= this._tool.minHeight && effectiveHeight <= this._tool.maxHeight &&
                            effectiveArea <= this._tool.max && this._hooks.isAllowed(worldBounds)) {
                            const currentMatrix = state.mesh.ensureWorldMatrix().data;
                            const positionChanged = currentMatrix[6] !== worldMatrix[6] || currentMatrix[7] !== worldMatrix[7];
                            const basisChanged = currentMatrix[0] !== worldMatrix[0] || currentMatrix[1] !== worldMatrix[1] ||
                                currentMatrix[3] !== worldMatrix[3] || currentMatrix[4] !== worldMatrix[4];
                            candidates.push({ state, localMatrix, positionChanged, basisChanged });
                        } else {
                            valid = false;
                        }
                    } else {
                        valid = false;
                    }
                }
                let frameLocal: MatrixValues | null = null;
                // 辅助框与模型使用同一个仿射变换，反向后仍包住同一批对象。
                if (gesture.frameState !== undefined && this._hooks.groupFrame !== null) {
                    const frameWorld = TransformWorldMatrix(transform, gesture.frameState.worldMatrix);
                    frameLocal = WorldToLocalMatrix(this._hooks.groupFrame, frameWorld);
                    // 辅助框也需要能转换回自己的父级。
                    if (frameLocal === null) {
                        valid = false;
                    }
                }
                // 全部候选通过约束后才能统一提交。
                if (valid) {
                    const changed: Mesh[] = [];
                    const moved: Mesh[] = [];
                    const scaled: Mesh[] = [];
                    // 先更新可读取的 TRS 属性，再写完整矩阵保留非等比变换产生的斜切。
                    for (const candidate of candidates) {
                        // 未变化的对象不更新版本，也不触发回调。
                        if (candidate.positionChanged || candidate.basisChanged) {
                            const state = candidate.state;
                            const mesh = state.mesh;
                            // 旋转更新公开角度，实际图形仍以完整矩阵为准。
                            if (gesture.mode === "rotate") {
                                mesh.rotation = state.rotation + angle;
                            } else if (gesture.mode === "scale") {
                                // 非等比组缩放可产生斜切，scale 记录各局部轴的投影长度。
                                const initialLengthX = Math.hypot(state.localMatrix[0], state.localMatrix[1]);
                                const initialLengthY = Math.hypot(state.localMatrix[3], state.localMatrix[4]);
                                let nextScaleX = state.scaleX;
                                let nextScaleY = state.scaleY;
                                // 轴向投影的符号记录穿过对边后的镜像方向。
                                if (initialLengthX > Number.EPSILON) {
                                    const dotX = candidate.localMatrix[0] * state.localMatrix[0] +
                                        candidate.localMatrix[1] * state.localMatrix[1];
                                    let signX = 1;
                                    // 穿过零点后将该轴标记为反向。
                                    if (dotX < 0) {
                                        signX = -1;
                                    }
                                    nextScaleX = state.scaleX * Math.hypot(candidate.localMatrix[0], candidate.localMatrix[1]) /
                                        initialLengthX * signX;
                                }
                                // 第二轴独立判断翻转，角点可同时反转两个方向。
                                if (initialLengthY > Number.EPSILON) {
                                    const dotY = candidate.localMatrix[3] * state.localMatrix[3] +
                                        candidate.localMatrix[4] * state.localMatrix[4];
                                    let signY = 1;
                                    // 第二轴跨过零点时保留负比例信息。
                                    if (dotY < 0) {
                                        signY = -1;
                                    }
                                    nextScaleY = state.scaleY * Math.hypot(candidate.localMatrix[3], candidate.localMatrix[4]) /
                                        initialLengthY * signY;
                                }
                                mesh.scale.set(nextScaleX, nextScaleY);
                            }
                            mesh.position.set(candidate.localMatrix[6], candidate.localMatrix[7]);
                            mesh.matrix.set(candidate.localMatrix);
                            changed.push(mesh);
                            // 位置变化单独通知，纯粹变宽的对象不归入移动回调。
                            if (candidate.positionChanged) {
                                moved.push(mesh);
                            }
                            // 只有缩放导致基向量变化才触发比例回调。
                            if (gesture.mode === "scale" && candidate.basisChanged) {
                                scaled.push(mesh);
                            }
                        }
                    }
                    // 拖动组框时保留它的几何和虚线纹理，仅更新仿射矩阵及命中角点。
                    if (changed.length > 0 && frameLocal !== null && this._hooks.groupFrame !== null) {
                        this._hooks.groupFrame.position.set(frameLocal[6], frameLocal[7]);
                        this._hooks.groupFrame.matrix.set(frameLocal);
                        const transformedCorners: Vec2[] = [];
                        // 与 Mesh 共用刚才验证通过的世界仿射变换。
                        for (const point of frame) {
                            transformedCorners.push(TransformPoint(transform, point));
                        }
                        this._hooks.groupFrameCorners = transformedCorners;
                        this._hooks.groupFrameCustomized = true;
                    }
                    // 没有对象变化时避免发送空的编辑通知。
                    if (changed.length > 0) {
                        // 旋转与缩放有不同的专门回调。
                        if (gesture.mode === "rotate") {
                            this._hooks.emitCallbacks(this._hooks.onRotate, [...changed]);
                        } else {
                            // 缩放逐个通知供调用方读取每件对象状态。
                            for (const mesh of scaled) {
                                this._hooks.emitCallbacks(this._hooks.onScale, mesh);
                            }
                        }
                        // 仅有中心位置改变时才发送位置回调。
                        if (moved.length > 0) {
                            this._hooks.emitCallbacks(this._hooks.onPositionChange, [...moved]);
                        }
                        this._hooks.emitCallbacks(this._hooks.onEdit, [...changed]);
                    }
                }
            }
        }
    }
}

interface RectGroupTransformHooks {
/**
     * 将世界坐标投影吸附到以零为起点的步进网格。
     * @param coordinate 世界坐标或世界轴上的投影值
     * @example
     * const x = this.snapWorldCoordinate(17);
     * @returns 最近的全局网格坐标。
     */
    snapWorldCoordinate(coordinate: number): number;
    /**
     * 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。
     * @param gesture 尚未缓存顶点的移动手势
     * @example
     * this.captureMoveSnapVertices(gesture);
     * @returns 无返回值。
     */
    captureMoveSnapVertices(gesture: EditGesture): void;
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
    resizedWorldBounds(matrix: ArrayLike<number>, centerX: number, centerY: number, width: number, height: number): RectBounds;
    /**
     * 检查候选对象是否完全在世界活动区域内。
     * @param bounds 世界轴向包围盒
     * @example
     * const allowed = this.isAllowed(bounds);
     * @returns 是否位于限制范围内。
     */
    isAllowed(bounds: RectBounds): boolean;
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
    /** 主编辑器当前的 onRotate 状态。 */
    readonly onRotate: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onScale 状态。 */
    readonly onScale: Map<string, (mesh: Mesh) => void>;
    /** 主编辑器当前的 onPositionChange 状态。 */
    readonly onPositionChange: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onEdit 状态。 */
    readonly onEdit: Map<string, (actives: Mesh[]) => void>;
}

export default RectGroupTransform;
export type { RectGroupTransformHooks };
