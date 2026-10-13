import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import type { Material2d } from "../../global-types";
import Group from "../../Group";
import HelperGrid from "../../Helper/HelperGrid";
import IMesh from "../../IMesh";
import BaseMaterial from "../../Material/baseMaterial";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import PolySelectTool from "../../Select/PolySelectTool";
import Style from "../../Style";
import type { BaseDelegate } from "../Collection/BaseChange";
import BaseChange from "../Collection/BaseChange";
import type { OrderSource } from "../Collection/Order";
import { FrameResizeCursor } from "../cursors";
import handGrabbingCursorUrl from "../cursors/hand-grabbing.svg?url";
import handCursorUrl from "../cursors/hand.svg?url";
import moveCursorUrl from "../cursors/move.svg?url";
import plusCursorUrl from "../cursors/plus.svg?url";
import rotateCursorUrl from "../cursors/rotate.svg?url";
import type { EditSwitches } from "../EditSwitches";
import { CreateEditSwitches } from "../EditSwitches";
import { CloneMesh, HistoryData, HistoryMesh, MeshId, SelectedHistoryMeshes } from "../History/records";
import type { SnapOptions } from "../Snap";
import {
    CollectSnapGeometry, CreateSnapOptions, NearbySnapPoints,
} from "../Snap";
import { CreateRotationHandle } from "../Snap/RotationHandle";
import { CreateDrawingStyle, CreateSelectionStyle } from "../Styles";
import type { PolyEditDocument, PolyEditRecord } from "./data";
import { ApplyPoly, CapturePoly, CreatePoly } from "./data";
import type { PolyBounds } from "./geometry";
import {
    BoundsOfMeshes,
    ContainsPoint,
    ContainsWindingPoint,
    CreateGroupFrame,
    CreateSelectionFrame,
    IsCanvasPoint,
    LocalBounds,
    ProjectSegment,
    ScreenVertices,
    SegmentDistance,
    ToLocal,
    ToParent,
    UpdateSelectionFrame,
    WorldVertices,
} from "./geometry";
import type { PolyTransformsHooks } from "./transforms";
import PolyTransforms from "./transforms";
import type { GestureMode, GroupAction, GroupHandle, PolyEditMode, PolyEditOrigin, PolyGesture, PolyHandle, PolyHistoryEntry, PolyHistoryItem, PolyHistoryState, PolyHit, PolyMatrix, PolySnapshot, SelectionOperation } from "./types";

/** 单独维护普通 Poly2D Mesh 的选择、绘制、移动、缩放和旋转。 */
class PolyEditTool {
    /** 搜索和编辑多边形的场景。 */
    public readonly scene: Scene;
    /** 编辑覆盖层所属的渲染器。 */
    public readonly render: Render;
    /** 窗口与世界坐标转换使用的相机。 */
    public readonly camera: Camera;
    /** 多边形点选与矩形框选工具。 */
    public readonly selector: PolySelectTool;
    /** 编辑器节点，包含对象组和辅助组。 */
    public readonly group: Group = new Group(0, 0);
    /** 预览框、组框和旋转点所在的辅助组。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 编辑器直接管理的多边形对象组。 */
    public readonly meshGroup: Group = new Group(0, 0);
    /** 顶点、边与吸附的屏幕容差，单位 CSS 像素。 */
    public radius: number = 10;
    /** 外轮廓面积上限。 */
    public max: number = Infinity;
    /** 多边形包围盒宽度上限。 */
    public maxWidth: number = Infinity;
    /** 多边形包围盒宽度下限。 */
    public minWidth: number = 0;
    /** 多边形包围盒高度上限。 */
    public maxHeight: number = Infinity;
    /** 多边形包围盒高度下限。 */
    public minHeight: number = 0;
    /** 世界活动区域左边界。 */
    public left: number = -Infinity;
    /** 世界活动区域上边界，Y 轴向上。 */
    public top: number = Infinity;
    /** 世界活动区域右边界。 */
    public right: number = Infinity;
    /** 世界活动区域下边界。 */
    public bottom: number = -Infinity;
    /** 完成路径后以首顶点或包围盒中心作为 Mesh 的局部原点，默认中心。 */
    public origin: PolyEditOrigin = "center";
    /** 新建路径是否闭合，默认 true；开放路径至少两个点即可完成。 */
    public closed: boolean = true;
    /** 下次新增对象的样式模板。 */
    private _style: Style = CreateDrawingStyle();
    /** 下次新增对象的材质模板。 */
    private _material: Material2d = new BaseMaterial(this._style);
    /** 下一个新建多边形是否保持屏幕尺寸，默认关闭；不改变已有对象。 */
    public ignoreZoom: boolean = false;
    /** 新建或 push 导入实体的圆角自动精度开关，默认开启；不改用户轮廓顶点。 */
    public autoPrecision: boolean = true;
    /** 下一次手绘多边形的层级，默认 0；导入对象保留自己的 order。 */
    private _order: number = 0;
    private _orderSource: OrderSource | null = null;
    /** 已选对象的边框和顶点样式模板。 */
    public selectStyle: Style = CreateSelectionStyle(false);
    /** 首次点到未选对象时是否仅选中、不立即拖动。 */
    public activeOnly: boolean = true;
    /** 世界坐标平移及顶点拖动步进。 */
    public translationStep: number = 1;
    /** 是否启用世界原点网格步进。 */
    public translationStepEnabled: boolean = false;
    /** 吸附总开关，默认关闭；具体候选由 snapOptions 控制。 */
    public snap: boolean = false;
    /** 顶点、边线、交点和网格的独立吸附开关，默认全部开启。 */
    public snapOptions: SnapOptions = CreateSnapOptions();
    /** 旋转角度步进，单位度。 */
    public rotationStep: number = 1;
    /** 是否启用角度步进。 */
    public rotationStepEnabled: boolean = false;
    /** 移动时锁定屏幕轴，框选从按下点向四周展开；组角点缩放时保持比例。 */
    public constrain: boolean = false;
    /** 当前选中的全部 Mesh。 */
    public actives: Mesh[] = [];
    /** 最近一次新加入选择的 Mesh。 */
    public active: Mesh[] = [];
    /** 是否接收指针事件。 */
    public enabled: boolean = true;
    /** 集合编辑器构建时关闭自动监听和自带网格。 */
    public readonly fromCollection: boolean;
    /** 指针选择、创建和变换的独立开关；默认全部开启。 */
    public switches: EditSwitches = CreateEditSwitches();

    private _helperGrid: HelperGrid | null = null;
    private _activeType: PolyEditMode = "edit";
    private _mult: boolean = true;
    private _rotationEnabled: boolean = true;
    private _gesture: PolyGesture | null = null;
    private _selectionFrame: Mesh | null = null;
    private _createPreview: Mesh | null = null;
    private _drawPoints: Vec2[] = [];
    private _groupFrame: Mesh | null = null;
    private _groupBounds: PolyBounds | null = null;
    private _selectionBoxes = new Map<Mesh, Mesh>();
    private _rotationHandles = new Map<Mesh, Mesh>();
    private _savedStyles = new Map<Mesh, Style>();
    private _data: PolyEditRecord[] = [];
    private _undoStack: (PolyHistoryEntry | BaseChange)[] = [];
    private _redoStack: (PolyHistoryEntry | BaseChange)[] = [];
    private _historyStart: PolyHistoryState | null = null;
    private _historyReplay: boolean = false;
    private _clipboard: Mesh[] = [];
    private _clipboardClient: Vec2 | null = null;
    private _lastClient: Vec2 | null = null;
    private _touchPointers = new Set<number>();
    private _viewPointerId: number | null = null;
    private _viewContainerCursor: string | null = null;
    private _destroyed: boolean = false;
    private readonly _events: AbortController = new AbortController();
    private readonly _originalCursor: string;
    private readonly _originalTouchAction: string;

    private readonly _onSelect = new Map<string, (active: Mesh[], actives: Mesh[]) => void>();
    private readonly _onDeselect = new Map<string, (removed: Mesh[], actives: Mesh[]) => void>();
    private readonly _onSelectionChange = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onMove = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onResize = new Map<string, (mesh: Mesh) => void>();
    private readonly _onScale = new Map<string, (mesh: Mesh) => void>();
    private readonly _onRotate = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onPositionChange = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onEdit = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onAdd = new Map<string, (mesh: Mesh) => void>();
    private readonly _onRemove = new Map<string, (mesh: Mesh) => void>();
    private readonly _onDestroy = new Map<string, () => void>();
    private readonly _onModeChange = new Map<string, (mode: PolyEditMode) => void>();
    private readonly _onBase = new Map<string, (mesh: Mesh) => void>();
    private _baseDelegate: BaseDelegate | null = null;
    private readonly _onSave = new Map<string, (data: PolyEditDocument) => void>();
    /** transforms 算法与主编辑器分开维护，配置由实时接口提供。 */
    private readonly _transforms: PolyTransforms = new PolyTransforms(this, this.createPolyTransformsHooks());


    /**
     * 创建多边形编辑器；集合编辑器可关闭自动监听和背景网格。
     * @param scene 候选对象场景
     * @param render 画布渲染器
     * @param camera 当前相机
     * @param autoBind 是否自动监听指针
     * @param helper 是否创建背景网格
     * @param fromCollection 是否由集合编辑器持有
     * @example
     * const tool = new PolyEditTool(scene, render, camera);
     * @returns 多边形编辑器
     */
    public constructor(
        scene: Scene,
        render: Render,
        camera: Camera,
        autoBind: boolean = true,
        helper: boolean = autoBind,
        fromCollection: boolean = false,
    ) {
        this.scene = scene;
        // 集合只开启一次；显式选择四叉树的 Scene 保留调用方设置。
        if (!fromCollection && scene.box === null && scene.quad === null) {
            scene.box = camera;
        }
        this.render = render;
        this.camera = camera;
        this.fromCollection = fromCollection;
        this.selector = new PolySelectTool(scene, render, camera, !fromCollection);
        this.group.add(this.meshGroup);
        this.group.add(this.frameGroup);
        scene.add(this.group);
        if (helper) {
            // 独立工具按配置建立辅助网格，集合创建时可复用上层辅助层。
            this._helperGrid = new HelperGrid(scene, render, camera);
        }
        // 已有多边形开启圆角自动精度，只移动场景直属的管理对象。
        for (const candidate of [...scene.ensureLists()]) {
            // 实例批次和辅助节点由调用方负责，嵌套实体保留原变换。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect && candidate.data instanceof Poly2D) {
                candidate.autoPrecision = this.autoPrecision;
                // 已有父级负责世界变换，接管编辑不改变该关系。
                if (candidate.parent === scene) {
                    this.meshGroup.add(candidate);
                }
            }
        }
        this._originalCursor = render.canvas.style.cursor;
        this._originalTouchAction = render.canvas.style.touchAction;
        render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
        render.canvas.style.touchAction = "none";
        if (autoBind) {
            // 事件由本工具拥有时才绑定，集合可自行分派同一画布的输入。
            const signal = this._events.signal;
            render.container.addEventListener("pointerdown", this.trackTouchPointerDown.bind(this), { capture: true, signal });
            render.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { signal });
            render.canvas.addEventListener("contextmenu", this.handleContextMenu.bind(this), { signal });
            window.addEventListener("pointermove", this.handlePointerMove.bind(this), { signal });
            window.addEventListener("pointerup", this.handlePointerUp.bind(this), { signal });
            window.addEventListener("pointercancel", this.handlePointerCancel.bind(this), { signal });
            window.addEventListener("blur", this.handleBlur.bind(this), { signal });
        }
        this.refreshData();
    }

    /** @example const order = tool.order; @returns 下一次手绘多边形的层级，默认 0。 */
    public get order(): number {
        return this._order;
    }

    /** @param value 下一次手绘多边形的层级 @example tool.order = 3; @returns 无返回值。 */
    public set order(value: number) {
        // 层级进入保存记录和排序计算，拒绝非有限数值。
        if (Number.isFinite(value)) {
            this._order = value;
        } else {
            throw new RangeError("PolyEditTool.order must be finite.");
        }
    }

    /** @internal @param source 集合提供的原始层级读取器，null 恢复直接读取 @example tool.setOrderSource(source); @returns 无返回值。 */
    public setOrderSource(source: OrderSource | null): void {
        this._orderSource = source;
    }

    /** @internal @param node 用户节点 @example const order = tool.sourceOrder(mesh); @returns 不包含集合临时提升的层级。 */
    public sourceOrder(node: Group): number {
        return this._orderSource?.(node) ?? node.order;
    }

    /** @example const style = tool.style; @returns 下次新建多边形的样式模板。 */
    public get style(): Style {
        // 合并编辑器可共用材质；其他工具换样式后同步本工具的样式引用。
        if (this._material.style !== this._style) {
            this._style = this._material.style;
        }
        return this._style;
    }

    /** @param value 下次新建多边形的样式模板 @example tool.style = new Style(); @returns 无返回值。 */
    public set style(value: Style) {
        this._material.style = value;
        this._style = value;
    }

    /** @param mesh 编辑对象 @example tool.sourceStyle(mesh); @returns 未被选中装饰覆盖的用户样式。 */
    public sourceStyle(mesh: Mesh): Style {
        return this._savedStyles.get(mesh) ?? mesh.style ?? mesh.data?.style ?? new Style();
    }

    /** @example const material = tool.material; @returns 下次新建多边形的材质模板。 */
    public get material(): Material2d {
        return this._material;
    }

    /** @param value 下次新建多边形的材质模板 @example tool.material = new BaseMaterial(); @returns 无返回值。 */
    public set material(value: Material2d) {
        this._material = value;
        // 材质已有样式时，以材质的样式作为下一次绘制的共同模板。
        if (value.style instanceof Style) {
            this._style = value.style;
        } else {
            value.style = this._style;
        }
    }

    /**
     * 为将来的集合编辑器创建无自动监听、无重复网格的工具。
     * @param scene 候选场景
     * @param render 当前渲染器
     * @param camera 当前相机
     * @example
     * const tool = PolyEditTool.build(scene, render, camera);
     * @returns 由外部转发指针事件的工具
     */
    public static build(scene: Scene, render: Render, camera: Camera): PolyEditTool {
        return new PolyEditTool(scene, render, camera, false, false, true);
    }

    /** @example const shown = tool.helper; @returns 是否显示背景网格。 */
    public get helper(): boolean {
        return this._helperGrid !== null;
    }

    /** @param value 是否显示背景网格 @example tool.helper = true; @returns 无返回值。 */
    public set helper(value: boolean) {
        // 只在开关实际变化时创建或释放辅助网格。
        if (value && this._helperGrid === null) {
            this._helperGrid = new HelperGrid(this.scene, this.render, this.camera);
        } else if (!value && this._helperGrid !== null) {
            // 关闭辅助层同时释放旧网格，避免残留不可见资源。
            this._helperGrid.destroy();
            this._helperGrid = null;
        }
    }

    /** @example const grid = tool.helperGrid; @returns 当前网格或 null。 */
    public get helperGrid(): HelperGrid | null {
        return this._helperGrid;
    }

    /** @example const meshes = tool.movingMeshes; @returns 当前平移手势中的多边形集合。 */
    public get movingMeshes(): Mesh[] {
        const gesture = this._gesture;
        // 只有拖动实体内部才允许集合编辑器重新指定父节点。
        if (gesture !== null && gesture.mode === "move") {
            const meshes: Mesh[] = [];
            // 多选平移仍按快照顺序提交同一落点。
            for (const snapshot of gesture.snapshots) {
                meshes.push(snapshot.mesh);
            }
            return meshes;
        } else {
            return [];
        }
    }

    /** @example tool.selectAll(); @returns 无返回值，选择全部可编辑多边形并遵循 mult 开关。 */
    public selectAll(): void {
        const meshes: Mesh[] = [];
        // 仅收集本工具的几何类型，select 统一过滤辅助对象、实例和单选约束。
        for (const candidate of this.scene.ensureLists()) {
            // 场景中的 Group 不能当作可编辑几何传入。
            if (candidate instanceof Mesh && candidate.data instanceof Poly2D) {
                meshes.push(candidate);
            }
        }
        this.select(meshes);
    }

    /**
     * 接收合并编辑器统一平移后的通知，不重新应用位移。
     * @param meshes 已移动的多边形成员
     * @example tool.notifyExternalMove([mesh]);
     * @returns 无返回值。
     */
    public notifyExternalMove(meshes: Mesh[]): void {
        // 空分组不发出事件，所有成员的位置已由集合统一写入。
        if (meshes.length > 0) {
            this.emit(this._onMove, [...meshes]);
            this.emit(this._onPositionChange, [...meshes]);
            this.emit(this._onEdit, [...meshes]);
            this.update();
        }
    }

    /** @example const drawing = tool.isDrawing; @returns 是否正在等待下一次单击追加节点。 */
    public get isDrawing(): boolean {
        return this._drawPoints.length > 0;
    }

    /** @example const mode = tool.activeType; @returns 当前编辑模式。 */
    public get activeType(): PolyEditMode {
        return this._activeType;
    }

    /** @param value 新模式 @example tool.activeType = "group"; @returns 无返回值。 */
    public set activeType(value: PolyEditMode) {
        // 集合模式下不能由本工具建立类型专属组框。
        if (this.fromCollection && value === "group") {
            console.warn("PolyEditTool: collection group mode belongs to Editor.");
            value = "edit";
        }
        // 模式改变会终止未提交的手势，组框由当前选择重建。
        if (this._activeType !== value) {
            this.cancel();
            this._activeType = value;
            this.removeGroupFrame();
            if (value === "group") {
                // 进入组模式以当前选择建立一次基准框，后续变换沿用该框。
                this.resetGroupFrame();
            }
            this.emit(this._onModeChange, value);
            this.update();
        }
    }

    /** @example const enabled = tool.rotationEnabled; @returns 是否允许单体及组旋转。 */
    public get rotationEnabled(): boolean {
        return this._rotationEnabled;
    }

    /** @param value 旋转开关 @example tool.rotationEnabled = false; @returns 无返回值。 */
    public set rotationEnabled(value: boolean) {
        this._rotationEnabled = value;
        this.update();
    }

    /** @example const enabled = tool.mult; @returns 是否保留多个选中对象。 */
    public get mult(): boolean {
        return this._mult;
    }

    /** @param value 多选开关 @example tool.mult = false; @returns 无返回值。 */
    public set mult(value: boolean) {
        this._mult = value;
        // 切为单选时只保留最后选中的一个对象。
        if (!value && this.actives.length > 1) {
            this.select(this.actives.slice(-1));
        }
    }

    /** @example const records = tool.data; @returns 当前普通多边形的纯数据快照。 */
    public get data(): readonly PolyEditRecord[] {
        this.refreshData();
        return this._data;
    }

    /** @example const count = tool.undoCount; @returns 可撤销批次数。 */
    public get undoCount(): number {
        return this._undoStack.length;
    }

    /** @example const count = tool.redoCount; @returns 可重做批次数。 */
    public get redoCount(): number {
        return this._redoStack.length;
    }

    /**
     * 按注册顺序通知同一事件的全部监听。
     * @param callbacks 具名监听集合
     * @param args 本次事件参数
     * @example
     * this.emit(this._onEdit, meshes);
     * @returns 无返回值
     */
    private emit<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void {
        // 快照允许监听器在回调中安全地注册或删除其他监听器。
        for (const callback of [...callbacks.values()]) {
            callback(...args);
        }
    }

    /** @param key 监听名 @param callback 选中回调 @example tool.onSelect("ui", callback); @returns 无返回值。 */
    public onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void {
        this._onSelect.set(key, callback);
    }

    /** @param key 监听名 @example tool.onSelectDelete("ui"); @returns 是否删除监听。 */
    public onSelectDelete(key: string): boolean {
        return this._onSelect.delete(key);
    }

    /** @param key 监听名 @param callback 取消选择回调 @example tool.onDeselect("ui", callback); @returns 无返回值。 */
    public onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void {
        this._onDeselect.set(key, callback);
    }

    /** @param key 监听名 @example tool.onDeselectDelete("ui"); @returns 是否删除监听。 */
    public onDeselectDelete(key: string): boolean {
        return this._onDeselect.delete(key);
    }

    /** @param key 监听名 @param callback 选择变化回调 @example tool.onSelectionChange("ui", callback); @returns 无返回值。 */
    public onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onSelectionChange.set(key, callback);
    }

    /** @param key 监听名 @example tool.onSelectionChangeDelete("ui"); @returns 是否删除监听。 */
    public onSelectionChangeDelete(key: string): boolean {
        return this._onSelectionChange.delete(key);
    }

    /** @param key 监听名 @param callback 移动回调 @example tool.onMove("ui", callback); @returns 无返回值。 */
    public onMove(key: string, callback: (actives: Mesh[]) => void): void {
        this._onMove.set(key, callback);
    }

    /** @param key 监听名 @example tool.onMoveDelete("ui"); @returns 是否删除监听。 */
    public onMoveDelete(key: string): boolean {
        return this._onMove.delete(key);
    }

    /** @param key 监听名 @param callback 半径或边数回调 @example tool.onResize("ui", callback); @returns 无返回值。 */
    public onResize(key: string, callback: (mesh: Mesh) => void): void {
        this._onResize.set(key, callback);
    }

    /** @param key 监听名 @example tool.onResizeDelete("ui"); @returns 是否删除监听。 */
    public onResizeDelete(key: string): boolean {
        return this._onResize.delete(key);
    }

    /** @param key 监听名 @param callback 组缩放回调 @example tool.onScale("ui", callback); @returns 无返回值。 */
    public onScale(key: string, callback: (mesh: Mesh) => void): void {
        this._onScale.set(key, callback);
    }

    /** @param key 监听名 @example tool.onScaleDelete("ui"); @returns 是否删除监听。 */
    public onScaleDelete(key: string): boolean {
        return this._onScale.delete(key);
    }

    /** @param key 监听名 @param callback 旋转回调 @example tool.onRotate("ui", callback); @returns 无返回值。 */
    public onRotate(key: string, callback: (actives: Mesh[]) => void): void {
        this._onRotate.set(key, callback);
    }

    /** @param key 监听名 @example tool.onRotateDelete("ui"); @returns 是否删除监听。 */
    public onRotateDelete(key: string): boolean {
        return this._onRotate.delete(key);
    }

    /** @param key 监听名 @param callback 位置回调 @example tool.onPositionChange("ui", callback); @returns 无返回值。 */
    public onPositionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onPositionChange.set(key, callback);
    }

    /** @param key 监听名 @example tool.onPositionChangeDelete("ui"); @returns 是否删除监听。 */
    public onPositionChangeDelete(key: string): boolean {
        return this._onPositionChange.delete(key);
    }

    /** @param key 监听名 @param callback 任意编辑回调 @example tool.onEdit("ui", callback); @returns 无返回值。 */
    public onEdit(key: string, callback: (actives: Mesh[]) => void): void {
        this._onEdit.set(key, callback);
    }

    /** @param key 监听名 @example tool.onEditDelete("ui"); @returns 是否删除监听。 */
    public onEditDelete(key: string): boolean {
        return this._onEdit.delete(key);
    }

    /** @param key 监听名 @param callback 新增回调 @example tool.onAdd("ui", callback); @returns 无返回值。 */
    public onAdd(key: string, callback: (mesh: Mesh) => void): void {
        this._onAdd.set(key, callback);
    }

    /** @param key 监听名 @example tool.onAddDelete("ui"); @returns 是否删除监听。 */
    public onAddDelete(key: string): boolean {
        return this._onAdd.delete(key);
    }

    /** @param key 监听名 @param callback 删除回调 @example tool.onRemove("ui", callback); @returns 无返回值。 */
    public onRemove(key: string, callback: (mesh: Mesh) => void): void {
        this._onRemove.set(key, callback);
    }

    /** @param key 监听名 @example tool.onRemoveDelete("ui"); @returns 是否删除监听。 */
    public onRemoveDelete(key: string): boolean {
        return this._onRemove.delete(key);
    }

    /** @param key 监听名 @param callback 销毁回调 @example tool.onDestroy("ui", callback); @returns 无返回值。 */
    public onDestroy(key: string, callback: () => void): void {
        this._onDestroy.set(key, callback);
    }

    /** @param key 监听名 @example tool.onDestroyDelete("ui"); @returns 是否删除监听。 */
    public onDestroyDelete(key: string): boolean {
        return this._onDestroy.delete(key);
    }

    /** @param key 监听名 @param callback 模式回调 @example tool.onModeChange("ui", callback); @returns 无返回值。 */
    public onModeChange(key: string, callback: (mode: PolyEditMode) => void): void {
        this._onModeChange.set(key, callback);
    }

    /** @param key 监听名 @example tool.onModeChangeDelete("ui"); @returns 是否删除监听。 */
    public onModeChangeDelete(key: string): boolean {
        return this._onModeChange.delete(key);
    }

    /** @param key 监听名 @param callback 接收刚降级的 Mesh @example tool.onBase("ui", (mesh) => inspect(mesh)); @returns 无返回值。 */
    public onBase(key: string, callback: (mesh: Mesh) => void): void {
        this._onBase.set(key, callback);
    }

    /** @param key 监听名 @example tool.onBaseDelete("ui"); @returns 是否删除监听。 */
    public onBaseDelete(key: string): boolean {
        return this._onBase.delete(key);
    }

    /** @internal @param delegate 集合接管函数 @example tool.setBaseDelegate(convert); @returns 无返回值。 */
    public setBaseDelegate(delegate: BaseDelegate): void {
        this._baseDelegate = delegate;
    }

    /** @internal @param mesh 已完成降级的对象 @example tool.notifyBase(mesh); @returns 无返回值，触发具名降级监听。 */
    public notifyBase(mesh: Mesh): void {
        this.emit(this._onBase, mesh);
    }

    /**
     * 把当前选择降级为 Base2D；独立工具解除选择，集合工具移交统一 Base 编辑。
     * @example const meshes = tool.toBase();
     * @returns 本次实际降级的对象，空选择返回空数组；整批转换可撤销。
     */
    public toBase(): Mesh[] {
        // 集合拥有混合类型历史和选择，子工具不能建立另一份撤销边界。
        if (typeof this._baseDelegate === "function") {
            return this._baseDelegate([...this.actives]);
        } else {
            this.cancel();
            const change = new BaseChange(this.actives, this.sourceStyle.bind(this));
            // 空选择不解除状态，也不触发编辑事件或占用撤销步数。
            if (change.meshes.length > 0) {
                this.select([]);
                change.redo();
                this._undoStack.push(change);
                this._redoStack.length = 0;
                this.refreshData();
                this.update();
                // 几何安装完成后再通知，接收者可以直接读取 Base 轮廓。
                for (const mesh of change.meshes) {
                    this.notifyBase(mesh);
                }
                this.emit(this._onEdit, [...change.meshes]);
            }
            return [...change.meshes];
        }
    }

    /** @param key 监听名 @param callback 保存数据回调 @example tool.onSave("ui", callback); @returns 无返回值。 */
    public onSave(key: string, callback: (data: PolyEditDocument) => void): void {
        this._onSave.set(key, callback);
    }

    /** @param key 监听名 @example tool.onSaveDelete("ui"); @returns 是否删除监听。 */
    public onSaveDelete(key: string): boolean {
        return this._onSave.delete(key);
    }

    /**
     * 按替换、增量或减量更新场景中普通多边形的选择集。
     * @param meshes Mesh、ID 或其数组
     * @param operation 集合操作
     * @example
     * tool.select([mesh], "add");
     * @returns 无返回值
     */
    public select(meshes: Mesh | number | readonly (Mesh | number)[], operation: SelectionOperation = "replace"): void {
        let inputs: readonly (Mesh | number)[];
        // 单值和混合数组都经同一条候选过滤路径。
        if (meshes instanceof Mesh || typeof meshes === "number") {
            inputs = [meshes];
        } else {
            inputs = meshes;
        }
        const sceneMeshes = this.scene.ensureLists();
        const valid: Mesh[] = [];
        for (const input of inputs) {
            // 按用户传入顺序解析身份，使单选退化时能够保留最后一项。
            let mesh: Mesh | undefined;
            // 数字 ID 只从当前场景解析，避免复活已删除对象。
            if (typeof input === "number") {
                for (const candidate of sceneMeshes) {
                    // 在当前场景中查找稳定 ID，而不是使用易变的绘制槽位。
                    if (candidate instanceof Mesh && candidate.id === input) {
                        // 找到对应实体后保留其现有实例，供后续合法性过滤。
                        mesh = candidate;
                    }
                }
            } else {
                mesh = input;
            }
            // 减选允许已选对象离场后仍从选择集合移除。
            if (mesh !== undefined && operation === "sub" && this.actives.includes(mesh)) {
                valid.push(mesh);
            } else if (mesh !== undefined && sceneMeshes.includes(mesh) && mesh.data instanceof Poly2D &&
                !(mesh instanceof IMesh) && !mesh.noSelect) {
                // 只接受当前场景的可选多边形实体，排除批次与辅助框。
                valid.push(mesh);
            }
        }
        let next: Mesh[];
        // 增选保留原顺序，减选仅删除命中对象。
        if (operation === "add") {
            next = [...new Set([...this.actives, ...valid])];
        } else if (operation === "sub") {
            // 减选保留未命中对象，避免改变它们的编辑先后顺序。
            next = [];
            // 减选只移除本次命中对象，其余实体保留原选择顺序。
            for (const mesh of this.actives) {
                if (valid.includes(mesh) === false) {
                    // 未命中的对象继续参与编辑。
                    next.push(mesh);
                }
            }
        } else {
            next = [...new Set(valid)];
        }
        if (!this.mult && next.length > 1) {
            // 单选接口仍可接收数组，但只采用最后一个合法对象并提示调用者。
            console.warn("PolyEditTool.select: mult is disabled; using the last Mesh.");
            next = next.slice(-1);
        }
        const added: Mesh[] = [];
        const removed: Mesh[] = [];
        // 分别记录进入和离开选择集的实体，通知不重复包含原有成员。
        for (const mesh of next) {
            if (this.actives.includes(mesh) === false) {
                // 本次新增的选择才触发 onSelect。
                added.push(mesh);
            }
        }
        // 取消选择时按原集合顺序恢复各实体的普通样式。
        for (const mesh of this.actives) {
            if (next.includes(mesh) === false) {
                // 已离开目标选择集的实体才触发 onDeselect。
                removed.push(mesh);
            }
        }
        // 未变化的选择不重建组框或重复发回调。
        if (added.length > 0 || removed.length > 0) {
            this.actives = next;
            this.active = added;
            for (const mesh of removed) {
                // 退出选择后恢复原始样式，黄色编辑样式不写入用户数据。
                this.restoreStyle(mesh);
            }
            for (const mesh of added) {
                // 新入选对象安装独立选择样式，不改动共享材质的其他对象。
                this.applySelectStyle(mesh);
            }
            if (this._activeType === "group") {
                // 选择集合变更后重新确定组的中心和范围。
                this.resetGroupFrame();
            }
            if (removed.length > 0) {
                // 仅在确有对象离开选择时发送取消事件。
                this.emit(this._onDeselect, [...removed], [...next]);
            }
            if (added.length > 0) {
                // 仅通知本次新增选择，既有选择不会重复触发。
                this.emit(this._onSelect, [...added], [...next]);
            }
            this.emit(this._onSelectionChange, [...next]);
            this.update();
        }
    }

    /**
     * 分离共享几何，避免一件对象的编辑改变其他 Mesh。
     * @param mesh 目标 Mesh
     * @example
     * const geometry = this.uniqueGeometry(mesh);
     * @returns 只由该 Mesh 持有的多边形几何
     */
    private uniqueGeometry(mesh: Mesh): Poly2D {
        const geometry = mesh.data as Poly2D;
        for (const candidate of this.scene.ensureLists()) {
            // 仅在确实共享同一几何实例时复制。
            if (candidate !== mesh && candidate.data === geometry) {
                const clone = geometry.clone();
                mesh.data = clone;
                return clone;
            }
        }
        return geometry;
    }

    /** @param mesh 新选对象 @example this.applySelectStyle(mesh); @returns 无返回值。 */
    private applySelectStyle(mesh: Mesh): void {
        const geometry = this.uniqueGeometry(mesh);
        const original = mesh.style ?? geometry.style;
        this._savedStyles.set(mesh, original);
        const selected = original.clone();
        selected.edge.copy(this.selectStyle.edge);
        selected.points.copy(this.selectStyle.points);
        mesh.style = selected;
    }

    /** @param mesh 离开选择的对象 @example this.restoreStyle(mesh); @returns 无返回值。 */
    private restoreStyle(mesh: Mesh): void {
        const original = this._savedStyles.get(mesh);
        // 只还原本工具实际覆盖过的样式。
        if (original !== undefined) {
            mesh.style = original;
            this._savedStyles.delete(mesh);
        }
    }

    /** @param mesh 候选 Mesh @example const record = this.captureUserPoly(mesh); @returns 未覆盖选择色的纯数据。 */
    private captureUserPoly(mesh: Mesh): PolyEditRecord {
        const record = CapturePoly(mesh, this._savedStyles.get(mesh));
        record.order = this.sourceOrder(mesh);
        return record;
    }

    /** @example this.refreshData(); @returns 无返回值。 */
    private refreshData(): void {
        const records: PolyEditRecord[] = [];
        for (const candidate of this.scene.ensureLists()) {
            // 读取完整场景实体，不把视口裁剪结果误作编辑文档。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect &&
                candidate.data instanceof Poly2D && candidate.material !== undefined) {
                // 数据源只包含可编辑实体，忽略辅助框、实例批次和缺少材质的节点。
                records.push(this.captureUserPoly(candidate));
            }
        }
        this._data = records;
    }

    /** @example const state = this.captureHistoryState(); @returns 对象引用、快照和选中 ID。 */
    private captureHistoryState(): PolyHistoryState {
        const items: PolyHistoryItem[] = [];
        for (const candidate of this.scene.ensureLists()) {
            // 每笔历史同时记录对象身份、父级和用户数据。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect &&
                candidate.data instanceof Poly2D && candidate.material !== undefined) {
                // 只为本工具管理的多边形保留历史，避免接管其他编辑器。
                items.push({
                    mesh: candidate,
                    parent: candidate.parent as Group | Scene | null,
                    data: this.captureUserPoly(candidate),
                });
            }
        }
        return { items, selectedIds: this.actives.map(MeshId) };
    }

    /** @example this.beginHistory(); @returns 无返回值。 */
    private beginHistory(): void {
        // 一个指针动作中嵌套的新增或删除只占一个撤销条目。
        if (!this._historyReplay && this._historyStart === null) {
            this._historyStart = this.captureHistoryState();
        }
    }

    /** @example this.commitHistory(); @returns 无返回值。 */
    private commitHistory(): void {
        const before = this._historyStart;
        this._historyStart = null;
        // 单纯的选中状态变化不占用编辑历史。
        if (before !== null && !this._historyReplay) {
            const after = this.captureHistoryState();
            const beforeData = before.items.map(HistoryData);
            const afterData = after.items.map(HistoryData);
            if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
                // 无数据变化的点击不占用撤销项，也不清空可重做记录。
                this._undoStack.push({ before, after });
                this._redoStack.length = 0;
            }
            this.refreshData();
        }
    }

    /**
     * 恢复一批对象的父级、属性和选择，不替换仍存在的 Mesh 引用。
     * @param state 目标历史状态
     * @example
     * this.restoreHistoryState(entry.before);
     * @returns 无返回值
     */
    private restoreHistoryState(state: PolyHistoryState): void {
        this._historyReplay = true;
        this.select([]);
        const wanted = new Set(state.items.map(HistoryMesh));
        for (const candidate of this.scene.ensureLists()) {
            // 撤回新增时只删除本工具负责的普通多边形。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && candidate.data instanceof Poly2D &&
                !candidate.noSelect && !wanted.has(candidate)) {
                candidate.removeSelf();
            }
        }
        for (const item of state.items) {
            // 被删除的对象恢复到原父级，运行期 ID 和材质仍保持一致。
            if (item.mesh.parent !== item.parent) {
                const parent = item.parent ?? this.meshGroup;
                parent.add(item.mesh);
            }
            this.uniqueGeometry(item.mesh);
            ApplyPoly(item.mesh, item.data);
        }
        const selected = SelectedHistoryMeshes(state.items, state.selectedIds);
        this.select(selected);
        this._historyReplay = false;
        this.refreshData();
        this.update();
    }

    /** @example tool.undo(); @returns 是否恢复了一批编辑。 */
    public undo(): boolean {
        const entry = this._undoStack.pop();
        if (typeof entry === "object") {
            // 有撤销条目时将其转移到重做栈，再恢复对应快照。
            this._redoStack.push(entry);
            // 主动转换只恢复本批几何，不改动其他形状工具管理的对象。
            if (entry instanceof BaseChange) {
                this.select([]);
                entry.undo();
                this.select(entry.meshes);
                this.refreshData();
                this.update();
            } else {
                this.restoreHistoryState(entry.before);
            }
            return true;
        } else {
            return false;
        }
    }

    /** @example tool.redo(); @returns 是否重放了一批编辑。 */
    public redo(): boolean {
        const entry = this._redoStack.pop();
        if (typeof entry === "object") {
            // 有重做条目时重新进入撤销栈，保持两个栈的往返顺序。
            this._undoStack.push(entry);
            // 重做转换重新解除原类型选择，避免残留矩形或多边形辅助框。
            if (entry instanceof BaseChange) {
                this.select([]);
                entry.redo();
                this.refreshData();
                this.update();
            } else {
                this.restoreHistoryState(entry.after);
            }
            return true;
        } else {
            return false;
        }
    }

    /** @example const document = tool.save(); @returns 可序列化 JSON 并通知 onSave。 */
    public save(): PolyEditDocument {
        this.refreshData();
        const document: PolyEditDocument = { version: 1, meshes: structuredClone(this._data) };
        this.emit(this._onSave, document);
        return document;
    }

    /**
     * 以 JSON 文档重建编辑器所管理的多边形。
     * @param document 由 save 生成的版本化数据
     * @example
     * tool.load(document);
     * @returns 新建的 Mesh，运行期 ID 与记录中 ID 不同
     */
    public load(document: PolyEditDocument): Mesh[] {
        const header: { version: number } = document;
        if (header.version !== 1 || !Array.isArray(document.meshes)) {
            // 入口拒绝未知文档版本及缺少实体数组的数据。
            throw new TypeError("Unsupported PolyEditTool document.");
        }
        this.beginHistory();
        this.select([]);
        for (const mesh of [...this.scene.ensureLists()]) {
            // 文档替换整个当前编辑集合，也要包含嵌套组中的多边形。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Poly2D) {
                mesh.removeSelf();
                this.emit(this._onRemove, mesh);
            }
        }
        const meshes: Mesh[] = [];
        for (const record of document.meshes) {
            // 按记录重建每个实体，并恢复精度设置与添加通知。
            const mesh = CreatePoly(record);
            mesh.autoPrecision = record.autoPrecision ?? this.autoPrecision;
            this.meshGroup.add(mesh);
            meshes.push(mesh);
            this.emit(this._onAdd, mesh);
        }
        this.commitHistory();
        this.update();
        this.emit(this._onEdit, meshes);
        return meshes;
    }

    /**
     * 把普通多边形加入编辑器管理组。
     * @param meshes 单件或多件 Mesh
     * @example
     * tool.push(mesh);
     * @returns 成功加入的对象
     */
    public push(meshes: Mesh | readonly Mesh[]): Mesh[] {
        let input: readonly Mesh[];
        if (meshes instanceof Mesh) {
            // 将单个对象规范为列表，使代码添加与批量添加走同一流程。
            input = [meshes];
        } else {
            input = meshes;
        }
        const added: Mesh[] = [];
        this.beginHistory();
        for (const mesh of input) {
            // 只接收普通 Poly2D，辅助框和实例网格不进入编辑集合。
            if (!(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Poly2D) {
                mesh.autoPrecision = this.autoPrecision;
                this.meshGroup.add(mesh);
                added.push(mesh);
                this.emit(this._onAdd, mesh);
            }
        }
        this.commitHistory();
        this.update();
        return added;
    }

    /** @param mesh 待删除 Mesh @example tool.remove(mesh); @returns 是否已从场景移除。 */
    public remove(mesh: Mesh): boolean {
        // 公共删除入口只处理仍在当前场景的普通多边形。
        if (!(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Poly2D &&
            this.scene.ensureLists().includes(mesh)) {
            const ownsHistory = this._historyStart === null;
            if (ownsHistory) {
                // 独立删除完成后立即提交历史，供撤销恢复。
                this.beginHistory();
            }
            const removed = mesh.removeSelf();
            if (removed) {
                // 成功移除后同步选择和数据源，失败删除不发送误导事件。
                this.select([mesh], "sub");
                this.restoreStyle(mesh);
                this.emit(this._onRemove, mesh);
                this.refreshData();
            }
            if (ownsHistory) {
                // 独立删除完成后立即提交历史，供撤销恢复。
                this.commitHistory();
            }
            this.update();
            return removed;
        } else {
            return false;
        }
    }

    /** @example tool.removeSelected(); @returns 本次删除的全部选中 Mesh。 */
    public removeSelected(): Mesh[] {
        const selected = [...this.actives];
        this.beginHistory();
        for (const mesh of selected) {
            // 逐个移除本批选择，复用统一删除入口。
            this.remove(mesh);
        }
        this.commitHistory();
        return selected;
    }

    /** @example tool.copySelected(); @returns 复制到内存剪贴板的对象数。 */
    public copySelected(): number {
        this._clipboard = [];
        for (const mesh of this.actives) {
            // 剪贴板保存独立克隆，后续编辑不影响已复制的内容。
            const clone = mesh.clone();
            clone.order = this.sourceOrder(mesh);
            const original = this._savedStyles.get(mesh);
            if (original !== undefined) {
                // 复制实体原有样式，防止把临时黄色选中效果复制出去。
                clone.style = original.clone();
            }
            this._clipboard.push(clone);
        }
        this._clipboardClient = this._lastClient?.clone() ?? null;
        return this._clipboard.length;
    }

    /** @example const pasted = tool.paste(); @returns 新增并选中的复制对象。 */
    public paste(): Mesh[] {
        const copies = this._clipboard.map(CloneMesh);
        const sourceBounds = BoundsOfMeshes(this._clipboard, this.camera);
        let deltaX = 10;
        let deltaY = -10;
        // 有新的鼠标位置时将整批对象中心放到当前指针世界坐标。
        if (sourceBounds !== null && this._lastClient !== null &&
            (this._clipboardClient === null || Math.hypot(
                this._lastClient.x - this._clipboardClient.x,
                this._lastClient.y - this._clipboardClient.y,
            ) > 1)) {
            const target = this.camera.windowToWorld(this._lastClient, this.render);
            deltaX = target.x - sourceBounds.center.x;
            deltaY = target.y - sourceBounds.center.y;
        }
        this.beginHistory();
        for (const mesh of copies) {
            // 对全部副本应用相同世界偏移，保持原来的相对布局。
            const oldCenter = new Vec2(mesh.getRenderMatrix(this.camera).data[6], mesh.getRenderMatrix(this.camera).data[7]);
            const parentPoint = ToParent(mesh, new Vec2(oldCenter.x + deltaX, oldCenter.y + deltaY));
            if (parentPoint !== null) {
                // 父级变换可逆时才写入局部位置，避免产生无效坐标。
                mesh.position.set(parentPoint.x, parentPoint.y);
            }
            this.meshGroup.add(mesh);
            this.emit(this._onAdd, mesh);
        }
        if (copies.length > 0) {
            // 成功粘贴后直接选中新副本，便于继续拖动。
            this.select(copies);
        }
        this.commitHistory();
        this.update();
        return copies;
    }

    /** @example const removed = tool.cutSelected(); @returns 剪切的对象。 */
    public cutSelected(): Mesh[] {
        this.copySelected();
        return this.removeSelected();
    }

    /**
     * 根据对象、相机和样式变化刷新覆盖层。
     * @example
     * tool.update();
     * @returns 无返回值
     */
    public update(): void {
        if (!this._destroyed) {
            // 工具销毁后不再访问辅助资源或更新交互状态。
            if (this._helperGrid !== null) {
                // 辅助网格存在时随相机同步，禁用网格不影响实体编辑。
                this._helperGrid.update();
            }
            this.updateSelectionBoxes();
            this.updateRotationHandles();
            this.refreshData();
            if (this._lastClient !== null && this._gesture === null) {
                // 空闲时依据最后鼠标位置刷新光标，拖动中保持当前手柄状态。
                this.updateCursor(this._lastClient);
            }
        }
    }

    /** @example tool.cancel(); @returns 无返回值。 */
    public cancel(): void {
        const gesture = this._gesture;
        this._gesture = null;
        this.removeSelectionFrame();
        this.removeCreatePreview();
        this._drawPoints = [];
        if (gesture !== null && this.render.canvas.hasPointerCapture(gesture.pointerId)) {
            // 仅释放本工具实际取得的指针捕获。
            this.render.canvas.releasePointerCapture(gesture.pointerId);
        }
        this.commitHistory();
        this.update();
    }

    /** @example tool.destroy(); @returns 无返回值。 */
    public destroy(): void {
        if (!this._destroyed) {
            // 清理操作只执行一次，避免重复解除绑定和销毁通知。
            this.cancel();
            this._destroyed = true;
            this._events.abort();
            this.removeGroupFrame();
            this.removeRotationHandles();
            for (const box of this._selectionBoxes.values()) {
                // 销毁工具时释放所有单体选中包围框，不保留辅助资源。
                box.removeSelf();
                box.dispose();
            }
            this._selectionBoxes.clear();
            for (const mesh of [...this._savedStyles.keys()]) {
                // 销毁工具前还原每个选择对象的用户样式。
                this.restoreStyle(mesh);
            }
            this.render.canvas.style.cursor = this._originalCursor;
            this.render.canvas.style.touchAction = this._originalTouchAction;
            this.clearViewPointer();
            this._touchPointers.clear();
            for (const child of [...this.meshGroup.children]) {
                // 实体转回场景继续保留，编辑器销毁不删除用户内容。
                this.scene.add(child);
            }
            if (this._helperGrid !== null) {
                // 一并释放本工具创建的辅助网格与标尺。
                this._helperGrid.destroy();
                this._helperGrid = null;
            }
            this.group.removeSelf();
            this.emit(this._onDestroy);
        }
    }

    /** @example this.removeSelectionFrame(); @returns 无返回值。 */
    private removeSelectionFrame(): void {
        if (this._selectionFrame !== null) {
            // 框选预览存在时解除场景关联并清空缓存。
            this._selectionFrame.removeSelf();
            this._selectionFrame = null;
        }
    }

    /** @example this.removeCreatePreview(); @returns 无返回值。 */
    private removeCreatePreview(): void {
        if (this._createPreview !== null) {
            // 结束或取消新建时移除半透明预览。
            this._createPreview.removeSelf();
            this._createPreview = null;
        }
    }

    /** @example this.removeGroupFrame(); @returns 无返回值。 */
    private removeGroupFrame(): void {
        if (this._groupFrame !== null) {
            // 删除旧组框后由新选择或新模式重新构建。
            this._groupFrame.removeSelf();
            this._groupFrame = null;
        }
        this._groupBounds = null;
    }

    /** @example this.resetGroupFrame(); @returns 无返回值。 */
    private resetGroupFrame(): void {
        this.removeGroupFrame();
        if (this._activeType === "group" && this.actives.length > 0) {
            // 只有组模式且存在选择时才显示统一变换框。
            const bounds = BoundsOfMeshes(this.actives, this.camera);
            if (bounds !== null) {
                // 可计算范围时创建组框，空几何不产生无效辅助实体。
                this._groupBounds = bounds;
                this._groupFrame = CreateGroupFrame(bounds);
                this.frameGroup.add(this._groupFrame);
            }
        }
    }

    /**
     * 从上层到下层拾取多边形，优先顶点，其次可插点的边，最后是填充内部。
     * @param client 浏览器窗口坐标
     * @example
     * const hit = this.pick(client);
     * @returns 命中对象、节点下标及边上最近点
     */
    private pick(client: Vec2): PolyHit | null {
        const drawList = this.scene.ensureLists();
        for (let index = drawList.length - 1; index >= 0; index--) {
            // 逆绘制顺序拾取，使上层实体的内部优先于下层手柄。
            const mesh = drawList[index];
            // 辅助 Mesh 与实例模板不参与多边形编辑。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Poly2D) {
                const points = ScreenVertices(mesh, this.camera, this.render);
                // 点优先于边，避免在已有顶点旁插入重叠节点。
                for (let vertex = 0; vertex < points.length; vertex++) {
                    if (Math.hypot(points[vertex].x - client.x, points[vertex].y - client.y) <= this.radius) {
                        // 原始顶点优先命中，拖动时不会被相邻边抢走。
                        return { mesh, handle: "vertex", index: vertex };
                    }
                }
                let edgeCount = Math.max(0, points.length - 1);
                // 闭合轮廓额外允许在末点到首点之间插入节点。
                if (mesh.data.closed) {
                    edgeCount = points.length;
                }
                // 开放折线不能凭空连接末点到首点。
                for (let edge = 0; edge < edgeCount; edge++) {
                    const first = points[edge];
                    const second = points[(edge + 1) % points.length];
                    if (SegmentDistance(client, first, second) <= this.radius) {
                        // 边命中返回有限线段上的最近位置，作为插入节点的初始点。
                        return { mesh, handle: "edge", index: edge,
                            point: ProjectSegment(client, first, second) };
                    }
                }
                // 无填充的开放路径没有可拖动的内部区域。
                if (mesh.data.closed && points.length >= 3 && ContainsWindingPoint(client, points)) {
                    return { mesh, handle: "body" };
                }
            }
        }
        return null;
    }

    /** @param client 窗口坐标 @example const mesh = tool.pickMesh(client); @returns 节点、边或实体命中的多边形。 */
    public pickMesh(client: Vec2): Mesh | null {
        return this.pick(client)?.mesh ?? null;
    }

    /**
     * 旋转图标放在随 Mesh 旋转的局部包围盒顶部。
     * @param mesh 目标 Mesh
     * @example
     * const point = this.rotationHandlePosition(mesh);
     * @returns 包围盒顶部、外向单位向量和图标命中中心
     */
    private rotationHandlePosition(mesh: Mesh): { top: Vec2; outward: Vec2; endpoint: Vec2 } | null {
        const bounds = LocalBounds(mesh);
        // 轮廓为空时没有可跟随的顶部边。
        if (bounds !== null) {
            const matrix = mesh.getRenderMatrix(this.camera).data;
            const centerWorld = new Vec2(
                matrix[0] * bounds.center.x + matrix[3] * bounds.center.y + matrix[6],
                matrix[1] * bounds.center.x + matrix[4] * bounds.center.y + matrix[7],
            );
            const topWorld = new Vec2(
                matrix[0] * bounds.center.x + matrix[3] * bounds.top + matrix[6],
                matrix[1] * bounds.center.x + matrix[4] * bounds.top + matrix[7],
            );
            const center = this.camera.worldToWindow(centerWorld, this.render);
            const top = this.camera.worldToWindow(topWorld, this.render);
            let outwardX = top.x - center.x;
            let outwardY = top.y - center.y;
            let length = Math.hypot(outwardX, outwardY);
            // 扁平轮廓仍沿局部上方向放置旋转图标。
            if (length <= Number.EPSILON) {
                const upWorld = new Vec2(
                    centerWorld.x + matrix[3],
                    centerWorld.y + matrix[4],
                );
                const up = this.camera.worldToWindow(upWorld, this.render);
                outwardX = up.x - center.x;
                outwardY = up.y - center.y;
                length = Math.hypot(outwardX, outwardY);
            }
            // 零缩放下无法定义外向方向，因此不显示旋转控件。
            if (length > Number.EPSILON) {
                const outward = new Vec2(outwardX / length, outwardY / length);
                const endpoint = new Vec2(top.x + outward.x * 24, top.y + outward.y * 24);
                return { top, outward, endpoint };
            }
        }
        return null;
    }

    /** @example this.updateSelectionBoxes(); @returns 无返回值。 */
    private updateSelectionBoxes(): void {
        const keep = new Set(this.actives);
        // 每个选中 Mesh 维护自己的框，未选中的框随选择变化释放。
        for (const [mesh, box] of this._selectionBoxes) {
            // 对象离开选择集合后释放其独立辅助框。
            if (!keep.has(mesh)) {
                box.removeSelf();
                box.dispose();
                this._selectionBoxes.delete(mesh);
            }
        }
        // 组模式只呈现组框，保留单体框实例以便退出后直接恢复。
        if (this._activeType === "group") {
            // 独立框从辅助组摘下后仍可在返回编辑模式时复用。
            for (const box of this._selectionBoxes.values()) {
                // 只摘除仍挂在场景上的框，避免重复变更场景版本。
                if (box.parent !== null) {
                    box.removeSelf();
                }
            }
        } else {
            // 逐件更新包围盒，保留多选时每件自己的旋转姿态。
            for (const mesh of keep) {
                const bounds = LocalBounds(mesh);
                // 空轮廓不会生成辅助矩形。
                if (bounds !== null) {
                    let box = this._selectionBoxes.get(mesh);
                    // 复用辅助 Mesh，避免拖动期间重复创建材质和几何体。
                    if (box === undefined) {
                        box = CreateSelectionFrame();
                        const style = box.style;
                        // 选中框只描边，不遮挡多边形填充。
                        if (style !== undefined) {
                            style.solid.enabled = false;
                            style.edge.color.setHex("#ffe66a");
                            style.edge.width = 1;
                        }
                        this.frameGroup.add(box);
                        this._selectionBoxes.set(mesh, box);
                    } else if (box.parent === null) {
                        // 离开组模式后重新接入之前隐藏的单体框。
                        this.frameGroup.add(box);
                    }
                    const geometry = box.data;
                    // 只有编辑器创建的矩形框允许改写宽高与变换。
                    if (geometry instanceof Rect2D) {
                        const matrix = mesh.getRenderMatrix(this.camera).data;
                        const centerWorld = new Vec2(
                            matrix[0] * bounds.center.x + matrix[3] * bounds.center.y + matrix[6],
                            matrix[1] * bounds.center.x + matrix[4] * bounds.center.y + matrix[7],
                        );
                        const rightWorld = new Vec2(centerWorld.x + matrix[0], centerWorld.y + matrix[1]);
                        const upWorld = new Vec2(centerWorld.x + matrix[3], centerWorld.y + matrix[4]);
                        const center = ToParent(box, centerWorld);
                        const right = ToParent(box, rightWorld);
                        const up = ToParent(box, upWorld);
                        // 局部包围盒的两条轴经过父级坐标转换后，辅助框与对象保持同向。
                        if (center !== null && right !== null && up !== null) {
                            geometry.width = bounds.width;
                            geometry.height = bounds.height;
                            box.position.set(center.x, center.y);
                            box.matrix.set([
                                right.x - center.x, right.y - center.y, 0,
                                up.x - center.x, up.y - center.y, 0,
                                center.x, center.y, 1,
                            ]);
                        }
                    }
                }
            }
        }
    }

    /** @param client 浏览器窗口坐标 @example const mesh = this.pickRotationHandle(client); @returns 命中的选中 Mesh。 */
    public pickRotationHandle(client: Vec2): Mesh | null {
        if (this._rotationEnabled && this.switches.rotate && this._activeType === "edit") {
            // 单体旋转手柄只在编辑模式和允许旋转时参与命中。
            const drawList = this.scene.ensureLists();
            for (let index = drawList.length - 1; index >= 0; index--) {
                // 按视觉层级逆序寻找最上方的旋转图标。
                const mesh = drawList[index];
                if (mesh instanceof Mesh && this.actives.includes(mesh)) {
                    // 仅已选对象显示并响应旋转手柄。
                    const point = this.rotationHandlePosition(mesh);
                    if (point !== null && Math.hypot(point.endpoint.x - client.x, point.endpoint.y - client.y) <= Math.max(this.radius, 9)) {
                        // 图标命中至少保留九像素容差，便于小图标操作。
                        return mesh;
                    }
                }
            }
        }
        return null;
    }

    /** @example this.updateRotationHandles(); @returns 无返回值。 */
    private updateRotationHandles(): void {
        const keep = new Set(this.actives);
        // 退出编辑或关闭旋转时释放全部单体箭头。
        if (!this._rotationEnabled || !this.switches.rotate || this._activeType !== "edit") {
            keep.clear();
        }
        for (const [mesh, handle] of this._rotationHandles) {
            // 检查现有图标缓存，移除不再属于当前选择的项。
            if (!keep.has(mesh)) {
                // 取消选择或关闭旋转后释放对应辅助实体。
                handle.removeSelf();
                this._rotationHandles.delete(mesh);
            }
        }
        for (const mesh of keep) {
            // 为每个当前可旋转对象同步图标位置和朝向。
            const position = this.rotationHandlePosition(mesh);
            if (position !== null) {
                // 有效轮廓方向才能生成图标的局部基向量。
                const tangent = new Vec2(-position.outward.y, position.outward.x);
                const originWorld = this.camera.windowToWorld(position.top, this.render);
                const rightWorld = this.camera.windowToWorld(new Vec2(
                    position.top.x + tangent.x,
                    position.top.y + tangent.y,
                ), this.render);
                const outwardWorld = this.camera.windowToWorld(new Vec2(
                    position.top.x + position.outward.x,
                    position.top.y + position.outward.y,
                ), this.render);
                let handle = this._rotationHandles.get(mesh);
                if (handle === undefined) {
                    // 首次需要图标时创建，后续帧复用同一实体。
                    handle = CreateRotationHandle();
                    this.frameGroup.add(handle);
                    this._rotationHandles.set(mesh, handle);
                }
                const origin = ToParent(handle, originWorld);
                const right = ToParent(handle, rightWorld);
                const outward = ToParent(handle, outwardWorld);
                if (origin !== null && right !== null && outward !== null) {
                    // 父级坐标换算成功后保持图标的屏幕尺寸与方向。
                    const matrix: [number, number, number, number, number, number, number, number, number] = [
                        right.x - origin.x, right.y - origin.y, 0,
                        outward.x - origin.x, outward.y - origin.y, 0,
                        origin.x, origin.y, 1,
                    ];
                    const current = handle.ensureMatrix().data;
                    let changed = false;
                    for (let index = 0; index < matrix.length; index++) {
                        // 比较矩阵各分量，静止相机不会反复递增辅助对象版本。
                        if (matrix[index] !== current[index]) {
                            // 任一显示变换分量不同都需要更新图标。
                            changed = true;
                        }
                    }
                    if (changed) {
                        // 确有变化才提交变换，避免每帧重复上传。
                        handle.position.set(origin.x, origin.y);
                        handle.matrix.set(matrix);
                    }
                }
            }
        }
    }

    /** @example this.removeRotationHandles(); @returns 无返回值。 */
    private removeRotationHandles(): void {
        for (const handle of this._rotationHandles.values()) {
            // 取消全部旋转显示时移除缓存中的辅助实体。
            handle.removeSelf();
        }
        this._rotationHandles.clear();
    }

    /**
     * 组角点及四条边分别确定可自由缩放的轴。
     * @param client 浏览器窗口坐标
     * @example
     * const action = this.groupAction(client);
     * @returns 当前组操作及其缩放手柄
     */
    private groupAction(client: Vec2): GroupAction {
        const frame = this._groupFrame;
        const bounds = this._groupBounds;
        if (frame !== null && bounds !== null) {
            // 已有组框和基准范围才能判定缩放、移动或外部旋转。
            const matrix = frame.ensureWorldMatrix().data;
            const corners: Vec2[] = [];
            const local = [
                new Vec2(-bounds.width / 2, -bounds.height / 2),
                new Vec2(bounds.width / 2, -bounds.height / 2),
                new Vec2(bounds.width / 2, bounds.height / 2),
                new Vec2(-bounds.width / 2, bounds.height / 2),
            ];
            for (const point of local) {
                // 把组框四角投影到屏幕，容差不受缩放和相机旋转影响。
                const world = new Vec2(
                    matrix[0] * point.x + matrix[3] * point.y + matrix[6],
                    matrix[1] * point.x + matrix[4] * point.y + matrix[7],
                );
                corners.push(this.camera.worldToWindow(world, this.render));
            }
            if (this.switches.scale) {
                // 允许缩放时先检查四角，再检查边线。
                const cornerHandles: GroupHandle[] = ["sw", "se", "ne", "nw"];
                // 四角优先于边线，角点可同时改变两个轴的比例。
                for (let corner = 0; corner < corners.length; corner++) {
                    if (Math.hypot(client.x - corners[corner].x, client.y - corners[corner].y) <= this.radius) {
                        // 角手柄同时控制两个轴，可用于自由组缩放。
                        return { mode: "groupScale", handle: cornerHandles[corner] };
                    }
                }
                const edgeHandles: GroupHandle[] = ["s", "e", "n", "w"];
                // 四条边只拉伸各自对应的轴。
                for (let edge = 0; edge < corners.length; edge++) {
                    if (SegmentDistance(client, corners[edge], corners[(edge + 1) % corners.length]) <= this.radius) {
                        // 边手柄只控制对应一轴，不抢占角点命中。
                        return { mode: "groupScale", handle: edgeHandles[edge] };
                    }
                }
            }
            if (this.switches.move && ContainsPoint(client, corners)) {
                // 框内空白区域交给整组平移，组内不再开启实体编辑。
                return { mode: "groupMove" };
            }
            if (this._rotationEnabled && this.switches.rotate) {
                // 框外区域用于组旋转，关闭旋转时不产生该手势。
                return { mode: "groupRotate" };
            }
        }
        // 组动作被关闭时不把同一指针拖动解释成框选。
        return { mode: "select" };
    }

    /** @param client 浏览器窗口坐标 @example this.updateCursor(client); @returns 无返回值。 */
    private updateCursor(client: Vec2): void {
        // 集合编辑时由 Editor 统一写光标，避免其他子工具的 update 覆盖悬停状态。
        if (!this.fromCollection) {
            this.render.canvas.style.cursor = this.cursorAt(client);
        }
    }

    /** @param client 窗口坐标 @example const css = tool.cursorAt(client); @returns 当前节点、旋转或移动的 CSS 光标。 */
    public cursorAt(client: Vec2): string {
        let url = plusCursorUrl;
        let fallback = "crosshair";
        let plusAvailable = this.switches.create;
        // 查看模式让单击和拖动分别呈现松开与抓取手势。
        if (this._activeType === "view") {
            // 未捕获指针时提示用户可开始平移画布。
            if (this._viewPointerId === null) {
                url = handCursorUrl;
                fallback = "grab";
            } else {
                url = handGrabbingCursorUrl;
                fallback = "grabbing";
            }
        } else if (this._activeType === "group" && this._groupFrame !== null) {
            // 组模式以整组虚线框判定当前指针动作。
            const action = this.groupAction(client);
            // 组框边角用于缩放，内部用于平移，外部用于旋转。
            if (action.mode === "groupScale") {
                return FrameResizeCursor(this._groupFrame.getRenderMatrix(this.camera).data,
                    action.handle, this.camera, this.render);
            } else if (action.mode === "groupMove") {
                // 组内拖动只移动已选对象。
                url = moveCursorUrl;
                fallback = "move";
            } else if (action.mode === "groupRotate") {
                // 组框外侧拖动绕组中心旋转。
                url = rotateCursorUrl;
                fallback = "context-menu";
            } else {
                // 没有可用组动作时恢复普通指针。
                return "default";
            }
        } else if (this._activeType === "edit") {
            // 绘制未闭合轮廓期间，鼠标始终负责添加节点。
            if (this._drawPoints.length === 0) {
                const rotation = this.pickRotationHandle(client);
                const hit = this.pick(client);
                // 旋转图标与内部拖动保留各自状态，顶点和插点共用添加图标。
                if (rotation !== null) {
                    url = rotateCursorUrl;
                    fallback = "context-menu";
                } else if (hit !== null && (!this.activeOnly || this.actives.includes(hit.mesh))) {
                    // 未选对象在 activeOnly 模式下不显示可编辑状态。
                    // 内部拖动平移，边和顶点仍用加号提示节点编辑。
                    if (hit.handle === "body" && this.switches.move) {
                        url = moveCursorUrl;
                        fallback = "move";
                    } else if ((hit.handle === "vertex" && this.switches.resize) ||
                        (hit.handle === "edge" && this.switches.insertVertex)) {
                        // 可拖动顶点和可插点边统一显示加号，提示轮廓编辑。
                        url = plusCursorUrl;
                        fallback = "crosshair";
                        plusAvailable = true;
                    }
                }
            }
        }
        // 禁止新建时只在仍可编辑顶点或边线的地方保留加号。
        if (url === plusCursorUrl && !plusAvailable) {
            return "default";
        }
        return `url("${url}") 16 16, ${fallback}`;
    }

    /** @param meshes 手势影响的对象 @example const snapshots = this.snapshots(meshes); @returns 按下时的矩阵与轮廓顶点。 */
    private snapshots(meshes: readonly Mesh[]): PolySnapshot[] {
        const result: PolySnapshot[] = [];
        for (const mesh of meshes) {
            // 手势开始时冻结每个对象的变换与半径作为计算基准。
            const geometry = mesh.data;
            if (geometry instanceof Poly2D) {
                // 只捕获多边形参数，其他类型由各自工具管理。
                const matrix = mesh.getRenderMatrix(this.camera).data;
                result.push({
                    mesh,
                    center: new Vec2(matrix[6], matrix[7]),
                    position: mesh.position.clone(),
                    rotation: mesh.rotation,
                    scale: mesh.scale.clone(),
                    matrix: Array.from(matrix),
                    localMatrix: Array.from(mesh.ensureMatrix().data),
                    points: new Float32Array(geometry.points),
                    vertices: WorldVertices(mesh, this.camera),
                });
            }
        }
        return result;
    }

    /** @param mesh 候选 Mesh @example const allowed = this.isAllowedPolygon(mesh); @returns 是否满足尺寸与面积限制。 */
    private isAllowedPolygon(mesh: Mesh): boolean {
        return this._transforms.isAllowedPolygon(mesh);
    }

    /** @param mesh 候选 Mesh @example const valid = this.withinWorldLimits(mesh); @returns 所有外圈顶点是否在活动区域内。 */
    private withinWorldLimits(mesh: Mesh): boolean {
        return this._transforms.withinWorldLimits(mesh);
    }

    /** @param gesture 当前手势 @example this.applyMove(gesture); @returns 无返回值。 */
    private applyMove(gesture: PolyGesture): void {
        return this._transforms.applyMove(gesture);
    }

    /** @param gesture 顶点拖动手势 @example this.applyVertex(gesture); @returns 无返回值。 */
    private applyVertex(gesture: PolyGesture): void {
        return this._transforms.applyVertex(gesture);
    }

    /** @param gesture 单体旋转手势 @example this.applyRotate(gesture); @returns 无返回值。 */
    private applyRotate(gesture: PolyGesture): void {
        return this._transforms.applyRotate(gesture);
    }

    /** @param gesture 组自由缩放手势 @example this.applyGroupScale(gesture); @returns 无返回值。 */
    private applyGroupScale(gesture: PolyGesture): void {
        return this._transforms.applyGroupScale(gesture);
    }
    /** @param gesture 组旋转手势 @example this.applyGroupRotate(gesture); @returns 无返回值。 */
    private applyGroupRotate(gesture: PolyGesture): void {
        return this._transforms.applyGroupRotate(gesture);
    }

    /** @param event 新按下的指针 @example this.trackTouchPointerDown(event); @returns 无返回值。 */
    private trackTouchPointerDown(event: PointerEvent): void {
        // 第二根手指交给相机控制器，本次单指编辑不再恢复。
        if (event.pointerType === "touch") {
            this._touchPointers.add(event.pointerId);
            if (this._touchPointers.size > 1 && this._gesture !== null) {
                // 第二根手指加入时取消单指编辑，让控制器接管多指操作。
                this.cancel();
            }
        }
    }

    /** @example this.handleBlur(); @returns 无返回值。 */
    private handleBlur(): void {
        this._touchPointers.clear();
        this.cancel();
        this.clearViewPointer();
    }

    /** @example this.clearViewPointer(); @returns 无返回值。 */
    private clearViewPointer(): void {
        this._viewPointerId = null;
        if (this._viewContainerCursor !== null) {
            // 查看拖动结束后恢复容器原来的光标。
            this.render.container.style.cursor = this._viewContainerCursor;
            this._viewContainerCursor = null;
        }
        if (this._lastClient !== null && !this._destroyed) {
            // 仍有效的鼠标位置用于恢复空闲手柄提示。
            this.updateCursor(this._lastClient);
        }
    }

    /** @param event 画布菜单事件 @example this.handleContextMenu(event); @returns 无返回值。 */
    private handleContextMenu(event: MouseEvent): void {
        // 编辑模式的右键用于结束逐点轮廓，不弹出浏览器菜单。
        if (this._activeType === "edit" && this.enabled) {
            event.preventDefault();
        }
    }

    /**
     * 鼠标左键或单指按下时决定点选、移动、节点编辑或逐点新建。
     * @param event 指针按下事件
     * @example
     * tool.handlePointerDown(event);
     * @returns 无返回值
     */
    public handlePointerDown(event: PointerEvent): void {
        this.trackTouchPointerDown(event);
        const client = new Vec2(event.clientX, event.clientY);
        // 右键完成正在绘制的路径；闭合或开放由编辑器开关决定。
        if (event.pointerType === "mouse" && event.button === 2 && this._drawPoints.length > 0 &&
            this.enabled && !this._destroyed && IsCanvasPoint(client, this.render)) {
            event.preventDefault();
            this.closePath();
            return;
        }
        let accepted = false;
        if (event.pointerType === "touch") {
            // 单指触摸可编辑，多指触摸保留给相机控制器。
            accepted = this._touchPointers.size === 1;
        } else if (event.pointerType === "mouse") {
            // 仅鼠标位置参与持久悬停光标，触摸结束后不留下伪悬停。
            accepted = event.button === 0 && this._touchPointers.size === 0;
        }
        if (this.enabled && !this._destroyed && IsCanvasPoint(client, this.render)) {
            // 有效画布输入才启动交互，禁用或销毁工具不消费事件。
            if (event.pointerType === "mouse") {
                // 仅鼠标位置参与持久悬停光标，触摸结束后不留下伪悬停。
                this._lastClient = client;
            }
            // 查看模式只维护抓取指针；真实相机移动仍由 CameraControl 处理。
            if (this._activeType === "view" && event.pointerType === "mouse" && (event.button === 0 || event.button === 2)) {
                this._viewPointerId = event.pointerId;
                this._viewContainerCursor = this.render.container.style.cursor;
                this.render.container.style.cursor = `url("${handGrabbingCursorUrl}") 16 16, grabbing`;
                this.updateCursor(client);
            } else if (this._activeType !== "view" && accepted) {
                // 编辑输入先冻结历史和世界坐标，再决定本次手势类型。
                this.beginHistory();
                const world = this.camera.windowToWorld(client, this.render);
                const rotationTarget = this.pickRotationHandle(client);
                const hit = this.pick(client);
                let mode: GestureMode = "marquee";
                let target: Mesh | undefined;
                let vertexIndex: number | undefined;
                let edgePoint: Vec2 | undefined;
                let groupHandle: GroupHandle | undefined;
                if (this._activeType === "group" && this._groupFrame !== null) {
                    // 组框存在时由组内部、边界和外侧位置选择组操作。
                    const action = this.groupAction(client);
                    mode = action.mode;
                    groupHandle = action.handle;
                } else if (this._activeType === "edit" && this._drawPoints.length > 0 && this.switches.create) {
                    // 尚未闭合的轮廓继续接收节点，即使鼠标经过别的对象。
                    mode = "create";
                } else if (rotationTarget !== null && this.switches.rotate) {
                    // 单体旋转图标优先于实体内部的移动命中。
                    mode = "rotate";
                    target = rotationTarget;
                } else if (this._activeType === "edit" && hit !== null &&
                    (this.switches.pick || this.actives.includes(hit.mesh))) {
                    // 实体命中后先按选择规则更新集合，再判断是否允许编辑。
                    const selected = this.actives.includes(hit.mesh);
                    let operation: SelectionOperation = "replace";
                    if (this.mult) {
                        // 多选点击增量加入当前选择，保留其他已选对象。
                        operation = "add";
                    }
                    if (this.switches.pick) {
                        // 允许点选时才改变选择，已选对象仍可独立响应编辑。
                        this.select([hit.mesh], operation);
                    }
                    if (!this.activeOnly || selected) {
                        // activeOnly 要求对象在按下前已选中，首次点击只负责选中。
                        target = hit.mesh;
                        if (hit.handle === "body" && this.switches.move) {
                            // 内部拖动受移动开关控制，关闭后保留选择行为。
                            mode = "move";
                        } else if (hit.handle === "vertex" && this.switches.resize) {
                            // 顶点命中记录节点编号，后续只改这个节点。
                            mode = "vertex";
                            vertexIndex = hit.index;
                        } else if (hit.handle === "edge" && this.switches.insertVertex) {
                            // 沿边插点先记住投影位置，然后与普通顶点拖动共用手势。
                            mode = "vertex";
                            vertexIndex = hit.index;
                            edgePoint = hit.point;
                        } else {
                            mode = "select";
                        }
                    } else {
                        mode = "select";
                    }
                } else if (this._activeType === "edit" && hit !== null) {
                    // 禁用点选后仍把已有轮廓当作占用区域，防止误起笔。
                    mode = "select";
                } else if (this._activeType === "edit") {
                    // 已有选择时，第一次空白手势只清除选择，不写入新轮廓节点。
                    if (this.actives.length > 0 && this.switches.pick) {
                        mode = "select";
                        this.select([]);
                    } else if (this.switches.create) {
                        // 没有选择后才开始逐点创建多边形。
                        mode = "create";
                    }
                }
                let affected = this.actives;
                // 单点和旋转只改变目标，多选内部拖动仍同步移动整批。
                if (target !== undefined && mode !== "move") {
                    affected = [target];
                }
                const frameMatrix = this._groupFrame?.ensureWorldMatrix().data;
                let frameCenter: Vec2 | null = null;
                let frameSnapshot: number[] | undefined;
                if (frameMatrix !== undefined) {
                    // 组框已有显示矩阵时采用真实中心作为变换基点。
                    frameCenter = new Vec2(frameMatrix[6], frameMatrix[7]);
                    frameSnapshot = Array.from(frameMatrix);
                }
                this._gesture = {
                    mode,
                    pointerId: event.pointerId,
                    startClient: client,
                    currentClient: client.clone(),
                    startWorld: world,
                    currentWorld: world.clone(),
                    moved: false,
                    target,
                    snapshots: this.snapshots(affected),
                    vertexIndex,
                    groupHandle,
                    frameMatrix: frameSnapshot,
                    frameCenter,
                    frameRotation: this._groupFrame?.rotation ?? 0,
                    lockedAxis: null,
                };
                // 插点发生在按下位置，随后和原顶点共用拖动逻辑。
                if (mode === "vertex" && edgePoint !== undefined && target !== undefined) {
                    const snapshot = this._gesture.snapshots.at(0);
                    if (snapshot !== undefined && vertexIndex !== undefined) {
                        // 有初始轮廓和合法边编号才能插入新节点。
                        const projected = this.camera.windowToWorld(edgePoint, this.render);
                        const local = ToLocal(snapshot.matrix, projected);
                        if (local !== null) {
                            // 世界投影可转为局部点后，在原边的两个端点之间插入。
                            const inserted = new Float32Array(snapshot.points.length + 2);
                            const offset = (vertexIndex + 1) * 2;
                            inserted.set(snapshot.points.subarray(0, offset), 0);
                            inserted.set([local.x, local.y], offset);
                            inserted.set(snapshot.points.subarray(offset), offset + 2);
                            this._gesture.editPoints = inserted;
                            this._gesture.vertexIndex = vertexIndex + 1;
                            this.uniqueGeometry(target).points = inserted;
                            this.emit(this._onResize, target);
                            this.emit(this._onEdit, [target]);
                        }
                    }
                }
                if (event.target === this.render.canvas) {
                    // 事件来自画布才取得捕获，避免接管外部界面的指针。
                    this.render.canvas.setPointerCapture(event.pointerId);
                }
            }
        }
    }

    /**
     * 更新当前手势和预览；无手势时只更新鼠标悬停光标。
     * @param event 指针移动事件
     * @example
     * tool.handlePointerMove(event);
     * @returns 无返回值
     */
    public handlePointerMove(event: PointerEvent): void {
        let accepted = false;
        if (event.pointerType === "touch") {
            // 仅跟随本工具登记的单根触摸指针。
            accepted = this._touchPointers.size === 1 && this._touchPointers.has(event.pointerId);
        } else if (event.pointerType === "mouse") {
            // 保存鼠标位置用于相机变动后的光标重算。
            accepted = this._touchPointers.size === 0;
        }
        if (this.enabled && !this._destroyed && accepted) {
            // 有效输入才更新手势或空闲光标。
            const client = new Vec2(event.clientX, event.clientY);
            if (event.pointerType === "mouse") {
                // 保存鼠标位置用于相机变动后的光标重算。
                this._lastClient = client;
            }
            const gesture = this._gesture;
            if (gesture !== null && event.pointerId === gesture.pointerId) {
                // 只处理启动本次手势的指针，其他指针不能改写基准。
                gesture.currentClient = client;
                gesture.currentWorld = this.camera.windowToWorld(client, this.render);
                const distance = Math.hypot(client.x - gesture.startClient.x, client.y - gesture.startClient.y);
                gesture.moved = gesture.moved || distance >= 3;
                if (gesture.moved) {
                    // 超过点击阈值后才变换，轻微抖动仍按单击处理。
                    this.applyGesture(gesture);
                }
                this.update();
            } else if (gesture === null && event.pointerType === "mouse") {
                // 没有手势时才做悬停判定，避免拖动中切换手柄。
                this.updateCursor(client);
                // 未闭合轮廓的末端跟随鼠标，已确认节点保持不动。
                if (this._drawPoints.length > 0) {
                    this.updateCreatePreview(client);
                }
            }
        }
    }

    /**
     * 提交创建或框选并结束当前指针编辑。
     * @param event 指针松开事件
     * @example
     * tool.handlePointerUp(event);
     * @returns 无返回值
     */
    public handlePointerUp(event: PointerEvent): void {
        if (event.pointerType === "touch") {
            // 触摸松开及时移除登记，恢复下一次单指输入。
            this._touchPointers.delete(event.pointerId);
        }
        if (this._viewPointerId === event.pointerId) {
            // 查看拖动的指针结束时恢复普通查看光标。
            this._lastClient = new Vec2(event.clientX, event.clientY);
            this.clearViewPointer();
        }
        const gesture = this._gesture;
        if (gesture !== null && event.pointerId === gesture.pointerId) {
            // 匹配当前手势的松开事件提交最终坐标和历史。
            const client = new Vec2(event.clientX, event.clientY);
            gesture.currentClient = client;
            gesture.currentWorld = this.camera.windowToWorld(client, this.render);
            const distance = Math.hypot(client.x - gesture.startClient.x, client.y - gesture.startClient.y);
            gesture.moved = gesture.moved || distance >= 3;
            const groupClick = this._activeType === "group" && !gesture.moved;
            if (gesture.moved) {
                // 已发生拖动时应用松开位置，避免遗漏最后一段移动。
                this.applyGesture(gesture);
            }
            if (gesture.mode === "create") {
                // 新建按单次点击确认节点，并检查是否回到起点闭合。
                let close = false;
                // 闭合模式支持点回首顶点；开放模式保留该点击以继续画线。
                if (this.closed && this._drawPoints.length >= 3) {
                    const first = this._drawPoints[0];
                    const firstClient = this.camera.worldToWindow(first, this.render);
                    const resolved = this.resolveDrawPoint(client);
                    const resolvedClient = this.camera.worldToWindow(resolved, this.render);
                    const rawDistance = Math.hypot(firstClient.x - client.x, firstClient.y - client.y);
                    const resolvedDistance = Math.hypot(firstClient.x - resolvedClient.x, firstClient.y - resolvedClient.y);
                    close = rawDistance <= this.radius || resolvedDistance <= this.radius;
                }
                if (close) {
                    // 点击首点满足闭合条件时提交整个路径。
                    this.closePath();
                } else {
                    this.appendDrawPoint(client);
                }
            } else if (gesture.mode === "marquee" && !groupClick) {
                // 普通框选收尾由选择器计算，组模式单击另行退出。
                this.finishSelection(gesture, client);
            } else if (gesture.mode === "vertex" && gesture.moved && gesture.target !== undefined) {
                // 完成拖动时恢复包围盒中心作为后续旋转轴。
                this.centerEditedPolygon(gesture.target);
            }
            this._gesture = null;
            this.removeSelectionFrame();
            // 逐点预览在每次点击后保留，直至右键完成或主动取消。
            if (this._drawPoints.length > 0) {
                this.updateCreatePreview(client);
            }
            if (this.render.canvas.hasPointerCapture(event.pointerId)) {
                // 释放仍有效的捕获，取消路径可能已经提前释放。
                this.render.canvas.releasePointerCapture(event.pointerId);
            }
            if (groupClick) {
                // 组模式下单击取消选择并回到普通编辑。
                this.select([]);
                this.activeType = "edit";
            } else if (gesture.mode === "groupScale" || gesture.mode === "groupMove" || gesture.mode === "groupRotate") {
                // 完成一次组变换后重取当前轮廓包围盒，下一次手柄基准不会沿用旧尺寸。
                this.resetGroupFrame();
            }
            this.commitHistory();
            if (event.pointerType === "mouse") {
                // 松开后依据最终鼠标位置恢复悬停提示。
                this.updateCursor(client);
            }
            this.update();
        }
    }

    /** @param mesh 刚完成顶点拖动的对象 @example this.centerEditedPolygon(mesh); @returns 无返回值。 */
    private centerEditedPolygon(mesh: Mesh): void {
        const geometry = mesh.data;
        if (geometry instanceof Poly2D && geometry.points.length >= 2) {
            // 节点编辑结束后重定局部中心，同时保持世界轮廓位置。
            const points = geometry.points;
            let left = Infinity;
            let right = -Infinity;
            let bottom = Infinity;
            let top = -Infinity;
            // 仅在一次手势结束时重定中心，拖动期间保持局部原点稳定。
            for (let offset = 0; offset < points.length; offset += 2) {
                left = Math.min(left, points[offset]);
                right = Math.max(right, points[offset]);
                bottom = Math.min(bottom, points[offset + 1]);
                top = Math.max(top, points[offset + 1]);
            }
            const centerX = (left + right) / 2;
            const centerY = (bottom + top) / 2;
            const localMatrix = [...mesh.ensureMatrix().data];
            const centered = new Float32Array(points.length);
            // 所有节点移动同一个局部偏移，并由 Mesh 矩阵抵消世界位移。
            for (let offset = 0; offset < points.length; offset += 2) {
                centered[offset] = points[offset] - centerX;
                centered[offset + 1] = points[offset + 1] - centerY;
            }
            let centerScale = 1;
            // 固定尺寸轮廓重定中心时，只补偿其实际可见的世界位移。
            if (mesh.ignoreZoom) {
                centerScale = 1 / this.camera.zoom;
            }
            localMatrix[6] += (localMatrix[0] * centerX + localMatrix[3] * centerY) * centerScale;
            localMatrix[7] += (localMatrix[1] * centerX + localMatrix[4] * centerY) * centerScale;
            mesh.position.set(localMatrix[6], localMatrix[7]);
            mesh.matrix.set(localMatrix as PolyMatrix);
            geometry.points = centered;
        }
    }

    /** @param event 被取消的指针 @example tool.handlePointerCancel(event); @returns 无返回值。 */
    public handlePointerCancel(event: PointerEvent): void {
        if (event.pointerType === "touch") {
            // 指针取消也要清空触摸登记，避免锁住后续鼠标操作。
            this._touchPointers.delete(event.pointerId);
        }
        if (this._viewPointerId === event.pointerId) {
            // 取消查看拖动时恢复光标状态。
            this.clearViewPointer();
        }
        if (this._gesture?.pointerId === event.pointerId) {
            // 仅取消对应的编辑手势，其他指针取消不影响当前操作。
            this.cancel();
        }
    }

    /** @param gesture 当前手势 @example this.applyGesture(gesture); @returns 无返回值。 */
    private applyGesture(gesture: PolyGesture): void {
        if (gesture.mode === "create") {
            // 新建阶段更新预览，实体在手势结束时才添加。
            this.updateCreatePreview(gesture.currentClient);
        } else if (gesture.mode === "marquee" && this.switches.marquee) {
            // 框选阶段复用屏幕对齐的选择框。
            if (this._selectionFrame === null) {
                // 首次产生框选范围时才建立辅助实体。
                this._selectionFrame = CreateSelectionFrame();
                this.frameGroup.add(this._selectionFrame);
            }
            UpdateSelectionFrame(this._selectionFrame, gesture.startClient, gesture.currentClient,
                this.camera, this.render, this.constrain);
        } else if (gesture.mode === "move" || gesture.mode === "groupMove") {
            // 单体和组平移共享同一批对象的移动实现。
            this.applyMove(gesture);
        } else if (gesture.mode === "vertex") {
            // 顶点与沿边新插入节点交给同一轮廓变换入口。
            this.applyVertex(gesture);
        } else if (gesture.mode === "rotate") {
            // 单体旋转使用冻结的初始角度。
            this.applyRotate(gesture);
        } else if (gesture.mode === "groupScale") {
            // 组框缩放统一应用各对象的组映射。
            this.applyGroupScale(gesture);
        } else if (gesture.mode === "groupRotate") {
            // 组旋转同时更新实体和组框，避免每帧重新求包围盒。
            this.applyGroupRotate(gesture);
        }
    }

    /**
     * 对新节点统一应用 Shift 屏幕直线、世界步进和已有顶点吸附。
     * @param client 鼠标或触控的窗口坐标
     * @example
     * const point = this.resolveDrawPoint(client);
     * @returns 绘制节点的最终世界坐标
     */
    private resolveDrawPoint(client: Vec2): Vec2 {
        const previous = this._drawPoints.at(-1);
        let constrained = client;
        let anchor: Vec2 | null = null;
        let axis: "x" | "y" | null = null;
        // Shift 把新线段限制为相对上一节点的屏幕水平或竖直方向。
        if (this.constrain && previous !== undefined) {
            anchor = this.camera.worldToWindow(previous, this.render);
            const dx = client.x - anchor.x;
            const dy = client.y - anchor.y;
            if (Math.abs(dx) >= Math.abs(dy)) {
                // 首段水平分量较大时采用水平直线，否则采用竖直直线。
                axis = "x";
                constrained = new Vec2(client.x, anchor.y);
            } else {
                axis = "y";
                constrained = new Vec2(anchor.x, client.y);
            }
        }
        let point = this.camera.windowToWorld(constrained, this.render);
        let bestDistance = Infinity;
        // 世界网格和顶点目标比较各自到约束后鼠标位置的屏幕距离。
        if (this.translationStepEnabled && this.translationStep > 0) {
            let stepped = new Vec2(
                Math.round(point.x / this.translationStep) * this.translationStep,
                Math.round(point.y / this.translationStep) * this.translationStep,
            );
            let screen = this.camera.worldToWindow(stepped, this.render);
            if (axis === "x" && anchor !== null) {
                // 横向约束覆盖步进后偏离的屏幕高度。
                screen = new Vec2(screen.x, anchor.y);
                stepped = this.camera.windowToWorld(screen, this.render);
            } else if (axis === "y" && anchor !== null) {
                // 纵向约束覆盖步进后偏离的屏幕横坐标。
                screen = new Vec2(anchor.x, screen.y);
                stepped = this.camera.windowToWorld(screen, this.render);
            }
            bestDistance = Math.hypot(screen.x - constrained.x, screen.y - constrained.y);
            point = stepped;
        }
        if (this.snap) {
            // 新建路径也查询场景及已确认线段，鼠标末段不作为目标。
            const geometry = CollectSnapGeometry(this.scene, new Set(), this.camera);
            // 已确定的旧线段也可参与边线与交点吸附，排除贴着鼠标的末段。
            for (let index = 0; index < this._drawPoints.length - 2; index++) {
                geometry.segments.push({ start: this._drawPoints[index], end: this._drawPoints[index + 1] });
            }
            for (let index = 0; index < this._drawPoints.length - 1; index++) {
                // 已确认节点参与自身顶点吸附，排除正在输入的末点。
                geometry.vertices.push(this._drawPoints[index]);
            }
            const targets = NearbySnapPoints(this.camera.windowToWorld(constrained, this.render),
                geometry, this.snapOptions, this.radius, this.camera, this.render);
            for (const target of targets) {
                // 逐个比较候选与直线约束及屏幕容差。
                const screen = this.camera.worldToWindow(target, this.render);
                const onAxis = axis === null || anchor === null ||
                    (axis === "x" && Math.abs(screen.y - anchor.y) <= 0.5) ||
                    (axis === "y" && Math.abs(screen.x - anchor.x) <= 0.5);
                if (onAxis) {
                    // 只采用仍在约束轴上的候选，避免吸附破坏直线操作。
                    const distance = Math.hypot(screen.x - constrained.x, screen.y - constrained.y);
                    if (distance <= this.radius && distance < bestDistance) {
                        // 容差内更近的候选取代步进或原始位置。
                        point = target.clone();
                        bestDistance = distance;
                    }
                }
            }
        }
        return point;
    }

    /**
     * 将一次左键点击添加到正在绘制的单轮廓中。
     * @param client 点击对应的窗口位置
     * @example
     * this.appendDrawPoint(client);
     * @returns 无返回值。
     */
    private appendDrawPoint(client: Vec2): void {
        const point = this.resolveDrawPoint(client);
        const previous = this._drawPoints.at(-1);
        // 连续重复节点只会生成零长度边，应等下一次有效点击。
        if (previous === undefined || Math.hypot(previous.x - point.x, previous.y - point.y) > 0.000001) {
            this._drawPoints.push(point);
            this.updateCreatePreview(this.camera.worldToWindow(point, this.render));
        }
    }

    /**
     * 用已经确认的节点和鼠标位置绘制开放预览，不提前填充或闭合。
     * @param client 当前鼠标窗口坐标
     * @example
     * this.updateCreatePreview(client);
     * @returns 无返回值。
     */
    private updateCreatePreview(client: Vec2): void {
        if (this._drawPoints.length > 0) {
            // 已有起点才绘制鼠标跟随预览，空路径不生成辅助几何。
            const hovered = this.resolveDrawPoint(client);
            const points = [...this._drawPoints, hovered];
            const coordinates: number[] = [];
            // 预览顶点保持在首点附近；大幅缩放时避免世界坐标被 Float32 截断。
            const origin = this._drawPoints[0];
            for (const point of points) {
                // 预览坐标减去稳定局部原点，避免大世界坐标直接写入 Float32。
                coordinates.push(point.x - origin.x, point.y - origin.y);
            }
            if (this._createPreview === null) {
                // 预览首次创建样式和几何，之后只更新形状参数。
                const style = new Style();
                style.edge.enabled = true;
                style.edge.width = 2;
                style.edge.color.setHex("#73d8ff");
                style.points.enabled = true;
                style.points.vertices = true;
                style.points.radius = 4;
                style.points.color.setHex("#73d8ff");
                this._createPreview = new Mesh(
                    new Poly2D(new Float32Array(coordinates), style, { closed: false }),
                    new BaseMaterial(style), style,
                );
                this._createPreview.noSelect = true;
                this._createPreview.order = 1000001;
                this.frameGroup.add(this._createPreview);
            } else {
                const geometry = this._createPreview.data;
                if (geometry instanceof Poly2D) {
                    // 仅修改缓存的多边形参数，不重建辅助材质。
                    geometry.points = new Float32Array(coordinates);
                }
            }
            this._createPreview.position.set(origin.x, origin.y);
        }
    }

    /** @example const mesh = tool.closePath(); @returns 完成的闭合多边形或开放折线；节点不足或超出限制时为 null。 */
    public closePath(): Mesh | null {
        const points = this._drawPoints;
        let created: Mesh | null = null;
        let minimumPoints: number;
        if (this.closed) {
            // 闭合填充至少需要三点，开放折线可只包含两点。
            minimumPoints = 3;
        } else {
            minimumPoints = 2;
        }
        if (points.length >= minimumPoints) {
            // 达到当前路径的最少节点数才生成正式实体。
            let left = Infinity;
            let right = -Infinity;
            let bottom = Infinity;
            let top = -Infinity;
            // 局部原点可选首点或包围盒中心，世界轮廓位置保持不变。
            for (const point of points) {
                left = Math.min(left, point.x);
                right = Math.max(right, point.x);
                bottom = Math.min(bottom, point.y);
                top = Math.max(top, point.y);
            }
            let anchor = points[0];
            if (this.origin === "center") {
                // 中心起点使用新建时的包围盒中心，轮廓世界位置保持不变。
                anchor = new Vec2((left + right) / 2, (bottom + top) / 2);
            }
            const coordinates: number[] = [];
            let sizeScale = 1;
            // 固定尺寸只放大相对锚点的局部轮廓，锚点仍保存为世界位置。
            if (this.ignoreZoom) {
                sizeScale = this.camera.zoom;
            }
            // 相对锚点的每个节点采用同一倍率，避免新实体偏离绘制预览。
            for (const point of points) {
                coordinates.push((point.x - anchor.x) * sizeScale, (point.y - anchor.y) * sizeScale);
            }
            const style = this.style.clone();
            // 开放路径不能填充；未配置线样式时沿用填充色显示路径。
            if (!this.closed) {
                style.solid.enabled = false;
                if (!style.edge.enabled && !style.wireframe.enabled) {
                    // 模板未启用任何轮廓显示时补上边框，使开放路径可见。
                    style.edge.enabled = true;
                    style.edge.width = 2;
                    style.edge.color.copy(style.solid.color);
                }
            }
            const geometry = new Poly2D(new Float32Array(coordinates), style, { closed: this.closed });
            const material = CloneMaterial(this.material, style);
            const mesh = new Mesh(geometry, material, style);
            mesh.order = this.order;
            mesh.ignoreZoom = this.ignoreZoom;
            mesh.position.set(anchor.x, anchor.y);
            if (this.withinWorldLimits(mesh) && this.isAllowedPolygon(mesh)) {
                // 形状及活动范围都合法才把新路径写入场景。
                this.push(mesh);
                created = mesh;
                if (this.mult) {
                    // 多选创建增量加入选择，单选则只保留新实体。
                    this.select([mesh], "add");
                } else {
                    this.select([mesh]);
                }
            } else {
                mesh.dispose();
            }
        }
        this._drawPoints = [];
        this.removeCreatePreview();
        this.update();
        return created;
    }
    /**
     * 单击使用实际形状命中；拖动使用屏幕矩形框选。
     * @param gesture 选择手势
     * @param client 松开时窗口点
     * @example
     * this.finishSelection(gesture, client);
     * @returns 无返回值
     */
    private finishSelection(gesture: PolyGesture, client: Vec2): void {
        let hits: Mesh[] = [];
        if (gesture.moved && this.switches.marquee) {
            // 有拖动范围时使用框选规则，单击走点选路径。
            let frame = this._selectionFrame;
            if (frame === null) {
                // 未缓存框时临时生成一次选择范围，供收尾计算使用。
                frame = CreateSelectionFrame();
                UpdateSelectionFrame(frame, gesture.startClient, gesture.currentClient,
                    this.camera, this.render, this.constrain);
            }
            hits = this.selector.Selector(frame);
            if (frame !== this._selectionFrame) {
                // 临时框用后释放，缓存框由统一清理路径管理。
                frame.dispose();
            }
        } else if (!gesture.moved && this.switches.pick) {
            // 未超过拖动阈值的操作按点选处理。
            const hit = this.pick(client);
            if (hit !== null) {
                // 只将实际命中的对象加入本次选择结果。
                hits = [hit.mesh];
            }
        }
        // 没有可用的选择入口时保留原选择集。
        if ((gesture.moved && this.switches.marquee) || (!gesture.moved && this.switches.pick)) {
            if (this._activeType === "add") {
                // 加选模式把本次命中增量合并。
                this.select(hits, "add");
            } else if (this._activeType === "sub") {
                // 减选模式从既有选择移除命中对象。
                this.select(hits, "sub");
            } else if (this.mult) {
                // 普通多选保留原集合并加入本次结果。
                this.select(hits, "add");
            } else {
                this.select(hits);
            }
        }
    }

    /** @example this.createPolyTransformsHooks(); @returns 连接 transforms 状态的实时接口，不复制编辑对象。 */
    private createPolyTransformsHooks(): PolyTransformsHooks {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Hooks 对象访问器有独立的 this，必须保留主编辑器引用。
        const owner = this;
        return {
            /** @example hooks.groupFrame; @returns 主编辑器的实时 groupFrame 状态。 */
            get groupFrame(): Mesh | null {
                return owner._groupFrame;
            },
            /** @param value 更新后的 groupFrame 状态 @example hooks.groupFrame = value; @returns 无返回值，写回主编辑器。 */
            set groupFrame(value: Mesh | null) {
                owner._groupFrame = value;
            },
            emit: this.emit.bind(this),
            onMove: this._onMove,
            onPositionChange: this._onPositionChange,
            onEdit: this._onEdit,
            uniqueGeometry: this.uniqueGeometry.bind(this),
            onResize: this._onResize,
            /** @example hooks.rotationEnabled; @returns 主编辑器的实时 rotationEnabled 状态。 */
            get rotationEnabled(): boolean {
                return owner._rotationEnabled;
            },
            /** @param value 更新后的 rotationEnabled 状态 @example hooks.rotationEnabled = value; @returns 无返回值，写回主编辑器。 */
            set rotationEnabled(value: boolean) {
                owner._rotationEnabled = value;
            },
            onRotate: this._onRotate,
            /** @example hooks.groupBounds; @returns 主编辑器的实时 groupBounds 状态。 */
            get groupBounds(): PolyBounds | null {
                return owner._groupBounds;
            },
            /** @param value 更新后的 groupBounds 状态 @example hooks.groupBounds = value; @returns 无返回值，写回主编辑器。 */
            set groupBounds(value: PolyBounds | null) {
                owner._groupBounds = value;
            },
            onScale: this._onScale,
        };
    }
}

export default PolyEditTool;
export { default as PolyEditToolKey } from "./key";
export type { PolyEditDocument, PolyEditMode, PolyEditOrigin, PolyEditRecord, PolyHandle, SelectionOperation };
