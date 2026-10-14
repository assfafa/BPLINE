# 几何 Geometry

目录：`bplinejs/src/scripts/Geometry`

## 1. 文件结构与作用

填充、边框、关键点和线框的 CPU 生成。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Base2D.ts` | 用户直接提供已三角剖分的顶点；缺省属性补零，索引缺省为顺序三角形。 |
| `BaseContours.ts` | 从实体三角网提取所有闭合边界，包括分离的外环和多个孔环。；记录无向边的出现次数，忽略重合端点形成的零长度边。；将未抵消的长边按共线节点拆分，使 T 接点两侧的长短边能够逐段抵消。 |
| `CloneGeometry.ts` | 按实际类型复制二维几何，保留各类型的生成参数。 |
| `Geo.ts` | CPU 几何及其单一版本；样式订阅只响应影响几何生成的字段。 |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `NGon2D.ts` | 正多边形、圆盘近似或圆环；圆心为 (0,0)，填充、边框和关键点合并绘制。 hole/nvMode/inter 仅在内部适配 BPMatrixJS，公开接口为 inner/uvMode。 |
| `Poly2D.ts` | 单轮廓多边形/开放折线，使用通用三角面填充和实体边框，不使用矩形 SDF。 |
| `Rect2D.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export { default as Base2D } from "./Base2D";
export type { Base2DLike, Base2DOptions } from "./Base2D";
export { default as Geo } from "./Geo";
export type { BorderAlign, GeoBuffersLike, GeoData, GeoPartDataLike, GeometrySubscriber } from "./Geo";
export { default as NGon2D } from "./NGon2D";
export type { NGon2DLike, NGon2DOptions, NGonUVMode } from "./NGon2D";
export { default as Poly2D } from "./Poly2D";
export type { Poly2DLike, Poly2DOptions } from "./Poly2D";
export { default as Rect2D } from "./Rect2D";
export type { Rect2DLike, Rect2DOptions } from "./Rect2D";
```

## 3. 其他源码文件

### 文件：Base2D.ts

### Base2D

用户直接提供已三角剖分的顶点；缺省属性补零，索引缺省为顺序三角形。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `按初始化值推断`；`"Base2D" as const` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_input`（内部） | `Base2DOptions`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`contours`、`getData`、`setContourPoint` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(options: Base2DOptions)
```

创建直接顶点几何体；未提供轮廓时尝试从规则三角网提取外环与内环。

```ts
const geometry = new Base2D({ vertices: new Float32Array([0, 0, 1, 0, 0, 1]) });
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get contours(): readonly Float32Array[]`  | 外轮廓与内轮廓的独立坐标副本。 |
| `getData(): Base2DOptions`  | 原始输入数组的独立副本，不含按 Style 生成的辅助边框和关键点。 |
| `setContourPoint(contourIndex: number, vertexIndex: number, x: number, y: number): boolean`  | 移动一个轮廓节点，并同步所有位于原位置的三角面顶点。 |
| `insertContourPoint(contourIndex: number, edgeIndex: number, ratio: number): boolean`  | 拆分轮廓边上的实体三角形，插入一个可继续拖动的边界节点。 |
| `override copy(source: Base2D): this`  | 当前基础几何体。 |
| `override clone(): Base2D`  | 独立顶点数组和样式的基础几何体。 |
| `setData(options: Base2DOptions): void`  | 替换顶点与属性；同尺寸更新在 Render 中复用 GPUBuffer。 |
| `override updateGeometry(): this`  | 将输入数组装入 Geo 的统一三角面结构。 |
| `appendContourDecorations(hasEdge: boolean, hasPoint: boolean): void` （内部） | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ToFloat32` | 新数组或 undefined。 |
| `AppendBaseVertex` | 把源顶点或边上插值点的全部属性写入新的实体三角面。 |
| `AppendBaseEdgeVertex` | 插入边界节点时固定几何与轮廓使用同一 Float32 坐标。 |
| `CopyOptions` | 复制并验证全部顶点数组，避免外部原地修改绕过版本通知。 |
| `CloneContour` | 自有坐标数组。 |

```ts
ToFloat32([0, 1]);
```

### 类型索引

`Base2DOptions`、`Base2DLike`、`BaseTriangleData`

### 导出关系

```ts
export default Base2D;
export type { Base2DLike, Base2DOptions };
```

### 文件：BaseContours.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `InferContours` | 从实体三角网提取所有闭合边界，包括分离的外环和多个孔环。 |
| `AddEdge` | 记录无向边的出现次数，忽略重合端点形成的零长度边。 |
| `SplitBoundaryEdges` | 将未抵消的长边按共线节点拆分，使 T 接点两侧的长短边能够逐段抵消。 |
| `LowerBound` | 在已排序的节点中查找坐标范围边界。 |
| `ContourArea` | 有向面积。 |

```ts
const rings = InferContours(options);
```

### 类型索引

`BoundaryPoint`、`BoundaryEdge`、`EdgeNode`

### 导出关系

```ts
export { InferContours };
```

### 文件：CloneGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CloneGeometry` | 按实际类型复制二维几何，保留各类型的生成参数。 |

```ts
const copied = CloneGeometry(mesh.data);
```

### 导出关系

```ts
export default CloneGeometry;
```

### 文件：Geo.ts

### Geo

CPU 几何及其单一版本；样式订阅只响应影响几何生成的字段。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 全局几何 ID。 |
| `type`（公开） | `string`；`"Geo"` | 对象类型。 |
| `_version`（内部） | `number`；`0` | 当前几何版本。（version 的内部状态）。 |
| `_generatedVersion`（内部） | `number`；`-1` | 状态由 `geometry`、`ensureGeometry`、`updateGeometry` 读取或维护；完整处理见对应函数。 |
| `_precision`（内部） | `number`；`8` | 当前曲线细分精度；不改变 NGon 边数或 Base 顶点。（precision 的内部状态）。 |
| `_originPrecision`（内部） | `number`；`8` | 最后手动设置的精度，不受 Render 的临时调整影响。（originPrecision 的内部状态）。 |
| `_style`（内部） | `Style`；`由构造参数或初始化过程赋值` | 当前共享样式，分区 enabled 决定生成内容。（style 的内部状态）。 |
| `_disposed`（内部） | `boolean`；`false` | 状态由 `style`、`onStyleChange`、`dispose`、`add` 读取或维护；完整处理见对应函数。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<GeometrySubscriber>()` | 状态由 `dispose`、`add`、`delete`、`updateVersion` 读取或维护；完整处理见对应函数。 |
| `_geometry`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 合并三角面坐标。 |
| `normal`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 逐顶点二维轮廓法线。 |
| `uv`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 逐顶点 UV。 |
| `index`（公开） | `Uint16Array \| Uint32Array \| undefined`；`由构造参数或初始化过程赋值` | 合并三角面索引。 |
| `linePoints`（公开） | `GeoPartDataLike \| undefined`；`由构造参数或初始化过程赋值` | 独立 line-list 几何。 |
| `vertexType`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 顶点用途：0 实体面、0.5 边框、1 关键点。 |
| `position`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 关键点中心，其他顶点填零。 |
| `miterScale`（公开） | `Float32Array \| undefined`；`由构造参数或初始化过程赋值` | 边框连接倍率，其他顶点填一。 |
| `uniformData`（公开） | `Float32Array<ArrayBuffer>`；`new Float32Array(4)` | 几何专属四个 f32；第四项统一为实体边框宽度，其余由对应 WGSL 解释。 |

#### 构造与案例

```ts
constructor(style: Style = new Style())
```

创建对象并建立初始状态及依赖关联。

```ts
const geo = new Geo(style);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get precision(): number`  | 当前曲线细分精度；不改变 NGon 边数或 Base 顶点。 |
| `set precision(value: number)`  | 无返回值，参数变化后延迟重建。 |
| `get originPrecision(): number`  | 最后手动设置的精度，不受 Render 的临时调整影响。 |
| `setRenderPrecision(value: number): void`  | 无返回值，保持基准精度。 |
| `copyPrecision(source: Geo): void`  | 无返回值，复制当前与基准精度。 |
| `copy(source: Geo): this`  | 深拷贝通用顶点数据与样式，不共享可修改的数组。 |
| `clone(): Geo`  | 独立的通用几何体。 |
| `get style(): Style`  | 当前共享样式，分区 enabled 决定生成内容。 |
| `set style(value: Style)`  | 当前共享样式，分区 enabled 决定生成内容。 |
| `onStyleChange(change: StyleChange): void`  | 只让几何依赖的字段触发重建，颜色和透明度不影响顶点。 |
| `dispose(): void`  | 最终停止使用时解绑 Style；不等于从 Scene 移除，不销毁 Render 缓存。 |
| `add(subscriber: GeometrySubscriber): void`  | 关联使用当前几何的消费者，重复关联不会重复通知。 |
| `delete(subscriber: GeometrySubscriber): void`  | 解绑消费者，不销毁共享几何或 GPU 缓存。 |
| `get geometry(): Float32Array \| undefined`  | 获取合并三角面的二维顶点数组。 |
| `set geometry(geometry: Float32Array \| undefined)`  | 替换合并三角面顶点数组并通知 GPU 缓存更新。 已生成的 CPU 数据直接提交；尚未生成的参数变化仍由 ensureGeometry 处理。 |
| `mergeGeometry( parts: { data: GeoPartDataLike; vertexType: number; }[], ): void`  | 按实体面、宽边框、关键点顺序合并全部三角面并补齐顶点属性。 索引按顶点偏移重新定位，顶点数量超过 Uint16 范围时自动升级位宽。 |
| `get version(): number`  | 当前几何版本。 |
| `updateVersion(): void`  | 通知 CPU 生成器及每个 Render 更新缓存。 |
| `ensureGeometry(): this`  | 参数变化后延迟生成，一帧内多次改值只生成一次。 |
| `updateGeometry(): this`  | 提交生成的数据；手动调用也会递增版本，通知每个 Render。 |

### 类型索引

`GeoBuffersLike`、`GeoPartDataLike`、`GeometrySubscriber`、`GeoData`

### 导出关系

```ts
export default Geo;
export type { BorderAlign, GeoBuffersLike, GeoData, GeometrySubscriber, GeoPartDataLike };
```

### 文件：NGon2D.ts

### NGon2D

正多边形、圆盘近似或圆环；圆心为 (0,0)，填充、边框和关键点合并绘制。
hole/nvMode/inter 仅在内部适配 BPMatrixJS，公开接口为 inner/uvMode。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"NGon2D"` | 用于材质与管线选择的几何类型。 |
| `_outer`（内部） | `number`；`由构造参数或初始化过程赋值` | 外轮廓外接圆半径。（outer 的内部状态）。 |
| `_inner`（内部） | `number`；`由构造参数或初始化过程赋值` | 内轮廓半径；0 为实心，等于 outer 时无填充面积。（inner 的内部状态）。 |
| `_sides`（内部） | `number`；`由构造参数或初始化过程赋值` | 多边形边数；增加边数可近似圆形。（sides 的内部状态）。 |
| `_uvMode`（内部） | `NGonUVMode`；`由构造参数或初始化过程赋值` | 填充 UV 模式，实体边框与关键点仍使用各自 UV。（uvMode 的内部状态）。 |
| `_startAngle`（内部） | `number`；`由构造参数或初始化过程赋值` | 第一顶点的弧度角，默认从 +X 方向起始。（startAngle 的内部状态）。 |
| `_width`（内部） | `number`；`0` | 原始外轮廓的包围盒宽度，不包含边框外扩。（width 的内部状态）。 |
| `_height`（内部） | `number`；`0` | 原始外轮廓的包围盒高度，不包含边框外扩。（height 的内部状态）。 |
| `_perimeter`（内部） | `number`；`0` | 内外独立轮廓的总长度，不使用圆周长近似多边形周长。（perimeter 的内部状态）。 |

#### 构造与案例

```ts
constructor(options: NGon2DOptions = {})
```

创建对象并建立初始状态及依赖关联。

```ts
const nGon2D = new NGon2D(options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: NGon2D): this`  | 当前正多边形。 |
| `override clone(): NGon2D`  | 独立的正多边形几何体。 |
| `get outer(): number`  | 外轮廓外接圆半径。 |
| `set outer(value: number)`  | 外轮廓外接圆半径。 |
| `get inner(): number`  | 内轮廓半径；0 为实心，等于 outer 时无填充面积。 |
| `set inner(value: number)`  | 内轮廓半径；0 为实心，等于 outer 时无填充面积。 |
| `get sides(): number`  | 多边形边数；增加边数可近似圆形。 |
| `set sides(value: number)`  | 多边形边数；增加边数可近似圆形。 |
| `get uvMode(): NGonUVMode`  | 填充 UV 模式，实体边框与关键点仍使用各自 UV。 |
| `set uvMode(value: NGonUVMode)`  | 填充 UV 模式，实体边框与关键点仍使用各自 UV。 |
| `get startAngle(): number`  | 第一顶点的弧度角，默认从 +X 方向起始。 |
| `set startAngle(value: number)`  | 第一顶点的弧度角，默认从 +X 方向起始。 |
| `get width(): number`  | 原始外轮廓的包围盒宽度，不包含边框外扩。 |
| `get height(): number`  | 原始外轮廓的包围盒高度，不包含边框外扩。 |
| `get perimeter(): number`  | 内外独立轮廓的总长度，不使用圆周长近似多边形周长。 |
| `updateGeometry(): this`  | 重建各生成分区并提交单一版本；开启内孔时索引不会跨越孔洞。 Style 颜色变化只上传样式，半径、边数和生成参数变化才重建几何。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CheckRadius` | 校验半径参数，拒绝非有限数值并处理尺寸边界。 |

```ts
CheckRadius(value);
```

### 类型索引

`NGon2DOptions`、`NGon2DLike`

### 导出关系

```ts
export default NGon2D;
export type { NGon2DLike, NGon2DOptions, NGonUVMode };
```

### 文件：Poly2D.ts

### Poly2D

单轮廓多边形/开放折线，使用通用三角面填充和实体边框，不使用矩形 SDF。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Poly2D"` | 对象及管线选择类型。 |
| `_points`（内部） | `Float32Array<ArrayBuffer>`；`由构造参数或初始化过程赋值` | 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。（points 的内部状态）。 |
| `_closed`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 是否连接末点和首点。（closed 的内部状态）。 |
| `_width`（内部） | `number`；`0` | 当前轮廓包围盒宽度。（width 的内部状态）。 |
| `_height`（内部） | `number`；`0` | 当前轮廓包围盒高度。（height 的内部状态）。 |
| `_perimeter`（内部） | `number`；`0` | 中心线长度；开放路径不计算末点到首点，圆接不增加原始路径长度。（perimeter 的内部状态）。 |

#### 构造与案例

```ts
constructor(
        points: Float32Array = new Float32Array(0),
        style?: Style | null,
        options: Poly2DOptions = {},
    )
```

创建多边形，不平移输入坐标。

```ts
const poly2D = new Poly2D(points, style, options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: Poly2D): this`  | 当前多边形。 |
| `override clone(): Poly2D`  | 独立顶点数组和样式的多边形。 |
| `get points(): Float32Array<ArrayBuffer>`  | 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。 |
| `set points(value: Float32Array)`  | 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。 |
| `get closed(): boolean`  | 是否连接末点和首点。 |
| `set closed(value: boolean)`  | 是否连接末点和首点。 |
| `get width(): number`  | 当前轮廓包围盒宽度。 |
| `get height(): number`  | 当前轮廓包围盒高度。 |
| `get perimeter(): number`  | 中心线长度；开放路径不计算末点到首点，圆接不增加原始路径长度。 |
| `updateGeometry(): this`  | 按当前 Style 全量生成填充、实体边框、辅助点和 line-list，并提交单一版本。 join 只改变边框连接，solid 和辅助点仍使用原始节点。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CopyPoints` | 验证并复制 [x,y,x,y,...] 输入，防止调用方修改原数组后静默改变几何。 |

```ts
CopyPoints(points);
```

### 类型索引

`Poly2DOptions`、`Poly2DLike`

### 导出关系

```ts
export default Poly2D;
export type { Poly2DLike, Poly2DOptions };
```

### 文件：Rect2D.ts

### Rect2D

本文件的类实现。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Rect2D"` | 对象类型 |
| `_width`（内部） | `number`；`由构造参数或初始化过程赋值` | 矩形宽度。 |
| `_height`（内部） | `number`；`由构造参数或初始化过程赋值` | 矩形高度。 |
| `_radius`（内部） | `number`；`由构造参数或初始化过程赋值` | 矩形圆角半径。 |

#### 构造与案例

```ts
constructor(options: Rect2DOptions = {})
```

创建矩形几何体并生成首个 CPU 数据版本。

```ts
const rect2D = new Rect2D(options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: Rect2D): this`  | 当前矩形几何体。 |
| `override clone(): Rect2D`  | 独立的矩形几何体。 |
| `updateGeometry(): this`  | 重新生成矩形三角面、UV、索引与 Shader 参数。 完成后提交 CPU 数据版本，通知所有 Render 更新缓存。 |
| `set width(width: number)`  | 设置矩形宽度并递增几何体版本。 |
| `get width(): number`  | 获取矩形宽度。 |
| `set height(height: number)`  | 设置矩形高度并递增几何体版本。 |
| `get height(): number`  | 获取矩形高度。 |
| `set radius(radius: number)`  | 设置圆角半径并递增几何体版本。 |
| `get radius(): number`  | 获取设置的圆角半径；绘制时按当前宽高临时限制，不丢失原值。 |
| `get perimeter(): number`  | 获取矩形实际离散轮廓的只读周长。 结果使用与矩形几何体相同的圆角限制和分段规则。 |

### 类型索引

`Rect2DOptions`、`Rect2DLike`

### 导出关系

```ts
export default Rect2D;
export type { Rect2DLike, Rect2DOptions };
```

## 4. 注意事项

- 矩形中心为局部零点；生成结果版本变化后重建。填充、边框、关键点和原生线框保持各自分区与拓扑。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- Base2D 从三角网推导边界时，必须拆分 T 接点两侧的长短共线边后再抵消内部边；保留全部外环和孔环，不能把未配对的内部边当成轮廓。轮廓修复不得重新剖分或改变原填充三角面。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">几何 三角面 顶点 边框 圆角 轮廓 精度</keywords>
<keywords language="en">geometry triangle vertex border rounded contour precision</keywords>
```
