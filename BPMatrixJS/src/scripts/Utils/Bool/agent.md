# 布尔几何 Boolean WASM

目录：`bpmatrixjs/src/scripts/Utils/Bool`

## 1. 文件结构与作用

Rust iOverlay 区域运算与 iTriangle 三角化；连续轮廓、三角网和混合输入，来源追踪与空间谓词。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | WASM 二维区域布尔运算；第一次 await ready，之后运算同步且不改写输入。 |
| `Input.ts` | 独立规范化轮廓，不修改输入。；共同空间中的路径；三角网输出同绕向三角形。；九个有限的列主序矩阵分量。 |
| `LICENSE` | 对应代码或资源的许可说明，打包时保持要求的声明。 |
| `Operations.ts` | 最多一个结果；不连通或有孔时为 base，空集 items 为空。；每个 A 减去 B 并集后的分片及 removed/split 追踪。；相交实体区域，只有边界接触时为空。 |
| `Output.ts` | 可复用的局部几何和恢复世界坐标的矩阵。；与输出有实体交集的输入引用说明。 |
| `Predicates.ts` | 是否接触或相交，边界接触也为 true。；是否有非零面积交集，仅边界接触为 false。；B 是否完全被 A 的并集覆盖；空 B 为 true，边界允许重合。 |
| `Runtime.ts` | 惰性共享实例；只有首次 ready 异步，后续全部运算同步。 |
| `src/` | Rust iOverlay 区域运算与 iTriangle 三角化；连续轮廓、三角网和混合输入，来源追踪与空间谓词。 详见该目录的 agent.md。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### Bool

WASM 二维区域布尔运算；第一次 await ready，之后运算同步且不改写输入。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `Union`（公开） | `按初始化值推断`；`Union` | 合并全部区域，返回一个 poly/base；空结果 items=[]。 |
| `Difference`（公开） | `按初始化值推断`；`Difference` | 每个 A 分别减去所有 B 的并集，保留分片与删除追踪。 |
| `Intersection`（公开） | `按初始化值推断`；`Intersection` | 交集，第三参数 a/b/both 选择归属；默认 a。 |
| `Xor`（公开） | `按初始化值推断`；`Xor` | 非相交区域，默认双方 XOR；a 或 b 只保留那一侧。 |
| `Intersects`（公开） | `按初始化值推断`；`Intersects` | 精确接触/相交谓词，包含边界接触。 |
| `Overlaps`（公开） | `按初始化值推断`；`Overlaps` | 精确面积相交谓词，不包含仅边界接触。 |
| `Covers`（公开） | `按初始化值推断`；`Covers` | B 是否被 A 的并集完全覆盖。 |
| `FastCollision`（公开） | `按初始化值推断`；`FastCollision` | 包围盒候选碰撞检测，无需初始化 WASM。 |
| `GetBounds`（公开） | `按初始化值推断`；`GetBounds` | 获取可缓存的共同坐标包围盒，无需初始化 WASM。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static ready(): Promise<void>`  | 共享初始化 Promise；Node、浏览器和 Worker 使用同一个二进制。 |

### 导出关系

```ts
export { Bool, Covers, Difference, FastCollision, GetBounds, Intersection, Intersects, Overlaps, Union, Xor };
export type {
    BoolBounds, BoolChange, BoolContour, BoolFillRule, BoolGeometry, BoolGeometryData,
    BoolId, BoolInput, BoolKeep, BoolResult, BoolSide, BoolSource, BoolTriangles,
} from "./types.js";
```

## 3. 其他源码文件

### 文件：Input.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Prepare` | 独立规范化轮廓，不修改输入。 |
| `ReadPaths` | 共同空间中的路径；三角网输出同绕向三角形。 |
| `ReadMatrix` | 九个有限的列主序矩阵分量。 |
| `NGonPath` | 仅边界节点。 |
| `TrianglePaths` | 同绕向三角轮廓，重叠三角形按并集而不是奇偶抵消。 |
| `IsIndex` | 是否为非负整数。 |
| `SequentialIndex` | 下标。 |
| `Bounds` | 包围盒；空路径返回 null。 |
| `BoundsOverlap` | 包围盒是否接触或重叠，true 仍需精确检测。 |

```ts
Prepare(inputs, "a");
```

### 导出关系

```ts
export { Bounds, BoundsOverlap, Prepare, ReadPaths };
```

### 文件：Operations.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Union` | 最多一个结果；不连通或有孔时为 base，空集 items 为空。 |
| `Difference` | 每个 A 减去 B 并集后的分片及 removed/split 追踪。 |
| `Intersection` | 相交实体区域，只有边界接触时为空。 |
| `Xor` | 不相交区域；双方模式输出不重叠的集合分量。 |
| `Binary` | 带来源追踪的集合结果。 |
| `AppendSide` | 无返回值。 |
| `Merge` | 统一绕向下的并集连通分量。 |
| `AppendOperands` | 无返回值。 |
| `HasArea` | 是否有实体区域。 |
| `Source` | 来源副本。 |
| `HasSource` | 是否包含目标 id+side。 |
| `FindOwner` | 对应对象或 undefined。 |

```ts
Union([rect, text]);
```

### 导出关系

```ts
export { Difference, Intersection, Merge, Union, Xor };
```

### 文件：Output.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateOutput` | 可复用的局部几何和恢复世界坐标的矩阵。 |
| `Contributors` | 与输出有实体交集的输入引用说明。 |

```ts
CreateOutput(shapes, owner, 0, sources);
```

### 导出关系

```ts
export { Contributors, CreateOutput };
```

### 文件：Predicates.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Intersects` | 是否接触或相交，边界接触也为 true。 |
| `Overlaps` | 是否有非零面积交集，仅边界接触为 false。 |
| `Covers` | B 是否完全被 A 的并集覆盖；空 B 为 true，边界允许重合。 |
| `GetBounds` | 共同坐标空间的包围盒；不初始化 WASM。 |
| `FastCollision` | 包围盒快速碰撞候选检查，true 可能是假阳性，需 Intersects 精筛；无需 ready。 |
| `ResolveBounds` | 可直接检查的包围盒。 |
| `Predicate` | 任意一对实体是否满足谓词。 |

```ts
Intersects([a], [b]);
```

### 导出关系

```ts
export { Covers, FastCollision, GetBounds, Intersects, Overlaps };
```

### 文件：Runtime.ts

### BoolRuntime

惰性共享实例；只有首次 ready 异步，后续全部运算同步。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_pending`（内部） | `Promise<void> \| undefined`；`由构造参数或初始化过程赋值` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_module`（内部） | `BoolModule \| undefined`；`由构造参数或初始化过程赋值` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static Ready(): Promise<void>`  | 加载成功后完成的 Promise，失败可重试。 |
| `static async Load(): Promise<void>` （内部） | 初始化共享模块，无返回值。 |
| `static Reset(error: unknown): never` （内部） | 重新抛出错误，允许再次 ready。 |
| `static Run(operation: number, a: readonly BoolContour[], b: readonly BoolContour[] = [], fill: BoolFillRule = "nonzero"): Float64Array`  | 独立结果数组，不引用 WASM 内存。 |
| `static Shapes(operation: number, a: readonly BoolContour[], b: readonly BoolContour[] = [], fill: BoolFillRule = "nonzero"): BoolShape[]`  | 外圈和孔分组的连通分量。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Pack` | 可直接复制到原生堆的协议数据。 |

```ts
Pack(a, b);
```

### 类型索引

`BoolModule`

### 导出关系

```ts
export { BoolRuntime };
```

### 文件：types.ts


### 类型索引

`BoolId`、`BoolSide`、`BoolKeep`、`BoolFillRule`、`BoolContour`、`BoolShape`、`BoolSource`、`BoolInputBase`、`BoolTriangles`、`BoolInput`、`BoolGeometryData`、`BoolGeometry`、`BoolChange`、`BoolResult`、`BoolBounds`、`PreparedInput`

### 导出关系

```ts
export type {
    BoolBounds, BoolChange, BoolContour, BoolFillRule, BoolGeometry, BoolGeometryData,
    BoolId, BoolInput, BoolKeep, BoolResult, BoolShape, BoolSide, BoolSource, BoolTriangles, PreparedInput,
};
```

## 4. 注意事项

- await Bool.ready() 只初始化一次，后续运算同步。src 保存 Rust 与锁定依赖；build 是忽略的产物目录。所有依赖按 MIT 使用，LICENSE 随包复制。缓存和工具链位于 WSL .local/wasm-bool。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- `Union(inputs)` 返回最多一个 `items`；不连通合并结果为 base。`Difference(a,b)` 对每个 A 减去 B 并集，分裂为独立 items，减空仍在 changes 记录 removed。
- `Intersection(a,b,keep="a")`、`Xor(a,b,keep="both")` 支持 a/b/both。单侧模式保持对象归属；both 先做集合并集，输出空间分量不重复。
- 每个输出 id 为新 UUID；sourceId 是归属对象，part 是分片编号，sources 保存实际面积贡献来源，changes.outputs 指向 items 下标。metadata 从归属对象原样传递。
- 输出 data.geometry/contours/points 均为局部坐标，matrix 恢复运算空间。不能忽略返回矩阵直接以世界坐标显示。data.normal 为零，uv 按新包围盒生成；材质与旧 UV 插值由调用层负责。
- 输入 rect/ngon/poly 直接计算连续轮廓；base/text 接受实体三角面（geometry + 可选 index），合并渲染数组应带 vertexType 过滤边框和点。支持显式 contours 与 nonzero/evenodd。
- Intersects 包含边界接触；Overlaps 只认面积交集；Covers 接受相同边界且空 B 为 true。FastCollision 只是 AABB 候选检测，可缓存 GetBounds 结果且不需要 ready。
- 所有运算使用 i64 内核与 f64 输入，仍受浮点表示和所选坐标范围精度约束，不承诺无限精度；不支持开放折线的面积布尔或透视矩阵。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">布尔 并集 减法 交集 差集 打孔 分裂 来源 碰撞 覆盖</keywords>
<keywords language="en">boolean union difference intersection xor holes split provenance collision covers wasm rust</keywords>
```
