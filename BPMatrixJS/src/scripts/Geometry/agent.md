# 几何 Geometry

目录：`bpmatrixjs/src/scripts/Geometry`

## 1. 文件结构与作用

填充、边框、关键点和线框的 CPU 生成。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `NGon/` | 等边形、圆盘近似和内外圈拓扑。 详见该目录的 agent.md。 |
| `NGon.ts` | 以原点为圆心的正多边形、圆盘或圆环；圆是增加 sides 后的多边形近似。 |
| `Poly/` | 凹多边形、自交轮廓、开放路径和描边连接。 详见该目录的 agent.md。 |
| `Rect/` | 矩形与圆角轮廓、UV、周长、边框和标记点。 详见该目录的 agent.md。 |
| `Rect.ts` | 矩形几何生成器。 按需维护填充三角面、边框三角面、line-list 轮廓和线框点位数据。 |
| `Text/` | 字体注册、布局、曲线离散及带孔字形剖分。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export {
    CreateNGonBorderGeometry, CreateNGonGeometry, CreateNGonLineGeometry,
    CreateNGonPointGeometry,
    GetNGonPerimeter, NGon,
} from "./NGon.js";
export type { NGonLike, NGonOptions, NGonUVMode } from "./NGon.js";
export {
    CreatePolyBorderGeometry, CreatePolyGeometry, CreatePolyLineGeometry,
    CreatePolyPointGeometry,
    GetPolyPerimeter, Poly,
} from "./Poly/index.js";
export type {
    PolyBorderAlign, PolyBorderGeometryData, PolyGeometryData, PolyLike, PolyLineGeometryData, PolyNode, PolyOptions, PolyPoint, PolyPointGeometryData,
} from "./Poly/index.js";
export {
    CreateRectBorderGeometry,
    CreateRectGeometry,
    CreateRectLineGeometry,
    CreateRectPointGeometry,
    GetRectPerimeter,
    Rect,
} from "./Rect.js";
export type {
    RectBorderAlign,
    RectBorderGeometryData,
    RectGeometryData,
    RectLike,
    RectLineGeometryData,
    RectPointGeometryData,
} from "./Rect.js";
export {
    CreateTextBorderGeometry, CreateTextGeometry, CreateTextLineGeometry,
    CreateTextPointGeometry,
    GetTextPerimeter, HasTextFont, RegisterTextFont, Text, UnregisterTextFont,
} from "./Text/index.js";
export type {
    TextAlign,
    TextBaseline, TextBorderAlign, TextBorderGeometryData, TextGeometryData, TextLike, TextLineGeometryData, TextOptions, TextPointGeometryData,
} from "./Text/index.js";
```

## 3. 其他源码文件

### 文件：NGon.ts

### NGon

以原点为圆心的正多边形、圆盘或圆环；圆是增加 sides 后的多边形近似。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_settings`（内部） | `Settings`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`sides`、`hole`、`nvMode` 读取或维护；完整处理见对应函数。 |
| `_nodes`（内部） | `readonly PolyNode[]`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`set`、`contours` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `PolyGeometryData`；`由构造参数或初始化过程赋值` | 当前填充面，包含 geometry/normal/uv/index 和包围盒。（data 的内部状态）。 |
| `_borderData`（内部） | `PolyBorderGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近一次生成的内外圈边框载体。（borderData 的内部状态）。 |
| `_lineData`（内部） | `PolyLineGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近一次生成的内外圈 line-list。（lineData 的内部状态）。 |
| `_pointData`（内部） | `PolyPointGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近一次生成的内外圈辅助点。（pointData 的内部状态）。 |

#### 构造与案例

```ts
constructor(options: NGonOptions = {})
```

创建对象并建立初始状态及依赖关联。

```ts
const nGon = new NGon(options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get sides(): number`  | 边数；2 为退化直线，仅生成线、边框和点型。 |
| `set sides(value: number)`  | 边数；2 为退化直线，仅生成线、边框和点型。 |
| `get hole(): boolean`  | 是否生成孔洞。 |
| `set hole(value: boolean)`  | 是否生成孔洞。 |
| `get nvMode(): NGonUVMode`  | 填充 UV 模式。 |
| `set nvMode(value: NGonUVMode)`  | 填充 UV 模式。 |
| `get outer(): number`  | 外接圆半径。 |
| `set outer(value: number)`  | 外接圆半径。 |
| `get inter(): number`  | 内轮廓半径，hole=false 时保留但不使用。 |
| `set inter(value: number)`  | 内轮廓半径，hole=false 时保留但不使用。 |
| `get startAngle(): number`  | 第一节点角度，单位弧度。 |
| `set startAngle(value: number)`  | 第一节点角度，单位弧度。 |
| `get solid(): boolean`  | 是否生成填充数组。 |
| `set solid(value: boolean)`  | 是否生成填充数组。 |
| `get width(): number`  | 原始外圈包围盒宽度，不包含额外边框。 |
| `get height(): number`  | 原始外圈包围盒高度。 |
| `get data(): PolyGeometryData`  | 当前填充面，包含 geometry/normal/uv/index 和包围盒。 |
| `get borderData(): PolyBorderGeometryData \| undefined`  | 最近一次生成的内外圈边框载体。 |
| `get lineData(): PolyLineGeometryData \| undefined`  | 最近一次生成的内外圈 line-list。 |
| `get pointData(): PolyPointGeometryData \| undefined`  | 最近一次生成的内外圈辅助点。 |
| `set(options: NGonOptions): this`  | 原子更新参数、立即重建填充并清除附加数组；传入的字段之外保留原值。 |
| `getPerimeter(): number`  | 计算当前轮廓周长，供顺向 UV 重复量等计算使用。 |
| `contours(): { poly: Poly; inner: boolean; }[]` （内部） | 分别构建有效的内外轮廓，避免将独立轮廓错误连接。 |
| `createBorderGeometry( lineWidth: number, uvRepeat: number = 1, align: PolyBorderAlign = "normal", ): PolyBorderGeometryData`  | 生成内外圈边框载体，需 Shader 使用 normal*miterScale*线宽 外扩。 内孔法线指向孔内，inset 表示边框位于实体材料内侧。 |
| `createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData`  | 生成沿轮廓连接的 line-list 顶点与索引数据。 |
| `createPointGeometry( pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, ): PolyPointGeometryData`  | 生成内外圈顶点/边中点的辅助几何，UV 在每个点型自身包围盒内归一化。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateNGonGeometry` | 生成等边形或圆环的填充几何。 |
| `CreateNGonBorderGeometry` | 生成等边形内外轮廓的实体边框几何。 |
| `CreateNGonLineGeometry` | 生成等边形内外轮廓的 line-list 几何。 |
| `CreateNGonPointGeometry` | 生成等边形轮廓的顶点和线段中点标记。 |
| `GetNGonPerimeter` | 计算等边形有效轮廓的总周长。 |

```ts
CreateNGonGeometry(options);
```

### 导出关系

```ts
export {
    CreateNGonBorderGeometry, CreateNGonGeometry, CreateNGonLineGeometry,
    CreateNGonPointGeometry,
    GetNGonPerimeter, NGon,
};
export type { NGonLike, NGonOptions, NGonUVMode };
export default NGon;
```

### 文件：Rect.ts

### Rect

矩形几何生成器。
按需维护填充三角面、边框三角面、line-list 轮廓和线框点位数据。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_width`（内部） | `number`；`0` | 获取矩形宽度。（width 的内部状态）。 |
| `_height`（内部） | `number`；`0` | 获取矩形高度。（height 的内部状态）。 |
| `_radius`（内部） | `number`；`0` | 获取圆角半径。（radius 的内部状态）。 |
| `_precision`（内部） | `number`；`8` | 当前圆角每段的细分数。（precision 的内部状态）。 |
| `_originPrecision`（内部） | `number`；`8` | 用户最后指定的基准精度。（originPrecision 的内部状态）。 |
| `_data`（内部） | `RectGeometryData`；`CreateEmptyGeometryData()` | 获取填充三角面数据。（data 的内部状态）。 |
| `_borderData`（内部） | `RectBorderGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 获取最近一次生成的边框三角面数据。（borderData 的内部状态）。 |
| `_lineData`（内部） | `RectLineGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 获取最近一次生成的 line-list 数据。（lineData 的内部状态）。 |
| `_pointData`（内部） | `RectPointGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 获取最近一次生成的点位三角面。（pointData 的内部状态）。 |

#### 构造与案例

```ts
constructor(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius))
```

创建矩形几何生成器。

```ts
const rect = new Rect(width, height, radius);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get precision(): number`  | 当前圆角每段的细分数。 |
| `set precision(value: number)`  | 无返回值。 |
| `get originPrecision(): number`  | 用户最后指定的基准精度。 |
| `set(width: number, height: number, radius: number = 0, precision: number = this.precision): this`  | 更新矩形参数并重新生成填充三角面。 已生成的边框、line 和点位数据会失效，需要按需重新生成。 |
| `createBorderGeometry( lineWidth: number, uvRepeat: number = 1, align: RectBorderAlign = "normal", ): RectBorderGeometryData`  | 生成由顶点着色器扩宽的矩形边框载体三角面。 geometry 中每个中心轮廓点重复两次，normal 保存单位外法线， miterScale 保存直角连接处的扩展补偿倍率， UV 的 V 分量使用 0 和 1 区分内外侧顶点。 U 沿完整闭合轮廓按 uvRepeat 重复，V 横跨线宽固定为 0 到 1。 |
| `createLineGeometry(uvRepeat: number = 1): RectLineGeometryData`  | 生成矩形轮廓的 line-list 顶点与索引。 U 沿完整闭合轮廓按 uvRepeat 重复。 |
| `createPointGeometry( pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, ): RectPointGeometryData`  | 在线框顶点及线段中点生成独立点型三角面，不会自动生成其他缓存。 |
| `getPerimeter(): number`  | 获取当前矩形实际离散轮廓的周长。 结果使用与几何生成相同的圆角分段，可直接用于计算 UV 重复次数。 |
| `get width(): number`  | 获取矩形宽度。 |
| `get height(): number`  | 获取矩形高度。 |
| `get radius(): number`  | 获取圆角半径。 |
| `get data(): RectGeometryData`  | 获取填充三角面数据。 |
| `get borderData(): RectBorderGeometryData \| undefined`  | 获取最近一次生成的边框三角面数据。 |
| `get lineData(): RectLineGeometryData \| undefined`  | 获取最近一次生成的 line-list 数据。 |
| `get pointData(): RectPointGeometryData \| undefined`  | 获取最近一次生成的点位三角面。 |
| `static GetPerimeter(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): number`  | 获取指定矩形实际离散轮廓的周长。 |
| `static CreateGeometry(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): RectGeometryData`  | 直接生成矩形填充三角面。 |
| `static CreateBorderGeometry( width: number, height: number, radius: number = 0, lineWidth: number = 1, uvRepeat: number = 1, align: RectBorderAlign = "normal", precision: number = DefaultRectPrecision(width, height, radius, lineWidth, align), ): RectBorderGeometryData`  | 直接生成由顶点着色器扩宽的矩形边框载体三角面。 |
| `static CreateLineGeometry( width: number, height: number, radius: number = 0, uvRepeat: number = 1, precision: number = DefaultRectPrecision(width, height, radius), ): RectLineGeometryData`  | 直接生成矩形 line-list 轮廓。 |
| `static CreatePointGeometry( width: number, height: number, radius: number = 0, pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, precision: number = DefaultRectPrecision(width, height, radius), ): RectPointGeometryData`  | 直接生成矩形线框点位。 |

### 导出关系

```ts
export {
    CreateRectBorderGeometry,
    CreateRectGeometry,
    CreateRectLineGeometry,
    CreateRectPointGeometry,
    GetRectPerimeter,
    Rect,
};
export type {
    RectBorderAlign,
    RectBorderGeometryData,
    RectGeometryData,
    RectLike,
    RectLineGeometryData,
    RectPointGeometryData,
};
```

## 4. 注意事项

- 矩形中心为局部零点；生成结果版本变化后重建。填充、边框、关键点和原生线框保持各自分区与拓扑。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">几何 三角面 顶点 边框 圆角 轮廓 精度</keywords>
<keywords language="en">geometry triangle vertex border rounded contour precision</keywords>
```
