# 颜色 Color

目录：`bplinejs/src/scripts/Color`

## 1. 文件结构与作用

归一化 RGBA、十六进制转换和颜色订阅。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 归一化 RGBA 颜色；所有修改入口都会在值实际变化后通知订阅者。 |

## 2. index 入口、案例与类接口

### Color

归一化 RGBA 颜色；所有修改入口都会在值实际变化后通知订阅者。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_data`（内部） | `number[]`；`[1, 1, 1, 1]` | 状态由 `r`、`g`、`b`、`a` 读取或维护；完整处理见对应函数。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Map<ColorSubscriber, Set<string>>()` | 状态由 `setRGBA`、`add`、`delete` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(hex: string | number = "#ffffff")
```

创建颜色，默认不透明白色；数字十六进制按 RRGGBB 解释。

```ts
const color = new Color(hex);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get r(): number`  | 获取红分量，范围 0 到 1。 |
| `set r(value: number)`  | 设置红分量，有限值会钳制到 0 到 1。 |
| `get g(): number`  | 获取绿分量，范围 0 到 1。 |
| `set g(value: number)`  | 设置绿分量，有限值会钳制到 0 到 1。 |
| `get b(): number`  | 获取蓝分量，范围 0 到 1。 |
| `set b(value: number)`  | 设置蓝分量，有限值会钳制到 0 到 1。 |
| `get a(): number`  | 获取透明度分量，范围 0 到 1。 |
| `set a(value: number)`  | 设置透明度分量，有限值会钳制到 0 到 1。 |
| `setRGB(r: number, g: number, b: number): this`  | 批量设置 RGB，保留当前 alpha，只通知一次。 |
| `setRGBA(r: number, g: number, b: number, a: number = 1): this`  | 批量设置 RGBA，验证成功后统一提交，只通知一次。 |
| `setHex(hex: string \| number): this`  | 设置十六进制颜色；没有 alpha 的格式使用不透明值。 |
| `toHex(alpha: boolean = false): string`  | 转为十六进制文本，不做额外颜色空间变换。 |
| `writeTo(target: Float32Array<ArrayBuffer>, offset: number = 0): Float32Array<ArrayBuffer>`  | 将 RGBA 写入调用者数组，不暴露内部可变数据。 |
| `copy(color: Color): this`  | 复制颜色数值，不共享订阅者。 |
| `clone(): Color`  | 创建没有订阅者的独立颜色副本。 |
| `add(subscriber: ColorSubscriber, field: string = "color"): void`  | 登记订阅关系，同一对象的不同颜色字段分别计数。 |
| `delete(subscriber: ColorSubscriber, field?: string): void`  | 解除单个字段订阅；省略字段时解除该对象全部订阅。 |

### 类型索引

`ColorSubscriber`

### 导出关系

```ts
export default Color;
export type { ColorSubscriber };
```

## 3. 其他源码文件

## 4. 注意事项

- 修改颜色必须通过 setter 或方法提交；订阅按消费者和字段区分。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">颜色 色值 透明度 订阅</keywords>
<keywords language="en">color rgba hex opacity subscription</keywords>
```
