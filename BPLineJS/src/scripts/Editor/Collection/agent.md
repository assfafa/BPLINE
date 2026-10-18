# 集合编辑内部模块 Collection

目录：`bplinejs/src/scripts/Editor/Collection`

## 1. 文件结构与作用

跨类型历史、层级、组变换、布尔运算、被动 Base 编辑和资源文档。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `BaseChange.ts` | 主动降级的一批几何快照；只替换 data，保留 Mesh、层级、材质和局部变换。 |
| `BaseEditTool.ts` | 合并编辑器专用的 Base2D 轮廓节点编辑器；不提供画图创建入口。 |
| `Boolean.ts` | 在修改场景前准备完整布尔结果，连续轮廓和三角网分别传入数学库。 |
| `document.ts` | 集合场景的文档转换；构建完成后才替换用户节点。 |
| `EditorGroup.ts` | 拥有独立矩形范围的空层级节点；子对象由普通 Group.children 管理。 |
| `GroupTransform.ts` | 对不同几何类型执行同一组仿射操作，并在参数化形状变形时移交 Base2D。 |
| `Hierarchy.ts` | 操作真实 Group 层级，并在拖动结束时以松开位置决定父组。 |
| `History.ts` | 合并编辑器和文字工具共用的跨几何类型历史。 |
| `Move.ts` | 普通编辑模式的多选平移；不创建组框，也不修改几何类型。 |
| `Order.ts` | 集合专用层级管理：原始层级与选中展示层级分开维护。 |
| `resources.ts` | 保存时去重纹理，加载时重建独立样式与材质。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：BaseChange.ts

### BaseChange

主动降级的一批几何快照；只替换 data，保留 Mesh、层级、材质和局部变换。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `meshes`（公开） | `Mesh[]`；`[]` | 本次实际转换的对象，已是 Base2D 的对象不在其中。 |
| `_items`（内部） | `BaseChangeItem[]`；`[]` | 状态由 `constructor`、`undo`、`redo` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(meshes: readonly Mesh[], sourceStyle: (mesh: Mesh) => Style)
```

先准备全部几何，生成失败时不修改场景。

```ts
const change = new BaseChange(tool.actives, tool.sourceStyle.bind(tool));
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `undo(): void`  | 无返回值，恢复原几何类型与独立输入。 |
| `redo(): void`  | 无返回值，安装独立的 Base2D 几何。 |

### 类型索引

`BaseChangeItem`、`BaseDelegate`

### 导出关系

```ts
export default BaseChange;
export type { BaseDelegate };
```

### 文件：BaseEditTool.ts

### BaseEditTool

合并编辑器专用的 Base2D 轮廓节点编辑器；不提供画图创建入口。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 候选 Base2D 所在场景。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 坐标换算使用的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 坐标换算使用的相机。 |
| `frameGroup`（公开） | `Group`；`new Group(0, 0)` | 标记轮廓节点的辅助组。 |
| `actives`（公开） | `Mesh[]`；`[]` | 当前选中的 Base2D Mesh。 |
| `radius`（公开） | `number`；`10` | 顶点与轮廓边的屏幕拾取半径。 |
| `switches`（公开） | `EditSwitches`；`CreateEditSwitches()` | Base 轮廓的移动、拖点和插点开关。 |
| `_savedStyles`（内部） | `按初始化值推断`；`new Map<Mesh, SavedBaseStyle>()` | 状态由 `sourceStyle`、`applySelectStyle`、`restoreStyle` 读取或维护；完整处理见对应函数。 |
| `_gesture`（内部） | `BaseGesture \| null`；`null` | 状态由 `movingMeshes`、`handlePointerDown`、`handlePointerMove`、`handlePointerUp` 读取或维护；完整处理见对应函数。 |
| `_onSelectionChange`（内部） | `((actives: Mesh[]) => void) \| null`；`null` | 状态由 `onSelectionChange`、`select` 读取或维护；完整处理见对应函数。 |
| `_onEdit`（内部） | `((actives: Mesh[]) => void) \| null`；`null` | 状态由 `notifyExternalMove`、`onEdit`、`handlePointerDown`、`handlePointerMove` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera)
```

创建只接收外部转发事件的 Base 编辑器。

```ts
const base = new BaseEditTool(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get movingMeshes(): Mesh[]`  | 当前实体平移手势中的 Base2D 集合。 |
| `notifyExternalMove(meshes: Mesh[]): void`  | 接收集合平移后的编辑通知，不重复变换轮廓。 |
| `sourceStyle(mesh: Mesh): Style`  | 未覆盖关键点样式的用户样式。 |
| `onSelectionChange(callback: (actives: Mesh[]) => void): void`  | 关联集合的选择状态。 |
| `onEdit(callback: (actives: Mesh[]) => void): void`  | 关联集合的历史与编辑事件。 |
| `select(meshes: readonly Mesh[]): void`  | 更新 Base 选择，不会自动创建任何几何。 |
| `handlePointerDown(event: PointerEvent, pickedMesh: Mesh \| null = null): boolean`  | 按下轮廓节点、边或对象内部；内部三角面顶点不会命中。 |
| `handlePointerMove(event: PointerEvent): void`  | 按当前鼠标位置移动轮廓节点或 Mesh。 |
| `handlePointerUp(event: PointerEvent): void`  | 结束对应指针的编辑手势。 |
| `cancel(): void`  | 无返回值。 |
| `update(): void`  | 无返回值。关键点由 Base2D 的点分区跟随几何更新。 |
| `applySelectStyle(mesh: Mesh): void` （内部） | 无返回值。 |
| `restoreStyle(mesh: Mesh): void` （内部） | 无返回值。 |
| `destroy(): void`  | 无返回值。 |
| `pickContourVertex(client: Vec2): { mesh: Mesh; contourIndex: number; vertexIndex: number } \| null` （内部） | 仅搜索当前选中 Base2D 的轮廓节点。 |
| `pickContourEdge(client: Vec2): { mesh: Mesh; contourIndex: number; edgeIndex: number; ratio: number; } \| null` （内部） | 在已选 Base2D 的闭合轮廓中寻找最近的边。 |
| `pickContourMesh(client: Vec2): Mesh \| null`  | 命中边界手柄所属的 Mesh。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `WorldToLocal` | 消去 Mesh 世界矩阵以编辑局部轮廓点。 |

```ts
const local = WorldToLocal(matrix, point);
```

### 类型索引

`BaseGesture`、`SavedBaseStyle`

### 导出关系

```ts
export default BaseEditTool;
```

### 文件：Boolean.ts

### BooleanChange

在修改场景前准备完整布尔结果，连续轮廓和三角网分别传入数学库。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `result`（公开） | `BoolResult`；`由构造参数或初始化过程赋值` | 数学库返回的来源、分片及删除记录。 |
| `meshes`（公开） | `Mesh[]`；`[]` | 运算后应选中的对象，包括减法中完全未变化的原对象。 |
| `removed`（公开） | `Mesh[]`；`[]` | 即将摘除的实体；减法永远不包含工具 B。 |
| `_parents`（内部） | `按初始化值推断`；`new Map<Mesh, Group>()` | 状态由 `constructor`、`apply` 读取或维护；完整处理见对应函数。 |
| `_added`（内部） | `Mesh[]`；`[]` | 状态由 `constructor`、`apply` 读取或维护；完整处理见对应函数。 |
| `_owner`（内部） | `Editor`；`由构造参数或初始化过程赋值` | 提供原始样式、层级和相机的集合编辑器（构造参数引用）。 |

#### 构造与案例

```ts
constructor(owner: Editor, subjects: readonly Mesh[], target: Mesh, operation: BooleanOperation)
```

同步计算并准备资源，失败时原场景和选择保持不变；调用前 await Bool.ready()。

```ts
const change = new BooleanChange(editor, selected, target, "difference");
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `apply(): void`  | 无返回值；调用方在历史批次中先清除选择装饰。 |
| `static accepts(node: Group): node is Mesh`  | 是否是可参与面积运算的普通实体。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateBooleanInput` | 包含显示矩阵且不修改原对象的数学库输入。 |
| `CreateResultMesh` | 具有世界姿态的独立实体。 |
| `SurvivingParent` | 最近的保留父级。 |
| `ValidateParent` | 无返回值；不可逆的父变换无法保持世界位置。 |
| `ContourLines` | 所有内外环的独立线段，保留 wireframe 切换能力。 |

```ts
CreateBooleanInput(mesh, camera);
```

### 类型索引

`BooleanOperation`、`BooleanEvent`

### 导出关系

```ts
export default BooleanChange;
export type { BooleanEvent, BooleanOperation };
```

### 文件：document.ts

### EditorDocumentStore

集合场景的文档转换；构建完成后才替换用户节点。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_owner`（内部） | `DocumentOwner`；`由构造参数或初始化过程赋值` | 提供原样式及辅助节点过滤的编辑器（构造参数引用）。 |
| `_resources`（内部） | `DocumentResources`；`new DocumentResources()` | 状态由 `capture`、`prepare` 读取或维护；完整处理见对应函数。 |
| `_loadedNodes`（内部） | `按初始化值推断`；`new Map<number, Group>()` | 上一次成功加载的原编号到新节点映射。（loadedNodes 的内部状态）。 |

#### 构造与案例

```ts
constructor(owner: DocumentOwner)
```

文档转换器。

```ts
const store = new EditorDocumentStore(owner);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get loadedNodes(): ReadonlyMap<number, Group>`  | 上一次成功加载的原编号到新节点映射。 |
| `nodes(strict: boolean = false): Group[]`  | 用户实体及层级组，排除辅助层与内部容器。 |
| `capture(): EditorDocument`  | 不包含临时选择颜色和 GPU 对象的完整 JSON 数据。 |
| `prepare(data: EditorDocument \| string, options: EditorLoadOptions): PreparedDocument`  | 解析和构建全部数据，尚不修改当前场景、选择或输入会话。 |
| `apply(prepared: PreparedDocument): Mesh[]`  | 提交已经验证的文档；辅助层保持在原场景中。 |
| `entries(strict: boolean): DocumentEntry[]` （内部） | 带最近文档父级的场景节点。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CaptureTransform` | 除去内部容器后的局部变换。 |
| `ApplyTransform` | 无返回值。 |
| `Multiply` | 列主序三阶乘积。 |
| `CompareNodeIds` | 原运行期编号顺序。 |
| `CaptureGeometryContent` | 原始参数或三角网的纯数据。 |
| `CaptureGeometry` | 含基准精度的 JSON，忽略自动调整的显示精度。 |
| `CreateGeometry` | 使用保存精度创建的几何。 |
| `CaptureContour` | JSON 坐标数组。 |
| `CaptureVertices` | 独立的 JSON 数值数组。 |
| `BuildGeometry` | 可编辑几何，字体需先注册。 |
| `RestoreContour` | 独立的原始坐标。 |
| `RestoreVertices` | 用于构造 Base2D 的独立数组。 |
| `IsRecord` | 是否为普通记录对象。 |
| `IsOneOf` | 是否属于支持的枚举。 |
| `IsNumericArray` | 是否为指定长度的有限数值数组。 |
| `Require` | 无返回值，失败抛出 TypeError。 |
| `ValidateDocument` | 父节点在前的记录序列。 |
| `IsFiniteNumber` | 是否为有限数字。 |
| `IsValidID` | 是否为有效正整数编号。 |
| `ValidateFiniteNumbers` | 无返回值，拒绝 JSON 会丢失的非有限数字。 |
| `ValidateGeometry` | 无返回值，验证构造输入。 |
| `ValidateCoordinates` | 无返回值，验证成对有限坐标。 |
| `ValidateVertices` | 无返回值，验证长度及索引范围。 |

```ts
CaptureTransform(mesh, parent, scene, order);
```

### 类型索引

`EditorNodeTransform`、`EditorGeometryData`、`EditorMeshData`、`EditorGroupData`、`EditorNodeData`、`EditorDocument`、`EditorLoadOptions`、`DocumentOwner`、`DocumentEntry`、`PreparedDocument`、`MatrixValues`、`EditorVertexData`、`EditorPartData`

### 导出关系

```ts
export default EditorDocumentStore;
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorNodeData, PreparedDocument };
```

### 文件：EditorGroup.ts

### EditorGroup

拥有独立矩形范围的空层级节点；子对象由普通 Group.children 管理。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `width`（公开） | `number`；`由构造参数或初始化过程赋值` | 局部矩形范围宽度。 |
| `height`（公开） | `number`；`由构造参数或初始化过程赋值` | 局部矩形范围高度。 |
| `frame`（公开） | `Mesh`；`由构造参数或初始化过程赋值` | 跟随本组变换的虚线边框。 |

#### 构造与案例

```ts
constructor(x: number, y: number, width: number, height: number)
```

创建一个可嵌套的空层级组。

```ts
const group = new EditorGroup(0, 0, 100, 80);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get ignoreZoom(): boolean`  | 组范围是否抵消相机 zoom，默认关闭。 |
| `set ignoreZoom(value: boolean)`  | 无返回值。 |
| `disposeFrame(): void`  | 无返回值。 |

### 导出关系

```ts
export default EditorGroup;
```

### 文件：GroupTransform.ts

### GroupTransform

对不同几何类型执行同一组仿射操作，并在参数化形状变形时移交 Base2D。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `frameGroup`（公开） | `Group`；`由构造参数或初始化过程赋值` | 覆盖层所在组。 |
| `radius`（公开） | `number`；`10` | 屏幕手柄容差。 |
| `_camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 相机（构造参数引用）。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 渲染器（构造参数引用）。 |
| `_actives`（内部） | `Mesh[]`；`[]` | 状态由 `setSelection`、`update`、`pointerDown`、`hover` 读取或维护；完整处理见对应函数。 |
| `_state`（内部） | `GroupState \| null`；`null` | 状态由 `setSelection`、`update`、`pointerDown`、`hover` 读取或维护；完整处理见对应函数。 |
| `_frame`（内部） | `Mesh \| null`；`null` | 状态由 `update`、`resizeCursor`、`destroy`、`resetFrame` 读取或维护；完整处理见对应函数。 |
| `_gesture`（内部） | `GroupGesture \| null`；`null` | 状态由 `update`、`pointerDown`、`pointerMove`、`pointerUp` 读取或维护；完整处理见对应函数。 |
| `_boundsZoom`（内部） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`setSelection`、`update` 读取或维护；完整处理见对应函数。 |
| `_onConvert`（内部） | `(mesh: Mesh, previous: Geometry2d) => void`；`由构造参数或初始化过程赋值` | 几何类型变更时同步拥有者（构造参数引用）。 |
| `_onEdit`（内部） | `(meshes: Mesh[]) => void`；`由构造参数或初始化过程赋值` | 一次组变换后的编辑通知（构造参数引用）。 |

#### 构造与案例

```ts
constructor(
        frameGroup: Group,
        render: Render,
        camera: Camera,
        onConvert: (mesh: Mesh, previous: Geometry2d) => void,
        onEdit: (meshes: Mesh[]) => void,
    )
```

创建集合专用的组框，不修改被编辑 Mesh 的父子关系。

```ts
const group = new GroupTransform(frame, render, camera, onConvert, onEdit);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `setSelection(meshes: readonly Mesh[]): void`  | 改变组合成员后重建轴向组框；操作过程中不会每帧重算包围盒。 |
| `update(): void`  | 无返回值。相机缩放改变时保持组框虚线的像素尺寸。 |
| `pointerDown(event: PointerEvent): boolean`  | 判定边角缩放、内部移动和外部旋转。 |
| `hover(client: Vec2): { action: GroupAction; handle: GroupHandle \| null } \| null`  | 组框当前可用操作。 |
| `resizeCursor(handle: GroupHandle \| null): string`  | 读取组框边角当前的屏幕法线光标。 |
| `pointerMove(event: PointerEvent): void`  | 更新一次组合仿射操作；局部形状被拉成非参数化几何时转交 Base 编辑器。 |
| `pointerUp(event: PointerEvent): boolean`  | 结束组变换；返回是否只有一次没有拖动的单击。 |
| `get isMoving(): boolean`  | 当前是否正在平移选中集合。 |
| `cancel(): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值。 |
| `hit(client: Vec2): { action: GroupAction; handle: GroupHandle \| null }` （内部） | 命中优先级为角、边、内部、外部。 |
| `getScale(gesture: GroupGesture, current: Vec2): { anchor: Vec2; x: number; y: number }` （内部） | 将当前手柄相对固定边的移动换算成组局部缩放。 |
| `resetFrame(): void` （内部） | 无返回值。 |
| `updateFrame(): void` （内部） | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `LimitFactor` | 避开零矩阵的倍率。 |
| `Identity` | 三阶单位矩阵。 |
| `Translate` | 位移矩阵。 |
| `Rotate` | 旋转矩阵。 |
| `Scale` | 缩放矩阵。 |
| `Around` | 形成围绕世界锚点并沿旋转坐标轴执行的变换。 |
| `Multiply` | 列主序矩阵乘积。 |
| `Invert` | 逆矩阵；不可逆时保留单位矩阵。 |
| `Transform` | 变换后的点。 |
| `RotatePoint` | 旋转后的点。 |
| `BoundsOfMeshes` | 读取真实几何顶点的世界包围盒，供混合类型组框使用。 |
| `ApplySnapshot` | 在原始快照上施加当前组矩阵；参数化形状只在仍满足其几何约束时保留类型。 |
| `BakeBase` | 将已生成的分区三角面烘焙为正面朝外的 Base2D，并映射可编辑边界。 |
| `RectContour` | 以轮廓节点表达带圆角的矩形；保持四个角各自的离散弧段。 |
| `NGonContour` | 有序环形节点。 |
| `TransformNormals` | 法线按逆转置映射，再以原长度恢复斜接方向。 |
| `TransformLinePoints` | 映射后的线框数据。 |
| `TransformCoordinates` | 新坐标序列。 |

```ts
const value = LimitFactor(factor);
```

### 类型索引

`GroupHandle`、`GroupAction`、`GroupState`、`GroupSnapshot`、`GroupGesture`

### 导出关系

```ts
export default GroupTransform;
export { BakeBase };
```

### 文件：Hierarchy.ts

### Hierarchy

操作真实 Group 层级，并在拖动结束时以松开位置决定父组。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `radius`（公开） | `number`；`10` | 屏幕边角容差，单位 CSS 像素。 |
| `nest`（公开） | `boolean`；`false` | 普通 Rect、NGon、Poly、Base Mesh 是否可作为父容器。 |
| `ignoreZoom`（公开） | `boolean`；`false` | 下一个新建层级组的范围是否抵消相机 zoom，默认关闭。 |
| `switches`（公开） | `EditSwitches`；`CreateEditSwitches()` | 层级组移动、缩放、旋转及拖放的交互开关。 |
| `dropTargetColor`（公开） | `Color`；`new Color("#4b8cff")` | 拖入目标边框的颜色，可通过 setHex 或 copy 修改。 |
| `_scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 被编辑场景（构造参数引用）。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 当前渲染器（构造参数引用）。 |
| `_camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 屏幕坐标所用相机（构造参数引用）。 |
| `_select`（内部） | `Select`；`由构造参数或初始化过程赋值` | 已由集合编辑器维护的选择器（构造参数引用）。 |
| `_gesture`（内部） | `HierarchyGesture \| null`；`null` | 状态由 `pointerDown`、`pointerMove`、`pointerUp`、`cancel` 读取或维护；完整处理见对应函数。 |
| `_activeGroup`（内部） | `EditorGroup \| null`；`null` | 当前有选中反馈的层级组。（activeGroup 的内部状态）。 |
| `_rotationHandle`（内部） | `Mesh \| null`；`null` | 状态由 `activeGroup`、`auxiliaryNodes`、`update` 读取或维护；完整处理见对应函数。 |
| `_dropTarget`（内部） | `Group \| null`；`null` | 状态由 `setDropTarget`、`refreshGroupColor`、`refreshDropFeedback` 读取或维护；完整处理见对应函数。 |
| `_dropFrame`（内部） | `Mesh \| null`；`null` | 状态由 `auxiliaryNodes`、`setDropTarget`、`refreshDropFeedback` 读取或维护；完整处理见对应函数。 |
| `_dropFrameWorld`（内部） | `number[] \| null`；`null` | 状态由 `setDropTarget`、`refreshDropFeedback` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera, select: Select)
```

创建层级交互入口。

```ts
const hierarchy = new Hierarchy(scene, render, camera, select);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get activeGroup(): EditorGroup \| null`  | 当前有选中反馈的层级组。 |
| `set activeGroup(group: EditorGroup \| null)`  | 无返回值。 |
| `auxiliaryNodes(): Mesh[]`  | 当前旋转图标与拖放反馈框，供文档过滤使用。 |
| `update(): void`  | 无返回值。当前组旋转箭头保持固定屏幕像素尺寸。 |
| `create(first: Vec2, last: Vec2): EditorGroup \| null`  | 将画出的范围建立为真正的空 Group。 |
| `pickGroup(client: Vec2, edgeOnly: boolean = false): HierarchyHit \| null`  | 从上层搜索组框的边角和附近旋转区。 |
| `pointerDown(event: PointerEvent, node: HierarchyNode, hit: HierarchyHit \| null = null): boolean`  | 开始移动对象或编辑组框。 |
| `pointerMove(event: PointerEvent): void`  | 无返回值。 |
| `pointerUp(event: PointerEvent): boolean`  | 完成手势；只有移动操作允许在释放位置进入另一个组。 |
| `cancel(): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值。释放选中反馈辅助资源。 |
| `previewDrop(client: Vec2, moving: HierarchyNode, excluded: readonly Group[] = []): Group`  | 显示鼠标下方可接收对象的蓝色边框。 |
| `clearDropPreview(): void`  | 无返回值。 |
| `setDropTarget(target: Group \| null): void` （内部） | 无返回值。 |
| `refreshGroupColor(candidate: Group \| null): void` （内部） | 无返回值。 |
| `refreshDropFeedback(): void` （内部） | 无返回值。 |
| `rotationPosition(group: EditorGroup): { top: Vec2; outward: Vec2; endpoint: Vec2 } \| null` （内部） | 顶边中心及箭头端点；退化时为 null。 |
| `dropTarget(client: Vec2, moving: Group, excluded: readonly Group[] = []): Group`  | 以鼠标释放点寻找最内层可接收目标。 |
| `groupAt(client: Vec2): EditorGroup \| null`  | 最内层虚线组或 null。 |
| `contains(group: EditorGroup, client: Vec2): boolean`  | 点是否在组范围内。 |
| `groups(): EditorGroup[]`  | 场景内按层级顺序排列的编辑组。 |
| `hit(group: EditorGroup, client: Vec2, edgeOnly: boolean): HierarchyHit \| null` （内部） | 命中。 |
| `transform(gesture: HierarchyGesture, current: Vec2): number[]` （内部） | 新世界矩阵。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Reparent` | 无返回值。 |
| `SetWorldMatrix` | 无返回值。 |
| `IsDescendant` | 是否为其后代。 |
| `Translate` | 平移矩阵。 |
| `Rotate` | 旋转矩阵。 |
| `Scale` | 缩放矩阵。 |
| `Multiply` | 两矩阵乘积。 |
| `Invert` | 逆矩阵。 |
| `Transform` | 映射点。 |

```ts
Reparent(mesh, group);
```

### 类型索引

`HierarchyNode`、`HierarchyAction`、`HierarchyHandle`、`HierarchyHit`、`HierarchyGesture`

### 导出关系

```ts
export default Hierarchy;
export { Reparent };
export type { HierarchyHit };
```

### 文件：History.ts

### EditHistory

合并编辑器和文字工具共用的跨几何类型历史。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_owner`（内部） | `HistoryOwner`；`由构造参数或初始化过程赋值` | 提供实体和选择恢复的编辑器（构造参数引用）。 |
| `_undoStack`（内部） | `HistoryEntry[]`；`[]` | 状态由 `undoCount`、`commit`、`undo`、`redo` 读取或维护；完整处理见对应函数。 |
| `_redoStack`（内部） | `HistoryEntry[]`；`[]` | 状态由 `redoCount`、`commit`、`undo`、`redo` 读取或维护；完整处理见对应函数。 |
| `_start`（内部） | `HistoryState \| null`；`null` | 状态由 `begin`、`batch`、`commit`、`cancel` 读取或维护；完整处理见对应函数。 |
| `_replaying`（内部） | `boolean`；`false` | 状态由 `begin`、`commit`、`restore` 读取或维护；完整处理见对应函数。 |
| `_batchDepth`（内部） | `number`；`0` | 状态由 `batch`、`commit` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(owner: HistoryOwner)
```

历史管理器。

```ts
const history = new EditHistory(editor);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get undoCount(): number`  | 可撤销操作数量。 |
| `get redoCount(): number`  | 可重做操作数量。 |
| `begin(): void`  | 无返回值。 |
| `batch<T>(operation: () => T): T`  | 把导入、粘贴及其嵌套子工具操作合成一笔记录。 |
| `commit(): void`  | 无返回值。 |
| `cancel(): void`  | 无返回值，放弃尚未提交的操作边界。 |
| `undo(): boolean`  | 是否恢复了上一批内容和几何类型。 |
| `redo(): boolean`  | 是否重做了下一批内容与类型变化。 |
| `clear(): void`  | 无返回值。 |
| `capture(): HistoryState` （内部） | 带对象身份的完整实体状态。 |
| `nodes(): readonly Group[]` （内部） | 当前属于历史范围的实体和结构节点。 |
| `restore(state: HistoryState): void` （内部） | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GeometryRecord` | 与三角面缓存无关的比较数据。 |

```ts
GeometryRecord(text);
```

### 类型索引

`HistoryOwner`、`MatrixValues`、`HistoryItem`、`HistoryState`、`HistoryEntry`

### 导出关系

```ts
export default EditHistory;
```

### 文件：Move.ts

### CollectionMove

普通编辑模式的多选平移；不创建组框，也不修改几何类型。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 吸附目标所在场景（构造参数引用）。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 屏幕坐标换算使用的渲染器（构造参数引用）。 |
| `_camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 当前相机（构造参数引用）。 |
| `_onMove`（内部） | `(meshes: Mesh[]) => void`；`由构造参数或初始化过程赋值` | 位置实际变化后的通知（构造参数引用）。 |
| `_gesture`（内部） | `MoveGesture \| null`；`null` | 状态由 `meshes`、`begin`、`accepts`、`pointerMove` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera, onMove: (meshes: Mesh[]) => void)
```

建立跨几何类型的平移入口。

```ts
const move = new CollectionMove(scene, render, camera, notifyMove);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get meshes(): Mesh[]`  | 当前手势直接移动的根成员，子成员随父级移动。 |
| `begin(event: PointerEvent, meshes: readonly Mesh[], anchor: Mesh, options: MoveOptions): void`  | 冻结整批选择的位置和实际显示轮廓，单击仍交给形状工具处理。 |
| `accepts(event: PointerEvent): boolean`  | 超过点击容差才接管，保留文字二次点击输入等原有点击行为。 |
| `pointerMove(event: PointerEvent): void`  | 将同一个世界位移应用到整批选择，保留原局部矩阵的线性部分。 |
| `cancel(): void`  | 无返回值，释放本轮快照。 |
| `resolveDelta(gesture: MoveGesture, client: Vec2): Vec2` （内部） | 按屏幕轴、世界步进和最近吸附目标计算本轮共同位移。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `HasSelectedAncestor` | 查找选中的祖先，避免层级中的同一世界位移重复生效。 |
| `MoveVertices` | 读取移动源轮廓；字体只使用排版框，Base 只使用边界节点。 |
| `ClampDelta` | 限制整批选择的联合边界，不单独裁切某个成员。 |
| `ScreenDistance` | 比较两个世界位置在屏幕上的距离。 |

```ts
const inherited = HasSelectedAncestor(mesh, selected);
```

### 类型索引

`MoveOptions`、`MoveSnapshot`、`MoveSource`、`MoveBounds`、`MoveGesture`

### 导出关系

```ts
export default CollectionMove;
export type { MoveOptions };
```

### 文件：Order.ts

### EditorOrder

集合专用层级管理：原始层级与选中展示层级分开维护。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_max`（内部） | `number`；`0` | 文档实体的最大原始 order；空文档为 0。（max 的内部状态）。 |
| `_raised`（内部） | `按初始化值推断`；`new Map<Mesh, RaisedOrder>()` | 状态由 `sourceOrder`、`sync`、`restore` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get max(): number`  | 文档实体的最大原始 order；空文档为 0。 |
| `sourceOrder(node: Group): number`  | 读取原始层级，并接收选中期间由调用方主动设置的层级。 |
| `sync(nodes: readonly Group[], selected: readonly Mesh[], enabled: boolean): void`  | 同步当前文档和选择集合，不统计辅助框、网格等内部节点。 |
| `restore(): void`  | 无返回值，销毁编辑器前恢复所有原始层级。 |

### 类型索引

`OrderSource`、`RaisedOrder`

### 导出关系

```ts
export default EditorOrder;
export type { OrderSource };
```

### 文件：resources.ts

### DocumentResources

保存时去重纹理，加载时重建独立样式与材质。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_knownTextures`（内部） | `按初始化值推断`；`new Map<number, TextureLike>()` | 状态由 `resolveTextures`、`captureTexture` 读取或维护；完整处理见对应函数。 |
| `_records`（内部） | `按初始化值推断`；`new Map<number, EditorTextureData>()` | 独立的纹理地址记录。（records 的内部状态）。 |
| `_baseDefaults`（内部） | `BaseMaterial`；`new BaseMaterial()` | 状态由 `captureMaterial` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `beginCapture(): void`  | 无返回值，清理本次导出的纹理表。 |
| `get records(): EditorTextureData[]`  | 独立的纹理地址记录。 |
| `captureStyle(style: Style): EditorStyleData`  | JSON 样式和纹理引用。 |
| `captureMaterial(material: Material2d): EditorMaterialData`  | 保留材质类型和具名值的 JSON 数据。 |
| `resolveTextures(records: readonly EditorTextureData[], supplied?: ReadonlyMap<number, TextureLike>): Map<number, TextureLike>`  | 解析纹理引用；同一文档引用保持同一资源，材质和样式仍独立创建。 |
| `createStyle(data: EditorStyleData, textures: ReadonlyMap<number, TextureLike>): Style`  | 独立 Style。 |
| `createMaterial(data: EditorMaterialData, style: Style, textures: ReadonlyMap<number, TextureLike>): Material2d`  | 独立材质。 |
| `captureTextureStyle(part: Style["solid"] \| Style["edge"] \| Style["points"]): EditorTextureStyleData` （内部） | 分区的 JSON 绑定设置。 |
| `captureTexture(texture: TextureLike \| undefined): number \| null` （内部） | 文档资源编号或 null。 |
| `captureValues(values: ShaderValueRecord): Record<string, EditorValueData>` （内部） | 有类型标记的纯数据。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `RequiredTexture` | 必须存在的纹理。 |
| `RestoreValues` | 各类型独立的 Shader 值。 |
| `Check` | 无返回值，失败抛出 TypeError。 |
| `IsObject` | 是否为记录对象。 |
| `OneOf` | 是否受支持。 |
| `Finite` | 是否为有限数字。 |
| `ValidateStyle` | 无返回值，验证样式分区和必要类型。 |
| `ValidateMaterial` | 无返回值，拒绝未知材质或非法阶段字段。 |
| `ValidateValue` | 无返回值，验证数值类型和固定维数。 |

```ts
RequiredTexture(1, textures);
```

### 类型索引

`EditorTextureData`、`EditorTextureStyleData`、`EditorStyleData`、`EditorValueData`、`EditorMaterialData`、`ShaderField`、`MatrixValues`

### 导出关系

```ts
export default DocumentResources;
export type { EditorMaterialData, EditorStyleData, EditorTextureData, EditorValueData };
```

## 4. 注意事项

- 普通实体可按 nest 决定互相嵌套，空 Group 始终可接收；变换、布尔和父级变更合并为一笔历史。异形降级后撤销恢复原类型。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- Boolean.ts 负责集合编辑器的 Mesh/数学库布尔适配：Group 不展开；减法保留 B，只替换发生变化的 A。保留未参与运算的后代与世界姿态，整个变更纳入集合历史。轮廓输入不得先三角化；Text/Base 只传实体三角面，不能包含选择描边和关键点。新结果继承来源原始样式及材质，忽略临时选中 order。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">集合 层级 分组 布尔 并集 裁剪 降级 文档 资源 序列化</keywords>
<keywords language="en">collection hierarchy group boolean union difference downgrade document resource serialization</keywords>
```
