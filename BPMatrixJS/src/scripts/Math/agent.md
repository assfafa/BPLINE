# 数学 Math

目录：`bpmatrixjs/src/scripts/Math`

## 1. 文件结构与作用

Vec2、Mat3、版本和按字段订阅。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `Mat3.ts` | 3x3矩阵 |
| `Subscriptions.ts` | 数学对象内部订阅表；不保存任何 GPU 资源。 |
| `Vec2.ts` | 2D向量 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export { Mat3, type Mat3Data, type Mat3Like } from "./Mat3.js";
export type { MathSubscriber, VersionedMath } from "./Subscriptions.js";
export { Vec2, type Vec2Data, type Vec2Like } from "./Vec2.js";
```

## 3. 其他源码文件

### 文件：Mat3.ts

### Mat3

3x3矩阵

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_data`（内部） | `Mat3Data`；`CreateIdentityData()` | 矩阵数组 采用列主序: [m00, m10, m20, m01, m11, m21, m02, m12, m22] |
| `_committedData`（内部） | `Mat3Data`；`CreateIdentityData()` | 状态由 `updateGPUData` 读取或维护；完整处理见对应函数。 |
| `_version`（内部） | `number`；`0` | 当前矩阵版本，只读。（version 的内部状态）。 |
| `_subscriptions`（内部） | `按初始化值推断`；`new Subscriptions()` | 状态由 `add`、`delete`、`updateGPUData` 读取或维护；完整处理见对应函数。 |
| `GPUData`（公开） | `Float32Array<ArrayBuffer>`；`new Float32Array(12)` | WebGPU uniform 使用的矩阵数组。 每列补齐到 vec4，共 12 个 f32。 |

#### 构造与案例

```ts
constructor(data?: Readonly<Mat3Data>)
```

创建3x3矩阵

```ts
const mat3 = new Mat3(data);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 当前矩阵版本，只读。 |
| `get data(): Readonly<Mat3Data>`  | 列主序只读视图；整体赋值和 set 会同步 GPUData 并通知。 |
| `set data(value: Readonly<Mat3Data>)`  | 列主序只读视图；整体赋值和 set 会同步 GPUData 并通知。 |
| `add(subscriber: MathSubscriber, field: string = "value"): this`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: MathSubscriber, field?: string): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `updateVersion(): void`  | 提交原地数据变化；GPUData 同步完成后通知，数值未变时不递增版本。 |
| `identity(): this`  | 设置为单位矩阵 |
| `set(data: Readonly<Mat3Data>): this`  | 设置矩阵数组 |
| `setTranslate(vec2: Readonly<Vec2Like>): this`  | 设置平移分量 |
| `setScale(vec2: Readonly<Vec2Like>): this`  | 设置缩放分量 |
| `setRotation(angle: number): this`  | 设置旋转分量 |
| `getTranslate(vec2: Vec2Like = new Vec2()): Vec2Like`  | 获取平移分量 |
| `getScale(vec2: Vec2Like = new Vec2()): Vec2Like`  | 获取缩放分量 |
| `getRotation(): number`  | 获取旋转弧度 |
| `mul(value: number \| Readonly<Mat3Like>, mat3?: Readonly<Mat3Like>): this`  | 矩阵乘法 传入标量时执行标量乘法 传入一个矩阵时执行当前矩阵右乘目标矩阵 传入两个矩阵时执行 a * b 并写回当前矩阵 |
| `transpose(): this`  | 转置矩阵 |
| `det(): number`  | 求矩阵行列式 |
| `invert(): this`  | 求逆矩阵 不可逆时保持原矩阵不变 |
| `copy(mat3: Readonly<Mat3Like>): this`  | 复制目标矩阵 |
| `clone(): Mat3`  | 克隆矩阵 |
| `equals(mat3: Readonly<Mat3Like>): boolean`  | 判断矩阵是否完全相等 |
| `multiplyData(left: Readonly<Mat3Data>, right: Readonly<Mat3Data>): this` （内部） | 计算矩阵乘积并同步矩阵数据版本。 |
| `updateGPUData(): void` （内部） | 同步 WebGPU uniform 使用的 16 字节对齐矩阵数组。 每 3 个矩阵分量后补 1 个 f32 占位。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateIdentityData` | 创建独立的单位矩阵数组，避免不同矩阵共享可变数据。 |

```ts
CreateIdentityData();
```

### 类型索引

`Mat3Data`、`Mat3Like`

### 导出关系

```ts
export type { MathSubscriber, VersionedMath } from "./Subscriptions.js";
export { Mat3 };
export type { Mat3Data, Mat3Like };
```

### 文件：Subscriptions.ts

### Subscriptions

数学对象内部订阅表；不保存任何 GPU 资源。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_subscribers`（内部） | `按初始化值推断`；`new Map<MathSubscriber, Set<string>>()` | 状态由 `add`、`delete`、`notify` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `add(subscriber: MathSubscriber, field: string): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: MathSubscriber, field?: string): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `notify(source: VersionedMath): void`  | 向当前订阅者发送变化通知，由接收方安排后续更新。 |

### 类型索引

`VersionedMath`、`MathSubscriber`

### 导出关系

```ts
export default Subscriptions;
export type { MathSubscriber, VersionedMath };
```

### 文件：Vec2.ts

### Vec2

2D向量

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_data`（内部） | `Vec2Data`；`由构造参数或初始化过程赋值` | X分量 |
| `_version`（内部） | `number`；`0` | Y分量 当前变化版本，只读。（version 的内部状态）。 |
| `_subscriptions`（内部） | `按初始化值推断`；`new Subscriptions()` | 状态由 `delete`、`updateVersion`、`add` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(x: number = 0, y: number = 0)
```

创建2D向量

```ts
const vec2 = new Vec2(x, y);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | Y分量 当前变化版本，只读。 |
| `get data(): Readonly<Vec2Data>`  | 只读分量视图；整体赋值使用 data setter，分量使用 x/y。 |
| `set data(value: Readonly<Vec2Data>)`  | 只读分量视图；整体赋值使用 data setter，分量使用 x/y。 |
| `get x(): number`  | X 分量。 |
| `set x(value: number)`  | X 分量。 |
| `get y(): number`  | Y 分量。 |
| `set y(value: number)`  | Y 分量。 |
| `delete(subscriber: MathSubscriber, field?: string): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `updateVersion(): void`  | 手动提交原地修改的底层数据；通常使用 x/y、set 或 data setter。 |
| `add(vec2: Readonly<Vec2Like>): this;`  | 传 Vec2Like 执行加法；传 MathSubscriber 登记订阅，不修改分量。 |
| `add(subscriber: MathSubscriber, field?: string): this;`  | 传 Vec2Like 执行加法；传 MathSubscriber 登记订阅，不修改分量。 |
| `add(value: Readonly<Vec2Like> \| MathSubscriber, field: string = "value"): this`  | 传 Vec2Like 执行加法；传 MathSubscriber 登记订阅，不修改分量。 |
| `sub(vec2: Readonly<Vec2Like>): this`  | 当前向量减去目标向量 |
| `mul(vec2: Readonly<Vec2Like>): this`  | 当前向量按分量乘以目标向量 |
| `div(vec2: Readonly<Vec2Like>): this`  | 当前向量按分量除以目标向量 |
| `dot(vec2: Readonly<Vec2Like>): number`  | 计算与目标向量的点乘 |
| `crs(vec2: Readonly<Vec2Like>): number`  | 计算与目标向量的叉乘 |
| `dist(vec2: Readonly<Vec2Like>): number`  | 计算与目标向量的距离 |
| `distSq(vec2: Readonly<Vec2Like>): number`  | 计算与目标向量的距离平方 |
| `len(): number`  | 获取向量长度 |
| `lenSq(): number`  | 获取向量长度平方 |
| `normal(): this`  | 将当前向量归一化 |
| `copy(vec2: Readonly<Vec2Like>): this`  | 复制目标向量的分量到当前向量 |
| `clone(): Vec2`  | 克隆当前向量 |
| `set(x: number, y: number): this`  | 设置向量分量 |
| `setX(x: number): this`  | 设置X分量 |
| `setY(y: number): this`  | 设置Y分量 |
| `apply(mat3: Readonly<Mat3Like>): this`  | 应用矩阵变换 |
| `max(vec2: Readonly<Vec2Like>): this`  | 按分量取较大值 |
| `min(vec2: Readonly<Vec2Like>): this`  | 按分量取较小值 |
| `clamp(min: Readonly<Vec2Like>, max: Readonly<Vec2Like>): this`  | 将当前向量限制在最小值和最大值之间 |
| `scl(value: number): this`  | 乘以标量 |
| `angle(vec2?: Readonly<Vec2Like>): number`  | 获取向量弧度 传入目标向量时，返回与目标向量的夹角弧度 |
| `equals(vec2: Readonly<Vec2Like>): boolean`  | 判断是否与目标向量完全相等 |

### 类型索引

`Vec2Data`、`Vec2Like`

### 导出关系

```ts
export type { MathSubscriber, VersionedMath } from "./Subscriptions.js";
export { Vec2 };
export type { Vec2Data, Vec2Like };
```

## 4. 注意事项

- 每次数学修改原子提交并通知一次；Mat3 按列主序存储，GPUData 每列补齐到四项。不要在数学层引入 Render 或 GPU。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">数学 向量 矩阵 坐标 版本 订阅</keywords>
<keywords language="en">math vector matrix coordinate version subscription</keywords>
```
