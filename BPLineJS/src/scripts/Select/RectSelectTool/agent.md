# 选择 Select

目录：`bplinejs/src/scripts/Select/RectSelectTool`

## 1. 文件结构与作用

集合点选、框选、边线和顶点命中。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 场景中的普通 Rect2D Mesh 点选与框选工具。 |
| `RectSelectGeometry.ts` | 将矩形局部坐标变换为世界坐标。；取得世界点在矩形自身坐标系中的位置。；获取四个未裁圆角的矩形角点。 |

## 2. index 入口、案例与类接口

### RectSelectTool

场景中的普通 Rect2D Mesh 点选与框选工具。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 要查询的场景。（构造参数引用）。 |
| `render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 提供 Canvas 位置与尺寸的渲染器。（构造参数引用）。 |
| `camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 将浏览器窗口坐标换算到场景世界坐标的相机。（构造参数引用）。 |
| `picker`（公开） | `boolean`；`true` | 是否允许 SelectPicker 点选，默认开启。 |
| `selector`（公开） | `boolean`；`true` | 是否允许 Selector 框选，默认开启。 |
| `selectionMode`（公开） | `RectSelectionMode`；`"all"` | 框选模式，默认要求被完整包围。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera)
```

绑定选择工具使用的场景、画布和相机。

```ts
const select = new RectSelectTool(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `SelectPicker(event: MouseEvent): Mesh[]`  | 查找鼠标事件位置下的所有普通 Rect2D Mesh，drawList 靠后的排在前面。 可由 window 的 mousedown、click 或 dblclick 事件处理器直接调用。 |
| `Selector(selectionMesh: Mesh): Mesh[]`  | 用 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域框选普通 Rect2D Mesh。 left/all 为完全包围，right/any 为任意相交；结果按 drawList 逆序排列。 |

### 类型索引

`RectSelectionMode`

### 导出关系

```ts
export default RectSelectTool;
export type { RectSelectionMode };
```

## 3. 其他源码文件

### 文件：RectSelectGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ToWorld` | 将矩形局部坐标变换为世界坐标。 |
| `ToLocal` | 取得世界点在矩形自身坐标系中的位置。 |
| `CreateCorners` | 获取四个未裁圆角的矩形角点。 |
| `CreateBounds` | 计算世界角点的轴向包围盒，作为大量对象的第一层筛选。 |
| `CreateRectFootprint` | 从 Mesh 的 Rect2D 几何和世界矩阵建立一次选择快照。 |
| `ContainsWorldPoint` | 判断世界点是否落在圆角矩形内部或边界上。 |
| `MayIntersect` | 先用未裁圆角的矩形判断两对象是否可能相交。 |
| `CreateWorldOutline` | 生成用于圆角窄阶段检测的世界轮廓；直角矩形复用四角。 |
| `ContainsFootprint` | 判断候选矩形的整个填充轮廓是否位于选择矩形内。 |
| `IntersectsFootprints` | 判断两个圆角矩形的填充轮廓是否相交。 |

```ts
const point = ToWorld(mesh.worldMatrix, 10, 20);
```

### 类型索引

`SelectPoint`、`SelectBounds`、`RectFootprint`

### 导出关系

```ts
export {
    ContainsFootprint,
    ContainsWorldPoint,
    CreateRectFootprint,
    CreateWorldOutline,
    IntersectsFootprints,
};
export type { RectFootprint, SelectBounds, SelectPoint };
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
