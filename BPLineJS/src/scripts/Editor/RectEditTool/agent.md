# 矩形编辑器 RectEditTool

目录：`bplinejs/src/scripts/Editor/RectEditTool`

## 1. 文件结构与作用

参数化矩形的手柄编辑、组变换、吸附与历史。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `data.ts` | 抽取样式的可序列化参数；纹理资源仍由应用单独管理。；将纯数据写回独立样式，不更换 Color 对象引用。；把 Mesh 的编辑信息读成纯对象，选中边框使用保存的原始 Style。 |
| `geometry.ts` | 将世界点投到变换矩阵的局部平面，奇异矩阵不能用于编辑。；把世界点转换到 Mesh 父节点的坐标系。；按深度层和场景绘制次序排列命中候选，上层优先。 |
| `groupTransform.ts` | Rect 编辑器的 groupTransform 操作，复用主编辑器的实时配置和通知。 |
| `index.ts` | 仅编辑普通 Rect2D Mesh；编辑对象和辅助框由独立子组管理。 |
| `key.ts` | RectEditTool 的可改键盘快捷键。组合键用加号连接 KeyboardEvent.code， 例如 `Control+KeyV`；单独的 Control、Alt、Shift 同时匹配左右修饰键。 |
| `motion.ts` | Rect 编辑器的 motion 操作，复用主编辑器的实时配置和通知。 |
| `resize.ts` | Rect 编辑器的 resize 操作，复用主编辑器的实时配置和通知。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### RectEditTool

仅编辑普通 Rect2D Mesh；编辑对象和辅助框由独立子组管理。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 本工具搜索和修改 Mesh 的场景。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 编辑器覆盖层所在的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 指针坐标转换使用的相机。 |
| `selector`（公开） | `RectSelectTool`；`由构造参数或初始化过程赋值` | 复用现有的矩形框选判定。 |
| `group`（公开） | `Group`；`new Group(0, 0)` | 编辑器场景节点，便于整体管理两个子组。 |
| `frameGroup`（公开） | `Group`；`new Group(0, 0)` | 画框预览与组虚线边框所在的辅助组。 |
| `meshGroup`（公开） | `Group`；`new Group(0, 0)` | 由编辑器管理的普通矩形所在组。 |
| `_helperGrid`（内部） | `HelperGrid \| null`；`null` | 当前背景网格或 null。（helperGrid 的内部状态）。 |
| `radius`（公开） | `number`；`10` | 鼠标与角、边及顶点吸附的屏幕容差，单位 CSS 像素。 |
| `max`（公开） | `number`；`Infinity` | 矩形局部宽乘高的上限。 |
| `maxWidth`（公开） | `number`；`Infinity` | 新建或改尺寸时允许的最大局部宽度。 |
| `minWidth`（公开） | `number`；`0` | 新建或改尺寸时允许的最小局部宽度。 |
| `maxHeight`（公开） | `number`；`Infinity` | 新建或改尺寸时允许的最大局部高度。 |
| `minHeight`（公开） | `number`；`0` | 新建或改尺寸时允许的最小局部高度。 |
| `left`（公开） | `number`；`-Infinity` | 世界坐标中可活动区域的左边界。 |
| `top`（公开） | `number`；`Infinity` | 世界坐标中可活动区域的上边界，Y 轴向上。 |
| `right`（公开） | `number`；`Infinity` | 世界坐标中可活动区域的右边界。 |
| `bottom`（公开） | `number`；`-Infinity` | 世界坐标中可活动区域的下边界。 |
| `origin`（公开） | `RectEditOrigin`；`"left"` | 新建矩形时按下位置是对角起点还是中心。 |
| `ignoreZoom`（公开） | `boolean`；`false` | 下一个新建矩形是否保持屏幕尺寸，默认关闭；不改变已有对象。 |
| `autoPrecision`（公开） | `boolean`；`true` | 新建或 push 导入实体的自动精度开关，默认开启；已有实体可单独修改 Mesh.autoPrecision。 |
| `_order`（内部） | `number`；`0` | 下一次手绘矩形的层级，默认 0；导入对象保留自己的 order。 |
| `_orderSource`（内部） | `OrderSource \| null`；`null` | 状态由 `setOrderSource`、`sourceOrder` 读取或维护；完整处理见对应函数。 |
| `_style`（内部） | `Style`；`CreateDrawingStyle()` | 下一次新建矩形使用的样式模板，创建时会复制。 |
| `_material`（内部） | `Material2d`；`new BaseMaterial(this._style)` | 下一次新建矩形使用的材质模板，创建时会复制。 |
| `selectStyle`（公开） | `Style`；`CreateSelectionStyle(true)` | 选中矩形使用的边框与关键点样式模板。 |
| `activeOnly`（公开） | `boolean`；`true` | 首次点选未选中对象时是否只选中、不立即编辑。 |
| `translationStep`（公开） | `number`；`1` | 平移步进，单位为世界坐标；仅在 translationStepEnabled 开启时生效。 |
| `translationStepEnabled`（公开） | `boolean`；`false` | 是否把世界坐标吸附到以原点为基准的 translationStep 网格。 |
| `snap`（公开） | `boolean`；`false` | 吸附总开关，默认关闭；具体候选由 snapOptions 控制。 |
| `snapOptions`（公开） | `SnapOptions`；`CreateSnapOptions()` | 顶点、边线、交点和网格的独立吸附开关，默认全部开启。 |
| `rotationStep`（公开） | `number`；`1` | 旋转步进，单位为角度；仅在 rotationStepEnabled 开启时生效。 |
| `rotationStepEnabled`（公开） | `boolean`；`false` | 是否把单体与组旋转角度吸附到 rotationStep 的整数倍。 |
| `_rotationEnabled`（内部） | `boolean`；`true` | 单体和组旋转是否可用。（rotationEnabled 的内部状态）。 |
| `constrain`（公开） | `boolean`；`false` | 平移锁轴、四角等比缩放，并让新建及选择画框从按下点向四周展开。 |
| `_mult`（内部） | `boolean`；`true` | edit 模式是否允许保留多个选中对象。 |
| `actives`（公开） | `Mesh[]`；`[]` | 当前全部选中对象。 |
| `active`（公开） | `Mesh[]`；`[]` | 最近一次新选中的对象批次。 |
| `enabled`（公开） | `boolean`；`true` | 是否响应转发或自动注册的指针事件。 |
| `fromCollection`（公开） | `boolean`；`由构造参数或初始化过程赋值` | 是否由集合编辑器构建；集合模式允许组内矩形保留完整仿射缩放。 |
| `snapScene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 代理编辑时使用实际实体所在场景收集吸附候选，默认与 scene 相同。 |
| `snapExcluded`（公开） | `ReadonlySet<Mesh>`；`new Set()` | 代理编辑对应的真实实体，避免吸附到自身旧范围。 |
| `switches`（公开） | `EditSwitches`；`CreateEditSwitches()` | 指针选择、创建和变换的独立开关；默认全部开启。 |
| `_onSelect`（内部） | `按初始化值推断`；`new Map<string, (active: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onSelect`、`onSelectDelete`、`onSelectionChange`、`onSelectionChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onDeselect`（内部） | `按初始化值推断`；`new Map<string, (removed: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onDeselect`、`onDeselectDelete`、`select` 读取或维护；完整处理见对应函数。 |
| `_onSelectionChange`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onSelectionChange`、`onSelectionChangeDelete`、`select` 读取或维护；完整处理见对应函数。 |
| `_onMove`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onMove`、`onMoveDelete`、`notifyExternalMove`、`createRectMotionHooks` 读取或维护；完整处理见对应函数。 |
| `_onResize`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onResize`、`onResizeDelete`、`createRectResizeHooks` 读取或维护；完整处理见对应函数。 |
| `_onScale`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onScale`、`onScaleDelete`、`createRectGroupTransformHooks` 读取或维护；完整处理见对应函数。 |
| `_onRotate`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onRotate`、`onRotateDelete`、`createRectResizeHooks`、`createRectGroupTransformHooks` 读取或维护；完整处理见对应函数。 |
| `_onPositionChange`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onPositionChange`、`onPositionChangeDelete`、`notifyExternalMove`、`createRectMotionHooks` 读取或维护；完整处理见对应函数。 |
| `_onEdit`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onEdit`、`onEditDelete`、`toBase`、`notifyExternalMove` 读取或维护；完整处理见对应函数。 |
| `_onAdd`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onAdd`、`onAddDelete`、`load`、`push` 读取或维护；完整处理见对应函数。 |
| `_onRemove`（内部） | `按初始化值推断`；`new Map<string, (old: Mesh) => void>()` | 状态由 `onRemove`、`onRemoveDelete`、`load`、`remove` 读取或维护；完整处理见对应函数。 |
| `_onDestroy`（内部） | `按初始化值推断`；`new Map<string, () => void>()` | 状态由 `onDestroy`、`onDestroyDelete`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_onModeChange`（内部） | `按初始化值推断`；`new Map<string, (mode: RectEditMode) => void>()` | 状态由 `onModeChange`、`onModeChangeDelete`、`activeType` 读取或维护；完整处理见对应函数。 |
| `_onBase`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onBase`、`onBaseDelete`、`notifyBase` 读取或维护；完整处理见对应函数。 |
| `_baseDelegate`（内部） | `BaseDelegate \| null`；`null` | 状态由 `setBaseDelegate`、`toBase` 读取或维护；完整处理见对应函数。 |
| `_onSave`（内部） | `按初始化值推断`；`new Map<string, (data: RectEditDocument) => void>()` | 状态由 `onSave`、`onSaveDelete`、`save` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `RectEditRecord[]`；`[]` | 当前矩形的纯数据快照。（data 的内部状态）。 |
| `_dataVersions`（内部） | `按初始化值推断`；`new Map<number, string>()` | 状态由 `refreshData` 读取或维护；完整处理见对应函数。 |
| `_undoStack`（内部） | `(RectEditHistoryEntry \| BaseChange)[]`；`[]` | 状态由 `toBase`、`undoCount`、`commitHistory`、`undo` 读取或维护；完整处理见对应函数。 |
| `_redoStack`（内部） | `(RectEditHistoryEntry \| BaseChange)[]`；`[]` | 状态由 `toBase`、`redoCount`、`commitHistory`、`undo` 读取或维护；完整处理见对应函数。 |
| `_historyStart`（内部） | `RectEditHistoryState \| null`；`null` | 状态由 `beginHistory`、`commitHistory`、`remove`、`push` 读取或维护；完整处理见对应函数。 |
| `_historyReplay`（内部） | `boolean`；`false` | 状态由 `beginHistory`、`commitHistory`、`restoreHistoryState` 读取或维护；完整处理见对应函数。 |
| `_clipboard`（内部） | `Mesh[]`；`[]` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_clipboardClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_activeType`（内部） | `RectEditMode`；`"edit"` | 当前编辑模式。（activeType 的内部状态）。 |
| `_gesture`（内部） | `EditGesture \| null`；`null` | 状态由 `movingMeshes`、`update`、`cancel`、`trackTouchPointerDown` 读取或维护；完整处理见对应函数。 |
| `_groupFrame`（内部） | `Mesh \| null`；`null` | 状态由 `groupAction`、`removeGroupFrame`、`resetGroupFrame`、`update` 读取或维护；完整处理见对应函数。 |
| `_groupFrameCorners`（内部） | `Vec2[] \| null`；`null` | 状态由 `groupAction`、`removeGroupFrame`、`resetGroupFrame`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_groupFrameCustomized`（内部） | `boolean`；`false` | 状态由 `resetGroupFrame`、`update` 读取或维护；完整处理见对应函数。 |
| `_groupViewVersion`（内部） | `number`；`-1` | 状态由 `resetGroupFrame`、`update` 读取或维护；完整处理见对应函数。 |
| `_groupProjectionVersion`（内部） | `number`；`-1` | 状态由 `resetGroupFrame`、`update` 读取或维护；完整处理见对应函数。 |
| `_previewFrame`（内部） | `Mesh \| null`；`null` | 状态由 `removePreviewFrame`、`update` 读取或维护；完整处理见对应函数。 |
| `_rotationHandles`（内部） | `按初始化值推断`；`new Map<Mesh, Mesh>()` | 状态由 `removeRotationHandle`、`removeRotationHandles`、`updateRotationHandles` 读取或维护；完整处理见对应函数。 |
| `_savedStyles`（内部） | `按初始化值推断`；`new Map<Mesh, SavedStyle>()` | 状态由 `sourceStyle`、`captureUserRect`、`applySelectStyle`、`refreshSelectStyle` 读取或维护；完整处理见对应函数。 |
| `_appliedSelectStyle`（内部） | `Style`；`this.selectStyle` | 状态由 `update` 读取或维护；完整处理见对应函数。 |
| `_selectStyleVersion`（内部） | `number`；`this.selectStyle.version` | 状态由 `update` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `helper`、`update`、`destroy`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalCursor`（内部） | `string`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalTouchAction`（内部） | `string`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_touchPointers`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `destroy`、`trackTouchPointerDown`、`handleBlur`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_lastClient`（内部） | `Vec2 \| null`；`null` | 状态由 `activeType`、`rotationEnabled`、`copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_viewPointerId`（内部） | `number \| null`；`null` | 状态由 `beginViewPointer`、`clearViewPointer`、`handlePointerUp`、`handlePointerCancel` 读取或维护；完整处理见对应函数。 |
| `_viewContainerCursor`（内部） | `string \| null`；`null` | 状态由 `beginViewPointer`、`clearViewPointer` 读取或维护；完整处理见对应函数。 |
| `_motion`（内部） | `RectMotion`；`new RectMotion(this, this.createRectMotionHooks())` | motion 算法与主编辑器分开维护，配置由实时接口提供。 |
| `_resize`（内部） | `RectResize`；`new RectResize(this, this.createRectResizeHooks())` | resize 算法与主编辑器分开维护，配置由实时接口提供。 |
| `_groupTransform`（内部） | `RectGroupTransform`；`new RectGroupTransform(this, this.createRectGroupTransformHooks())` | groupTransform 算法与主编辑器分开维护，配置由实时接口提供。 |

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

创建矩形编辑器。关闭 autoBind 后可由合并编辑器转发 handlePointer* 事件。

```ts
const tool = new RectEditTool(scene, render, camera, true, false);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get style(): Style`  | 下次新建矩形的样式模板。 |
| `set style(value: Style)`  | 无返回值。 |
| `get order(): number`  | 下一次手绘矩形的层级，默认 0。 |
| `set order(value: number)`  | 无返回值。 |
| `setOrderSource(source: OrderSource \| null): void`  | 无返回值。 |
| `sourceOrder(node: Group): number`  | 不包含集合临时提升的层级。 |
| `sourceStyle(mesh: Mesh): Style`  | 未被选中装饰覆盖的用户样式。 |
| `get material(): Material2d`  | 下次新建矩形的材质模板。 |
| `set material(value: Material2d)`  | 无返回值。 |
| `emitCallbacks<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void` （内部） | 触发同一事件的全部具名监听，参数使用调用处提供的快照。 |
| `onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void`  | 注册或替换「本次新增与当前全部选中对象」监听。 |
| `onSelectDelete(key: string): boolean`  | 移除「本次新增与当前全部选中对象」监听。 |
| `onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void`  | 注册或替换「本次取消与剩余选中对象」监听。 |
| `onDeselectDelete(key: string): boolean`  | 移除「本次取消与剩余选中对象」监听。 |
| `onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换「完整选中集合变化」监听。 |
| `onSelectionChangeDelete(key: string): boolean`  | 移除「完整选中集合变化」监听。 |
| `onMove(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换「对象平移」监听。 |
| `onMoveDelete(key: string): boolean`  | 移除「对象平移」监听。 |
| `onResize(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换「矩形局部宽高变化」监听。 |
| `onResizeDelete(key: string): boolean`  | 移除「矩形局部宽高变化」监听。 |
| `onScale(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换「对象比例变化」监听。 |
| `onScaleDelete(key: string): boolean`  | 移除「对象比例变化」监听。 |
| `onRotate(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换「组合旋转」监听。 |
| `onRotateDelete(key: string): boolean`  | 移除「组合旋转」监听。 |
| `onPositionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换「位置变化」监听。 |
| `onPositionChangeDelete(key: string): boolean`  | 移除「位置变化」监听。 |
| `onEdit(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换「任意编辑变化」监听。 |
| `onEditDelete(key: string): boolean`  | 移除「任意编辑变化」监听。 |
| `onAdd(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换「对象加入编辑器」监听。 |
| `onAddDelete(key: string): boolean`  | 移除「对象加入编辑器」监听。 |
| `onRemove(key: string, callback: (old: Mesh) => void): void`  | 注册或替换「对象从编辑器移除」监听。 |
| `onRemoveDelete(key: string): boolean`  | 移除「对象从编辑器移除」监听。 |
| `onDestroy(key: string, callback: () => void): void`  | 注册或替换「编辑器销毁」监听。 |
| `onDestroyDelete(key: string): boolean`  | 移除「编辑器销毁」监听。 |
| `onModeChange(key: string, callback: (mode: RectEditMode) => void): void`  | 注册或替换「编辑模式变化」监听。 |
| `onModeChangeDelete(key: string): boolean`  | 移除「编辑模式变化」监听。 |
| `onBase(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onBaseDelete(key: string): boolean`  | 是否删除监听。 |
| `setBaseDelegate(delegate: BaseDelegate): void`  | 无返回值。 |
| `notifyBase(mesh: Mesh): void`  | 无返回值，触发具名降级监听。 |
| `toBase(): Mesh[]`  | 把当前选择降级为 Base2D；独立工具解除选择，集合工具移交统一 Base 编辑。 |
| `onSave(key: string, callback: (data: RectEditDocument) => void): void`  | 注册或替换「保存数据生成」监听。 |
| `onSaveDelete(key: string): boolean`  | 移除「保存数据生成」监听。 |
| `static build(scene: Scene, render: Render, camera: Camera): RectEditTool`  | 为合并编辑器创建不自动监听事件且不重复创建背景的矩形工具。 |
| `get helper(): boolean`  | 背景网格是否开启。 |
| `set helper(value: boolean)`  | 无返回值。 |
| `get helperGrid(): HelperGrid \| null`  | 当前背景网格或 null。 |
| `get movingMeshes(): Mesh[]`  | 当前平移手势中的矩形集合。 |
| `selectAll(): void`  | 无返回值，选择全部可编辑矩形并遵循 mult 开关。 |
| `notifyExternalMove(meshes: Mesh[]): void`  | 接收合并编辑器统一平移后的通知，不重新应用位移。 |
| `get activeType(): RectEditMode`  | 当前编辑模式。 |
| `set activeType(value: RectEditMode)`  | 无返回值。 |
| `get rotationEnabled(): boolean`  | 单体和组旋转是否可用。 |
| `set rotationEnabled(value: boolean)`  | 无返回值。 |
| `get mult(): boolean`  | 是否累积选中多个矩形。 |
| `set mult(value: boolean)`  | 无返回值。 |
| `get data(): readonly RectEditRecord[]`  | 当前矩形的纯数据快照。 |
| `get undoCount(): number`  | 可撤销的编辑动作数量。 |
| `get redoCount(): number`  | 可重做的编辑动作数量。 |
| `captureUserRect(mesh: Mesh): RectEditRecord` （内部） | 读取选中前的用户样式，避免把编辑高亮写入数据或剪贴板。 |
| `refreshData(force: boolean = false): void` （内部） | 收集可编辑矩形并仅在数据确实变化时替换数组，便于状态框架观察。 |
| `captureHistoryState(): RectEditHistoryState` （内部） | 把当前矩形状态连同对象引用保存为一次历史边界。 |
| `beginHistory(): void` （内部） | 无返回值。 |
| `commitHistory(): void` （内部） | 无返回值。 |
| `restoreHistoryState(state: RectEditHistoryState): void` （内部） | 恢复同一批矩形的添加、删除与属性编辑。 |
| `undo(): boolean`  | 是否恢复了上一批编辑。 |
| `redo(): boolean`  | 是否重新应用了一批编辑。 |
| `save(): RectEditDocument`  | 当前矩形的 JSON 数据并触发 onSave。 |
| `load(document: RectEditDocument): Mesh[]`  | 用保存的 JSON 重建编辑器矩形；运行期 Mesh ID 重新分配。 |
| `select(meshes: Mesh \| number \| readonly (Mesh \| number)[], operation: SelectionOperation = "replace"): void`  | 按替换、增量或减量方式更新选中集合。 |
| `applySelectStyle(mesh: Mesh): void` （内部） | 用独立样式覆盖选中对象的边与点，保留原样式供取消选择时恢复。 |
| `refreshSelectStyle(mesh: Mesh): void` （内部） | 把选择模板的边线和关键点应用到模型自身，避免额外 SVG 描边。 |
| `restoreStyle(mesh: Mesh): void` （内部） | 取消选中后恢复 Mesh、几何与材质之前各自使用的样式引用。 |
| `isGroupMode(): boolean` （内部） | 当前是否为组变换模式。 |
| `groupAction(client: Vec2, world: Vec2): GroupAction \| null` （内部） | 按屏幕容差区分组框边缘、内部与外部。 |
| `removeGroupFrame(): void` （内部） | 无返回值。 |
| `selectionScreenBounds(): ScreenBounds \| null` （内部） | 计算已选矩形四角在浏览器视口中的范围。 |
| `drawFrameCorners(frame: DrawFrame): Vec2[]` （内部） | 从画框仿射矩阵还原其世界四角，供组模式命中与变换使用。 |
| `resetGroupFrame(): void` （内部） | 无返回值。 |
| `removePreviewFrame(): void` （内部） | 无返回值。 |
| `removeRotationHandle(mesh: Mesh): void` （内部） | 撤下某件矩形对应的旋转辅助 Mesh。 |
| `removeRotationHandles(): void` （内部） | 无返回值。 |
| `rotationHandlePosition(mesh: Mesh): { top: Vec2; outward: Vec2 } \| null` （内部） | 求矩形上边中点和朝外方向，距离始终使用屏幕 CSS 像素。 |
| `pickRotationHandle(client: Vec2): Mesh \| null`  | 按场景绘制顺序命中某件选中矩形的旋转端点。 |
| `updateRotationHandles(): void` （内部） | 无返回值。 |
| `remove(mesh: Mesh): boolean`  | 从场景删除一个矩形并同步选择状态。 |
| `removeSelected(): Mesh[]`  | 删除当前选中的矩形，并保留统一的删除通知入口供后续撤销功能接管。 |
| `push(meshes: Mesh \| readonly Mesh[]): Mesh[]`  | 把一个或多个 Rect2D Mesh 加入编辑器管理组。 |
| `copySelected(): number`  | 已复制的矩形数量。 |
| `paste(): Mesh[]`  | 本次粘贴的新矩形。 |
| `cutSelected(): Mesh[]`  | 已剪切的矩形。 |
| `update(): void`  | 同步选中样式和画框预览 Mesh；画框使用当前相机的屏幕坐标系。 |
| `destroy(): void`  | 销毁指针监听和辅助组；把编辑 Mesh 放回场景根节点。 |
| `cancel(): void`  | 清除正在进行的画框或变换，不回滚已完成的逐帧编辑。 |
| `beginViewPointer(event: PointerEvent): void` （内部） | 查看模式按下时同步画布与容器光标，以覆盖相机控制器的容器指针捕获。 |
| `clearViewPointer(): void` （内部） | 结束查看模式的抓取光标，并恢复容器进入编辑器前的光标。 |
| `trackTouchPointerDown(event: PointerEvent): void` （内部） | 跟踪编辑区域的触点；第二根手指加入时把整轮触摸交给相机控制器。 |
| `handleBlur(): void` （内部） | 页面失焦后清空触点，避免下一轮单指被误判成多指。 |
| `handlePointerDown(event: PointerEvent): void`  | 接收鼠标左键或单指按下；autoBind 关闭时由上层编辑器转发。 |
| `handlePointerMove(event: PointerEvent): void`  | 处理悬停光标与拖动中的实时几何修改。 |
| `handlePointerUp(event: PointerEvent): void`  | 结束拖动，提交新矩形或增减框选集合。 |
| `handlePointerCancel(event: PointerEvent): void`  | 中止当前指针动作；已提交的逐帧变换保持不变。 |
| `pick(client: Vec2, world: Vec2): RectHit \| null` （内部） | 按实际绘制顺序命中上层矩形，每个矩形依次检查角、边和内部。 |
| `pickMesh(client: Vec2): Mesh \| null`  | 角、边或实体命中的矩形。 |
| `snapshots(meshes: readonly Mesh[]): MeshSnapshot[]` （内部） | 从选中 Mesh 保存变换快照，拖动全程以按下时状态计算以避免累计误差。 |
| `applyGesture(gesture: EditGesture): void` （内部） | 分发当前鼠标拖动到对应的编辑操作。 |
| `applyMove(gesture: EditGesture): void` （内部） | 按世界空间位移移动选中对象，并将联合边界限制在活动区域中。 |
| `captureMoveSnapVertices(gesture: EditGesture): void` （内部） | 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。 |
| `snapWorldCoordinate(coordinate: number): number` （内部） | 将世界坐标投影吸附到以零为起点的步进网格。 |
| `applyResize(gesture: EditGesture): void` （内部） | 拖动边或角时修改一个 Rect2D 的局部宽高及中心位置。 |
| `applyRectRotation(gesture: EditGesture): void` （内部） | 绕单个矩形自身中心旋转完整仿射轴，同时保留父级层次与历史快照。 |
| `applyGroupTransform(gesture: EditGesture): void` （内部） | 在虚线组边界上缩放或在外侧旋转各个 Mesh，不改变它们的父节点。 |
| `uniqueGeometry(mesh: Mesh): Rect2D` （内部） | 避免缩放一个 Mesh 时意外改变共用同一 Geometry 的其他实例。 |
| `drawFrame(gesture: Pick<EditGesture, "startClient" \| "currentClient">, applyLimits: boolean): DrawFrame \| null` （内部） | 将浏览器中的水平画框转换成世界矩形，预览、创建和框选使用同一结果。 |
| `clipDrawFrame(frame: DrawFrame, origin: Vec2): DrawFrame \| null` （内部） | 沿起点到画框各角的世界线段截取活动区域内最大的合法矩形。 |
| `applyDrawFrame(mesh: Mesh, frame: DrawFrame): void` （内部） | 把同一屏幕画框变换写到预览、选择或新建的 Mesh。 |
| `finishCreate(gesture: EditGesture): void` （内部） | 创建有效面积的新矩形并加入场景。 |
| `finishSelection(gesture: EditGesture, client: Vec2): void` （内部） | 完成单击或屏幕矩形框选，add/sub 模式只改变集合不修改模型。 |
| `resizedWorldBounds(matrix: ArrayLike<number>, centerX: number, centerY: number, width: number, height: number): RectBounds` （内部） | 读取矩形候选尺寸对应的世界轴向包围盒。 |
| `isAllowed(bounds: RectBounds): boolean` （内部） | 检查候选对象是否完全在世界活动区域内。 |
| `updateCursor(client: Vec2): void` （内部） | 根据组模式或命中边角刷新鼠标形状。 |
| `cursorAt(client: Vec2): string`  | 当前边角、旋转或移动的 CSS 光标。 |
| `createRectMotionHooks(): RectMotionHooks` （内部） | 连接 motion 状态的实时接口，不复制编辑对象。 |
| `createRectResizeHooks(): RectResizeHooks` （内部） | 连接 resize 状态的实时接口，不复制编辑对象。 |
| `createRectGroupTransformHooks(): RectGroupTransformHooks` （内部） | 连接 groupTransform 状态的实时接口，不复制编辑对象。 |

### 导出关系

```ts
export default RectEditTool;
export type { RectEditStyleData } from "./data";
export { default as RectEditToolKey } from "./key";
export type { RectEditDocument, RectEditMode, RectEditOrigin, RectEditRecord, RectHandle, SelectionOperation };
```

## 3. 其他源码文件

### 文件：data.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CaptureRectStyle` | 抽取样式的可序列化参数；纹理资源仍由应用单独管理。 |
| `ApplyRectStyle` | 将纯数据写回独立样式，不更换 Color 对象引用。 |
| `CaptureRect` | 把 Mesh 的编辑信息读成纯对象，选中边框使用保存的原始 Style。 |
| `ApplyRect` | 用记录恢复已存在的矩形，不改变它的 ID 与场景父级。 |
| `CreateRect` | 从 JSON 记录重建普通矩形，运行期 ID 由 Mesh 自行分配。 |

```ts
const data = CaptureRectStyle(mesh.style);
```

### 类型索引

`RectEditPartData`、`RectEditStyleData`、`RectEditRecord`、`RectEditDocument`

### 导出关系

```ts
export { ApplyRect, ApplyRectStyle, CaptureRect, CaptureRectStyle, CreateRect };
export type { RectEditDocument, RectEditRecord, RectEditStyleData };
```

### 文件：geometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ToLocal` | 将世界点投到变换矩阵的局部平面，奇异矩阵不能用于编辑。 |
| `ToParent` | 把世界点转换到 Mesh 父节点的坐标系。 |
| `CompareRankedMeshes` | 按深度层和场景绘制次序排列命中候选，上层优先。 |
| `SegmentDistance` | 求鼠标与屏幕线段的最近距离。 |
| `TransformPoint` | 对一个世界点应用组手势的二维仿射变换。 |
| `TransformWorldMatrix` | 将组仿射变换作用在按下时的 Mesh 世界矩阵上。 |
| `WorldToLocalMatrix` | 把期望的世界矩阵转换回对象父节点的局部矩阵。 |
| `MeshBounds` | 汇总选中矩形当前的世界轴向范围。 |
| `CopyMaterial` | 复制材质配置，让选中样式不会改变共用材质的其他 Mesh。 |
| `ContainsFrame` | 判断世界点是否落入可旋转的组框内。 |
| `CreateGroupFrame` | 用一份可独立变换的三角面 Mesh 显示组虚线框。 |
| `CreatePreviewFrame` | 创建由框组管理的画框预览 Mesh。 |

```ts
const local = ToLocal(matrix, point);
```

### 导出关系

```ts
export { CompareRankedMeshes, ContainsFrame, CopyMaterial, CreateGroupFrame, CreatePreviewFrame, MeshBounds, SegmentDistance, ToLocal, ToParent, TransformPoint, TransformWorldMatrix, WorldToLocalMatrix };
```

### 文件：groupTransform.ts

### RectGroupTransform

Rect 编辑器的 groupTransform 操作，复用主编辑器的实时配置和通知。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_tool`（内部） | `RectEditTool`；`由构造参数或初始化过程赋值` | 主编辑器（构造参数引用）。 |
| `_hooks`（内部） | `RectGroupTransformHooks`；`由构造参数或初始化过程赋值` | 状态和通知入口（构造参数引用）。 |

#### 构造与案例

```ts
constructor(tool: RectEditTool, hooks: RectGroupTransformHooks)
```

操作模块。

```ts
new RectGroupTransform(tool, hooks);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `groupScaleTransform(gesture: EditGesture): AffineTransform \| null`  | 从被拖动的边或角构造组框局部轴上的缩放，越过对边时保留负比例。 |
| `applyGroupTransform(gesture: EditGesture): void`  | 在虚线组边界上缩放或在外侧旋转各个 Mesh，不改变它们的父节点。 |

### 类型索引

`RectGroupTransformHooks`

### 导出关系

```ts
export default RectGroupTransform;
export type { RectGroupTransformHooks };
```

### 文件：key.ts

### RectEditToolKey

RectEditTool 的可改键盘快捷键。组合键用加号连接 KeyboardEvent.code，
例如 `Control+KeyV`；单独的 Control、Alt、Shift 同时匹配左右修饰键。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `tool`（公开） | `RectKeyTarget`；`由构造参数或初始化过程赋值` | 使用快捷键的编辑器。 |
| `viewCode`（公开） | `string`；`"KeyV"` | 点击后切到查看模式。 |
| `editCode`（公开） | `string`；`"KeyE"` | 点击后切到编辑模式。 |
| `groupCode`（公开） | `string`；`"KeyG"` | 点击后进入组变换模式。 |
| `addCode`（公开） | `string`；`"Control"` | 按住时增选，松开后恢复原模式。 |
| `subCode`（公开） | `string`；`"Alt"` | 按住时减选，松开后恢复原模式。 |
| `constrainCode`（公开） | `string`；`"Shift"` | 按住时锁定移动轴、四角宽高比，并让画框以按下点为中心。 |
| `stepCode`（公开） | `string`；`"KeyS"` | 点击后同时切换平移和旋转步进。 |
| `snapCode`（公开） | `string`；`"KeyP"` | 点击后切换吸附总开关。 |
| `snapVertexCode`（公开） | `string`；`"KeyP+Digit1"` | 点击后切换顶点吸附，默认 P+1。 |
| `snapEdgeCode`（公开） | `string`；`"KeyP+Digit2"` | 点击后切换边线吸附，默认 P+2。 |
| `snapIntersectionCode`（公开） | `string`；`"KeyP+Digit3"` | 点击后切换交点吸附，默认 P+3。 |
| `snapGridCode`（公开） | `string`；`"KeyP+Digit4"` | 点击后切换细格吸附，默认 P+4。 |
| `multCode`（公开） | `string`；`"KeyM"` | 点击后切换多选开关。 |
| `removeCode`（公开） | `string`；`"Delete"` | 点击后删除当前选中集合。 |
| `cameraResetCode`（公开） | `string`；`"Space"` | 点击后把相机位置移回世界原点。 |
| `centerCode`（公开） | `string`；`"KeyC"` | 按住时以中心为新建起点，松开回到 left。 |
| `copyCode`（公开） | `string`；`"Control+KeyC"` | 复制当前选中矩形。 |
| `pasteCode`（公开） | `string`；`"Control+KeyV"` | 粘贴复制的矩形。 |
| `cutCode`（公开） | `string`；`"Control+KeyX"` | 剪切当前选中矩形。 |
| `undoCode`（公开） | `string`；`"Control+KeyZ"` | 撤销上一批编辑。 |
| `redoCode`（公开） | `string`；`"Control+Shift+KeyZ"` | 重做上一批编辑。 |
| `redoAlternateCode`（公开） | `string`；`"Control+KeyY"` | 重做的备用组合键。 |
| `saveCode`（公开） | `string`；`"Control+KeyS"` | 生成 JSON 并触发 onSave。 |
| `baseCode`（公开） | `string`；`"KeyB"` | 首次按下时主动降级已选几何，默认 B；文字输入框内不接管。 |
| `selectAllCode`（公开） | `string`；`"Control+KeyA"` | 全选本工具可编辑的对象，输入控件内保留原生文字全选。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_pressed`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `isPressed`、`hasPressedModifier`、`activateBase`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_armedClicks`（内部） | `按初始化值推断`；`new Map<ClickAction, string>()` | 状态由 `armClicks`、`activateBase`、`handleKeyUp`、`handleBlur` 读取或维护；完整处理见对应函数。 |
| `_previousMode`（内部） | `RectEditMode \| null`；`null` | 状态由 `syncMode`、`activateClick` 读取或维护；完整处理见对应函数。 |
| `_previousConstrain`（内部） | `boolean \| null`；`null` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_centerHeld`（内部） | `boolean`；`false` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_addOrder`（内部） | `number`；`0` | 状态由 `syncMode`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_subOrder`（内部） | `number`；`0` | 状态由 `syncMode`、`handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_pressOrder`（内部） | `number`；`0` | 状态由 `handleKeyDown` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `handleKeyDown`、`handleKeyUp`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_cameraControl`（内部） | `CameraControl \| null`；`由构造参数或初始化过程赋值` | 可选相机控制器；编辑时交出左键和单指，查看时恢复原开关（构造参数引用）。 |
| `_originalLeftDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`syncCameraControl`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_originalOFDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`syncCameraControl`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_nextListenerId`（内部） | `number`；`0` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_modeListenerKey`（内部） | `string`；``RectEditToolKey:${String(RectEditToolKey._nextListenerId)}`` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(tool: RectKeyTarget, cameraControl: CameraControl | null = null)
```

注册窗口级快捷键，使用 destroy 可移除监听。

```ts
const keys = new RectEditToolKey(tool);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
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

`RectKeyTarget`、`ClickAction`、`ClickBinding`

### 导出关系

```ts
export default RectEditToolKey;
```

### 文件：motion.ts

### RectMotion

Rect 编辑器的 motion 操作，复用主编辑器的实时配置和通知。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_tool`（内部） | `RectEditTool`；`由构造参数或初始化过程赋值` | 主编辑器（构造参数引用）。 |
| `_hooks`（内部） | `RectMotionHooks`；`由构造参数或初始化过程赋值` | 状态和通知入口（构造参数引用）。 |

#### 构造与案例

```ts
constructor(tool: RectEditTool, hooks: RectMotionHooks)
```

操作模块。

```ts
new RectMotion(tool, hooks);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `applyMove(gesture: EditGesture): void`  | 按世界空间位移移动选中对象，并将联合边界限制在活动区域中。 |
| `captureMoveSnapVertices(gesture: EditGesture): void`  | 冻结本次移动的四角和其他矩形的目标四角；圆角不改变吸附位置。 |
| `findMoveVertexSnap( gesture: EditGesture, rawX: number, rawY: number, bounds: RectBounds, lockedAxis: Vec2 \| null, ): MoveSnapCandidate \| null`  | 查找原始拖动位置附近最近的矩形顶点，并返回整批对象共用的位移。 |

### 类型索引

`RectMotionHooks`

### 导出关系

```ts
export default RectMotion;
export type { RectMotionHooks };
```

### 文件：resize.ts

### RectResize

Rect 编辑器的 resize 操作，复用主编辑器的实时配置和通知。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_tool`（内部） | `RectEditTool`；`由构造参数或初始化过程赋值` | 主编辑器（构造参数引用）。 |
| `_hooks`（内部） | `RectResizeHooks`；`由构造参数或初始化过程赋值` | 状态和通知入口（构造参数引用）。 |

#### 构造与案例

```ts
constructor(tool: RectEditTool, hooks: RectResizeHooks)
```

操作模块。

```ts
new RectResize(tool, hooks);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `snapWorldCoordinate(coordinate: number): number`  | 将世界坐标投影吸附到以零为起点的步进网格。 |
| `snapEdgeToWorldGrid(matrix: ArrayLike<number>, coordinate: number, axis: "x" \| "y"): number`  | 将被拖动的局部边投影到世界轴，并吸附到从世界原点开始的网格。 |
| `snapResizeVertices( gesture: EditGesture, matrix: ArrayLike<number>, handle: RectHandle, raw: ResizeEdges, stepped: ResizeEdges, width: number, height: number, ): ResizeEdges`  | 尺寸手势中让活动角贴合其他矩形顶点；与步进同时开启时采用屏幕距离较近者。 |
| `applyResize(gesture: EditGesture): void`  | 拖动边或角时修改一个 Rect2D 的局部宽高及中心位置。 |
| `applyRectRotation(gesture: EditGesture): void`  | 绕单个矩形自身中心旋转完整仿射轴，同时保留父级层次与历史快照。 |
| `resizedWorldBounds(matrix: ArrayLike<number>, centerX: number, centerY: number, width: number, height: number): RectBounds`  | 读取矩形候选尺寸对应的世界轴向包围盒。 |
| `isAllowed(bounds: RectBounds): boolean`  | 检查候选对象是否完全在世界活动区域内。 |

### 类型索引

`RectResizeHooks`

### 导出关系

```ts
export default RectResize;
export type { RectResizeHooks };
```

### 文件：types.ts


### 类型索引

`RectEditMode`、`RectEditOrigin`、`SelectionOperation`、`RectHandle`、`GestureMode`、`ResizeEdges`、`MatrixValues`、`RectBounds`、`ScreenBounds`、`DrawFrame`、`RectHit`、`RankedMesh`、`MeshSnapshot`、`GroupAction`、`AffineTransform`、`GroupCandidate`、`EditGesture`、`MoveSnapCandidate`、`SavedStyle`、`RectEditHistoryItem`、`RectEditHistoryState`、`RectEditHistoryEntry`

### 导出关系

```ts
export type { AffineTransform, DrawFrame, EditGesture, GestureMode, GroupAction, GroupCandidate, MatrixValues, MeshSnapshot, MoveSnapCandidate, RankedMesh, RectBounds, RectEditHistoryEntry, RectEditHistoryItem, RectEditHistoryState, RectEditMode, RectEditOrigin, RectHandle, RectHit, ResizeEdges, SavedStyle, ScreenBounds, SelectionOperation };
```

## 4. 注意事项

- index 保留字段、构造与交互入口；motion、resize、groupTransform 通过实时 hooks 共享状态，不能复制旧配置。独立组缩放保护矩形形状。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">矩形 编辑器 圆角 边角 尺寸 组缩放</keywords>
<keywords language="en">rectangle editor rounded corner handle resize group scale</keywords>
```
