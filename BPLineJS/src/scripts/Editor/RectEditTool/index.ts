import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
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
import RectSelectTool from "../../Select/RectSelectTool";
import { ContainsWorldPoint, CreateRectFootprint } from "../../Select/RectSelectTool/RectSelectGeometry";
import Style from "../../Style";
import type { BaseDelegate } from "../Collection/BaseChange";
import BaseChange from "../Collection/BaseChange";
import type { OrderSource } from "../Collection/Order";
import type { ResizeHandle } from "../cursors";
import { FrameResizeCursor } from "../cursors";
import handGrabbingCursorUrl from "../cursors/hand-grabbing.svg?url";
import handCursorUrl from "../cursors/hand.svg?url";
import moveCursorUrl from "../cursors/move.svg?url";
import plusCursorUrl from "../cursors/plus.svg?url";
import rotateCursorUrl from "../cursors/rotate.svg?url";
import type { EditSwitches } from "../EditSwitches";
import { CreateEditSwitches } from "../EditSwitches";
import type { SnapOptions } from "../Snap";
import {
    CollectSnapGeometry, CreateSnapOptions, FindPointSnap,
} from "../Snap";
import { CreateRotationHandle } from "../Snap/RotationHandle";
import { CreateDrawingStyle, CreateSelectionStyle } from "../Styles";
import type { RectEditDocument, RectEditRecord } from "./data";
import { ApplyRect, CaptureRect, CreateRect } from "./data";
import { CompareRankedMeshes, ContainsFrame, CopyMaterial, CreateGroupFrame, CreatePreviewFrame, MeshBounds, SegmentDistance, WorldToLocalMatrix } from "./geometry";
import type { RectGroupTransformHooks } from "./groupTransform";
import RectGroupTransform from "./groupTransform";
import type { RectMotionHooks } from "./motion";
import RectMotion from "./motion";
import type { RectResizeHooks } from "./resize";
import RectResize from "./resize";
import type { DrawFrame, EditGesture, GestureMode, GroupAction, MatrixValues, MeshSnapshot, RankedMesh, RectBounds, RectEditHistoryEntry, RectEditHistoryItem, RectEditHistoryState, RectEditMode, RectEditOrigin, RectHandle, RectHit, SavedStyle, ScreenBounds, SelectionOperation } from "./types";

/** 仅编辑普通 Rect2D Mesh；编辑对象和辅助框由独立子组管理。 */
class RectEditTool {
    /** 本工具搜索和修改 Mesh 的场景。 */
    public readonly scene: Scene;
    /** 编辑器覆盖层所在的渲染器。 */
    public readonly render: Render;
    /** 指针坐标转换使用的相机。 */
    public readonly camera: Camera;
    /** 复用现有的矩形框选判定。 */
    public readonly selector: RectSelectTool;
    /** 编辑器场景节点，便于整体管理两个子组。 */
    public readonly group: Group = new Group(0, 0);
    /** 画框预览与组虚线边框所在的辅助组。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 由编辑器管理的普通矩形所在组。 */
    public readonly meshGroup: Group = new Group(0, 0);
    private _helperGrid: HelperGrid | null = null;
    /** 鼠标与角、边及顶点吸附的屏幕容差，单位 CSS 像素。 */
    public radius: number = 10;
    /** 矩形局部宽乘高的上限。 */
    public max: number = Infinity;
    /** 新建或改尺寸时允许的最大局部宽度。 */
    public maxWidth: number = Infinity;
    /** 新建或改尺寸时允许的最小局部宽度。 */
    public minWidth: number = 0;
    /** 新建或改尺寸时允许的最大局部高度。 */
    public maxHeight: number = Infinity;
    /** 新建或改尺寸时允许的最小局部高度。 */
    public minHeight: number = 0;
    /** 世界坐标中可活动区域的左边界。 */
    public left: number = -Infinity;
    /** 世界坐标中可活动区域的上边界，Y 轴向上。 */
    public top: number = Infinity;
    /** 世界坐标中可活动区域的右边界。 */
    public right: number = Infinity;
    /** 世界坐标中可活动区域的下边界。 */
    public bottom: number = -Infinity;
    /** 新建矩形时按下位置是对角起点还是中心。 */
    public origin: RectEditOrigin = "left";
    /** 下一个新建矩形是否保持屏幕尺寸，默认关闭；不改变已有对象。 */
    public ignoreZoom: boolean = false;
    /** 新建或 push 导入实体的自动精度开关，默认开启；已有实体可单独修改 Mesh.autoPrecision。 */
    public autoPrecision: boolean = true;
    /** 下一次手绘矩形的层级，默认 0；导入对象保留自己的 order。 */
    private _order: number = 0;
    private _orderSource: OrderSource | null = null;
    /** 下一次新建矩形使用的样式模板，创建时会复制。 */
    private _style: Style = CreateDrawingStyle();
    /** 下一次新建矩形使用的材质模板，创建时会复制。 */
    private _material: Material2d = new BaseMaterial(this._style);
    /** 选中矩形使用的边框与关键点样式模板。 */
    public selectStyle: Style = CreateSelectionStyle(true);
    /** 首次点选未选中对象时是否只选中、不立即编辑。 */
    public activeOnly: boolean = true;
    /** 平移步进，单位为世界坐标；仅在 translationStepEnabled 开启时生效。 */
    public translationStep: number = 1;
    /** 是否把世界坐标吸附到以原点为基准的 translationStep 网格。 */
    public translationStepEnabled: boolean = false;
    /** 吸附总开关，默认关闭；具体候选由 snapOptions 控制。 */
    public snap: boolean = false;
    /** 顶点、边线、交点和网格的独立吸附开关，默认全部开启。 */
    public snapOptions: SnapOptions = CreateSnapOptions();
    /** 旋转步进，单位为角度；仅在 rotationStepEnabled 开启时生效。 */
    public rotationStep: number = 1;
    /** 是否把单体与组旋转角度吸附到 rotationStep 的整数倍。 */
    public rotationStepEnabled: boolean = false;
    private _rotationEnabled: boolean = true;
    /** 平移锁轴、四角等比缩放，并让新建及选择画框从按下点向四周展开。 */
    public constrain: boolean = false;
    /** edit 模式是否允许保留多个选中对象。 */
    private _mult: boolean = true;
    /** 当前全部选中对象。 */
    public actives: Mesh[] = [];
    /** 最近一次新选中的对象批次。 */
    public active: Mesh[] = [];
    /** 是否响应转发或自动注册的指针事件。 */
    public enabled: boolean = true;
    /** 是否由集合编辑器构建；集合模式允许组内矩形保留完整仿射缩放。 */
    public readonly fromCollection: boolean;
    /** 代理编辑时使用实际实体所在场景收集吸附候选，默认与 scene 相同。 */
    public snapScene: Scene;
    /** 代理编辑对应的真实实体，避免吸附到自身旧范围。 */
    public snapExcluded: ReadonlySet<Mesh> = new Set();
    /** 指针选择、创建和变换的独立开关；默认全部开启。 */
    public switches: EditSwitches = CreateEditSwitches();

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
    private readonly _onRemove = new Map<string, (old: Mesh) => void>();
    private readonly _onDestroy = new Map<string, () => void>();
    private readonly _onModeChange = new Map<string, (mode: RectEditMode) => void>();
    private readonly _onBase = new Map<string, (mesh: Mesh) => void>();
    private _baseDelegate: BaseDelegate | null = null;
    private readonly _onSave = new Map<string, (data: RectEditDocument) => void>();
    private _data: RectEditRecord[] = [];
    private readonly _dataVersions = new Map<number, string>();
    private readonly _undoStack: (RectEditHistoryEntry | BaseChange)[] = [];
    private readonly _redoStack: (RectEditHistoryEntry | BaseChange)[] = [];
    private _historyStart: RectEditHistoryState | null = null;
    private _historyReplay: boolean = false;
    private _clipboard: Mesh[] = [];
    private _clipboardClient: Vec2 | null = null;

    private _activeType: RectEditMode = "edit";
    private _gesture: EditGesture | null = null;
    private _groupFrame: Mesh | null = null;
    private _groupFrameCorners: Vec2[] | null = null;
    private _groupFrameCustomized: boolean = false;
    private _groupViewVersion: number = -1;
    private _groupProjectionVersion: number = -1;
    private _previewFrame: Mesh | null = null;
    private readonly _rotationHandles = new Map<Mesh, Mesh>();
    private readonly _savedStyles = new Map<Mesh, SavedStyle>();
    private _appliedSelectStyle: Style = this.selectStyle;
    private _selectStyleVersion: number = this.selectStyle.version;
    private _destroyed: boolean = false;
    private readonly _events: AbortController = new AbortController();
    private readonly _originalCursor: string;
    private readonly _originalTouchAction: string;
    private readonly _touchPointers = new Set<number>();
    private _lastClient: Vec2 | null = null;
    private _viewPointerId: number | null = null;
    private _viewContainerCursor: string | null = null;
    /** motion 算法与主编辑器分开维护，配置由实时接口提供。 */
    private readonly _motion: RectMotion = new RectMotion(this, this.createRectMotionHooks());

    /** resize 算法与主编辑器分开维护，配置由实时接口提供。 */
    private readonly _resize: RectResize = new RectResize(this, this.createRectResizeHooks());

    /** groupTransform 算法与主编辑器分开维护，配置由实时接口提供。 */
    private readonly _groupTransform: RectGroupTransform = new RectGroupTransform(this, this.createRectGroupTransformHooks());


    /**
     * 创建矩形编辑器。关闭 autoBind 后可由合并编辑器转发 handlePointer* 事件。
     * @param scene 包含候选矩形的场景
     * @param render 画布和覆盖层所属的渲染器
     * @param camera 用于屏幕与世界坐标互换的相机
     * @param autoBind 是否自动监听鼠标与触控指针，默认开启
     * @param helper 是否显示背景网格；默认跟随 autoBind
     * @param fromCollection 是否由集合编辑器管理；独立模式的组缩放保持矩形等比
     * @example
     * const tool = new RectEditTool(scene, render, camera, true, false);
     * @returns 矩形编辑器。
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
        this.snapScene = scene;
        this.selector = new RectSelectTool(scene, render, camera);
        this.group.add(this.meshGroup);
        this.group.add(this.frameGroup);
        scene.add(this.group);
        // 独立工具默认拥有网格；上层集合构建时默认交给集合统一管理。
        if (helper) {
            this._helperGrid = new HelperGrid(scene, render, camera);
        }
        // 接管已有矩形的自动精度，仅把直属对象挪入模型组，保留嵌套层级。
        for (const candidate of [...scene.ensureLists()]) {
            // 普通 Rect2D 才交给编辑器管理，其他模型保留原场景层级。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect && candidate.data instanceof Rect2D) {
                candidate.autoPrecision = this.autoPrecision;
                // 已有父级负责世界变换，只有场景直属实体需要改归属。
                if (candidate.parent === scene) {
                    this.meshGroup.add(candidate);
                }
            }
        }
        this._originalCursor = render.canvas.style.cursor;
        this._originalTouchAction = render.canvas.style.touchAction;
        this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
        this.render.canvas.style.touchAction = "none";
        // 独立使用时自行监听；合并编辑器可关闭并转发同名公开方法。
        if (autoBind) {
            const signal = this._events.signal;
            render.container.addEventListener("pointerdown", this.trackTouchPointerDown.bind(this), { capture: true, signal });
            render.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { signal });
            window.addEventListener("pointermove", this.handlePointerMove.bind(this), { signal });
            window.addEventListener("pointerup", this.handlePointerUp.bind(this), { signal });
            window.addEventListener("pointercancel", this.handlePointerCancel.bind(this), { signal });
            window.addEventListener("blur", this.handleBlur.bind(this), { signal });
        }
        this.refreshData(true);
    }

    /** @example const style = tool.style; @returns 下次新建矩形的样式模板。 */
    public get style(): Style {
        // 合并编辑器可共用材质；其他工具换样式后同步本工具的样式引用。
        if (this._material.style !== this._style) {
            this._style = this._material.style;
        }
        return this._style;
    }

    /** @param value 下次新建矩形的样式模板 @example tool.style = new Style(); @returns 无返回值。 */
    public set style(value: Style) {
        this._material.style = value;
        this._style = value;
    }

    /** @example const order = tool.order; @returns 下一次手绘矩形的层级，默认 0。 */
    public get order(): number {
        return this._order;
    }

    /** @param value 下一次手绘矩形的层级 @example tool.order = 3; @returns 无返回值。 */
    public set order(value: number) {
        // 层级进入保存记录和排序计算，拒绝非有限数值。
        if (Number.isFinite(value)) {
            this._order = value;
        } else {
            throw new RangeError("RectEditTool.order must be finite.");
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

    /** @param mesh 编辑对象 @example tool.sourceStyle(mesh); @returns 未被选中装饰覆盖的用户样式。 */
    public sourceStyle(mesh: Mesh): Style {
        const saved = this._savedStyles.get(mesh);
        return saved?.mesh ?? saved?.geometry ?? mesh.style ?? mesh.data?.style ?? new Style();
    }

    /** @example const material = tool.material; @returns 下次新建矩形的材质模板。 */
    public get material(): Material2d {
        return this._material;
    }

    /** @param value 下次新建矩形的材质模板 @example tool.material = new BaseMaterial(); @returns 无返回值。 */
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
     * 触发同一事件的全部具名监听，参数使用调用处提供的快照。
     * @param callbacks 该事件的监听集合
     * @param args 传给每个监听的参数
     * @example
     * this.emitCallbacks(this._onSelect, added, actives);
     * @returns 无返回值。
     */
    private emitCallbacks<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void {
        // 使用快照允许回调在触发期间增加或删除同名监听。
        for (const callback of [...callbacks.values()]) {
            callback(...args);
        }
    }

    /**
     * 注册或替换「本次新增与当前全部选中对象」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onSelect("panel", () => {});
     * @returns 无返回值。
     */
    public onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void {
        this._onSelect.set(key, callback);
    }

    /**
     * 移除「本次新增与当前全部选中对象」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onSelectDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onSelectDelete(key: string): boolean {
        return this._onSelect.delete(key);
    }

    /**
     * 注册或替换「本次取消与剩余选中对象」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onDeselect("panel", () => {});
     * @returns 无返回值。
     */
    public onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void {
        this._onDeselect.set(key, callback);
    }

    /**
     * 移除「本次取消与剩余选中对象」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onDeselectDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onDeselectDelete(key: string): boolean {
        return this._onDeselect.delete(key);
    }

    /**
     * 注册或替换「完整选中集合变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onSelectionChange("panel", () => {});
     * @returns 无返回值。
     */
    public onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onSelectionChange.set(key, callback);
    }

    /**
     * 移除「完整选中集合变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onSelectionChangeDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onSelectionChangeDelete(key: string): boolean {
        return this._onSelectionChange.delete(key);
    }

    /**
     * 注册或替换「对象平移」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onMove("panel", () => {});
     * @returns 无返回值。
     */
    public onMove(key: string, callback: (actives: Mesh[]) => void): void {
        this._onMove.set(key, callback);
    }

    /**
     * 移除「对象平移」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onMoveDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onMoveDelete(key: string): boolean {
        return this._onMove.delete(key);
    }

    /**
     * 注册或替换「矩形局部宽高变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onResize("panel", () => {});
     * @returns 无返回值。
     */
    public onResize(key: string, callback: (mesh: Mesh) => void): void {
        this._onResize.set(key, callback);
    }

    /**
     * 移除「矩形局部宽高变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onResizeDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onResizeDelete(key: string): boolean {
        return this._onResize.delete(key);
    }

    /**
     * 注册或替换「对象比例变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onScale("panel", () => {});
     * @returns 无返回值。
     */
    public onScale(key: string, callback: (mesh: Mesh) => void): void {
        this._onScale.set(key, callback);
    }

    /**
     * 移除「对象比例变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onScaleDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onScaleDelete(key: string): boolean {
        return this._onScale.delete(key);
    }

    /**
     * 注册或替换「组合旋转」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onRotate("panel", () => {});
     * @returns 无返回值。
     */
    public onRotate(key: string, callback: (actives: Mesh[]) => void): void {
        this._onRotate.set(key, callback);
    }

    /**
     * 移除「组合旋转」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onRotateDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onRotateDelete(key: string): boolean {
        return this._onRotate.delete(key);
    }

    /**
     * 注册或替换「位置变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onPositionChange("panel", () => {});
     * @returns 无返回值。
     */
    public onPositionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onPositionChange.set(key, callback);
    }

    /**
     * 移除「位置变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onPositionChangeDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onPositionChangeDelete(key: string): boolean {
        return this._onPositionChange.delete(key);
    }

    /**
     * 注册或替换「任意编辑变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onEdit("panel", () => {});
     * @returns 无返回值。
     */
    public onEdit(key: string, callback: (actives: Mesh[]) => void): void {
        this._onEdit.set(key, callback);
    }

    /**
     * 移除「任意编辑变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onEditDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onEditDelete(key: string): boolean {
        return this._onEdit.delete(key);
    }

    /**
     * 注册或替换「对象加入编辑器」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onAdd("panel", () => {});
     * @returns 无返回值。
     */
    public onAdd(key: string, callback: (mesh: Mesh) => void): void {
        this._onAdd.set(key, callback);
    }

    /**
     * 移除「对象加入编辑器」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onAddDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onAddDelete(key: string): boolean {
        return this._onAdd.delete(key);
    }

    /**
     * 注册或替换「对象从编辑器移除」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onRemove("panel", () => {});
     * @returns 无返回值。
     */
    public onRemove(key: string, callback: (old: Mesh) => void): void {
        this._onRemove.set(key, callback);
    }

    /**
     * 移除「对象从编辑器移除」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onRemoveDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onRemoveDelete(key: string): boolean {
        return this._onRemove.delete(key);
    }

    /**
     * 注册或替换「编辑器销毁」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onDestroy("panel", () => {});
     * @returns 无返回值。
     */
    public onDestroy(key: string, callback: () => void): void {
        this._onDestroy.set(key, callback);
    }

    /**
     * 移除「编辑器销毁」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onDestroyDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onDestroyDelete(key: string): boolean {
        return this._onDestroy.delete(key);
    }

    /**
     * 注册或替换「编辑模式变化」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onModeChange("panel", () => {});
     * @returns 无返回值。
     */
    public onModeChange(key: string, callback: (mode: RectEditMode) => void): void {
        this._onModeChange.set(key, callback);
    }

    /**
     * 移除「编辑模式变化」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onModeChangeDelete("panel");
     * @returns 是否找到并移除了监听。
     */
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
        this.emitCallbacks(this._onBase, mesh);
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
                this.refreshData(true);
                this.update();
                // 几何安装完成后再通知，接收者可以直接读取 Base 轮廓。
                for (const mesh of change.meshes) {
                    this.notifyBase(mesh);
                }
                this.emitCallbacks(this._onEdit, [...change.meshes]);
            }
            return [...change.meshes];
        }
    }

    /**
     * 注册或替换「保存数据生成」监听。
     * @param key 调用方分配的唯一名称
     * @param callback 事件处理函数
     * @example
     * tool.onSave("panel", () => {});
     * @returns 无返回值。
     */
    public onSave(key: string, callback: (data: RectEditDocument) => void): void {
        this._onSave.set(key, callback);
    }

    /**
     * 移除「保存数据生成」监听。
     * @param key 注册时使用的名称
     * @example
     * tool.onSaveDelete("panel");
     * @returns 是否找到并移除了监听。
     */
    public onSaveDelete(key: string): boolean {
        return this._onSave.delete(key);
    }


    /**
     * 为合并编辑器创建不自动监听事件且不重复创建背景的矩形工具。
     * @param scene 包含候选矩形的场景
     * @param render 画布所属的渲染器
     * @param camera 屏幕坐标换算使用的相机
     * @example
     * const tool = RectEditTool.build(scene, render, camera);
     * @returns 等待上层转发指针事件的矩形工具。
     */
    public static build(scene: Scene, render: Render, camera: Camera): RectEditTool {
        return new RectEditTool(scene, render, camera, false, false, true);
    }

    /** @example tool.helper = false; @returns 背景网格是否开启。 */
    public get helper(): boolean {
        return this._helperGrid !== null;
    }

    /** @param value 是否显示背景网格 @example tool.helper = true; @returns 无返回值。 */
    public set helper(value: boolean) {
        // 已销毁的编辑器不再挂载新背景对象。
        if (this._destroyed === false) {
            // 只在开关状态变化时创建或移除网格。
            if (value && this._helperGrid === null) {
                this._helperGrid = new HelperGrid(this.scene, this.render, this.camera);
            } else if (!value && this._helperGrid !== null) {
                // 关闭时同步销毁网格自己的场景节点与资源订阅。
                this._helperGrid.destroy();
                this._helperGrid = null;
            }
        }
    }

    /** @example tool.helperGrid?.mode = "light"; @returns 当前背景网格或 null。 */
    public get helperGrid(): HelperGrid | null {
        return this._helperGrid;
    }

    /** @example const meshes = tool.movingMeshes; @returns 当前平移手势中的矩形集合。 */
    public get movingMeshes(): Mesh[] {
        const gesture = this._gesture;
        // 只有实体平移允许集合编辑器在松开后改变父容器。
        if (gesture !== null && gesture.mode === "move") {
            const meshes: Mesh[] = [];
            // 多选同类型对象一起平移时保持原有快照顺序。
            for (const snapshot of gesture.snapshots) {
                meshes.push(snapshot.mesh);
            }
            return meshes;
        } else {
            return [];
        }
    }

    /** @example tool.selectAll(); @returns 无返回值，选择全部可编辑矩形并遵循 mult 开关。 */
    public selectAll(): void {
        const meshes: Mesh[] = [];
        // 仅收集本工具的几何类型，select 统一过滤辅助对象、实例和单选约束。
        for (const candidate of this.scene.ensureLists()) {
            // 场景中的 Group 不能当作可编辑几何传入。
            if (candidate instanceof Mesh && candidate.data instanceof Rect2D) {
                meshes.push(candidate);
            }
        }
        this.select(meshes);
    }

    /**
     * 接收合并编辑器统一平移后的通知，不重新应用位移。
     * @param meshes 已移动的矩形成员
     * @example tool.notifyExternalMove([mesh]);
     * @returns 无返回值。
     */
    public notifyExternalMove(meshes: Mesh[]): void {
        // 空分组不发出事件，所有成员的位置已由集合统一写入。
        if (meshes.length > 0) {
            this.emitCallbacks(this._onMove, [...meshes]);
            this.emitCallbacks(this._onPositionChange, [...meshes]);
            this.emitCallbacks(this._onEdit, [...meshes]);
            this.update();
        }
    }

    /** @example tool.activeType = "add"; @returns 当前编辑模式。 */
    public get activeType(): RectEditMode {
        return this._activeType;
    }

    /** @param value 查看、编辑、增选、减选或组合变换模式 @example tool.activeType = "group"; @returns 无返回值。 */
    public set activeType(value: RectEditMode) {
        // 集合模式的组手势必须由统一组控制器处理，防止相同 Mesh 被变换两次。
        if (this.fromCollection && value === "group") {
            console.warn("RectEditTool: collection group mode belongs to Editor.");
            value = "edit";
        }
        const wasGroupMode = this.isGroupMode();
        const previousMode = this._activeType;
        this._activeType = value;
        // 进入组模式时建立一次范围，退出时移除组框。
        if (this.isGroupMode()) {
            // 已在组模式中重复赋值时保持已变换的辅助 Mesh。
            if (!wasGroupMode) {
                this.resetGroupFrame();
            }
        } else {
            this.removeGroupFrame();
        }
        this.cancel();
        // 集合构建时画布光标由 Editor 独占，独立模式仍立即反馈模式切换。
        if (!this.fromCollection) {
            // 已知指针位置时优先显示准确的角边或旋转状态。
            if (this._lastClient !== null) {
                this.updateCursor(this._lastClient);
            } else if (value === "view") {
                // 尚无鼠标位置时直接展示查看光标。
                this.render.canvas.style.cursor = `url("${handCursorUrl}") 16 16, grab`;
            } else {
                this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
            }
        }
        this.update();
        // 重复赋值不应通知外部重新绑定控制器。
        if (previousMode !== value) {
            this.emitCallbacks(this._onModeChange, value);
        }
    }

    /** @example tool.rotationEnabled = false; @returns 单体和组旋转是否可用。 */
    public get rotationEnabled(): boolean {
        return this._rotationEnabled;
    }

    /** @param value 是否允许旋转矩形 @example tool.rotationEnabled = false; @returns 无返回值。 */
    public set rotationEnabled(value: boolean) {
        this._rotationEnabled = value;
        // 关闭开关时立刻撤下单体手柄并更新悬停提示。
        this.update();
        // 已有鼠标位置时同步替换可能仍显示的旋转光标。
        if (this._lastClient !== null) {
            this.updateCursor(this._lastClient);
        }
    }

    /** @example const multiple = tool.mult; @returns 是否累积选中多个矩形。 */
    public get mult(): boolean {
        return this._mult;
    }

    /** @param value 是否允许在编辑模式中累积多个选中对象 @example tool.mult = true; @returns 无返回值。 */
    public set mult(value: boolean) {
        this._mult = value;
        // 关闭多选时立即收敛到最近一次选中的对象。
        if (!value && this.actives.length > 1 && this._activeType === "edit") {
            const last = this.actives[this.actives.length - 1];
            this.select([last]);
        }
    }

    /** @example const records = tool.data; @returns 当前矩形的纯数据快照。 */
    public get data(): readonly RectEditRecord[] {
        this.refreshData();
        return this._data;
    }

    /** @example const count = tool.undoCount; @returns 可撤销的编辑动作数量。 */
    public get undoCount(): number {
        return this._undoStack.length;
    }

    /** @example const count = tool.redoCount; @returns 可重做的编辑动作数量。 */
    public get redoCount(): number {
        return this._redoStack.length;
    }

    /**
     * 读取选中前的用户样式，避免把编辑高亮写入数据或剪贴板。
     * @param mesh 来源矩形
     * @example const record = this.captureUserRect(mesh);
     * @returns 可序列化的矩形记录。
     */
    private captureUserRect(mesh: Mesh): RectEditRecord {
        const saved = this._savedStyles.get(mesh);
        const originalStyle = saved?.mesh ?? saved?.geometry;
        const record = CaptureRect(mesh, originalStyle);
        record.order = this.sourceOrder(mesh);
        return record;
    }

    /**
     * 收集可编辑矩形并仅在数据确实变化时替换数组，便于状态框架观察。
     * @param force 强制替换数组
     * @example this.refreshData();
     * @returns 无返回值。
     */
    private refreshData(force: boolean = false): void {
        const records: RectEditRecord[] = [];
        const versions = new Map<number, string>();
        let changed = force;
        // 场景绘制表也包含辅助对象，只记录可编辑的普通矩形。
        for (const mesh of this.scene.ensureLists()) {
            // 实例、辅助框和其他几何类型不属于矩形编辑数据。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect &&
                mesh.data instanceof Rect2D && mesh.material !== undefined) {
                const record = this.captureUserRect(mesh);
                const value = JSON.stringify(record);
                records.push(record);
                versions.set(mesh.id, value);
                // 任何记录字段变化都需要替换对外暴露的数组引用。
                if (this._dataVersions.get(mesh.id) !== value) {
                    changed = true;
                }
            }
        }
        // 删除对象可能没有触发任何现存 ID 的版本差异。
        if (versions.size !== this._dataVersions.size) {
            changed = true;
        }
        // 数据保持原引用，直到内容真正变化。
        if (changed) {
            this._data = records;
            this._dataVersions.clear();
            // 新版本表与公开数据同时推进。
            for (const [id, value] of versions) {
                this._dataVersions.set(id, value);
            }
        }
    }

    /**
     * 把当前矩形状态连同对象引用保存为一次历史边界。
     * @example const state = this.captureHistoryState();
     * @returns 场景状态与当前选择。
     */
    private captureHistoryState(): RectEditHistoryState {
        const items: RectEditHistoryItem[] = [];
        const selectedIds: number[] = [];
        // 选择单独记录，以便撤销删除后恢复原来的编辑目标。
        for (const mesh of this.actives) {
            selectedIds.push(mesh.id);
        }
        // 保存 Mesh 引用才能恢复删除对象的运行期 ID 和材质资源。
        for (const mesh of this.scene.ensureLists()) {
            // 只捕获编辑器负责的 Rect2D，辅助节点不参与撤销。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect &&
                mesh.data instanceof Rect2D && mesh.material !== undefined) {
                items.push({ mesh, parent: mesh.parent as Group | Scene | null, data: this.captureUserRect(mesh) });
            }
        }
        return { items, selectedIds };
    }

    /** @example this.beginHistory(); @returns 无返回值。 */
    private beginHistory(): void {
        // 嵌套删除和内部 push 共用外层操作的起点。
        if (!this._historyReplay && this._historyStart === null) {
            this._historyStart = this.captureHistoryState();
        }
    }

    /** @example this.commitHistory(); @returns 无返回值。 */
    private commitHistory(): void {
        const before = this._historyStart;
        this._historyStart = null;
        // 没有编辑边界或者正在回放时不写入新历史。
        if (before !== null && !this._historyReplay) {
            const after = this.captureHistoryState();
            const beforeData: RectEditRecord[] = [];
            const afterData: RectEditRecord[] = [];
            // 历史比较只看实体内容，选择变化本身不算一次编辑。
            for (const item of before.items) {
                beforeData.push(item.data);
            }
            // 前后快照采用相同顺序，便于准确判断是否编辑。
            for (const item of after.items) {
                afterData.push(item.data);
            }
            // 单纯选择变化不占用撤销步数，编辑才清空重做分支。
            if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
                this._undoStack.push({ before, after });
                this._redoStack.length = 0;
            }
            this.refreshData();
        }
    }

    /**
     * 恢复同一批矩形的添加、删除与属性编辑。
     * @param state 目标历史状态
     * @example this.restoreHistoryState(entry.before);
     * @returns 无返回值。
     */
    private restoreHistoryState(state: RectEditHistoryState): void {
        this._historyReplay = true;
        this.select([]);
        const wanted = new Set<Mesh>();
        // 先明确目标对象集合，删除新建对象时保留已有对象的引用。
        for (const item of state.items) {
            wanted.add(item.mesh);
        }
        // 回放状态中不存在的当前矩形离开场景。
        for (const mesh of this.scene.ensureLists()) {
            // 辅助框与非 Rect2D 资源不属于当前编辑器的历史。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect &&
                mesh.data instanceof Rect2D && !wanted.has(mesh)) {
                mesh.removeSelf();
            }
        }
        // 恢复父节点与矩形数据后，再恢复选择以重新装饰边框。
        for (const item of state.items) {
            // 已删除的 Mesh 需要回到原父级。
            if (item.mesh.parent !== item.parent) {
                const parent = item.parent ?? this.meshGroup;
                parent.add(item.mesh);
            }
            this.uniqueGeometry(item.mesh);
            ApplyRect(item.mesh, item.data);
        }
        const selected: Mesh[] = [];
        // 找回历史里选中的 Mesh，保持对象身份不变。
        for (const item of state.items) {
            // 只恢复目标状态仍保留的选择项。
            if (state.selectedIds.includes(item.mesh.id)) {
                selected.push(item.mesh);
            }
        }
        this.select(selected);
        this._historyReplay = false;
        this.refreshData(true);
        this.update();
    }

    /** @example tool.undo(); @returns 是否恢复了上一批编辑。 */
    public undo(): boolean {
        const entry = this._undoStack.pop();
        let restored = false;
        // 一次操作只回放一条成对的前后快照。
        if (entry !== undefined) {
            // 主动转换只恢复本批几何，不改动其他形状工具管理的对象。
            if (entry instanceof BaseChange) {
                this.select([]);
                entry.undo();
                this.select(entry.meshes);
                this.refreshData(true);
                this.update();
            } else {
                this.restoreHistoryState(entry.before);
            }
            this._redoStack.push(entry);
            restored = true;
        }
        return restored;
    }

    /** @example tool.redo(); @returns 是否重新应用了一批编辑。 */
    public redo(): boolean {
        const entry = this._redoStack.pop();
        let restored = false;
        // 重做沿用原对象引用，便于外部继续持有 Mesh。
        if (entry !== undefined) {
            // 重做转换重新解除原类型选择，避免残留矩形或多边形辅助框。
            if (entry instanceof BaseChange) {
                this.select([]);
                entry.redo();
                this.refreshData(true);
                this.update();
            } else {
                this.restoreHistoryState(entry.after);
            }
            this._undoStack.push(entry);
            restored = true;
        }
        return restored;
    }

    /** @example const json = tool.save(); @returns 当前矩形的 JSON 数据并触发 onSave。 */
    public save(): RectEditDocument {
        this.refreshData();
        const data: RectEditDocument = { version: 1, meshes: structuredClone(this._data) };
        this.emitCallbacks(this._onSave, data);
        return data;
    }

    /**
     * 用保存的 JSON 重建编辑器矩形；运行期 Mesh ID 重新分配。
     * @param document save 返回的数据
     * @example tool.load(json);
     * @returns 新创建的矩形。
     */
    public load(document: RectEditDocument): Mesh[] {
        this.beginHistory();
        this.select([]);
        // 加载是替换文档，先从场景移走当前编辑器负责的矩形。
        for (const mesh of this.scene.ensureLists()) {
            // 非矩形对象和辅助节点继续留在原场景中。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Rect2D) {
                mesh.removeSelf();
                this.emitCallbacks(this._onRemove, mesh);
            }
        }
        const created: Mesh[] = [];
        // 保存格式使用数据快照；加载时重新分配运行期 ID。
        for (const record of document.meshes) {
            const mesh = CreateRect(record);
            mesh.autoPrecision = record.autoPrecision ?? this.autoPrecision;
            this.meshGroup.add(mesh);
            created.push(mesh);
            this.emitCallbacks(this._onAdd, mesh);
        }
        this.commitHistory();
        this.emitCallbacks(this._onEdit, created);
        this.update();
        return created;
    }

    /**
     * 按替换、增量或减量方式更新选中集合。
     * @param meshes 本次命中的 Mesh、ID 或它们的数组
     * @param operation 集合操作
     * @example
     * tool.select([mesh], "add");
     * @returns 无返回值。
     */
    public select(meshes: Mesh | number | readonly (Mesh | number)[], operation: SelectionOperation = "replace"): void {
        let inputs: readonly (Mesh | number)[];
        // 调用方可传单个值，也可传混合数组。
        if (meshes instanceof Mesh || typeof meshes === "number") {
            inputs = [meshes];
        } else {
            inputs = meshes;
        }
        const candidates = new Set(this.scene.ensureLists());
        const valid: Mesh[] = [];
        // ID 从当前场景查找，已删除 ID 不会重新选中旧对象。
        for (const input of inputs) {
            let mesh: Mesh | undefined;
            // 数值 ID 与 Mesh 对象统一转换为有效候选。
            if (typeof input === "number") {
                // 只从当前场景查找，避免选中离场的旧对象。
                for (const candidate of candidates) {
                    // ID 唯一，匹配后直接沿用当前 Mesh 引用。
                    if (candidate.id === input && candidate instanceof Mesh) {
                        mesh = candidate;
                    }
                }
            } else {
                mesh = input;
            }
            // 已从场景移除的对象仍需能从当前选择集合中取消。
            if (mesh !== undefined && operation === "sub") {
                // 减选只能移除当前已经选中的对象。
                if (this.actives.includes(mesh)) {
                    valid.push(mesh);
                }
            } else if (mesh !== undefined && candidates.has(mesh) && mesh.data instanceof Rect2D && !(mesh instanceof IMesh) && !mesh.noSelect) {
                // 普通选择只接受场景中的可编辑 Rect2D Mesh。
                valid.push(mesh);
            }
        }
        let next: Mesh[];
        // 增减模式只修改命中成员，替换模式遵守 mult 的单选约束。
        if (operation === "add") {
            next = [...this.actives];
            // 保留原有顺序，再逐一追加新命中的矩形。
            for (const mesh of valid) {
                // 同一对象多次命中时只记录一次。
                if (!next.includes(mesh)) {
                    next.push(mesh);
                }
            }
        } else if (operation === "sub") {
            // 减量操作不会改变未命中的已有选择。
            next = [];
            // 逐个保留没有落入本次减选范围的对象。
            for (const mesh of this.actives) {
                // 命中对象从累计选择中排除。
                if (!valid.includes(mesh)) {
                    next.push(mesh);
                }
            }
        } else if (this.mult) {
            // 多选模式保留本次框内的全部矩形。
            next = [...new Set(valid)];
        } else {
            // 单选模式收到多个候选时告知调用方，仅保留最后一个。
            if (valid.length > 1) {
                console.warn("RectEditTool.select: mult is disabled; using the last Mesh.");
            }
            next = valid.slice(-1);
        }
        // 增选模式也必须遵守单选开关，调用者一次传多个 ID 时采用最后一个。
        if (!this.mult && next.length > 1) {
            console.warn("RectEditTool.select: mult is disabled; using the last Mesh.");
            next = next.slice(-1);
        }
        const added: Mesh[] = [];
        const removed: Mesh[] = [];
        // 比较新集合，提取需要通知的新增对象。
        for (const mesh of next) {
            // 只有新进入集合的对象才触发选中回调。
            if (!this.actives.includes(mesh)) {
                added.push(mesh);
            }
        }
        // 比较旧集合，提取需要通知的取消对象。
        for (const mesh of this.actives) {
            // 不再属于新集合的对象需要发送取消通知。
            if (!next.includes(mesh)) {
                removed.push(mesh);
            }
        }
        // 只在集合内容变化时通知，避免每帧重选触发外部重建。
        if (added.length > 0 || removed.length > 0) {
            this.active = added;
            this.actives = next;
            // 先还原离开选择集的模型，再给新选中模型换独立样式。
            for (const mesh of removed) {
                this.restoreStyle(mesh);
            }
            // 每个新选中的 Mesh 都取得自己的边与点样式。
            for (const mesh of added) {
                this.applySelectStyle(mesh);
            }
            // 只有选择集合改变才重建一次组框几何。
            if (this.isGroupMode()) {
                this.resetGroupFrame();
            }
            // 取消通知先于新增通知，使外部状态可依次更新。
            if (removed.length > 0) {
                this.emitCallbacks(this._onDeselect, [...removed], [...next]);
            }
            // 新增通知只报告本次真正加入的对象。
            if (added.length > 0) {
                this.emitCallbacks(this._onSelect, [...added], [...next]);
            }
            this.emitCallbacks(this._onSelectionChange, [...next]);
            this.update();
        }
    }

    /**
     * 用独立样式覆盖选中对象的边与点，保留原样式供取消选择时恢复。
     * @param mesh 新选中的矩形
     * @example
     * this.applySelectStyle(mesh);
     * @returns 无返回值。
     */
    private applySelectStyle(mesh: Mesh): void {
        // 共享几何先分离，避免边框和关键点出现在其他 Mesh 上。
        this.uniqueGeometry(mesh);
        const geometry = mesh.data as Rect2D;
        const material = mesh.material;
        // 场景中可编辑 Mesh 必须同时持有材质。
        if (material !== undefined) {
            const selectionMaterial = CopyMaterial(material);
            this._savedStyles.set(mesh, { mesh: mesh.style, geometry: geometry.style, material, selectionMaterial });
            mesh.material = selectionMaterial;
            this.refreshSelectStyle(mesh);
        }
    }

    /**
     * 把选择模板的边线和关键点应用到模型自身，避免额外 SVG 描边。
     * @param mesh 当前选中的矩形
     * @example
     * this.refreshSelectStyle(mesh);
     * @returns 无返回值。
     */
    private refreshSelectStyle(mesh: Mesh): void {
        const saved = this._savedStyles.get(mesh);
        // 只刷新由本工具持有原始样式的选中模型。
        if (saved !== undefined) {
            const source = saved.mesh ?? saved.geometry;
            const style = source.clone();
            // 用户原有线框或 SDF 边框不与编辑边框叠画。
            style.wireframe.enabled = false;
            style.solid.borderWidth = 0;
            style.edge.enabled = this.selectStyle.edge.enabled;
            style.edge.color = this.selectStyle.edge.color;
            style.edge.opacity = this.selectStyle.edge.opacity;
            style.edge.texture = this.selectStyle.edge.texture;
            style.edge.addressModeU = this.selectStyle.edge.addressModeU;
            style.edge.addressModeV = this.selectStyle.edge.addressModeV;
            style.edge.width = this.selectStyle.edge.width;
            style.edge.borderAlign = this.selectStyle.edge.borderAlign;
            style.edge.pixelAligned = this.selectStyle.edge.pixelAligned;
            style.edge.uvRepeat = this.selectStyle.edge.uvRepeat;
            style.points.enabled = this.selectStyle.points.enabled;
            style.points.vertices = true;
            style.points.midpoints = true;
            style.points.color = this.selectStyle.points.color;
            style.points.opacity = this.selectStyle.points.opacity;
            style.points.texture = this.selectStyle.points.texture;
            style.points.radius = this.selectStyle.points.radius;
            style.points.segments = this.selectStyle.points.segments;
            style.points.pixelAligned = this.selectStyle.points.pixelAligned;
            style.points.minPointsLength = this.selectStyle.points.minPointsLength;
            style.points.minEdgePointsLength = this.selectStyle.points.minEdgePointsLength;
            mesh.style = style;
        }
    }

    /**
     * 取消选中后恢复 Mesh、几何与材质之前各自使用的样式引用。
     * @param mesh 离开选中集合的矩形
     * @example
     * this.restoreStyle(mesh);
     * @returns 无返回值。
     */
    private restoreStyle(mesh: Mesh): void {
        const saved = this._savedStyles.get(mesh);
        // 没有由本工具覆盖过的样式不需要恢复。
        if (saved !== undefined) {
            mesh.style = saved.mesh;
            mesh.material = saved.material;
            // mesh.style 为 undefined 时不会同步资源，需要分别恢复。
            if (saved.mesh === undefined) {
                const geometry = mesh.data;
                // 原始 Geometry 样式可能与材质不同，需要恢复几何绑定。
                if (geometry !== undefined) {
                    geometry.style = saved.geometry;
                }
            }
            saved.selectionMaterial.dispose();
            this._savedStyles.delete(mesh);
        }
    }

    /** @example const group = this.isGroupMode(); @returns 当前是否为组变换模式。 */
    private isGroupMode(): boolean {
        return this._activeType === "group";
    }

    /**
     * 按屏幕容差区分组框边缘、内部与外部。
     * @param client 当前鼠标浏览器坐标
     * @param world 当前鼠标世界坐标
     * @example
     * const action = this.groupAction(client, world);
     * @returns 缩放、移动、旋转动作；没有组框时为 null。
     */
    private groupAction(client: Vec2, world: Vec2): GroupAction | null {
        const frame = this._groupFrameCorners;
        // 没有已选对象时还没有可操作的组框。
        if (frame !== null) {
            const screenCorners: Vec2[] = [];
            // 容差始终按 CSS 像素测量，不随相机缩放改变。
            for (const corner of frame) {
                screenCorners.push(this.camera.worldToWindow(corner, this.render));
            }
            const cornerHandles: readonly ResizeHandle[] = ["sw", "se", "ne", "nw"];
            // 角点优先于边线，允许同时调整组框的宽与高。
            if (this.switches.scale) {
                // 缩放启用时按角点和边线顺序拾取，否则保留内部移动命中。
                for (let index = 0; index < screenCorners.length; index++) {
                    const corner = screenCorners[index];
                    // 角点容差按 CSS 像素判断，不随相机缩放变化。
                    if (Math.hypot(client.x - corner.x, client.y - corner.y) <= this.radius) {
                        return { mode: "scale", handle: cornerHandles[index] };
                    }
                }
                const edgeHandles: readonly ResizeHandle[] = ["s", "e", "n", "w"];
                // 边缘优先于内部，以便在框线处稳定进入单轴缩放。
                for (let index = 0; index < screenCorners.length; index++) {
                    const next = screenCorners[(index + 1) % screenCorners.length];
                    // 边界两侧的容差范围都归缩放处理。
                    if (SegmentDistance(client, screenCorners[index], next) <= this.radius) {
                        return { mode: "scale", handle: edgeHandles[index] };
                    }
                }
            }
            // 远离边缘的框内拖动负责平移，外侧仅在旋转允许时响应。
            if (ContainsFrame(frame, world)) {
                // 关闭平移后点击组框内部不会开始组变换。
                if (this.switches.move) {
                    return { mode: "move" };
                } else {
                    return { mode: "select" };
                }
            } else if (this.rotationEnabled && this.switches.rotate) {
                // 用户关掉旋转时，组框外侧不建立旋转手势。
                return { mode: "rotate" };
            } else {
                return { mode: "select" };
            }
        } else {
            return null;
        }
    }

    /** @example this.removeGroupFrame(); @returns 无返回值。 */
    private removeGroupFrame(): void {
        const frame = this._groupFrame;
        // 辅助对象从场景中移除后才释放 CPU 订阅。
        if (frame !== null) {
            frame.removeSelf();
            frame.dispose();
            this._groupFrame = null;
        }
        this._groupFrameCorners = null;
    }

    /**
     * 计算已选矩形四角在浏览器视口中的范围。
     * @example
     * const bounds = this.selectionScreenBounds();
     * @returns 屏幕轴向范围；没有有效选中对象时为 null。
     */
    private selectionScreenBounds(): ScreenBounds | null {
        let bounds: ScreenBounds | null = null;
        // 组框必须包含所有已选矩形的屏幕投影，而非世界轴向范围。
        for (const mesh of this.actives) {
            const footprint = CreateRectFootprint(mesh, mesh.getRenderMatrix(this.camera));
            // 退化矩形没有可以参与组框的角点。
            if (footprint !== undefined) {
                // 旋转后四角各自可能成为屏幕极值。
                for (const corner of footprint.corners) {
                    const client = this.camera.worldToWindow(new Vec2(corner.x, corner.y), this.render);
                    // 非有限投影不能加入组框范围。
                    if (Number.isFinite(client.x) && Number.isFinite(client.y)) {
                        // 首个有效角点建立范围，后续角点扩展四个方向。
                        if (bounds === null) {
                            bounds = { left: client.x, right: client.x, top: client.y, bottom: client.y };
                        } else {
                            bounds.left = Math.min(bounds.left, client.x);
                            bounds.right = Math.max(bounds.right, client.x);
                            bounds.top = Math.min(bounds.top, client.y);
                            bounds.bottom = Math.max(bounds.bottom, client.y);
                        }
                    }
                }
            }
        }
        return bounds;
    }

    /**
     * 从画框仿射矩阵还原其世界四角，供组模式命中与变换使用。
     * @param frame 屏幕画框的世界变换
     * @example
     * const corners = this.drawFrameCorners(frame);
     * @returns 沿边界依次排列的四个世界角点。
     */
    private drawFrameCorners(frame: DrawFrame): Vec2[] {
        const halfRightX = frame.matrix[0] * frame.width * 0.5;
        const halfRightY = frame.matrix[1] * frame.width * 0.5;
        const halfUpX = frame.matrix[3] * frame.height * 0.5;
        const halfUpY = frame.matrix[4] * frame.height * 0.5;
        return [
            new Vec2(frame.center.x - halfRightX - halfUpX, frame.center.y - halfRightY - halfUpY),
            new Vec2(frame.center.x + halfRightX - halfUpX, frame.center.y + halfRightY - halfUpY),
            new Vec2(frame.center.x + halfRightX + halfUpX, frame.center.y + halfRightY + halfUpY),
            new Vec2(frame.center.x - halfRightX + halfUpX, frame.center.y - halfRightY + halfUpY),
        ];
    }

    /** @example this.resetGroupFrame(); @returns 无返回值。 */
    private resetGroupFrame(): void {
        this.removeGroupFrame();
        const bounds = this.selectionScreenBounds();
        this._groupFrameCustomized = false;
        // 选择集合变化时按屏幕投影生成组框，拖动时仍只改 Mesh 变换。
        if (this.isGroupMode() && bounds !== null) {
            const startClient = new Vec2(bounds.left, bounds.top);
            const frame = this.drawFrame({
                startClient,
                startWorld: this.camera.windowToWorld(startClient, this.render),
                currentClient: new Vec2(bounds.right, bounds.bottom),
            }, false);
            // 零尺寸投影无法形成可命中的组边界。
            if (frame !== null && frame.width > 0 && frame.height > 0) {
                this._groupFrame = CreateGroupFrame(frame);
                this.applyDrawFrame(this._groupFrame, frame);
                this._groupFrameCorners = this.drawFrameCorners(frame);
                this.frameGroup.add(this._groupFrame);
            }
        }
        this.camera.ensureCameraMatrix();
        this._groupViewVersion = this.camera.viewMatrix.version;
        this._groupProjectionVersion = this.camera.orthogonalMatrix.version;
    }

    /** @example this.removePreviewFrame(); @returns 无返回值。 */
    private removePreviewFrame(): void {
        const preview = this._previewFrame;
        // 画框手势结束后才移除辅助 Mesh，编辑对象继续保留在模型组。
        if (preview !== null) {
            preview.removeSelf();
            preview.dispose();
            this._previewFrame = null;
        }
    }

    /**
     * 撤下某件矩形对应的旋转辅助 Mesh。
     * @param mesh 已取消选择或无法投影的矩形
     * @example
     * this.removeRotationHandle(mesh);
     * @returns 无返回值。
     */
    private removeRotationHandle(mesh: Mesh): void {
        const handle = this._rotationHandles.get(mesh);
        // 手柄仅属于编辑器覆盖层，撤下时不触及被选中的矩形。
        if (handle !== undefined) {
            handle.removeSelf();
            handle.dispose();
            this._rotationHandles.delete(mesh);
        }
    }

    /** @example this.removeRotationHandles(); @returns 无返回值。 */
    private removeRotationHandles(): void {
        // 离开编辑模式或销毁工具时释放全部选中对象的旋转手柄。
        for (const mesh of this._rotationHandles.keys()) {
            this.removeRotationHandle(mesh);
        }
    }

    /**
     * 求矩形上边中点和朝外方向，距离始终使用屏幕 CSS 像素。
     * @param mesh 当前选中的矩形
     * @example
     * const position = this.rotationHandlePosition(mesh);
     * @returns 上边中点与屏幕外向单位向量；退化矩形为 null。
     */
    private rotationHandlePosition(mesh: Mesh): { top: Vec2; outward: Vec2 } | null {
        const geometry = mesh.data;
        // 旋转端点依附几何体本身，而非选择集合的轴向包围盒。
        if (geometry instanceof Rect2D && geometry.height > 0) {
            const matrix = mesh.getRenderMatrix(this.camera).data;
            const centerWorld = new Vec2(matrix[6], matrix[7]);
            const topWorld = new Vec2(
                matrix[6] + matrix[3] * geometry.height * 0.5,
                matrix[7] + matrix[4] * geometry.height * 0.5,
            );
            const center = this.camera.worldToWindow(centerWorld, this.render);
            const top = this.camera.worldToWindow(topWorld, this.render);
            const length = Math.hypot(top.x - center.x, top.y - center.y);
            // 屏幕上塌缩的局部上轴无法给旋转手柄提供稳定方向。
            if (Number.isFinite(length) && length > Number.EPSILON) {
                return { top, outward: new Vec2((top.x - center.x) / length, (top.y - center.y) / length) };
            }
        }
        return null;
    }

    /**
     * 按场景绘制顺序命中某件选中矩形的旋转端点。
     * @param client 当前指针的浏览器坐标
     * @example
     * const mesh = this.pickRotationHandle(client);
     * @returns 可旋转矩形或 null。
     */
    public pickRotationHandle(client: Vec2): Mesh | null {
        // 普通编辑中每件选中矩形都保留自己的旋转手柄。
        if (this.rotationEnabled && this.switches.rotate && this._activeType === "edit" && this.actives.length > 0) {
            const selected = new Set(this.actives);
            const candidates: RankedMesh[] = [];
            const drawList = this.scene.ensureLists();
            // 重叠的旋转端点按其矩形的绘制层级决定命中对象。
            for (let index = 0; index < drawList.length; index++) {
                const mesh = drawList[index];
                // 只有实际可绘制且已选中的普通矩形拥有可命中的端点。
                if (mesh instanceof Mesh && selected.has(mesh) && mesh.data instanceof Rect2D && mesh.material !== undefined) {
                    let layer = 1;
                    // 与普通角边拾取相同，关闭深度测试的对象更靠上。
                    if (mesh.material.depthTest) {
                        layer = 0;
                    }
                    candidates.push({ mesh, rank: index, layer });
                }
            }
            candidates.sort(CompareRankedMeshes);
            // 第一个命中的圆点对应最上层矩形，单次只旋转它。
            for (const candidate of candidates) {
                const position = this.rotationHandlePosition(candidate.mesh);
                // 鼠标必须落在圆点附近，连接线不抢普通边角编辑。
                if (position !== null) {
                    const centerX = position.top.x + position.outward.x * 24;
                    const centerY = position.top.y + position.outward.y * 24;
                    // 端点命中容差至少覆盖自身可见半径。
                    if (Math.hypot(client.x - centerX, client.y - centerY) <= Math.max(this.radius, 6)) {
                        return candidate.mesh;
                    }
                }
            }
        }
        return null;
    }

    /** @example this.updateRotationHandles(); @returns 无返回值。 */
    private updateRotationHandles(): void {
        // 组模式和旋转关闭时均不保留单体旋转手柄。
        if (this.rotationEnabled && this.switches.rotate && this._activeType === "edit") {
            const selected = new Set(this.actives);
            // 先撤下已经取消选择的对象，避免残留不可用的端点。
            for (const mesh of this._rotationHandles.keys()) {
                // 保留仍然选中且在场景中的矩形。
                if (!selected.has(mesh)) {
                    this.removeRotationHandle(mesh);
                }
            }
            // 每件选中矩形都拥有自己的辅助 Mesh 和屏幕变换。
            for (const mesh of this.actives) {
                const position = this.rotationHandlePosition(mesh);
                // 只为可投影的矩形维护覆盖层。
                if (position !== null) {
                    // 手柄局部 X 朝向屏幕右侧的切线，局部 Y 指向矩形外侧。
                    const tangent = new Vec2(-position.outward.y, position.outward.x);
                    const origin = this.camera.windowToWorld(position.top, this.render);
                    const right = this.camera.windowToWorld(new Vec2(
                        position.top.x + tangent.x,
                        position.top.y + tangent.y,
                    ), this.render);
                    const outward = this.camera.windowToWorld(new Vec2(
                        position.top.x + position.outward.x,
                        position.top.y + position.outward.y,
                    ), this.render);
                    const worldMatrix: MatrixValues = [
                        right.x - origin.x, right.y - origin.y, 0,
                        outward.x - origin.x, outward.y - origin.y, 0,
                        origin.x, origin.y, 1,
                    ];
                    let handle = this._rotationHandles.get(mesh);
                    // 首次显示时创建一次，拖动和缩放只更新矩阵。
                    if (handle === undefined) {
                        handle = CreateRotationHandle();
                        this._rotationHandles.set(mesh, handle);
                        this.frameGroup.add(handle);
                    }
                    const localMatrix = WorldToLocalMatrix(handle, worldMatrix);
                    // 父组不可逆时不写入失效的手柄位置。
                    if (localMatrix !== null) {
                        const oldMatrix = handle.ensureMatrix().data;
                        let changed = false;
                        // 静止时跳过矩阵写入，避免每帧递增辅助 Mesh 的版本。
                        for (let index = 0; index < localMatrix.length; index++) {
                            // 任一分量不同才提交本次覆盖层变换。
                            if (oldMatrix[index] !== localMatrix[index]) {
                                changed = true;
                            }
                        }
                        // 相机或目标矩形确有变化时才更新 GPU 变换。
                        if (changed) {
                            handle.position.set(localMatrix[6], localMatrix[7]);
                            handle.matrix.set(localMatrix);
                        }
                    }
                } else {
                    this.removeRotationHandle(mesh);
                }
            }
        } else {
            this.removeRotationHandles();
        }
    }

    /**
     * 从场景删除一个矩形并同步选择状态。
     * @param mesh 待删除对象
     * @example
     * tool.remove(mesh);
     * @returns 是否从场景成功删除。
     */
    public remove(mesh: Mesh): boolean {
        const ownsHistory = this._historyStart === null;
        // 独立删除建立自己的历史，批量删除沿用外层历史。
        if (ownsHistory) {
            this.beginHistory();
        }
        const removed = mesh.removeSelf();
        // 仅在节点确实离开场景后通知删除。
        if (removed) {
            this.select([mesh], "sub");
            this.emitCallbacks(this._onRemove, mesh);
            this.emitCallbacks(this._onEdit, [mesh]);
            this.update();
        }
        // 外层批量操作会在全部对象处理后统一提交。
        if (ownsHistory) {
            this.commitHistory();
        }
        return removed;
    }

    /**
     * 删除当前选中的矩形，并保留统一的删除通知入口供后续撤销功能接管。
     * @example
     * tool.removeSelected();
     * @returns 本次成功删除的 Mesh。
     */
    public removeSelected(): Mesh[] {
        this.beginHistory();
        const removed: Mesh[] = [];
        // 删除时 select 会修改 actives，因此先复制选中集合。
        for (const mesh of [...this.actives]) {
            // 只有成功离开场景的对象才计入本次删除结果。
            if (this.remove(mesh)) {
                removed.push(mesh);
            }
        }
        this.commitHistory();
        return removed;
    }

    /**
     * 把一个或多个 Rect2D Mesh 加入编辑器管理组。
     * @param meshes 要加入的模型
     * @example tool.push(mesh);
     * @returns 实际加入的矩形。
     */
    public push(meshes: Mesh | readonly Mesh[]): Mesh[] {
        const ownsHistory = this._historyStart === null;
        // 手势新建和批量加入复用已有历史边界。
        if (ownsHistory) {
            this.beginHistory();
        }
        let inputs: readonly Mesh[];
        // 支持单个对象和一次加入多个对象。
        if (meshes instanceof Mesh) {
            inputs = [meshes];
        } else {
            inputs = meshes;
        }
        const added: Mesh[] = [];
        // 不符合矩形编辑约束的 Mesh 不加入场景。
        for (const mesh of inputs) {
            // 所有添加对象必须有可绘制的 Rect2D 和材质。
            if (mesh.data instanceof Rect2D && mesh.material !== undefined && !(mesh instanceof IMesh)) {
                mesh.autoPrecision = this.autoPrecision;
                this.meshGroup.add(mesh);
                added.push(mesh);
                this.emitCallbacks(this._onAdd, mesh);
            } else {
                console.warn("RectEditTool.push: only a Rect2D Mesh with material can be added.");
            }
        }
        // 整批添加只发一次编辑通知，逐个添加仍各发一次 onAdd。
        if (added.length > 0) {
            this.emitCallbacks(this._onEdit, added);
        }
        // 独立 push 的历史在整批插入后完成。
        if (ownsHistory) {
            this.commitHistory();
        }
        this.update();
        return added;
    }

    /** @example tool.copySelected(); @returns 已复制的矩形数量。 */
    public copySelected(): number {
        this._clipboard = [];
        this._clipboardClient = this._lastClient?.clone() ?? null;
        // 剪贴板保存独立对象，复制时去掉临时选中外观。
        for (const mesh of this.actives) {
            const copy = mesh.clone();
            copy.order = this.sourceOrder(mesh);
            const saved = this._savedStyles.get(mesh);
            // 选中对象的克隆先恢复原始材质和贴图，避免复制黄色边框。
            if (saved !== undefined) {
                const originalStyle = saved.mesh ?? saved.geometry;
                const copiedStyle = originalStyle.clone();
                copy.style = copiedStyle;
                copy.material = CloneMaterial(saved.material, copiedStyle);
            }
            ApplyRect(copy, this.captureUserRect(mesh));
            this._clipboard.push(copy);
        }
        return this._clipboard.length;
    }

    /** @example tool.paste(); @returns 本次粘贴的新矩形。 */
    public paste(): Mesh[] {
        let added: Mesh[] = [];
        // 空剪贴板不改变选择，也不占用撤销记录。
        if (this._clipboard.length > 0) {
            this.beginHistory();
            const copies: Mesh[] = [];
            const bounds = MeshBounds(this._clipboard, this.camera);
            let offsetX = 10;
            let offsetY = -10;
            const client = this._lastClient;
            // 鼠标在画布内时，把整批复制内容的包围盒中心放到鼠标处。
            if (client !== null && bounds !== null) {
                const canvasBounds = this.render.canvas.getBoundingClientRect();
                const insideCanvas = client.x >= canvasBounds.left && client.x <= canvasBounds.right &&
                    client.y >= canvasBounds.top && client.y <= canvasBounds.bottom;
                // 未经过画布的鼠标位置不能用于粘贴坐标。
                if (insideCanvas) {
                    const center = new Vec2((bounds.left + bounds.right) * 0.5, (bounds.bottom + bounds.top) * 0.5);
                    const originalClient = this.camera.worldToWindow(center, this.render);
                    const centerDistance = Math.hypot(client.x - originalClient.x, client.y - originalClient.y);
                    let copyCursorDistance = Infinity;
                    // 复制时停在矩形内部任何位置，都应识别为“鼠标未移动”。
                    if (this._clipboardClient !== null) {
                        copyCursorDistance = Math.hypot(
                            client.x - this._clipboardClient.x,
                            client.y - this._clipboardClient.y,
                        );
                    }
                    // 原中心或原鼠标点附近使用错开兜底，其他位置以鼠标为准。
                    if (centerDistance >= 3 && copyCursorDistance >= 3) {
                        const target = this.camera.windowToWorld(client, this.render);
                        offsetX = target.x - center.x;
                        offsetY = target.y - center.y;
                    }
                }
            }
            // 每次粘贴再复制模板，后续粘贴不会移动剪贴板原件。
            for (const template of this._clipboard) {
                const copy = template.clone();
                const sourceMatrix = template.ensureMatrix().data;
                const matrix: MatrixValues = [
                    sourceMatrix[0], sourceMatrix[1], sourceMatrix[2],
                    sourceMatrix[3], sourceMatrix[4], sourceMatrix[5],
                    sourceMatrix[6] + offsetX, sourceMatrix[7] + offsetY, sourceMatrix[8],
                ];
                copy.position.set(copy.position.x + offsetX, copy.position.y + offsetY);
                copy.matrix.set(matrix);
                copies.push(copy);
            }
            added = this.push(copies);
            this.select(added);
            this.commitHistory();
        }
        return added;
    }

    /** @example tool.cutSelected(); @returns 已剪切的矩形。 */
    public cutSelected(): Mesh[] {
        this.copySelected();
        return this.removeSelected();
    }

    /**
     * 同步选中样式和画框预览 Mesh；画框按屏幕轴对齐，创建起点固定在世界坐标。
     * @example
     * tool.update();
     * @returns 无返回值。
     */
    public update(): void {
        // 销毁后的工具不再修改辅助 Mesh。
        if (this._destroyed) {
            return;
        }
        // 网格根据相机和画布变化更新屏幕相位及尺子数字。
        if (this._helperGrid !== null) {
            this._helperGrid.update();
        }
        // 模板替换或字段调整后，已选模型的独立样式也同步更新。
        if (this.selectStyle !== this._appliedSelectStyle || this.selectStyle.version !== this._selectStyleVersion) {
            // 已选模型的外观由同一模板派生，但彼此样式引用独立。
            for (const mesh of this.actives) {
                this.refreshSelectStyle(mesh);
            }
            this._appliedSelectStyle = this.selectStyle;
            this._selectStyleVersion = this.selectStyle.version;
        }
        // 尚未进行组变换的辅助框随相机视口变化重新贴合屏幕投影。
        if (this.isGroupMode() && !this._groupFrameCustomized && this._gesture === null) {
            this.camera.ensureCameraMatrix();
            // 静止相机不重建组框，避免恢复逐帧计算包围盒的旧问题。
            if (this._groupViewVersion !== this.camera.viewMatrix.version ||
                this._groupProjectionVersion !== this.camera.orthogonalMatrix.version) {
                this.resetGroupFrame();
            }
        }
        const gesture = this._gesture;
        // 新建和框选共用框组中的一件预览 Mesh。
        if (gesture !== null && gesture.moved &&
            ((gesture.mode === "create" && this.switches.create) ||
                (gesture.mode === "marquee" && this.switches.marquee))) {
            const frame = this.drawFrame(gesture, gesture.mode === "create");
            // 有效范围才创建或更新预览，零尺寸范围保持空画面。
            if (frame !== null) {
                // 每次画框只创建一件预览 Mesh，后续拖动仅更新其尺寸。
                if (this._previewFrame === null) {
                    this._previewFrame = CreatePreviewFrame();
                    this.frameGroup.add(this._previewFrame);
                }
                const geometry = this._previewFrame.data as Rect2D;
                geometry.width = frame.width;
                geometry.height = frame.height;
                this.applyDrawFrame(this._previewFrame, frame);
            } else {
                // 光标越过活动区域后不能保留上一帧看似有效的画框。
                this.removePreviewFrame();
            }
        }
        this.updateRotationHandles();
        this.refreshData();
    }

    /**
     * 销毁指针监听和辅助组；把编辑 Mesh 放回场景根节点。
     * @example
     * tool.destroy();
     * @returns 无返回值。
     */
    public destroy(): void {
        // 销毁动作只执行一次，避免重复通知和样式恢复。
        if (!this._destroyed) {
            this._destroyed = true;
            this.cancel();
            this._events.abort();
            this.removePreviewFrame();
            this.removeGroupFrame();
            this.removeRotationHandles();
            // 编辑器销毁后恢复用户原有的样式和边框开关。
            for (const mesh of [...this._savedStyles.keys()]) {
                this.restoreStyle(mesh);
            }
            this.render.canvas.style.cursor = this._originalCursor;
            this.render.canvas.style.touchAction = this._originalTouchAction;
            this._touchPointers.clear();
            // 工具销毁不删除用户 Mesh，统一回到原场景根节点。
            for (const child of [...this.meshGroup.children]) {
                this.scene.add(child);
            }
            // 网格拥有独立材质和几何，随工具一起释放。
            if (this._helperGrid !== null) {
                this._helperGrid.destroy();
                this._helperGrid = null;
            }
            this.group.removeSelf();
            this.emitCallbacks(this._onDestroy);
        }
    }

    /**
     * 清除正在进行的画框或变换，不回滚已完成的逐帧编辑。
     * @example
     * tool.cancel();
     * @returns 无返回值。
     */
    public cancel(): void {
        const gesture = this._gesture;
        this._gesture = null;
        this.clearViewPointer();
        this.removePreviewFrame();
        // 中断时释放由独立编辑器捕获的指针，避免后续画布事件被占用。
        if (gesture !== null && this.render.canvas.hasPointerCapture(gesture.pointerId)) {
            this.render.canvas.releasePointerCapture(gesture.pointerId);
        }
        this.commitHistory();
        this.update();
    }

    /**
     * 查看模式按下时同步画布与容器光标，以覆盖相机控制器的容器指针捕获。
     * @param event 本次按下的鼠标事件
     * @example
     * this.beginViewPointer(event);
     * @returns 无返回值。
     */
    private beginViewPointer(event: PointerEvent): void {
        // 一次只维护当前相机拖动所用的鼠标指针。
        if (this._viewPointerId === null) {
            this._viewPointerId = event.pointerId;
            this._viewContainerCursor = this.render.container.style.cursor;
            this._lastClient = new Vec2(event.clientX, event.clientY);
            this.updateCursor(this._lastClient);
            this.render.container.style.cursor = this.render.canvas.style.cursor;
        }
    }

    /**
     * 结束查看模式的抓取光标，并恢复容器进入编辑器前的光标。
     * @example
     * this.clearViewPointer();
     * @returns 无返回值。
     */
    private clearViewPointer(): void {
        // 只有本工具设置过容器光标时才恢复，避免覆盖外部样式。
        if (this._viewPointerId !== null) {
            this._viewPointerId = null;
            // 空字符串也是原本有效的内联样式，需要按原值恢复。
            if (this._viewContainerCursor !== null) {
                this.render.container.style.cursor = this._viewContainerCursor;
                this._viewContainerCursor = null;
            }
            // 松开后立即显示张开的手，不等待下次悬停事件。
            if (this._activeType === "view" && this._lastClient !== null) {
                this.updateCursor(this._lastClient);
            }
        }
    }

    /**
     * 跟踪编辑区域的触点；第二根手指加入时把整轮触摸交给相机控制器。
     * @param event 新按下的指针事件
     * @example
     * this.trackTouchPointerDown(event);
     * @returns 无返回值。
     */
    private trackTouchPointerDown(event: PointerEvent): void {
        // 只登记触控指针，鼠标不参与单指与多指判定。
        if (event.pointerType === "touch") {
            this._touchPointers.add(event.pointerId);
            // 第二根手指出现后停止编辑，直到全部触点松开才开始新手势。
            if (this._touchPointers.size > 1 && this._gesture !== null) {
                this.cancel();
            }
        }
    }

    /**
     * 页面失焦后清空触点，避免下一轮单指被误判成多指。
     * @example
     * this.handleBlur();
     * @returns 无返回值。
     */
    private handleBlur(): void {
        this._touchPointers.clear();
        this.cancel();
    }

    /**
     * 接收鼠标左键或单指按下；autoBind 关闭时由上层编辑器转发。
     * @param event 画布内的指针事件
     * @example
     * tool.handlePointerDown(event);
     * @returns 无返回值。
     */
    public handlePointerDown(event: PointerEvent): void {
        this.trackTouchPointerDown(event);
        let accepted = false;
        // 单指与鼠标左键共用编辑流程，多指和其他鼠标按键由其他控制器处理。
        if (event.pointerType === "touch") {
            accepted = this._touchPointers.size === 1;
        } else if (event.pointerType === "mouse") {
            // 触屏仍按住时不同时启动鼠标编辑。
            accepted = event.button === 0 && this._touchPointers.size === 0;
        }
        // 查看模式由相机控制器拖动，按下时只维护抓取光标。
        if (this.enabled && !this._destroyed && this._activeType === "view" &&
            event.pointerType === "mouse" && (event.button === 0 || event.button === 2)) {
            this.beginViewPointer(event);
        } else if (this.enabled && !this._destroyed && this._activeType !== "view" && accepted) {
            // 编辑模式接收单指或鼠标左键，查看模式不会进入本分支。
            this.beginHistory();
            const client = new Vec2(event.clientX, event.clientY);
            // 触屏没有悬停状态，只保存鼠标位置供模式切换时恢复光标。
            if (event.pointerType === "mouse") {
                this._lastClient = client;
            }
            const world = this.camera.windowToWorld(client, this.render);
            const rotationTarget = this.pickRotationHandle(client);
            const hit = this.pick(client, world);
            const groupMode = this.isGroupMode();
            const groupFrame = this._groupFrameCorners;
            let mode: GestureMode = "marquee";
            let target: Mesh | undefined;
            let handle: RectHandle | undefined;
            // 组模式由鼠标所在的边缘、内部或外部决定当前动作。
            if (groupMode && groupFrame !== null) {
                const action = this.groupAction(client, world);
                // 已有组框时动作一定可用。
                if (action !== null) {
                    mode = action.mode;
                    handle = action.handle;
                }
            } else if (rotationTarget !== null && this.switches.rotate) {
                // 单体旋转手柄不进入普通角边拾取，保持已有选择集。
                mode = "rotateRect";
                target = rotationTarget;
            } else if (this._activeType === "edit" && hit !== null &&
                (this.switches.pick || this.actives.includes(hit.mesh))) {
                // 普通编辑从最上层命中的矩形开始。
                const alreadySelected = this.actives.includes(hit.mesh);
                let operation: SelectionOperation = "replace";
                // 多选编辑应保留先前已选中的对象。
                if (this.mult) {
                    operation = "add";
                }
                // 已选对象可以继续编辑；点选开关仅控制改变选择集。
                if (this.switches.pick) {
                    this.select([hit.mesh], operation);
                }
                // activeOnly 的首次点击只选择，下一次才允许拖动编辑。
                if (!this.activeOnly || alreadySelected) {
                    // 内部命中用于移动；边角命中用于改尺寸。
                    if (hit.handle === "body" && this.switches.move) {
                        mode = "move";
                    } else if (hit.handle !== "body" && this.switches.resize) {
                        // 边角只有在尺寸编辑开启时才开始拉伸。
                        mode = "resize";
                    } else {
                        mode = "select";
                    }
                    target = hit.mesh;
                    handle = hit.handle;
                } else {
                    mode = "select";
                }
            } else if (this._activeType === "edit" && hit !== null) {
                // 禁用点选的现有对象仍挡住新建入口，避免在实体上误画新对象。
                mode = "select";
            } else if (this._activeType === "edit" && this.switches.create) {
                // 空白处创建矩形；Shift 在画框期间把按下点改为中心。
                mode = "create";
            }
            let snapshotMeshes: Mesh[] = this.actives;
            // 普通单对象编辑保留目标快照；多选移动与组变换保留整个选择集。
            if (target !== undefined && (mode !== "move" || !this.mult) && !groupMode) {
                snapshotMeshes = [target];
            }
            const snapshots = this.snapshots(snapshotMeshes);
            const targetGeometry = target?.data;
            let width: number | undefined;
            let height: number | undefined;
            // 只有 Rect2D 几何体具有可编辑的宽高。
            if (targetGeometry instanceof Rect2D) {
                width = targetGeometry.width;
                height = targetGeometry.height;
            }
            let frameSnapshot: Vec2[] | undefined;
            let frameState: MeshSnapshot | undefined;
            // 手势基准冻结组框形状与矩阵，避免拖动期间逐帧累积误差。
            if (groupFrame !== null && this._groupFrame !== null) {
                frameSnapshot = [];
                // 四角各自复制，后续编辑不会改写按下时坐标。
                for (const point of groupFrame) {
                    frameSnapshot.push(point.clone());
                }
                frameState = this.snapshots([this._groupFrame])[0];
            }
            let creationStartWorld: Vec2 | undefined;
            // 创建起点在按下时完成定位，之后缩放、平移相机不能改变这个世界锚点。
            if (mode === "create") {
                creationStartWorld = this.resolveCreationPoint(world, true);
            }
            this._gesture = {
                mode,
                pointerId: event.pointerId,
                startClient: client,
                currentClient: client.clone(),
                startWorld: world,
                creationStartWorld,
                currentWorld: world.clone(),
                moved: false,
                snapshots,
                bounds: MeshBounds(snapshotMeshes, this.camera),
                frame: frameSnapshot,
                frameState,
                target,
                handle,
                width,
                height,
                matrix: target?.getRenderMatrix(this.camera).data.slice(),
            };
            // 仅对画布原生事件捕获指针，合并编辑器转发时不夺取其他控件的事件。
            if (event.target === this.render.canvas) {
                this.render.canvas.setPointerCapture(event.pointerId);
            }
            this.update();
        }
    }

    /**
     * 处理悬停光标与拖动中的实时几何修改。
     * @param event 当前指针事件
     * @example
     * tool.handlePointerMove(event);
     * @returns 无返回值。
     */
    public handlePointerMove(event: PointerEvent): void {
        let accepted = false;
        // 单指可以继续拖动；第二指加入后不恢复本轮编辑。
        if (event.pointerType === "touch") {
            accepted = this._touchPointers.size === 1 && this._touchPointers.has(event.pointerId);
        } else if (event.pointerType === "mouse") {
            // 多指操作期间忽略兼容鼠标事件。
            accepted = this._touchPointers.size === 0;
        }
        // 关闭的编辑器和未登记的指针都不能修改模型或悬停状态。
        if (this.enabled && !this._destroyed && accepted) {
            const client = new Vec2(event.clientX, event.clientY);
            // 触屏没有光标位置，最后悬停位置只由鼠标维护。
            if (event.pointerType === "mouse") {
                this._lastClient = client;
            }
            const gesture = this._gesture;
            // 非本次指针只更新悬停，不得改变正在编辑的对象。
            if (gesture !== null && event.pointerId === gesture.pointerId) {
                gesture.currentClient = client;
                gesture.currentWorld = this.camera.windowToWorld(client, this.render);
                gesture.moved = gesture.moved || Math.hypot(
                    client.x - gesture.startClient.x,
                    client.y - gesture.startClient.y,
                ) >= 3;
                // 越过点击阈值后才将移动转换为编辑。
                if (gesture.moved) {
                    this.applyGesture(gesture);
                }
                this.update();
            } else if (gesture === null && event.pointerType === "mouse") {
                // 只有鼠标具有悬停状态，触屏抬起前不更新光标。
                this.updateCursor(client);
            }
        }
    }

    /**
     * 结束拖动，提交新矩形或增减框选集合。
     * @param event 松开左键的 PointerEvent
     * @example
     * tool.handlePointerUp(event);
     * @returns 无返回值。
     */
    public handlePointerUp(event: PointerEvent): void {
        // 即使多指手势已取消编辑，也要记录触点松开，避免下一轮无法单指编辑。
        if (event.pointerType === "touch") {
            this._touchPointers.delete(event.pointerId);
        }
        // 查看模式没有编辑手势，仍要在相机拖动结束时恢复手形。
        if (this._viewPointerId === event.pointerId) {
            this._lastClient = new Vec2(event.clientX, event.clientY);
            this.clearViewPointer();
        }
        const gesture = this._gesture;
        // 只结束当前由本工具启动的指针手势。
        if (gesture !== null && event.pointerId === gesture.pointerId) {
            const client = new Vec2(event.clientX, event.clientY);
            gesture.currentClient = client;
            gesture.currentWorld = this.camera.windowToWorld(client, this.render);
            gesture.moved = gesture.moved || Math.hypot(
                client.x - gesture.startClient.x,
                client.y - gesture.startClient.y,
            ) >= 3;
            const groupClick = this.isGroupMode() && !gesture.moved;
            // 最后一次指针位置也要应用到实时变换。
            if (gesture.moved) {
                this.applyGesture(gesture);
            }
            // 新建模式在有效拖动结束时提交对象。
            if (gesture.mode === "create" && gesture.moved) {
                this.finishCreate(gesture);
            } else if (gesture.mode === "create") {
                // 空白点击取消当前选择，只有拖动才会生成新矩形。
                if (this.switches.pick) {
                    this.select([]);
                }
            } else if (gesture.mode === "marquee" && !groupClick) {
                // 选择模式在松开时决定点选或框选结果。
                this.finishSelection(gesture, client);
            }
            this._gesture = null;
            this.removePreviewFrame();
            // 仅释放本工具确实持有的指针捕获。
            if (this.render.canvas.hasPointerCapture(event.pointerId)) {
                this.render.canvas.releasePointerCapture(event.pointerId);
            }
            // 组模式中的单击清除选择，并回到普通编辑模式。
            if (groupClick) {
                this.select([]);
                this.activeType = "edit";
            }
            this.commitHistory();
            // 抬起触点不产生悬停光标，鼠标结束后则恢复相应图标。
            if (event.pointerType === "mouse") {
                this.updateCursor(client);
            }
            this.update();
        }
    }

    /**
     * 中止当前指针动作；已提交的逐帧变换保持不变。
     * @param event 取消的 PointerEvent
     * @example
     * tool.handlePointerCancel(event);
     * @returns 无返回值。
     */
    public handlePointerCancel(event: PointerEvent): void {
        // 系统取消某根手指时同步触摸计数。
        if (event.pointerType === "touch") {
            this._touchPointers.delete(event.pointerId);
        }
        // 指针捕获被取消时不能把抓取光标留在容器上。
        if (this._viewPointerId === event.pointerId) {
            this.clearViewPointer();
        }
        // 取消事件只影响同一个指针发起的动作。
        if (this._gesture?.pointerId === event.pointerId) {
            this.cancel();
        }
    }

    /**
     * 按实际绘制顺序命中上层矩形，每个矩形依次检查角、边和内部。
     * @param client 鼠标浏览器坐标
     * @param world 鼠标世界坐标
     * @example
     * const hit = this.pick(client, world);
     * @returns 命中信息或 null。
     */
    private pick(client: Vec2, world: Vec2): RectHit | null {
        const drawList = this.scene.ensureLists();
        const candidates: RankedMesh[] = [];
        // 未通过深度测试的覆盖层比深度测试对象更靠上。
        for (let index = 0; index < drawList.length; index++) {
            const mesh = drawList[index];
            // 选择器忽略其他几何体和实例 Mesh。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Rect2D && mesh.material !== undefined) {
                let layer = 1;
                // 开启深度测试的对象按较低覆盖层排序。
                if (mesh.material.depthTest) {
                    layer = 0;
                }
                candidates.push({ mesh, rank: index, layer });
            }
        }
        candidates.sort(CompareRankedMeshes);
        // 从最上层到下层查找，命中后立即停止。
        for (const candidate of candidates) {
            const footprint = CreateRectFootprint(candidate.mesh, candidate.mesh.getRenderMatrix(this.camera));
            // 仅可计算角点的矩形参与角边与内部命中。
            if (footprint !== undefined) {
                const corners: Vec2[] = [];
                // 角点距离必须先投影到 CSS 像素空间。
                for (const point of footprint.corners) {
                    corners.push(this.camera.worldToWindow(new Vec2(point.x, point.y), this.render));
                }
                const handles: readonly RectHandle[] = ["ne", "nw", "sw", "se"];
                // 一件对象内部总是角点优先，容差不随相机缩放变化。
                for (let index = 0; index < corners.length; index++) {
                    // 角点容差优先于同一对象的边线与内部。
                    if (Math.hypot(client.x - corners[index].x, client.y - corners[index].y) <= this.radius) {
                        return { mesh: candidate.mesh, handle: handles[index] };
                    }
                }
                const edges: readonly RectHandle[] = ["n", "w", "s", "e"];
                // 四条边分别匹配上下左右缩放方向。
                for (let index = 0; index < corners.length; index++) {
                    const next = corners[(index + 1) % corners.length];
                    // 线段附近的鼠标位置按边线手柄处理。
                    if (SegmentDistance(client, corners[index], next) <= this.radius) {
                        return { mesh: candidate.mesh, handle: edges[index] };
                    }
                }
                // 边角未命中时才检测实际圆角填充区域。
                if (ContainsWorldPoint(footprint, world)) {
                    return { mesh: candidate.mesh, handle: "body" };
                }
            }
        }
        return null;
    }

    /** @param client 窗口坐标 @example const mesh = tool.pickMesh(client); @returns 角、边或实体命中的矩形。 */
    public pickMesh(client: Vec2): Mesh | null {
        const world = this.camera.windowToWorld(client, this.render);
        return this.pick(client, world)?.mesh ?? null;
    }

    /**
     * 从选中 Mesh 保存变换快照，拖动全程以按下时状态计算以避免累计误差。
     * @param meshes 受当前操作影响的对象
     * @example
     * const snapshots = this.snapshots(this.actives);
     * @returns 每个 Mesh 的位置、角度和比例快照。
     */
    private snapshots(meshes: readonly Mesh[]): MeshSnapshot[] {
        const states: MeshSnapshot[] = [];
        // 按下时冻结各对象变换，拖动不会累积误差。
        for (const mesh of meshes) {
            const matrix = mesh.ensureWorldMatrix().data;
            const localMatrix = mesh.ensureMatrix().data;
            states.push({
                mesh,
                x: mesh.position.x,
                y: mesh.position.y,
                worldX: matrix[6],
                worldY: matrix[7],
                rotation: mesh.rotation,
                scaleX: mesh.scale.x,
                scaleY: mesh.scale.y,
                localMatrix: Array.from(localMatrix),
                worldMatrix: Array.from(matrix),
            });
        }
        return states;
    }

    /**
     * 分发当前鼠标拖动到对应的编辑操作。
     * @param gesture 按下时保存的操作快照
     * @example
     * this.applyGesture(gesture);
     * @returns 无返回值。
     */
    private applyGesture(gesture: EditGesture): void {
        // 移动手势修改位置，并按活动区域裁切。
        if (gesture.mode === "move") {
            this.applyMove(gesture);
        } else if (gesture.mode === "resize") {
            // 尺寸手势只修改当前矩形的几何与中心。
            this.applyResize(gesture);
        } else if (gesture.mode === "rotateRect") {
            // 单体旋转使用对象自身中心，不改变所选集合的其他对象。
            this.applyRectRotation(gesture);
        } else if (gesture.mode === "rotate" || gesture.mode === "scale") {
            // 组操作以选中集合的公共中心为轴。
            this.applyGroupTransform(gesture);
        }
    }

    /**
     * 按世界空间位移移动选中对象，并将联合边界限制在活动区域中。
     * @param gesture 本次移动快照
     * @example
     * this.applyMove(gesture);
     * @returns 无返回值。
     */
    private applyMove(gesture: EditGesture): void {
        return this._motion.applyMove(gesture);
    }

    /**
     * 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。
     * @param gesture 尚未缓存顶点的移动手势
     * @example
     * this.captureMoveSnapVertices(gesture);
     * @returns 无返回值。
     */
    private captureMoveSnapVertices(gesture: EditGesture): void {
        return this._motion.captureMoveSnapVertices(gesture);
    }

    /**
     * 将世界坐标投影吸附到以零为起点的步进网格。
     * @param coordinate 世界坐标或世界轴上的投影值
     * @example
     * const x = this.snapWorldCoordinate(17);
     * @returns 最近的全局网格坐标。
     */
    private snapWorldCoordinate(coordinate: number): number {
        return this._resize.snapWorldCoordinate(coordinate);
    }

    /**
     * 拖动边或角时修改一个 Rect2D 的局部宽高及中心位置。
     * @param gesture 本次尺寸编辑快照
     * @example
     * this.applyResize(gesture);
     * @returns 无返回值。
     */
    private applyResize(gesture: EditGesture): void {
        return this._resize.applyResize(gesture);
    }

    /**
     * 绕单个矩形自身中心旋转完整仿射轴，同时保留父级层次与历史快照。
     * @param gesture 从单体旋转端点开始的手势
     * @example
     * this.applyRectRotation(gesture);
     * @returns 无返回值。
     */
    private applyRectRotation(gesture: EditGesture): void {
        return this._resize.applyRectRotation(gesture);
    }

    /**
     * 在虚线组边界上缩放或在外侧旋转各个 Mesh，不改变它们的父节点。
     * @param gesture 组操作快照
     * @example
     * this.applyGroupTransform(gesture);
     * @returns 无返回值。
     */
    private applyGroupTransform(gesture: EditGesture): void {
        return this._groupTransform.applyGroupTransform(gesture);
    }

    /**
     * 避免缩放一个 Mesh 时意外改变共用同一 Geometry 的其他实例。
     * @param mesh 被调整的矩形
     * @example
     * const geometry = this.uniqueGeometry(mesh);
     * @returns 仅由该 Mesh 使用的 Rect2D。
     */
    private uniqueGeometry(mesh: Mesh): Rect2D {
        const geometry = mesh.data as Rect2D;
        // 检查是否有其他对象复用这份几何数据。
        for (const candidate of this.scene.ensureLists()) {
            // 共享时复制几何，避免误改没有被拖动的对象。
            if (candidate !== mesh && candidate.data === geometry) {
                const clone = new Rect2D({ width: geometry.width, height: geometry.height, radius: geometry.radius, style: geometry.style });
                mesh.data = clone;
                return clone;
            }
        }
        return geometry;
    }

    /**
     * 将浏览器中的水平画框转换成世界矩形，预览、创建和框选使用同一结果。
     * @param gesture 固定的世界创建起点与当前浏览器指针；框选仍采用屏幕起点
     * @param applyLimits 是否应用新建矩形的起点、尺寸和活动区域限制
     * @example
     * const frame = this.drawFrame(gesture, true);
     * @returns 可绘制的世界矩形；尺寸或活动区域无效时为 null。
     */
    private drawFrame(gesture: Pick<EditGesture, "startClient" | "currentClient" | "startWorld" | "creationStartWorld">,
        applyLimits: boolean): DrawFrame | null {
        let start = gesture.startClient;
        let current = gesture.currentClient;
        let startWorld = gesture.startWorld;
        // 新建锚点跟随世界位置重新投影；只有终点按当前相机解释和吸附。
        if (applyLimits) {
            startWorld = gesture.creationStartWorld ?? gesture.startWorld;
            start = this.camera.worldToWindow(startWorld, this.render);
            const currentWorld = this.camera.windowToWorld(current, this.render);
            const endpoint = this.resolveCreationPoint(currentWorld, false);
            current = this.camera.worldToWindow(endpoint, this.render);
        } else {
            // add/sub 框选及自动组包围框维持屏幕对齐的既有语义。
            startWorld = this.camera.windowToWorld(start, this.render);
        }
        const rightWorld = this.camera.windowToWorld(new Vec2(start.x + 1, start.y), this.render).sub(startWorld);
        const downWorld = this.camera.windowToWorld(new Vec2(start.x, start.y + 1), this.render).sub(startWorld);
        const horizontalScale = rightWorld.len();
        const verticalScale = downWorld.len();
        // 不可逆的视口无法把 CSS 像素换成有效的世界尺寸。
        if (Number.isFinite(horizontalScale) && Number.isFinite(verticalScale) &&
            horizontalScale > Number.EPSILON && verticalScale > Number.EPSILON) {
            const centered = this.constrain || (applyLimits && this.origin === "center");
            let originMultiplier = 1;
            // 中心起点的鼠标位移代表半宽和半高。
            if (centered) {
                originMultiplier = 2;
            }
            const horizontalPixels = current.x - start.x;
            const verticalPixels = current.y - start.y;
            const rawWidth = Math.abs(horizontalPixels) * horizontalScale * originMultiplier;
            const rawHeight = Math.abs(verticalPixels) * verticalScale * originMultiplier;
            let width = rawWidth;
            let height = rawHeight;
            let limitScale = 1;
            // 尺寸限制使用实体局部单位，固定尺寸创建需先换成当前世界范围。
            if (applyLimits && this.ignoreZoom) {
                limitScale = 1 / this.camera.zoom;
            }
            const minWidth = this.minWidth * limitScale;
            const maxWidth = this.maxWidth * limitScale;
            const minHeight = this.minHeight * limitScale;
            const maxHeight = this.maxHeight * limitScale;
            const maxArea = this.max * limitScale * limitScale;
            // 选择框完整跟随指针，只有新建矩形需要尺寸和面积限制。
            if (applyLimits) {
                width = Math.max(minWidth, Math.min(maxWidth, rawWidth));
                const areaHeight = maxArea / Math.max(width, Number.EPSILON);
                height = Math.max(minHeight, Math.min(maxHeight, areaHeight, rawHeight));
            }
            let allowedSize = true;
            // 最小尺寸可能超过最大尺寸或面积，此时不能生成矩形。
            if (applyLimits) {
                allowedSize = width <= maxWidth && height <= maxHeight && width * height <= maxArea;
            }
            // 合法尺寸才继续求世界中心，避免给预览或新建对象写入无效几何。
            if (allowedSize) {
                let centerX = start.x;
                let centerY = start.y;
                // 左上角起点模式按拖动方向确定屏幕中心。
                if (!centered) {
                    let horizontalDirection = -1;
                    let verticalDirection = -1;
                    // 鼠标向右时宽度从按下点朝右扩展。
                    if (horizontalPixels > 0) {
                        horizontalDirection = 1;
                    }
                    // 浏览器 Y 轴向下，向下拖动时高度也从按下点向下扩展。
                    if (verticalPixels > 0) {
                        verticalDirection = 1;
                    }
                    centerX += horizontalDirection * width / horizontalScale * 0.5;
                    centerY += verticalDirection * height / verticalScale * 0.5;
                }
                const center = this.camera.windowToWorld(new Vec2(centerX, centerY), this.render);
                const rightX = rightWorld.x / horizontalScale;
                const rightY = rightWorld.y / horizontalScale;
                const upX = -downWorld.x / verticalScale;
                const upY = -downWorld.y / verticalScale;
                const halfX = (Math.abs(rightX) * width + Math.abs(upX) * height) * 0.5;
                const halfY = (Math.abs(rightY) * width + Math.abs(upY) * height) * 0.5;
                const bounds = { left: center.x - halfX, right: center.x + halfX,
                    bottom: center.y - halfY, top: center.y + halfY };
                const frame: DrawFrame = {
                    center,
                    width,
                    height,
                    rotation: Math.atan2(rightY, rightX),
                    bounds,
                    matrix: [rightX, rightY, 0, upX, upY, 0, center.x, center.y, 1],
                };
                // 框选不受活动区域约束；新建框超出边界时按原拖动方向截短。
                if (applyLimits) {
                    return this.clipDrawFrame(frame, startWorld);
                } else {
                    return frame;
                }
            }
        }
        return null;
    }

    /**
     * 在按下或拖动位置选择创建定位，步进与四类吸附按屏幕距离竞争。
     * @param world 原始指针对应的世界坐标
     * @param limitOrigin 是否将起点限制在世界活动区域内
     * @example const origin = this.resolveCreationPoint(world, true);
     * @returns 独立的世界定位点，未开启步进时吸附仍然可用。
     */
    private resolveCreationPoint(world: Vec2, limitOrigin: boolean): Vec2 {
        let point = world.clone();
        // 创建起点在活动区域外时压到边界，不能由吸附再次移出范围。
        if (limitOrigin) {
            point.set(Math.max(this.left, Math.min(this.right, point.x)),
                Math.max(this.bottom, Math.min(this.top, point.y)));
        }
        let stepDistance = Infinity;
        const stepEnabled = this.translationStepEnabled && Number.isFinite(this.translationStep) &&
            this.translationStep > 0;
        // 只有实际开启步进才提供竞争距离；未开启时不能以零距离挡住所有吸附。
        if (stepEnabled) {
            point.set(this.snapWorldCoordinate(point.x), this.snapWorldCoordinate(point.y));
            // 网格对齐后起点仍须满足活动范围。
            if (limitOrigin) {
                point.set(Math.max(this.left, Math.min(this.right, point.x)),
                    Math.max(this.bottom, Math.min(this.top, point.y)));
            }
            const steppedClient = this.camera.worldToWindow(point, this.render);
            const rawClient = this.camera.worldToWindow(world, this.render);
            stepDistance = Math.hypot(steppedClient.x - rawClient.x, steppedClient.y - rawClient.y);
        }
        // 起点只在按下时查询，终点随拖动和相机更新重新查询。
        if (this.snap) {
            const targets = CollectSnapGeometry(this.snapScene, this.snapExcluded, this.camera);
            const candidate = FindPointSnap(world, targets, this.snapOptions,
                this.radius, this.camera, this.render);
            // 采用更近的吸附目标，保持与其他尺寸和移动操作相同的步进优先规则。
            if (candidate !== null && candidate.distance < stepDistance) {
                let allowed = true;
                // 创建的固定起点必须在活动范围内，终点交由尺寸和活动范围裁剪处理。
                if (limitOrigin) {
                    allowed = candidate.point.x >= this.left && candidate.point.x <= this.right &&
                        candidate.point.y >= this.bottom && candidate.point.y <= this.top;
                }
                // 边界外的候选不能覆盖合法的创建起点。
                if (allowed) {
                    point = candidate.point.clone();
                }
            }
        }
        return point;
    }

    /**
     * 沿起点到画框各角的世界线段截取活动区域内最大的合法矩形。
     * @param frame 应用尺寸限制后的候选画框
     * @param origin 画框按下点对应的世界位置
     * @example
     * const clipped = this.clipDrawFrame(frame, origin);
     * @returns 保留拖动方向的合法画框；最小尺寸无法容纳时为 null。
     */
    private clipDrawFrame(frame: DrawFrame, origin: Vec2): DrawFrame | null {
        // 完整位于活动区域时无需改变屏幕尺寸或矩阵。
        if (this.isAllowed(frame.bounds)) {
            return frame;
        }
        let fraction = 1;
        const corners = this.drawFrameCorners(frame);
        // 每个角点从原点出发，最先碰到的世界边界决定整体缩放比例。
        for (const corner of corners) {
            // 向右延伸的角点受右边界限制，向左延伸时由左边界限制。
            if (corner.x > origin.x) {
                fraction = Math.min(fraction, (this.right - origin.x) / (corner.x - origin.x));
            } else if (corner.x < origin.x) {
                // 左向角点与左边界求交，保留最早触及边界的比例。
                fraction = Math.min(fraction, (this.left - origin.x) / (corner.x - origin.x));
            }
            // 世界 Y 轴向上，上下边界分别约束正负方向的角点。
            if (corner.y > origin.y) {
                fraction = Math.min(fraction, (this.top - origin.y) / (corner.y - origin.y));
            } else if (corner.y < origin.y) {
                // 下向角点与下边界求交，不改变已经确定的拖动方向。
                fraction = Math.min(fraction, (this.bottom - origin.y) / (corner.y - origin.y));
            }
        }
        // 略微缩入边界，避免浮点舍入让严格的活动区域比较失败。
        fraction = Math.min(1, Math.max(0, fraction * (1 - 1e-9)));
        const width = frame.width * fraction;
        const height = frame.height * fraction;
        let sizeScale = 1;
        // 截到世界活动边界后，仍按新实体的局部尺寸检查最小宽高。
        if (this.ignoreZoom) {
            sizeScale = this.camera.zoom;
        }
        // 最大合法画框仍小于最小尺寸时不生成不符合约束的对象。
        if (fraction > 0 && width * sizeScale >= this.minWidth && height * sizeScale >= this.minHeight) {
            const center = new Vec2(
                origin.x + (frame.center.x - origin.x) * fraction,
                origin.y + (frame.center.y - origin.y) * fraction,
            );
            const bounds = {
                left: origin.x + (frame.bounds.left - origin.x) * fraction,
                right: origin.x + (frame.bounds.right - origin.x) * fraction,
                bottom: origin.y + (frame.bounds.bottom - origin.y) * fraction,
                top: origin.y + (frame.bounds.top - origin.y) * fraction,
            };
            // 使用候选画框相同的两个世界轴，只调整平移与几何尺寸。
            return {
                center,
                width,
                height,
                rotation: frame.rotation,
                bounds,
                matrix: [frame.matrix[0], frame.matrix[1], 0, frame.matrix[3], frame.matrix[4], 0,
                    center.x, center.y, 1],
            };
        } else {
            return null;
        }
    }

    /**
     * 把同一屏幕画框变换写到预览、选择或新建的 Mesh。
     * @param mesh 接收变换的矩形
     * @param frame 已完成屏幕到世界转换的画框
     * @example
     * this.applyDrawFrame(mesh, frame);
     * @returns 无返回值。
     */
    private applyDrawFrame(mesh: Mesh, frame: DrawFrame): void {
        mesh.position.set(frame.center.x, frame.center.y);
        mesh.rotation = frame.rotation;
        // 使用完整仿射基向量，避免相机有父级变换或非等比缩放时预览和命中分离。
        mesh.matrix.set(frame.matrix);
    }

    /**
     * 创建有效面积的新矩形并加入场景。
     * @param gesture 新建手势
     * @example
     * this.finishCreate(gesture);
     * @returns 无返回值。
     */
    private finishCreate(gesture: EditGesture): void {
        const frame = this.drawFrame(gesture, true);
        // 点击或零面积拖动不创建无效 Mesh。
        if (frame !== null && frame.width > 0 && frame.height > 0) {
            const style = this.style.clone();
            let sizeScale = 1;
            // 固定屏幕尺寸的局部宽高记录像素尺寸，抵消渲染补偿后仍与拖框一致。
            if (this.ignoreZoom) {
                sizeScale = this.camera.zoom;
            }
            const geometry = new Rect2D({ width: frame.width * sizeScale, height: frame.height * sizeScale, radius: 0, style });
            const material = CloneMaterial(this.material, style);
            const mesh = new Mesh(geometry, material, style);
            mesh.order = this.order;
            mesh.ignoreZoom = this.ignoreZoom;
            this.applyDrawFrame(mesh, frame);
            this.push(mesh);
            // 多选打开时新矩形加入当前集合，关闭时替换当前选择。
            if (this.mult) {
                this.select([mesh], "add");
            } else {
                this.select([mesh]);
            }
        }
    }

    /**
     * 完成单击或屏幕矩形框选，add/sub 模式只改变集合不修改模型。
     * @param gesture 本次选择手势
     * @param client 松开位置的浏览器坐标
     * @example
     * this.finishSelection(gesture, client);
     * @returns 无返回值。
     */
    private finishSelection(gesture: EditGesture, client: Vec2): void {
        let hits: Mesh[] = [];
        // 有明显拖动时使用矩形范围选择。
        if (gesture.moved && this.switches.marquee) {
            const frameData = this.drawFrame(gesture, false);
            // 框选范围必须有正面积才交给选择器。
            if (frameData !== null && frameData.width > 0 && frameData.height > 0) {
                const frame = new Mesh(new Rect2D({ width: frameData.width, height: frameData.height }), new BaseMaterial());
                this.applyDrawFrame(frame, frameData);
                hits = this.selector.Selector(frame);
                frame.dispose();
            }
        } else if (!gesture.moved && this.switches.pick) {
            // 点击选择由独立开关控制，拖框关闭时不会退化成点选。
            const hit = this.pick(client, gesture.currentWorld);
            // 单击空白处没有命中对象，交由集合操作处理。
            if (hit !== null) {
                hits = [hit.mesh];
            }
        }
        // 关闭相应选择入口时保留原选择集，不让空结果意外清空。
        if ((gesture.moved && this.switches.marquee) || (!gesture.moved && this.switches.pick)) {
            // 增选模式只追加命中对象。
            if (this._activeType === "add") {
                this.select(hits, "add");
            } else if (this._activeType === "sub") {
                // 减选模式只移除命中对象。
                this.select(hits, "sub");
            } else if (this.mult) {
                // 多选模式让框选和点选都累积到当前选择集。
                this.select(hits, "add");
            } else {
                this.select(hits);
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
    private resizedWorldBounds(matrix: ArrayLike<number>, centerX: number, centerY: number, width: number, height: number): RectBounds {
        return this._resize.resizedWorldBounds(matrix, centerX, centerY, width, height);
    }

    /**
     * 检查候选对象是否完全在世界活动区域内。
     * @param bounds 世界轴向包围盒
     * @example
     * const allowed = this.isAllowed(bounds);
     * @returns 是否位于限制范围内。
     */
    private isAllowed(bounds: RectBounds): boolean {
        return this._resize.isAllowed(bounds);
    }

    /**
     * 根据组模式或命中边角刷新鼠标形状。
     * @param client 当前鼠标位置
     * @example
     * this.updateCursor(client);
     * @returns 无返回值。
     */
    private updateCursor(client: Vec2): void {
        // 集合模式只提供计算结果，不抢合并编辑器的画布光标。
        if (!this.fromCollection) {
            this.render.canvas.style.cursor = this.cursorAt(client);
        }
    }

    /** @param client 窗口坐标 @example const css = tool.cursorAt(client); @returns 当前边角、旋转或移动的 CSS 光标。 */
    public cursorAt(client: Vec2): string {
        const world = this.camera.windowToWorld(client, this.render);
        const groupFrame = this._groupFrameCorners;
        const groupMode = this.isGroupMode();
        let cursorUrl = plusCursorUrl;
        let fallback = "crosshair";
        // 查看状态始终显示手形，不提示任何编辑手柄。
        if (this._activeType === "view") {
            // 按住时显示握拳，悬停时显示张开的手。
            if (this._viewPointerId !== null) {
                cursorUrl = handGrabbingCursorUrl;
                fallback = "grabbing";
            } else {
                cursorUrl = handCursorUrl;
                fallback = "grab";
            }
        }
        // 组模式的光标与按下时的边缘、内部、外部命中规则一致。
        if (groupMode && groupFrame !== null) {
            const action = this.groupAction(client, world);
            // 框外显示旋转图标。
            if (action?.mode === "rotate") {
                cursorUrl = rotateCursorUrl;
                fallback = "context-menu";
            } else if (action?.mode === "scale") {
                // 使用组框的显示轴求屏幕法线，旋转和镜像后仍对应实际边角。
                if (this._groupFrame instanceof Mesh) {
                    return FrameResizeCursor(this._groupFrame.getRenderMatrix(this.camera).data,
                        action.handle, this.camera, this.render);
                } else {
                    return "default";
                }
            } else if (action?.mode === "move") {
                // 框内使用移动图标。
                cursorUrl = moveCursorUrl;
                fallback = "move";
            } else {
                // 组动作被关闭时不提示可用的变换。
                return "default";
            }
        } else if (this._activeType === "edit") {
            // 编辑模式优先显示唯一选中对象的旋转端点状态。
            const rotationTarget = this.pickRotationHandle(client);
            // 单体旋转端点比普通矩形角边更靠上。
            if (rotationTarget !== null) {
                cursorUrl = rotateCursorUrl;
                fallback = "context-menu";
            } else {
                // 普通编辑光标跟随最上层矩形的命中手柄。
                const hit = this.pick(client, world);
                // activeOnly 需要先选中对象，因此未选中时不提示编辑手柄。
                if (hit !== null && (!this.activeOnly || this.actives.includes(hit.mesh))) {
                    // 填充区域表示拖动整个对象。
                    if (hit.handle === "body" && this.switches.move) {
                        cursorUrl = moveCursorUrl;
                        fallback = "move";
                    } else if (this.switches.resize && hit.handle !== "body") {
                        // 先投影真实切线再取法线，兼容父级非等比缩放和相机倾斜。
                        return FrameResizeCursor(hit.mesh.getRenderMatrix(this.camera).data,
                            hit.handle, this.camera, this.render);
                    }
                }
            }
        }
        // 关闭新建后，空白区域不再显示暗示可画框的加号。
        if (!this.switches.create && cursorUrl === plusCursorUrl) {
            return "default";
        }
        return `url("${cursorUrl}") 16 16, ${fallback}`;
    }

    /** @example this.createRectMotionHooks(); @returns 连接 motion 状态的实时接口，不复制编辑对象。 */
    private createRectMotionHooks(): RectMotionHooks {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Hooks 对象访问器有独立的 this，必须保留主编辑器引用。
        const owner = this;
        return {
            snapWorldCoordinate: this.snapWorldCoordinate.bind(this),
            /** @example hooks.groupFrame; @returns 主编辑器的实时 groupFrame 状态。 */
            get groupFrame(): Mesh | null {
                return owner._groupFrame;
            },
            /** @param value 更新后的 groupFrame 状态 @example hooks.groupFrame = value; @returns 无返回值，写回主编辑器。 */
            set groupFrame(value: Mesh | null) {
                owner._groupFrame = value;
            },
            /** @example hooks.groupFrameCorners; @returns 主编辑器的实时 groupFrameCorners 状态。 */
            get groupFrameCorners(): Vec2[] | null {
                return owner._groupFrameCorners;
            },
            /** @param value 更新后的 groupFrameCorners 状态 @example hooks.groupFrameCorners = value; @returns 无返回值，写回主编辑器。 */
            set groupFrameCorners(value: Vec2[] | null) {
                owner._groupFrameCorners = value;
            },
            /** @example hooks.groupFrameCustomized; @returns 主编辑器的实时 groupFrameCustomized 状态。 */
            get groupFrameCustomized(): boolean {
                return owner._groupFrameCustomized;
            },
            /** @param value 更新后的 groupFrameCustomized 状态 @example hooks.groupFrameCustomized = value; @returns 无返回值，写回主编辑器。 */
            set groupFrameCustomized(value: boolean) {
                owner._groupFrameCustomized = value;
            },
            emitCallbacks: this.emitCallbacks.bind(this),
            onMove: this._onMove,
            onPositionChange: this._onPositionChange,
            onEdit: this._onEdit,
        };
    }


    /** @example this.createRectResizeHooks(); @returns 连接 resize 状态的实时接口，不复制编辑对象。 */
    private createRectResizeHooks(): RectResizeHooks {
        return {
            captureMoveSnapVertices: this.captureMoveSnapVertices.bind(this),
            uniqueGeometry: this.uniqueGeometry.bind(this),
            emitCallbacks: this.emitCallbacks.bind(this),
            onResize: this._onResize,
            onPositionChange: this._onPositionChange,
            onEdit: this._onEdit,
            onRotate: this._onRotate,
        };
    }


    /** @example this.createRectGroupTransformHooks(); @returns 连接 groupTransform 状态的实时接口，不复制编辑对象。 */
    private createRectGroupTransformHooks(): RectGroupTransformHooks {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- Hooks 对象访问器有独立的 this，必须保留主编辑器引用。
        const owner = this;
        return {
            snapWorldCoordinate: this.snapWorldCoordinate.bind(this),
            captureMoveSnapVertices: this.captureMoveSnapVertices.bind(this),
            resizedWorldBounds: this.resizedWorldBounds.bind(this),
            isAllowed: this.isAllowed.bind(this),
            /** @example hooks.groupFrame; @returns 主编辑器的实时 groupFrame 状态。 */
            get groupFrame(): Mesh | null {
                return owner._groupFrame;
            },
            /** @param value 更新后的 groupFrame 状态 @example hooks.groupFrame = value; @returns 无返回值，写回主编辑器。 */
            set groupFrame(value: Mesh | null) {
                owner._groupFrame = value;
            },
            /** @example hooks.groupFrameCorners; @returns 主编辑器的实时 groupFrameCorners 状态。 */
            get groupFrameCorners(): Vec2[] | null {
                return owner._groupFrameCorners;
            },
            /** @param value 更新后的 groupFrameCorners 状态 @example hooks.groupFrameCorners = value; @returns 无返回值，写回主编辑器。 */
            set groupFrameCorners(value: Vec2[] | null) {
                owner._groupFrameCorners = value;
            },
            /** @example hooks.groupFrameCustomized; @returns 主编辑器的实时 groupFrameCustomized 状态。 */
            get groupFrameCustomized(): boolean {
                return owner._groupFrameCustomized;
            },
            /** @param value 更新后的 groupFrameCustomized 状态 @example hooks.groupFrameCustomized = value; @returns 无返回值，写回主编辑器。 */
            set groupFrameCustomized(value: boolean) {
                owner._groupFrameCustomized = value;
            },
            emitCallbacks: this.emitCallbacks.bind(this),
            onRotate: this._onRotate,
            onScale: this._onScale,
            onPositionChange: this._onPositionChange,
            onEdit: this._onEdit,
        };
    }
}

export default RectEditTool;
export type { RectEditStyleData } from "./data";
export { default as RectEditToolKey } from "./key";
export type { RectEditDocument, RectEditMode, RectEditOrigin, RectEditRecord, RectHandle, SelectionOperation };
