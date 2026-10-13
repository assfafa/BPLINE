# 实例记录 Raws

目录：`bplinejs/src/scripts/Raws`

## 1. 文件结构与作用

稳定编号的单条 Raw 与记录集合。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 由 IMesh 持有的原始记录索引；外部使用 map.get(id) 后修改记录，不直接增删 Map。；一条实例原始记录；id 稳定，index 对应连续数组中的槽位。 |

## 2. index 入口、案例与类接口

### Raws

由 IMesh 持有的原始记录索引；外部使用 map.get(id) 后修改记录，不直接增删 Map。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_map`（内部） | `按初始化值推断`；`new Map<number, Raw>()` | 只读 Map，避免外部删除记录后遗留订阅或数组空洞。（map 的内部状态）。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get map(): ReadonlyMap<number, Raw>`  | 只读 Map，避免外部删除记录后遗留订阅或数组空洞。 |
| `get size(): number`  | 记录数量，raw=false 时始终为 0。 |
| `add(raw: Raw): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `clear(): void`  | 由 IMesh.clear / dispose 调用，解除全部订阅。 |
### Raw

一条实例原始记录；id 稳定，index 对应连续数组中的槽位。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 全局唯一 ID，不随扩容改变。 |
| `index`（公开） | `number`；`由构造参数或初始化过程赋值` | 连续数组槽位，不是字节偏移。 |
| `_position`（内部） | `Vec2`；`由构造参数或初始化过程赋值` | 相对于 IMesh 的位置。（position 的内部状态）。 |
| `_rotation`（内部） | `number`；`由构造参数或初始化过程赋值` | 局部旋转弧度。（rotation 的内部状态）。 |
| `_scale`（内部） | `Vec2`；`由构造参数或初始化过程赋值` | 局部缩放。（scale 的内部状态）。 |
| `_style`（内部） | `Style`；`由构造参数或初始化过程赋值` | 本条记录的独立样式，不覆盖共享 Geometry / Material.style。（style 的内部状态）。 |
| `_enabled`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 是否绘制此槽位；关闭不删除记录或移动其他 index。（enabled 的内部状态）。 |
| `_version`（内部） | `number`；`0` | 任意原始值变化时递增；打包或扩容不会改变这个版本。（version 的内部状态）。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<RawSubscriber>()` | 状态由 `add`、`delete`、`dispose`、`notify` 读取或维护；完整处理见对应函数。 |
| `_disposed`（内部） | `boolean`；`false` | 状态由 `dispose`、`assertActive`、`notify` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(index: number, options: RawOptions = {})
```

创建对象并建立初始状态及依赖关联。

```ts
const raw = new Raw(index, options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 任意原始值变化时递增；打包或扩容不会改变这个版本。 |
| `get position(): Vec2`  | 相对于 IMesh 的位置。 |
| `set position(value: Vec2)`  | 相对于 IMesh 的位置。 |
| `get rotation(): number`  | 局部旋转弧度。 |
| `set rotation(value: number)`  | 局部旋转弧度。 |
| `get scale(): Vec2`  | 局部缩放。 |
| `set scale(value: Vec2)`  | 局部缩放。 |
| `get style(): Style`  | 本条记录的独立样式，不覆盖共享 Geometry / Material.style。 |
| `set style(value: Style)`  | 本条记录的独立样式，不覆盖共享 Geometry / Material.style。 |
| `get enabled(): boolean`  | 是否绘制此槽位；关闭不删除记录或移动其他 index。 |
| `set enabled(value: boolean)`  | 是否绘制此槽位；关闭不删除记录或移动其他 index。 |
| `add(subscriber: RawSubscriber): void`  | 关联消费者，使后续版本变化能通知该对象。 |
| `delete(subscriber: RawSubscriber): void`  | 解除消费者关联，不销毁被共享的对象。 |
| `onMathChange(source: VersionedMath, field: string): void`  | 接收数学对象的变化通知，更新对应字段的消费者版本。 |
| `onStyleChange(change: StyleChange): void`  | 接收共享样式的字段变化，通知当前对象的使用者。 |
| `dispose(): void`  | 解绑原始对象；不销毁共享 Vec2、Style 或 Texture。 |
| `assertActive(): void` （内部） | 防止已解绑的记录重新产生部分关联。 |
| `notify(change: RawChange): void` （内部） | 向当前订阅者发送变化通知，由接收方安排后续更新。 |

### 类型索引

`RawOptions`、`RawChange`、`RawSubscriber`

### 导出关系

```ts
export default Raws;
export { Raw };
export type { RawChange, RawOptions, RawSubscriber };
```

## 3. 其他源码文件

## 4. 注意事项

- Raw 只覆盖实例外观，不覆盖共享几何拓扑或材质固定管线状态；删除时解除订阅。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">实例 记录 编号 样式 冻结</keywords>
<keywords language="en">raw instance record id style frozen</keywords>
```
