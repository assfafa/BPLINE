import type { NGonUVMode } from "bpmatrixjs/Geometry/NGon";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../Camera";
import type Color from "../Color";
import Base2D from "../Geometry/Base2D";
import NGon2D from "../Geometry/NGon2D";
import Poly2D from "../Geometry/Poly2D";
import Rect2D from "../Geometry/Rect2D";
import Group from "../Group";
import HelperGrid from "../Helper/HelperGrid";
import IMesh from "../IMesh";
import Mesh from "../Mesh";
import type Render from "../Render";
import type Scene from "../Scene";
import Select from "../Select";
import Style from "../Style";
import Text from "../Text";
import type { Geometry2d, Material2d } from "../global-types";
import BaseChange from "./Collection/BaseChange";
import BaseEditTool from "./Collection/BaseEditTool";
import EditorGroup from "./Collection/EditorGroup";
import GroupTransform from "./Collection/GroupTransform";
import Hierarchy, { Reparent } from "./Collection/Hierarchy";
import EditHistory from "./Collection/History";
import type { MoveOptions } from "./Collection/Move";
import CollectionMove from "./Collection/Move";
import EditorOrder from "./Collection/Order";
import type { EditorDocument, EditorLoadOptions } from "./Collection/document";
import EditorDocumentStore from "./Collection/document";
import type { EditSwitches } from "./EditSwitches";
import { CreateEditSwitches } from "./EditSwitches";
import NGonEditTool from "./NGonEditTool";
import {
    CreateGroupFrame, CreateSelectionFrame, IsCanvasPoint, UpdateGroupFrameScreen,
    UpdateSelectionFrame,
} from "./NGonEditTool/geometry";
import PolyEditTool from "./PolyEditTool";
import RectEditTool from "./RectEditTool";
import type { SnapOptions } from "./Snap";
import { CreateSnapOptions } from "./Snap";
import TextEditTool from "./TextEditTool";
import { FrameResizeCursor } from "./cursors";
import handCursorUrl from "./cursors/hand.svg?url";
import moveCursorUrl from "./cursors/move.svg?url";
import plusCursorUrl from "./cursors/plus.svg?url";
import rotateCursorUrl from "./cursors/rotate.svg?url";

/** 合并 Rect、NGon、Poly 与被动 Base 编辑的唯一选择和输入入口。 */
class Editor {
    /** 受编辑的场景。 */
    public readonly scene: Scene;
    /** 提供 Canvas 和尺寸的渲染器。 */
    public readonly render: Render;
    /** 屏幕与世界换算使用的相机。 */
    public readonly camera: Camera;
    /** 所有形状共用的点选和框选入口。 */
    public readonly selector: Select;
    /** 单独的矩形工具；不注册自己的全局输入。 */
    public readonly rectEditTool: RectEditTool;
    /** 单独的正多边形工具；不注册自己的全局输入。 */
    public readonly ngonEditTool: NGonEditTool;
    /** 单独的多边形工具；不注册自己的全局输入。 */
    public readonly polyEditTool: PolyEditTool;
    /** 无独立事件的文字编辑工具。 */
    public readonly textEditTool: TextEditTool;
    /** 合并编辑器专用的 Base2D 轮廓工具。 */
    public readonly baseEditTool: BaseEditTool;
    /** 唯一的编辑背景网格。 */
    public readonly helperGrid: HelperGrid;
    /** 混合类型组框所属覆盖层。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 当前所有已选择的普通 Mesh。 */
    public actives: Mesh[] = [];
    /** 最近加入选择的对象。 */
    public active: Mesh[] = [];
    /** 三类图形共用的吸附候选开关。 */
    public readonly snapOptions: SnapOptions = CreateSnapOptions();
    /** 真实 Group 节点的创建、变换与拖动层级入口。 */
    public readonly hierarchy: Hierarchy;
    /** 所有编辑工具共用的指针交互开关，默认全部开启。 */
    public readonly switches: EditSwitches = CreateEditSwitches();
    /** 是否把选中实体临时提升到 orderMax + 1，默认开启。 */
    private _raiseSelected: boolean = true;
    private readonly _orders: EditorOrder = new EditorOrder();

    private _activeType: EditorMode = "edit";
    private _shape: EditorShape = "rect";
    private _rect: boolean = true;
    private _ngon: boolean = true;
    private _poly: boolean = true;
    private _text: boolean = true;
    private readonly _history: EditHistory = new EditHistory(this);
    private readonly _document: EditorDocumentStore = new EditorDocumentStore(this);
    private _clipboard: Mesh[] = [];
    private _lastClient: Vec2 | null = null;
    private _clipboardClient: Vec2 | null = null;
    private _group: boolean = true;
    private _mult: boolean = true;
    private _syncing: boolean = false;
    private _pointerOwner: PointerOwner | null = null;
    private _selectionGesture: SelectionGesture | null = null;
    private _selectionFrame: Mesh | null = null;
    private _creationParent: Group | null = null;
    private _editMoveStart: Vec2 | null = null;
    private _editMovePointerId: number | null = null;
    private readonly _touchPointers = new Set<number>();
    private _destroyed: boolean = false;
    private readonly _groupTransform: GroupTransform;
    private readonly _collectionMove: CollectionMove;
    private readonly _events: AbortController = new AbortController();
    private readonly _onSelectionChange = new Map<string, (actives: Mesh[]) => void>();
    private readonly _onModeChange = new Map<string, (mode: EditorMode) => void>();
    private readonly _onSave = new Map<string, (document: EditorDocument) => void>();
    private readonly _onBase = new Map<string, (mesh: Mesh) => void>();

    /**
     * 创建共用选择器和一个网格，分别构建无自动事件的形状编辑器。
     * @param scene 场景
     * @param render 渲染器
     * @param camera 相机
     * @param options 新建正多边形的 UV 配置
     * @example const editor = new Editor(scene, render, camera);
     * @returns 合并编辑器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera, options: EditorOptions = {}) {
        this.scene = scene;
        // 默认仅绘制视口范围内的物体；调用方的四叉树模式保持有效。
        if (scene.box === null && scene.quad === null) {
            scene.box = camera;
        }
        this.render = render;
        this.camera = camera;
        this.selector = new Select(scene, render, camera);
        this.rectEditTool = RectEditTool.build(scene, render, camera);
        this.ngonEditTool = NGonEditTool.build(scene, render, camera, options.ngonUVMode);
        this.polyEditTool = PolyEditTool.build(scene, render, camera);
        this.textEditTool = TextEditTool.build(scene, render, camera, this._history);
        // 三个绘制工具从同一材质与样式模板起步，集合入口可统一调整。
        this.material = this.rectEditTool.material;
        this.baseEditTool = new BaseEditTool(scene, render, camera);
        this.hierarchy = new Hierarchy(scene, render, camera, this.selector);
        this.rectEditTool.switches = this.switches;
        this.ngonEditTool.switches = this.switches;
        this.polyEditTool.switches = this.switches;
        this.textEditTool.switches = this.switches;
        this.baseEditTool.switches = this.switches;
        this.hierarchy.switches = this.switches;
        this.hierarchy.nest = options.nest ?? false;
        this.helperGrid = new HelperGrid(scene, render, camera);
        scene.add(this.frameGroup);
        this.rectEditTool.snapOptions = this.snapOptions;
        this.ngonEditTool.snapOptions = this.snapOptions;
        this.polyEditTool.snapOptions = this.snapOptions;
        this.textEditTool.snapOptions = this.snapOptions;
        this._groupTransform = new GroupTransform(this.frameGroup, render, camera,
            this.reassignConverted.bind(this), this.notifyEdit.bind(this));
        this._collectionMove = new CollectionMove(scene, render, camera, this.notifyCollectionMove.bind(this));
        this.rectEditTool.setOrderSource(this.sourceOrder.bind(this));
        this.ngonEditTool.setOrderSource(this.sourceOrder.bind(this));
        this.polyEditTool.setOrderSource(this.sourceOrder.bind(this));
        this.textEditTool.setOrderSource(this.sourceOrder.bind(this));
        this.rectEditTool.setBaseDelegate(this.convertToBase.bind(this));
        this.ngonEditTool.setBaseDelegate(this.convertToBase.bind(this));
        this.polyEditTool.setBaseDelegate(this.convertToBase.bind(this));
        this.textEditTool.setBaseDelegate(this.convertToBase.bind(this));
        this.rectEditTool.onSelectionChange("Editor", this.syncFromTools.bind(this));
        this.ngonEditTool.onSelectionChange("Editor", this.syncFromTools.bind(this));
        this.polyEditTool.onSelectionChange("Editor", this.syncFromTools.bind(this));
        this.textEditTool.onSelectionChange("Editor", this.syncFromTools.bind(this));
        this.textEditTool.onEdit("Editor", this.notifyEdit.bind(this));
        this.baseEditTool.onSelectionChange(this.syncFromTools.bind(this));
        this.baseEditTool.onEdit(this.notifyEdit.bind(this));
        this.rectEditTool.onAdd("EditorHierarchy", this.attachCreatedMesh.bind(this));
        this.ngonEditTool.onAdd("EditorHierarchy", this.attachCreatedMesh.bind(this));
        this.polyEditTool.onAdd("EditorHierarchy", this.attachCreatedMesh.bind(this));
        this.textEditTool.onAdd("EditorHierarchy", this.attachCreatedMesh.bind(this));
        this.textEditTool.onSave("Editor", this.save.bind(this));
        // 接管已有实体时采用编辑器默认自动精度，辅助框和实例批次保持原配置。
        for (const mesh of scene.ensureLists()) {
            // 只初始化允许编辑的普通实体，不修改用户的层级关系。
            if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && this.isMeshEnabled(mesh)) {
                mesh.autoPrecision = this.autoPrecision;
            }
        }
        const signal = this._events.signal;
        render.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { signal });
        render.canvas.addEventListener("contextmenu", this.handleContextMenu.bind(this), { signal });
        window.addEventListener("pointermove", this.handlePointerMove.bind(this), { signal });
        window.addEventListener("pointerup", this.handlePointerUp.bind(this), { signal });
        window.addEventListener("pointercancel", this.handlePointerCancel.bind(this), { signal });
        window.addEventListener("blur", this.handleWindowBlur.bind(this), { signal });
        this.refreshOrders();
    }

    /** @example const order = editor.order; @returns 四种形状下次绘制共用的层级，默认 0。 */
    public get order(): number {
        return this.rectEditTool.order;
    }

    /** @param value 下次绘制的层级 @example editor.order = 3; @returns 无返回值，同步四个形状编辑器。 */
    public set order(value: number) {
        this.rectEditTool.order = value;
        this.ngonEditTool.order = value;
        this.polyEditTool.order = value;
        this.textEditTool.order = value;
    }

    /** @example const max = editor.orderMax; @returns 用户实体最大原始层级；不包含辅助对象或临时选中提升，没有实体时为 0。 */
    public get orderMax(): number {
        this.refreshOrders();
        return this._orders.max;
    }

    /** @example const enabled = editor.raiseSelected; @returns 是否临时提升选中实体，默认开启。 */
    public get raiseSelected(): boolean {
        return this._raiseSelected;
    }

    /** @param value 是否临时提升选择 @example editor.raiseSelected = false; @returns 无返回值，关闭后立即恢复原始层级。 */
    public set raiseSelected(value: boolean) {
        this._raiseSelected = value;
        this.refreshOrders();
    }

    /** @internal @param node 用户节点 @example const order = editor.sourceOrder(mesh); @returns 未叠加选中提升的原始层级，供保存、历史和复制读取。 */
    public sourceOrder(node: Group): number {
        return this._orders.sourceOrder(node);
    }

    /** @example this.refreshOrders(); @returns 无返回值，同步代码导入、手绘、加载和直接改动后的文档层级。 */
    private refreshOrders(): void {
        this._orders.sync(this.documentNodes(), this.actives, this._raiseSelected);
    }

    /** @example const style = editor.style; @returns 三种形状下次绘制共用的样式模板。 */
    public get style(): Style {
        return this.rectEditTool.style;
    }

    /** @param value 三种形状下次绘制的样式模板 @example editor.style = new Style(); @returns 无返回值。 */
    public set style(value: Style) {
        this.rectEditTool.style = value;
        this.ngonEditTool.style = value;
        this.polyEditTool.style = value;
        this.textEditTool.style = value;
    }

    /** @example const material = editor.material; @returns 三种形状下次绘制共用的材质模板。 */
    public get material(): Material2d {
        return this.rectEditTool.material;
    }

    /** @param value 三种形状下次绘制的材质模板 @example editor.material = new BaseMaterial(); @returns 无返回值。 */
    public set material(value: Material2d) {
        this.rectEditTool.material = value;
        this.ngonEditTool.material = value;
        this.polyEditTool.material = value;
        this.textEditTool.material = value;
    }

    /** @example const fixed = editor.ignoreZoom; @returns 下次新建实体或层级组框的屏幕尺寸开关，默认关闭。 */
    public get ignoreZoom(): boolean {
        return this.rectEditTool.ignoreZoom;
    }

    /** @param value 下次新建实体或层级组框是否抵消相机 zoom @example editor.ignoreZoom = true; @returns 无返回值。 */
    public set ignoreZoom(value: boolean) {
        this.rectEditTool.ignoreZoom = value;
        this.ngonEditTool.ignoreZoom = value;
        this.polyEditTool.ignoreZoom = value;
        this.textEditTool.ignoreZoom = value;
        this.hierarchy.ignoreZoom = value;
    }

    /** @example const adaptive = editor.autoPrecision; @returns 新建及 push 实体的自动精度开关，默认开启。 */
    public get autoPrecision(): boolean {
        return this.rectEditTool.autoPrecision;
    }

    /** @param value 后续新建及 push 实体是否自动细分 @example editor.autoPrecision = false; @returns 无返回值，同步四个子编辑器，已有 Mesh 保留独立开关。 */
    public set autoPrecision(value: boolean) {
        this.rectEditTool.autoPrecision = value;
        this.ngonEditTool.autoPrecision = value;
        this.polyEditTool.autoPrecision = value;
        this.textEditTool.autoPrecision = value;
    }

    /** @example const mode = editor.activeType; @returns 当前模式。 */
    public get activeType(): EditorMode {
        return this._activeType;
    }

    /** @param value 查看、编辑、增选、减选或组合变换模式 @example editor.activeType = "group"; @returns 无返回值。 */
    public set activeType(value: EditorMode) {
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this._activeType !== value) {
            this.cancel();
            this._activeType = value;
            this.syncToolModes();
            this.syncToolSelection();
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (value === "group") {
                this._groupTransform.setSelection(this.actives);
            } else {
                this._groupTransform.setSelection([]);
            }
            // 相机控制器等外围组件只需要订阅一次集合模式变化。
            for (const callback of this._onModeChange.values()) {
                callback(value);
            }
        }
    }

    /** @example const enabled = editor.mult; @returns 是否保留多个对象。 */
    public get mult(): boolean {
        return this._mult;
    }

    /** @param value 多选开关 @example editor.mult = false; @returns 无返回值。 */
    public set mult(value: boolean) {
        this._mult = value;
        this.rectEditTool.mult = value;
        this.ngonEditTool.mult = value;
        this.polyEditTool.mult = value;
        this.textEditTool.mult = value;
        // 切为单选时统一收敛跨几何选择，子工具也各自保留最后一个成员。
        if (!value && this.actives.length > 1) {
            this.setSelection(this.actives.slice(-1));
        }
    }

    /** @example const enabled = editor.snap; @returns 三类图形共用的吸附总开关。 */
    public get snap(): boolean {
        return this.rectEditTool.snap;
    }

    /** @param value 吸附总开关 @example editor.snap = true; @returns 无返回值。 */
    public set snap(value: boolean) {
        this.rectEditTool.snap = value;
        this.ngonEditTool.snap = value;
        this.polyEditTool.snap = value;
        this.textEditTool.snap = value;
    }

    /** @example const shape = editor.shape; @returns 空白处新建的几何类型。 */
    public get shape(): EditorShape {
        return this._shape;
    }

    /** @param value 空白处新建的几何类型 @example editor.shape = "ngon"; @returns 无返回值。 */
    public set shape(value: EditorShape) {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (this.isEnabled(value)) {
            this._shape = value;
        } else {
            console.warn(`Editor: ${value} is disabled.`);
        }
    }

    /** @example const enabled = editor.rect; @returns 矩形是否参与合并编辑。 */
    public get rect(): boolean {
        return this._rect;
    }
    /** @param value 矩形编辑开关 @example editor.rect = false; @returns 无返回值。 */
    public set rect(value: boolean) {
        this._rect = value;
        this.refreshEnabled();
    }
    /** @example const enabled = editor.ngon; @returns 正多边形是否参与合并编辑。 */
    public get ngon(): boolean {
        return this._ngon;
    }
    /** @param value 正多边形编辑开关 @example editor.ngon = false; @returns 无返回值。 */
    public set ngon(value: boolean) {
        this._ngon = value;
        this.refreshEnabled();
    }
    /** @example const enabled = editor.poly; @returns 多边形是否参与合并编辑。 */
    public get poly(): boolean {
        return this._poly;
    }
    /** @param value 多边形编辑开关 @example editor.poly = false; @returns 无返回值。 */
    public set poly(value: boolean) {
        this._poly = value;
        this.refreshEnabled();
    }

    /** @example const enabled = editor.text; @returns 文字是否参与合并编辑。 */
    public get text(): boolean {
        return this._text;
    }
    /** @param value 文字编辑开关 @example editor.text = false; @returns 无返回值。 */
    public set text(value: boolean) {
        this._text = value;
        this.refreshEnabled();
    }

    /** @example const enabled = editor.group; @returns 是否允许创建与操作真实层级组。 */
    public get group(): boolean {
        return this._group;
    }
    /** @param value 层级组开关 @example editor.group = false; @returns 无返回值。 */
    public set group(value: boolean) {
        this._group = value;
        // 关闭层级组入口时，当前拖放预览也应立即消失。
        if (!value) {
            this.hierarchy.clearDropPreview();
        }
        this.refreshEnabled();
    }

    /** @example const enabled = editor.nest; @returns 普通图形是否可以互相嵌套。 */
    public get nest(): boolean {
        return this.hierarchy.nest;
    }

    /** @param value 是否允许 Rect、NGon、Poly 和 Base 作为父容器 @example editor.nest = true; @returns 无返回值。 */
    public set nest(value: boolean) {
        this.hierarchy.nest = value;
        // 关闭嵌套后不保留正在悬停的旧目标边框。
        if (!value) {
            this.hierarchy.clearDropPreview();
        }
    }

    /** @example editor.dropTargetColor.setHex("#238aff"); @returns 拖入目标边框的可编辑颜色。 */
    public get dropTargetColor(): Color {
        return this.hierarchy.dropTargetColor;
    }

    /** @example const group = editor.activeGroup; @returns 最近选择的真实 Group 节点。 */
    public get activeGroup(): EditorGroup | null {
        return this.hierarchy.activeGroup;
    }

    /**
     * 为合并编辑器订阅跨类型选择变更。
     * @param key 订阅键
     * @param callback 当前完整选择集
     * @example editor.onSelectionChange("ui", (meshes) => updateUI(meshes));
     * @returns 无返回值。
     */
    public onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onSelectionChange.set(key, callback);
    }

    /** @param key 订阅键 @example editor.onSelectionChangeDelete("ui"); @returns 是否删除订阅。 */
    public onSelectionChangeDelete(key: string): boolean {
        return this._onSelectionChange.delete(key);
    }

    /** @param key 订阅键 @param callback 模式接收函数 @example editor.onModeChange("keys", callback); @returns 无返回值。 */
    public onModeChange(key: string, callback: (mode: EditorMode) => void): void {
        this._onModeChange.set(key, callback);
    }

    /** @param key 订阅键 @example editor.onModeChangeDelete("keys"); @returns 是否删除订阅。 */
    public onModeChangeDelete(key: string): boolean {
        return this._onModeChange.delete(key);
    }

    /** @param key 订阅键 @param callback 完整 JSON 文档接收函数 @example editor.onSave("app", (data) => consume(data)); @returns 无返回值。 */
    public onSave(key: string, callback: (document: EditorDocument) => void): void {
        this._onSave.set(key, callback);
    }

    /** @param key 订阅键 @example editor.onSaveDelete("app"); @returns 是否删除订阅。 */
    public onSaveDelete(key: string): boolean {
        return this._onSave.delete(key);
    }

    /** @param key 订阅键 @param callback 接收主动或异形降级完成的 Mesh @example editor.onBase("ui", (mesh) => inspect(mesh)); @returns 无返回值。 */
    public onBase(key: string, callback: (mesh: Mesh) => void): void {
        this._onBase.set(key, callback);
    }

    /** @param key 订阅键 @example editor.onBaseDelete("ui"); @returns 是否删除订阅。 */
    public onBaseDelete(key: string): boolean {
        return this._onBase.delete(key);
    }

    /**
     * 主动降级当前选择并交由 Base 工具编辑，保持 Mesh 身份、层级和选择。
     * @example const meshes = editor.toBase();
     * @returns 本批实际降级的对象；已是 Base 的对象被跳过，整批转换可撤销。
     */
    public toBase(): Mesh[] {
        return this.convertToBase([...this.actives]);
    }

    /** @example const data = editor.save(); @returns 完整的纯 JSON 文档，并触发 onSave；不下载文件或退出文字输入。 */
    public save(): EditorDocument {
        const document = this._document.capture();
        // 应用自行决定保存去向，编辑器仅交付可序列化数据。
        for (const callback of this._onSave.values()) {
            callback(document);
        }
        return document;
    }

    /**
     * 替换集合文档，可用一次 undo 恢复；校验和构建失败保留旧场景。
     * @param document save 返回的对象或 JSON 字符串
     * @param options 无 URL 纹理等外部资源映射，字体需先通过 Font 注册
     * @example const meshes = editor.load(JSON.stringify(data));
     * @returns 新建的所有 Mesh；Group 和原编号映射可从 loadedNodes 读取。
     */
    public load(document: EditorDocument | string, options: EditorLoadOptions = {}): Mesh[] {
        const prepared = this._document.prepare(document, options);
        // 先确认当前文档也属于可替换范围，不在清除旧节点之后才发现实例等不支持的数据。
        this._document.nodes(true);
        this.textEditTool.finishEditing();
        this._history.commit();
        this.cancel();
        /** @example Apply(); @returns 本次新建的 Mesh，整份替换只记录一笔历史。 */
        const Apply = (): Mesh[] => {
            this.select([]);
            this.hierarchy.activeGroup = null;
            const meshes = this._document.apply(prepared);
            const selected: Mesh[] = [];
            // 原文档编号映射到本次新分配的身份，不改写运行期 ID。
            for (const id of prepared.document.selection) {
                const node = prepared.nodes.get(id);
                // 节点类型已预校验，选择仅包含实体。
                if (node instanceof Mesh) {
                    selected.push(node);
                }
            }
            this.select(selected);
            const group = prepared.nodes.get(prepared.document.activeGroup ?? -1);
            // 空层级组的选择状态独立于 actives，必须单独恢复。
            if (group instanceof EditorGroup) {
                this.hierarchy.activeGroup = group;
            }
            this.update();
            return meshes;
        };
        return this._history.batch(Apply);
    }

    /** @example const node = editor.loadedNodes.get(savedId); @returns 上一次成功加载的保存编号到新节点映射。 */
    public get loadedNodes(): ReadonlyMap<number, Group> {
        return this._document.loadedNodes;
    }

    /** @example const nodes = editor.documentNodes(); @returns 属于文档的实体和空组，排除内部容器与辅助覆盖层。 */
    public documentNodes(): Group[] {
        return this._document.nodes();
    }

    /** @example const group = editor.selectedGroup(); @returns 当前选择的真实层级组。 */
    public selectedGroup(): EditorGroup | null {
        return this.hierarchy.activeGroup;
    }

    /** @param group 需要恢复的层级组选择 @example editor.selectGroup(group); @returns 无返回值。 */
    public selectGroup(group: EditorGroup | null): void {
        this.hierarchy.activeGroup = group;
    }

    /** @example const filters = editor.documentFilters(); @returns 内部实体容器与辅助子树，不代表用户 noSelect 属性。 */
    public documentFilters(): { containers: ReadonlySet<Group>; excluded: ReadonlySet<Group> } {
        const tools = [this.rectEditTool, this.ngonEditTool, this.polyEditTool, this.textEditTool];
        const containers = new Set<Group>();
        const excluded = new Set<Group>([this.frameGroup, this.baseEditTool.frameGroup,
            this.helperGrid.mesh, this.helperGrid.rulerMesh, ...this.hierarchy.auxiliaryNodes()]);
        // 实体容器只扁平化自身；边框组的整条辅助子树不进入文档。
        for (const tool of tools) {
            containers.add(tool.group);
            containers.add(tool.meshGroup);
            excluded.add(tool.frameGroup);
        }
        return { containers, excluded };
    }

    /** @example editor.selectAll(); @returns 无返回值，选择全部启用的可编辑实体并遵循 mult 开关。 */
    public selectAll(): void {
        const meshes: Mesh[] = [];
        // 复用 select 的类型开关、noSelect 和实例过滤，辅助组框不进入选择集。
        for (const candidate of this.scene.ensureLists()) {
            // Group 仅作为层级容器，实体全选由 Mesh 的现有选择接口处理。
            if (candidate instanceof Mesh) {
                meshes.push(candidate);
            }
        }
        this.select(meshes);
    }

    /**
     * 根据 Mesh 或运行期 ID 统一更新混合类型选择集。
     * @param meshes 一个或多个 Mesh 或 ID
     * @param operation 替换、增选或减选
     * @example editor.select([rect.id, polygon.id], "add");
     * @returns 无返回值。
     */
    public select(meshes: Mesh | number | readonly (Mesh | number)[], operation: SelectionOperation = "replace"): void {
        let inputs: readonly (Mesh | number)[];
        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
        if (meshes instanceof Mesh || typeof meshes === "number") {
            inputs = [meshes];
        } else {
            inputs = meshes;
        }
        const candidates = this.scene.ensureLists();
        const valid: Mesh[] = [];
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (const input of inputs) {
            let mesh: Mesh | undefined;
            if (typeof input === "number") {
                // 场景列表同时包含 Group；只解析当前场景里的普通 Mesh ID。
                for (const candidate of candidates) {
                    // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                    if (candidate instanceof Mesh && candidate.id === input) {
                        mesh = candidate;
                    }
                }
            } else {
                mesh = input;
            }
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (mesh !== undefined && candidates.includes(mesh) && !(mesh instanceof IMesh) &&
                !mesh.noSelect && this.isMeshEnabled(mesh)) {
                valid.push(mesh);
            }
        }
        let next: Mesh[];
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (operation === "add") {
            next = [...new Set([...this.actives, ...valid])];
        } else if (operation === "sub") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            /** @param mesh 当前选择成员 @example KeepUnremoved(mesh); @returns 是否仍在选择中。 */
            const KeepUnremoved = (mesh: Mesh): boolean => !valid.includes(mesh);
            next = this.actives.filter(KeepUnremoved);
        } else {
            next = [...new Set(valid)];
        }
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (!this.mult && next.length > 1) {
            console.warn("Editor.select: mult is disabled; using the last Mesh.");
            next = next.slice(-1);
        }
        this.setSelection(next);
    }

    /**
     * 由形状类型分发导入对象；Base2D 只允许通过此入口或场景导入。
     * @param meshes 一个或多个已有 Mesh
     * @example editor.push([rectMesh, baseMesh]);
     * @returns 加入场景的对象。
     */
    public push(meshes: Mesh | readonly Mesh[]): Mesh[] {
        /** @example Apply(); @returns 本次整批操作的实体，选择与导入共用一次历史。 */
        const Apply = (): Mesh[] => {
            let inputs: readonly Mesh[];
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (meshes instanceof Mesh) {
                inputs = [meshes];
            } else {
                inputs = meshes;
            }
            const added: Mesh[] = [];
            // 依次处理当前集合，保持对象顺序并避免遗漏成员。
            for (const mesh of inputs) {
                // 已经属于当前场景的 Mesh 保留原父级，允许调用方先搭建任意 Group 层级。
                if (this.scene.ensureLists().includes(mesh)) {
                    // 类型开关与 noSelect 仍决定对象是否归本编辑器管理。
                    if (this.isMeshEnabled(mesh) && !mesh.noSelect && !(mesh instanceof IMesh)) {
                        mesh.autoPrecision = this.autoPrecision;
                        added.push(mesh);
                    }
                } else {
                    // 尚未入场的 Mesh 交给对应子工具建立资源和历史。
                    if (mesh.data instanceof Rect2D && this._rect) {
                        added.push(...this.rectEditTool.push(mesh));
                    } else if (mesh.data instanceof NGon2D && this._ngon) {
                        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                        added.push(...this.ngonEditTool.push(mesh));
                    } else if (mesh.data instanceof Poly2D && this._poly) {
                        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                        added.push(...this.polyEditTool.push(mesh));
                    } else if (mesh.data instanceof Text && this._text) {
                        // 文字对象导入由自己的排版框工具管理。
                        added.push(...this.textEditTool.push(mesh));
                    } else if (mesh.data instanceof Base2D) {
                        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
                        mesh.autoPrecision = this.autoPrecision;
                        this.scene.add(mesh);
                        added.push(mesh);
                    }
                }
            }
            this.refreshOrders();
            return added;
        };
        return this._history.batch(Apply);
    }

    /** @example editor.update(); @returns 无返回值。 */
    public update(): void {
        this.refreshOrders();
        this.helperGrid.update();
        this.rectEditTool.update();
        this.ngonEditTool.update();
        this.polyEditTool.update();
        this.textEditTool.update();
        this.baseEditTool.update();
        this._groupTransform.update();
        this.hierarchy.update();
    }

    /** @example editor.cancel(); @returns 无返回值。 */
    public cancel(): void {
        // 子工具不自动监听集合输入；中断单指时必须主动清除它登记的触点。
        if (this._editMovePointerId !== null && this._touchPointers.has(this._editMovePointerId)) {
            const event = new PointerEvent("pointercancel", {
                pointerId: this._editMovePointerId,
                pointerType: "touch",
            });
            this.cancelShapePointer(this._pointerOwner, event);
        }
        this._history.cancel();
        this.rectEditTool.cancel();
        this.ngonEditTool.cancel();
        this.polyEditTool.cancel();
        this.textEditTool.cancel();
        this.baseEditTool.cancel();
        this._groupTransform.cancel();
        this._collectionMove.cancel();
        this.hierarchy.cancel();
        this._pointerOwner = null;
        this._selectionGesture = null;
        this._creationParent = null;
        this._editMoveStart = null;
        this._editMovePointerId = null;
        this.hierarchy.clearDropPreview();
        // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
        if (this._selectionFrame !== null) {
            this._selectionFrame.removeSelf();
            this._selectionFrame.dispose();
            this._selectionFrame = null;
        }
    }

    /** @param mesh 编辑实体 @example editor.sourceStyle(mesh); @returns 未叠加选中效果的原始样式。 */
    public sourceStyle(mesh: Mesh): Style {
        // 各工具记录自己的选择装饰前样式，跨类型历史只读取原始内容。
        if (mesh.data instanceof Rect2D) {
            return this.rectEditTool.sourceStyle(mesh);
        } else if (mesh.data instanceof NGon2D) {
            // 正多边形读取选中装饰前保存的样式。
            return this.ngonEditTool.sourceStyle(mesh);
        } else if (mesh.data instanceof Poly2D) {
            // 多边形读取原轮廓的用户样式。
            return this.polyEditTool.sourceStyle(mesh);
        } else if (mesh.data instanceof Text) {
            // 输入中的文字临时透明，历史仍保存原材质样式。
            return this.textEditTool.sourceStyle(mesh);
        } else {
            return this.baseEditTool.sourceStyle(mesh);
        }
    }

    /** @param mesh 编辑实体 @example editor.sourceMaterial(mesh); @returns 输入透明副本之前的用户材质。 */
    public sourceMaterial(mesh: Mesh): Material2d | undefined {
        // 当前文字输入的透明副本不能进入文档或历史。
        if (mesh.data instanceof Text) {
            return this.textEditTool.sourceMaterial(mesh);
        } else {
            return mesh.material;
        }
    }

    /** @example const count = editor.undoCount; @returns 可撤销的整批编辑数量。 */
    public get undoCount(): number {
        return this._history.undoCount;
    }

    /** @example const count = editor.redoCount; @returns 可恢复的整批编辑数量。 */
    public get redoCount(): number {
        return this._history.redoCount;
    }

    /** @example editor.undo(); @returns 是否恢复了原来的几何类型和数据。 */
    public undo(): boolean {
        this.textEditTool.finishEditing();
        return this._history.undo();
    }

    /** @example editor.redo(); @returns 是否重做了下一批编辑。 */
    public redo(): boolean {
        this.textEditTool.finishEditing();
        return this._history.redo();
    }

    /** @example editor.removeSelected(); @returns 本次移除的对象，可供上层撤销或复用。 */
    public removeSelected(): Mesh[] {
        this.textEditTool.finishEditing();
        this._history.begin();
        const removed = [...this.actives];
        this.select([]);
        // 摘除实体保留 CPU 对象，历史重做需要复用稳定 ID。
        for (const mesh of removed) {
            mesh.removeSelf();
        }
        this._history.commit();
        return removed;
    }

    /** @example editor.copySelected(); @returns 无返回值，将原始几何与样式复制到内部剪贴板。 */
    public copySelected(): void {
        this._clipboard = [];
        this._clipboardClient = this._lastClient?.clone() ?? null;
        // 保存世界矩阵，粘贴到根层后仍保持原来嵌套对象的可见姿态。
        for (const mesh of this.actives) {
            const clone = mesh.clone();
            clone.order = this.sourceOrder(mesh);
            clone.style = this.sourceStyle(mesh).clone();
            clone.matrix.copy(mesh.ensureWorldMatrix());
            const values = clone.matrix.data;
            clone.position.set(values[6], values[7]);
            clone.rotation = Math.atan2(values[1], values[0]);
            clone.scale.set(Math.hypot(values[0], values[1]), Math.hypot(values[3], values[4]));
            clone.matrix.copy(mesh.ensureWorldMatrix());
            this._clipboard.push(clone);
        }
    }

    /** @example editor.cutSelected(); @returns 本次剪切的对象。 */
    public cutSelected(): Mesh[] {
        this.copySelected();
        return this.removeSelected();
    }

    /** @example editor.paste(); @returns 以鼠标位置为中心的新增对象。 */
    public paste(): Mesh[] {
        /** @example Apply(); @returns 本次整批操作的实体，选择与导入共用一次历史。 */
        const Apply = (): Mesh[] => {
            const cursor = this._lastClient;
            let dx = 10;
            let dy = -10;
            // 同一鼠标位置连续粘贴保留错开兜底，避免完全重合。
            if (cursor !== null && (this._clipboardClient === null ||
                Math.hypot(cursor.x - this._clipboardClient.x, cursor.y - this._clipboardClient.y) > 1)) {
                const world = this.camera.windowToWorld(cursor, this.render);
                let centerX = 0;
                let centerY = 0;
                // 以整批世界中心对齐新的鼠标位置。
                for (const mesh of this._clipboard) {
                    centerX += mesh.position.x;
                    centerY += mesh.position.y;
                }
                dx = world.x - centerX / Math.max(1, this._clipboard.length);
                dy = world.y - centerY / Math.max(1, this._clipboard.length);
            }
            const added: Mesh[] = [];
            // 每次粘贴独立克隆，保留父级变换后的可见姿态。
            for (const source of this._clipboard) {
                const mesh = source.clone();
                const matrix = source.ensureMatrix().clone();
                mesh.position.set(source.position.x + dx, source.position.y + dy);
                matrix.setTranslate(new Vec2(matrix.data[6] + dx, matrix.data[7] + dy));
                mesh.matrix.copy(matrix);
                added.push(mesh);
            }
            this.push(added);
            this.select(added);
            this._clipboardClient = cursor?.clone() ?? null;
            return added;
        };
        return this._history.batch(Apply);
    }

    /** @example editor.destroy(); @returns 无返回值。 */
    public destroy(): void {
        // 销毁后不再写入资源或恢复监听，防止重复释放。
        if (!this._destroyed) {
            this._destroyed = true;
            this._events.abort();
            this.cancel();
            this._orders.restore();
            this._touchPointers.clear();
            this._groupTransform.destroy();
            this.hierarchy.destroy();
            this.baseEditTool.destroy();
            this.rectEditTool.destroy();
            this.ngonEditTool.destroy();
            this.polyEditTool.destroy();
            this.textEditTool.destroy();
            this.helperGrid.destroy();
            this.frameGroup.removeSelf();
        }
    }

    /** @example editor.handleWindowBlur(); @returns 无返回值。 */
    private handleWindowBlur(): void {
        this.cancel();
        this._touchPointers.clear();
    }

    /** @param event 指针按下事件 @example editor.handlePointerDown(event); @returns 无返回值。 */
    public handlePointerDown(event: PointerEvent): void {
        this._history.begin();
        // 第二根手指接管镜头时终止单指编辑，直到全部触点松开。
        if (event.pointerType === "touch") {
            this._touchPointers.add(event.pointerId);
            // 多点输入交给相机后不再提交第一个触点正在进行的编辑。
            if (this._touchPointers.size > 1) {
                this.cancel();
            }
        }
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (!this._destroyed && this._activeType !== "view" && this._touchPointers.size < 2 &&
            this._pointerOwner === null) {
            this.beginPointerDown(event);
        }
    }

    /** @param event 指针按下事件 @example this.beginPointerDown(event); @returns 无返回值。 */
    private beginPointerDown(event: PointerEvent): void {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (event.pointerType === "mouse" && event.button === 2) {
            // 当前模式独占此类输入，避免多个编辑器同时响应。
            if (this._activeType === "edit" && this._shape === "poly") {
                this.polyEditTool.handlePointerDown(event);
            }
            return;
        }
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }
        const client = new Vec2(event.clientX, event.clientY);
        // 只让画布内的指针触发新建或编辑，工具栏交互不进入几何操作。
        if (IsCanvasPoint(client, this.render)) {
            this.beginCanvasPointerDown(event, client);
        }
    }

    /** @param event 指针事件 @param client 画布内窗口坐标 @example this.beginCanvasPointerDown(event, client); @returns 无返回值。 */
    private beginCanvasPointerDown(event: PointerEvent, client: Vec2): void {
        this._lastClient = client;
        // 在结束空文字会话之前记住选择状态，删除空对象也要消耗本次取消选择的点击。
        const hadSelection = this.actives.length > 0;
        // 点另一个对象或空白区域时先结束当前文字输入。
        const wasTextEditing = this.textEditTool.editing;
        // 点击画布先提交之前的输入会话。
        if (wasTextEditing) {
            this.textEditTool.finishEditing();
        }
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this._activeType === "group") {
            // 禁用的组动作不应抢占选择或其他手势。
            const action = this._groupTransform.hover(client);
            // 命中且允许的动作才建立组手势。
            if (action !== null && this.switches[action.action] && this._groupTransform.pointerDown(event)) {
                this._pointerOwner = "group";
            }
        } else if (this._activeType === "edit" && this._shape === "group" && this._group) {
            // 新建层级组时不转发到普通形状编辑器。
            this.beginHierarchyPointerDown(event, client);
        } else if ((this._activeType === "add" || this._activeType === "sub") &&
            (this.switches.pick || this.switches.marquee)) {
            // 当前模式独占此类输入，避免多个编辑器同时响应。
            this._selectionGesture = {
                pointerId: event.pointerId, first: client, current: client.clone(), operation: this._activeType,
            };
            this._pointerOwner = "selection";
        } else if (this._activeType === "edit") {
            // 增减选的入口全部关闭时不能落入普通形状新建流程。
            let owner: PointerOwner | null = null;
            const hit = this.pickEditable(client);
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (this._shape === "poly" && this.polyEditTool.isDrawing) {
                owner = "poly";
            } else if (hit !== null) {
                // 依据当前模式和形状所有权分派输入，保持选择状态一致。
                owner = this.kind(hit);
                // 依据当前模式和形状所有权分派输入，保持选择状态一致。
                if (owner !== null) {
                    let operation: SelectionOperation = "replace";
                    // 依据当前模式和形状所有权分派输入，保持选择状态一致。
                    if (this.mult) {
                        operation = "add";
                    }
                    // 命中对象仍可供已选手柄编辑，点选关闭时不改变选择集。
                    if (this.switches.pick && owner !== "text") {
                        this.select(hit, operation);
                    }
                }
            } else if (hadSelection) {
                // 已有选择时空白点击只取消整批选择；关闭点选时保留选择且不新建。
                if (this.switches.pick) {
                    this.select([]);
                }
            } else if ((this._shape === "text" || wasTextEditing) && this._text && this.switches.create) {
                // 没有选择时，文字空白点击直接开始输入，不等待拖框。
                owner = "text";
                this._creationParent = this.hierarchy.dropTarget(client, this.frameGroup);
            } else {
                // 全部形状都关闭时，空白拖动不应绕过开关创建图形。
                if (this.isEnabled(this._shape) && this.switches.create) {
                    owner = this._shape;
                    // 开启 nest 后也允许在填充对象内部起笔创建子对象。
                    if (owner !== "group") {
                        this._creationParent = this.hierarchy.dropTarget(client, this.frameGroup);
                    }
                }
            }
            this._pointerOwner = owner;
            this.forwardDown(owner, event, hit);
            // 实体内部多选平移由集合统一执行；单击、拖点和改尺寸仍保留子工具语义。
            if (hit !== null && this.actives.length > 1 && this.movingMeshes(owner).length > 0) {
                this._collectionMove.begin(event, this.actives, hit, this.moveOptions(owner));
            }
            // 子工具仍执行几何编辑，集合只记录实体平移以便统一接管层级落点。
            if (owner === "rect" || owner === "ngon" || owner === "poly" || owner === "text" || owner === "base") {
                this._editMoveStart = client;
                this._editMovePointerId = event.pointerId;
            }
        }
    }

    /** @param mesh 刚由形状工具创建的对象 @example this.attachCreatedMesh(mesh); @returns 无返回值。 */
    private attachCreatedMesh(mesh: Mesh): void {
        const parent = this._creationParent;
        // 只有画布起笔创建才按所在 Group 归属；程序导入保留调用方指定层级。
        if (parent !== null && mesh.parent !== parent) {
            Reparent(mesh, parent);
        }
        this._creationParent = null;
        this.refreshOrders();
    }

    /** @param event 指针事件 @param client 窗口点 @example this.beginHierarchyPointerDown(event, client); @returns 无返回值。 */
    private beginHierarchyPointerDown(event: PointerEvent, client: Vec2): void {
        const edge = this.hierarchy.pickGroup(client, true);
        const mesh = this.pick(client);
        const group = this.hierarchy.pickGroup(client);
        // 虚线边角优先编辑 Group；内部实体可独立拖进另一层级。
        if (edge !== null && (this.switches.pick || this.hierarchy.activeGroup === edge.group)) {
            // 点选关闭后只允许继续操作已经选中的组。
            if (this.switches.pick) {
                this.select([]);
            }
            // 组框动作必须通过层级工具的操作开关。
            if (this.hierarchy.pointerDown(event, edge.group, edge)) {
                this._pointerOwner = "hierarchy";
            }
        } else if (mesh !== null && (this.switches.pick || this.actives.includes(mesh))) {
            // 命中实体时移动单个 Mesh，松开后再决定是否换父级。
            if (this.switches.pick) {
                this.select(mesh);
            }
            // 禁止实体平移时只保留本次点选结果。
            if (this.hierarchy.pointerDown(event, mesh)) {
                this._pointerOwner = "hierarchy";
            }
        } else if (group !== null && (this.switches.pick || this.hierarchy.activeGroup === group.group)) {
            // 已选组的内部拖动移动整组，未选组的内部拖框建立子组。
            if (this.hierarchy.activeGroup === group.group) {
                // 层级组接管指针时清除普通实体选择，关闭点选时保留现有选择。
                if (this.switches.pick) {
                    this.select([]);
                }
                // 已选组只有允许对应动作时才开始拖动。
                if (this.hierarchy.pointerDown(event, group.group, group)) {
                    this._pointerOwner = "hierarchy";
                }
            } else {
                // 子组创建由统一的新建开关控制。
                if (this.switches.create) {
                    this.beginGroupCreate(event, client);
                }
            }
        } else {
            // 空白处画层级组与普通几何共用新建开关。
            if (this.switches.create) {
                this.beginGroupCreate(event, client);
            }
        }
    }

    /** @param event 起笔事件 @param client 起笔位置 @example this.beginGroupCreate(event, client); @returns 无返回值。 */
    private beginGroupCreate(event: PointerEvent, client: Vec2): void {
        this._selectionGesture = {
            pointerId: event.pointerId, first: client, current: client.clone(), operation: "replace",
        };
        this._pointerOwner = "groupCreate";
    }

    /** @param event 指针移动事件 @example editor.handlePointerMove(event); @returns 无返回值。 */
    public handlePointerMove(event: PointerEvent): void {
        this._lastClient = new Vec2(event.clientX, event.clientY);
        this.takeOverMove(event);
        const owner = this._pointerOwner;
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (owner === "group") {
            this._groupTransform.pointerMove(event);
            // 组合平移与真实层级拖动共用放置目标和蓝色边框反馈。
            if (this._groupTransform.isMoving && this._group && this.switches.reparent && this.actives.length > 0) {
                this.hierarchy.previewDrop(new Vec2(event.clientX, event.clientY),
                    this.actives[0], this.actives.slice(1));
            } else {
                this.hierarchy.clearDropPreview();
            }
        } else if (owner === "hierarchy") {
            // 层级交互独立维护 Group 或 Mesh 的世界矩阵。
            this.hierarchy.pointerMove(event);
        } else if (owner === "groupCreate" && this._selectionGesture?.pointerId === event.pointerId) {
            // 空白画框只显示虚线，不产生可拾取的预览实体。
            this.updateGroupCreatePreview(new Vec2(event.clientX, event.clientY));
        } else if (owner === "selection" && this._selectionGesture?.pointerId === event.pointerId) {
            // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
            const gesture = this._selectionGesture;
            gesture.current = new Vec2(event.clientX, event.clientY);
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (this.switches.marquee &&
                Math.hypot(gesture.current.x - gesture.first.x, gesture.current.y - gesture.first.y) > 3) {
                // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
                if (this._selectionFrame === null) {
                    this._selectionFrame = CreateSelectionFrame();
                    this.frameGroup.add(this._selectionFrame);
                }
                UpdateSelectionFrame(this._selectionFrame, gesture.first, gesture.current,
                    this.camera, this.render);
            }
        } else if (owner === "move") {
            // 不按几何类型拆分位移，保持混合选择的相对位置。
            this._collectionMove.pointerMove(event);
        } else if (owner === "rect") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.rectEditTool.handlePointerMove(event);
        } else if (owner === "ngon") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.ngonEditTool.handlePointerMove(event);
        } else if (owner === "poly") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.polyEditTool.handlePointerMove(event);
        } else if (owner === "text") {
            // 文字实体变换转发给排版框控制器。
            this.textEditTool.handlePointerMove(event);
        } else if (owner === "base") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.baseEditTool.handlePointerMove(event);
        }
        // 只有实体平移超过点击容差才显示放置反馈；顶点和边角编辑不改变父级。
        if (this._editMoveStart !== null && this._editMovePointerId === event.pointerId) {
            const distance = Math.hypot(event.clientX - this._editMoveStart.x,
                event.clientY - this._editMoveStart.y);
            const moving = this.movingMeshes(owner);
            // 只在实体已经开始平移时查询落点，点击仍维持选择语义。
            if (distance >= 3 && moving.length > 0 && this.switches.reparent) {
                this.hierarchy.previewDrop(new Vec2(event.clientX, event.clientY), moving[0], moving.slice(1));
            } else {
                this.hierarchy.clearDropPreview();
            }
        } else if (owner === null && event.pointerType === "mouse" && this._touchPointers.size === 0) {
            // 无手势时仍需转发悬停，独立工具才能显示边角与旋转状态。
            this.updateHover(event);
        }
    }

    /** @param event 指针松开事件 @example editor.handlePointerUp(event); @returns 无返回值。 */
    public handlePointerUp(event: PointerEvent): void {
        // 多指期间不让较早按下的手指提交已经取消的编辑手势。
        if (event.pointerType === "touch") {
            this._touchPointers.delete(event.pointerId);
        }
        // 只有按下和松开两帧的拖动，也必须进入统一平移。
        this.takeOverMove(event);
        const owner = this._pointerOwner;
        let movedMeshes: Mesh[] = [];
        // 抬起事件可能是首个超过点击容差的事件，先保存子工具的平移对象。
        if (this._editMoveStart !== null && this._editMovePointerId === event.pointerId) {
            const distance = Math.hypot(event.clientX - this._editMoveStart.x,
                event.clientY - this._editMoveStart.y);
            // 抬起位置也要参与拖动判定，不能只依赖中途的 move 事件。
            if (distance >= 3) {
                movedMeshes = this.movingMeshes(owner);
            }
        }
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (owner === "group") {
            const moving = this._groupTransform.isMoving;
            const click = this._groupTransform.pointerUp(event);
            // 组合平移允许把所选 Mesh 一次放入鼠标所处的 Group。
            if (moving && this._group && this.switches.reparent && this.actives.length > 0) {
                const target = this.hierarchy.dropTarget(new Vec2(event.clientX, event.clientY),
                    this.actives[0], this.actives.slice(1));
                // 同批 Mesh 的新父节点一致；空白处对应场景根节点。
                for (const mesh of this.actives) {
                    // 已在目标容器里的对象保留原层级。
                    if (mesh.parent !== target) {
                        Reparent(mesh, target);
                    }
                }
            }
            this.hierarchy.clearDropPreview();
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (click) {
                this.select([]);
                this.activeType = "edit";
            }
        } else if (owner === "hierarchy") {
            // 拖动真实组或 Mesh 的放置目标由其控制器决定。
            this.hierarchy.pointerUp(event);
        } else if (owner === "groupCreate" && this._selectionGesture?.pointerId === event.pointerId) {
            // 画框完成后建立独立边界的空 Group。
            const first = this.camera.windowToWorld(this._selectionGesture.first, this.render);
            const last = this.camera.windowToWorld(new Vec2(event.clientX, event.clientY), this.render);
            const created = this.hierarchy.create(first, last);
            this.select([]);
            // 单击只切换选中状态，不创建无法拾取的零面积层级组。
            if (created === null) {
                this.hierarchy.activeGroup = this.hierarchy.groupAt(this._selectionGesture.first);
            }
        } else if (owner === "selection" && this._selectionGesture?.pointerId === event.pointerId) {
            // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
            const gesture = this._selectionGesture;
            const moved = Math.hypot(event.clientX - gesture.first.x, event.clientY - gesture.first.y) > 3;
            // 拖动后只考虑框选，不能在框选关闭时退化成末点点击。
            if (moved) {
                // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
                if (this._selectionFrame !== null && this.switches.marquee) {
                    const result = this.selector.Selector(this._selectionFrame);
                    this.select(Select.Sort(result, "desc"), gesture.operation);
                }
            } else if (this.switches.pick) {
                // 单击走点选入口，仅追加实际命中的对象。
                const hit = this.pick(new Vec2(event.clientX, event.clientY));
                // 空白位置不应向增选或减选提交占位 Mesh。
                if (hit !== null) {
                    this.select(hit, gesture.operation);
                }
            }
        } else if (owner === "move") {
            // 松开处是最终位移，之后再统一处理父级变更。
            this._collectionMove.pointerMove(event);
        } else if (owner === "rect") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.rectEditTool.handlePointerUp(event);
        } else if (owner === "ngon") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.ngonEditTool.handlePointerUp(event);
        } else if (owner === "poly") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.polyEditTool.handlePointerUp(event);
        } else if (owner === "text") {
            // 松开文字对象的拖动或输入点击。
            this.textEditTool.handlePointerUp(event);
        } else if (owner === "base") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.baseEditTool.handlePointerMove(event);
            this.baseEditTool.handlePointerUp(event);
        }
        // 子工具先提交最后一帧的位置，再按松开处决定整批对象的新父容器。
        if (movedMeshes.length > 0 && this.switches.reparent) {
            const client = new Vec2(event.clientX, event.clientY);
            const target = this.hierarchy.dropTarget(client, movedMeshes[0], movedMeshes.slice(1));
            // 多选实体保持一致的父节点，避免其中一个对象落在另一个对象之下。
            for (const mesh of movedMeshes) {
                // 已在目标下时不重复改写局部变换。
                if (mesh.parent !== target) {
                    Reparent(mesh, target);
                }
            }
        }
        this.hierarchy.clearDropPreview();
        this._collectionMove.cancel();
        this._editMoveStart = null;
        this._editMovePointerId = null;
        // 单次拖框结束后清理起笔容器；Poly 逐点绘制直到闭合才清理。
        if (owner === "rect" || owner === "ngon" || (owner === "poly" && !this.polyEditTool.isDrawing)) {
            this._creationParent = null;
        }
        this._pointerOwner = null;
        this._selectionGesture = null;
        // 辅助框按需维护，避免旧覆盖层留在场景中参与后续交互。
        if (this._selectionFrame !== null) {
            this._selectionFrame.removeSelf();
            this._selectionFrame.dispose();
            this._selectionFrame = null;
        }
        // 逐点路径和文字输入各自保持一笔历史，直到提交路径或退出输入。
        if (!this.polyEditTool.isDrawing && !this.textEditTool.editing) {
            this._history.commit();
        }
        // 松开后按当前位置恢复正确的悬停图标，避免保留上一种形状的状态。
        if (event.pointerType === "mouse") {
            this.updateHover(event);
        }
    }

    /** @param event 被取消的指针 @example editor.handlePointerCancel(event); @returns 无返回值。 */
    public handlePointerCancel(event: PointerEvent): void {
        // 取消的触点需要及时退出输入集合，避免下一次单指操作被误判为双指。
        if (event.pointerType === "touch") {
            this._touchPointers.delete(event.pointerId);
        }
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        this.cancelShapePointer(this._pointerOwner, event);
        this.cancel();
    }

    /** @param event 浏览器右键菜单事件 @example editor.handleContextMenu(event); @returns 无返回值。 */
    private handleContextMenu(event: MouseEvent): void {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (this._shape === "poly" && this.polyEditTool.isDrawing) {
            event.preventDefault();
        }
    }

    /** @param owner 所有者 @param event 指针事件 @param pickedMesh 统一选择器命中的 Mesh @example this.forwardDown("rect", event, mesh); @returns 无返回值。 */
    private forwardDown(owner: PointerOwner | null, event: PointerEvent, pickedMesh: Mesh | null): void {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (owner === "rect") {
            this.rectEditTool.handlePointerDown(event);
        } else if (owner === "ngon") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.ngonEditTool.handlePointerDown(event);
        } else if (owner === "poly") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.polyEditTool.handlePointerDown(event);
        } else if (owner === "text") {
            // 文字按下由工具判断首次选择或再次输入。
            this.textEditTool.handlePointerDown(event);
        } else if (owner === "base") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            this.baseEditTool.handlePointerDown(event, pickedMesh);
        }
    }

    /** @param owner 当前指针所属工具 @example const meshes = this.movingMeshes("rect"); @returns 正在实体平移的对象。 */
    private movingMeshes(owner: PointerOwner | null): Mesh[] {
        // 统一从实际拥有本次手势的子工具读取，避免把边角编辑误当作实体拖放。
        if (owner === "move") {
            return this._collectionMove.meshes;
        } else if (owner === "rect") {
            // 单选平移及矩形边角仍由原工具处理。
            return this.rectEditTool.movingMeshes;
        } else if (owner === "ngon") {
            // 当前正多边形工具只返回实体平移快照。
            return this.ngonEditTool.movingMeshes;
        } else if (owner === "poly") {
            // 顶点拖动与插点在工具内部处理，不进入父级变更。
            return this.polyEditTool.movingMeshes;
        } else if (owner === "text") {
            // 文字只有内部平移进入层级拖放判断。
            return this.textEditTool.movingMeshes;
        } else if (owner === "base") {
            // Base2D 同样只返回实体内部的平移手势。
            return this.baseEditTool.movingMeshes;
        } else {
            return [];
        }
    }

    /**
     * 达到拖动容差后释放子工具的内部平移手势，保留未拖动的点击行为。
     * @param event 当前指针事件
     * @example this.takeOverMove(event);
     * @returns 无返回值。
     */
    private takeOverMove(event: PointerEvent): void {
        const owner = this._pointerOwner;
        // 尚未接管的有效多选拖动，才需要释放原工具并重新开始统一历史事务。
        if (owner !== "move" && this._collectionMove.accepts(event)) {
            // 取消会释放触点和原工具的快照，禁止原工具再重复应用位移。
            this.cancelShapePointer(owner, event);
            // 文字代理也使用集合历史；释放代理后重新捕获仍未移动的整批对象。
            this._history.begin();
            this._pointerOwner = "move";
            this.render.canvas.style.cursor = `url("${moveCursorUrl}") 16 16, move`;
        }
    }

    /**
     * 释放对应子工具的手势及单指登记，避免取消后残留输入状态。
     * @param owner 原手势所属工具
     * @param event 被取消或被集合接管的指针
     * @example this.cancelShapePointer("rect", event);
     * @returns 无返回值。
     */
    private cancelShapePointer(owner: PointerOwner | null, event: PointerEvent): void {
        // 各类型工具自行清理自己的捕获与触点，集合不访问它们的私有状态。
        if (owner === "rect") {
            this.rectEditTool.handlePointerCancel(event);
        } else if (owner === "ngon") {
            // 正多边形取消只释放本轮交互，保留已有半径。
            this.ngonEditTool.handlePointerCancel(event);
        } else if (owner === "poly") {
            // 多边形负责清除当前拖点或内部平移快照。
            this.polyEditTool.handlePointerCancel(event);
        } else if (owner === "text") {
            // 文字工具还要释放它的矩形代理触点。
            this.textEditTool.handlePointerCancel(event);
        } else if (owner === "base") {
            // Base 只保存由集合转发的单轮手势。
            this.baseEditTool.cancel();
        }
    }

    /**
     * 沿用命中对象所属工具的实时步进、吸附和活动范围。
     * @param owner 本轮原形状工具
     * @example const options = this.moveOptions("poly");
     * @returns 统一平移使用的配置引用。
     */
    private moveOptions(owner: PointerOwner | null): MoveOptions {
        // 快捷键已统一设置这些属性，直接引用还能响应手势中按下或松开的 Shift。
        if (owner === "ngon") {
            return this.ngonEditTool;
        } else if (owner === "poly") {
            // 多边形的活动区域和吸附容差继续由其公开配置决定。
            return this.polyEditTool;
        } else if (owner === "text") {
            // 文字只贡献排版框，但共用同一套交互选项。
            return this.textEditTool;
        } else {
            return this.rectEditTool;
        }
    }

    /**
     * 整批位置更新后，按类型触发原工具的移动、位置和编辑回调。
     * @param meshes 本帧一起移动的对象
     * @example this.notifyCollectionMove(meshes);
     * @returns 无返回值。
     */
    private notifyCollectionMove(meshes: Mesh[]): void {
        /** @param mesh 移动成员 @example IsRect(mesh); @returns 是否归矩形工具。 */
        const IsRect = (mesh: Mesh): boolean => mesh.data instanceof Rect2D;
        /** @param mesh 移动成员 @example IsNGon(mesh); @returns 是否归正多边形工具。 */
        const IsNGon = (mesh: Mesh): boolean => mesh.data instanceof NGon2D;
        /** @param mesh 移动成员 @example IsPoly(mesh); @returns 是否归多边形工具。 */
        const IsPoly = (mesh: Mesh): boolean => mesh.data instanceof Poly2D;
        /** @param mesh 移动成员 @example IsText(mesh); @returns 是否归文字工具。 */
        const IsText = (mesh: Mesh): boolean => mesh.data instanceof Text;
        /** @param mesh 移动成员 @example IsBase(mesh); @returns 是否归 Base 工具。 */
        const IsBase = (mesh: Mesh): boolean => mesh.data instanceof Base2D;
        this.rectEditTool.notifyExternalMove(meshes.filter(IsRect));
        this.ngonEditTool.notifyExternalMove(meshes.filter(IsNGon));
        this.polyEditTool.notifyExternalMove(meshes.filter(IsPoly));
        this.textEditTool.notifyExternalMove(meshes.filter(IsText));
        this.baseEditTool.notifyExternalMove(meshes.filter(IsBase));
        this.notifyEdit(meshes);
    }

    /** @param client 窗口坐标 @example const mesh = this.pick(client); @returns 最上面的可编辑 Mesh。 */
    private pick(client: Vec2): Mesh | null {
        const result = this.selector.SelectPicker(new MouseEvent("mousemove", {
            clientX: client.x, clientY: client.y,
        }));
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (const mesh of Select.Sort(result, "desc")) {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (this.isMeshEnabled(mesh)) {
                return mesh;
            }
        }
        return null;
    }

    /** @param client 窗口坐标 @example const mesh = this.pickEditable(client); @returns 手柄或实体命中的顶层对象。 */
    private pickEditable(client: Vec2): Mesh | null {
        const rotationCandidates = [
            this.rectEditTool.pickRotationHandle(client),
            this.ngonEditTool.pickRotationHandle(client),
            this.polyEditTool.pickRotationHandle(client),
            this.textEditTool.pickRotationHandle(client),
        ];
        // 旋转图标在实体外侧，应先于普通面拾取，避免点击后被当作空白取消选择。
        let hit = this.topmost(rotationCandidates);
        // 只有未命中外侧旋转图标时，普通角、边和填充面才参与拾取。
        if (hit === null) {
            // 子工具的命中包含屏幕容差内的角和边，统一选择器补充普通实体面。
            const candidates = [
                this.rectEditTool.pickMesh(client),
                this.ngonEditTool.pickMesh(client),
                this.polyEditTool.pickMesh(client),
                this.textEditTool.pickMesh(client),
                this.baseEditTool.pickContourMesh(client),
                this.pick(client),
            ];
            hit = this.topmost(candidates);
        }
        return hit;
    }

    /** @param candidates 手柄和实体的候选 Mesh @example const mesh = this.topmost(candidates); @returns 实际绘制顺序最上面的对象。 */
    private topmost(candidates: readonly (Mesh | null)[]): Mesh | null {
        const accepted = new Set(candidates);
        let top: Mesh | null = null;
        let topLayer = -1;
        let topIndex = -1;
        const drawList = this.scene.ensureLists();
        // 与 Select.Sort 一致，关闭深度测试的覆盖层高于深度测试对象。
        for (let index = 0; index < drawList.length; index++) {
            const mesh = drawList[index];
            // 已关闭类别和不在候选集的场景节点不会抢占编辑手柄。
            if (mesh instanceof Mesh && accepted.has(mesh) && this.isMeshEnabled(mesh)) {
                let layer = 1;
                // 深度测试图元在覆盖层之前提交。
                if (mesh.material?.depthTest) {
                    layer = 0;
                }
                // 同一层按 Scene 绘制顺序选择最上面的对象。
                if (layer > topLayer || (layer === topLayer && index > topIndex)) {
                    top = mesh;
                    topLayer = layer;
                    topIndex = index;
                }
            }
        }
        return top;
    }

    /** @param event 鼠标移动或松开事件 @example this.updateHover(event); @returns 无返回值。 */
    private updateHover(event: PointerEvent): void {
        const client = new Vec2(event.clientX, event.clientY);
        // 模式先决定是否由独立工具、组框或相机占有悬停状态。
        switch (this._activeType) {
            case "group":
                this.updateGroupCursor(client);
                break;
            case "view":
                this.render.canvas.style.cursor = `url("${handCursorUrl}") 16 16, grab`;
                break;
            case "edit":
                // 层级编辑接管实体拖动，其余形状仍由对应工具决定光标。
                if (this._shape === "group") {
                    this.updateHierarchyCursor(client);
                } else {
                    this.updateEditHover(event, client);
                }
                break;
            default:
                this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
        }
    }

    /** @param client 鼠标窗口坐标 @example this.updateHierarchyCursor(client); @returns 无返回值。 */
    private updateHierarchyCursor(client: Vec2): void {
        const groupHit = this.hierarchy.pickGroup(client, true) ?? this.hierarchy.pickGroup(client);
        let hit = groupHit;
        // 点选关闭后，未选中的组不应提示可以拖动的边角手柄。
        if (groupHit !== null && !this.switches.pick && this.hierarchy.activeGroup !== groupHit.group) {
            hit = null;
        }
        const mesh = this.pick(client);
        let canMoveMesh = false;
        // 已选实体可继续移动；未选实体需先允许点选才提示移动。
        if (mesh !== null && this.switches.move && (this.switches.pick || this.actives.includes(mesh))) {
            canMoveMesh = true;
        }
        // 边框外侧旋转区先于普通实体提示。
        if (hit?.action === "rotate") {
            this.render.canvas.style.cursor = `url("${rotateCursorUrl}") 16 16, context-menu`;
        } else if (hit?.action === "scale") {
            // 层级组可嵌套并抵消 zoom，使用实际组框显示矩阵求屏幕法线。
            this.render.canvas.style.cursor = FrameResizeCursor(hit.group.frame.getRenderMatrix(this.camera).data,
                hit.handle, this.camera, this.render);
        } else if (this.switches.move && (hit?.action === "move" || canMoveMesh)) {
            // 组内部空白和实体面都可拖动，但作用对象不同。
            this.render.canvas.style.cursor = `url("${moveCursorUrl}") 16 16, move`;
        } else {
            // 层级组新建被关闭时，空白画布不再显示绘制光标。
            if (this.switches.create) {
                this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
            } else {
                this.render.canvas.style.cursor = "default";
            }
        }
    }

    /** @param client 当前窗口点 @example this.updateGroupCreatePreview(client); @returns 无返回值。 */
    private updateGroupCreatePreview(client: Vec2): void {
        const gesture = this._selectionGesture;
        // 已取消的画框不再更新覆盖层。
        if (gesture !== null) {
            gesture.current = client;
            const distance = Math.hypot(client.x - gesture.first.x, client.y - gesture.first.y);
            // 小于点击容差时不创建预览，避免瞬时闪烁。
            if (distance > 3) {
                // 一次手势只分配一件虚线 Mesh，后续移动复用它。
                if (this._selectionFrame === null) {
                    this._selectionFrame = CreateGroupFrame({
                        left: -50, right: 50, bottom: -50, top: 50,
                        center: new Vec2(0, 0), width: 100, height: 100,
                    });
                    this.frameGroup.add(this._selectionFrame);
                }
                const first = this.camera.windowToWorld(gesture.first, this.render);
                const last = this.camera.windowToWorld(client, this.render);
                this._selectionFrame.position.set((first.x + last.x) / 2, (first.y + last.y) / 2);
                this._selectionFrame.ignoreZoom = this.ignoreZoom;
                let sizeScale = 1;
                // 固定尺寸预览也用屏幕尺寸记录范围，使松开前后与新组框一致。
                if (this.ignoreZoom) {
                    sizeScale = this.camera.zoom;
                }
                // 直接重建目标宽高，避免把固定 100×100 虚线非等比拉成粗细不同的边。
                UpdateGroupFrameScreen(this._selectionFrame,
                    Math.max(0.001, Math.abs(last.x - first.x) * sizeScale),
                    Math.max(0.001, Math.abs(last.y - first.y) * sizeScale), this.camera, this.render);
            }
        }
    }

    /** @param event 鼠标事件 @param client 窗口坐标 @example this.updateEditHover(event, client); @returns 无返回值。 */
    private updateEditHover(event: PointerEvent, client: Vec2): void {
        let owner: PointerOwner | null = null;
        // 正在绘制的 Poly 继续跟随指针，不被经过的其他对象抢走预览。
        if (this._shape === "poly" && this.polyEditTool.isDrawing) {
            owner = "poly";
        } else {
            const mesh = this.pickEditable(client);
            // 实体和手柄采用命中对象的光标逻辑。
            if (mesh !== null) {
                owner = this.kind(mesh);
            } else {
                // 空白区域采用当前启用的创建类型。
                if (this.isEnabled(this._shape)) {
                    owner = this._shape;
                }
            }
        }
        // 每次只让一个工具改写画布光标，避免三个工具覆盖彼此的结果。
        switch (owner) {
            case "rect":
                this.rectEditTool.handlePointerMove(event);
                this.render.canvas.style.cursor = this.rectEditTool.cursorAt(client);
                break;
            case "ngon":
                this.ngonEditTool.handlePointerMove(event);
                this.render.canvas.style.cursor = this.ngonEditTool.cursorAt(client);
                break;
            case "poly":
                this.polyEditTool.handlePointerMove(event);
                this.render.canvas.style.cursor = this.polyEditTool.cursorAt(client);
                break;
            case "text":
                this.textEditTool.handlePointerMove(event);
                this.render.canvas.style.cursor = this.textEditTool.cursorAt(client);
                break;
            case "base":
                // 轮廓节点使用添加图标；实体内部使用移动图标。
                if ((this.switches.resize || this.switches.insertVertex) &&
                    this.baseEditTool.pickContourMesh(client) !== null) {
                    this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
                } else if (this.switches.move) {
                    // 只有平移启用时才提示 Base 实体可拖动。
                    this.render.canvas.style.cursor = `url("${moveCursorUrl}") 16 16, move`;
                } else {
                    this.render.canvas.style.cursor = "default";
                }
                break;
            default:
                // 没有命中对象时，只有新建开启才提示绘制。
                if (this.switches.create) {
                    this.render.canvas.style.cursor = `url("${plusCursorUrl}") 16 16, crosshair`;
                } else {
                    this.render.canvas.style.cursor = "default";
                }
        }
    }

    /** @param client 鼠标窗口坐标 @example this.updateGroupCursor(client); @returns 无返回值。 */
    private updateGroupCursor(client: Vec2): void {
        const hit = this._groupTransform.hover(client);
        let enabledHit: typeof hit = null;
        // 禁用的组操作不显示仍可拖动的光标。
        if (hit !== null && this.switches[hit.action]) {
            enabledHit = hit;
        }
        let url: string | null = null;
        let fallback = "default";
        // 组框的角、边、内部及外部分别对应缩放、移动和旋转。
        switch (enabledHit?.action) {
            case "rotate":
                url = rotateCursorUrl;
                fallback = "context-menu";
                break;
            case "move":
                url = moveCursorUrl;
                fallback = "move";
                break;
            case "scale":
                // 组合框的方向由当前显示矩阵决定，旋转后的边角共用屏幕法线算法。
                this.render.canvas.style.cursor = this._groupTransform.resizeCursor(enabledHit.handle);
                return;
            default:
                break;
        }
        // 组操作全被关闭时不提示任何可用的变换。
        if (url === null) {
            this.render.canvas.style.cursor = "default";
        } else {
            this.render.canvas.style.cursor = `url("${url}") 16 16, ${fallback}`;
        }
    }

    /** @param mesh 候选 Mesh @example const kind = this.kind(mesh); @returns 编辑类别或 null。 */
    private kind(mesh: Mesh): PointerOwner | null {
        // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
        if (mesh.data instanceof Rect2D) {
            return "rect";
        } else if (mesh.data instanceof NGon2D) {
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            return "ngon";
        } else if (mesh.data instanceof Poly2D) {
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            return "poly";
        } else if (mesh.data instanceof Text) {
            // 文字保持独立类型，只有异形后归 Base。
            return "text";
        } else if (mesh.data instanceof Base2D) {
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            return "base";
        } else {
            return null;
        }
    }

    /** @param mesh 候选 Mesh @example const allowed = this.isMeshEnabled(mesh); @returns 是否由当前合并编辑器管理。 */
    private isMeshEnabled(mesh: Mesh): boolean {
        const kind = this.kind(mesh);
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (kind === "base") {
            return true;
        } else if (kind === "rect" || kind === "ngon" || kind === "poly" || kind === "text") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            return this.isEnabled(kind);
        } else {
            return false;
        }
    }

    /** @param kind 几何种类 @example const allowed = this.isEnabled("rect"); @returns 对应开关。 */
    private isEnabled(kind: EditorShape): boolean {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (kind === "rect") {
            return this._rect;
        } else if (kind === "ngon") {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            return this._ngon;
        } else if (kind === "poly") {
            // Poly 与 Group 使用不同开关，禁用一种不影响另一种。
            return this._poly;
        } else if (kind === "text") {
            // 文字开关同时决定查询和创建入口。
            return this._text;
        } else {
            return this._group;
        }
    }

    /** @example this.refreshEnabled(); @returns 无返回值。 */
    private refreshEnabled(): void {
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (!this.isEnabled(this._shape)) {
            // 依据当前模式和形状所有权分派输入，保持选择状态一致。
            if (this._rect) {
                this._shape = "rect";
            } else if (this._ngon) {
                // 依据当前模式和形状所有权分派输入，保持选择状态一致。
                this._shape = "ngon";
            } else if (this._poly) {
                // 依据当前模式和形状所有权分派输入，保持选择状态一致。
                this._shape = "poly";
            } else if (this._text) {
                // 其他创建类型关闭时可回退到文字模式。
                this._shape = "text";
            } else if (this._group) {
                // 普通形状都关闭时仍可单独操作层级组。
                this._shape = "group";
            }
        }
        /** @param mesh 当前选中对象 @example IsAllowed(mesh); @returns 当前开关是否仍允许编辑。 */
        const IsAllowed = (mesh: Mesh): boolean => this.isMeshEnabled(mesh);
        this.setSelection(this.actives.filter(IsAllowed));
    }

    /** @param next 下一个完整选择集 @example this.setSelection(meshes); @returns 无返回值。 */
    private setSelection(next: Mesh[]): void {
        // 关闭多选后仍可能收到子工具的增选回调，统一保留最后一个成员。
        if (!this._mult && next.length > 1) {
            next = next.slice(-1);
        }
        /** @param mesh 下次选择成员 @example WasAdded(mesh); @returns 是否是新增选择。 */
        const WasAdded = (mesh: Mesh): boolean => !this.actives.includes(mesh);
        /** @param mesh 原选择成员 @example WasRemoved(mesh); @returns 是否本次移除。 */
        const WasRemoved = (mesh: Mesh): boolean => !next.includes(mesh);
        const added = next.filter(WasAdded);
        const changed = added.length > 0 || this.actives.some(WasRemoved);
        this._orders.sync(this.documentNodes(), next, this._raiseSelected);
        // 依据当前模式和形状所有权分派输入，保持选择状态一致。
        if (changed) {
            this.actives = next;
            this.active = added;
            this.syncToolSelection();
            // 当前模式独占此类输入，避免多个编辑器同时响应。
            if (this._activeType === "group") {
                this._groupTransform.setSelection(next);
            }
            // 依次处理当前集合，保持对象顺序并避免遗漏成员。
            for (const callback of this._onSelectionChange.values()) {
                callback([...next]);
            }
        }
    }

    /** @example this.syncToolSelection(); @returns 无返回值。 */
    private syncToolSelection(): void {
        this._syncing = true;
        let visible: Mesh[] = this.actives;
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this._activeType === "group") {
            visible = [];
        }
        /** @param mesh 当前选择成员 @example IsRect(mesh); @returns 是否归矩形工具管理。 */
        const IsRect = (mesh: Mesh): boolean => mesh.data instanceof Rect2D;
        /** @param mesh 当前选择成员 @example IsNGon(mesh); @returns 是否归正多边形工具管理。 */
        const IsNGon = (mesh: Mesh): boolean => mesh.data instanceof NGon2D;
        /** @param mesh 当前选择成员 @example IsPoly(mesh); @returns 是否归多边形工具管理。 */
        const IsPoly = (mesh: Mesh): boolean => mesh.data instanceof Poly2D;
        /** @param mesh 当前选择成员 @example IsBase(mesh); @returns 是否归 Base 工具管理。 */
        const IsBase = (mesh: Mesh): boolean => mesh.data instanceof Base2D;
        this.rectEditTool.select(visible.filter(IsRect));
        this.ngonEditTool.select(visible.filter(IsNGon));
        this.polyEditTool.select(visible.filter(IsPoly));
        /** @param mesh 一个实体 @example IsText(mesh); @returns 是否是文字。 */
        const IsText = (mesh: Mesh): boolean => mesh.data instanceof Text;
        this.textEditTool.select(visible.filter(IsText));
        this.baseEditTool.select(visible.filter(IsBase));
        this._syncing = false;
    }

    /** @example this.syncToolModes(); @returns 无返回值。 */
    private syncToolModes(): void {
        let mode: "view" | "edit" | "add" | "sub" = "view";
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this._activeType !== "group") {
            mode = this._activeType;
        }
        this.rectEditTool.activeType = mode;
        this.ngonEditTool.activeType = mode;
        this.polyEditTool.activeType = mode;
        this.textEditTool.activeType = mode;
    }

    /** @example this.syncFromTools(); @returns 无返回值。 */
    private syncFromTools(): void {
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (!this._syncing && this._activeType !== "group") {
            const all = [
                ...this.rectEditTool.actives,
                ...this.ngonEditTool.actives,
                ...this.polyEditTool.actives,
                ...this.textEditTool.actives,
                ...this.baseEditTool.actives,
            ];
            this.setSelection([...new Set(all)]);
        }
    }

    /**
     * 集合与子工具共用的转换事务，先准备几何，再解除旧装饰并分派新的归属。
     * @param meshes 请求转换的选择子集
     * @example this.convertToBase(this.rectEditTool.actives);
     * @returns 本次实际转成 Base 的对象。
     */
    private convertToBase(meshes: readonly Mesh[]): Mesh[] {
        this.textEditTool.finishEditing();
        this._history.commit();
        this.cancel();
        const candidates = this.scene.ensureLists();
        const previous = new Map<Mesh, Geometry2d>();
        const valid: Mesh[] = [];
        // 子工具只能转换仍在场景中的当前选择，空文字退出后的对象不能重新加入。
        for (const mesh of meshes) {
            const geometry = mesh.data;
            // 已是 Base 的实体保留自身数据，不增加撤销记录或重复事件。
            if (this.actives.includes(mesh) && candidates.includes(mesh) && geometry !== undefined &&
                !(geometry instanceof Base2D) && !(mesh instanceof IMesh) && !mesh.noSelect) {
                previous.set(mesh, geometry);
                valid.push(mesh);
            }
        }
        const change = new BaseChange(valid, this.sourceStyle.bind(this));
        // 所有几何准备成功之后才替换场景资源，保持本次转换的完整性。
        if (change.meshes.length > 0) {
            /** @example Apply(); @returns 无返回值，所有转换与选择归属变化共用一次历史。 */
            const Apply = (): void => {
                this._syncing = true;
                try {
                    this.rectEditTool.select([]);
                    this.ngonEditTool.select([]);
                    this.polyEditTool.select([]);
                    this.textEditTool.select([]);
                    this.baseEditTool.select([]);
                } finally {
                    this._syncing = false;
                }
                change.redo();
                this.syncToolSelection();
                this.update();
            };
            this._history.batch(Apply);
            // 集合和原所属工具各收到一次已完成的转换通知。
            for (const mesh of change.meshes) {
                const original = previous.get(mesh);
                // 请求列表与准备结果同源，缺失对象不应假造原类型。
                if (original !== undefined) {
                    this.notifyBase(mesh, original);
                }
            }
        }
        return [...change.meshes];
    }

    /** @param mesh 已完成降级的对象 @param previous 降级前的几何 @example this.notifyBase(mesh, rect); @returns 无返回值。 */
    private notifyBase(mesh: Mesh, previous: Geometry2d): void {
        // 子工具事件按旧类型分派，供调用方把旧参数面板切换为 Base 顶点编辑。
        if (previous instanceof Rect2D) {
            this.rectEditTool.notifyBase(mesh);
        } else if (previous instanceof NGon2D) {
            // 正多边形的参数控制交由自己的订阅者清理。
            this.ngonEditTool.notifyBase(mesh);
        } else if (previous instanceof Poly2D) {
            // 原轮廓工具释放顶点面板，后续由 Base 维护边界。
            this.polyEditTool.notifyBase(mesh);
        } else if (previous instanceof Text) {
            // 文字输入已结束，通知字体面板切换为顶点编辑。
            this.textEditTool.notifyBase(mesh);
        }
        // 同名注册只保留最后一个函数，其他订阅独立执行。
        for (const callback of this._onBase.values()) {
            callback(mesh);
        }
    }

    /** @param mesh 转为 Base2D 的原 Mesh @param previous 降级前几何 @example this.reassignConverted(mesh, rect); @returns 无返回值。 */
    private reassignConverted(mesh: Mesh, previous: Geometry2d): void {
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this.actives.includes(mesh) && this._activeType !== "group") {
            this.syncToolSelection();
        }
        this.notifyBase(mesh, previous);
    }

    /** @param meshes 编辑发生变化的 Mesh @example this.notifyEdit(meshes); @returns 无返回值。 */
    private notifyEdit(meshes: Mesh[]): void {
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (meshes.length > 0 && this._activeType !== "group") {
            this.syncToolSelection();
        }
    }
}

type EditorMode = "view" | "edit" | "add" | "sub" | "group";

type EditorShape = "rect" | "ngon" | "poly" | "text" | "group";

type SelectionOperation = "replace" | "add" | "sub";

type PointerOwner = "rect" | "ngon" | "poly" | "text" | "base" | "move" | "group" | "selection" | "hierarchy" | "groupCreate";

interface SelectionGesture {
    pointerId: number;
    first: Vec2;
    current: Vec2;
    operation: SelectionOperation;
}

/** 新建形状的构造偏好；运行中也可通过子工具修改。 */
interface EditorOptions {
    /** 新建 NGon2D 的填充 UV 模式。 */
    ngonUVMode?: NGonUVMode;
    /** 是否允许普通图形互相作为父子节点，默认关闭。 */
    nest?: boolean;
}

export default Editor;
export { default as EditorGroup } from "./Collection/EditorGroup";
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorNodeData } from "./Collection/document";
export type { EditorMaterialData, EditorStyleData, EditorTextureData } from "./Collection/resources";
export type { EditSwitches } from "./EditSwitches";
export { default as EditorKey } from "./key";
export { Editor };
export type { EditorMode, EditorOptions, EditorShape };
