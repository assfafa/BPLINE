# 选择 Select

目录：`bplinejs/src/scripts/Select`

## 1. 文件结构与作用

集合点选、框选、边线和顶点命中。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `AreaSelectTool.ts` | 三种非矩形填充几何共享的点选与面积框选流程。 |
| `BaseSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `index.ts` | 统一管理面、边、点选择器及其包围盒、开关和结果排序。 |
| `LineSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `NGonSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `PointSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `PolySelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `RectSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `SelectionAreaGeometry.ts` | 将形状的局部坐标投影到 Mesh 的世界坐标。；从非矩形填充三角面构建紧凑的世界轴向包围盒。；将 BPMatrixJS 的填充索引转换成世界三角面，保持凹面及内孔的剖分。 |
| `SelectionGeometry.ts` | 检查指针是否落在当前渲染画布内，避免侧栏事件选中场景。；变换局部坐标，供轮廓、顶点和三角面使用同一矩阵约定。；将世界点投影到浏览器视口 CSS 像素，误差半径不随相机缩放变化。 |
| `SelectionSpace.ts` | 使用镜头附近且按 zoom 归一的坐标做面积判断，避免固定像素对象变成极小世界三角面。；将鼠标世界点转换到与几何相同的选择空间。；把已有局部包围盒变换到选择空间，不经过易丢精度的世界包围盒角点。 |
| `TextSelectTool/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口

### Select

统一管理面、边、点选择器及其包围盒、开关和结果排序。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `RectSelectTool`（公开） | `按初始化值推断`；`RectSelectTool` | 可单独创建的矩形选择器。 |
| `NGonSelectTool`（公开） | `按初始化值推断`；`NGonSelectTool` | 可单独创建的正多边形选择器。 |
| `PolySelectTool`（公开） | `按初始化值推断`；`PolySelectTool` | 可单独创建的多边形选择器。 |
| `BaseSelectTool`（公开） | `按初始化值推断`；`BaseSelectTool` | 可单独创建的自定义顶点面选择器。 |
| `TextSelectTool`（公开） | `按初始化值推断`；`TextSelectTool` | 可单独创建的文字包围盒选择器。 |
| `LineSelectTool`（公开） | `按初始化值推断`；`LineSelectTool` | 可单独创建的边选择器。 |
| `PointSelectTool`（公开） | `按初始化值推断`；`PointSelectTool` | 可单独创建的顶点选择器。 |
| `resultDrawLists`（内部） | `WeakMap<SelectResult, readonly Mesh[]>`；`new WeakMap<SelectResult, readonly Mesh[]>()` | 结果保留创建时的场景绘制顺序，避免 Sort 需要额外传入 Scene。 |
| `scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 待查询场景。（构造参数引用）。 |
| `rectSelectTool`（公开） | `RectSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`Selector`、`rectPicker` 读取或维护；完整处理见对应函数。 |
| `ngonSelectTool`（公开） | `NGonSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`Selector`、`ngonPicker` 读取或维护；完整处理见对应函数。 |
| `polySelectTool`（公开） | `PolySelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`Selector`、`polyPicker` 读取或维护；完整处理见对应函数。 |
| `baseSelectTool`（公开） | `BaseSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`Selector`、`basePicker` 读取或维护；完整处理见对应函数。 |
| `textSelectTool`（公开） | `TextSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`Selector`、`textPicker` 读取或维护；完整处理见对应函数。 |
| `lineSelectTool`（公开） | `LineSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`linePicker` 读取或维护；完整处理见对应函数。 |
| `pointSelectTool`（公开） | `PointSelectTool`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`SelectPicker`、`pointPicker` 读取或维护；完整处理见对应函数。 |
| `_rectPicker`（内部） | `boolean`；`true` | 当前矩形点选开关。（rectPicker 的内部状态）。 |
| `_rectSelector`（内部） | `boolean`；`true` | 当前矩形框选开关。（rectSelector 的内部状态）。 |
| `_ngonPicker`（内部） | `boolean`；`true` | 当前正多边形点选开关。（ngonPicker 的内部状态）。 |
| `_ngonSelector`（内部） | `boolean`；`true` | 当前正多边形框选开关。（ngonSelector 的内部状态）。 |
| `_polyPicker`（内部） | `boolean`；`true` | 当前多边形点选开关。（polyPicker 的内部状态）。 |
| `_polySelector`（内部） | `boolean`；`true` | 当前多边形框选开关。（polySelector 的内部状态）。 |
| `_basePicker`（内部） | `boolean`；`true` | 当前自定义面点选开关。（basePicker 的内部状态）。 |
| `_baseSelector`（内部） | `boolean`；`true` | 当前自定义面框选开关。（baseSelector 的内部状态）。 |
| `_linePicker`（内部） | `boolean`；`true` | 当前边点选开关。（linePicker 的内部状态）。 |
| `_pointPicker`（内部） | `boolean`；`true` | 当前顶点点选开关。（pointPicker 的内部状态）。 |
| `_selectionMode`（内部） | `RectSelectionMode`；`"all"` | 所有面框选工具共用的模式。（selectionMode 的内部状态）。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera)
```

创建七个选择器，集中为 NGon、Poly 和 Base 开启几何包围盒。

```ts
const select = new Select(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `enableBounding(): void` （内部） | 为三个使用轴向粗筛的面选择器开启包围盒，重复查询不重复修改版本。 |
| `SelectPicker(event: MouseEvent): SelectResult`  | 按几何类型分别返回鼠标下的面、边和顶点命中。 |
| `Selector(selectionMesh: Mesh): SelectResult`  | 以 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域查询五类面；边和点组保持为空。 |
| `getOrdinaryDrawList(): Mesh[]` （内部） | 截取普通 Mesh 的当前顺序，供返回结果在后续改动场景后仍能稳定排序。 |
| `static Sort(result: SelectResult, direction: SelectSortDirection = "desc"): Mesh[]`  | 将各组结果合并为无重复 Mesh，并按实际深度层级与绘制顺序排序。 asc 为底层在前，desc 为顶层在前；关闭深度测试的覆盖层总在测试层之上。 |
| `get rectPicker(): boolean`  | 当前矩形点选开关。 |
| `set rectPicker(value: boolean)`  | 无返回值。 |
| `get rectSelector(): boolean`  | 当前矩形框选开关。 |
| `set rectSelector(value: boolean)`  | 无返回值。 |
| `get ngonPicker(): boolean`  | 当前正多边形点选开关。 |
| `set ngonPicker(value: boolean)`  | 无返回值。 |
| `get ngonSelector(): boolean`  | 当前正多边形框选开关。 |
| `set ngonSelector(value: boolean)`  | 无返回值。 |
| `get polyPicker(): boolean`  | 当前多边形点选开关。 |
| `set polyPicker(value: boolean)`  | 无返回值。 |
| `get polySelector(): boolean`  | 当前多边形框选开关。 |
| `set polySelector(value: boolean)`  | 无返回值。 |
| `get basePicker(): boolean`  | 当前自定义面点选开关。 |
| `set basePicker(value: boolean)`  | 无返回值。 |
| `get baseSelector(): boolean`  | 当前自定义面框选开关。 |
| `set baseSelector(value: boolean)`  | 无返回值。 |
| `get textPicker(): boolean`  | 文字点选开关。 |
| `set textPicker(value: boolean)`  | 无返回值。 |
| `get textSelector(): boolean`  | 文字框选开关。 |
| `set textSelector(value: boolean)`  | 无返回值。 |
| `get linePicker(): boolean`  | 当前边点选开关。 |
| `set linePicker(value: boolean)`  | 无返回值。 |
| `get pointPicker(): boolean`  | 当前顶点点选开关。 |
| `set pointPicker(value: boolean)`  | 无返回值。 |
| `get selectionMode(): RectSelectionMode`  | 所有面框选工具共用的模式。 |
| `set selectionMode(value: RectSelectionMode)`  | 无返回值。 |

### 类型索引

`SelectResult`、`SelectSortDirection`

### 导出关系

```ts
export default Select;
export type { TextSelection } from "./TextSelectTool";
export type { LineSelection, PointSelection, RectSelectionMode, SelectResult, SelectSortDirection };
```

## 3. 其他源码文件

### 文件：AreaSelectTool.ts

### AreaSelectTool

三种非矩形填充几何共享的点选与面积框选流程。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 待查询场景。（构造参数引用）。 |
| `render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 提供画布位置和尺寸的渲染器。（构造参数引用）。 |
| `camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 将鼠标位置换算为世界坐标的相机。（构造参数引用）。 |
| `geometryType`（内部） | `string`；`由构造参数或初始化过程赋值` | 当前工具处理的几何类型。（构造参数引用）。 |
| `autoEnableBounding`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 自动为候选 Mesh 开启包围盒。（构造参数引用）。 |
| `picker`（公开） | `boolean`；`true` | 是否允许鼠标点选，默认开启。 |
| `selector`（公开） | `boolean`；`true` | 是否允许面积框选，默认开启。 |
| `selectionMode`（公开） | `RectSelectionMode`；`"all"` | all/left 全包，any/right 相交，默认全包。 |

#### 构造与案例

```ts
constructor(
        scene: Scene,
        render: Render,
        camera: Camera,
        geometryType: string,
        autoEnableBounding: boolean,
    )
```

配置特定几何类型，并可自动为其 Mesh 开启包围盒。

```ts
super(scene, render, camera, "Poly2D", true);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `accepts(candidate: MeshLike): candidate is Mesh` （内部） | 检查绘制条目是否是本工具负责的普通 Mesh。 |
| `getBounds(mesh: Mesh): MeshBoundingBox \| null` （内部） | 获取可用于粗筛的世界包围盒，必要时自动开启计算。 |
| `SelectPicker(event: MouseEvent): Mesh[]`  | 找出鼠标下本类型的所有填充 Mesh，绘制顺序靠后的排在前面。 |
| `containsPoint(bounds: MeshBoundingBox, point: SelectPoint): boolean` （内部） | 判断世界点是否位于候选 Mesh 的轴向包围盒内。 |
| `matchesBounds(bounds: MeshBoundingBox, selection: SelectBounds): boolean` （内部） | 判断候选包围盒是否可能与选择框相交。 |
| `Selector(selectionMesh: Mesh): Mesh[]`  | 使用 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域查询本类型的 Mesh。 |

### 导出关系

```ts
export default AreaSelectTool;
```

### 文件：SelectionAreaGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ToWorld` | 将形状的局部坐标投影到 Mesh 的世界坐标。 |
| `BoundsFromTriangles` | 从非矩形填充三角面构建紧凑的世界轴向包围盒。 |
| `WorldTriangles` | 将 BPMatrixJS 的填充索引转换成世界三角面，保持凹面及内孔的剖分。 |
| `CreateSelectionArea` | 根据 Mesh 的几何类型取得独立于显示样式的选择范围。 |
| `RectFootprintTriangles` | 将凸圆角矩形的采样边界分割为实体三角面。 |
| `ContainsSelectionTriangles` | 判断候选实体三角面是否全部落在选择区域内。 |
| `IntersectsSelectionTriangles` | 判断候选实体三角面是否与选择区域相交或相切。 |

```ts
const point = ToWorld(matrix, 10, 20);
```

### 类型索引

`SelectionArea`、`IndexedFill`

### 导出关系

```ts
export { ContainsSelectionTriangles, CreateSelectionArea, IntersectsSelectionTriangles, RectFootprintTriangles };
export type { SelectionArea };
```

### 文件：SelectionGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IsCanvasEvent` | 检查指针是否落在当前渲染画布内，避免侧栏事件选中场景。 |
| `TransformPoint` | 变换局部坐标，供轮廓、顶点和三角面使用同一矩阵约定。 |
| `ProjectPoint` | 将世界点投影到浏览器视口 CSS 像素，误差半径不随相机缩放变化。 |
| `CreateFillTriangles` | 从已生成的实体面三角形取得世界坐标，用于精确面积选择。 |
| `CreateContours` | 生成保留轮廓顶点编号的世界坐标路径。 |
| `CreateSelectableVertices` | 提取轮廓顶点，重复索引只返回一次。 |
| `CreateSelectableEdges` | 提取轮廓边，重复三角形边按无向顶点编号去重。 |

```ts
const inside = IsCanvasEvent(event, render);
```

### 类型索引

`SelectableVertex`、`SelectableEdge`、`SelectableContour`、`SelectTriangle`

### 导出关系

```ts
export {
    CreateFillTriangles,
    CreateSelectableEdges,
    CreateSelectableVertices,
    IsCanvasEvent,
    ProjectPoint,
};
export type { SelectableEdge, SelectableVertex, SelectTriangle };
```

### 文件：SelectionSpace.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateSelectionMatrix` | 使用镜头附近且按 zoom 归一的坐标做面积判断，避免固定像素对象变成极小世界三角面。 |
| `CreateSelectionPoint` | 将鼠标世界点转换到与几何相同的选择空间。 |
| `CreateSelectionBounds` | 把已有局部包围盒变换到选择空间，不经过易丢精度的世界包围盒角点。 |
| `SelectionZoom` | 非法相机输入不参与无限倍率计算，开发诊断仍由 Render 负责。 |

```ts
const matrix = CreateSelectionMatrix(mesh, camera);
```

### 导出关系

```ts
export { CreateSelectionBounds, CreateSelectionMatrix, CreateSelectionPoint };
```

## 4. 注意事项

- 使用完整场景搜索，noSelect 跳过辅助实体；命中按显示矩阵处理 ignoreZoom。点选和框选开关独立。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">选择器 点选 框选 边线 顶点 排序</keywords>
<keywords language="en">select picker selector edge point sorting</keywords>
```
