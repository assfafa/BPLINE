# 多边形生成 Poly

目录：`bpmatrixjs/src/scripts/Geometry/Poly`

## 1. 文件结构与作用

凹多边形、自交轮廓、开放路径和描边连接。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 单轮廓多边形/折线生成器，不持有任何 GPU 资源。 |
| `Path.ts` | 计算三个节点形成的有向两倍面积，用于判断转向和退化面。；检查有限非负数值，拒绝不适合几何计算的参数。；检查细分段数的整数范围，避免异常数量的顶点分配。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `WindingFill.ts` | 计算两段轮廓边的交点横坐标；共线重叠返回重叠区间的两端。；计算边在指定横坐标的纵坐标。；将非退化三角形按 Poly 正面所需的顺时针绕序写入网格。 |

## 2. index 入口、案例与类接口

### Poly

单轮廓多边形/折线生成器，不持有任何 GPU 资源。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_path`（内部） | `Path`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`points`、`width`、`height` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `PolyGeometryData`；`由构造参数或初始化过程赋值` | 填充数组，关闭 solid 时为空数组。（data 的内部状态）。 |
| `_borderData`（内部） | `PolyBorderGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的边框载体。（borderData 的内部状态）。 |
| `_lineData`（内部） | `PolyLineGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的 line-list 数据。（lineData 的内部状态）。 |
| `_pointData`（内部） | `PolyPointGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的点型数据。（pointData 的内部状态）。 |

#### 构造与案例

```ts
constructor(points: readonly PolyPoint[] = [], options: PolyOptions = {})
```

创建对象并建立初始状态及依赖关联。

```ts
const poly = new Poly(points, options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get points(): readonly PolyNode[]`  | 规范化后的只读节点；闭合轮廓统一逆时针。 |
| `get width(): number`  | 原始轮廓包围盒宽度。 |
| `get height(): number`  | 原始轮廓包围盒高度。 |
| `get closed(): boolean`  | 是否闭合。 |
| `get solid(): boolean`  | 是否生成实体面。 |
| `get data(): PolyGeometryData`  | 填充数组，关闭 solid 时为空数组。 |
| `get borderData(): PolyBorderGeometryData \| undefined`  | 最近生成的边框载体。 |
| `get lineData(): PolyLineGeometryData \| undefined`  | 最近生成的 line-list 数据。 |
| `get pointData(): PolyPointGeometryData \| undefined`  | 最近生成的点型数据。 |
| `set(points: readonly PolyPoint[], options: PolyOptions = {}): this`  | 更新输入参数并使已有生成结果失效。 |
| `getPerimeter(): number`  | 计算当前轮廓周长，供顺向 UV 重复量等计算使用。 |
| `createBorderGeometry( lineWidth: number, uvRepeat: number = 1, align: PolyBorderAlign = "normal", ): PolyBorderGeometryData`  | 生成带宽度边框的三角面及其法线、UV 和索引。 |
| `createLineGeometry(uvRepeat: number = 1): PolyLineGeometryData`  | 生成沿轮廓连接的 line-list 顶点与索引数据。 |
| `createPointGeometry( pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, ): PolyPointGeometryData`  | 按顶点与中点选项生成合并点型几何。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Pack` | 将轮廓属性和临时数值数组整理为类型化几何数据。 |
| `Fill` | 简单轮廓用耳切，自交轮廓按非零环绕规则切分后生成填充面。 |
| `Line` | 沿原始轮廓生成独立线段，不增加圆角细分点。 |
| `Border` | 生成与 Rect 相同的 Shader 外扩载体，端点为 butt 平头。 尖角使用斜接；圆接只细分转弯外侧，内侧交点避免重复叠色。 圆接精度不移动中心节点，也不增加中心线周长；连接处 U 保持节点处的值。 |
| `Points` | 顶点点型和线段中点合并成一次三角面绘制的数据。 开放端点的相邻边长之和只计算实际存在的一条边。 |
| `CreatePolyGeometry` | 生成单条多边形轮廓的填充几何。 |
| `CreatePolyBorderGeometry` | 生成多边形或折线的带宽度边框。 |
| `CreatePolyLineGeometry` | 生成多边形或折线的 line-list 几何。 |
| `CreatePolyPointGeometry` | 生成多边形或折线的顶点和中点标记。 |
| `GetPolyPerimeter` | 计算多边形或折线的有效边长总和。 |

```ts
Pack(path, geometry, normal, uv, index);
```

### 导出关系

```ts
export type * from "./types.js";
export {
    CreatePolyBorderGeometry, CreatePolyGeometry, CreatePolyLineGeometry,
    CreatePolyPointGeometry,
    GetPolyPerimeter, Poly,
};
export default Poly;
```

## 3. 其他源码文件

### 文件：Path.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Cross` | 计算三个节点形成的有向两倍面积，用于判断转向和退化面。 |
| `Nonnegative` | 检查有限非负数值，拒绝不适合几何计算的参数。 |
| `Segments` | 检查细分段数的整数范围，避免异常数量的顶点分配。 |
| `CreatePath` | 复制单条轮廓，允许空集、自交和回折；连续重复节点合并，避免零长度法线。 闭合轮廓按有向面积统一方向；自交路径的填充由非零环绕剖分处理。 |
| `JoinNormal` | 计算轮廓连接处的角平分线法线与斜接补偿倍率。 |
| `Triangulate` | 耳切法支持简单凹多边形；只剔除填充剖分中的共线节点，线框和辅助点保留它们。 自交路径由 WindingFill 预先识别并单独剖分，不进入这里的扇形降级。 |

```ts
Cross(a, b, c);
```

### 类型索引

`Path`

### 导出关系

```ts
export { CreatePath, Cross, JoinNormal, Nonnegative, Segments, Triangulate };
export type { Path };
```

### 文件：types.ts


### 类型索引

`PolyNode`、`PolyPoint`、`PolyBorderAlign`、`PolyOptions`、`PolyGeometryData`、`PolyBorderGeometryData`、`PolyLineGeometryData`、`PolyPointGeometryData`、`PolyLike`

### 导出关系

```ts
export type {
    PolyBorderAlign, PolyBorderGeometryData, PolyGeometryData, PolyLike, PolyLineGeometryData, PolyNode, PolyOptions, PolyPoint, PolyPointGeometryData,
};
```

### 文件：WindingFill.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IntersectionXs` | 计算两段轮廓边的交点横坐标；共线重叠返回重叠区间的两端。 |
| `EdgeY` | 计算边在指定横坐标的纵坐标。 |
| `AddTriangle` | 将非退化三角形按 Poly 正面所需的顺时针绕序写入网格。 |
| `WindingFill` | 对自交单轮廓执行非零环绕填充：在顶点和交点的 X 处切带，再按边的有向穿越数填充。 普通简单轮廓返回 undefined，让原有耳切路径继续处理。 |

```ts
const cuts = IntersectionXs(a, b, c, d, tolerance);
```

### 类型索引

`FillMesh`、`Crossing`

### 导出关系

```ts
export { WindingFill };
export type { FillMesh };
```

## 4. 注意事项

- 普通凹轮廓使用耳切，自交轮廓按非零环绕分解；原始边线与关键点不使用新增的填充分割点。单轮廓不定义 evenodd 或独立孔接口。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">多边形 凹 自交 五角星 环绕 填充 描边</keywords>
<keywords language="en">polygon concave self-intersection pentagram winding fill stroke</keywords>
```
