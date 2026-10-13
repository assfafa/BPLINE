# 对象节点 ObjectNode

目录：`bplinejs/src/scripts/Object`

## 1. 文件结构与作用

局部 TRS、显式矩阵和世界变换缓存。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 场景节点变换基类：参数持有一个版本，计算结果和每个消费者各存处理快照。 |

## 2. index 入口、案例与类接口

### ObjectNode

场景节点变换基类：参数持有一个版本，计算结果和每个消费者各存处理快照。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 全局节点 ID。 |
| `type`（公开） | `string`；`"ObjectNode"` | 节点类型。 |
| `_version`（内部） | `number`；`0` | 节点输入版本；计算快照不会清除或回退它。（version 的内部状态）。 |
| `_parent`（内部） | `AddObject \| null`；`null` | 父节点，场景树结构请通过 Group.add/remove 修改。（parent 的内部状态）。 |
| `_position`（内部） | `Vec2`；`由构造参数或初始化过程赋值` | 位置向量，内部 set/setX/x 赋值均能通知。（position 的内部状态）。 |
| `_rotation`（内部） | `number`；`0` | 本地旋转弧度。（rotation 的内部状态）。 |
| `_scale`（内部） | `Vec2`；`new Vec2(1, 1)` | 缩放向量，可与其他节点共享。（scale 的内部状态）。 |
| `_matrix`（内部） | `Mat3`；`new Mat3()` | 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。（matrix 的内部状态）。 |
| `_worldMatrix`（内部） | `Mat3`；`new Mat3()` | 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。（worldMatrix 的内部状态）。 |
| `_order`（内部） | `number`；`0` | 绘制排序值。（order 的内部状态）。 |
| `_localSnapshot`（内部） | `number`；`-1` | 状态由 `onMathChange`、`ensureMatrix`、`updateMatrix` 读取或维护；完整处理见对应函数。 |
| `_worldSnapshot`（内部） | `number`；`-1` | 状态由 `onMathChange`、`updateMatrix`、`ensureWorldMatrix`、`updateWorldMatrix` 读取或维护；完整处理见对应函数。 |
| `_parentSnapshot`（内部） | `Mat3 \| null`；`null` | 状态由 `onMathChange`、`ensureWorldMatrix` 读取或维护；完整处理见对应函数。 |
| `_parentVersion`（内部） | `number`；`-1` | 状态由 `onMathChange`、`ensureWorldMatrix` 读取或维护；完整处理见对应函数。 |
| `_writingMatrices`（内部） | `boolean`；`false` | 状态由 `onMathChange`、`updateMatrix`、`ensureWorldMatrix` 读取或维护；完整处理见对应函数。 |
| `_nodeDisposed`（公开） | `boolean`；`false` | 状态由 `onMathChange`、`ensureMatrix`、`dispose` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(x: number, y: number)
```

创建对象并建立初始状态及依赖关联。

```ts
const objectNode = new ObjectNode(x, y);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 节点输入版本；计算快照不会清除或回退它。 |
| `updateVersion(): void`  | 手动使变换失效；普通 position/scale/rotation 修改已自动通知。 |
| `get parent(): AddObject \| null`  | 父节点，场景树结构请通过 Group.add/remove 修改。 |
| `set parent(value: AddObject \| null)`  | 父节点，场景树结构请通过 Group.add/remove 修改。 |
| `get position(): Vec2`  | 位置向量，内部 set/setX/x 赋值均能通知。 |
| `set position(value: Vec2)`  | 位置向量，内部 set/setX/x 赋值均能通知。 |
| `get rotation(): number`  | 本地旋转弧度。 |
| `set rotation(value: number)`  | 本地旋转弧度。 |
| `get scale(): Vec2`  | 缩放向量，可与其他节点共享。 |
| `set scale(value: Vec2)`  | 缩放向量，可与其他节点共享。 |
| `get matrix(): Mat3`  | 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。 |
| `set matrix(value: Mat3)`  | 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。 |
| `get worldMatrix(): Mat3`  | 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。 |
| `set worldMatrix(value: Mat3)`  | 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。 |
| `onMathChange(source: VersionedMath, field: string): void`  | 数学对象完成修改后通知节点；内部计算不反向增加输入版本。 |
| `ensureMatrix(): Mat3`  | 参数版本改变后才生成本地矩阵。 |
| `updateMatrix(): Mat3`  | 强制根据 position/rotation/scale 生成本地矩阵；覆盖手动指定的本地矩阵。 |
| `ensureWorldMatrix(): Mat3`  | 先更新祖先，再按自身版本、父矩阵身份和版本更新世界矩阵，不遍历兄弟节点。 |
| `updateWorldMatrix(): Mat3`  | 强制重新计算当前世界矩阵，同时保留显式修改的本地矩阵。 |
| `get order(): number`  | 绘制排序值。 |
| `set order(value: number)`  | 绘制排序值。 |
| `dispose(): void`  | 最终释放数学对象订阅，不移除场景节点，不销毁共享 Vec2/Mat3。 |

### 类型索引

`ObjectNodeLike`

### 导出关系

```ts
export default ObjectNode;
export type { ObjectNodeLike };
```

## 3. 其他源码文件

## 4. 注意事项

- 输入变化按字段订阅；世界矩阵只处理需要的祖先。显式局部矩阵持续有效，直到 TRS 输入改变。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">对象 节点 位置 旋转 缩放 世界矩阵</keywords>
<keywords language="en">object node position rotation scale world matrix</keywords>
```
