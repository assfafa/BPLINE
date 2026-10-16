import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type { Base2DOptions } from "../../Geometry/Base2D";
import Base2D from "../../Geometry/Base2D";
import CloneGeometry from "../../Geometry/CloneGeometry";
import type { GeoPartDataLike } from "../../Geometry/Geo";
import NGon2D from "../../Geometry/NGon2D";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import Group from "../../Group";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import Text from "../../Text";
import { MeasureText } from "../../Text/layout";
import type { Geometry2d } from "../../global-types";
import { ContainsPoint, CreateGroupFrame, SegmentDistance, UpdateGroupFrameScreen } from "../NGonEditTool/geometry";
import { FrameResizeCursor } from "../cursors";

/** 对不同几何类型执行同一组仿射操作，并在参数化形状变形时移交 Base2D。 */
class GroupTransform {
    /** 覆盖层所在组。 */
    public readonly frameGroup: Group;
    /** 屏幕手柄容差。 */
    public radius: number = 10;

    private readonly _camera: Camera;
    private readonly _render: Render;
    private _actives: Mesh[] = [];
    private _state: GroupState | null = null;
    private _frame: Mesh | null = null;
    private _gesture: GroupGesture | null = null;
    private _boundsZoom: number;
    private readonly _onConvert: (mesh: Mesh, previous: Geometry2d) => void;
    private readonly _onEdit: (meshes: Mesh[]) => void;

    /**
     * 创建集合专用的组框，不修改被编辑 Mesh 的父子关系。
     * @param frameGroup 组框所在覆盖层
     * @param render 渲染器
     * @param camera 相机
     * @param onConvert 几何类型变更时同步拥有者
     * @param onEdit 一次组变换后的编辑通知
     * @example const group = new GroupTransform(frame, render, camera, onConvert, onEdit);
     * @returns 组变换控制器。
     */
    public constructor(
        frameGroup: Group,
        render: Render,
        camera: Camera,
        onConvert: (mesh: Mesh, previous: Geometry2d) => void,
        onEdit: (meshes: Mesh[]) => void,
    ) {
        this.frameGroup = frameGroup;
        this._camera = camera;
        this._render = render;
        this._boundsZoom = camera.zoom;
        this._onConvert = onConvert;
        this._onEdit = onEdit;
    }

    /**
     * 改变组合成员后重建轴向组框；操作过程中不会每帧重算包围盒。
     * @param meshes 新的成员
     * @example group.setSelection(editor.actives);
     * @returns 无返回值。
     */
    public setSelection(meshes: readonly Mesh[]): void {
        this.cancel();
        this._actives = [...meshes];
        this._boundsZoom = this._camera.zoom;
        const bounds = BoundsOfMeshes(meshes, this._camera);
        // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
        if (bounds !== null) {
            this._state = { center: bounds.center, width: bounds.width, height: bounds.height, rotation: 0 };
        } else {
            this._state = null;
        }
        this.resetFrame();
    }

    /** @example group.update(); @returns 无返回值。相机缩放改变时保持组框虚线的像素尺寸。 */
    public update(): void {
        let state = this._state;
        const frame = this._frame;
        // 固定尺寸成员的世界边界随 zoom 改变；只在倍率变化且没有手势时重算包围框。
        if (state !== null && this._gesture === null && this._boundsZoom !== this._camera.zoom) {
            const bounds = BoundsOfMeshes(this._actives, this._camera, state.rotation);
            this._boundsZoom = this._camera.zoom;
            // 沿当前组框方向包围实际显示轮廓，保留已完成的组旋转姿态。
            if (bounds !== null) {
                state = {
                    center: bounds.center,
                    width: bounds.width,
                    height: bounds.height,
                    rotation: state.rotation,
                };
                this._state = state;
                this.updateFrame();
            }
        }
        // 无选择时不需要维护屏幕空间虚线。
        if (state !== null && frame !== null) {
            UpdateGroupFrameScreen(frame, state.width, state.height, this._camera, this._render);
        }
    }

    /**
     * 判定边角缩放、内部移动和外部旋转。
     * @param event 指针事件
     * @example const accepted = group.pointerDown(event);
     * @returns 是否开始组手势。
     */
    public pointerDown(event: PointerEvent): boolean {
        const state = this._state;
        // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
        if (state !== null && this._actives.length > 0) {
            const client = new Vec2(event.clientX, event.clientY);
            const hit = this.hit(client);
            const snapshots: GroupSnapshot[] = [];
            // 依次处理当前集合，保持对象顺序并避免遗漏成员。
            for (const mesh of this._actives) {
                const geometry = mesh.data;
                // 只有可用的几何数据进入变换，缺失数据保持原样。
                if (geometry !== undefined) {
                    const parent = mesh.parent;
                    const parentWorld = parent?.ensureWorldMatrix().data;
                    let parentInverse = Identity();
                    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                    if (parentWorld !== undefined) {
                        parentInverse = Invert(parentWorld);
                    }
                    snapshots.push({
                        mesh,
                        geometry: CloneGeometry(geometry),
                        world: [...mesh.ensureWorldMatrix().data],
                        parentInverse,
                    });
                }
            }
            this._gesture = {
                pointerId: event.pointerId,
                startClient: client,
                startWorld: this._camera.windowToWorld(client, this._render),
                state: { center: state.center.clone(), width: state.width, height: state.height, rotation: state.rotation },
                snapshots,
                action: hit.action,
                handle: hit.handle,
                moved: false,
            };
            return true;
        } else {
            return false;
        }
    }

    /** @param client 窗口坐标 @example const action = group.hover(client); @returns 组框当前可用操作。 */
    public hover(client: Vec2): { action: GroupAction; handle: GroupHandle | null } | null {
        // 没有组框时不提示旋转或缩放。
        if (this._state !== null && this._actives.length > 0) {
            return this.hit(client);
        } else {
            return null;
        }
    }

    /**
     * 读取组框边角当前的屏幕法线光标。
     * @param handle hover 返回的缩放手柄
     * @example const cursor = group.resizeCursor(hit.handle);
     * @returns 包含组框和相机变换的 CSS 光标；无组框时为默认指针。
     */
    public resizeCursor(handle: GroupHandle | null): string {
        const frame = this._frame;
        // 与组框使用同一个显示矩阵，旋转期间无需重新计算选择包围盒。
        if (frame instanceof Mesh) {
            return FrameResizeCursor(frame.getRenderMatrix(this._camera).data,
                handle, this._camera, this._render);
        } else {
            return "default";
        }
    }

    /**
     * 更新一次组合仿射操作；局部形状被拉成非参数化几何时转交 Base 编辑器。
     * @param event 指针事件
     * @example group.pointerMove(event);
     * @returns 无返回值。
     */
    public pointerMove(event: PointerEvent): void {
        const gesture = this._gesture;
        // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            const client = new Vec2(event.clientX, event.clientY);
            // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
            if (Math.hypot(client.x - gesture.startClient.x, client.y - gesture.startClient.y) > 1) {
                gesture.moved = true;
            }
            // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
            if (gesture.moved) {
                const current = this._camera.windowToWorld(client, this._render);
                const state = gesture.state;
                let delta = Identity();
                // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                if (gesture.action === "move") {
                    delta = Translate(current.x - gesture.startWorld.x, current.y - gesture.startWorld.y);
                    this._state = {
                        center: Transform(delta, state.center), width: state.width,
                        height: state.height, rotation: state.rotation,
                    };
                } else if (gesture.action === "rotate") {
                    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                    const startAngle = Math.atan2(gesture.startWorld.y - state.center.y,
                        gesture.startWorld.x - state.center.x);
                    const angle = Math.atan2(current.y - state.center.y, current.x - state.center.x) - startAngle;
                    delta = Around(state.center, state.rotation, 1, 1, angle);
                    this._state = {
                        center: state.center.clone(), width: state.width,
                        height: state.height, rotation: state.rotation + angle,
                    };
                } else if (gesture.handle !== null) {
                    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                    const scale = this.getScale(gesture, current);
                    delta = Around(scale.anchor, state.rotation, scale.x, scale.y, 0);
                    this._state = {
                        center: Transform(delta, state.center),
                        width: Math.abs(state.width * scale.x),
                        height: Math.abs(state.height * scale.y),
                        rotation: state.rotation,
                    };
                }
                // 候选仅在对应功能启用时参与计算，减少无效工作。
                for (const snapshot of gesture.snapshots) {
                    const local = Multiply(snapshot.parentInverse, Multiply(delta, snapshot.world));
                    const previous = snapshot.mesh.data;
                    ApplySnapshot(snapshot, local, gesture.action === "scale");
                    // 同一拖动每帧重建几何，但只有类型实际跨入 Base 时才通知降级。
                    if (snapshot.mesh.data instanceof Base2D && previous !== undefined && !(previous instanceof Base2D)) {
                        this._onConvert(snapshot.mesh, previous);
                    }
                }
                this.updateFrame();
                /** @param snapshot 当前成员 @example ReadMesh(snapshot); @returns 被变换的 Mesh。 */
                const ReadMesh = (snapshot: GroupSnapshot): Mesh => snapshot.mesh;
                this._onEdit(gesture.snapshots.map(ReadMesh));
            }
        }
    }

    /**
     * 结束组变换；返回是否只有一次没有拖动的单击。
     * @param event 指针事件
     * @example const click = group.pointerUp(event);
     * @returns 未发生拖动时为 true。
     */
    public pointerUp(event: PointerEvent): boolean {
        const gesture = this._gesture;
        // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            this._gesture = null;
            return !gesture.moved;
        } else {
            return false;
        }
    }

    /** @example const moving = transform.isMoving; @returns 当前是否正在平移选中集合。 */
    public get isMoving(): boolean {
        const gesture = this._gesture;
        return gesture !== null && gesture.moved && gesture.action === "move";
    }

    /** @example group.cancel(); @returns 无返回值。 */
    public cancel(): void {
        this._gesture = null;
    }

    /** @example group.destroy(); @returns 无返回值。 */
    public destroy(): void {
        this.cancel();
        // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
        if (this._frame !== null) {
            this._frame.removeSelf();
            this._frame.dispose();
            this._frame = null;
        }
        this._actives = [];
        this._state = null;
    }

    /**
     * 命中优先级为角、边、内部、外部。
     * @param client 窗口坐标
     * @example const action = this.hit(client);
     * @returns 操作与可能的缩放手柄。
     */
    private hit(client: Vec2): { action: GroupAction; handle: GroupHandle | null } {
        const state = this._state;
        // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
        if (state !== null) {
            const halfX = state.width / 2;
            const halfY = state.height / 2;
            const coordinates = [
                new Vec2(-halfX, -halfY), new Vec2(halfX, -halfY),
                new Vec2(halfX, halfY), new Vec2(-halfX, halfY),
            ];
            /** @param point 组局部角点 @example ToScreen(point); @returns 窗口坐标。 */
            const ToScreen = (point: Vec2): Vec2 => {
                const rotated = RotatePoint(point, state.rotation);
                return this._camera.worldToWindow(new Vec2(
                    state.center.x + rotated.x, state.center.y + rotated.y), this._render);
            };
            const corners = coordinates.map(ToScreen);
            const cornerHandles: GroupHandle[] = ["sw", "se", "ne", "nw"];
            // 逐顶点同步相关属性，防止三角面接缝或索引越界。
            for (let index = 0; index < corners.length; index++) {
                // 逐顶点同步相关属性，防止三角面接缝或索引越界。
                if (Math.hypot(client.x - corners[index].x, client.y - corners[index].y) <= this.radius) {
                    return { action: "scale", handle: cornerHandles[index] };
                }
            }
            const edgeHandles: GroupHandle[] = ["s", "e", "n", "w"];
            // 逐顶点同步相关属性，防止三角面接缝或索引越界。
            for (let index = 0; index < corners.length; index++) {
                // 逐顶点同步相关属性，防止三角面接缝或索引越界。
                if (SegmentDistance(client, corners[index], corners[(index + 1) % 4]) <= this.radius) {
                    return { action: "scale", handle: edgeHandles[index] };
                }
            }
            // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
            if (ContainsPoint(client, corners)) {
                return { action: "move", handle: null };
            }
        }
        return { action: "rotate", handle: null };
    }

    /**
     * 将当前手柄相对固定边的移动换算成组局部缩放。
     * @param gesture 开始时的组手势
     * @param current 当前鼠标的世界点
     * @example const scale = this.getScale(gesture, current);
     * @returns 固定锚点与两个倍率。
     */
    private getScale(gesture: GroupGesture, current: Vec2): { anchor: Vec2; x: number; y: number } {
        const state = gesture.state;
        const handle = gesture.handle;
        let anchorX = 0;
        let anchorY = 0;
        let scaleX = false;
        let scaleY = false;
        // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
        if (handle !== null) {
            scaleX = handle.includes("w") || handle.includes("e");
            scaleY = handle.includes("s") || handle.includes("n");
            // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
            if (handle.includes("w")) {
                anchorX = state.width / 2;
            } else if (handle.includes("e")) {
                // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                anchorX = -state.width / 2;
            }
            // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
            if (handle.includes("s")) {
                anchorY = state.height / 2;
            } else if (handle.includes("n")) {
                // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
                anchorY = -state.height / 2;
            }
        }
        const localStart = RotatePoint(new Vec2(
            gesture.startWorld.x - state.center.x, gesture.startWorld.y - state.center.y), -state.rotation);
        const localCurrent = RotatePoint(new Vec2(
            current.x - state.center.x, current.y - state.center.y), -state.rotation);
        let x = 1;
        let y = 1;
        // 从按下时快照计算变换，避免连续拖动积累数值误差。
        if (scaleX && Math.abs(localStart.x - anchorX) > Number.EPSILON) {
            x = LimitFactor((localCurrent.x - anchorX) / (localStart.x - anchorX));
        }
        // 从按下时快照计算变换，避免连续拖动积累数值误差。
        if (scaleY && Math.abs(localStart.y - anchorY) > Number.EPSILON) {
            y = LimitFactor((localCurrent.y - anchorY) / (localStart.y - anchorY));
        }
        const rotatedAnchor = RotatePoint(new Vec2(anchorX, anchorY), state.rotation);
        return { anchor: new Vec2(state.center.x + rotatedAnchor.x, state.center.y + rotatedAnchor.y), x, y };
    }

    /** @example this.resetFrame(); @returns 无返回值。 */
    private resetFrame(): void {
        // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
        if (this._frame !== null) {
            this._frame.removeSelf();
            this._frame.dispose();
            this._frame = null;
        }
        const state = this._state;
        // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
        if (state !== null) {
            this._frame = CreateGroupFrame({
                left: state.center.x - state.width / 2,
                right: state.center.x + state.width / 2,
                bottom: state.center.y - state.height / 2,
                top: state.center.y + state.height / 2,
                center: state.center,
                width: Math.max(state.width, 0.001),
                height: Math.max(state.height, 0.001),
            });
            this.frameGroup.add(this._frame);
            this.updateFrame();
        }
    }

    /** @example this.updateFrame(); @returns 无返回值。 */
    private updateFrame(): void {
        const state = this._state;
        const frame = this._frame;
        // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
        if (state !== null && frame !== null) {
            // 直接重建当前尺寸的虚线，避免倍率把横纵线宽分别放大。
            frame.scale.set(1, 1);
            frame.position.set(state.center.x, state.center.y);
            frame.rotation = state.rotation;
            UpdateGroupFrameScreen(frame, state.width, state.height, this._camera, this._render);
        }
    }
}

type GroupHandle = "sw" | "se" | "ne" | "nw" | "s" | "e" | "n" | "w";

type GroupAction = "move" | "rotate" | "scale";

interface GroupState {
    center: Vec2;
    width: number;
    height: number;
    rotation: number;
}

interface GroupSnapshot {
    mesh: Mesh;
    geometry: Geometry2d;
    world: number[];
    parentInverse: number[];
}

interface GroupGesture {
    pointerId: number;
    startClient: Vec2;
    startWorld: Vec2;
    state: GroupState;
    snapshots: GroupSnapshot[];
    action: GroupAction;
    handle: GroupHandle | null;
    moved: boolean;
}

/** @param factor 原始倍率 @example const value = LimitFactor(factor); @returns 避开零矩阵的倍率。 */
const LimitFactor = (factor: number): number => {
    // 从按下时快照计算变换，避免连续拖动积累数值误差。
    if (Math.abs(factor) < 0.0001) {
        // 从按下时快照计算变换，避免连续拖动积累数值误差。
        if (factor < 0) {
            return -0.0001;
        } else {
            return 0.0001;
        }
    } else {
        return factor;
    }
};

/** @example const matrix = Identity(); @returns 三阶单位矩阵。 */
const Identity = (): number[] => [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** @param x 水平距离 @param y 垂直距离 @example Translate(1, 2); @returns 位移矩阵。 */
const Translate = (x: number, y: number): number[] => [1, 0, 0, 0, 1, 0, x, y, 1];

/** @param angle 弧度 @example Rotate(0); @returns 旋转矩阵。 */
const Rotate = (angle: number): number[] => {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return [cosine, sine, 0, -sine, cosine, 0, 0, 0, 1];
};

/** @param x 水平倍率 @param y 垂直倍率 @example Scale(2, 3); @returns 缩放矩阵。 */
const Scale = (x: number, y: number): number[] => [x, 0, 0, 0, y, 0, 0, 0, 1];

/**
 * 形成围绕世界锚点并沿旋转坐标轴执行的变换。
 * @param anchor 固定点
 * @param axisAngle 组坐标轴角度
 * @param x 水平倍率
 * @param y 垂直倍率
 * @param rotation 附加旋转角度
 * @example Around(pivot, 0, 2, 1, 0);
 * @returns 三阶仿射矩阵。
 */
const Around = (anchor: Vec2, axisAngle: number, x: number, y: number, rotation: number): number[] => {
    const linear = Multiply(Rotate(axisAngle + rotation), Multiply(Scale(x, y), Rotate(-axisAngle)));
    return Multiply(Translate(anchor.x, anchor.y), Multiply(linear, Translate(-anchor.x, -anchor.y)));
};

/** @param left 左矩阵 @param right 右矩阵 @example Multiply(a, b); @returns 列主序矩阵乘积。 */
const Multiply = (left: ArrayLike<number>, right: ArrayLike<number>): number[] => {
    const result = new Array<number>(9);
    // 依次处理当前集合，保持对象顺序并避免遗漏成员。
    for (let column = 0; column < 3; column++) {
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (let row = 0; row < 3; row++) {
            result[column * 3 + row] =
                left[row] * right[column * 3] +
                left[3 + row] * right[column * 3 + 1] +
                left[6 + row] * right[column * 3 + 2];
        }
    }
    return result;
};

/** @param matrix 仿射矩阵 @example Invert(matrix); @returns 逆矩阵；不可逆时保留单位矩阵。 */
const Invert = (matrix: ArrayLike<number>): number[] => {
    const determinant = matrix[0] * matrix[4] - matrix[3] * matrix[1];
    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
    if (Math.abs(determinant) > Number.EPSILON) {
        const inverse = 1 / determinant;
        return [
            matrix[4] * inverse, -matrix[1] * inverse, 0,
            -matrix[3] * inverse, matrix[0] * inverse, 0,
            (matrix[3] * matrix[7] - matrix[4] * matrix[6]) * inverse,
            (matrix[1] * matrix[6] - matrix[0] * matrix[7]) * inverse,
            1,
        ];
    } else {
        return Identity();
    }
};

/** @param matrix 仿射矩阵 @param point 输入点 @example Transform(matrix, point); @returns 变换后的点。 */
const Transform = (matrix: ArrayLike<number>, point: Vec2): Vec2 => new Vec2(
    matrix[0] * point.x + matrix[3] * point.y + matrix[6],
    matrix[1] * point.x + matrix[4] * point.y + matrix[7],
);

/** @param point 输入点 @param angle 弧度 @example RotatePoint(point, angle); @returns 旋转后的点。 */
const RotatePoint = (point: Vec2, angle: number): Vec2 => {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    return new Vec2(cosine * point.x - sine * point.y, sine * point.x + cosine * point.y);
};

/**
 * 读取真实几何顶点的世界包围盒，供混合类型组框使用。
 * @param meshes 选中的 Mesh
 * @param camera 可见尺寸补偿所用相机
 * @param rotation 包围框沿用的世界旋转角，默认与世界轴平行
 * @example const bounds = BoundsOfMeshes(meshes, camera);
 * @returns 轴向包围盒或 null。
 */
const BoundsOfMeshes = (meshes: readonly Mesh[], camera: Camera, rotation: number = 0): {
    center: Vec2; width: number; height: number;
} | null => {
    let left = Infinity;
    let right = -Infinity;
    let bottom = Infinity;
    let top = -Infinity;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    // 依次处理当前集合，保持对象顺序并避免遗漏成员。
    for (const mesh of meshes) {
        const geometry = mesh.data;
        // 只有可用的几何数据进入变换，缺失数据保持原样。
        if (geometry !== undefined) {
            let vertices: Float32Array | undefined;
            // 文字组框使用排版区域，不扫描字形三角网。
            if (geometry instanceof Text) {
                const bounds = MeasureText(geometry);
                vertices = new Float32Array([bounds.left, bounds.bottom, bounds.right, bounds.bottom,
                    bounds.right, bounds.top, bounds.left, bounds.top]);
            } else {
                geometry.ensureGeometry();
                vertices = geometry.geometry;
            }
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (vertices === undefined && geometry instanceof Rect2D) {
                vertices = new Float32Array([
                    -geometry.width / 2, -geometry.height / 2,
                    geometry.width / 2, -geometry.height / 2,
                    geometry.width / 2, geometry.height / 2,
                    -geometry.width / 2, geometry.height / 2,
                ]);
            } else if (vertices === undefined && geometry instanceof Poly2D) {
                // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                vertices = geometry.points;
            } else if (vertices === undefined && geometry instanceof Base2D) {
                // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                /** @param contour 一个闭合边界 @example FlattenContour(contour); @returns 普通坐标数组。 */
                const FlattenContour = (contour: Float32Array): number[] => Array.from(contour);
                vertices = new Float32Array(geometry.contours.flatMap(FlattenContour));
            }
            // 逐顶点同步相关属性，防止三角面接缝或索引越界。
            if (vertices !== undefined) {
                const matrix = mesh.getRenderMatrix(camera).data;
                // 逐顶点同步相关属性，防止三角面接缝或索引越界。
                for (let offset = 0; offset < vertices.length; offset += 2) {
                    const worldX = matrix[0] * vertices[offset] + matrix[3] * vertices[offset + 1] + matrix[6];
                    const worldY = matrix[1] * vertices[offset] + matrix[4] * vertices[offset + 1] + matrix[7];
                    const x = cosine * worldX + sine * worldY;
                    const y = -sine * worldX + cosine * worldY;
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    bottom = Math.min(bottom, y);
                    top = Math.max(top, y);
                }
            }
        }
    }
    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
    if (Number.isFinite(left)) {
        const centerX = (left + right) / 2;
        const centerY = (bottom + top) / 2;
        return {
            center: new Vec2(cosine * centerX - sine * centerY, sine * centerX + cosine * centerY),
            width: right - left,
            height: top - bottom,
        };
    } else {
        return null;
    }
};

/**
 * 在原始快照上施加当前组矩阵；参数化形状只在仍满足其几何约束时保留类型。
 * @param snapshot 按下时的独立快照
 * @param local 从快照计算出的父级局部矩阵
 * @param scaling 是否正在缩放
 * @example ApplySnapshot(snapshot, local, true);
 * @returns 无返回值。
 */
const ApplySnapshot = (snapshot: GroupSnapshot, local: number[], scaling: boolean): void => {
    const mesh = snapshot.mesh;
    const geometry = snapshot.geometry;
    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
    const firstLength = Math.hypot(local[0], local[1]);
    const secondLength = Math.hypot(local[3], local[4]);
    const dot = local[0] * local[3] + local[1] * local[4];
    const orthogonal = Math.abs(dot) <= 0.0001 * Math.max(1, firstLength * secondLength);
    const determinant = local[0] * local[4] - local[3] * local[1];
    const regular = Math.abs(firstLength - secondLength) <= 0.0001 * Math.max(1, firstLength);
    const preserveRect = geometry instanceof Rect2D && orthogonal;
    const preserveNGon = geometry instanceof NGon2D && orthogonal && (!scaling || regular) && determinant > 0;
    const preserveText = geometry instanceof Text && orthogonal && determinant > 0;
    const preserveOther = !scaling && orthogonal && determinant > 0;
    // 正交矩阵写回可观察的 TRS 参数，后续独立编辑不会被旧 position 覆盖。
    if (preserveRect || preserveNGon || preserveText || preserveOther) {
        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
        if (mesh.data?.type !== geometry.type) {
            mesh.data = CloneGeometry(geometry);
        }
        mesh.position.set(local[6], local[7]);
        mesh.rotation = Math.atan2(local[1], local[0]);
        // 矩形双面形状可用正比例表示镜像；其他类型仅保留正行列式。
        if (determinant < 0) {
            mesh.scale.set(firstLength, secondLength);
        } else {
            mesh.scale.set(firstLength, determinant / firstLength);
        }
        mesh.updateMatrix();
    } else {
        if (geometry instanceof Poly2D) {
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            const coordinates = new Float32Array(geometry.points.length);
            // 依次处理当前集合，保持对象顺序并避免遗漏成员。
            for (let offset = 0; offset < coordinates.length; offset += 2) {
                const point = Transform(local, new Vec2(geometry.points[offset], geometry.points[offset + 1]));
                coordinates[offset] = point.x;
                coordinates[offset + 1] = point.y;
            }
            const poly = new Poly2D(coordinates, geometry.style.clone(), { closed: geometry.closed });
            mesh.data = poly;
            mesh.position.set(0, 0);
            mesh.rotation = 0;
            mesh.scale.set(1, 1);
            mesh.updateMatrix();
        } else {
            const base = BakeBase(geometry, local);
            mesh.data = base;
            mesh.position.set(0, 0);
            mesh.rotation = 0;
            mesh.scale.set(1, 1);
            mesh.updateMatrix();
        }
    }
};

/**
 * 将已生成的分区三角面烘焙为正面朝外的 Base2D，并映射可编辑边界。
 * @param geometry 原始参数化或直接三角面
 * @param matrix 作用到全部顶点的父级局部变换
 * @example const base = BakeBase(rect, matrix);
 * @returns 轮廓可编辑的 Base2D。
 */
const BakeBase = (geometry: Geometry2d, matrix: ArrayLike<number>): Base2D => {
    geometry.ensureGeometry();
    const original = geometry.geometry ?? new Float32Array();
    const vertices = new Float32Array(original.length);
    // 依次处理当前集合，保持对象顺序并避免遗漏成员。
    for (let offset = 0; offset < original.length; offset += 2) {
        const point = Transform(matrix, new Vec2(original[offset], original[offset + 1]));
        vertices[offset] = point.x;
        vertices[offset + 1] = point.y;
    }
    const index = geometry.index?.slice();
    const determinant = matrix[0] * matrix[4] - matrix[3] * matrix[1];
    // 逐顶点同步相关属性，防止三角面接缝或索引越界。
    if (index !== undefined && determinant < 0) {
        // 逐顶点同步相关属性，防止三角面接缝或索引越界。
        for (let triangle = 0; triangle < index.length; triangle += 3) {
            const middle = index[triangle + 1];
            index[triangle + 1] = index[triangle + 2];
            index[triangle + 2] = middle;
        }
    }
    const contours: Float32Array[] = [];
    const fallbackContours: Float32Array[] = [];
    // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
    if (geometry instanceof Base2D || geometry instanceof Text) {
        // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
        for (const contour of geometry.contours) {
            contours.push(TransformCoordinates(contour, matrix));
        }
    } else if (geometry instanceof Rect2D) {
        // 有实体三角面时优先从真实网格提取边界；解析失败时才使用参数化外形。
        fallbackContours.push(TransformCoordinates(RectContour(geometry), matrix));
    } else if (geometry instanceof NGon2D) {
        // 有实体三角面时优先提取实际边界，避免浮点重算让手柄脱离顶点。
        fallbackContours.push(TransformCoordinates(NGonContour(geometry, geometry.outer), matrix));
        // 内半径大于零时保留孔边界供 Base 编辑器单独选择。
        if (geometry.inner > 0) {
            fallbackContours.push(TransformCoordinates(NGonContour(geometry, geometry.inner), matrix));
        }
    } else if (geometry instanceof Poly2D && geometry.points.length >= 4) {
        // 无填充的路径也保留原始节点，转换后仍能显示轮廓关键点。
        fallbackContours.push(TransformCoordinates(geometry.points, matrix));
    }
    const position = geometry.position?.slice();
    // 组操作只修改当前快照中的成员，其他场景对象保持原状态。
    if (position !== undefined) {
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (let offset = 0; offset < position.length; offset += 2) {
            const point = Transform(matrix, new Vec2(position[offset], position[offset + 1]));
            position[offset] = point.x;
            position[offset + 1] = point.y;
        }
    }
    let editableContours: Float32Array[] | undefined;
    // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
    if (contours.length > 0) {
        editableContours = contours;
    }
    let normal: Float32Array | undefined;
    // 宽边框的挤出方向必须跟随烘焙后的几何坐标变换。
    if (geometry.normal !== undefined) {
        normal = TransformNormals(geometry.normal, matrix);
    }
    const options: Base2DOptions = {
        vertices,
        index,
        contours: editableContours,
        normal,
        uv: geometry.uv?.slice(),
        vertexType: geometry.vertexType?.slice(),
        position,
        miterScale: geometry.miterScale?.slice(),
        linePoints: TransformLinePoints(geometry.linePoints, matrix),
        style: geometry.style.clone(),
    };
    const base = new Base2D(options);
    // 无实体面时推断不出轮廓，使用参数化形状的外环或孔环作为手柄位置。
    if (base.contours.length === 0 && fallbackContours.length > 0) {
        base.setData({ ...options, contours: fallbackContours });
    }
    return base;
};

/**
 * 以轮廓节点表达带圆角的矩形；保持四个角各自的离散弧段。
 * @param geometry 原始矩形
 * @example const ring = RectContour(rect);
 * @returns 顺序排列的外轮廓坐标。
 */
const RectContour = (geometry: Rect2D): Float32Array => {
    const halfWidth = geometry.width / 2;
    const halfHeight = geometry.height / 2;
    const radius = Math.min(geometry.radius, halfWidth, halfHeight);
    const points: number[] = [];
    const corners = [
        { x: halfWidth - radius, y: halfHeight - radius, start: 0 },
        { x: -halfWidth + radius, y: halfHeight - radius, start: Math.PI / 2 },
        { x: -halfWidth + radius, y: -halfHeight + radius, start: Math.PI },
        { x: halfWidth - radius, y: -halfHeight + radius, start: Math.PI * 1.5 },
    ];
    // 零圆角仅保留四个角；有圆角时与生成网格相同地离散化外形。
    for (const corner of corners) {
        let steps = 1;
        // 圆角需要额外节点才能在转成 Base 后继续拖动弧形边界。
        if (radius > 0) {
            steps = 8;
        }
        // 节点按绕行方向排列，避免轮廓自交。
        for (let step = 0; step < steps; step++) {
            const angle = corner.start + (Math.PI / 2) * step / steps;
            points.push(corner.x + Math.cos(angle) * radius,
                corner.y + Math.sin(angle) * radius);
        }
    }
    return new Float32Array(points);
};

/** @param geometry 正多边形 @param radius 内或外半径 @example NGonContour(ngon, ngon.outer); @returns 有序环形节点。 */
const NGonContour = (geometry: NGon2D, radius: number): Float32Array => {
    const points = new Float32Array(geometry.sides * 2);
    // 正多边形的孔环和外环均由自己的半径、边数及起始角定义。
    for (let index = 0; index < geometry.sides; index++) {
        const angle = geometry.startAngle + index * Math.PI * 2 / geometry.sides;
        points[index * 2] = Math.cos(angle) * radius;
        points[index * 2 + 1] = Math.sin(angle) * radius;
    }
    return points;
};

/**
 * 法线按逆转置映射，再以原长度恢复斜接方向。
 * @param normals 原始法线序列
 * @param matrix 当前仿射矩阵
 * @example const next = TransformNormals(normals, matrix);
 * @returns 适合新局部坐标系的法线序列。
 */
const TransformNormals = (normals: Float32Array, matrix: ArrayLike<number>): Float32Array => {
    const result = new Float32Array(normals.length);
    const determinant = matrix[0] * matrix[4] - matrix[3] * matrix[1];
    // 近零面积的手势被缩放逻辑钳制；导入异常矩阵则保留原法线。
    if (Math.abs(determinant) > Number.EPSILON) {
        // 每个法线都按逆转置方向映射以保持边框厚度含义。
        for (let offset = 0; offset < normals.length; offset += 2) {
            const x = normals[offset];
            const y = normals[offset + 1];
            const transformedX = (matrix[4] * x - matrix[1] * y) / determinant;
            const transformedY = (-matrix[3] * x + matrix[0] * y) / determinant;
            const previousLength = Math.hypot(x, y);
            const nextLength = Math.hypot(transformedX, transformedY);
            // 零法线用于实体面，不能被除法归一化。
            if (nextLength > Number.EPSILON) {
                result[offset] = transformedX * previousLength / nextLength;
                result[offset + 1] = transformedY * previousLength / nextLength;
            }
        }
    } else {
        result.set(normals);
    }
    return result;
};

/** @param source 原始线框数据 @param matrix 仿射变换 @example TransformLinePoints(lines, matrix); @returns 映射后的线框数据。 */
const TransformLinePoints = (source: GeoPartDataLike | undefined, matrix: ArrayLike<number>): GeoPartDataLike | undefined => {
    let transformed: GeoPartDataLike | undefined;
    // 有线框数据时同步几何和中心坐标，空线框无需分配。
    if (source !== undefined) {
        let position: Float32Array | undefined;
        // 某些线段附带点中心属性，其坐标也属于同一次组变换。
        if (source.position !== undefined) {
            position = TransformCoordinates(source.position, matrix);
        }
        transformed = {
            geometry: TransformCoordinates(source.geometry, matrix),
            normal: TransformNormals(source.normal, matrix),
            uv: source.uv.slice(),
            index: source.index.slice(),
            position,
            vertexType: source.vertexType?.slice(),
            miterScale: source.miterScale?.slice(),
        };
    }
    return transformed;
};

/** @param points 坐标序列 @param matrix 变换矩阵 @example TransformCoordinates(points, matrix); @returns 新坐标序列。 */
const TransformCoordinates = (points: Float32Array, matrix: ArrayLike<number>): Float32Array => {
    const result = new Float32Array(points.length);
    // 依次处理当前集合，保持对象顺序并避免遗漏成员。
    for (let offset = 0; offset < points.length; offset += 2) {
        const point = Transform(matrix, new Vec2(points[offset], points[offset + 1]));
        result[offset] = point.x;
        result[offset + 1] = point.y;
    }
    return result;
};

export default GroupTransform;
export { BakeBase };
