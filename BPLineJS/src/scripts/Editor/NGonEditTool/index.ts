import type { NGonUVMode } from "bpmatrixjs/Geometry/NGon";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import NGon2D from "../../Geometry/NGon2D";
import type { Material2d } from "../../global-types";
import Group from "../../Group";
import HelperGrid from "../../Helper/HelperGrid";
import IMesh from "../../IMesh";
import BaseMaterial from "../../Material/baseMaterial";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import NGonSelectTool from "../../Select/NGonSelectTool";
import Style from "../../Style";
import type { BaseDelegate } from "../Collection/BaseChange";
import BaseChange from "../Collection/BaseChange";
import type { OrderSource } from "../Collection/Order";
import type { ResizeHandle } from "../cursors";
import { ContourResizeCursor, FrameResizeCursor, ResizeCursor } from "../cursors";
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
    CollectSnapGeometry, CreateSnapOptions, FindPointSnap,
} from "../Snap";
import { CreateRotationHandle } from "../Snap/RotationHandle";
import { CreateDrawingStyle, CreateSelectionStyle } from "../Styles";
import type { NGonEditDocument, NGonEditRecord } from "./data";
import { ApplyNGon, CaptureNGon, CreateNGon } from "./data";
import type { NGonBounds } from "./geometry";
import {
    BoundsOfMeshes,
    ContainsPoint,
    CreateGroupFrame,
    CreateSelectionFrame,
    IsCanvasPoint,
    ScreenVertices,
    SegmentDistance,
    ToParent,
    UpdateSelectionFrame,
    WorldVertices,
} from "./geometry";
import type { NGonTransformsHooks } from "./transforms";
import NGonTransforms from "./transforms";
import type { GestureMode, NGonEditMode, NGonEditOrigin, NGonGesture, NGonHandle, NGonHistoryEntry, NGonHistoryItem, NGonHistoryState, NGonHit, NGonSnapshot, SelectionOperation } from "./types";

/** 单独维护普通 NGon2D Mesh 的选择、绘制、移动、缩放和旋转。 */
class NGonEditTool {
    /** 搜索和编辑正多边形的场景。 */
    public readonly scene: Scene;
    /** 编辑覆盖层所属的渲染器。 */
    public readonly render: Render;
    /** 窗口与世界坐标转换使用的相机。 */
    public readonly camera: Camera;
    /** 正多边形点选与矩形框选工具。 */
    public readonly selector: NGonSelectTool;
    /** 编辑器节点，包含对象组和辅助组。 */
    public readonly group: Group = new Group(0, 0);
    /** 预览框、组框和旋转点所在的辅助组。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 编辑器直接管理的正多边形对象组。 */
    public readonly meshGroup: Group = new Group(0, 0);
    /** 顶点、边与吸附的屏幕容差，单位 CSS 像素。 */
    public radius: number = 10;
    /** 外轮廓面积上限。 */
    public max: number = Infinity;
    /** 外接圆直径宽度上限。 */
    public maxWidth: number = Infinity;
    /** 外接圆直径宽度下限。 */
    public minWidth: number = 0;
    /** 外接圆直径高度上限。 */
    public maxHeight: number = Infinity;
    /** 外接圆直径高度下限。 */
    public minHeight: number = 0;
    /** 世界活动区域左边界。 */
    public left: number = -Infinity;
    /** 世界活动区域上边界，Y 轴向上。 */
    public top: number = Infinity;
    /** 世界活动区域右边界。 */
    public right: number = Infinity;
    /** 世界活动区域下边界。 */
    public bottom: number = -Infinity;
    /** 创建时按下点默认为圆心；left 模式以按下点为直径端点。 */
    public origin: NGonEditOrigin = "center";
    /** 下次新增对象的样式模板。 */
    private _style: Style = CreateDrawingStyle();
    /** 下次新增对象的材质模板。 */
    private _material: Material2d = new BaseMaterial(this._style);
    /** 下一个新建正多边形是否保持屏幕尺寸，默认关闭；不改变已有对象。 */
    public ignoreZoom: boolean = false;
    /** 新建或 push 导入实体的自动精度开关，默认开启；不改变正多边形边数。 */
    public autoPrecision: boolean = true;
    /** 下一次手绘正多边形的层级，默认 0；导入对象保留自己的 order。 */
    private _order: number = 0;
    private _orderSource: OrderSource | null = null;
    /** 下次新增正多边形的 UV 模式。 */
    public uvMode: NGonUVMode;
    /** 已选对象的边框和顶点样式模板。 */
    public selectStyle: Style = CreateSelectionStyle(false);
    /** 首次点到未选对象时是否仅选中、不立即拖动。 */
    public activeOnly: boolean = true;
    /** 世界坐标平移和半径步进。 */
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
    /** 移动时锁定先开始的屏幕轴，画框从按下点向四周展开；半径缩放始终等比。 */
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
    private _sides: number = 5;
    private _activeType: NGonEditMode = "edit";
    private _mult: boolean = true;
    private _rotationEnabled: boolean = true;
    private _gesture: NGonGesture | null = null;
    private _selectionFrame: Mesh | null = null;
    private _createPreview: Mesh | null = null;
    private _groupFrame: Mesh | null = null;
    private _groupBounds: NGonBounds | null = null;
    private _rotationHandles = new Map<Mesh, Mesh>();
    private _savedStyles = new Map<Mesh, Style>();
    private _data: NGonEditRecord[] = [];
    private _undoStack: (NGonHistoryEntry | BaseChange)[] = [];
    private _redoStack: (NGonHistoryEntry | BaseChange)[] = [];
    private _historyStart: NGonHistoryState | null = null;
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
    private readonly _onModeChange = new Map<string, (mode: NGonEditMode) => void>();
    private readonly _onBase = new Map<string, (mesh: Mesh) => void>();
    private _baseDelegate: BaseDelegate | null = null;
    private readonly _onSave = new Map<string, (data: NGonEditDocument) => void>();
    /** transforms 算法与主编辑器分开维护，配置由实时接口提供。 */
    private readonly _transforms: NGonTransforms = new NGonTransforms(this, this.createNGonTransformsHooks());


    /**
     * 创建正多边形编辑器；集合编辑器可关闭自动监听和背景网格。
     * @param scene 候选对象场景
     * @param render 画布渲染器
     * @param camera 当前相机
     * @param autoBind 是否自动监听指针
     * @param helper 是否创建背景网格
     * @param fromCollection 是否由集合编辑器持有
     * @param uvMode 下次新建对象使用的 UV 模式
     * @example
     * const tool = new NGonEditTool(scene, render, camera);
     * @returns 正多边形编辑器
     */
    public constructor(
        scene: Scene,
        render: Render,
        camera: Camera,
        autoBind: boolean = true,
        helper: boolean = autoBind,
        fromCollection: boolean = false,
        uvMode: NGonUVMode = "bounding",
    ) {
        this.scene = scene;
        // 集合只开启一次；显式选择四叉树的 Scene 保留调用方设置。
        if (!fromCollection && scene.box === null && scene.quad === null) {
            scene.box = camera;
        }
        this.render = render;
        this.camera = camera;
        this.fromCollection = fromCollection;
        this.selector = new NGonSelectTool(scene, render, camera, !fromCollection);
        this.group.add(this.meshGroup);
        this.group.add(this.frameGroup);
        scene.add(this.group);
        if (helper) {
            // 独立工具按配置建立辅助网格，集合创建时可复用上层辅助层。
            this._helperGrid = new HelperGrid(scene, render, camera);
        }
        // 已有正多边形接收精度开关，仅场景直属实体改归模型组。
        for (const candidate of [...scene.ensureLists()]) {
            // 实例批次与辅助节点保留调用方配置，嵌套普通实体保持父级。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect && candidate.data instanceof NGon2D) {
                candidate.autoPrecision = this.autoPrecision;
                // 父级变换已经存在时，不因接管编辑而移动节点。
                if (candidate.parent === scene) {
                    this.meshGroup.add(candidate);
                }
            }
        }
        this.uvMode = uvMode;
        this._originalCursor = render.canvas.style.cursor;
        this._originalTouchAction = render.canvas.style.touchAction;
        render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
        render.canvas.style.touchAction = "none";
        if (autoBind) {
            // 事件由本工具拥有时才绑定，集合可自行分派同一画布的输入。
            const signal = this._events.signal;
            render.container.addEventListener("pointerdown", this.trackTouchPointerDown.bind(this), { capture: true, signal });
            render.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { signal });
            window.addEventListener("pointermove", this.handlePointerMove.bind(this), { signal });
            window.addEventListener("pointerup", this.handlePointerUp.bind(this), { signal });
            window.addEventListener("pointercancel", this.handlePointerCancel.bind(this), { signal });
            window.addEventListener("blur", this.handleBlur.bind(this), { signal });
        }
        this.refreshData();
    }

    /** @example const order = tool.order; @returns 下一次手绘正多边形的层级，默认 0。 */
    public get order(): number {
        return this._order;
    }

    /** @param value 下一次手绘正多边形的层级 @example tool.order = 3; @returns 无返回值。 */
    public set order(value: number) {
        // 层级进入保存记录和排序计算，拒绝非有限数值。
        if (Number.isFinite(value)) {
            this._order = value;
        } else {
            throw new RangeError("NGonEditTool.order must be finite.");
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

    /** @example const style = tool.style; @returns 下次新建正多边形的样式模板。 */
    public get style(): Style {
        // 合并编辑器可共用材质；其他工具换样式后同步本工具的样式引用。
        if (this._material.style !== this._style) {
            this._style = this._material.style;
        }
        return this._style;
    }

    /** @param value 下次新建正多边形的样式模板 @example tool.style = new Style(); @returns 无返回值。 */
    public set style(value: Style) {
        this._material.style = value;
        this._style = value;
    }

    /** @param mesh 编辑对象 @example tool.sourceStyle(mesh); @returns 未被选中装饰覆盖的用户样式。 */
    public sourceStyle(mesh: Mesh): Style {
        return this._savedStyles.get(mesh) ?? mesh.style ?? mesh.data?.style ?? new Style();
    }

    /** @example const material = tool.material; @returns 下次新建正多边形的材质模板。 */
    public get material(): Material2d {
        return this._material;
    }

    /** @param value 下次新建正多边形的材质模板 @example tool.material = new BaseMaterial(); @returns 无返回值。 */
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
     * @param uvMode 下次新建正多边形使用的 UV 模式
     * @example
     * const tool = NGonEditTool.build(scene, render, camera);
     * @returns 由外部转发指针事件的工具
     */
    public static build(scene: Scene, render: Render, camera: Camera,
        uvMode: NGonUVMode = "bounding"): NGonEditTool {
        return new NGonEditTool(scene, render, camera, false, false, true, uvMode);
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

    /** @example const meshes = tool.movingMeshes; @returns 当前平移手势中的正多边形集合。 */
    public get movingMeshes(): Mesh[] {
        const gesture = this._gesture;
        // 半径与旋转手势不能改变层级归属。
        if (gesture !== null && gesture.mode === "move") {
            const meshes: Mesh[] = [];
            // 同类型多选的平移对象一起交给集合编辑器。
            for (const snapshot of gesture.snapshots) {
                meshes.push(snapshot.mesh);
            }
            return meshes;
        } else {
            return [];
        }
    }

    /** @example tool.selectAll(); @returns 无返回值，选择全部可编辑正多边形并遵循 mult 开关。 */
    public selectAll(): void {
        const meshes: Mesh[] = [];
        // 仅收集本工具的几何类型，select 统一过滤辅助对象、实例和单选约束。
        for (const candidate of this.scene.ensureLists()) {
            // 场景中的 Group 不能当作可编辑几何传入。
            if (candidate instanceof Mesh && candidate.data instanceof NGon2D) {
                meshes.push(candidate);
            }
        }
        this.select(meshes);
    }

    /**
     * 接收合并编辑器统一平移后的通知，不重新应用位移。
     * @param meshes 已移动的正多边形成员
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

    /** @example const mode = tool.activeType; @returns 当前编辑模式。 */
    public get activeType(): NGonEditMode {
        return this._activeType;
    }

    /** @param value 新模式 @example tool.activeType = "group"; @returns 无返回值。 */
    public set activeType(value: NGonEditMode) {
        // 集合模式只保留单体编辑，跨几何组手势由 Editor 统一分发。
        if (this.fromCollection && value === "group") {
            console.warn("NGonEditTool: collection group mode belongs to Editor.");
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

    /** @example const sides = tool.sides; @returns 下次创建的边数。 */
    public get sides(): number {
        return this._sides;
    }

    /** @param value 新增对象默认边数 @example tool.sides = 6; @returns 无返回值。 */
    public set sides(value: number) {
        // 交互式等边形至少三边；键盘只覆盖到 90，API 可设置更多。
        if (!Number.isInteger(value) || value < 3 || value > 65536) {
            throw new RangeError("NGonEditTool sides must be an integer in [3, 65536].");
        }
        this._sides = value;
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
            const last = this.actives.at(-1);
            // 多选关闭只保留真实的最后一件实体，避免依赖非空断言。
            if (last instanceof Mesh) {
                this.select([last]);
            }
        }
    }

    /** @example const records = tool.data; @returns 当前普通正多边形的纯数据快照。 */
    public get data(): readonly NGonEditRecord[] {
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
     * 修改当前选中对象和下次创建的边数，键盘 3–9 与 10–90 使用此入口。
     * @param value 新边数
     * @example
     * tool.setSides(30);
     * @returns 无返回值
     */
    public setSides(value: number): void {
        this.sides = value;
        const changed: Mesh[] = [];
        this.beginHistory();
        // 当前选中的每个正多边形同步边数，其他对象保持不变。
        for (const mesh of this.actives) {
            const geometry = mesh.data;
            if (geometry instanceof NGon2D && geometry.sides !== value) {
                // 只重建边数实际改变的正多边形，保持其他类型的几何不变。
                this.uniqueGeometry(mesh).sides = value;
                changed.push(mesh);
                this.emit(this._onResize, mesh);
            }
        }
        if (changed.length > 0) {
            // 一批边数修改统一通知并刷新组框和可序列化数据。
            this.emit(this._onEdit, changed);
            this.resetGroupFrame();
            this.refreshData();
        }
        this.commitHistory();
        this.update();
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
    public onModeChange(key: string, callback: (mode: NGonEditMode) => void): void {
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
    public onSave(key: string, callback: (data: NGonEditDocument) => void): void {
        this._onSave.set(key, callback);
    }

    /** @param key 监听名 @example tool.onSaveDelete("ui"); @returns 是否删除监听。 */
    public onSaveDelete(key: string): boolean {
        return this._onSave.delete(key);
    }

    /**
     * 按替换、增量或减量更新场景中普通正多边形的选择集。
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
            } else if (mesh !== undefined && sceneMeshes.includes(mesh) && mesh.data instanceof NGon2D &&
                !(mesh instanceof IMesh) && !mesh.noSelect) {
                // 只接受当前场景的可选正多边形实体，排除批次与辅助框。
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
            console.warn("NGonEditTool.select: mult is disabled; using the last Mesh.");
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
     * @returns 只由该 Mesh 持有的正多边形几何
     */
    private uniqueGeometry(mesh: Mesh): NGon2D {
        const geometry = mesh.data as NGon2D;
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

    /** @param mesh 候选 Mesh @example const record = this.captureUserNGon(mesh); @returns 未覆盖选择色的纯数据。 */
    private captureUserNGon(mesh: Mesh): NGonEditRecord {
        const record = CaptureNGon(mesh, this._savedStyles.get(mesh));
        record.order = this.sourceOrder(mesh);
        return record;
    }

    /** @example this.refreshData(); @returns 无返回值。 */
    private refreshData(): void {
        const records: NGonEditRecord[] = [];
        for (const candidate of this.scene.ensureLists()) {
            // 读取完整场景实体，不把视口裁剪结果误作编辑文档。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect &&
                candidate.data instanceof NGon2D && candidate.material !== undefined) {
                // 数据源只包含可编辑实体，忽略辅助框、实例批次和缺少材质的节点。
                records.push(this.captureUserNGon(candidate));
            }
        }
        this._data = records;
    }

    /** @example const state = this.captureHistoryState(); @returns 对象引用、快照和选中 ID。 */
    private captureHistoryState(): NGonHistoryState {
        const items: NGonHistoryItem[] = [];
        for (const candidate of this.scene.ensureLists()) {
            // 每笔历史同时记录对象身份、父级和用户数据。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect &&
                candidate.data instanceof NGon2D && candidate.material !== undefined) {
                // 只为本工具管理的正多边形保留历史，避免接管其他编辑器。
                items.push({
                    mesh: candidate,
                    parent: candidate.parent as Group | Scene | null,
                    data: this.captureUserNGon(candidate),
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
    private restoreHistoryState(state: NGonHistoryState): void {
        this._historyReplay = true;
        this.select([]);
        const wanted = new Set(state.items.map(HistoryMesh));
        for (const candidate of this.scene.ensureLists()) {
            // 撤回新增时只删除本工具负责的普通正多边形。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && candidate.data instanceof NGon2D &&
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
            ApplyNGon(item.mesh, item.data);
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
    public save(): NGonEditDocument {
        this.refreshData();
        const document: NGonEditDocument = { version: 1, meshes: structuredClone(this._data) };
        this.emit(this._onSave, document);
        return document;
    }

    /**
     * 以 JSON 文档重建编辑器所管理的正多边形。
     * @param document 由 save 生成的版本化数据
     * @example
     * tool.load(document);
     * @returns 新建的 Mesh，运行期 ID 与记录中 ID 不同
     */
    public load(document: NGonEditDocument): Mesh[] {
        const header: { version: number } = document;
        if (header.version !== 1 || !Array.isArray(document.meshes)) {
            // 入口拒绝未知文档版本及缺少实体数组的数据。
            throw new TypeError("Unsupported NGonEditTool document.");
        }
        this.beginHistory();
        this.select([]);
        for (const mesh of [...this.scene.ensureLists()]) {
            // 文档替换整个当前编辑集合，也要包含嵌套组中的正多边形。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof NGon2D) {
                mesh.removeSelf();
                this.emit(this._onRemove, mesh);
            }
        }
        const meshes: Mesh[] = [];
        for (const record of document.meshes) {
            // 按记录重建每个实体，并恢复精度设置与添加通知。
            const mesh = CreateNGon(record);
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
     * 把普通正多边形加入编辑器管理组。
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
            // 只接收普通 NGon2D，辅助框和实例网格不进入编辑集合。
            if (!(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof NGon2D) {
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
        // 公共删除入口只处理仍在当前场景的普通正多边形。
        if (!(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof NGon2D &&
            this.scene.ensureLists().includes(mesh)) {
            const ownsHistory = this._historyStart === null;
            if (ownsHistory) {
                // 没有外层事务时删除自建历史，批量删除则合并为一笔。
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
     * 从上层到下层命中实际正多边形，先顶点、后边、最后内部。
     * @param client 浏览器窗口坐标
     * @example
     * const hit = this.pick(client);
     * @returns 命中的对象及操作部位
     */
    private pick(client: Vec2): NGonHit | null {
        const drawList = this.scene.ensureLists();
        for (let index = drawList.length - 1; index >= 0; index--) {
            // 逆绘制顺序拾取，使上层实体的内部优先于下层手柄。
            const mesh = drawList[index];
            // 辅助 Mesh 与实例模板不参与本工具的普通对象拾取。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof NGon2D) {
                const geometry = mesh.data;
                const outer = ScreenVertices(mesh, this.camera, this.render);
                // 已选圆盘的中心也作为内圈起点；拖动后即可拉出孔洞。
                if (this.actives.includes(mesh) && geometry.inner === 0) {
                    const matrix = mesh.getRenderMatrix(this.camera).data;
                    const center = this.camera.worldToWindow(new Vec2(matrix[6], matrix[7]), this.render);
                    if (Math.hypot(center.x - client.x, center.y - client.y) <= this.radius) {
                        // 无孔实体的中心作为新增内圈入口，容差采用屏幕像素。
                        return { mesh, handle: "inner" };
                    }
                }
                // 内圈边和节点优先于填充面，命中后只编辑内半径。
                if (geometry.inner > 0) {
                    const inner = ScreenVertices(mesh, this.camera, this.render, true);
                    for (let vertex = 0; vertex < inner.length; vertex++) {
                        // 内圈的顶点和边都可拖动半径，并优先于外圈命中。
                        if (Math.hypot(inner[vertex].x - client.x, inner[vertex].y - client.y) <= this.radius) {
                            // 接近内圈顶点时使用内半径手柄。
                            return { mesh, handle: "inner" };
                        }
                        if (SegmentDistance(client, inner[vertex], inner[(vertex + 1) % inner.length]) <= this.radius) {
                            // 内圈边命中同样交给内半径调整。
                            return { mesh, handle: "inner" };
                        }
                    }
                }
                for (const point of outer) {
                    // 外圈先检查顶点，再检查边，避免角点被相邻边抢占。
                    if (Math.hypot(point.x - client.x, point.y - client.y) <= this.radius) {
                        // 顶点进入屏幕容差后返回外圈顶点手柄。
                        return { mesh, handle: "vertex" };
                    }
                }
                for (let edge = 0; edge < outer.length; edge++) {
                    // 未命中顶点时才检查有限外圈边的距离。
                    if (SegmentDistance(client, outer[edge], outer[(edge + 1) % outer.length]) <= this.radius) {
                        // 边命中沿用统一外半径调整入口。
                        return { mesh, handle: "edge" };
                    }
                }
                if (ContainsPoint(client, outer)) {
                    // 圆环内孔不属于实体命中区域。
                    if (geometry.inner > 0) {
                        const inner = ScreenVertices(mesh, this.camera, this.render, true);
                        if (ContainsPoint(client, inner)) {
                            // 内环区域是空洞，继续检查更低层的实体。
                        } else {
                            return { mesh, handle: "body" };
                        }
                    } else {
                        return { mesh, handle: "body" };
                    }
                }
            }
        }
        return null;
    }

    /** @param client 窗口坐标 @example const mesh = tool.pickMesh(client); @returns 节点、边或实体命中的正多边形。 */
    public pickMesh(client: Vec2): Mesh | null {
        return this.pick(client)?.mesh ?? null;
    }

    /**
     * 求已选对象外轮廓首顶点外侧的旋转端点。
     * @param mesh 目标 Mesh
     * @example
     * const point = this.rotationHandlePosition(mesh);
     * @returns 首顶点、屏幕外向单位向量和图标命中中心；退化时为 null
     */
    private rotationHandlePosition(mesh: Mesh): { top: Vec2; outward: Vec2; endpoint: Vec2 } | null {
        const vertices = ScreenVertices(mesh, this.camera, this.render);
        if (vertices.length > 0) {
            // 有轮廓顶点才能确定旋转图标的向外方向。
            const matrix = mesh.getRenderMatrix(this.camera).data;
            const center = this.camera.worldToWindow(new Vec2(matrix[6], matrix[7]), this.render);
            const first = vertices[0];
            const dx = first.x - center.x;
            const dy = first.y - center.y;
            const length = Math.hypot(dx, dy);
            if (Number.isFinite(length) && length > Number.EPSILON) {
                // 中心到顶点的方向有效时按屏幕距离延伸图标位置。
                const outward = new Vec2(dx / length, dy / length);
                const endpoint = new Vec2(first.x + outward.x * 24, first.y + outward.y * 24);
                return { top: first, outward, endpoint };
            }
        }
        return null;
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
     * 组模式按边框缩放、内部移动、外部旋转；单击仍退出组模式。
     * @param client 浏览器窗口坐标
     * @example
     * const action = this.groupAction(client);
     * @returns 当前组操作及命中的局部边角
     */
    private groupAction(client: Vec2): { mode: GestureMode; handle?: ResizeHandle } {
        const frame = this._groupFrame;
        const bounds = this._groupBounds;
        // 没有组框时保留选择行为，不暴露可用的组变换。
        if (frame !== null && bounds !== null) {
            const matrix = frame.ensureWorldMatrix().data;
            const corners: Vec2[] = [];
            const local = [
                new Vec2(-bounds.width / 2, -bounds.height / 2),
                new Vec2(bounds.width / 2, -bounds.height / 2),
                new Vec2(bounds.width / 2, bounds.height / 2),
                new Vec2(-bounds.width / 2, bounds.height / 2),
            ];
            // 命中容差按实际屏幕投影测量。
            for (const point of local) {
                const world = new Vec2(
                    matrix[0] * point.x + matrix[3] * point.y + matrix[6],
                    matrix[1] * point.x + matrix[4] * point.y + matrix[7],
                );
                corners.push(this.camera.worldToWindow(world, this.render));
            }
            // 缩放关闭后不拾取边角，组内拖动和外侧旋转仍可独立使用。
            if (this.switches.scale) {
                const cornerHandles: ResizeHandle[] = ["sw", "se", "ne", "nw"];
                // 四角先于相邻边命中，让角点箭头沿两条屏幕法线的夹角方向。
                for (let corner = 0; corner < corners.length; corner++) {
                    // 使用与边线一致的屏幕容差，不随 zoom 放大。
                    if (Math.hypot(client.x - corners[corner].x, client.y - corners[corner].y) <= this.radius) {
                        return { mode: "groupScale", handle: cornerHandles[corner] };
                    }
                }
                const edgeHandles: ResizeHandle[] = ["s", "e", "n", "w"];
                // 保留正多边形组的等比缩放行为，仅记录命中边以计算光标。
                for (let edge = 0; edge < corners.length; edge++) {
                    // 只有靠近当前边线时才显示其屏幕法线箭头。
                    if (SegmentDistance(client, corners[edge], corners[(edge + 1) % corners.length]) <= this.radius) {
                        return { mode: "groupScale", handle: edgeHandles[edge] };
                    }
                }
            }
            // 远离边框的组内区域用于整体移动。
            if (this.switches.move && ContainsPoint(client, corners)) {
                return { mode: "groupMove" };
            }
            // 边框外侧只在旋转开启时显示旋转状态。
            if (this._rotationEnabled && this.switches.rotate) {
                return { mode: "groupRotate" };
            }
        }
        // 组动作被关闭时保留选择，不回退成框选。
        return { mode: "select" };
    }

    /** @param client 浏览器窗口坐标 @example this.updateCursor(client); @returns 无返回值。 */
    private updateCursor(client: Vec2): void {
        // 集合编辑时由 Editor 统一写光标，避免其他子工具的 update 覆盖悬停状态。
        if (!this.fromCollection) {
            this.render.canvas.style.cursor = this.cursorAt(client);
        }
    }

    /** @param client 窗口坐标 @example const css = tool.cursorAt(client); @returns 当前顶点、旋转或移动的 CSS 光标。 */
    public cursorAt(client: Vec2): string {
        let url = plusCursorUrl;
        let fallback = "crosshair";
        // 查看状态使用手形，不显示编辑箭头。
        if (this._activeType === "view") {
            // 捕获指针后切换成抓取形态。
            if (this._viewPointerId === null) {
                url = handCursorUrl;
                fallback = "grab";
            } else {
                url = handGrabbingCursorUrl;
                fallback = "grabbing";
            }
        } else if (this._activeType === "group" && this._groupFrame !== null) {
            // 组操作按框边角、内部、外侧分别提示。
            const action = this.groupAction(client);
            // 边角缩放优先于内部移动。
            if (action.mode === "groupScale") {
                // 组框方向以显示矩阵为准，包含整组旋转及相机角度。
                return FrameResizeCursor(this._groupFrame.getRenderMatrix(this.camera).data,
                    action.handle, this.camera, this.render);
            } else if (action.mode === "groupMove") {
                // 内部保留整体移动的四向箭头。
                url = moveCursorUrl;
                fallback = "move";
            } else if (action.mode === "groupRotate") {
                // 外侧使用独立旋转图标。
                url = rotateCursorUrl;
                fallback = "context-menu";
            } else {
                // 没有可用组动作时恢复普通指针。
                return "default";
            }
        } else if (this._activeType === "edit") {
            // 单体旋转图标先于正多边形的轮廓命中。
            const rotation = this.pickRotationHandle(client);
            const hit = this.pick(client);
            // 旋转端点不使用半径编辑箭头。
            if (rotation !== null) {
                url = rotateCursorUrl;
                fallback = "context-menu";
            } else if (hit !== null && (!this.activeOnly || this.actives.includes(hit.mesh))) {
                // activeOnly 下仅已选对象提示可编辑状态。
                // 填充面内部只用于平移。
                if (hit.handle === "body" && this.switches.move) {
                    url = moveCursorUrl;
                    fallback = "move";
                } else if (hit.handle !== "body" && this.switches.resize) {
                    // 内外圈都取显示轮廓的屏幕法线，圆盘中心使用鼠标径向兜底。
                    const geometry = hit.mesh.data as NGon2D;
                    // 零内半径没有轮廓边，鼠标离开中心后用当前径向提示拉出内圈。
                    if (hit.handle === "inner" && geometry.inner === 0) {
                        const matrix = hit.mesh.getRenderMatrix(this.camera).data;
                        const center = this.camera.worldToWindow(new Vec2(matrix[6], matrix[7]), this.render);
                        return ResizeCursor(new Vec2(client.x - center.x, client.y - center.y));
                    } else {
                        const vertices = ScreenVertices(hit.mesh, this.camera, this.render, hit.handle === "inner");
                        return ContourResizeCursor(vertices, client, this.radius);
                    }
                }
            }
        }
        // 关闭新建后，空白区域不再提示可以画出正多边形。
        if (!this.switches.create && url === plusCursorUrl) {
            return "default";
        }
        return `url("${url}") 16 16, ${fallback}`;
    }

    /** @param meshes 手势影响的对象 @example const snapshots = this.snapshots(meshes); @returns 按下时的位置、半径和顶点。 */
    private snapshots(meshes: readonly Mesh[]): NGonSnapshot[] {
        const result: NGonSnapshot[] = [];
        for (const mesh of meshes) {
            // 手势开始时冻结每个对象的变换与半径作为计算基准。
            const geometry = mesh.data;
            if (geometry instanceof NGon2D) {
                // 只捕获正多边形参数，其他类型由各自工具管理。
                const matrix = mesh.getRenderMatrix(this.camera).data;
                result.push({
                    mesh,
                    center: new Vec2(matrix[6], matrix[7]),
                    position: mesh.position.clone(),
                    rotation: mesh.rotation,
                    outer: geometry.outer,
                    inner: geometry.inner,
                    vertices: WorldVertices(mesh, false, this.camera),
                    innerVertices: WorldVertices(mesh, true, this.camera),
                });
            }
        }
        return result;
    }

    /** @param sides 边数 @param outer 外接圆半径 @example const allowed = this.isAllowedRadius(5, 20); @returns 是否满足尺寸与面积限制。 */
    private isAllowedRadius(sides: number, outer: number): boolean {
        return this._transforms.isAllowedRadius(sides, outer);
    }

    /** @param mesh 候选 Mesh @example const valid = this.withinWorldLimits(mesh); @returns 所有外圈顶点是否在活动区域内。 */
    private withinWorldLimits(mesh: Mesh): boolean {
        return this._transforms.withinWorldLimits(mesh);
    }

    /** @param gesture 当前手势 @example this.applyMove(gesture); @returns 无返回值。 */
    private applyMove(gesture: NGonGesture): void {
        return this._transforms.applyMove(gesture);
    }

    /** @param gesture 单体半径手势 @example this.applyResize(gesture); @returns 无返回值。 */
    private applyResize(gesture: NGonGesture): void {
        return this._transforms.applyResize(gesture);
    }

    /** @param gesture 单体旋转手势 @example this.applyRotate(gesture); @returns 无返回值。 */
    private applyRotate(gesture: NGonGesture): void {
        return this._transforms.applyRotate(gesture);
    }

    /** @param gesture 组等比缩放手势 @example this.applyGroupScale(gesture); @returns 无返回值。 */
    private applyGroupScale(gesture: NGonGesture): void {
        return this._transforms.applyGroupScale(gesture);
    }

    /** @param gesture 组旋转手势 @example this.applyGroupRotate(gesture); @returns 无返回值。 */
    private applyGroupRotate(gesture: NGonGesture): void {
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

    /**
     * 鼠标左键或单指按下时决定点选、移动、半径、旋转或新建。
     * @param event 指针按下事件
     * @example
     * tool.handlePointerDown(event);
     * @returns 无返回值
     */
    public handlePointerDown(event: PointerEvent): void {
        this.trackTouchPointerDown(event);
        const client = new Vec2(event.clientX, event.clientY);
        let accepted = false;
        if (event.pointerType === "touch") {
            // 单指触摸可编辑，多指触摸保留给相机控制器。
            accepted = this._touchPointers.size === 1;
        } else if (event.pointerType === "mouse") {
            // 鼠标编辑只接收左键，并避免与正在进行的触摸混用。
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
                let resizeHandle: "inner" | "outer" | undefined;
                if (this._activeType === "group" && this._groupFrame !== null) {
                    // 组框存在时由组内部、边界和外侧位置选择组操作。
                    mode = this.groupAction(client).mode;
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
                        if (hit.handle === "inner") {
                            // 内圈命中使用内半径，其余轮廓手柄使用外半径。
                            resizeHandle = "inner";
                        } else {
                            resizeHandle = "outer";
                        }
                        if (hit.handle === "body" && this.switches.move) {
                            // 内部拖动受移动开关控制，关闭后保留选择行为。
                            mode = "move";
                        } else if (hit.handle !== "body" && this.switches.resize) {
                            // 边和顶点命中受尺寸开关控制。
                            mode = "resize";
                        } else {
                            mode = "select";
                        }
                    } else {
                        mode = "select";
                    }
                } else if (this._activeType === "edit" && hit !== null) {
                    // 已存在的实体不会因为关闭点选而变成新建画布。
                    mode = "select";
                } else if (this._activeType === "edit" && this.switches.create) {
                    // Shift 在创建时改为角点起点，增减模式仍可单独框选。
                    mode = "create";
                }
                let affected = this.actives;
                // 单体半径和旋转只改变命中的那件对象，多选移动仍同步移动整批。
                if (target !== undefined && mode !== "move") {
                    affected = [target];
                }
                const frameMatrix = this._groupFrame?.ensureWorldMatrix().data;
                let frameCenter: Vec2 | null = null;
                if (frameMatrix !== undefined) {
                    // 组框已有显示矩阵时采用真实中心作为变换基点。
                    frameCenter = new Vec2(frameMatrix[6], frameMatrix[7]);
                }
                this._gesture = {
                    mode,
                    pointerId: event.pointerId,
                    startClient: client,
                    currentClient: client.clone(),
                    startWorld: world,
                    currentWorld: world.clone(),
                    fromCorner: event.shiftKey,
                    moved: false,
                    target,
                    resizeHandle,
                    snapshots: this.snapshots(affected),
                    frameCenter,
                    frameRotation: this._groupFrame?.rotation ?? 0,
                    frameScale: this._groupFrame?.scale.x ?? 1,
                    lockedAxis: null,
                };
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
            // 存在触摸时忽略鼠标兼容事件，防止重复编辑。
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
                gesture.fromCorner = event.shiftKey;
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
            gesture.fromCorner = event.shiftKey;
            const distance = Math.hypot(client.x - gesture.startClient.x, client.y - gesture.startClient.y);
            gesture.moved = gesture.moved || distance >= 3;
            const groupClick = this._activeType === "group" && !gesture.moved;
            if (gesture.moved) {
                // 已发生拖动时应用松开位置，避免遗漏最后一段移动。
                this.applyGesture(gesture);
            }
            if (gesture.mode === "create" && gesture.moved) {
                // 新建必须有实际拖动，单击不创建零半径对象。
                this.finishCreate(gesture);
            } else if (gesture.mode === "create") {
                // 关闭点选时空白点击不应清掉现有选择。
                if (this.switches.pick) {
                    this.select([]);
                }
            } else if (gesture.mode === "marquee" && !groupClick) {
                // 普通框选收尾由选择器计算，组模式单击另行退出。
                this.finishSelection(gesture, client);
            }
            this._gesture = null;
            this.removeSelectionFrame();
            this.removeCreatePreview();
            if (this.render.canvas.hasPointerCapture(event.pointerId)) {
                // 释放仍有效的捕获，取消路径可能已经提前释放。
                this.render.canvas.releasePointerCapture(event.pointerId);
            }
            if (groupClick) {
                // 组模式下单击取消选择并回到普通编辑。
                this.select([]);
                this.activeType = "edit";
            }
            this.commitHistory();
            if (event.pointerType === "mouse") {
                // 松开后依据最终鼠标位置恢复悬停提示。
                this.updateCursor(client);
            }
            this.update();
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
    private applyGesture(gesture: NGonGesture): void {
        if (gesture.mode === "create") {
            // 新建阶段更新预览，实体在手势结束时才添加。
            this.updateCreatePreview(gesture);
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
        } else if (gesture.mode === "resize") {
            // 半径手柄交给尺寸变换模块。
            this.applyResize(gesture);
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
     * 将拖动端点解释为外接圆半径和首顶点朝向。
     * @param gesture 创建手势
     * @example
     * const shape = this.creationShape(gesture);
     * @returns 有效候选或 null
     */
    private creationShape(gesture: NGonGesture): { center: Vec2; outer: number; startAngle: number } | null {
        let endpoint = gesture.currentWorld.clone();
        let center = gesture.startWorld.clone();
        let outer = Math.hypot(
            gesture.currentWorld.x - gesture.startWorld.x,
            gesture.currentWorld.y - gesture.startWorld.y,
        );
        // left 或按住 Shift 时以两个拖动端点为直径；其余情况以按下点为圆心。
        if (this.origin === "left" || gesture.fromCorner) {
            center = new Vec2(
                (gesture.startWorld.x + gesture.currentWorld.x) / 2,
                (gesture.startWorld.y + gesture.currentWorld.y) / 2,
            );
            outer /= 2;
        }
        if (this.translationStepEnabled && this.translationStep > 0) {
            // 新建中心与半径按世界零点步进，保持与移动尺寸调整一致。
            center = new Vec2(
                Math.round(center.x / this.translationStep) * this.translationStep,
                Math.round(center.y / this.translationStep) * this.translationStep,
            );
            outer = Math.round(outer / this.translationStep) * this.translationStep;
        }
        // 鼠标端点可落到顶点、边、交点或可见细格；与步进取较近者。
        if (this.snap) {
            const targets = CollectSnapGeometry(this.scene, new Set(), this.camera);
            const candidate = FindPointSnap(endpoint, targets, this.snapOptions,
                this.radius, this.camera, this.render);
            const rawAngle = Math.atan2(endpoint.y - center.y, endpoint.x - center.x);
            const steppedEndpoint = new Vec2(
                center.x + Math.cos(rawAngle) * outer,
                center.y + Math.sin(rawAngle) * outer,
            );
            const steppedScreen = this.camera.worldToWindow(steppedEndpoint, this.render);
            const rawScreen = this.camera.worldToWindow(endpoint, this.render);
            let stepDistance = Infinity;
            if (this.translationStepEnabled && this.translationStep > 0) {
                // 开启步进时将候选偏移换算为屏幕距离，与吸附公平比较。
                stepDistance = Math.hypot(steppedScreen.x - rawScreen.x, steppedScreen.y - rawScreen.y);
            }
            if (candidate !== null && candidate.distance < stepDistance) {
                // 更近的吸附目标替代步进端点，并重新计算创建形状。
                endpoint = candidate.point;
                center = gesture.startWorld.clone();
                outer = Math.hypot(endpoint.x - center.x, endpoint.y - center.y);
                // 吸附端点改变直径时，按当前角点起笔规则重算圆心与半径。
                if (this.origin === "left" || gesture.fromCorner) {
                    center = new Vec2((gesture.startWorld.x + endpoint.x) / 2,
                        (gesture.startWorld.y + endpoint.y) / 2);
                    outer /= 2;
                }
            }
        }
        const startAngle = Math.atan2(endpoint.y - center.y, endpoint.x - center.x);
        let sizeScale = 1;
        // 预览半径使用世界单位，尺寸限制始终检查将要保存的局部半径。
        if (this.ignoreZoom) {
            sizeScale = this.camera.zoom;
        }
        // 零半径和不满足局部尺寸限制的绘制不能创建实体。
        if (outer > 0 && this.isAllowedRadius(this._sides, outer * sizeScale)) {
            return { center, outer, startAngle };
        } else {
            return null;
        }
    }

    /** @param gesture 创建手势 @example this.updateCreatePreview(gesture); @returns 无返回值。 */
    private updateCreatePreview(gesture: NGonGesture): void {
        const shape = this.creationShape(gesture);
        if (shape !== null) {
            // 有合法创建形状才显示预览。
            if (this._createPreview === null) {
                // 预览首次创建样式和几何，之后只更新形状参数。
                const style = new Style();
                style.solid.enabled = true;
                style.solid.opacity = 0.12;
                style.solid.color.setHex("#73d8ff");
                style.edge.enabled = true;
                style.edge.width = 2;
                style.edge.color.setHex("#73d8ff");
                const material = new BaseMaterial(style);
                material.transparent = true;
                this._createPreview = new Mesh(new NGon2D({ outer: shape.outer, sides: this._sides,
                    uvMode: this.uvMode, style }), material, style);
                this._createPreview.noSelect = true;
                this._createPreview.order = 1000001;
                this.frameGroup.add(this._createPreview);
            }
            const geometry = this._createPreview.data;
            if (geometry instanceof NGon2D) {
                // 仅修改缓存的正多边形参数，不重建辅助材质。
                geometry.outer = shape.outer;
                geometry.sides = this._sides;
                geometry.startAngle = shape.startAngle;
                geometry.uvMode = this.uvMode;
            }
            this._createPreview.position.set(shape.center.x, shape.center.y);
            if (!this.withinWorldLimits(this._createPreview)) {
                // 越出世界活动范围时移除预览，避免显示无法提交的对象。
                this.removeCreatePreview();
            }
        } else {
            this.removeCreatePreview();
        }
    }

    /** @param gesture 完成的创建手势 @example this.finishCreate(gesture); @returns 无返回值。 */
    private finishCreate(gesture: NGonGesture): void {
        const shape = this.creationShape(gesture);
        if (shape !== null) {
            // 有效形状完成后克隆模板样式并创建正式实体。
            const style = this.style.clone();
            let sizeScale = 1;
            // 新实体的可见外圈与世界空间预览重合，之后缩放相机不改变其屏幕半径。
            if (this.ignoreZoom) {
                sizeScale = this.camera.zoom;
            }
            const geometry = new NGon2D({
                outer: shape.outer * sizeScale,
                inner: 0,
                sides: this._sides,
                uvMode: this.uvMode,
                startAngle: shape.startAngle,
                style,
            });
            const material = CloneMaterial(this.material, style);
            const mesh = new Mesh(geometry, material, style);
            mesh.order = this.order;
            mesh.ignoreZoom = this.ignoreZoom;
            mesh.position.set(shape.center.x, shape.center.y);
            if (this.withinWorldLimits(mesh)) {
                // 通过范围限制的实体才加入文档和选择。
                this.push(mesh);
                if (this.mult) {
                    // 多选创建增量选中，单选创建则替换旧选择。
                    this.select([mesh], "add");
                } else {
                    this.select([mesh]);
                }
            }
        }
    }

    /**
     * 单击使用实际形状命中；拖动使用屏幕矩形框选。
     * @param gesture 选择手势
     * @param client 松开时窗口点
     * @example
     * this.finishSelection(gesture, client);
     * @returns 无返回值
     */
    private finishSelection(gesture: NGonGesture, client: Vec2): void {
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
        // 禁用点选或框选时保留当前选择，避免空结果触发误清除。
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

    /** @example this.createNGonTransformsHooks(); @returns 连接 transforms 状态的实时接口，不复制编辑对象。 */
    private createNGonTransformsHooks(): NGonTransformsHooks {
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
            onScale: this._onScale,
        };
    }
}

export default NGonEditTool;
export { default as NGonEditToolKey } from "./key";
export type { NGonEditDocument, NGonEditMode, NGonEditOrigin, NGonEditRecord, NGonHandle, SelectionOperation };
