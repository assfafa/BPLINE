# 多边形编辑器 PolyEditTool

目录：`bplinejs/src/scripts/Editor/PolyEditTool`

## 1. 文件结构与作用

逐点绘制、沿边插点、顶点拖动及自由组缩放。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `data.ts` | 把多边形 Mesh 保存为无订阅器的纯数据。；在保留运行期 Mesh 身份的同时恢复多边形快照。；从纯 JSON 新建多边形 Mesh，使用新的运行期 ID。 |
| `geometry.ts` | 读取多边形的有序世界顶点。；读取多边形轮廓的屏幕坐标。；合并一组多边形的世界包围盒。 |
| `index.ts` | 单独维护普通 Poly2D Mesh 的选择、绘制、移动、缩放和旋转。 |
| `key.ts` | PolyEditTool 的可改键盘快捷键。组合键用加号连接 KeyboardEvent.code， 例如 `Control+KeyV`；单独的 Control、Alt、Shift 同时匹配左右修饰键。 |
| `transforms.ts` | Poly 编辑器的 transforms 操作，复用主编辑器的实时配置和通知。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### PolyEditTool

单独维护普通 Poly2D Mesh 的选择、绘制、移动、缩放和旋转。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 搜索和编辑多边形的场景。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 编辑覆盖层所属的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 窗口与世界坐标转换使用的相机。 |
| `selector`（公开） | `PolySelectTool`；`由构造参数或初始化过程赋值` | 多边形点选与矩形框选工具。 |
| `group`（公开） | `Group`；`new Group(0, 0)` | 编辑器节点，包含对象组和辅助组。 |
| `frameGroup`（公开） | `Group`；`new Group(0, 0)` | 预览框、组框和旋转点所在的辅助组。 |
| `meshGroup`（公开） | `Group`；`new Group(0, 0)` | 编辑器直接管理的多边形对象组。 |
| `radius`（公开） | `number`；`10` | 顶点、边与吸附的屏幕容差，单位 CSS 像素。 |
| `max`（公开） | `number`；`Infinity` | 外轮廓面积上限。 |
| `maxWidth`（公开） | `number`；`Infinity` | 多边形包围盒宽度上限。 |
| `minWidth`（公开） | `number`；`0` | 多边形包围盒宽度下限。 |
| `maxHeight`（公开） | `number`；`Infinity` | 多边形包围盒高度上限。 |
| `minHeight`（公开） | `number`；`0` | 多边形包围盒高度下限。 |
| `left`（公开） | `number`；`-Infinity` | 世界活动区域左边界。 |
| `top`（公开） | `number`；`Infinity` | 世界活动区域上边界，Y 轴向上。 |
| `right`（公开） | `number`；`Infinity` | 世界活动区域右边界。 |
| `bottom`（公开） | `number`；`-Infinity` | 世界活动区域下边界。 |
| `origin`（公开） | `PolyEditOrigin`；`"center"` | 完成路径后以首顶点或包围盒中心作为 Mesh 的局部原点，默认中心。 |
| `closed`（公开） | `boolean`；`true` | 新建路径是否闭合，默认 true；开放路径至少两个点即可完成。 |
| `_style`（内部） | `Style`；`CreateDrawingStyle()` | 下次新增对象的样式模板。 |
| `_material`（内部） | `Material2d`；`new BaseMaterial(this._style)` | 下次新增对象的材质模板。 |
| `ignoreZoom`（公开） | `boolean`；`false` | 下一个新建多边形是否保持屏幕尺寸，默认关闭；不改变已有对象。 |
| `autoPrecision`（公开） | `boolean`；`true` | 新建或 push 导入实体的圆角自动精度开关，默认开启；不改用户轮廓顶点。 |
| `_order`（内部） | `number`；`0` | 下一次手绘多边形的层级，默认 0；导入对象保留自己的 order。 |
| `_orderSource`（内部） | `OrderSource \| null`；`null` | 状态由 `setOrderSource`、`sourceOrder` 读取或维护；完整处理见对应函数。 |
| `selectStyle`（公开） | `Style`；`CreateSelectionStyle(false)` | 已选对象的边框和顶点样式模板。 |
| `activeOnly`（公开） | `boolean`；`true` | 首次点到未选对象时是否仅选中、不立即拖动。 |
| `translationStep`（公开） | `number`；`1` | 世界坐标平移及顶点拖动步进。 |
| `translationStepEnabled`（公开） | `boolean`；`false` | 是否启用世界原点网格步进。 |
| `snap`（公开） | `boolean`；`false` | 吸附总开关，默认关闭；具体候选由 snapOptions 控制。 |
| `snapOptions`（公开） | `SnapOptions`；`CreateSnapOptions()` | 顶点、边线、交点和网格的独立吸附开关，默认全部开启。 |
| `rotationStep`（公开） | `number`；`1` | 旋转角度步进，单位度。 |
| `rotationStepEnabled`（公开） | `boolean`；`false` | 是否启用角度步进。 |
| `constrain`（公开） | `boolean`；`false` | 移动时锁定屏幕轴，框选从按下点向四周展开；组角点缩放时保持比例。 |
| `actives`（公开） | `Mesh[]`；`[]` | 当前选中的全部 Mesh。 |
| `active`（公开） | `Mesh[]`；`[]` | 最近一次新加入选择的 Mesh。 |
| `enabled`（公开） | `boolean`；`true` | 是否接收指针事件。 |
| `fromCollection`（公开） | `boolean`；`由构造参数或初始化过程赋值` | 集合编辑器构建时关闭自动监听和自带网格。 |
| `switches`（公开） | `EditSwitches`；`CreateEditSwitches()` | 指针选择、创建和变换的独立开关；默认全部开启。 |
| `_helperGrid`（内部） | `HelperGrid \| null`；`null` | 当前网格或 null。（helperGrid 的内部状态）。 |
| `_activeType`（内部） | `PolyEditMode`；`"edit"` | 当前编辑模式。（activeType 的内部状态）。 |
| `_mult`（内部） | `boolean`；`true` | 是否保留多个选中对象。（mult 的内部状态）。 |
| `_rotationEnabled`（内部） | `boolean`；`true` | 是否允许单体及组旋转。（rotationEnabled 的内部状态）。 |
| `_gesture`（内部） | `PolyGesture \| null`；`null` | 状态由 `movingMeshes`、`update`、`cancel`、`trackTouchPointerDown` 读取或维护；完整处理见对应函数。 |
| `_selectionFrame`（内部） | `Mesh \| null`；`null` | 状态由 `removeSelectionFrame`、`applyGesture`、`finishSelection` 读取或维护；完整处理见对应函数。 |
| `_createPreview`（内部） | `Mesh \| null`；`null` | 状态由 `removeCreatePreview`、`updateCreatePreview` 读取或维护；完整处理见对应函数。 |
| `_drawPoints`（内部） | `Vec2[]`；`[]` | 状态由 `isDrawing`、`cancel`、`cursorAt`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_groupFrame`（内部） | `Mesh \| null`；`null` | 状态由 `removeGroupFrame`、`resetGroupFrame`、`groupAction`、`cursorAt` 读取或维护；完整处理见对应函数。 |
| `_groupBounds`（内部） | `PolyBounds \| null`；`null` | 状态由 `removeGroupFrame`、`resetGroupFrame`、`groupAction` 读取或维护；完整处理见对应函数。 |
| `_selectionBoxes`（内部） | `按初始化值推断`；`new Map<Mesh, Mesh>()` | 状态由 `destroy`、`updateSelectionBoxes` 读取或维护；完整处理见对应函数。 |
| `_rotationHandles`（内部） | `按初始化值推断`；`new Map<Mesh, Mesh>()` | 状态由 `updateRotationHandles`、`removeRotationHandles` 读取或维护；完整处理见对应函数。 |
| `_savedStyles`（内部） | `按初始化值推断`；`new Map<Mesh, Style>()` | 状态由 `sourceStyle`、`applySelectStyle`、`restoreStyle`、`captureUserPoly` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `PolyEditRecord[]`；`[]` | 当前普通多边形的纯数据快照。（data 的内部状态）。 |
| `_undoStack`（内部） | `(PolyHistoryEntry \| BaseChange)[]`；`[]` | 状态由 `undoCount`、`toBase`、`commitHistory`、`undo` 读取或维护；完整处理见对应函数。 |
| `_redoStack`（内部） | `(PolyHistoryEntry \| BaseChange)[]`；`[]` | 状态由 `redoCount`、`toBase`、`commitHistory`、`undo` 读取或维护；完整处理见对应函数。 |
| `_historyStart`（内部） | `PolyHistoryState \| null`；`null` | 状态由 `beginHistory`、`commitHistory`、`remove` 读取或维护；完整处理见对应函数。 |
| `_historyReplay`（内部） | `boolean`；`false` | 状态由 `beginHistory`、`commitHistory`、`restoreHistoryState` 读取或维护；完整处理见对应函数。 |
| `_clipboard`（内部） | `Mesh[]`；`[]` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_clipboardClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_lastClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste`、`update`、`clearViewPointer` 读取或维护；完整处理见对应函数。 |
| `_touchPointers`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `destroy`、`trackTouchPointerDown`、`handleBlur`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_viewPointerId`（内部） | `number \| null`；`null` | 状态由 `cursorAt`、`clearViewPointer`、`handlePointerDown`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_viewContainerCursor`（内部） | `string \| null`；`null` | 状态由 `clearViewPointer`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `update`、`destroy`、`clearViewPointer`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalCursor`（内部） | `string`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalTouchAction`（内部） | `string`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_onSelect`（内部） | `按初始化值推断`；`new Map<string, (active: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onSelect`、`onSelectDelete`、`onSelectionChange`、`onSelectionChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onDeselect`（内部） | `按初始化值推断`；`new Map<string, (removed: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onDeselect`、`onDeselectDelete`、`select` 读取或维护；完整处理见对应函数。 |
| `_onSelectionChange`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onSelectionChange`、`onSelectionChangeDelete`、`select` 读取或维护；完整处理见对应函数。 |
| `_onMove`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `notifyExternalMove`、`onMove`、`onMoveDelete`、`createPolyTransformsHooks` 读取或维护；完整处理见对应函数。 |
| `_onResize`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onResize`、`onResizeDelete`、`handlePointerDown`、`createPolyTransformsHooks` 读取或维护；完整处理见对应函数。 |
| `_onScale`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onScale`、`onScaleDelete`、`createPolyTransformsHooks` 读取或维护；完整处理见对应函数。 |
| `_onRotate`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onRotate`、`onRotateDelete`、`createPolyTransformsHooks` 读取或维护；完整处理见对应函数。 |
| `_onPositionChange`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `notifyExternalMove`、`onPositionChange`、`onPositionChangeDelete`、`createPolyTransformsHooks` 读取或维护；完整处理见对应函数。 |
| `_onEdit`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `notifyExternalMove`、`onEdit`、`onEditDelete`、`toBase` 读取或维护；完整处理见对应函数。 |
| `_onAdd`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onAdd`、`onAddDelete`、`load`、`push` 读取或维护；完整处理见对应函数。 |
| `_onRemove`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onRemove`、`onRemoveDelete`、`load`、`remove` 读取或维护；完整处理见对应函数。 |
| `_onDestroy`（内部） | `按初始化值推断`；`new Map<string, () => void>()` | 状态由 `onDestroy`、`onDestroyDelete`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_onModeChange`（内部） | `按初始化值推断`；`new Map<string, (mode: PolyEditMode) => void>()` | 状态由 `activeType`、`onModeChange`、`onModeChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onBase`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onBase`、`onBaseDelete`、`notifyBase` 读取或维护；完整处理见对应函数。 |
| `_baseDelegate`（内部） | `BaseDelegate \| null`；`null` | 状态由 `setBaseDelegate`、`toBase` 读取或维护；完整处理见对应函数。 |
| `_onSave`（内部） | `按初始化值推断`；`new Map<string, (data: PolyEditDocument) => void>()` | 状态由 `onSave`、`onSaveDelete`、`save` 读取或维护；完整处理见对应函数。 |
| `_transforms`（内部） | `PolyTransforms`；`new PolyTransforms(this, this.createPolyTransformsHooks())` | transforms 算法与主编辑器分开维护，配置由实时接口提供。 |

#### 构造与案例

```ts
constructor(
        scene: Scene,
        render: Render,
        camera: Camera,
        autoBind: boolean = true,
        helper: boolean = autoBind,
        fromCollection: boolean = false,
    )
```

创建多边形编辑器；集合编辑器可关闭自动监听和背景网格。

```ts
const tool = new PolyEditTool(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get order(): number`  | 下一次手绘多边形的层级，默认 0。 |
| `set order(value: number)`  | 无返回值。 |
| `setOrderSource(source: OrderSource \| null): void`  | 无返回值。 |
| `sourceOrder(node: Group): number`  | 不包含集合临时提升的层级。 |
| `get style(): Style`  | 下次新建多边形的样式模板。 |
| `set style(value: Style)`  | 无返回值。 |
| `sourceStyle(mesh: Mesh): Style`  | 未被选中装饰覆盖的用户样式。 |
| `get material(): Material2d`  | 下次新建多边形的材质模板。 |
| `set material(value: Material2d)`  | 无返回值。 |
| `static build(scene: Scene, render: Render, camera: Camera): PolyEditTool`  | 为将来的集合编辑器创建无自动监听、无重复网格的工具。 |
| `get helper(): boolean`  | 是否显示背景网格。 |
| `set helper(value: boolean)`  | 无返回值。 |
| `get helperGrid(): HelperGrid \| null`  | 当前网格或 null。 |
| `get movingMeshes(): Mesh[]`  | 当前平移手势中的多边形集合。 |
| `selectAll(): void`  | 无返回值，选择全部可编辑多边形并遵循 mult 开关。 |
| `notifyExternalMove(meshes: Mesh[]): void`  | 接收合并编辑器统一平移后的通知，不重新应用位移。 |
| `get isDrawing(): boolean`  | 是否正在等待下一次单击追加节点。 |
| `get activeType(): PolyEditMode`  | 当前编辑模式。 |
| `set activeType(value: PolyEditMode)`  | 无返回值。 |
| `get rotationEnabled(): boolean`  | 是否允许单体及组旋转。 |
| `set rotationEnabled(value: boolean)`  | 无返回值。 |
| `get mult(): boolean`  | 是否保留多个选中对象。 |
| `set mult(value: boolean)`  | 无返回值。 |
| `get data(): readonly PolyEditRecord[]`  | 当前普通多边形的纯数据快照。 |
| `get undoCount(): number`  | 可撤销批次数。 |
| `get redoCount(): number`  | 可重做批次数。 |
| `emit<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void` （内部） | 按注册顺序通知同一事件的全部监听。 |
| `onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void`  | 无返回值。 |
| `onSelectDelete(key: string): boolean`  | 是否删除监听。 |
| `onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void`  | 无返回值。 |
| `onDeselectDelete(key: string): boolean`  | 是否删除监听。 |
| `onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 无返回值。 |
| `onSelectionChangeDelete(key: string): boolean`  | 是否删除监听。 |
| `onMove(key: string, callback: (actives: Mesh[]) => void): void`  | 无返回值。 |
| `onMoveDelete(key: string): boolean`  | 是否删除监听。 |
| `onResize(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onResizeDelete(key: string): boolean`  | 是否删除监听。 |
| `onScale(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onScaleDelete(key: string): boolean`  | 是否删除监听。 |
| `onRotate(key: string, callback: (actives: Mesh[]) => void): void`  | 无返回值。 |
| `onRotateDelete(key: string): boolean`  | 是否删除监听。 |
| `onPositionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 无返回值。 |
| `onPositionChangeDelete(key: string): boolean`  | 是否删除监听。 |
| `onEdit(key: string, callback: (actives: Mesh[]) => void): void`  | 无返回值。 |
| `onEditDelete(key: string): boolean`  | 是否删除监听。 |
| `onAdd(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onAddDelete(key: string): boolean`  | 是否删除监听。 |
| `onRemove(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onRemoveDelete(key: string): boolean`  | 是否删除监听。 |
| `onDestroy(key: string, callback: () => void): void`  | 无返回值。 |
| `onDestroyDelete(key: string): boolean`  | 是否删除监听。 |
| `onModeChange(key: string, callback: (mode: PolyEditMode) => void): void`  | 无返回值。 |
| `onModeChangeDelete(key: string): boolean`  | 是否删除监听。 |
| `onBase(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onBaseDelete(key: string): boolean`  | 是否删除监听。 |
| `setBaseDelegate(delegate: BaseDelegate): void`  | 无返回值。 |
| `notifyBase(mesh: Mesh): void`  | 无返回值，触发具名降级监听。 |
| `toBase(): Mesh[]`  | 把当前选择降级为 Base2D；独立工具解除选择，集合工具移交统一 Base 编辑。 |
| `onSave(key: string, callback: (data: PolyEditDocument) => void): void`  | 无返回值。 |
| `onSaveDelete(key: string): boolean`  | 是否删除监听。 |
| `select(meshes: Mesh \| number \| readonly (Mesh \| number)[], operation: SelectionOperation = "replace"): void`  | 按替换、增量或减量更新场景中普通多边形的选择集。 |
| `uniqueGeometry(mesh: Mesh): Poly2D` （内部） | 分离共享几何，避免一件对象的编辑改变其他 Mesh。 |
| `applySelectStyle(mesh: Mesh): void` （内部） | 无返回值。 |
| `restoreStyle(mesh: Mesh): void` （内部） | 无返回值。 |
| `captureUserPoly(mesh: Mesh): PolyEditRecord` （内部） | 未覆盖选择色的纯数据。 |
| `refreshData(): void` （内部） | 无返回值。 |
| `captureHistoryState(): PolyHistoryState` （内部） | 对象引用、快照和选中 ID。 |
| `beginHistory(): void` （内部） | 无返回值。 |
| `commitHistory(): void` （内部） | 无返回值。 |
| `restoreHistoryState(state: PolyHistoryState): void` （内部） | 恢复一批对象的父级、属性和选择，不替换仍存在的 Mesh 引用。 |
| `undo(): boolean`  | 是否恢复了一批编辑。 |
| `redo(): boolean`  | 是否重放了一批编辑。 |
| `save(): PolyEditDocument`  | 可序列化 JSON 并通知 onSave。 |
| `load(document: PolyEditDocument): Mesh[]`  | 以 JSON 文档重建编辑器所管理的多边形。 |
| `push(meshes: Mesh \| readonly Mesh[]): Mesh[]`  | 把普通多边形加入编辑器管理组。 |
| `remove(mesh: Mesh): boolean`  | 是否已从场景移除。 |
| `removeSelected(): Mesh[]`  | 本次删除的全部选中 Mesh。 |
| `copySelected(): number`  | 复制到内存剪贴板的对象数。 |
| `paste(): Mesh[]`  | 新增并选中的复制对象。 |
| `cutSelected(): Mesh[]`  | 剪切的对象。 |
| `update(): void`  | 根据对象、相机和样式变化刷新覆盖层。 |
| `cancel(): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值。 |
| `removeSelectionFrame(): void` （内部） | 无返回值。 |
| `removeCreatePreview(): void` （内部） | 无返回值。 |
| `removeGroupFrame(): void` （内部） | 无返回值。 |
| `resetGroupFrame(): void` （内部） | 无返回值。 |
| `pick(client: Vec2): PolyHit \| null` （内部） | 从上层到下层拾取多边形，优先顶点，其次可插点的边，最后是填充内部。 |
| `pickMesh(client: Vec2): Mesh \| null`  | 节点、边或实体命中的多边形。 |
| `rotationHandlePosition(mesh: Mesh): { top: Vec2; outward: Vec2; endpoint: Vec2 } \| null` （内部） | 旋转图标放在随 Mesh 旋转的局部包围盒顶部。 |
| `updateSelectionBoxes(): void` （内部） | 无返回值。 |
| `pickRotationHandle(client: Vec2): Mesh \| null`  | 命中的选中 Mesh。 |
| `updateRotationHandles(): void` （内部） | 无返回值。 |
| `removeRotationHandles(): void` （内部） | 无返回值。 |
| `groupAction(client: Vec2): GroupAction` （内部） | 组角点及四条边分别确定可自由缩放的轴。 |
| `updateCursor(client: Vec2): void` （内部） | 无返回值。 |
| `cursorAt(client: Vec2): string`  | 当前节点、旋转或移动的 CSS 光标。 |
| `snapshots(meshes: readonly Mesh[]): PolySnapshot[]` （内部） | 按下时的矩阵与轮廓顶点。 |
| `isAllowedPolygon(mesh: Mesh): boolean` （内部） | 是否满足尺寸与面积限制。 |
| `withinWorldLimits(mesh: Mesh): boolean` （内部） | 所有外圈顶点是否在活动区域内。 |
| `applyMove(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `applyVertex(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `applyRotate(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `applyGroupScale(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `applyGroupRotate(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `trackTouchPointerDown(event: PointerEvent): void` （内部） | 无返回值。 |
| `handleBlur(): void` （内部） | 无返回值。 |
| `clearViewPointer(): void` （内部） | 无返回值。 |
| `handleContextMenu(event: MouseEvent): void` （内部） | 无返回值。 |
| `handlePointerDown(event: PointerEvent): void`  | 鼠标左键或单指按下时决定点选、移动、节点编辑或逐点新建。 |
| `handlePointerMove(event: PointerEvent): void`  | 更新当前手势和预览；无手势时只更新鼠标悬停光标。 |
| `handlePointerUp(event: PointerEvent): void`  | 提交创建或框选并结束当前指针编辑。 |
| `centerEditedPolygon(mesh: Mesh): void` （内部） | 无返回值。 |
| `handlePointerCancel(event: PointerEvent): void`  | 无返回值。 |
| `applyGesture(gesture: PolyGesture): void` （内部） | 无返回值。 |
| `resolveDrawPoint(client: Vec2): Vec2` （内部） | 对新节点统一应用 Shift 屏幕直线、世界步进和已有顶点吸附。 |
| `appendDrawPoint(client: Vec2): void` （内部） | 将一次左键点击添加到正在绘制的单轮廓中。 |
| `updateCreatePreview(client: Vec2): void` （内部） | 用已经确认的节点和鼠标位置绘制开放预览，不提前填充或闭合。 |
| `closePath(): Mesh \| null`  | 完成的闭合多边形或开放折线；节点不足或超出限制时为 null。 |
| `finishSelection(gesture: PolyGesture, client: Vec2): void` （内部） | 单击使用实际形状命中；拖动使用屏幕矩形框选。 |
| `createPolyTransformsHooks(): PolyTransformsHooks` （内部） | 连接 transforms 状态的实时接口，不复制编辑对象。 |

### 导出关系

```ts
export default PolyEditTool;
export { default as PolyEditToolKey } from "./key";
export type { PolyEditDocument, PolyEditMode, PolyEditOrigin, PolyEditRecord, PolyHandle, SelectionOperation };
```

## 3. 其他源码文件

### 文件：data.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CapturePoly` | 把多边形 Mesh 保存为无订阅器的纯数据。 |
| `ApplyPoly` | 在保留运行期 Mesh 身份的同时恢复多边形快照。 |
| `CreatePoly` | 从纯 JSON 新建多边形 Mesh，使用新的运行期 ID。 |

```ts
const record = CapturePoly(mesh, style);
```

### 类型索引

`PolyEditRecord`、`PolyEditDocument`

### 导出关系

```ts
export { ApplyPoly, CapturePoly, CreatePoly };
export type { PolyEditDocument, PolyEditRecord };
```

### 文件：geometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `WorldVertices` | 读取多边形的有序世界顶点。 |
| `ScreenVertices` | 读取多边形轮廓的屏幕坐标。 |
| `BoundsOfMeshes` | 合并一组多边形的世界包围盒。 |
| `LocalBounds` | 读取轮廓在 Mesh 局部坐标系中的包围盒，供随对象旋转的选中框使用。 |
| `ProjectSegment` | 求鼠标在边线上的最近点，用于从点击位置插入新节点。 |
| `ContainsWindingPoint` | 按 Poly2D 填充使用的非零环绕规则命中自交单轮廓。 |

```ts
const points = WorldVertices(mesh);
```

### 类型索引

`PolyBounds`

### 导出关系

```ts
export {
    ContainsPoint,
    CreateGroupFrame,
    CreateSelectionFrame,
    IsCanvasPoint,
    SegmentDistance,
    ToLocal,
    ToParent,
    UpdateSelectionFrame,
} from "../NGonEditTool/geometry";
export { BoundsOfMeshes, ContainsWindingPoint, LocalBounds, ProjectSegment, ScreenVertices, WorldVertices };
export type { PolyBounds };
```

### 文件：key.ts

### PolyEditToolKey

PolyEditTool 的可改键盘快捷键。组合键用加号连接 KeyboardEvent.code，
例如 `Control+KeyV`；单独的 Control、Alt、Shift 同时匹配左右修饰键。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `tool`（公开） | `PolyEditTool`；`由构造参数或初始化过程赋值` | 使用快捷键的编辑器。 |
| `viewCode`（公开） | `string`；`"KeyV"` | 点击后切到查看模式。 |
| `editCode`（公开） | `string`；`"KeyE"` | 点击后切到编辑模式。 |
| `groupCode`（公开） | `string`；`"KeyG"` | 点击后进入组变换模式。 |
| `addCode`（公开） | `string`；`"Control"` | 按住时增选，松开后恢复原模式。 |
| `subCode`（公开） | `string`；`"Alt"` | 按住时减选，松开后恢复原模式。 |
| `constrainCode`（公开） | `string`；`"Shift"` | 按住时锁定移动轴，并让画框以按下点为中心。 |
| `stepCode`（公开） | `string`；`"KeyS"` | 点击后同时切换平移和旋转步进。 |
| `snapCode`（公开） | `string`；`"KeyP"` | 点击后切换吸附总开关。 |
| `snapVertexCode`（公开） | `string`；`"KeyP+Digit1"` | 点击后切换顶点吸附，默认 P+1。 |
| `snapEdgeCode`（公开） | `string`；`"KeyP+Digit2"` | 点击后切换边线吸附，默认 P+2。 |
| `snapIntersectionCode`（公开） | `string`；`"KeyP+Digit3"` | 点击后切换交点吸附，默认 P+3。 |
| `snapGridCode`（公开） | `string`；`"KeyP+Digit4"` | 点击后切换细格吸附，默认 P+4。 |
| `closedCode`（公开） | `string`；`"KeyF"` | 点击后切换新建路径是否闭合。 |
| `multCode`（公开） | `string`；`"KeyM"` | 点击后切换多选开关。 |
| `removeCode`（公开） | `string`；`"Delete"` | 点击后删除当前选中集合。 |
| `cameraResetCode`（公开） | `string`；`"Space"` | 点击后把相机位置移回世界原点。 |
| `centerCode`（公开） | `string`；`"KeyC"` | 按住时以包围盒中心为新建 Mesh 原点，松开后恢复原设置。 |
| `copyCode`（公开） | `string`；`"Control+KeyC"` | 复制当前选中多边形。 |
| `pasteCode`（公开） | `string`；`"Control+KeyV"` | 粘贴复制的多边形。 |
| `cutCode`（公开） | `string`；`"Control+KeyX"` | 剪切当前选中多边形。 |
| `undoCode`（公开） | `string`；`"Control+KeyZ"` | 撤销上一批编辑。 |
| `redoCode`（公开） | `string`；`"Control+Shift+KeyZ"` | 重做上一批编辑。 |
| `redoAlternateCode`（公开） | `string`；`"Control+KeyY"` | 重做的备用组合键。 |
| `saveCode`（公开） | `string`；`"Control+KeyS"` | 生成 JSON 并触发 onSave。 |
| `baseCode`（公开） | `string`；`"KeyB"` | 首次按下时主动降级已选几何，默认 B；文字输入框内不接管。 |
| `selectAllCode`（公开） | `string`；`"Control+KeyA"` | 全选本工具可编辑的多边形。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_pressed`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `isPressed`、`hasPressedModifier`、`activateBase`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_armedClicks`（内部） | `按初始化值推断`；`new Map<ClickAction, string>()` | 状态由 `armClicks`、`activateBase`、`handleKeyUp`、`handleBlur` 读取或维护；完整处理见对应函数。 |
| `_previousMode`（内部） | `PolyEditMode \| null`；`null` | 状态由 `syncMode`、`activateClick` 读取或维护；完整处理见对应函数。 |
| `_previousConstrain`（内部） | `boolean \| null`；`null` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_previousOrigin`（内部） | `"left" \| "center" \| null`；`null` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_addOrder`（内部） | `number`；`0` | 状态由 `syncMode`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_subOrder`（内部） | `number`；`0` | 状态由 `syncMode`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_pressOrder`（内部） | `number`；`0` | 状态由 `handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `handleKeyDown`、`handleKeyUp`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_cameraControl`（内部） | `CameraControl \| null`；`由构造参数或初始化过程赋值` | 可选相机控制器；编辑时交出左键和单指，查看时恢复原开关（构造参数引用）。 |
| `_originalLeftDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`syncCameraControl`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalOFDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`syncCameraControl`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_nextListenerId`（内部） | `number`；`0` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_modeListenerKey`（内部） | `string`；``PolyEditToolKey:${String(PolyEditToolKey._nextListenerId)}`` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(tool: PolyEditTool, cameraControl: CameraControl | null = null)
```

注册窗口级快捷键，使用 destroy 可移除监听。

```ts
const keys = new PolyEditToolKey(tool);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `handleEditorPointerDown(event: PointerEvent): void` （内部） | 无返回值。 |
| `codes(code: string): string[]` （内部） | 把组合键拆成独立的 KeyboardEvent.code。 |
| `matchesCode(configuredCode: string, pressedCode: string): boolean` （内部） | 判断实际按键是否符合配置，未指定左右的修饰键两侧通用。 |
| `isPressed(code: string): boolean` （内部） | 所有组合键成员同时按住才算生效。 |
| `hasPressedModifier(): boolean` （内部） | 判断是否仍按着任一键盘修饰键，供独立单键排除浏览器组合操作。 |
| `hasConfiguredModifier(code: string): boolean` （内部） | 是否显式包含修饰键。 |
| `includesCode(code: string, pressedCode: string): boolean` （内部） | 当前按键是否是某配置组合的一部分。 |
| `clickBindings(): ClickBinding[]` （内部） | 当前可自定义的点击操作配置。 |
| `armClicks(pressedCode: string): void` （内部） | 仅在按键首次按下且完整组合成立时记录点击候选。 |
| `syncMode(): void` （内部） | 按住增选和减选时暂存原模式，两个键一起按时以后按下的为准。 |
| `syncTemporaryOptions(): void` （内部） | 无返回值。 |
| `activateClick(action: ClickAction): void` （内部） | 点击动作在完整的按下与松开之后执行一次。 |
| `syncCameraControl(): void` （内部） | 无返回值。 |
| `isTextInput(target: EventTarget \| null): boolean` （内部） | 忽略文本输入目标，避免编辑快捷键干扰表单输入。 |
| `activateBase(pressedCode: string): boolean` （内部） | 与点击快捷键区分，降级在首次完整按下时执行。 |
| `handleKeyDown(event: KeyboardEvent): void` （内部） | 首次按下记录按键和待完成的点击操作。 |
| `handleKeyUp(event: KeyboardEvent): void` （内部） | 松开组合中的任意一键才确认一次点击，然后同步按住状态。 |
| `handleBlur(): void` （内部） | 无返回值。 |
| `destroy(): void`  | 无返回值。 |

### 类型索引

`ClickAction`、`ClickBinding`

### 导出关系

```ts
export default PolyEditToolKey;
```

### 文件：transforms.ts

### PolyTransforms

Poly 编辑器的 transforms 操作，复用主编辑器的实时配置和通知。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_tool`（内部） | `PolyEditTool`；`由构造参数或初始化过程赋值` | 主编辑器（构造参数引用）。 |
| `_hooks`（内部） | `PolyTransformsHooks`；`由构造参数或初始化过程赋值` | 状态和通知入口（构造参数引用）。 |

#### 构造与案例

```ts
constructor(tool: PolyEditTool, hooks: PolyTransformsHooks)
```

操作模块。

```ts
new PolyTransforms(tool, hooks);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `getSnapGeometry(gesture: PolyGesture): SnapGeometry`  | 一次手势只冻结一次外部对象轮廓，后续用原始鼠标位置筛选边和交点。 |
| `getSnapTargets(gesture: PolyGesture, world: Vec2): Vec2[]`  | 按当前指针位置读取启用的吸附候选。 |
| `withinWorldLimits(mesh: Mesh): boolean`  | 所有外圈顶点是否在活动区域内。 |
| `isAllowedPolygon(mesh: Mesh): boolean`  | 是否满足尺寸与面积限制。 |
| `moveDelta(gesture: PolyGesture, rawX: number, rawY: number): Vec2`  | 找出移动候选中距原始鼠标轨迹最近的步进或顶点吸附修正。 |
| `applyMove(gesture: PolyGesture): void`  | 无返回值。 |
| `applyVertex(gesture: PolyGesture): void`  | 无返回值。 |
| `applyRotate(gesture: PolyGesture): void`  | 无返回值。 |
| `findGroupScaleSnap( gesture: PolyGesture, frameMatrix: ArrayLike<number>, handle: GroupHandle, anchorX: number, anchorY: number, raw: Vec2, stepped: Vec2, ): Vec2 \| null`  | 让组缩放中的某个轮廓顶点精确落在其他多边形的节点上。 |
| `applyGroupScale(gesture: PolyGesture): void`  | 无返回值。 |
| `applyGroupRotate(gesture: PolyGesture): void`  | 无返回值。 |

### 类型索引

`PolyTransformsHooks`

### 导出关系

```ts
export default PolyTransforms;
export type { PolyTransformsHooks };
```

### 文件：types.ts


### 类型索引

`PolyEditMode`、`PolyEditOrigin`、`SelectionOperation`、`PolyHandle`、`GestureMode`、`GroupHandle`、`GroupAction`、`PolySnapshot`、`PolyMatrix`、`PolyGesture`、`PolyHistoryItem`、`PolyHistoryState`、`PolyHistoryEntry`、`PolyHit`

### 导出关系

```ts
export type { GestureMode, GroupAction, GroupHandle, PolyEditMode, PolyEditOrigin, PolyGesture, PolyHandle, PolyHistoryEntry, PolyHistoryItem, PolyHistoryState, PolyHit, PolyMatrix, PolySnapshot, SelectionOperation };
```

## 4. 注意事项

- 只编辑单轮廓 Poly2D，不定义独立孔轮廓；新建逐点单击，右键提交。开放路径关闭填充，保留原始节点顺序。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">多边形 折线 顶点 插点 自交 开放 闭合</keywords>
<keywords language="en">polygon polyline vertex insert self-intersection open closed</keywords>
```
