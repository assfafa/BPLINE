# 文字编辑器 TextEditTool

目录：`bplinejs/src/scripts/Editor/TextEditTool`

## 1. 文件结构与作用

排版矩形编辑、文字光标输入、选区与独立输入历史。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `data.ts` | 可序列化文字记录。 |
| `events.ts` | 具名回调表独立于输入和变换实现，删除同名监听不会影响其他接收者。 |
| `index.ts` | 文字以排版框编辑变换；二次单击进入输入，文字本身没有轮廓关键点。 |
| `input.ts` | 原生输入控件承接 IME、光标拖选和文字剪贴板；历史仅限当前文字内容。 |
| `key.ts` | 对象变换复用矩形快捷键，输入控件内的按键由文字会话独享。 |

## 2. index 入口、案例与类接口

### TextEditTool

文字以排版框编辑变换；二次单击进入输入，文字本身没有轮廓关键点。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 文字实体所在场景。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 提供画布与像素尺寸的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 屏幕定位相机。 |
| `selector`（公开） | `TextSelectTool`；`由构造参数或初始化过程赋值` | 文字包围盒点选、框选和行列查询。 |
| `group`（公开） | `Group`；`new Group(0, 0)` | 文字编辑器场景节点。 |
| `meshGroup`（公开） | `Group`；`new Group(0, 0)` | 文字实体组。 |
| `frameGroup`（公开） | `Group`；`new Group(0, 0)` | 排版框与旋转手柄所在覆盖层。 |
| `actives`（公开） | `Mesh[]`；`[]` | 当前选中对象。 |
| `active`（公开） | `Mesh[]`；`[]` | 最近一批新选中对象。 |
| `fontFamily`（公开） | `string`；`""` | 下一次创建文字使用的注册字体名；空串自动取 Font.map 第一项。 |
| `fontSize`（公开） | `number`；`16` | 下一次创建文字的字号，默认 16。 |
| `letterSpacing`（公开） | `number`；`0` | 下一次创建文字的额外字间距。 |
| `lineSpacing`（公开） | `number`；`0` | 下一次创建文字的额外行间距。 |
| `textAlign`（公开） | `TextAlign`；`"left"` | 下一次文字的行对齐方式，默认 left。 |
| `baseline`（公开） | `TextBaseline`；`"middle"` | 下一次文字的基线锚点。 |
| `writingMode`（公开） | `TextWritingMode`；`"horizontal-tb"` | 下一次文字的排列顺序。 |
| `ignoreZoom`（公开） | `boolean`；`false` | 下一次创建的实体是否抵消 zoom；不改变已有文字。 |
| `autoPrecision`（公开） | `boolean`；`true` | 新建或 push 导入文字的自动精度开关，默认开启；load 保留文档记录。 |
| `_order`（内部） | `number`；`0` | 下一次新建文字的层级，默认 0；导入对象保留自己的 order。 |
| `_orderSource`（内部） | `OrderSource \| null`；`null` | 状态由 `setOrderSource`、`sourceOrder` 读取或维护；完整处理见对应函数。 |
| `enabled`（公开） | `boolean`；`true` | 是否接收编辑输入。 |
| `fromCollection`（公开） | `boolean`；`由构造参数或初始化过程赋值` | 是否由集合构建，集合组变换由上层统一接管。 |
| `_controls`（内部） | `RectEditTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`style`、`material`、`selectStyle` 读取或维护；完整处理见对应函数。 |
| `_proxies`（内部） | `按初始化值推断`；`new Map<Mesh, TextProxy>()` | 状态由 `select`、`update`、`destroy`、`syncProxies` 读取或维护；完整处理见对应函数。 |
| `_history`（内部） | `EditHistory`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`undoCount`、`redoCount`、`push` 读取或维护；完整处理见对应函数。 |
| `_ownsHistory`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_input`（内部） | `TextInput \| null`；`null` | 当前输入控件或 null。（input 的内部状态）。 |
| `_editingMesh`（内部） | `Mesh \| null`；`null` | 状态由 `sourceStyle`、`sourceMaterial`、`select`、`beginEditing` 读取或维护；完整处理见对应函数。 |
| `_editingStyle`（内部） | `Style \| null`；`null` | 状态由 `sourceStyle`、`beginEditing`、`finishEditing` 读取或维护；完整处理见对应函数。 |
| `_editingMaterial`（内部） | `Material2d \| null`；`null` | 状态由 `sourceMaterial`、`beginEditing`、`finishEditing` 读取或维护；完整处理见对应函数。 |
| `_gesture`（内部） | `TextGesture \| null`；`null` | 状态由 `handlePointerDown`、`handlePointerMove`、`handlePointerUp`、`handlePointerCancel` 读取或维护；完整处理见对应函数。 |
| `_clipboard`（内部） | `Mesh[]`；`[]` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_lastClient`（内部） | `Vec2 \| null`；`null` | 状态由 `handlePointerDown`、`handlePointerMove`、`copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_clipboardClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `handlePointerDown`、`update`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_activeOnly`（内部） | `boolean`；`true` | 首次单击只选择的开关。（activeOnly 的内部状态）。 |
| `_data`（内部） | `TextEditRecord[]`；`[]` | 可绑定到状态框架的文字数据。（data 的内部状态）。 |
| `_dataSignature`（内部） | `string`；`"[]"` | 状态由 `refreshData` 读取或维护；完整处理见对应函数。 |
| `_touchPointers`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `handlePointerDown`、`handlePointerUp`、`handlePointerCancel` 读取或维护；完整处理见对应函数。 |
| `_baseDelegate`（内部） | `BaseDelegate \| null`；`null` | 状态由 `setBaseDelegate`、`toBase` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera,
        autoBind: boolean = true, helper: boolean = autoBind, fromCollection: boolean = false,
        history?: EditHistory)
```

创建可独立或由集合转发的字体编辑器。

```ts
const tool = new TextEditTool(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static build(scene: Scene, render: Render, camera: Camera, history?: EditHistory): TextEditTool`  | 无独立事件和网格的集合子工具。 |
| `get order(): number`  | 下一次新建文字的层级，默认 0。 |
| `set order(value: number)`  | 无返回值。 |
| `setOrderSource(source: OrderSource \| null): void`  | 无返回值。 |
| `sourceOrder(node: Group): number`  | 不包含集合临时提升的层级。 |
| `get style(): Style`  | 下一次创建的样式模板。 |
| `set style(value: Style)`  | 无返回值。 |
| `get material(): Material2d`  | 下一次创建的材质模板。 |
| `set material(value: Material2d)`  | 无返回值。 |
| `get selectStyle(): Style`  | 包围框选中样式；不创建文字关键点。 |
| `set selectStyle(value: Style)`  | 无返回值。 |
| `get activeOnly(): boolean`  | 首次单击只选择的开关。 |
| `set activeOnly(value: boolean)`  | 无返回值。 |
| `get mult(): boolean`  | 多选开关。 |
| `set mult(value: boolean)`  | 无返回值。 |
| `get radius(): number`  | 边角、旋转与吸附的屏幕容差。 |
| `set radius(value: number)`  | 无返回值。 |
| `get max(): number`  | 最大局部包围框面积。 |
| `set max(value: number)`  | 无返回值。 |
| `get maxWidth(): number`  | 最大局部包围框宽度。 |
| `set maxWidth(value: number)`  | 无返回值。 |
| `get minWidth(): number`  | 最小局部包围框宽度。 |
| `set minWidth(value: number)`  | 无返回值。 |
| `get maxHeight(): number`  | 最大局部包围框高度。 |
| `set maxHeight(value: number)`  | 无返回值。 |
| `get minHeight(): number`  | 最小局部包围框高度。 |
| `set minHeight(value: number)`  | 无返回值。 |
| `get left(): number`  | 最左世界活动范围。 |
| `set left(value: number)`  | 无返回值。 |
| `get right(): number`  | 最右世界活动范围。 |
| `set right(value: number)`  | 无返回值。 |
| `get top(): number`  | 最上世界活动范围。 |
| `set top(value: number)`  | 无返回值。 |
| `get bottom(): number`  | 最下世界活动范围。 |
| `set bottom(value: number)`  | 无返回值。 |
| `get origin(): RectEditOrigin`  | 创建起点配置。 |
| `set origin(value: RectEditOrigin)`  | 无返回值。 |
| `get translationStep(): number`  | 世界原点平移步进。 |
| `set translationStep(value: number)`  | 无返回值。 |
| `get translationStepEnabled(): boolean`  | 平移步进开关。 |
| `set translationStepEnabled(value: boolean)`  | 无返回值。 |
| `get rotationStep(): number`  | 旋转步进角度。 |
| `set rotationStep(value: number)`  | 无返回值。 |
| `get rotationStepEnabled(): boolean`  | 旋转步进开关。 |
| `set rotationStepEnabled(value: boolean)`  | 无返回值。 |
| `get rotationEnabled(): boolean`  | 单体与组旋转开关。 |
| `set rotationEnabled(value: boolean)`  | 无返回值。 |
| `get snap(): boolean`  | 吸附总开关。 |
| `set snap(value: boolean)`  | 无返回值。 |
| `get snapOptions(): SnapOptions`  | 四类包围框吸附开关。 |
| `set snapOptions(value: SnapOptions)`  | 无返回值。 |
| `get constrain(): boolean`  | 锁轴移动与等比四角缩放。 |
| `set constrain(value: boolean)`  | 无返回值。 |
| `get switches(): EditSwitches`  | 独立交互功能开关。 |
| `set switches(value: EditSwitches)`  | 无返回值。 |
| `get helper(): boolean`  | 网格显示开关。 |
| `set helper(value: boolean)`  | 无返回值。 |
| `get activeType(): RectEditMode`  | 当前变换模式。 |
| `set activeType(value: RectEditMode)`  | 无返回值。 |
| `get input(): HTMLTextAreaElement \| null`  | 当前输入控件或 null。 |
| `get editing(): boolean`  | 是否处于文字输入状态。 |
| `get movingMeshes(): Mesh[]`  | 当前正在平移的文字实体。 |
| `selectAll(): void`  | 无返回值，选择全部可编辑文字并遵循 mult 开关。 |
| `notifyExternalMove(meshes: Mesh[]): void`  | 接收合并编辑器统一平移后的通知，不通过矩形代理重复变换文字。 |
| `get data(): readonly TextEditRecord[]`  | 可绑定到状态框架的文字数据。 |
| `get undoCount(): number`  | 对象操作的可撤销数量。 |
| `get redoCount(): number`  | 对象操作的可重做数量。 |
| `sourceStyle(mesh: Mesh): Style`  | 未被输入隐去的原始样式。 |
| `sourceMaterial(mesh: Mesh): Material2d \| undefined`  | 输入时被临时隐藏前的用户材质。 |
| `select(meshes: Mesh \| number \| readonly (Mesh \| number)[], operation: SelectionOperation = "replace"): void`  | 无返回值。 |
| `push(meshes: Mesh \| readonly Mesh[]): Mesh[]`  | 实际加入场景的文字。 |
| `beginEditing(mesh: Mesh, client?: Vec2): boolean`  | 是否进入文字输入。 |
| `finishEditing(): void`  | 无返回值，提交输入；空串退出时移除实体，撤销可恢复。 |
| `handlePointerDown(event: PointerEvent): void`  | 无返回值。 |
| `handlePointerMove(event: PointerEvent): void`  | 无返回值。 |
| `handlePointerUp(event: PointerEvent): void`  | 无返回值。 |
| `handlePointerCancel(event: PointerEvent): void`  | 无返回值。 |
| `cancel(): void`  | 无返回值。 |
| `pickMesh(client: Vec2): Mesh \| null`  | 包围框或边角命中的文字实体。 |
| `pickRotationHandle(client: Vec2): Mesh \| null`  | 旋转图标所属文字或 null。 |
| `cursorAt(client: Vec2): string`  | 文字输入或变换操作的 CSS 光标。 |
| `update(): void`  | 无返回值，同步包围框和输入面。 |
| `undo(): boolean`  | 是否撤销了对象编辑。 |
| `redo(): boolean`  | 是否重做了对象编辑。 |
| `remove(mesh: Mesh): boolean`  | 是否删除。 |
| `setBaseDelegate(delegate: BaseDelegate): void`  | 无返回值。 |
| `toBase(): Mesh[]`  | 结束文字输入并把已选文字转为可编辑轮廓的 Base2D。 |
| `removeSelected(): Mesh[]`  | 被删除的文字实体。 |
| `copySelected(): number`  | 复制的对象数量。 |
| `paste(): Mesh[]`  | 按鼠标位置或兜底偏移粘贴的对象。 |
| `cutSelected(): Mesh[]`  | 被剪切的文字实体。 |
| `save(): TextEditDocument`  | 文字纯数据文档，同时触发所有 onSave。 |
| `load(document: TextEditDocument): Mesh[]`  | 恢复的文字实体。 |
| `destroy(): void`  | 无返回值，移除编辑覆盖层与输入会话。 |
| `meshes(): Mesh[]` （内部） | 当前场景内可编辑的文字实体。 |
| `syncProxies(): void` （内部） | 无返回值，代理矩形不生成字体轮廓。 |
| `positionFrame(frame: Mesh, mesh: Mesh, x: number, y: number): void` （内部） | 无返回值。 |
| `proxySelection(): Mesh[]` （内部） | 选中文字对应的控制代理。 |
| `mapProxies(proxies: readonly (Mesh \| null)[]): Mesh[]` （内部） | 对应真实文字实体。 |
| `syncTransforms(): void` （内部） | 无返回值，把 Rect 控制结果转成可表示的文字 TRS。 |
| `synchronizeStyle(mesh: Mesh): void` （内部） | 无返回值，补齐实体样式对字体几何的下发。 |
| `refreshData(): void` （内部） | 无返回值，仅内容变化时替换纯数据数组。 |
| `inputChanged(): void` （内部） | 无返回值，同步输入内容和包围框，退出时统一提交历史。 |
| `notifyMove(proxies: Mesh[]): void` （内部） | 无返回值。 |
| `notifyRotate(proxies: Mesh[]): void` （内部） | 无返回值。 |
| `notifyResize(proxy: Mesh): void` （内部） | 无返回值。 |
| `notifyScale(proxy: Mesh): void` （内部） | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `SetWorld` | 无返回值。 |

```ts
SetWorld(mesh, matrix);
```

### 类型索引

`MatrixValues`、`TextProxy`、`TextGesture`

### 导出关系

```ts
export default TextEditTool;
export type { TextEditDocument, TextEditRecord } from "./data";
export { default as TextEditToolKey } from "./key";
export { TextEditTool };
```

## 3. 其他源码文件

### 文件：data.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CaptureText` | 可序列化文字记录。 |

```ts
CaptureText(mesh, style);
```

### 类型索引

`TextEditRecord`、`TextEditDocument`

### 导出关系

```ts
export { CaptureText };
export type { TextEditDocument, TextEditRecord };
```

### 文件：events.ts

### TextEditEvents

具名回调表独立于输入和变换实现，删除同名监听不会影响其他接收者。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_onSelect`（公开） | `按初始化值推断`；`new Map<string, (active: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onSelect`、`onSelectDelete`、`onSelectionChange`、`onSelectionChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onDeselect`（公开） | `按初始化值推断`；`new Map<string, (removed: Mesh[], actives: Mesh[]) => void>()` | 状态由 `onDeselect`、`onDeselectDelete` 读取或维护；完整处理见对应函数。 |
| `_onSelectionChange`（公开） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onSelectionChange`、`onSelectionChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onMove`（公开） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onMove`、`onMoveDelete` 读取或维护；完整处理见对应函数。 |
| `_onResize`（公开） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onResize`、`onResizeDelete` 读取或维护；完整处理见对应函数。 |
| `_onScale`（公开） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onScale`、`onScaleDelete` 读取或维护；完整处理见对应函数。 |
| `_onRotate`（公开） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onRotate`、`onRotateDelete` 读取或维护；完整处理见对应函数。 |
| `_onPositionChange`（公开） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onPositionChange`、`onPositionChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onEdit`（公开） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onEdit`、`onEditDelete` 读取或维护；完整处理见对应函数。 |
| `_onAdd`（公开） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onAdd`、`onAddDelete` 读取或维护；完整处理见对应函数。 |
| `_onRemove`（公开） | `按初始化值推断`；`new Map<string, (old: Mesh) => void>()` | 状态由 `onRemove`、`onRemoveDelete` 读取或维护；完整处理见对应函数。 |
| `_onDestroy`（公开） | `按初始化值推断`；`new Map<string, () => void>()` | 状态由 `onDestroy`、`onDestroyDelete` 读取或维护；完整处理见对应函数。 |
| `_onModeChange`（公开） | `按初始化值推断`；`new Map<string, (mode: RectEditMode) => void>()` | 状态由 `onModeChange`、`onModeChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onSave`（公开） | `按初始化值推断`；`new Map<string, (data: TextEditDocument) => void>()` | 状态由 `onSave`、`onSaveDelete` 读取或维护；完整处理见对应函数。 |
| `_onBase`（公开） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onBase`、`onBaseDelete`、`notifyBase` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `onBase(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onBaseDelete(key: string): boolean`  | 是否删除监听。 |
| `notifyBase(mesh: Mesh): void`  | 无返回值，触发具名降级监听。 |
| `onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void`  | 注册或替换新增选择和完整选择集的监听。 |
| `onSelectDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void`  | 注册或替换取消选择和剩余选择集的监听。 |
| `onDeselectDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换完整选择集的监听。 |
| `onSelectionChangeDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onMove(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换被移动文字的监听。 |
| `onMoveDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onResize(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换被改尺寸文字的监听。 |
| `onResizeDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onScale(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换被缩放文字的监听。 |
| `onScaleDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onRotate(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换被旋转文字的监听。 |
| `onRotateDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onPositionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换位置变化文字的监听。 |
| `onPositionChangeDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onEdit(key: string, callback: (actives: Mesh[]) => void): void`  | 注册或替换发生编辑的文字的监听。 |
| `onEditDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onAdd(key: string, callback: (mesh: Mesh) => void): void`  | 注册或替换新建文字的监听。 |
| `onAddDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onRemove(key: string, callback: (old: Mesh) => void): void`  | 注册或替换被删除文字的监听。 |
| `onRemoveDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onDestroy(key: string, callback: () => void): void`  | 注册或替换工具销毁的监听。 |
| `onDestroyDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onModeChange(key: string, callback: (mode: RectEditMode) => void): void`  | 注册或替换新的编辑模式的监听。 |
| `onModeChangeDelete(key: string): boolean`  | 是否删除已有监听。 |
| `onSave(key: string, callback: (data: TextEditDocument) => void): void`  | 注册或替换可序列化文字文档的监听。 |
| `onSaveDelete(key: string): boolean`  | 是否删除已有监听。 |
| `emit<Args extends unknown[]>(map: Map<string, (...args: Args) => void>, ...args: Args): void`  | 无返回值。 |

### 导出关系

```ts
export default TextEditEvents;
```

### 文件：input.ts

### TextInput

原生输入控件承接 IME、光标拖选和文字剪贴板；历史仅限当前文字内容。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `element`（公开） | `HTMLTextAreaElement`；`document.createElement("textarea")` | 当前输入控件，应用可读取原生 selectionStart/End。 |
| `_mesh`（内部） | `Mesh`；`由构造参数或初始化过程赋值` | 当前文字（构造参数引用）。 |
| `_camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 相机（构造参数引用）。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 渲染器（构造参数引用）。 |
| `_onChange`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 修改后同步几何（构造参数引用）。 |
| `_onFinish`（内部） | `() => void`；`由构造参数或初始化过程赋值` | Escape 结束输入（构造参数引用）。 |
| `_onBeforeChange`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 修改前保存对象历史（构造参数引用）。 |
| `_onSave`（内部） | `() => void`；`由构造参数或初始化过程赋值` | Ctrl+S 输出当前文字文档（构造参数引用）。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_undo`（内部） | `InputState[]`；`[]` | 状态由 `input`、`keyDown` 读取或维护；完整处理见对应函数。 |
| `_redo`（内部） | `InputState[]`；`[]` | 状态由 `input`、`keyDown` 读取或维护；完整处理见对应函数。 |
| `_selectionStyle`（内部） | `HTMLStyleElement`；`document.createElement("style")` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_before`（内部） | `InputState`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`beforeInput`、`input`、`compositionStart` 读取或维护；完整处理见对应函数。 |
| `_composing`（内部） | `boolean`；`false` | 状态由 `beforeInput`、`input`、`compositionStart`、`compositionEnd` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `constructor`、`update`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(mesh: Mesh, camera: Camera, render: Render, color: string,
        onBeforeChange: () => void, onChange: () => void, onFinish: () => void, onSave: () => void)
```

创建透明输入面，由真实字体渲染光标和选区背景。

```ts
const input = new TextInput(mesh, camera, render, color, before, changed, finish, save);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `update(): void`  | 无返回值。按显示矩阵更新输入面，不修改对象世界变换。 |
| `setCaret(index: number): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值。 |
| `capture(): InputState` （内部） | 原文和选区的纯数据快照。 |
| `beforeInput(): void` （内部） | 无返回值。原生改动前保存选区。 |
| `input(): void` （内部） | 无返回值。同步已提交的文字。 |
| `compositionStart(): void` （内部） | 无返回值。 |
| `compositionEnd(): void` （内部） | 无返回值。 |
| `forwardWheel(event: WheelEvent): void` （内部） | 输入面位于 body，主动把滚轮交给渲染容器里的相机控制器。 |
| `keyDown(event: KeyboardEvent): void` （内部） | 无返回值。 |

### 类型索引

`InputState`

### 导出关系

```ts
export default TextInput;
```

### 文件：key.ts

### TextEditToolKey

对象变换复用矩形快捷键，输入控件内的按键由文字会话独享。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `tool`（公开） | `TextEditTool`；`由构造参数或初始化过程赋值` | 受快捷键控制的文字编辑器。 |

#### 构造与案例

```ts
constructor(tool: TextEditTool, cameraControl: CameraControl | null = null)
```

注册文字对象快捷键，不拦截输入控件内的文字剪贴板、撤销和 Backspace。

```ts
const keys = new TextEditToolKey(tool, cameraControl);
```

### 导出关系

```ts
export default TextEditToolKey;
export { TextEditToolKey };
```

## 4. 注意事项

- 命中、吸附和编辑手柄使用排版包围盒，不扫描字形三角面；空文字退出输入后删除。文字输入保留原生剪贴板与撤销快捷键。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">文字 字体 光标 选区 输入 字距 行距</keywords>
<keywords language="en">text font caret selection input letter-spacing line-spacing</keywords>
```
