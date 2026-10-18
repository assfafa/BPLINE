import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import Color from "../../Color";
import CloneGeometry from "../../Geometry/CloneGeometry";
import Group from "../../Group";
import BaseMaterial from "../../Material/baseMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import Select from "../../Select";
import Style from "../../Style";
import type { EditSwitches } from "../EditSwitches";
import { CreateEditSwitches } from "../EditSwitches";
import { ContainsPoint, SegmentDistance, UpdateGroupFrameScreen } from "../NGonEditTool/geometry";
import { CreateRotationHandle } from "../Snap/RotationHandle";
import EditorGroup from "./EditorGroup";

/** 操作真实 Group 层级，并在拖动结束时以松开位置决定父组。 */
class Hierarchy {
    /** 屏幕边角容差，单位 CSS 像素。 */
    public radius: number = 10;
    /** 普通 Rect、NGon、Poly、Base Mesh 是否可作为父容器。 */
    public nest: boolean = false;
    /** 下一个新建层级组的范围是否抵消相机 zoom，默认关闭。 */
    public ignoreZoom: boolean = false;
    /** 层级组移动、缩放、旋转及拖放的交互开关。 */
    public switches: EditSwitches = CreateEditSwitches();
    /** 拖入目标边框的颜色，可通过 setHex 或 copy 修改。 */
    public readonly dropTargetColor: Color = new Color("#4b8cff");
    private readonly _scene: Scene;
    private readonly _render: Render;
    private readonly _camera: Camera;
    private readonly _select: Select;
    private _gesture: HierarchyGesture | null = null;
    private _activeGroup: EditorGroup | null = null;
    private _rotationHandle: Mesh | null = null;
    private _dropTarget: Group | null = null;
    private _dropFrame: Mesh | null = null;
    private _dropFrameWorld: number[] | null = null;

    /**
     * 创建层级交互入口。
     * @param scene 被编辑场景
     * @param render 当前渲染器
     * @param camera 屏幕坐标所用相机
     * @param select 已由集合编辑器维护的选择器
     * @example const hierarchy = new Hierarchy(scene, render, camera, select);
     * @returns 层级控制器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera, select: Select) {
        this._scene = scene;
        this._render = render;
        this._camera = camera;
        this._select = select;
    }

    /** @example const group = hierarchy.activeGroup; @returns 当前有选中反馈的层级组。 */
    public get activeGroup(): EditorGroup | null {
        return this._activeGroup;
    }

    /** @param group 新选择的层级组 @example hierarchy.activeGroup = group; @returns 无返回值。 */
    public set activeGroup(group: EditorGroup | null) {
        // 只改变两条框的颜色，保留组自身和子对象的材质。
        if (this._activeGroup !== group) {
            const previous = this._activeGroup;
            this._activeGroup = group;
            this.refreshGroupColor(previous);
            this.refreshGroupColor(group);
            // 箭头仅属于当前选中组；离开选择立即移除旧图标。
            if (group === null && this._rotationHandle !== null) {
                this._rotationHandle.removeSelf();
                this._rotationHandle.dispose();
                this._rotationHandle = null;
            }
        }
    }

    /** @example const helpers = hierarchy.auxiliaryNodes(); @returns 当前旋转图标与拖放反馈框，供文档过滤使用。 */
    public auxiliaryNodes(): Mesh[] {
        const nodes: Mesh[] = [];
        // 这些覆盖层由交互重建，不属于用户场景数据。
        for (const node of [this._rotationHandle, this._dropFrame]) {
            // 尚未显示的覆盖层没有可导出的对象。
            if (node !== null) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    /** @example hierarchy.update(); @returns 无返回值。当前组旋转箭头保持固定屏幕像素尺寸。 */
    public update(): void {
        // 已创建组的四条虚线随相机和父级矩阵重算像素宽度与节距。
        for (const item of this.groups()) {
            UpdateGroupFrameScreen(item.frame, item.width, item.height, this._camera, this._render);
        }
        this.refreshDropFeedback();
        const group = this._activeGroup;
        // 组取消选择后不维护额外覆盖层。
        if (group !== null && this.switches.rotate) {
            const rotation = this.rotationPosition(group);
            // 退化变换无法得到稳定的旋转方向。
            if (rotation !== null) {
                const tangent = new Vec2(-rotation.outward.y, rotation.outward.x);
                const origin = this._camera.windowToWorld(rotation.top, this._render);
                const right = this._camera.windowToWorld(new Vec2(
                    rotation.top.x + tangent.x, rotation.top.y + tangent.y), this._render);
                const outward = this._camera.windowToWorld(new Vec2(
                    rotation.top.x + rotation.outward.x, rotation.top.y + rotation.outward.y), this._render);
                // 箭头不继承 Group 的倍率，Zoom 变化后仍保持可点击大小。
                if (this._rotationHandle === null) {
                    this._rotationHandle = CreateRotationHandle();
                    this._scene.add(this._rotationHandle);
                }
                this._rotationHandle.position.set(origin.x, origin.y);
                this._rotationHandle.matrix.set([
                    right.x - origin.x, right.y - origin.y, 0,
                    outward.x - origin.x, outward.y - origin.y, 0,
                    origin.x, origin.y, 1,
                ]);
            }
        } else if (this._rotationHandle !== null) {
            // 禁用旋转时同步摘除先前已显示的箭头。
            this._rotationHandle.removeSelf();
            this._rotationHandle.dispose();
            this._rotationHandle = null;
        }
    }

    /**
     * 将画出的范围建立为真正的空 Group。
     * @param first 按下时世界点
     * @param last 松开时世界点
     * @example const group = hierarchy.create(first, last);
     * @returns 新层级组；过小范围返回 null。
     */
    public create(first: Vec2, last: Vec2): EditorGroup | null {
        let sizeScale = 1;
        // 固定尺寸组保存补偿前的局部范围，组中心继续使用世界位置。
        if (this.ignoreZoom) {
            sizeScale = this._camera.zoom;
        }
        const width = Math.abs(last.x - first.x) * sizeScale;
        const height = Math.abs(last.y - first.y) * sizeScale;
        // 无面积的鼠标单击只取消选择，不留下无法命中的空组。
        if (width > 0.001 && height > 0.001) {
            const center = new Vec2((first.x + last.x) / 2, (first.y + last.y) / 2);
            const group = new EditorGroup(center.x, center.y, width, height);
            group.ignoreZoom = this.ignoreZoom;
            this._scene.add(group);
            const startClient = this._camera.worldToWindow(first, this._render);
            const target = this.dropTarget(startClient, group);
            // 起笔位置属于已有容器时，刚创建的组成为该容器的子节点。
            if (target !== this._scene) {
                Reparent(group, target);
            }
            this.activeGroup = group;
            return group;
        } else {
            return null;
        }
    }

    /**
     * 从上层搜索组框的边角和附近旋转区。
     * @param client 浏览器窗口坐标
     * @param edgeOnly 是否只接受边角或旋转区
     * @example const hit = hierarchy.pickGroup(client, true);
     * @returns 命中组及操作。
     */
    public pickGroup(client: Vec2, edgeOnly: boolean = false): HierarchyHit | null {
        const selected = this._activeGroup;
        // 明确的旋转图标优先于框边，但不占用嵌套父组的整圈内部空间。
        if (selected !== null && this.switches.rotate) {
            const rotation = this.rotationPosition(selected);
            // 屏幕半径限定命中区域，避免箭头挡住组内新建操作。
            if (rotation !== null && Math.hypot(client.x - rotation.endpoint.x,
                client.y - rotation.endpoint.y) <= this.radius) {
                return { group: selected, action: "rotate", handle: null };
            }
        }
        const groups = this.groups();
        // 子组先于父组，后添加的同级组先于较早的组。
        for (let index = groups.length - 1; index >= 0; index--) {
            const group = groups[index];
            const hit = this.hit(group, client, edgeOnly);
            // 命中子组后不再让外层框抢占本次操作。
            if (hit === null || !this.switches[hit.action]) {
                // 继续检查其它可见的组框。
            } else {
                return hit;
            }
        }
        return null;
    }

    /**
     * 开始移动对象或编辑组框。
     * @param event 指针事件
     * @param node 被操作的 Mesh 或 Group
     * @param hit 组框命中结果，Mesh 可省略
     * @example hierarchy.pointerDown(event, group, hit);
     * @returns 是否开始手势。
     */
    public pointerDown(event: PointerEvent, node: HierarchyNode, hit: HierarchyHit | null = null): boolean {
        this.clearDropPreview();
        const client = new Vec2(event.clientX, event.clientY);
        let action: HierarchyAction = "move";
        let handle: HierarchyHandle | null = null;
        // Group 边角才执行缩放或旋转，普通 Mesh 只能平移。
        if (node instanceof EditorGroup) {
            this.activeGroup = node;
            // 保留按下时命中的手柄，拖动期间不再次拾取。
            if (hit !== null && hit.group === node) {
                action = hit.action;
                handle = hit.handle;
            }
        } else {
            this.activeGroup = null;
        }
        // 已禁用的操作只保留选择反馈，不建立变换手势。
        if (this.switches[action]) {
            let displayMatrix = node.ensureWorldMatrix().data;
            // Group 本身保留逻辑层级变换，独立框 Mesh 提供实际显示范围。
            if (node instanceof EditorGroup) {
                displayMatrix = node.frame.getRenderMatrix(this._camera).data;
            } else {
                displayMatrix = node.getRenderMatrix(this._camera).data;
            }
            this._gesture = {
                pointerId: event.pointerId,
                node,
                action,
                handle,
                startClient: client,
                startWorld: this._camera.windowToWorld(client, this._render),
                worldMatrix: [...node.ensureWorldMatrix().data],
                displayMatrix: [...displayMatrix],
                zoom: this._camera.zoom,
                moved: false,
            };
            return true;
        } else {
            return false;
        }
    }

    /** @param event 正在拖动的指针 @example hierarchy.pointerMove(event); @returns 无返回值。 */
    public pointerMove(event: PointerEvent): void {
        const gesture = this._gesture;
        // 其它触点不改变已经捕获的层级手势。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            const client = new Vec2(event.clientX, event.clientY);
            const distance = Math.hypot(client.x - gesture.startClient.x, client.y - gesture.startClient.y);
            gesture.moved = gesture.moved || distance >= 3;
            // 很短的点击仅选择组或 Mesh，不提交变换。
            if (gesture.moved) {
                const current = this._camera.windowToWorld(client, this._render);
                const world = this.transform(gesture, current);
                SetWorldMatrix(gesture.node, world);
                // 只有平移会改变父层级；缩放和旋转不显示接收目标。
                if (gesture.action === "move") {
                    this.previewDrop(client, gesture.node);
                }
            }
        }
    }

    /**
     * 完成手势；只有移动操作允许在释放位置进入另一个组。
     * @param event 松开的指针
     * @example hierarchy.pointerUp(event);
     * @returns 本次是否改动了对象。
     */
    public pointerUp(event: PointerEvent): boolean {
        const gesture = this._gesture;
        // 只有开始本次手势的指针能提交拖动与层级变化。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            this.pointerMove(event);
            this._gesture = null;
            // 缩放与旋转保持原有父级；只有平移允许放入目标 Group。
            if (gesture.moved && gesture.action === "move" && this.switches.reparent) {
                const client = new Vec2(event.clientX, event.clientY);
                const target = this.dropTarget(client, gesture.node);
                // 空白对应场景根节点，允许已嵌套对象拖出原容器。
                if (target !== gesture.node.parent) {
                    Reparent(gesture.node, target);
                }
            }
            this.clearDropPreview();
            return gesture.moved;
        } else {
            return false;
        }
    }

    /** @example hierarchy.cancel(); @returns 无返回值。 */
    public cancel(): void {
        this._gesture = null;
        this.clearDropPreview();
    }

    /** @example hierarchy.destroy(); @returns 无返回值。释放选中反馈辅助资源。 */
    public destroy(): void {
        this.cancel();
        this.activeGroup = null;
    }

    /**
     * 显示鼠标下方可接收对象的蓝色边框。
     * @param client 当前窗口点
     * @param moving 正在拖动的对象
     * @param excluded 同批拖动的其他对象
     * @example hierarchy.previewDrop(client, mesh);
     * @returns 当前可接收的父节点；空白返回场景。
     */
    public previewDrop(client: Vec2, moving: HierarchyNode,
        excluded: readonly Group[] = []): Group {
        const target = this.dropTarget(client, moving, excluded);
        // 场景根节点代表拖出已有容器，空白区域不显示目标边框。
        if (target === this._scene || !this.switches.reparent) {
            this.setDropTarget(null);
        } else {
            this.setDropTarget(target);
        }
        return target;
    }

    /** @example hierarchy.clearDropPreview(); @returns 无返回值。 */
    public clearDropPreview(): void {
        this.setDropTarget(null);
    }

    /** @param target 新的放置目标 @example this.setDropTarget(mesh); @returns 无返回值。 */
    private setDropTarget(target: Group | null): void {
        // 同一目标只需同步颜色和世界矩阵，不重复创建覆盖 Mesh。
        if (target !== this._dropTarget) {
            const previous = this._dropTarget;
            this._dropTarget = null;
            this.refreshGroupColor(previous);
            // 普通 Mesh 的反馈是独立资源，不能改动用户共享的几何与材质。
            if (this._dropFrame !== null) {
                this._dropFrame.removeSelf();
                this._dropFrame.dispose();
                this._dropFrame = null;
                this._dropFrameWorld = null;
            }
            this._dropTarget = target;
            // 真实 Group 已自带虚线边框，直接改变它的颜色。
            if (target instanceof EditorGroup) {
                this.refreshGroupColor(target);
            } else if (target instanceof Mesh && target.data !== undefined) {
                // 复制目标外形绘制独立蓝边，避免修改共享样式或材质。
                const style = new Style();
                style.edge.enabled = true;
                style.edge.width = 3;
                style.edge.pixelAligned = "px";
                style.edge.color.copy(this.dropTargetColor);
                const geometry = CloneGeometry(target.data);
                geometry.style = style;
                const material = new BaseMaterial(style);
                material.transparent = true;
                material.cullMode = "none";
                const frame = new Mesh(geometry, material, style);
                frame.noSelect = true;
                frame.order = 1000002;
                this._scene.add(frame);
                this._dropFrame = frame;
                this.refreshDropFeedback();
            }
        }
    }

    /** @param candidate 可能受选择或拖放影响的组 @example this.refreshGroupColor(group); @returns 无返回值。 */
    private refreshGroupColor(candidate: Group | null): void {
        // 普通 Mesh 的边框由独立覆盖层显示，只有编辑组有可直接换色的虚线框。
        if (candidate instanceof EditorGroup) {
            const color = candidate.frame.style?.solid.color;
            if (color !== undefined) {
                // 拖放目标优先于当前选择，退出后还原原先的选中颜色。
                if (candidate === this._dropTarget) {
                    color.copy(this.dropTargetColor);
                } else if (candidate === this._activeGroup) {
                    // 当前仍被选中的组恢复选择色。
                    color.setHex("#73d8ff");
                } else {
                    color.setHex("#ffe66a");
                }
            }
        }
    }

    /** @example this.refreshDropFeedback(); @returns 无返回值。 */
    private refreshDropFeedback(): void {
        const target = this._dropTarget;
        const frame = this._dropFrame;
        // 颜色可在拖动期间修改；Group 和普通 Mesh 各自同步正在显示的边框。
        if (target instanceof EditorGroup) {
            this.refreshGroupColor(target);
        } else if (target instanceof Mesh && frame !== null) {
            // 普通对象保持独立覆盖层的颜色与世界位置同步。
            frame.style?.edge.color.copy(this.dropTargetColor);
            const world = [...target.getRenderMatrix(this._camera).data];
            const previous = this._dropFrameWorld;
            /** @param value 矩阵值 @param index 所在位置 @example WasChanged(1, 0); @returns 是否变动。 */
            const WasChanged = (value: number, index: number): boolean => value !== previous?.[index];
            // 目标若因外部逻辑移动，覆盖边框仍跟随实际世界矩阵。
            if (previous === null || world.some(WasChanged)) {
                SetWorldMatrix(frame, world);
                this._dropFrameWorld = world;
            }
        }
    }

    /** @param group 目标组 @example this.rotationPosition(group); @returns 顶边中心及箭头端点；退化时为 null。 */
    private rotationPosition(group: EditorGroup): { top: Vec2; outward: Vec2; endpoint: Vec2 } | null {
        const world = group.frame.getRenderMatrix(this._camera).data;
        const center = this._camera.worldToWindow(Transform(world, new Vec2(0, 0)), this._render);
        const top = this._camera.worldToWindow(Transform(world, new Vec2(0, group.height / 2)), this._render);
        const dx = top.x - center.x;
        const dy = top.y - center.y;
        const length = Math.hypot(dx, dy);
        // 组高太小时不生成会落在框内的旋转手柄。
        if (length > Number.EPSILON) {
            const outward = new Vec2(dx / length, dy / length);
            return {
                top,
                outward,
                endpoint: new Vec2(top.x + outward.x * 24, top.y + outward.y * 24),
            };
        } else {
            return null;
        }
    }

    /**
     * 以鼠标释放点寻找最内层可接收目标。
     * @param client 窗口点
     * @param moving 当前拖动对象
     * @param excluded 同批拖动的其他对象，不能互相成为父节点
     * @example const target = hierarchy.dropTarget(client, mesh);
     * @returns 命中的实体或层级组；空白返回场景根节点。
     */
    public dropTarget(client: Vec2, moving: Group, excluded: readonly Group[] = []): Group {
        const event = new MouseEvent("click", { clientX: client.x, clientY: client.y });
        const hits = this._select.SelectPicker(event);
        const filled = new Set<Mesh>([...hits.Rect2D, ...hits.NGon, ...hits.Poly2D, ...hits.Base2D, ...hits.Text]);
        const sorted = Select.Sort(hits, "desc");
        const movingNodes = [moving, ...excluded];
        /** @param node 同批拖动的对象 @param candidate 候选容器 @example IsInsideMoving(node, group); @returns 是否会形成层级环。 */
        const IsInsideMoving = (node: Group, candidate: Group): boolean =>
            candidate === node || IsDescendant(candidate, node);
        /** @param candidate 候选容器 @example IsMoving(candidate); @returns 是否属于当前拖动层级。 */
        const IsMoving = (candidate: Group): boolean => {
            /** @param node 当前移动节点 @example BelongsToMoving(node); @returns 是否为节点本身或子节点。 */
            const BelongsToMoving = (node: Group): boolean => IsInsideMoving(node, candidate);
            return movingNodes.some(BelongsToMoving);
        };
        // nest 单独决定普通填充对象能否作为父节点，已有真实 Group 始终可以接收。
        if (this.nest) {
            for (const mesh of sorted) {
                // 排除同批对象及其后代，避免形成循环层级。
                if (filled.has(mesh) && !IsMoving(mesh)) {
                    return mesh;
                }
            }
        }
        const groups = this.groups();
        // 逆向遍历使最深、最后添加的目标优先接收对象。
        for (let index = groups.length - 1; index >= 0; index--) {
            const group = groups[index];
            // 自身及子组不能作为拖动组的父级，避免层级环。
            if (!IsMoving(group) && this.contains(group, client)) {
                return group;
            }
        }
        return this._scene;
    }

    /** @param client 起笔窗口点 @example const group = hierarchy.groupAt(client); @returns 最内层虚线组或 null。 */
    public groupAt(client: Vec2): EditorGroup | null {
        const groups = this.groups();
        // 新绘制形状按起笔位置归属，而不受完成时鼠标位置变化影响。
        for (let index = groups.length - 1; index >= 0; index--) {
            // 最内层边界优先成为新形状的父组。
            if (this.contains(groups[index], client)) {
                return groups[index];
            }
        }
        return null;
    }

    /** @param group 目标组 @param client 窗口点 @example hierarchy.contains(group, client); @returns 点是否在组范围内。 */
    public contains(group: EditorGroup, client: Vec2): boolean {
        const point = this._camera.windowToWorld(client, this._render);
        const local = Transform(Invert(group.frame.getRenderMatrix(this._camera).data), point);
        return Math.abs(local.x) <= group.width / 2 && Math.abs(local.y) <= group.height / 2;
    }

    /** @example const groups = hierarchy.groups(); @returns 场景内按层级顺序排列的编辑组。 */
    public groups(): EditorGroup[] {
        const result: EditorGroup[] = [];
        /** @param parent 当前组 @example Walk(scene); @returns 无返回值。 */
        const Walk = (parent: Group): void => {
            // 遍历普通 Group 只是寻找其内部的可编辑组边界。
            for (const child of parent.children) {
                // 编辑组自身及其后代都应进入命中顺序。
                if (child instanceof EditorGroup) {
                    result.push(child);
                    Walk(child);
                } else if (child instanceof Group) {
                    // 普通 Group 无独立边界，但不阻止更深的编辑组。
                    Walk(child);
                }
            }
        };
        Walk(this._scene);
        return result;
    }

    /** @param group 待测组 @param client 窗口点 @param edgeOnly 是否忽略内部 @example this.hit(group, client, false); @returns 命中。 */
    private hit(group: EditorGroup, client: Vec2, edgeOnly: boolean): HierarchyHit | null {
        const halfX = group.width / 2;
        const halfY = group.height / 2;
        const local = [
            new Vec2(-halfX, -halfY), new Vec2(halfX, -halfY),
            new Vec2(halfX, halfY), new Vec2(-halfX, halfY),
        ];
        const matrix = group.frame.getRenderMatrix(this._camera).data;
        /** @param point 局部角点 @example ToScreen(point); @returns 当前窗口点。 */
        const ToScreen = (point: Vec2): Vec2 => this._camera.worldToWindow(Transform(matrix, point), this._render);
        const corners = local.map(ToScreen);
        const cornerHandles: HierarchyHandle[] = ["sw", "se", "ne", "nw"];
        // 四角优先于边线，避免近角处被误当作单轴缩放。
        for (let index = 0; index < corners.length && this.switches.scale; index++) {
            // 角点拾取采用固定屏幕容差，与相机缩放无关。
            if (Math.hypot(client.x - corners[index].x, client.y - corners[index].y) <= this.radius) {
                return { group, action: "scale", handle: cornerHandles[index] };
            }
        }
        const edgeHandles: HierarchyHandle[] = ["s", "e", "n", "w"];
        // 边线只承担缩放；旋转必须命中当前组的独立箭头。
        for (let index = 0; index < corners.length && this.switches.scale; index++) {
            const distance = SegmentDistance(client, corners[index], corners[(index + 1) % corners.length]);
            // 边线本身负责缩放，其外侧窄区域负责旋转。
            if (distance <= this.radius) {
                return { group, action: "scale", handle: edgeHandles[index] };
            }
        }
        // 鼠标位于空白内部时移动整个组，位于外侧近边时旋转。
        if (ContainsPoint(client, corners)) {
            // 优先边线测试时，内部留给实体 Mesh 的拖动。
            if (edgeOnly) {
                // 实体优先级由 Editor 继续判断。
            } else if (this.switches.move) {
                // 组内部空白只在平移启用时生成可拖动命中。
                return { group, action: "move", handle: null };
            }
        }
        return null;
    }

    /** @param gesture 原始手势 @param current 当前世界点 @example this.transform(gesture, current); @returns 新世界矩阵。 */
    private transform(gesture: HierarchyGesture, current: Vec2): number[] {
        const original = gesture.worldMatrix;
        // 每帧从按下时的双精度矩阵计算，避免累积误差。
        if (gesture.action === "move") {
            const delta = Translate(current.x - gesture.startWorld.x, current.y - gesture.startWorld.y);
            return Multiply(delta, original);
        } else if (gesture.action === "rotate") {
            // 旋转中心固定在组的局部原点。
            const center = new Vec2(original[6], original[7]);
            const start = Math.atan2(gesture.startWorld.y - center.y, gesture.startWorld.x - center.x);
            const end = Math.atan2(current.y - center.y, current.x - center.x);
            const around = Multiply(Translate(center.x, center.y),
                Multiply(Rotate(end - start), Translate(-center.x, -center.y)));
            return Multiply(around, original);
        } else {
            const group = gesture.node;
            // 缩放沿组自身坐标轴，从按下时的对边锚点开始。
            if (group instanceof EditorGroup && gesture.handle !== null) {
                const displayInverse = Invert(gesture.displayMatrix);
                const start = Transform(displayInverse, gesture.startWorld);
                const end = Transform(displayInverse, current);
                const handle = gesture.handle;
                let anchorX = 0;
                let anchorY = 0;
                let factorX = 1;
                let factorY = 1;
                // 左右手柄的固定点是相反一侧。
                if (handle.includes("e")) {
                    anchorX = -group.width / 2;
                } else if (handle.includes("w")) {
                    // 左边移动时固定右边。
                    anchorX = group.width / 2;
                }
                // 上下手柄分别固定下边或上边。
                if (handle.includes("n")) {
                    anchorY = -group.height / 2;
                } else if (handle.includes("s")) {
                    // 下边移动时固定上边。
                    anchorY = group.height / 2;
                }
                // 零倍率会让层级矩阵不可逆，因此保留极薄的有效范围。
                if (handle.includes("e") || handle.includes("w")) {
                    factorX = Math.max(0.0001, (end.x - anchorX) / (start.x - anchorX));
                }
                // 边手柄只改变对应轴，角手柄两个轴都改变。
                if (handle.includes("n") || handle.includes("s")) {
                    factorY = Math.max(0.0001, (end.y - anchorY) / (start.y - anchorY));
                }
                const local = Multiply(Translate(anchorX, anchorY),
                    Multiply(Scale(factorX, factorY), Translate(-anchorX, -anchorY)));
                // 局部范围是固定屏幕单位，固定对边造成的中心位移需换回逻辑世界单位。
                if (group.ignoreZoom) {
                    local[6] /= gesture.zoom;
                    local[7] /= gesture.zoom;
                }
                return Multiply(original, local);
            }
            return original;
        }
    }
}

type HierarchyNode = Mesh | EditorGroup;

type HierarchyAction = "move" | "scale" | "rotate";

type HierarchyHandle = "sw" | "se" | "ne" | "nw" | "s" | "e" | "n" | "w";

interface HierarchyHit {
    group: EditorGroup;
    action: HierarchyAction;
    handle: HierarchyHandle | null;
}

interface HierarchyGesture {
    pointerId: number;
    node: HierarchyNode;
    action: HierarchyAction;
    handle: HierarchyHandle | null;
    startClient: Vec2;
    startWorld: Vec2;
    worldMatrix: number[];
    displayMatrix: number[];
    zoom: number;
    moved: boolean;
}

/** @param node 移动对象 @param target 新父节点 @example Reparent(mesh, group); @returns 无返回值。 */
const Reparent = (node: Group, target: Group): void => {
    const world = [...node.ensureWorldMatrix().data];
    target.add(node);
    SetWorldMatrix(node, world);
};

/** @param node 目标节点 @param world 期望世界矩阵 @example SetWorldMatrix(mesh, world); @returns 无返回值。 */
const SetWorldMatrix = (node: Group, world: ArrayLike<number>): void => {
    let local = Array.from(world);
    // 先消去新父级矩阵，再写回本地矩阵，保持释放前后的世界外观。
    if (node.parent !== null) {
        local = Multiply(Invert(node.parent.ensureWorldMatrix().data), world);
    }
    const scaleX = Math.hypot(local[0], local[1]);
    const determinant = local[0] * local[4] - local[1] * local[3];
    // 同步可直接表示的位移、旋转和倍率，后续属性编辑仍以当前层级姿态开始。
    // 层级组合可能产生切变，完整矩阵始终在最后写回以保留准确外观。
    if (scaleX > Number.EPSILON) {
        node.rotation = Math.atan2(local[1], local[0]);
        node.scale.set(scaleX, determinant / scaleX);
    }
    node.position.set(local[6], local[7]);
    node.matrix.set(local as [number, number, number, number, number, number, number, number, number]);
};

/** @param candidate 候选父组 @param node 被移动节点 @example IsDescendant(group, node); @returns 是否为其后代。 */
const IsDescendant = (candidate: Group, node: Group): boolean => {
    let parent = candidate.parent;
    // 沿父链检查可避免把 Group 拖入自己的子层级。
    while (parent !== null) {
        // 命中移动对象即代表候选为它的后代。
        if (parent === node) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
};

/** @param x X @param y Y @example Translate(1, 2); @returns 平移矩阵。 */
const Translate = (x: number, y: number): number[] => [1, 0, 0, 0, 1, 0, x, y, 1];

/** @param angle 弧度 @example Rotate(1); @returns 旋转矩阵。 */
const Rotate = (angle: number): number[] => [Math.cos(angle), Math.sin(angle), 0,
    -Math.sin(angle), Math.cos(angle), 0, 0, 0, 1];

/** @param x X 倍率 @param y Y 倍率 @example Scale(2, 3); @returns 缩放矩阵。 */
const Scale = (x: number, y: number): number[] => [x, 0, 0, 0, y, 0, 0, 0, 1];

/** @param left 左矩阵 @param right 右矩阵 @example Multiply(a, b); @returns 两矩阵乘积。 */
const Multiply = (left: ArrayLike<number>, right: ArrayLike<number>): number[] => [
    left[0] * right[0] + left[3] * right[1], left[1] * right[0] + left[4] * right[1], 0,
    left[0] * right[3] + left[3] * right[4], left[1] * right[3] + left[4] * right[4], 0,
    left[0] * right[6] + left[3] * right[7] + left[6],
    left[1] * right[6] + left[4] * right[7] + left[7], 1,
];

/** @param matrix 可逆仿射矩阵 @example Invert(matrix); @returns 逆矩阵。 */
const Invert = (matrix: ArrayLike<number>): number[] => {
    const determinant = matrix[0] * matrix[4] - matrix[1] * matrix[3];
    // 奇异矩阵无法保持外观，使用单位矩阵作为安全兜底。
    if (Number.isFinite(determinant) && determinant !== 0) {
        return [matrix[4] / determinant, -matrix[1] / determinant, 0,
            -matrix[3] / determinant, matrix[0] / determinant, 0,
            (matrix[3] * matrix[7] - matrix[4] * matrix[6]) / determinant,
            (matrix[1] * matrix[6] - matrix[0] * matrix[7]) / determinant, 1];
    } else {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
};

/** @param matrix 仿射矩阵 @param point 局部点 @example Transform(matrix, point); @returns 映射点。 */
const Transform = (matrix: ArrayLike<number>, point: Vec2): Vec2 => new Vec2(
    matrix[0] * point.x + matrix[3] * point.y + matrix[6],
    matrix[1] * point.x + matrix[4] * point.y + matrix[7],
);

export default Hierarchy;
export { Reparent };
export type { HierarchyHit };
