# 通用算法 Utils

目录：`bpmatrixjs/src/scripts/Utils`

## 1. 文件结构与作用

纯数值、平面几何、事件坐标和计时工具。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Bool/` | 纯数值、平面几何、事件坐标和计时工具。 详见该目录的 agent.md。 |
| `index.ts` | 数值钳制 |
| `Inner.ts` | 获取当前设备像素比 服务端或无窗口环境下默认返回 1；获取当前窗口实际像素尺寸 宽高会乘以设备像素比；将屏幕坐标转换为画布像素坐标 默认会按当前设备像素比进行换算 |
| `PlanarGeometry.ts` | 计算有向多边形的两倍面积，符号表示顶点绕向。；检查第一条凸轮廓的边法线是否能分开两条凸轮廓。 完整 SAT 相交检测还需要交换参数再调用一次。；判断二维点是否位于三角形内部或边界上。 |
| `PointGeometry.ts` | 使用双精度系数计算的世界点。；双精度局部点，矩阵不可逆或非有限时返回 null。；线段上的最近点；退化边返回独立的起点副本。 |
| `Precision.ts` | 校验曲线细分精度，限制单条圆弧的最大顶点数。 |
| `Time.ts` | 时间工具类 |
| `UUID.ts` | 生成 UUID 优先使用浏览器原生 crypto.randomUUID 不支持时降级为 getRandomValues 或 Math.random |

## 2. index 入口、案例与类接口


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Clamp` | 数值钳制 |

```ts
Clamp(value, min, max);
```

### 导出关系

```ts
export { ConvertEventToCanvasCoord, GetDevicePixelRatio, GetInner } from "./Inner.js";
export type { CanvasCoord, InnerSize } from "./Inner.js";
export {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
} from "./PlanarGeometry.js";
export type { Point2D, Triangle2D } from "./PlanarGeometry.js";
export { ContainsPolygonPoint, InverseTransformPoint2D, ProjectSegmentPoint, TransformPoint2D } from "./PointGeometry.js";
export type { PolygonFillRule } from "./PointGeometry.js";
export { CheckPrecision } from "./Precision.js";
export { Time } from "./Time.js";
export type { TimeLike, TimeUpdateFn } from "./Time.js";
export { UUID } from "./UUID.js";
export { Clamp };
```

## 3. 其他源码文件

### 文件：Inner.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetDevicePixelRatio` | 获取当前设备像素比 服务端或无窗口环境下默认返回 1 |
| `GetInner` | 获取当前窗口实际像素尺寸 宽高会乘以设备像素比 |
| `ConvertEventToCanvasCoord` | 将屏幕坐标转换为画布像素坐标 默认会按当前设备像素比进行换算 |

```ts
GetDevicePixelRatio();
```

### 类型索引

`InnerSize`、`CanvasCoord`

### 导出关系

```ts
export { ConvertEventToCanvasCoord, GetDevicePixelRatio, GetInner };
export type { CanvasCoord, InnerSize };
```

### 文件：PlanarGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `SignedDoubleArea` | 计算有向多边形的两倍面积，符号表示顶点绕向。 |
| `HasSeparatingAxis` | 检查第一条凸轮廓的边法线是否能分开两条凸轮廓。 完整 SAT 相交检测还需要交换参数再调用一次。 |
| `ContainsTrianglePoint` | 判断二维点是否位于三角形内部或边界上。 |
| `SegmentDistanceSquared` | 计算二维点到有限线段的平方距离，零长度线段按端点处理。 |
| `EdgeSide` | 计算点到有向边的二维交叉积。 |
| `Crossing` | 在一条裁剪边上插值得到输入线段的交点。 |
| `TriangleOverlapArea` | 用三角形裁剪三角形，返回共同覆盖面积；两种绕向均可。 |

```ts
const doubledArea = SignedDoubleArea(triangle);
```

### 类型索引

`Point2D`、`Triangle2D`

### 导出关系

```ts
export {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
};
export type { Point2D, Triangle2D };
```

### 文件：PointGeometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `TransformPoint2D` | 使用双精度系数计算的世界点。 |
| `InverseTransformPoint2D` | 双精度局部点，矩阵不可逆或非有限时返回 null。 |
| `ProjectSegmentPoint` | 线段上的最近点；退化边返回独立的起点副本。 |
| `ContainsPolygonPoint` | 是否在填充区域内；采用半开射线规则，不额外扩大边界容差。 |

```ts
const world = TransformPoint2D(matrix, point);
```

### 类型索引

`PolygonFillRule`

### 导出关系

```ts
export { ContainsPolygonPoint, InverseTransformPoint2D, ProjectSegmentPoint, TransformPoint2D };
export type { PolygonFillRule };
```

### 文件：Precision.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CheckPrecision` | 校验曲线细分精度，限制单条圆弧的最大顶点数。 |

```ts
const precision = CheckPrecision(16);
```

### 导出关系

```ts
export { CheckPrecision };
```

### 文件：Time.ts

### Time

时间工具类

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `initial`（公开） | `number`；`由构造参数或初始化过程赋值` | 初始时间戳 |
| `current`（公开） | `number`；`由构造参数或初始化过程赋值` | 当前时间戳 |
| `past`（公开） | `number`；`0` | 已经过时间 |
| `difference`（公开） | `number`；`0` | 与上一帧的时间差 |
| `log`（公开） | `number[]`；`[]` | 帧率记录 |
| `fps`（公开） | `number`；`0` | 平均帧率 |
| `maxLogLength`（公开） | `number`；`由构造参数或初始化过程赋值` | 帧率采样数量 |
| `onUpdate`（公开） | `TimeUpdateFn`；`由构造参数或初始化过程赋值` | 时间更新回调 外部可按需挂载 |

#### 构造与案例

```ts
constructor(initial: number = Time.now(), maxLogLength: number = 60)
```

创建时间工具

```ts
const time = new Time(initial, maxLogLength);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static now(): number`  | 获取当前时间戳 优先使用 performance.now |
| `update(current: number = Time.now()): this`  | 更新时间数据 |
| `reset(initial: number = Time.now()): this`  | 重置时间状态 |

### 类型索引

`TimeUpdateFn`、`TimeLike`

### 导出关系

```ts
export { Time };
export type { TimeLike, TimeUpdateFn };
```

### 文件：UUID.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `UUID` | 生成 UUID 优先使用浏览器原生 crypto.randomUUID 不支持时降级为 getRandomValues 或 Math.random |

```ts
UUID();
```

### 导出关系

```ts
export { UUID };
```

## 4. 注意事项

- 通用算法不依赖 Mesh/Scene/Editor；编辑器负责屏幕容差和业务开关，数学工具负责坐标与几何计算。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">工具 通用算法 相交 投影 距离 环绕 精度</keywords>
<keywords language="en">utils algorithm intersection projection distance winding precision</keywords>
```
