# 样式 Style

目录：`bplinejs/src/scripts/Style`

## 1. 文件结构与作用

实体面、线框、边框、关键点和连接的订阅链。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `BloomStyle.ts` | 对象专属bloom参数，由对应后处理通道按值合批；不改变几何。 |
| `EdgeStyle.ts` | 有宽度的实体三角面边框样式。 |
| `Effects.ts` | 捕获效果值，供冻结实例、保存回显及按值合批使用。 |
| `index.ts` | 共享样式；四个显示分区与节点连接样式独立持有参数，通过订阅链通知使用者。 |
| `JoinStyle.ts` | 多边形节点连接样式，只控制几何拓扑，不拥有颜色、宽度或 GPU 缓存。 |
| `PartStyle.ts` | 四个样式分区的共同基础，仅管理显示、颜色、透明度和订阅。 |
| `PointsStyle.ts` | 关键点样式；总开关与顶点/边中点选择分离。 |
| `ShadowStyle.ts` | 对象专属shadow参数，由对应后处理通道按值合批；不改变几何。 |
| `SolidStyle.ts` | 实体面样式，SDF 边框属于此分区，不与 EdgeStyle 共用参数。 |
| `TexturedStyle.ts` | 面、实体边框和关键点使用的贴图参数，各分区独立持有。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `WireframeStyle.ts` | 原生 line-list 样式，仅有独立开关、颜色和透明度，不提供无效的线宽选项。 |
| `WriteStyleData.ts` | 将一份 Style 写入连续实例数组，不分配目标数组，也不修改 Style。；转换为 Shader 使用的边框外扩系数。 |

## 2. index 入口、案例与类接口

### Style

共享样式；四个显示分区与节点连接样式独立持有参数，通过订阅链通知使用者。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Style"` | 对象类型。 |
| `_bloom`（内部） | `按初始化值推断`；`new BloomStyle()` | 对象发光配置；需要添加 Bloom 通道。（bloom 的内部状态）。 |
| `_shadow`（内部） | `按初始化值推断`；`new ShadowStyle()` | 对象内外阴影配置；需要添加 Shadow 通道。（shadow 的内部状态）。 |
| `_solid`（内部） | `SolidStyle`；`new SolidStyle()` | 实体面与 SDF 样式。（solid 的内部状态）。 |
| `_wireframe`（内部） | `WireframeStyle`；`new WireframeStyle()` | 原生线框样式。（wireframe 的内部状态）。 |
| `_edge`（内部） | `EdgeStyle`；`new EdgeStyle()` | 实体三角面边框样式。（edge 的内部状态）。 |
| `_points`（内部） | `PointsStyle`；`new PointsStyle()` | 关键点样式。（points 的内部状态）。 |
| `_join`（内部） | `JoinStyle`；`new JoinStyle()` | 多边形连接类型和精度，由 Geometry.style 决定，不随实例单独生成。（join 的内部状态）。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<StyleSubscriber>()` | 状态由 `add`、`delete`、`dispose`、`onPartChange` 读取或维护；完整处理见对应函数。 |
| `_version`（内部） | `number`；`0` | 任意分区变化时递增的单一版本。（version 的内部状态）。 |
| `_key`（内部） | `string`；`"wireframe:0"` | 仅描述会改变材质管线选择的样式状态，显示数值不参与 Pipeline 缓存键。（key 的内部状态）。 |

#### 构造与案例

```ts
constructor()
```

构建四个关闭的显示分区及默认尖角连接，并订阅它们的变化。

```ts
const style = new Style();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `copy(source: Style): this`  | 复制各分区参数到当前对象，保留当前对象的订阅关系。 |
| `clone(): Style`  | 创建拥有独立分区和颜色的新样式。 |
| `static copy(source: Style): Style`  | 从来源直接创建新样式。 |
| `get solid(): SolidStyle`  | 实体面与 SDF 样式。 |
| `get bloom(): BloomStyle`  | 对象发光配置；需要添加 Bloom 通道。 |
| `get shadow(): ShadowStyle`  | 对象内外阴影配置；需要添加 Shadow 通道。 |
| `get wireframe(): WireframeStyle`  | 原生线框样式。 |
| `get edge(): EdgeStyle`  | 实体三角面边框样式。 |
| `get points(): PointsStyle`  | 关键点样式。 |
| `get join(): JoinStyle`  | 多边形连接类型和精度，由 Geometry.style 决定，不随实例单独生成。 |
| `get version(): number`  | 任意分区变化时递增的单一版本。 |
| `get key(): string`  | 仅描述会改变材质管线选择的样式状态，显示数值不参与 Pipeline 缓存键。 |
| `add(subscriber: StyleSubscriber): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: StyleSubscriber): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `dispose(): void`  | 最终停止使用时释放整条订阅链，不销毁共享颜色、贴图或 GPU 缓存。 仅在所有 Geometry / Material 均停止使用该 Style 后调用，不应再复用。 |
| `onPartChange(area: Exclude<StyleArea, "whole">, field: string): void`  | 将分区变化转发给使用者；接收者自行判断是否影响 CPU 几何。 |

### 导出关系

```ts
export default Style;
export type { JoinType } from "./JoinStyle";
export type {
    BorderAlign, PartSubscriber, PixelAligned, StyleArea,
    StyleChange,
    StyleSubscriber,
} from "./types";
export { STYLE_STRIDE, WriteStyleData } from "./WriteStyleData";
export { BloomStyle, ShadowStyle, EdgeStyle, JoinStyle, PointsStyle, SolidStyle, WireframeStyle };
```

## 3. 其他源码文件

### 文件：BloomStyle.ts

### BloomStyle

对象专属bloom参数，由对应后处理通道按值合批；不改变几何。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_radius`（内部） | `number`；`20` | 屏幕 CSS px 模糊半径，默认 20。 |
| `_intensity`（内部） | `number`；`1` | 非负发光强度，默认 1。 |
| `_threshold`（内部） | `number`；`0` | 亮度阈值，0 表示全部可见像素参与，默认 0。 |

#### 构造与案例

```ts
constructor()
```

默认关闭的效果样式。

```ts
const part = new BloomStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get radius(): number`  | 屏幕 CSS px 模糊半径。 |
| `set radius(value: number)`  | 无返回值，通知样式消费者。 |
| `get intensity(): number`  | 非负发光强度。 |
| `set intensity(value: number)`  | 无返回值，通知样式消费者。 |
| `get threshold(): number`  | 亮度阈值，0 表示全部可见像素参与。 |
| `set threshold(value: number)`  | 无返回值，通知样式消费者。 |
| `override copy(source: BloomStyle): this`  | 当前效果样式，颜色独立。 |
| `override clone(): BloomStyle`  | 独立的新效果样式。 |

### 导出关系

```ts
export default BloomStyle;
```

### 文件：EdgeStyle.ts

### EdgeStyle

有宽度的实体三角面边框样式。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_addressModeV`（公开） | `GPUAddressMode`；`"clamp-to-edge"` | 边框横向 UV 固定，避免跨越边框宽度重复贴图。 |
| `_width`（内部） | `number`；`1` | 实体边框宽度，0 不生成边框。（width 的内部状态）。 |
| `_borderAlign`（内部） | `BorderAlign`；`"normal"` | 边框对齐：inset / normal / outset。（borderAlign 的内部状态）。 |
| `_pixelAligned`（内部） | `PixelAligned`；`"px"` | px 固定像素，zoom 随相机缩放。（pixelAligned 的内部状态）。 |
| `_uvRepeat`（内部） | `number`；`1` | 沿完整轮廓的 UV 重复次数。（uvRepeat 的内部状态）。 |

#### 构造与案例

```ts
constructor()
```

创建关闭的实体边框，顺向重复、横向固定。

```ts
const edgeStyle = new EdgeStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: EdgeStyle): this`  | 复制边框宽度、对齐和贴图重复设置。 |
| `override clone(): EdgeStyle`  | 创建独立的边框样式。 |
| `get width(): number`  | 实体边框宽度，0 不生成边框。 |
| `set width(value: number)`  | 实体边框宽度，0 不生成边框。 |
| `get borderAlign(): BorderAlign`  | 边框对齐：inset / normal / outset。 |
| `set borderAlign(value: BorderAlign)`  | 边框对齐：inset / normal / outset。 |
| `get pixelAligned(): PixelAligned`  | px 固定像素，zoom 随相机缩放。 |
| `set pixelAligned(value: PixelAligned)`  | px 固定像素，zoom 随相机缩放。 |
| `get uvRepeat(): number`  | 沿完整轮廓的 UV 重复次数。 |
| `set uvRepeat(value: number)`  | 沿完整轮廓的 UV 重复次数。 |

### 导出关系

```ts
export default EdgeStyle;
```

### 文件：Effects.ts

### Effects

捕获效果值，供冻结实例、保存回显及按值合批使用。

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static capture(style: Style): EffectData`  | 不持有 Style 或 Color 引用的快照。 |
| `static apply(style: Style, data: EffectData): void`  | 无返回值，保持订阅链。 |
| `static validate(data: unknown): void`  | 无返回值，非法效果在修改现有对象前报错。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `RequireRecord` | 属性记录，非法对象抛错。 |
| `Finite` | 是否是有限数字。 |
| `Unit` | 是否位于单位区间。 |
| `Require` | 无返回值，拒绝不合法的效果记录。 |

```ts
RequireRecord(data);
```

### 类型索引

`EffectPartData`、`BloomData`、`ShadowData`、`EffectData`

### 导出关系

```ts
export default Effects;
export type { EffectData, BloomData, ShadowData };
```

### 文件：JoinStyle.ts

### JoinStyle

多边形节点连接样式，只控制几何拓扑，不拥有颜色、宽度或 GPU 缓存。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_type`（内部） | `JoinType`；`"miter"` | 默认尖角；bevel 切掉尖端，但不会断开边框。（type 的内部状态）。 |
| `_seg`（内部） | `number`；`8` | 每个圆接的细分段数，默认 8；不影响填充面或原生线框。（seg 的内部状态）。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<PartSubscriber>()` | 状态由 `add`、`delete`、`dispose`、`notify` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `copy(source: JoinStyle): this`  | 复制节点连接类型及分段数。 |
| `clone(): JoinStyle`  | 创建独立的节点连接样式。 |
| `get type(): JoinType`  | 默认尖角；bevel 切掉尖端，但不会断开边框。 |
| `set type(value: JoinType)`  | 默认尖角；bevel 切掉尖端，但不会断开边框。 |
| `get seg(): number`  | 每个圆接的细分段数，默认 8；不影响填充面或原生线框。 |
| `set seg(value: number)`  | 每个圆接的细分段数，默认 8；不影响填充面或原生线框。 |
| `add(subscriber: PartSubscriber): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: PartSubscriber): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `dispose(): void`  | 清理订阅，不销毁其他对象。 |
| `notify(field: string): void` （内部） | 向当前订阅者发送变化通知，由接收方安排后续更新。 |

### 类型索引

`JoinType`

### 导出关系

```ts
export default JoinStyle;
export type { JoinType };
```

### 文件：PartStyle.ts

### PartStyle

四个样式分区的共同基础，仅管理显示、颜色、透明度和订阅。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `area`（公开） | `Exclude<StyleArea, "whole">`；`由构造参数或初始化过程赋值` | 分区身份。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<PartSubscriber>()` | 状态由 `add`、`delete`、`dispose`、`notify` 读取或维护；完整处理见对应函数。 |
| `_enabled`（内部） | `boolean`；`false` | 是否生成并显示该分区，默认关闭。（enabled 的内部状态）。 |
| `_color`（内部） | `Color`；`new Color()` | 该分区独立颜色，默认不透明白色。（color 的内部状态）。 |
| `_opacity`（公开） | `number`；`1` | 该分区独立透明度，作用于最终输出 alpha。（opacity 的内部状态）。 |

#### 构造与案例

```ts
constructor(area: Exclude<StyleArea, "whole">)
```

创建分区并订阅默认颜色。

```ts
const partStyle = new PartStyle(area);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get enabled(): boolean`  | 是否生成并显示该分区，默认关闭。 |
| `set enabled(value: boolean)`  | 是否生成并显示该分区，默认关闭。 |
| `get color(): Color`  | 该分区独立颜色，默认不透明白色。 |
| `set color(value: Color)`  | 该分区独立颜色，默认不透明白色。 |
| `get opacity(): number`  | 该分区独立透明度，作用于最终输出 alpha。 |
| `set opacity(value: number)`  | 该分区独立透明度，作用于最终输出 alpha。 |
| `copy(source: PartStyle): this`  | 复制通用分区参数；颜色内容独立，避免后续改色影响来源。 |
| `clone(): PartStyle`  | 创建拥有独立颜色的同类分区。 |
| `add(subscriber: PartSubscriber): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: PartSubscriber): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `dispose(): void`  | 最终停止使用时解除颜色订阅及分区订阅；不销毁共享 Color。 |
| `onColorChange(color: Color, field: string): void`  | 接收颜色的字段级通知。 |
| `notify(field: string): void`  | 向当前订阅者发送变化通知，由接收方安排后续更新。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `NormalizeSize` | 验证尺寸参数并钳制负值；拒绝非有限值，避免污染几何和 GPU 数据。 |

```ts
NormalizeSize(value);
```

### 导出关系

```ts
export default PartStyle;
export { NormalizeSize };
```

### 文件：PointsStyle.ts

### PointsStyle

关键点样式；总开关与顶点/边中点选择分离。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_addressModeU`（公开） | `GPUAddressMode`；`"clamp-to-edge"` | 点标记的 U 轴 UV 固定在一张贴图内。 |
| `_addressModeV`（公开） | `GPUAddressMode`；`"clamp-to-edge"` | 点标记的 V 轴 UV 固定在一张贴图内。 |
| `_pixelAligned`（内部） | `PixelAligned`；`"px"` | px 固定像素，zoom 随相机缩放。（pixelAligned 的内部状态）。 |
| `_vertices`（内部） | `boolean`；`true` | 是否生成顶点点位；仍受 enabled 总开关控制。（vertices 的内部状态）。 |
| `_midpoints`（内部） | `boolean`；`false` | 是否生成边中点；仍受 enabled 总开关控制。（midpoints 的内部状态）。 |
| `_radius`（内部） | `number`；`2` | 点半径，默认 2。（radius 的内部状态）。 |
| `_segments`（内部） | `number`；`4` | 点型边数，默认 4。（segments 的内部状态）。 |
| `_minPointsLength`（内部） | `number`；`6` | 顶点相邻边长度之和的严格下限。（minPointsLength 的内部状态）。 |
| `_minEdgePointsLength`（内部） | `number`；`4` | 边中点所在边长度的严格下限。（minEdgePointsLength 的内部状态）。 |

#### 构造与案例

```ts
constructor()
```

创建关闭的点型，默认选择顶点点位，UV 两轴固定不重复。

```ts
const pointsStyle = new PointsStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: PointsStyle): this`  | 复制关键点形状、过滤阈值和贴图设置。 |
| `override clone(): PointsStyle`  | 创建独立的关键点样式。 |
| `get pixelAligned(): PixelAligned`  | px 固定像素，zoom 随相机缩放。 |
| `set pixelAligned(value: PixelAligned)`  | px 固定像素，zoom 随相机缩放。 |
| `get vertices(): boolean`  | 是否生成顶点点位；仍受 enabled 总开关控制。 |
| `set vertices(value: boolean)`  | 是否生成顶点点位；仍受 enabled 总开关控制。 |
| `get midpoints(): boolean`  | 是否生成边中点；仍受 enabled 总开关控制。 |
| `set midpoints(value: boolean)`  | 是否生成边中点；仍受 enabled 总开关控制。 |
| `get radius(): number`  | 点半径，默认 2。 |
| `set radius(value: number)`  | 点半径，默认 2。 |
| `get segments(): number`  | 点型边数，默认 4。 |
| `set segments(value: number)`  | 点型边数，默认 4。 |
| `get minPointsLength(): number`  | 顶点相邻边长度之和的严格下限。 |
| `set minPointsLength(value: number)`  | 顶点相邻边长度之和的严格下限。 |
| `get minEdgePointsLength(): number`  | 边中点所在边长度的严格下限。 |
| `set minEdgePointsLength(value: number)`  | 边中点所在边长度的严格下限。 |

### 导出关系

```ts
export default PointsStyle;
```

### 文件：ShadowStyle.ts

### ShadowStyle

对象专属shadow参数，由对应后处理通道按值合批；不改变几何。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_opacity`（公开） | `number`；`0.5` | 阴影默认半透明，不影响其他样式区域的默认值。 |
| `_blur`（内部） | `number`；`12` | 屏幕 CSS px 模糊半径，默认 12。 |
| `_spread`（内部） | `number`；`0` | 屏幕 CSS px 扩散距离，非负，默认 0。 |
| `_offsetX`（内部） | `number`；`4` | 屏幕 CSS px 水平偏移，正值向右，默认 4。 |
| `_offsetY`（内部） | `number`；`-4` | 屏幕 CSS px 垂直偏移，正值向上，默认 -4。 |
| `_inner`（内部） | `boolean`；`false` | 是否显示轮廓内阴影，默认 false。 |
| `_outer`（内部） | `boolean`；`true` | 是否显示轮廓外阴影，默认 true。 |

#### 构造与案例

```ts
constructor()
```

默认关闭的效果样式。

```ts
const part = new ShadowStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get blur(): number`  | 屏幕 CSS px 模糊半径。 |
| `set blur(value: number)`  | 无返回值，通知样式消费者。 |
| `get spread(): number`  | 屏幕 CSS px 扩散距离，非负。 |
| `set spread(value: number)`  | 无返回值，通知样式消费者。 |
| `get offsetX(): number`  | 屏幕 CSS px 水平偏移，正值向右。 |
| `set offsetX(value: number)`  | 无返回值，通知样式消费者。 |
| `get offsetY(): number`  | 屏幕 CSS px 垂直偏移，正值向上。 |
| `set offsetY(value: number)`  | 无返回值，通知样式消费者。 |
| `get inner(): boolean`  | 是否显示轮廓内阴影。 |
| `set inner(value: boolean)`  | 无返回值，通知样式消费者。 |
| `get outer(): boolean`  | 是否显示轮廓外阴影。 |
| `set outer(value: boolean)`  | 无返回值，通知样式消费者。 |
| `override copy(source: ShadowStyle): this`  | 当前效果样式，颜色独立。 |
| `override clone(): ShadowStyle`  | 独立的新效果样式。 |

### 导出关系

```ts
export default ShadowStyle;
```

### 文件：SolidStyle.ts

### SolidStyle

实体面样式，SDF 边框属于此分区，不与 EdgeStyle 共用参数。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_borderColor`（内部） | `Color`；`new Color("#000000")` | SDF 边框独立颜色。（borderColor 的内部状态）。 |
| `_borderWidth`（内部） | `number`；`0` | SDF 边框宽度，0 表示关闭 SDF 边框。（borderWidth 的内部状态）。 |
| `_borderAlign`（内部） | `BorderAlign`；`"normal"` | 边框对齐：inset / normal / outset。（borderAlign 的内部状态）。 |
| `_pixelAligned`（内部） | `PixelAligned`；`"px"` | px 固定像素，zoom 随相机缩放。（pixelAligned 的内部状态）。 |

#### 构造与案例

```ts
constructor()
```

创建关闭的实体面样式。

```ts
const solidStyle = new SolidStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: SolidStyle): this`  | 复制实体面及 SDF 边框参数。 |
| `override clone(): SolidStyle`  | 创建独立的实体面样式。 |
| `get borderColor(): Color`  | SDF 边框独立颜色。 |
| `set borderColor(value: Color)`  | SDF 边框独立颜色。 |
| `dispose(): void`  | 最终停止使用时解除 SDF 边框色与填充色的订阅。 |
| `onColorChange(color: Color, field: string): void`  | 校验字段仍引用当前颜色，忽略已替换颜色发出的过期通知。 |
| `get borderWidth(): number`  | SDF 边框宽度，0 表示关闭 SDF 边框。 |
| `set borderWidth(value: number)`  | SDF 边框宽度，0 表示关闭 SDF 边框。 |
| `get borderAlign(): BorderAlign`  | 边框对齐：inset / normal / outset。 |
| `set borderAlign(value: BorderAlign)`  | 边框对齐：inset / normal / outset。 |
| `get pixelAligned(): PixelAligned`  | px 固定像素，zoom 随相机缩放。 |
| `set pixelAligned(value: PixelAligned)`  | px 固定像素，zoom 随相机缩放。 |

### 导出关系

```ts
export default SolidStyle;
```

### 文件：TexturedStyle.ts

### TexturedStyle

面、实体边框和关键点使用的贴图参数，各分区独立持有。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_texture`（内部） | `TextureInput \| undefined`；`由构造参数或初始化过程赋值` | 当前贴图，undefined 使用白色后备贴图。（texture 的内部状态）。 |
| `_addressModeU`（公开） | `GPUAddressMode`；`"repeat"` | U 轴默认重复；子样式可以在字段声明中指定自己的默认值。 |
| `_addressModeV`（公开） | `GPUAddressMode`；`"repeat"` | V 轴默认重复；子样式可以在字段声明中指定自己的默认值。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get texture(): TextureInput \| undefined`  | 当前贴图，undefined 使用白色后备贴图。 |
| `set texture(value: TextureInput \| undefined)`  | 当前贴图，undefined 使用白色后备贴图。 |
| `override copy(source: TexturedStyle): this`  | 复制通用外观及贴图设置；Texture 作为资源保留同一引用。 |
| `override clone(): TexturedStyle`  | 创建同类贴图分区。 |
| `onTextureChange(texture: TextureInput): void`  | 图片内容变化向上通知，但不把它当作替换贴图引用。 |
| `override dispose(): void`  | 最终停用时解绑贴图和颜色，不销毁共享资源。 |
| `get addressModeU(): GPUAddressMode`  | U 方向贴图寻址方式。 |
| `set addressModeU(value: GPUAddressMode)`  | U 方向贴图寻址方式。 |
| `get addressModeV(): GPUAddressMode`  | V 方向贴图寻址方式。 |
| `set addressModeV(value: GPUAddressMode)`  | V 方向贴图寻址方式。 |

### 导出关系

```ts
export default TexturedStyle;
```

### 文件：types.ts


### 类型索引

`StyleArea`、`BorderAlign`、`PixelAligned`、`StyleChange`、`StyleSubscriber`、`PartSubscriber`

### 导出关系

```ts
export type { BorderAlign, PartSubscriber, PixelAligned, StyleArea, StyleChange, StyleSubscriber };
```

### 文件：WireframeStyle.ts

### WireframeStyle

原生 line-list 样式，仅有独立开关、颜色和透明度，不提供无效的线宽选项。

#### 构造与案例

```ts
constructor()
```

创建默认关闭的原生线框。

```ts
const wireframeStyle = new WireframeStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: WireframeStyle): this`  | 复制线框开关、颜色与透明度。 |
| `override clone(): WireframeStyle`  | 创建独立的线框样式。 |

### 导出关系

```ts
export default WireframeStyle;
```

### 文件：WriteStyleData.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `WriteStyleData` | 将一份 Style 写入连续实例数组，不分配目标数组，也不修改 Style。 |
| `Align` | 转换为 Shader 使用的边框外扩系数。 |

```ts
WriteStyleData(style, target, offset);
```

### 导出关系

```ts
export { STYLE_STRIDE, WriteStyleData };
```

## 4. 注意事项

- Geometry 只响应生成相关字段，Material 响应外观和绑定；Style 不持有 GPU。copy/clone 深复制颜色与分区，纹理资源保持引用。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- `bloom` 和 `shadow` 是独立 PartStyle，默认 enabled=false；颜色、透明度及效果参数走现有订阅链，但启停效果不重建几何。copy/clone 与编辑器保存回显包含两种效果，Style 不持有 GPU 资源。
- Bloom 默认白色、opacity=1、radius=20、intensity=1、threshold=0；Shadow 默认黑色、opacity=0.5、blur=12、spread=0、offsetX=4、offsetY=-4、inner=false、outer=true。尺寸使用 CSS 像素。
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">样式 颜色 边框 关键点 连接 复制</keywords>
<keywords language="en">style color border points join copy</keywords>
```
