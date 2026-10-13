# 编辑器 Editor

目录：`bplinejs/src/scripts/Editor`

## 1. 文件结构与作用

集合分派、图元编辑、快捷键、历史及文档回显。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Collection/` | 跨类型历史、层级、组变换、被动 Base 编辑和资源文档。 详见该目录的 agent.md。 |
| `cursors/` | Phosphor SVG 光标、方向投影和旋转缓存。 详见该目录的 agent.md。 |
| `EditSwitches.ts` | 为独立工具创建一份默认全开的交互配置。 |
| `History/` | 选择身份、剪贴板克隆和快照条目读取。 详见该目录的 agent.md。 |
| `index.ts` | 合并 Rect、NGon、Poly 与被动 Base 编辑的唯一选择和输入入口。 |
| `key.ts` | 合并编辑器唯一的窗口快捷键监听器，避免三个独立工具重复响应组合键。 |
| `NGonEditTool/` | 内外圈编辑、正多边形边数和创建方向。 详见该目录的 agent.md。 |
| `PolyEditTool/` | 逐点绘制、沿边插点、顶点拖动及自由组缩放。 详见该目录的 agent.md。 |
| `RectEditTool/` | 参数化矩形的手柄编辑、组变换、吸附与历史。 详见该目录的 agent.md。 |
| `Snap/` | 顶点、边线、交点、细格及旋转候选的屏幕距离比较。 详见该目录的 agent.md。 |
| `Styles/` | 独立绘制模板与黄色边框/关键点模板。 详见该目录的 agent.md。 |
| `TextEditTool/` | 排版矩形编辑、文字光标输入、选区与独立输入历史。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口

### Editor

合并 Rect、NGon、Poly 与被动 Base 编辑的唯一选择和输入入口。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 受编辑的场景。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 提供 Canvas 和尺寸的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 屏幕与世界换算使用的相机。 |
| `selector`（公开） | `Select`；`由构造参数或初始化过程赋值` | 所有形状共用的点选和框选入口。 |
| `rectEditTool`（公开） | `RectEditTool`；`由构造参数或初始化过程赋值` | 单独的矩形工具；不注册自己的全局输入。 |
| `ngonEditTool`（公开） | `NGonEditTool`；`由构造参数或初始化过程赋值` | 单独的正多边形工具；不注册自己的全局输入。 |
| `polyEditTool`（公开） | `PolyEditTool`；`由构造参数或初始化过程赋值` | 单独的多边形工具；不注册自己的全局输入。 |
| `textEditTool`（公开） | `TextEditTool`；`由构造参数或初始化过程赋值` | 无独立事件的文字编辑工具。 |
| `baseEditTool`（公开） | `BaseEditTool`；`由构造参数或初始化过程赋值` | 合并编辑器专用的 Base2D 轮廓工具。 |
| `helperGrid`（公开） | `HelperGrid`；`由构造参数或初始化过程赋值` | 唯一的编辑背景网格。 |
| `frameGroup`（公开） | `Group`；`new Group(0, 0)` | 混合类型组框所属覆盖层。 |
| `actives`（公开） | `Mesh[]`；`[]` | 当前所有已选择的普通 Mesh。 |
| `active`（公开） | `Mesh[]`；`[]` | 最近加入选择的对象。 |
| `snapOptions`（公开） | `SnapOptions`；`CreateSnapOptions()` | 三类图形共用的吸附候选开关。 |
| `hierarchy`（公开） | `Hierarchy`；`由构造参数或初始化过程赋值` | 真实 Group 节点的创建、变换与拖动层级入口。 |
| `switches`（公开） | `EditSwitches`；`CreateEditSwitches()` | 所有编辑工具共用的指针交互开关，默认全部开启。 |
| `_raiseSelected`（内部） | `boolean`；`true` | 是否把选中实体临时提升到 orderMax + 1，默认开启。 |
| `_orders`（内部） | `EditorOrder`；`new EditorOrder()` | 状态由 `orderMax`、`sourceOrder`、`refreshOrders`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_activeType`（内部） | `EditorMode`；`"edit"` | 当前模式。（activeType 的内部状态）。 |
| `_shape`（内部） | `EditorShape`；`"rect"` | 空白处新建的几何类型。（shape 的内部状态）。 |
| `_rect`（内部） | `boolean`；`true` | 矩形是否参与合并编辑。（rect 的内部状态）。 |
| `_ngon`（内部） | `boolean`；`true` | 正多边形是否参与合并编辑。（ngon 的内部状态）。 |
| `_poly`（内部） | `boolean`；`true` | 多边形是否参与合并编辑。（poly 的内部状态）。 |
| `_text`（内部） | `boolean`；`true` | 文字是否参与合并编辑。（text 的内部状态）。 |
| `_history`（内部） | `EditHistory`；`new EditHistory(this)` | 状态由 `constructor`、`load`、`push`、`cancel` 读取或维护；完整处理见对应函数。 |
| `_document`（内部） | `EditorDocumentStore`；`new EditorDocumentStore(this)` | 状态由 `save`、`load`、`loadedNodes`、`documentNodes` 读取或维护；完整处理见对应函数。 |
| `_clipboard`（内部） | `Mesh[]`；`[]` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_lastClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste`、`beginCanvasPointerDown`、`handlePointerMove` 读取或维护；完整处理见对应函数。 |
| `_clipboardClient`（内部） | `Vec2 \| null`；`null` | 状态由 `copySelected`、`paste` 读取或维护；完整处理见对应函数。 |
| `_group`（内部） | `boolean`；`true` | 是否允许创建与操作真实层级组。（group 的内部状态）。 |
| `_mult`（内部） | `boolean`；`true` | 是否保留多个对象。（mult 的内部状态）。 |
| `_syncing`（内部） | `boolean`；`false` | 状态由 `syncToolSelection`、`syncFromTools`、`convertToBase` 读取或维护；完整处理见对应函数。 |
| `_pointerOwner`（内部） | `PointerOwner \| null`；`null` | 状态由 `cancel`、`handlePointerDown`、`beginCanvasPointerDown`、`beginHierarchyPointerDown` 读取或维护；完整处理见对应函数。 |
| `_selectionGesture`（内部） | `SelectionGesture \| null`；`null` | 状态由 `cancel`、`beginCanvasPointerDown`、`beginGroupCreate`、`handlePointerMove` 读取或维护；完整处理见对应函数。 |
| `_selectionFrame`（内部） | `Mesh \| null`；`null` | 状态由 `cancel`、`handlePointerMove`、`handlePointerUp`、`updateGroupCreatePreview` 读取或维护；完整处理见对应函数。 |
| `_creationParent`（内部） | `Group \| null`；`null` | 状态由 `cancel`、`beginCanvasPointerDown`、`attachCreatedMesh`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_editMoveStart`（内部） | `Vec2 \| null`；`null` | 状态由 `cancel`、`beginCanvasPointerDown`、`handlePointerMove`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_editMovePointerId`（内部） | `number \| null`；`null` | 状态由 `cancel`、`beginCanvasPointerDown`、`handlePointerMove`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_touchPointers`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `cancel`、`destroy`、`handleWindowBlur`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `destroy`、`handlePointerDown` 读取或维护；完整处理见对应函数。 |
| `_groupTransform`（内部） | `GroupTransform`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`activeType`、`update`、`cancel` 读取或维护；完整处理见对应函数。 |
| `_collectionMove`（内部） | `CollectionMove`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`cancel`、`beginCanvasPointerDown`、`handlePointerMove` 读取或维护；完整处理见对应函数。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_onSelectionChange`（内部） | `按初始化值推断`；`new Map<string, (actives: Mesh[]) => void>()` | 状态由 `onSelectionChange`、`onSelectionChangeDelete`、`setSelection` 读取或维护；完整处理见对应函数。 |
| `_onModeChange`（内部） | `按初始化值推断`；`new Map<string, (mode: EditorMode) => void>()` | 状态由 `activeType`、`onModeChange`、`onModeChangeDelete` 读取或维护；完整处理见对应函数。 |
| `_onSave`（内部） | `按初始化值推断`；`new Map<string, (document: EditorDocument) => void>()` | 状态由 `onSave`、`onSaveDelete`、`save` 读取或维护；完整处理见对应函数。 |
| `_onBase`（内部） | `按初始化值推断`；`new Map<string, (mesh: Mesh) => void>()` | 状态由 `onBase`、`onBaseDelete`、`notifyBase` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera, options: EditorOptions = {})
```

创建共用选择器和一个网格，分别构建无自动事件的形状编辑器。

```ts
const editor = new Editor(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get order(): number`  | 四种形状下次绘制共用的层级，默认 0。 |
| `set order(value: number)`  | 无返回值，同步四个形状编辑器。 |
| `get orderMax(): number`  | 用户实体最大原始层级；不包含辅助对象或临时选中提升，没有实体时为 0。 |
| `get raiseSelected(): boolean`  | 是否临时提升选中实体，默认开启。 |
| `set raiseSelected(value: boolean)`  | 无返回值，关闭后立即恢复原始层级。 |
| `sourceOrder(node: Group): number`  | 未叠加选中提升的原始层级，供保存、历史和复制读取。 |
| `refreshOrders(): void` （内部） | 无返回值，同步代码导入、手绘、加载和直接改动后的文档层级。 |
| `get style(): Style`  | 三种形状下次绘制共用的样式模板。 |
| `set style(value: Style)`  | 无返回值。 |
| `get material(): Material2d`  | 三种形状下次绘制共用的材质模板。 |
| `set material(value: Material2d)`  | 无返回值。 |
| `get ignoreZoom(): boolean`  | 下次新建实体或层级组框的屏幕尺寸开关，默认关闭。 |
| `set ignoreZoom(value: boolean)`  | 无返回值。 |
| `get autoPrecision(): boolean`  | 新建及 push 实体的自动精度开关，默认开启。 |
| `set autoPrecision(value: boolean)`  | 无返回值，同步四个子编辑器，已有 Mesh 保留独立开关。 |
| `get activeType(): EditorMode`  | 当前模式。 |
| `set activeType(value: EditorMode)`  | 无返回值。 |
| `get mult(): boolean`  | 是否保留多个对象。 |
| `set mult(value: boolean)`  | 无返回值。 |
| `get snap(): boolean`  | 三类图形共用的吸附总开关。 |
| `set snap(value: boolean)`  | 无返回值。 |
| `get shape(): EditorShape`  | 空白处新建的几何类型。 |
| `set shape(value: EditorShape)`  | 无返回值。 |
| `get rect(): boolean`  | 矩形是否参与合并编辑。 |
| `set rect(value: boolean)`  | 无返回值。 |
| `get ngon(): boolean`  | 正多边形是否参与合并编辑。 |
| `set ngon(value: boolean)`  | 无返回值。 |
| `get poly(): boolean`  | 多边形是否参与合并编辑。 |
| `set poly(value: boolean)`  | 无返回值。 |
| `get text(): boolean`  | 文字是否参与合并编辑。 |
| `set text(value: boolean)`  | 无返回值。 |
| `get group(): boolean`  | 是否允许创建与操作真实层级组。 |
| `set group(value: boolean)`  | 无返回值。 |
| `get nest(): boolean`  | 普通图形是否可以互相嵌套。 |
| `set nest(value: boolean)`  | 无返回值。 |
| `get dropTargetColor(): Color`  | 拖入目标边框的可编辑颜色。 |
| `get activeGroup(): EditorGroup \| null`  | 最近选择的真实 Group 节点。 |
| `onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void`  | 为合并编辑器订阅跨类型选择变更。 |
| `onSelectionChangeDelete(key: string): boolean`  | 是否删除订阅。 |
| `onModeChange(key: string, callback: (mode: EditorMode) => void): void`  | 无返回值。 |
| `onModeChangeDelete(key: string): boolean`  | 是否删除订阅。 |
| `onSave(key: string, callback: (document: EditorDocument) => void): void`  | 无返回值。 |
| `onSaveDelete(key: string): boolean`  | 是否删除订阅。 |
| `onBase(key: string, callback: (mesh: Mesh) => void): void`  | 无返回值。 |
| `onBaseDelete(key: string): boolean`  | 是否删除订阅。 |
| `toBase(): Mesh[]`  | 主动降级当前选择并交由 Base 工具编辑，保持 Mesh 身份、层级和选择。 |
| `save(): EditorDocument`  | 完整的纯 JSON 文档，并触发 onSave；不下载文件或退出文字输入。 |
| `load(document: EditorDocument \| string, options: EditorLoadOptions = {}): Mesh[]`  | 替换集合文档，可用一次 undo 恢复；校验和构建失败保留旧场景。 |
| `get loadedNodes(): ReadonlyMap<number, Group>`  | 上一次成功加载的保存编号到新节点映射。 |
| `documentNodes(): Group[]`  | 属于文档的实体和空组，排除内部容器与辅助覆盖层。 |
| `selectedGroup(): EditorGroup \| null`  | 当前选择的真实层级组。 |
| `selectGroup(group: EditorGroup \| null): void`  | 无返回值。 |
| `documentFilters(): { containers: ReadonlySet<Group>; excluded: ReadonlySet<Group> }`  | 内部实体容器与辅助子树，不代表用户 noSelect 属性。 |
| `selectAll(): void`  | 无返回值，选择全部启用的可编辑实体并遵循 mult 开关。 |
| `select(meshes: Mesh \| number \| readonly (Mesh \| number)[], operation: SelectionOperation = "replace"): void`  | 根据 Mesh 或运行期 ID 统一更新混合类型选择集。 |
| `push(meshes: Mesh \| readonly Mesh[]): Mesh[]`  | 由形状类型分发导入对象；Base2D 只允许通过此入口或场景导入。 |
| `update(): void`  | 无返回值。 |
| `cancel(): void`  | 无返回值。 |
| `sourceStyle(mesh: Mesh): Style`  | 未叠加选中效果的原始样式。 |
| `sourceMaterial(mesh: Mesh): Material2d \| undefined`  | 输入透明副本之前的用户材质。 |
| `get undoCount(): number`  | 可撤销的整批编辑数量。 |
| `get redoCount(): number`  | 可恢复的整批编辑数量。 |
| `undo(): boolean`  | 是否恢复了原来的几何类型和数据。 |
| `redo(): boolean`  | 是否重做了下一批编辑。 |
| `removeSelected(): Mesh[]`  | 本次移除的对象，可供上层撤销或复用。 |
| `copySelected(): void`  | 无返回值，将原始几何与样式复制到内部剪贴板。 |
| `cutSelected(): Mesh[]`  | 本次剪切的对象。 |
| `paste(): Mesh[]`  | 以鼠标位置为中心的新增对象。 |
| `destroy(): void`  | 无返回值。 |
| `handleWindowBlur(): void` （内部） | 无返回值。 |
| `handlePointerDown(event: PointerEvent): void`  | 无返回值。 |
| `beginPointerDown(event: PointerEvent): void` （内部） | 无返回值。 |
| `beginCanvasPointerDown(event: PointerEvent, client: Vec2): void` （内部） | 无返回值。 |
| `attachCreatedMesh(mesh: Mesh): void` （内部） | 无返回值。 |
| `beginHierarchyPointerDown(event: PointerEvent, client: Vec2): void` （内部） | 无返回值。 |
| `beginGroupCreate(event: PointerEvent, client: Vec2): void` （内部） | 无返回值。 |
| `handlePointerMove(event: PointerEvent): void`  | 无返回值。 |
| `handlePointerUp(event: PointerEvent): void`  | 无返回值。 |
| `handlePointerCancel(event: PointerEvent): void`  | 无返回值。 |
| `handleContextMenu(event: MouseEvent): void` （内部） | 无返回值。 |
| `forwardDown(owner: PointerOwner \| null, event: PointerEvent, pickedMesh: Mesh \| null): void` （内部） | 无返回值。 |
| `movingMeshes(owner: PointerOwner \| null): Mesh[]` （内部） | 正在实体平移的对象。 |
| `takeOverMove(event: PointerEvent): void` （内部） | 达到拖动容差后释放子工具的内部平移手势，保留未拖动的点击行为。 |
| `cancelShapePointer(owner: PointerOwner \| null, event: PointerEvent): void` （内部） | 释放对应子工具的手势及单指登记，避免取消后残留输入状态。 |
| `moveOptions(owner: PointerOwner \| null): MoveOptions` （内部） | 沿用命中对象所属工具的实时步进、吸附和活动范围。 |
| `notifyCollectionMove(meshes: Mesh[]): void` （内部） | 整批位置更新后，按类型触发原工具的移动、位置和编辑回调。 |
| `pick(client: Vec2): Mesh \| null` （内部） | 最上面的可编辑 Mesh。 |
| `pickEditable(client: Vec2): Mesh \| null` （内部） | 手柄或实体命中的顶层对象。 |
| `topmost(candidates: readonly (Mesh \| null)[]): Mesh \| null` （内部） | 实际绘制顺序最上面的对象。 |
| `updateHover(event: PointerEvent): void` （内部） | 无返回值。 |
| `updateHierarchyCursor(client: Vec2): void` （内部） | 无返回值。 |
| `updateGroupCreatePreview(client: Vec2): void` （内部） | 无返回值。 |
| `updateEditHover(event: PointerEvent, client: Vec2): void` （内部） | 无返回值。 |
| `updateGroupCursor(client: Vec2): void` （内部） | 无返回值。 |
| `kind(mesh: Mesh): PointerOwner \| null` （内部） | 编辑类别或 null。 |
| `isMeshEnabled(mesh: Mesh): boolean` （内部） | 是否由当前合并编辑器管理。 |
| `isEnabled(kind: EditorShape): boolean` （内部） | 对应开关。 |
| `refreshEnabled(): void` （内部） | 无返回值。 |
| `setSelection(next: Mesh[]): void` （内部） | 无返回值。 |
| `syncToolSelection(): void` （内部） | 无返回值。 |
| `syncToolModes(): void` （内部） | 无返回值。 |
| `syncFromTools(): void` （内部） | 无返回值。 |
| `convertToBase(meshes: readonly Mesh[]): Mesh[]` （内部） | 集合与子工具共用的转换事务，先准备几何，再解除旧装饰并分派新的归属。 |
| `notifyBase(mesh: Mesh, previous: Geometry2d): void` （内部） | 无返回值。 |
| `reassignConverted(mesh: Mesh, previous: Geometry2d): void` （内部） | 无返回值。 |
| `notifyEdit(meshes: Mesh[]): void` （内部） | 无返回值。 |

### 类型索引

`EditorMode`、`EditorShape`、`SelectionOperation`、`PointerOwner`、`SelectionGesture`、`EditorOptions`

### 导出关系

```ts
export default Editor;
export { default as EditorGroup } from "./Collection/EditorGroup";
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorNodeData } from "./Collection/document";
export type { EditorMaterialData, EditorStyleData, EditorTextureData } from "./Collection/resources";
export type { EditSwitches } from "./EditSwitches";
export { default as EditorKey } from "./key";
export { Editor };
export type { EditorMode, EditorOptions, EditorShape };
```

## 3. 其他源码文件

### 文件：EditSwitches.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateEditSwitches` | 为独立工具创建一份默认全开的交互配置。 |

```ts
const switches = CreateEditSwitches();
```

### 类型索引

`EditSwitches`

### 导出关系

```ts
export { CreateEditSwitches };
export type { EditSwitches };
```

### 文件：key.ts

### EditorKey

合并编辑器唯一的窗口快捷键监听器，避免三个独立工具重复响应组合键。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `editor`（公开） | `Editor`；`由构造参数或初始化过程赋值` | 受快捷键控制的合并编辑器。 |
| `rectCode`（公开） | `string`；`"KeyE+KeyR"` | E 与 R 同时按下切换 Rect 编辑。 |
| `ngonCode`（公开） | `string`；`"KeyE+KeyN"` | E 与 N 同时按下切换 NGon 编辑。 |
| `polyCode`（公开） | `string`；`"KeyE+KeyP"` | E 与 P 同时按下切换 Poly 编辑。 |
| `textCode`（公开） | `string`；`"KeyE+KeyT"` | E 与 T 同时按下切换文字编辑。 |
| `removeCode`（公开） | `string`；`"Delete"` | 对象删除键，文字输入内 Delete 仅编辑内容。 |
| `copyCode`（公开） | `string`；`"Control+KeyC"` | 对象剪贴板复制、粘贴与剪切组合键。 |
| `pasteCode`（公开） | `string`；`"Control+KeyV"` | 粘贴对象组合键。 |
| `cutCode`（公开） | `string`；`"Control+KeyX"` | 剪切对象组合键。 |
| `undoCode`（公开） | `string`；`"Control+KeyZ"` | 跨几何类型撤销组合键。 |
| `redoCode`（公开） | `string`；`"Control+KeyY"` | 跨几何类型重做组合键。 |
| `redoAlternateCode`（公开） | `string`；`"Control+Shift+KeyZ"` | 重做的备用组合键。 |
| `selectAllCode`（公开） | `string`；`"Control+KeyA"` | 全选当前启用的可编辑实体。 |
| `saveCode`（公开） | `string`；`"Control+KeyS"` | 输出集合 JSON 并触发 editor.onSave，不触发浏览器保存页面。 |
| `baseCode`（公开） | `string`；`"KeyB"` | 首次按下时主动降级已选几何，默认 B；输入文字时不接管。 |
| `cancelCode`（公开） | `string`；`"Escape"` | 取消当前编辑手势和选择。 |
| `cameraResetCode`（公开） | `string`；`"Space"` | 点击后把相机位置移回世界原点。 |
| `centerCode`（公开） | `string`；`"KeyC"` | 按住时临时以中心为新建起点，松开恢复原配置。 |
| `createGroupCode`（公开） | `string`；`"KeyE+KeyG"` | E 与 G 同时按下切换真实 Group 层级编辑。 |
| `editCode`（公开） | `string`；`"KeyE"` | 单独松开 E 切换编辑模式。 |
| `viewCode`（公开） | `string`；`"KeyV"` | 单独松开 V 切换查看模式。 |
| `groupCode`（公开） | `string`；`"KeyG"` | 单独松开 G 切换组模式。 |
| `addCode`（公开） | `string`；`"Control"` | 按住时增选。 |
| `subCode`（公开） | `string`；`"Alt"` | 按住时减选。 |
| `constrainCode`（公开） | `string`；`"Shift"` | 按住时启用轴向约束。 |
| `snapCode`（公开） | `string`；`"KeyP"` | 点击后切换吸附。 |
| `snapVertexCode`（公开） | `string`；`"KeyP+Digit1"` | 切换顶点吸附分项。 |
| `snapEdgeCode`（公开） | `string`；`"KeyP+Digit2"` | 切换边线吸附分项。 |
| `snapIntersectionCode`（公开） | `string`；`"KeyP+Digit3"` | 切换交点吸附分项。 |
| `snapGridCode`（公开） | `string`；`"KeyP+Digit4"` | 切换网格吸附分项。 |
| `stepCode`（公开） | `string`；`"KeyS"` | 点击后切换步进。 |
| `multCode`（公开） | `string`；`"KeyM"` | 点击后切换多选。 |
| `closedCode`（公开） | `string`；`"KeyF"` | 点击后切换 Poly2D 新建路径是否闭合。 |
| `sideCodes`（公开） | `按初始化值推断`；`new Map<number, string>()` | NGon 新建边数：3–9 单键，10–90 使用十位键与 0。 |
| `_pressed`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `handleKeyDown`、`handleKeyUp`、`handleBlur`、`activateBase` 读取或维护；完整处理见对应函数。 |
| `_pendingActions`（内部） | `按初始化值推断`；`new Map<string, PendingAction>()` | 状态由 `handleKeyUp`、`handleBlur`、`activateBase`、`queueAction` 读取或维护；完整处理见对应函数。 |
| `_previousConstrain`（内部） | `按初始化值推断`；`new Map<TemporaryTarget, boolean>()` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_previousOrigin`（内部） | `按初始化值推断`；`new Map<TemporaryTarget, "left" \| "center">()` | 状态由 `syncTemporaryOptions` 读取或维护；完整处理见对应函数。 |
| `_usedInChord`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `handleKeyDown`、`handleKeyUp`、`handleBlur`、`activateBase` 读取或维护；完整处理见对应函数。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_cameraControl`（内部） | `CameraControl \| null`；`由构造参数或初始化过程赋值` | 可选的相机控制器（构造参数引用）。 |
| `_originalLeftDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy`、`syncCameraControl` 读取或维护；完整处理见对应函数。 |
| `_originalOFDrag`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy`、`syncCameraControl` 读取或维护；完整处理见对应函数。 |
| `_modifierMode`（内部） | `EditorMode \| null`；`null` | 状态由 `handleKeyDown`、`handleKeyUp`、`handleBlur` 读取或维护；完整处理见对应函数。 |
| `_nextListenerId`（内部） | `number`；`0` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_modeListenerKey`（内部） | `string`；``EditorKey:${String(EditorKey._nextListenerId)}`` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(editor: Editor, cameraControl: CameraControl | null = null)
```

注册一组窗口快捷键，并可选同步相机左键与单指开关。

```ts
const keys = new EditorKey(editor, cameraControl);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `handleEditorPointerDown(event: PointerEvent): void` （内部） | 无返回值。 |
| `handleKeyDown(event: KeyboardEvent): void`  | 记录键位并优先处理编辑器类型组合键。 |
| `handleKeyUp(event: KeyboardEvent): void`  | 仅在完整按下并松开后执行单键切换，组合键中的 E/P 不单独触发。 |
| `handleBlur(): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值。 |
| `activateBase(code: string): boolean` （内部） | 是否执行了主动降级。 |
| `queueAction(code: string): boolean` （内部） | 是否命中了对象操作组合。 |
| `hasExtraModifier(parts: readonly string[]): boolean` （内部） | 是否还有未配置的修饰键。 |
| `isChordPressed(chord: string): boolean` （内部） | 组合是否完整按住。 |
| `syncTemporaryOptions(): void` （内部） | 无返回值，更新按住的约束和中心起点并恢复原配置。 |
| `toggleSnap(option: keyof Editor["snapOptions"]): void` （内部） | 无返回值。 |
| `setSides(sides: number): void` （内部） | 无返回值。 |
| `resetCamera(): void` （内部） | 无返回值，只复位位置并停止旧惯性。 |
| `cancelEdit(): void` （内部） | 无返回值，取消手势、选择并回到普通编辑模式。 |
| `setStep(enabled: boolean): void` （内部） | 无返回值。 |
| `syncCameraControl(): void` （内部） | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `NormalizeCode` | 规范键名。 |
| `IsTypingTarget` | 是否是输入控件。 |

```ts
NormalizeCode("ControlLeft");
```

### 类型索引

`PendingAction`、`TemporaryTarget`

### 导出关系

```ts
export default EditorKey;
export { EditorKey };
```

## 4. 注意事项

- 集合统一选择、历史、组变换和辅助层；独立工具保留独立入口。内部框 noSelect，实体材质独立复制。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">编辑器 选择 新建 拖动 缩放 旋转 撤销 重做 保存 加载 嵌套</keywords>
<keywords language="en">editor selection creation drag resize rotation undo redo save load nesting</keywords>
```
