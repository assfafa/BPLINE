import type { TextAlign, TextBaseline } from "bpmatrixjs/Geometry/Text";
import { Vec2 } from "bpmatrixjs/Math";
import type Camera from "../../Camera";
import Rect2D from "../../Geometry/Rect2D";
import type { Material2d } from "../../global-types";
import Group from "../../Group";
import IMesh from "../../IMesh";
import BaseMaterial from "../../Material/baseMaterial";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import Scene from "../../Scene";
import TextSelectTool from "../../Select/TextSelectTool";
import Style from "../../Style";
import type { TextWritingMode } from "../../Text";
import Text, { Font } from "../../Text";
import { MeasureText } from "../../Text/layout";
import type { BaseDelegate } from "../Collection/BaseChange";
import BaseChange from "../Collection/BaseChange";
import EditHistory from "../Collection/History";
import type { OrderSource } from "../Collection/Order";
import textCursorUrl from "../cursors/cursor-text.svg?url";
import type { EditSwitches } from "../EditSwitches";
import type { RectEditMode, RectEditOrigin, SelectionOperation } from "../RectEditTool";
import RectEditTool from "../RectEditTool";
import { ApplyRectStyle } from "../RectEditTool/data";
import type { SnapOptions } from "../Snap";
import type { TextEditDocument, TextEditRecord } from "./data";
import { CaptureText } from "./data";
import TextEditEvents from "./events";
import TextInput from "./input";

/** 文字以排版框编辑变换；二次单击进入输入，文字本身没有轮廓关键点。 */
class TextEditTool extends TextEditEvents {
    /** 文字实体所在场景。 */
    public readonly scene: Scene;
    /** 提供画布与像素尺寸的渲染器。 */
    public readonly render: Render;
    /** 屏幕定位相机。 */
    public readonly camera: Camera;
    /** 文字包围盒点选、框选和行列查询。 */
    public readonly selector: TextSelectTool;
    /** 文字编辑器场景节点。 */
    public readonly group: Group = new Group(0, 0);
    /** 文字实体组。 */
    public readonly meshGroup: Group = new Group(0, 0);
    /** 排版框与旋转手柄所在覆盖层。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 当前选中对象。 */
    public actives: Mesh[] = [];
    /** 最近一批新选中对象。 */
    public active: Mesh[] = [];
    /** 下一次创建文字使用的注册字体名；空串自动取 Font.map 第一项。 */
    public fontFamily: string = "";
    /** 下一次创建文字的字号，默认 16。 */
    public fontSize: number = 16;
    /** 下一次创建文字的额外字间距。 */
    public letterSpacing: number = 0;
    /** 下一次创建文字的额外行间距。 */
    public lineSpacing: number = 0;
    /** 下一次文字的行对齐方式，默认 left。 */
    public textAlign: TextAlign = "left";
    /** 下一次文字的基线锚点。 */
    public baseline: TextBaseline = "middle";
    /** 下一次文字的排列顺序。 */
    public writingMode: TextWritingMode = "horizontal-tb";
    /** 下一次创建的实体是否抵消 zoom；不改变已有文字。 */
    public ignoreZoom: boolean = false;
    /** 新建或 push 导入文字的自动精度开关，默认开启；load 保留文档记录。 */
    public autoPrecision: boolean = true;
    /** 下一次新建文字的层级，默认 0；导入对象保留自己的 order。 */
    private _order: number = 0;
    private _orderSource: OrderSource | null = null;
    /** 是否接收编辑输入。 */
    public enabled: boolean = true;
    /** 是否由集合构建，集合组变换由上层统一接管。 */
    public readonly fromCollection: boolean;

    private readonly _controls: RectEditTool;
    private readonly _proxies = new Map<Mesh, TextProxy>();
    private readonly _history: EditHistory;
    private readonly _ownsHistory: boolean;
    private readonly _events: AbortController = new AbortController();
    private _input: TextInput | null = null;
    private _editingMesh: Mesh | null = null;
    private _editingStyle: Style | null = null;
    private _editingMaterial: Material2d | null = null;
    private _gesture: TextGesture | null = null;
    private _clipboard: Mesh[] = [];
    private _lastClient: Vec2 | null = null;
    private _clipboardClient: Vec2 | null = null;
    private _destroyed: boolean = false;
    private _activeOnly: boolean = true;
    private _data: TextEditRecord[] = [];
    private _dataSignature: string = "[]";
    private readonly _touchPointers = new Set<number>();
    private _baseDelegate: BaseDelegate | null = null;

    /**
     * 创建可独立或由集合转发的字体编辑器。
     * @param scene 文字所在场景
     * @param render 渲染器
     * @param camera 相机
     * @param autoBind 是否自动注册指针，默认开启
     * @param helper 是否显示网格，默认跟随 autoBind
     * @param fromCollection 是否由集合接管组模式
     * @param history 集合提供的跨类型历史；独立工具自动创建自己的历史
     * @example const tool = new TextEditTool(scene, render, camera);
     * @returns 文字编辑器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera,
        autoBind: boolean = true, helper: boolean = autoBind, fromCollection: boolean = false,
        history?: EditHistory) {
        super();
        this.scene = scene;
        // 集合只开启一次；显式选择四叉树的 Scene 保留调用方设置。
        if (!fromCollection && scene.box === null && scene.quad === null) {
            scene.box = camera;
        }
        this.render = render;
        this.camera = camera;
        this.selector = new TextSelectTool(scene, render, camera);
        this.group.add(this.meshGroup);
        this.group.add(this.frameGroup);
        scene.add(this.group);
        this._controls = new RectEditTool(new Scene(), render, camera, false, false, fromCollection);
        this._controls.activeOnly = false;
        this._controls.selectStyle.points.enabled = false;
        this._controls.snapScene = scene;
        this.frameGroup.add(this._controls.frameGroup);
        this.helper = helper;
        this._history = history ?? new EditHistory(this);
        this._ownsHistory = history === undefined;
        this.fromCollection = fromCollection;
        // 代理只存在于控制用 Scene，渲染 Scene 只接收独立的包围框和旋转箭头。
        for (const candidate of [...scene.ensureLists()]) {
            // 只收纳普通文字实体，保留其他形状和辅助节点的原归属。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect && candidate.data instanceof Text) {
                this.synchronizeStyle(candidate);
                candidate.autoPrecision = this.autoPrecision;
                // 嵌套文字保留父级，只有场景直属对象挪入本工具的模型组。
                if (candidate.parent === scene) {
                    this.meshGroup.add(candidate);
                }
            }
        }
        this._controls.onEdit("Text", this.syncTransforms.bind(this));
        this._controls.onMove("Text", this.notifyMove.bind(this));
        this._controls.onRotate("Text", this.notifyRotate.bind(this));
        this._controls.onResize("Text", this.notifyResize.bind(this));
        this._controls.onScale("Text", this.notifyScale.bind(this));
        const signal = this._events.signal;
        // 独立使用自动监听，集合构造只接收统一转发。
        if (autoBind) {
            render.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), { signal });
            window.addEventListener("pointermove", this.handlePointerMove.bind(this), { signal });
            window.addEventListener("pointerup", this.handlePointerUp.bind(this), { signal });
            window.addEventListener("pointercancel", this.handlePointerCancel.bind(this), { signal });
            window.addEventListener("blur", this.cancel.bind(this), { signal });
        }
        this.update();
    }

    /** @param scene 场景 @param render 渲染器 @param camera 相机 @param history 可选的集合历史 @example TextEditTool.build(scene, render, camera); @returns 无独立事件和网格的集合子工具。 */
    public static build(scene: Scene, render: Render, camera: Camera, history?: EditHistory): TextEditTool {
        return new TextEditTool(scene, render, camera, false, false, true, history);
    }

    /** @example const order = tool.order; @returns 下一次新建文字的层级，默认 0。 */
    public get order(): number {
        return this._order;
    }

    /** @param value 下一次新建文字的层级 @example tool.order = 3; @returns 无返回值。 */
    public set order(value: number) {
        // 层级进入保存记录和排序计算，拒绝非有限数值。
        if (Number.isFinite(value)) {
            this._order = value;
        } else {
            throw new RangeError("TextEditTool.order must be finite.");
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

    /** @example const value = tool.style; @returns 下一次创建的样式模板。 */
    public get style(): Style {
        return this._controls.style;
    }
    /** @param value 下一次创建的样式模板 @example tool.style = value; @returns 无返回值。 */
    public set style(value: Style) {
        this._controls.style = value;
    }

    /** @example const value = tool.material; @returns 下一次创建的材质模板。 */
    public get material(): Material2d {
        return this._controls.material;
    }
    /** @param value 下一次创建的材质模板 @example tool.material = value; @returns 无返回值。 */
    public set material(value: Material2d) {
        this._controls.material = value;
    }

    /** @example const value = tool.selectStyle; @returns 包围框选中样式；不创建文字关键点。 */
    public get selectStyle(): Style {
        return this._controls.selectStyle;
    }
    /** @param value 包围框选中样式；不创建文字关键点 @example tool.selectStyle = value; @returns 无返回值。 */
    public set selectStyle(value: Style) {
        this._controls.selectStyle = value;
    }

    /** @example const value = tool.activeOnly; @returns 首次单击只选择的开关。 */
    public get activeOnly(): boolean {
        return this._activeOnly;
    }
    /** @param value 首次单击只选择的开关 @example tool.activeOnly = value; @returns 无返回值。 */
    public set activeOnly(value: boolean) {
        this._activeOnly = value;
    }

    /** @example const value = tool.mult; @returns 多选开关。 */
    public get mult(): boolean {
        return this._controls.mult;
    }
    /** @param value 多选开关 @example tool.mult = value; @returns 无返回值。 */
    public set mult(value: boolean) {
        this._controls.mult = value;
    }

    /** @example const value = tool.radius; @returns 边角、旋转与吸附的屏幕容差。 */
    public get radius(): number {
        return this._controls.radius;
    }
    /** @param value 边角、旋转与吸附的屏幕容差 @example tool.radius = value; @returns 无返回值。 */
    public set radius(value: number) {
        this._controls.radius = value;
    }

    /** @example const value = tool.max; @returns 最大局部包围框面积。 */
    public get max(): number {
        return this._controls.max;
    }
    /** @param value 最大局部包围框面积 @example tool.max = value; @returns 无返回值。 */
    public set max(value: number) {
        this._controls.max = value;
    }

    /** @example const value = tool.maxWidth; @returns 最大局部包围框宽度。 */
    public get maxWidth(): number {
        return this._controls.maxWidth;
    }
    /** @param value 最大局部包围框宽度 @example tool.maxWidth = value; @returns 无返回值。 */
    public set maxWidth(value: number) {
        this._controls.maxWidth = value;
    }

    /** @example const value = tool.minWidth; @returns 最小局部包围框宽度。 */
    public get minWidth(): number {
        return this._controls.minWidth;
    }
    /** @param value 最小局部包围框宽度 @example tool.minWidth = value; @returns 无返回值。 */
    public set minWidth(value: number) {
        this._controls.minWidth = value;
    }

    /** @example const value = tool.maxHeight; @returns 最大局部包围框高度。 */
    public get maxHeight(): number {
        return this._controls.maxHeight;
    }
    /** @param value 最大局部包围框高度 @example tool.maxHeight = value; @returns 无返回值。 */
    public set maxHeight(value: number) {
        this._controls.maxHeight = value;
    }

    /** @example const value = tool.minHeight; @returns 最小局部包围框高度。 */
    public get minHeight(): number {
        return this._controls.minHeight;
    }
    /** @param value 最小局部包围框高度 @example tool.minHeight = value; @returns 无返回值。 */
    public set minHeight(value: number) {
        this._controls.minHeight = value;
    }

    /** @example const value = tool.left; @returns 最左世界活动范围。 */
    public get left(): number {
        return this._controls.left;
    }
    /** @param value 最左世界活动范围 @example tool.left = value; @returns 无返回值。 */
    public set left(value: number) {
        this._controls.left = value;
    }

    /** @example const value = tool.right; @returns 最右世界活动范围。 */
    public get right(): number {
        return this._controls.right;
    }
    /** @param value 最右世界活动范围 @example tool.right = value; @returns 无返回值。 */
    public set right(value: number) {
        this._controls.right = value;
    }

    /** @example const value = tool.top; @returns 最上世界活动范围。 */
    public get top(): number {
        return this._controls.top;
    }
    /** @param value 最上世界活动范围 @example tool.top = value; @returns 无返回值。 */
    public set top(value: number) {
        this._controls.top = value;
    }

    /** @example const value = tool.bottom; @returns 最下世界活动范围。 */
    public get bottom(): number {
        return this._controls.bottom;
    }
    /** @param value 最下世界活动范围 @example tool.bottom = value; @returns 无返回值。 */
    public set bottom(value: number) {
        this._controls.bottom = value;
    }

    /** @example const value = tool.origin; @returns 创建起点配置。 */
    public get origin(): RectEditOrigin {
        return this._controls.origin;
    }
    /** @param value 创建起点配置 @example tool.origin = value; @returns 无返回值。 */
    public set origin(value: RectEditOrigin) {
        this._controls.origin = value;
    }

    /** @example const value = tool.translationStep; @returns 世界原点平移步进。 */
    public get translationStep(): number {
        return this._controls.translationStep;
    }
    /** @param value 世界原点平移步进 @example tool.translationStep = value; @returns 无返回值。 */
    public set translationStep(value: number) {
        this._controls.translationStep = value;
    }

    /** @example const value = tool.translationStepEnabled; @returns 平移步进开关。 */
    public get translationStepEnabled(): boolean {
        return this._controls.translationStepEnabled;
    }
    /** @param value 平移步进开关 @example tool.translationStepEnabled = value; @returns 无返回值。 */
    public set translationStepEnabled(value: boolean) {
        this._controls.translationStepEnabled = value;
    }

    /** @example const value = tool.rotationStep; @returns 旋转步进角度。 */
    public get rotationStep(): number {
        return this._controls.rotationStep;
    }
    /** @param value 旋转步进角度 @example tool.rotationStep = value; @returns 无返回值。 */
    public set rotationStep(value: number) {
        this._controls.rotationStep = value;
    }

    /** @example const value = tool.rotationStepEnabled; @returns 旋转步进开关。 */
    public get rotationStepEnabled(): boolean {
        return this._controls.rotationStepEnabled;
    }
    /** @param value 旋转步进开关 @example tool.rotationStepEnabled = value; @returns 无返回值。 */
    public set rotationStepEnabled(value: boolean) {
        this._controls.rotationStepEnabled = value;
    }

    /** @example const value = tool.rotationEnabled; @returns 单体与组旋转开关。 */
    public get rotationEnabled(): boolean {
        return this._controls.rotationEnabled;
    }
    /** @param value 单体与组旋转开关 @example tool.rotationEnabled = value; @returns 无返回值。 */
    public set rotationEnabled(value: boolean) {
        this._controls.rotationEnabled = value;
    }

    /** @example const value = tool.snap; @returns 吸附总开关。 */
    public get snap(): boolean {
        return this._controls.snap;
    }
    /** @param value 吸附总开关 @example tool.snap = value; @returns 无返回值。 */
    public set snap(value: boolean) {
        this._controls.snap = value;
    }

    /** @example const value = tool.snapOptions; @returns 四类包围框吸附开关。 */
    public get snapOptions(): SnapOptions {
        return this._controls.snapOptions;
    }
    /** @param value 四类包围框吸附开关 @example tool.snapOptions = value; @returns 无返回值。 */
    public set snapOptions(value: SnapOptions) {
        this._controls.snapOptions = value;
    }

    /** @example const value = tool.constrain; @returns 锁轴移动与等比四角缩放。 */
    public get constrain(): boolean {
        return this._controls.constrain;
    }
    /** @param value 锁轴移动与等比四角缩放 @example tool.constrain = value; @returns 无返回值。 */
    public set constrain(value: boolean) {
        this._controls.constrain = value;
    }

    /** @example const value = tool.switches; @returns 独立交互功能开关。 */
    public get switches(): EditSwitches {
        return this._controls.switches;
    }
    /** @param value 独立交互功能开关 @example tool.switches = value; @returns 无返回值。 */
    public set switches(value: EditSwitches) {
        this._controls.switches = value;
    }

    /** @example const value = tool.helper; @returns 网格显示开关。 */
    public get helper(): boolean {
        return this._controls.helper;
    }
    /** @param value 网格显示开关 @example tool.helper = value; @returns 无返回值。 */
    public set helper(value: boolean) {
        this._controls.helper = value;
        const grid = this._controls.helperGrid;
        // 代理控制器的 Scene 不渲染，网格仍需归属真实场景。
        if (grid !== null) {
            this.scene.add(grid.mesh);
            this.scene.add(grid.rulerMesh);
        }
    }

    /** @example const mode = tool.activeType; @returns 当前变换模式。 */
    public get activeType(): RectEditMode {
        return this._controls.activeType;
    }
    /** @param value 查看、编辑、增减选或组模式 @example tool.activeType = "edit"; @returns 无返回值。 */
    public set activeType(value: RectEditMode) {
        // 相同模式同步不应结束正在进行的文字输入。
        if (value !== this.activeType) {
            this.finishEditing();
            this._controls.activeType = value;
            this.emit(this._onModeChange, value);
            this.update();
        }
    }
    /** @example const input = tool.input; @returns 当前输入控件或 null。 */
    public get input(): HTMLTextAreaElement | null {
        return this._input?.element ?? null;
    }
    /** @example const editing = tool.editing; @returns 是否处于文字输入状态。 */
    public get editing(): boolean {
        return this._input !== null;
    }
    /** @example const moving = tool.movingMeshes; @returns 当前正在平移的文字实体。 */
    public get movingMeshes(): Mesh[] {
        return this.mapProxies(this._controls.movingMeshes);
    }

    /** @example tool.selectAll(); @returns 无返回值，选择全部可编辑文字并遵循 mult 开关。 */
    public selectAll(): void {
        this.select(this.meshes());
    }

    /**
     * 接收合并编辑器统一平移后的通知，不通过矩形代理重复变换文字。
     * @param meshes 已移动的文字成员
     * @example tool.notifyExternalMove([mesh]);
     * @returns 无返回值。
     */
    public notifyExternalMove(meshes: Mesh[]): void {
        // 移动实际文字后重建代理位置，保留输入会话和原排版参数。
        if (meshes.length > 0) {
            this.emit(this._onMove, [...meshes]);
            this.emit(this._onPositionChange, [...meshes]);
            this.emit(this._onEdit, [...meshes]);
            this.update();
        }
    }
    /** @example const records = tool.data; @returns 可绑定到状态框架的文字数据。 */
    public get data(): readonly TextEditRecord[] {
        this.refreshData();
        return this._data;
    }
    /** @example const count = tool.undoCount; @returns 对象操作的可撤销数量。 */
    public get undoCount(): number {
        return this._history.undoCount;
    }
    /** @example const count = tool.redoCount; @returns 对象操作的可重做数量。 */
    public get redoCount(): number {
        return this._history.redoCount;
    }

    /** @param mesh 文字实体 @example tool.sourceStyle(mesh); @returns 未被输入隐去的原始样式。 */
    public sourceStyle(mesh: Mesh): Style {
        // 输入使用独立临时材质，历史和保存始终读取用户样式。
        if (mesh === this._editingMesh && this._editingStyle !== null) {
            return this._editingStyle;
        } else {
            return mesh.style ?? mesh.data?.style ?? new Style();
        }
    }

    /** @param mesh 文字实体 @example tool.sourceMaterial(mesh); @returns 输入时被临时隐藏前的用户材质。 */
    public sourceMaterial(mesh: Mesh): Material2d | undefined {
        // 当前输入面使用透明副本，文档与历史必须读取原材质。
        if (mesh === this._editingMesh && this._editingMaterial !== null) {
            return this._editingMaterial;
        } else {
            return mesh.material;
        }
    }

    /** @param meshes 对象或对象 ID @param operation 替换、增选或减选 @example tool.select(mesh); @returns 无返回值。 */
    public select(meshes: Mesh | number | readonly (Mesh | number)[], operation: SelectionOperation = "replace"): void {
        let inputs: readonly (Mesh | number)[];
        // 代码调用也支持单个运行期 ID。
        if (Array.isArray(meshes)) {
            inputs = meshes;
        } else {
            inputs = [meshes as Mesh | number];
        }
        const candidates = this.meshes();
        const wanted: Mesh[] = [];
        // 逐一解析调用方传入的对象或 ID，并保持请求顺序。
        for (const input of inputs) {
            /** @param mesh 候选实体 @example Matches(mesh); @returns 是否是请求的对象。 */
            const Matches = (mesh: Mesh): boolean => mesh === input || mesh.id === input;
            const mesh = candidates.find(Matches);
            // 无效 ID 不改变选择，存在的实体才加入候选。
            if (mesh !== undefined) {
                wanted.push(mesh);
            }
        }
        let next = wanted;
        // 增减选沿用其他工具的集合语义。
        if (operation === "add") {
            next = [...new Set([...this.actives, ...wanted])];
        } else if (operation === "sub") {
            // 减选保留没有被本次请求移除的成员。
            /** @param mesh 原选中成员 @example Keep(mesh); @returns 是否未被减去。 */
            const Keep = (mesh: Mesh): boolean => !wanted.includes(mesh);
            next = this.actives.filter(Keep);
        }
        // 单选模式保留最后一个请求，避免出现隐式多选。
        if (!this.mult && next.length > 1) {
            console.warn("TextEditTool.select: mult is disabled; using the last Mesh.");
            next = next.slice(-1);
        }
        // 移除正在输入的对象时先结束输入，避免隐藏样式遗留。
        if (this._editingMesh !== null && !next.includes(this._editingMesh)) {
            this.finishEditing();
        }
        /** @param mesh 新成员 @example Added(mesh); @returns 是否新增选择。 */
        const Added = (mesh: Mesh): boolean => !this.actives.includes(mesh);
        /** @param mesh 旧成员 @example Removed(mesh); @returns 是否取消选择。 */
        const Removed = (mesh: Mesh): boolean => !next.includes(mesh);
        const added = next.filter(Added);
        const removed = this.actives.filter(Removed);
        this.actives = [...new Set(next)];
        this.active = added;
        this.syncProxies();
        this._controls.select(this.proxySelection());
        // 取消选择立即摘除该文字的包围框。
        for (const mesh of removed) {
            this._proxies.get(mesh)?.frame.removeSelf();
        }
        // 只在真正移除成员时通知取消选择。
        if (removed.length > 0) {
            this.emit(this._onDeselect, removed, [...this.actives]);
        }
        // 只通知新增成员，不把原有选择重复作为新增。
        if (added.length > 0) {
            this.emit(this._onSelect, added, [...this.actives]);
        }
        // 选择集改变才通知状态管理层。
        if (added.length > 0 || removed.length > 0) {
            this.emit(this._onSelectionChange, [...this.actives]);
        }
        this.update();
    }

    /** @param meshes 新增字体 Mesh @example tool.push(mesh); @returns 实际加入场景的文字。 */
    public push(meshes: Mesh | readonly Mesh[]): Mesh[] {
        this._history.begin();
        let inputs: readonly Mesh[];
        // 单个对象和数组进入同一导入流程。
        if (meshes instanceof Mesh) {
            inputs = [meshes];
        } else {
            inputs = meshes;
        }
        const added: Mesh[] = [];
        // 不从 Text 强制创建 Base；导入无效类型保留给其他编辑器。
        for (const mesh of inputs) {
            // 导入只能接收普通文字实体，其他几何由集合分派。
            if (mesh.data instanceof Text && !mesh.noSelect && !(mesh instanceof IMesh)) {
                this.synchronizeStyle(mesh);
                mesh.autoPrecision = this.autoPrecision;
                // 已在场景中的对象保持父级；仅新增对象触发 onAdd。
                if (!this.scene.ensureLists().includes(mesh)) {
                    this.meshGroup.add(mesh);
                    this.emit(this._onAdd, mesh);
                }
                added.push(mesh);
            }
        }
        this._history.commit();
        this.update();
        return added;
    }

    /** @param mesh 需要输入的文字 @param client 可选鼠标插入位置 @example tool.beginEditing(mesh); @returns 是否进入文字输入。 */
    public beginEditing(mesh: Mesh, client?: Vec2): boolean {
        // 查看模式和已转 Base 的实体不接受文字输入。
        if (this.enabled && this.activeType === "edit" && mesh.data instanceof Text) {
            this.finishEditing();
            this.select(mesh);
            this._history.begin();
            this._editingMesh = mesh;
            this._editingStyle = mesh.style ?? mesh.data.style;
            this._editingMaterial = mesh.material ?? new BaseMaterial(this._editingStyle);
            const hidden = this._editingStyle.clone();
            hidden.solid.opacity = 0;
            hidden.edge.opacity = 0;
            hidden.wireframe.opacity = 0;
            hidden.points.opacity = 0;
            mesh.material = CloneMaterial(this._editingMaterial, hidden);
            mesh.style = hidden;
            this._input = new TextInput(mesh, this.camera, this.render, this._editingStyle.solid.color.toHex(true),
                this._history.begin.bind(this._history), this.inputChanged.bind(this), this.finishEditing.bind(this),
                this.save.bind(this));
            // 鼠标进入输入时使用点击位置；代码调用默认光标在末尾。
            if (client !== undefined) {
                const caret = this.selector.locate(mesh, client);
                // 退化变换没有可用光标位置，保留原生默认位置。
                if (caret !== null) {
                    this._input.setCaret(caret.index);
                }
            }
            return true;
        } else {
            return false;
        }
    }

    /** @example tool.finishEditing(); @returns 无返回值，提交输入；空串退出时移除实体，撤销可恢复。 */
    public finishEditing(): void {
        const mesh = this._editingMesh;
        // 每个会话只恢复一次原材质，切换对象不留下透明字形。
        if (mesh !== null && this._editingStyle !== null && this._editingMaterial !== null) {
            const temporary = mesh.material;
            this._input?.destroy();
            this._input = null;
            mesh.material = this._editingMaterial;
            mesh.style = this._editingStyle;
            temporary?.dispose();
            this._editingMesh = null;
            this._editingStyle = null;
            this._editingMaterial = null;
            // 空输入只在结束会话时删除，打字期间仍保留最小编辑框和光标。
            if (mesh.data instanceof Text && mesh.data.text.length === 0) {
                mesh.removeSelf();
                /** @param selected 当前选中成员 @example Keep(selected); @returns 是否不是已删除的空文字。 */
                const Keep = (selected: Mesh): boolean => selected !== mesh;
                this.select(this.actives.filter(Keep));
                this.emit(this._onRemove, mesh);
            }
            this._history.commit();
        }
    }

    /** @param event 左键或单指事件 @example tool.handlePointerDown(event); @returns 无返回值。 */
    public handlePointerDown(event: PointerEvent): void {
        const client = new Vec2(event.clientX, event.clientY);
        this._lastClient = client;
        // 触点数量独立维护，多指交给相机。
        if (event.pointerType === "touch") {
            this._touchPointers.add(event.pointerId);
            // 第二根手指取消实体编辑，防止与镜头操作冲突。
            if (this._touchPointers.size > 1) {
                this.cancel();
            }
        }
        const accepted = (event.pointerType === "touch" && this._touchPointers.size === 1) ||
            (event.pointerType === "mouse" && event.button === 0 && this._touchPointers.size === 0);
        // 浏览器输入控件自行处理文字拖选，画布事件只处理对象。
        if (this.enabled && !this._destroyed && this.activeType !== "view" && accepted) {
            // 新建 textarea 已取得焦点，阻止本次画布按下的默认动作再次把焦点抢走。
            event.preventDefault();
            // 空文字退出时会删除对象，仍须保留按下前的选择语义。
            const hadSelection = this.actives.length > 0;
            this.finishEditing();
            this.syncProxies();
            const hit = this.pickMesh(client);
            const rotation = this.pickRotationHandle(client);
            const target = rotation ?? hit;
            const alreadySelected = target !== null && this.actives.includes(target);
            this._history.begin();
            // 已进入文字输入时，点另一个文字直接切换输入。
            if (this.activeType === "group" || this.activeType === "add" || this.activeType === "sub") {
                // 增减选和单独文字组变换仍复用矩形排版框，结束时映射选择。
                this._gesture = { first: client, target, canInput: false, moved: false };
                this._controls.handlePointerDown(event);
            } else if (target !== null) {
                // 已有文字命中进入对象选择与变换流程。
                let operation: SelectionOperation = "replace";
                // 多选开启时保留之前已选中的文字。
                if (this.mult) {
                    operation = "add";
                }
                // 点选关闭时只允许操作既有选择。
                if (this.switches.pick) {
                    this.select(target, operation);
                }
                // 首次单击只选中，后续按下允许拖动；只有不拖动的内部点击进入输入。
                if (alreadySelected || !this.activeOnly) {
                    const body = this._controls.cursorAt(client).endsWith(", move");
                    this._gesture = { first: client, target, canInput: alreadySelected && body, moved: false };
                    this._controls.handlePointerDown(event);
                }
            } else if (hadSelection) {
                // 第一次空白点击只取消选择，下一次点击才能进入新建输入。
                if (this.switches.pick) {
                    this.select([]);
                }
            } else if (this.switches.create) {
                // 文字新建采用单击空白立即输入，不以拖框决定字号。
                if (Font.map.size > 0) {
                    const style = this.style.clone();
                    style.points.enabled = false;
                    let family = this.fontFamily;
                    // 未指定字体时统一使用注册表第一项。
                    if (family.length === 0) {
                        family = Font.map.keys().next().value ?? "";
                    }
                    const geometry = new Text("", this.fontSize, family, { letterSpacing: this.letterSpacing,
                        lineSpacing: this.lineSpacing, textAlign: this.textAlign, baseline: this.baseline,
                        writingMode: this.writingMode });
                    const mesh = new Mesh(geometry, CloneMaterial(this.material, style), style);
                    mesh.order = this.order;
                    const world = this.camera.windowToWorld(client, this.render);
                    mesh.position.set(world.x, world.y);
                    mesh.ignoreZoom = this.ignoreZoom;
                    mesh.autoPrecision = this.autoPrecision;
                    this.meshGroup.add(mesh);
                    this.emit(this._onAdd, mesh);
                    this.select(mesh);
                    this.beginEditing(mesh);
                } else {
                    console.warn("TextEditTool: await Font.register(...) before creating text.");
                }
            } else if (this.switches.pick) {
                // 无可用编辑动作时仅清空选择，不创建代理实体。
                this.select([]);
            }
        }
    }

    /** @param event 当前指针 @example tool.handlePointerMove(event); @returns 无返回值。 */
    public handlePointerMove(event: PointerEvent): void {
        const client = new Vec2(event.clientX, event.clientY);
        this._lastClient = client;
        const gesture = this._gesture;
        // 输入光标由 textarea 管理，拖动实体才转发矩形控制器。
        if (gesture !== null) {
            gesture.moved = gesture.moved || Math.hypot(client.x - gesture.first.x, client.y - gesture.first.y) > 3;
            this._controls.handlePointerMove(event);
            this.syncTransforms();
        } else {
            // textarea 保留自己的输入光标，画布上的旋转手柄仍需要更新提示。
            this.render.canvas.style.cursor = this.cursorAt(client);
        }
        this.update();
    }

    /** @param event 松开指针 @example tool.handlePointerUp(event); @returns 无返回值。 */
    public handlePointerUp(event: PointerEvent): void {
        this._touchPointers.delete(event.pointerId);
        const gesture = this._gesture;
        // 手势结束后才重建文字代理的尺寸，避免把缩放结果逐帧累乘。
        if (gesture !== null) {
            this._controls.handlePointerUp(event);
            this.syncTransforms();
            this._gesture = null;
            this.select(this.mapProxies(this._controls.actives));
            // 集合还要在松开后改父级，统一历史留给集合完成层级拖放后提交。
            if (this._ownsHistory) {
                this._history.commit();
            }
            // 内部点击且未拖动才进入文字输入，边角变换不触发输入。
            if (!gesture.moved && gesture.canInput && gesture.target !== null && this.switches.pick) {
                this.beginEditing(gesture.target, new Vec2(event.clientX, event.clientY));
            }
        } else if (!this.editing && this._ownsHistory) {
            // 新建文字进入输入后保持事务，退出时把内容或空对象删除一起提交。
            this._history.commit();
        }
        this.update();
    }

    /** @param event 取消事件 @example tool.handlePointerCancel(event); @returns 无返回值。 */
    public handlePointerCancel(event: PointerEvent): void {
        this._touchPointers.delete(event.pointerId);
        this._controls.handlePointerCancel(event);
        this._gesture = null;
        this._history.cancel();
        this.update();
    }

    /** @example tool.cancel(); @returns 无返回值。 */
    public cancel(): void {
        this._controls.cancel();
        this._gesture = null;
        this.finishEditing();
        this._history.cancel();
    }

    /** @param client 鼠标窗口坐标 @example tool.pickMesh(client); @returns 包围框或边角命中的文字实体。 */
    public pickMesh(client: Vec2): Mesh | null {
        this.syncProxies();
        const proxy = this._controls.pickMesh(client);
        let result: Mesh | null;
        // 边角容差先匹配选中代理，普通区域再由 TextSelectTool 查询。
        if (proxy !== null) {
            result = this.mapProxies([proxy]).at(0) ?? null;
        } else {
            result = this.selector.SelectPicker(new MouseEvent("mousemove", { clientX: client.x, clientY: client.y })).at(0) ?? null;
        }
        return result;
    }

    /** @param client 鼠标窗口坐标 @example tool.pickRotationHandle(client); @returns 旋转图标所属文字或 null。 */
    public pickRotationHandle(client: Vec2): Mesh | null {
        return this.mapProxies([this._controls.pickRotationHandle(client)])[0] ?? null;
    }
    /** @param client 鼠标窗口坐标 @example tool.cursorAt(client); @returns 文字输入或变换操作的 CSS 光标。 */
    public cursorAt(client: Vec2): string {
        const rotationTarget = this.pickRotationHandle(client);
        const target = rotationTarget ?? this.pickMesh(client);
        let cursor: string;
        // 空白文字创建和已在输入的状态均使用 Phosphor I-beam。
        if (this.activeType === "view") {
            cursor = this._controls.cursorAt(client);
        } else if (rotationTarget !== null) {
            // 旋转图标在排版框外，必须优先于空白新建和当前输入状态判断。
            cursor = this._controls.cursorAt(client);
        } else if (this.editing || (target !== null && this.activeOnly && !this.actives.includes(target))) {
            // 未选中且仅编辑选中对象时，不提前显示无效的缩放或平移光标。
            cursor = `url("${textCursorUrl}") 16 16, text`;
        } else if (target === null) {
            // 禁用新建后空白区域不再提示文字输入。
            if (this.switches.create) {
                cursor = `url("${textCursorUrl}") 16 16, text`;
            } else {
                cursor = "default";
            }
        } else {
            cursor = this._controls.cursorAt(client);
        }
        return cursor;
    }

    /** @example tool.update(); @returns 无返回值，同步包围框和输入面。 */
    public update(): void {
        // 销毁后的工具不再更新代理和 DOM 控件。
        if (!this._destroyed) {
            this.syncProxies();
            this._controls.update();
            // 每个文字只显示一条独立包围框，关键点始终关闭。
            for (const [mesh, entry] of this._proxies) {
                // 组模式由组合框接管，只在单体模式显示文字框。
                if (this.actives.includes(mesh) && this.activeType !== "group") {
                    this.frameGroup.add(entry.frame);
                    const geometry = entry.frame.data as Rect2D;
                    const text = mesh.data;
                    // 类型已移交 Base 的对象不再更新字体排版框。
                    if (text instanceof Text) {
                        const bounds = MeasureText(text);
                        geometry.width = bounds.width;
                        geometry.height = bounds.height;
                        // 只有模板内容改变才复制样式，稳定帧复用材质和包围框。
                        if (entry.style !== this.selectStyle || entry.styleVersion !== this.selectStyle.version) {
                            const style = this.selectStyle.clone();
                            style.points.enabled = false;
                            style.solid.enabled = false;
                            style.edge.pixelAligned = "px";
                            entry.frame.style = style;
                            entry.style = this.selectStyle;
                            entry.styleVersion = this.selectStyle.version;
                        }
                        entry.frame.ignoreZoom = mesh.ignoreZoom;
                        this.positionFrame(entry.frame, mesh, (bounds.left + bounds.right) / 2,
                            (bounds.bottom + bounds.top) / 2);
                    }
                } else {
                    entry.frame.removeSelf();
                }
            }
            this._input?.update();
            this.refreshData();
        }
    }

    /** @example tool.undo(); @returns 是否撤销了对象编辑。 */
    public undo(): boolean {
        this.finishEditing();
        return this._history.undo();
    }
    /** @example tool.redo(); @returns 是否重做了对象编辑。 */
    public redo(): boolean {
        this.finishEditing();
        return this._history.redo();
    }

    /** @param mesh 要删除的字体实体 @example tool.remove(mesh); @returns 是否删除。 */
    public remove(mesh: Mesh): boolean {
        this._history.begin();
        // 仅删除本工具管理的实体，其他工具的对象不受影响。
        if (this.meshes().includes(mesh)) {
            /** @param selected 当前选择 @example Keep(selected); @returns 是否保留。 */
            const Keep = (selected: Mesh): boolean => selected !== mesh;
            this.select(this.actives.filter(Keep));
            mesh.removeSelf();
            this.emit(this._onRemove, mesh);
            this._history.commit();
            return true;
        } else {
            this._history.commit();
            return false;
        }
    }
    /** @internal @param delegate 集合接管函数 @example tool.setBaseDelegate(convert); @returns 无返回值。 */
    public setBaseDelegate(delegate: BaseDelegate): void {
        this._baseDelegate = delegate;
    }

    /**
     * 结束文字输入并把已选文字转为可编辑轮廓的 Base2D。
     * @example const meshes = tool.toBase();
     * @returns 本次实际降级的 Mesh，整批转换可撤销为原文字。
     */
    public toBase(): Mesh[] {
        // 集合拥有选择与历史，直接调用子工具也必须移交集合。
        if (typeof this._baseDelegate === "function") {
            return this._baseDelegate([...this.actives]);
        } else {
            this.finishEditing();
            this._history.commit();
            this.cancel();
            const change = new BaseChange(this.actives, this.sourceStyle.bind(this));
            // 空文字退出输入时已删除，空选择不产生转换事件。
            if (change.meshes.length > 0) {
                /** @example Apply(); @returns 无返回值，把整批文字转换记成一次对象编辑。 */
                const Apply = (): void => {
                    this.select([]);
                    change.redo();
                    this.update();
                };
                this._history.batch(Apply);
                // 文字几何已变为 Base 后才允许接收者读取轮廓节点。
                for (const mesh of change.meshes) {
                    this.notifyBase(mesh);
                }
                this.emit(this._onEdit, [...change.meshes]);
            }
            return [...change.meshes];
        }
    }

    /** @example tool.removeSelected(); @returns 被删除的文字实体。 */
    public removeSelected(): Mesh[] {
        this._history.begin();
        const meshes = [...this.actives];
        this.select([]);
        // 整批摘除选中对象，每个实体分别触发移除回调。
        for (const mesh of meshes) {
            mesh.removeSelf();
            this.emit(this._onRemove, mesh);
        }
        this._history.commit();
        this.update();
        return meshes;
    }

    /** @example tool.copySelected(); @returns 复制的对象数量。 */
    public copySelected(): number {
        this._clipboard = [];
        // 对象剪贴板只用于非输入模式；文字剪贴板由 textarea 原生处理。
        for (const mesh of this.actives) {
            const clone = mesh.clone();
            clone.order = this.sourceOrder(mesh);
            this._clipboard.push(clone);
        }
        this._clipboardClient = this._lastClient?.clone() ?? null;
        return this._clipboard.length;
    }
    /** @example tool.paste(); @returns 按鼠标位置或兜底偏移粘贴的对象。 */
    public paste(): Mesh[] {
        /** @example Apply(); @returns 本次整批操作的实体，选择与导入共用一次历史。 */
        const Apply = (): Mesh[] => {
            const meshes: Mesh[] = [];
            const cursor = this._lastClient;
            let dx = 10;
            let dy = -10;
            // 原位置重复粘贴使用小偏移，新的鼠标位置作为整批对象中心。
            if (cursor !== null && (this._clipboardClient === null ||
                Math.hypot(cursor.x - this._clipboardClient.x, cursor.y - this._clipboardClient.y) > 1)) {
                const world = this.camera.windowToWorld(cursor, this.render);
                let centerX = 0;
                let centerY = 0;
                // 以整批源对象的中心对齐鼠标，保持彼此的相对位置。
                for (const mesh of this._clipboard) {
                    centerX += mesh.position.x;
                    centerY += mesh.position.y;
                }
                dx = world.x - centerX / Math.max(this._clipboard.length, 1);
                dy = world.y - centerY / Math.max(this._clipboard.length, 1);
            }
            // 每次粘贴克隆独立对象和资源，不复用原选中样式。
            for (const source of this._clipboard) {
                const mesh = source.clone();
                mesh.position.set(source.position.x + dx, source.position.y + dy);
                meshes.push(mesh);
            }
            this.push(meshes);
            this.select(meshes);
            return meshes;
        };
        return this._history.batch(Apply);
    }
    /** @example tool.cutSelected(); @returns 被剪切的文字实体。 */
    public cutSelected(): Mesh[] {
        this.copySelected();
        return this.removeSelected();
    }

    /** @example const json = tool.save(); @returns 文字纯数据文档，同时触发所有 onSave。 */
    public save(): TextEditDocument {
        const document: TextEditDocument = { version: 1, type: "text", meshes: [...this.data] };
        this.emit(this._onSave, document);
        return document;
    }
    /** @param document 已注册对应字体的文字文档 @example tool.load(json); @returns 恢复的文字实体。 */
    public load(document: TextEditDocument): Mesh[] {
        /** @example Apply(); @returns 本次整批操作的实体，选择与导入共用一次历史。 */
        const Apply = (): Mesh[] => {
            const header: { version: number; type: string } = document;
            // 校验文档版本和类型后才替换现有文字。
            if (header.version === 1 && header.type === "text" && Array.isArray(document.meshes)) {
                const meshes: Mesh[] = [];
                // 每条记录重建独立材质及排版参数。
                for (const record of document.meshes) {
                    Font.get(record.fontFamily);
                    const style = new Style();
                    ApplyRectStyle(style, record.style);
                    const text = new Text(record.text, record.fontSize, record.fontFamily, record);
                    const material = new BaseMaterial(style);
                    material.transparent = record.material.transparent;
                    material.depthTest = record.material.depthTest;
                    material.depthWrite = record.material.depthWrite;
                    material.cullMode = record.material.cullMode;
                    const mesh = new Mesh(text, material, style);
                    mesh.position.set(record.position.x, record.position.y);
                    mesh.rotation = record.rotation;
                    mesh.scale.set(record.scale.x, record.scale.y);
                    mesh.matrix.set(record.matrix);
                    mesh.order = record.order;
                    mesh.bounding = record.bounding;
                    mesh.ignoreZoom = record.ignoreZoom ?? false;
                    mesh.autoPrecision = record.autoPrecision ?? this.autoPrecision;
                    mesh.precisionMax = record.precisionMax ?? 100;
                    mesh.culling = record.culling ?? true;
                    meshes.push(mesh);
                }
                this.finishEditing();
                this.select([]);
                // 新数据和字体验证完成后替换，避免坏文档清掉原来的文字。
                for (const old of this.meshes()) {
                    old.removeSelf();
                }
                // 文档有自己的逐实体开关，回显不套用下一次新建的模板。
                for (const mesh of meshes) {
                    this.synchronizeStyle(mesh);
                    this.meshGroup.add(mesh);
                    this.emit(this._onAdd, mesh);
                }
                this.update();
                return meshes;
            } else {
                throw new TypeError("Invalid TextEditDocument.");
            }
        };
        return this._history.batch(Apply);
    }

    /** @example tool.destroy(); @returns 无返回值，移除编辑覆盖层与输入会话。 */
    public destroy(): void {
        this.finishEditing();
        this._destroyed = true;
        this._events.abort();
        this._controls.destroy();
        // 删除所有文字包围框，防止销毁后留下辅助实体。
        for (const entry of this._proxies.values()) {
            entry.frame.removeSelf();
            entry.frame.dispose();
        }
        this.frameGroup.removeSelf();
        this.emit(this._onDestroy);
    }

    /** @example const meshes = this.meshes(); @returns 当前场景内可编辑的文字实体。 */
    private meshes(): Mesh[] {
        const result: Mesh[] = [];
        // 仅遍历当前场景，不依赖某个固定父组。
        for (const candidate of this.scene.ensureLists()) {
            // 代理只对应普通文字，不为实例和辅助框建立输入身份。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect && candidate.data instanceof Text) {
                result.push(candidate);
            }
        }
        return result;
    }

    /** @example this.syncProxies(); @returns 无返回值，代理矩形不生成字体轮廓。 */
    private syncProxies(): void {
        const meshes = this.meshes();
        // 删除或类型移交后立即清除代理，Base 不再保留文字包围框。
        for (const [mesh, entry] of this._proxies) {
            // 删除或转成 Base 后立即移除过期代理。
            if (!meshes.includes(mesh)) {
                entry.proxy.removeSelf();
                entry.frame.removeSelf();
                entry.frame.dispose();
                this._proxies.delete(mesh);
            }
        }
        // 每个文字复用一个矩形代理和一个渲染包围框。
        for (const mesh of meshes) {
            const text = mesh.data as Text;
            const bounds = MeasureText(text);
            let entry = this._proxies.get(mesh);
            // 首次遇到文字才分配代理，后续帧复用。
            if (entry === undefined) {
                const style = new Style();
                style.solid.enabled = true;
                const proxy = new Mesh(new Rect2D({ width: bounds.width, height: bounds.height, style }),
                    new BaseMaterial(style), style);
                const frameStyle = this.selectStyle.clone();
                frameStyle.points.enabled = false;
                frameStyle.solid.enabled = false;
                const frame = new Mesh(new Rect2D({ width: bounds.width, height: bounds.height, style: frameStyle }),
                    new BaseMaterial(frameStyle), frameStyle);
                frame.noSelect = true;
                frame.order = 1000000;
                this._controls.push(proxy);
                entry = { proxy, frame, width: bounds.width, height: bounds.height,
                    offsetX: (bounds.left + bounds.right) / 2, offsetY: (bounds.bottom + bounds.top) / 2,
                    style: this.selectStyle, styleVersion: -1 };
                this._proxies.set(mesh, entry);
            }
            // 拖动中的代理由冻结快照驱动，不以已改变的文字矩阵反向重置。
            if (this._gesture === null) {
                const rectangle = entry.proxy.data as Rect2D;
                rectangle.width = bounds.width;
                rectangle.height = bounds.height;
                entry.width = bounds.width;
                entry.height = bounds.height;
                entry.offsetX = (bounds.left + bounds.right) / 2;
                entry.offsetY = (bounds.bottom + bounds.top) / 2;
                entry.proxy.ignoreZoom = mesh.ignoreZoom;
                entry.proxy.order = mesh.order;
                this.positionFrame(entry.proxy, mesh, entry.offsetX, entry.offsetY);
            }
        }
        this._controls.snapExcluded = new Set(this.actives);
    }

    /** @param frame 边框或代理 @param mesh 实体 @param x 局部包围盒偏移 @param y 局部包围盒偏移 @example this.positionFrame(frame, mesh, 0, 0); @returns 无返回值。 */
    private positionFrame(frame: Mesh, mesh: Mesh, x: number, y: number): void {
        const matrix = mesh.ensureWorldMatrix().data;
        let compensation = 1;
        // 局部包围盒偏移也需抵消 zoom；文字原点的世界位置保持不变。
        if (mesh.ignoreZoom) {
            compensation = 1 / this.camera.zoom;
        }
        SetWorld(frame, [matrix[0], matrix[1], 0, matrix[3], matrix[4], 0,
            matrix[6] + (matrix[0] * x + matrix[3] * y) * compensation,
            matrix[7] + (matrix[1] * x + matrix[4] * y) * compensation, 1]);
    }

    /** @example const proxies = this.proxySelection(); @returns 选中文字对应的控制代理。 */
    private proxySelection(): Mesh[] {
        const proxies: Mesh[] = [];
        // 选中实体通过固定映射取得控制代理。
        for (const mesh of this.actives) {
            const entry = this._proxies.get(mesh);
            // 已移交或移除的实体没有代理，不加入控制选择。
            if (entry !== undefined) {
                proxies.push(entry.proxy);
            }
        }
        return proxies;
    }
    /** @param proxies 控制器的代理结果 @example this.mapProxies(proxies); @returns 对应真实文字实体。 */
    private mapProxies(proxies: readonly (Mesh | null)[]): Mesh[] {
        const result: Mesh[] = [];
        // 沿稳定映射把控制结果转回真实文字对象。
        for (const [mesh, entry] of this._proxies) {
            // 只有本次控制器返回的代理进入回调集合。
            if (proxies.includes(entry.proxy)) {
                result.push(mesh);
            }
        }
        return result;
    }
    /** @example this.syncTransforms(); @returns 无返回值，把 Rect 控制结果转成可表示的文字 TRS。 */
    private syncTransforms(): void {
        // 冻结手势期间将代理变换映射回文字，稳定帧只同步框。
        if (this._gesture !== null) {
            // 同一次拖动可移动多个已选文字。
            for (const mesh of this.actives) {
                const entry = this._proxies.get(mesh);
                // 有效代理提供按下时排版尺寸和中心偏移。
                if (entry !== undefined) {
                    const rectangle = entry.proxy.data as Rect2D;
                    const matrix = entry.proxy.ensureWorldMatrix().data;
                    const x = rectangle.width / entry.width;
                    const y = rectangle.height / entry.height;
                    let compensation = 1;
                    // 抵消字号缩放时，排版中心偏移也按显示倍率换算。
                    if (mesh.ignoreZoom) {
                        compensation = 1 / this.camera.zoom;
                    }
                    const values: MatrixValues = [matrix[0] * x, matrix[1] * x, 0,
                        matrix[3] * y, matrix[4] * y, 0,
                        matrix[6] - (matrix[0] * x * entry.offsetX + matrix[3] * y * entry.offsetY) * compensation,
                        matrix[7] - (matrix[1] * x * entry.offsetX + matrix[4] * y * entry.offsetY) * compensation, 1];
                    SetWorld(mesh, values);
                }
            }
            this.emit(this._onEdit, [...this.actives]);
        }
    }
    /** @param mesh 导入的文字对象 @example this.synchronizeStyle(mesh); @returns 无返回值，补齐实体样式对字体几何的下发。 */
    private synchronizeStyle(mesh: Mesh): void {
        const style = mesh.style;
        // Text 初始几何默认不生成面；已有 Mesh 样式需要通过 setter 分发给几何和材质。
        if (style !== undefined) {
            mesh.style = style;
        }
    }

    /** @example this.refreshData(); @returns 无返回值，仅内容变化时替换纯数据数组。 */
    private refreshData(): void {
        const records: TextEditRecord[] = [];
        // Base 移交后不再包含文字元数据，选中装饰也不会污染用户样式。
        for (const mesh of this.meshes()) {
            const record = CaptureText(mesh, this.sourceStyle(mesh));
            record.order = this.sourceOrder(mesh);
            records.push(record);
        }
        const signature = JSON.stringify(records);
        // 保持未修改数据的数组身份，避免状态框架每帧接收无意义更新。
        if (signature !== this._dataSignature) {
            this._data = records;
            this._dataSignature = signature;
        }
    }

    /** @example this.inputChanged(); @returns 无返回值，同步输入内容和包围框，退出时统一提交历史。 */
    private inputChanged(): void {
        this.update();
        this.emit(this._onEdit, [...this.actives]);
    }
    /** @param proxies 发生平移的代理 @example this.notifyMove(proxies); @returns 无返回值。 */
    private notifyMove(proxies: Mesh[]): void {
        const meshes = this.mapProxies(proxies);
        this.emit(this._onMove, meshes);
        this.emit(this._onPositionChange, meshes);
    }
    /** @param proxies 发生旋转的代理 @example this.notifyRotate(proxies); @returns 无返回值。 */
    private notifyRotate(proxies: Mesh[]): void {
        this.emit(this._onRotate, this.mapProxies(proxies));
    }
    /** @param proxy 改尺寸代理 @example this.notifyResize(proxy); @returns 无返回值。 */
    private notifyResize(proxy: Mesh): void {
        const mesh = this.mapProxies([proxy]).at(0);
        // 有效代理才有对应的真实文字回调对象。
        if (mesh !== undefined) {
            this.emit(this._onResize, mesh);
        }
    }
    /** @param proxy 等比缩放代理 @example this.notifyScale(proxy); @returns 无返回值。 */
    private notifyScale(proxy: Mesh): void {
        const mesh = this.mapProxies([proxy]).at(0);
        // 有效代理才触发缩放回调。
        if (mesh !== undefined) {
            this.emit(this._onScale, mesh);
        }
    }
}

type MatrixValues = [number, number, number, number, number, number, number, number, number];

interface TextProxy { proxy: Mesh; frame: Mesh; width: number; height: number; offsetX: number; offsetY: number;
    style: Style; styleVersion: number; }

interface TextGesture { first: Vec2; target: Mesh | null; canInput: boolean; moved: boolean }

/** @param mesh 待更新对象 @param world 世界矩阵 @example SetWorld(mesh, matrix); @returns 无返回值。 */
const SetWorld = (mesh: Mesh, world: MatrixValues): void => {
    let values = world;
    // 保留父子关系，输入 TRS 同步到父级局部坐标。
    if (mesh.parent !== null) {
        const parent = mesh.parent.ensureWorldMatrix().data;
        const determinant = parent[0] * parent[4] - parent[1] * parent[3];
        // 父级矩阵可逆时转换为父级局部坐标，避免破坏嵌套。
        if (determinant !== 0) {
            const a = parent[4] / determinant;
            const b = -parent[1] / determinant;
            const c = -parent[3] / determinant;
            const d = parent[0] / determinant;
            const dx = world[6] - parent[6];
            const dy = world[7] - parent[7];
            values = [a * world[0] + c * world[1], b * world[0] + d * world[1], 0,
                a * world[3] + c * world[4], b * world[3] + d * world[4], 0,
                a * dx + c * dy, b * dx + d * dy, 1];
        }
    }
    const scaleX = Math.hypot(values[0], values[1]);
    mesh.position.set(values[6], values[7]);
    mesh.rotation = Math.atan2(values[1], values[0]);
    mesh.scale.set(scaleX, (values[0] * values[4] - values[1] * values[3]) / Math.max(scaleX, 1e-30));
    mesh.matrix.set(values);
};

export default TextEditTool;
export type { TextEditDocument, TextEditRecord } from "./data";
export { default as TextEditToolKey } from "./key";
export { TextEditTool };
