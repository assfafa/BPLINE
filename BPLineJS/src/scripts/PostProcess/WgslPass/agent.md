# 后处理 PostProcess

目录：`bplinejs/src/scripts/PostProcess/WgslPass`

## 1. 文件结构与作用

有序 WgslPass 与 Bloom/Shadow/SMAA/FXAA 预置、离屏附件复用和 Canvas 呈现。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 一个全屏后处理步骤；只保存 CPU 配置，GPU 资源由 PostProcess 使用的 Render 管理。；接口与材质 raw.value 一致；postResolution 为系统预留字段。 |

## 2. index 入口、案例与类接口

### WgslPass

一个全屏后处理步骤；只保存 CPU 配置，GPU 资源由 PostProcess 使用的 Render 管理。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 通道身份，用于编辑器或外部列表。 |
| `type`（公开） | `string`；`"WgslPass"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `enabled`（公开） | `boolean`；`true` | 关闭时跳过该步骤，直接传递上一步结果。 |
| `raw`（公开） | `按初始化值推断`；`new WgslPassRaw()` | 完整片元 WGSL 和具名传值；默认片元原样传递输入。 |
| `_resolutionScale`（内部） | `number`；`1` | 相对于原始输入 viewport 的尺寸比例，默认 1。（resolutionScale 的内部状态）。 |

#### 构造与案例

```ts
constructor(fragmentShader: string = "")
```

后处理步骤。

```ts
const pass = new WgslPass();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get resolutionScale(): number`  | 相对于原始输入 viewport 的尺寸比例，默认 1。 |
| `set resolutionScale(value: number)`  | 无返回值。 |
### WgslPassRaw

接口与材质 raw.value 一致；postResolution 为系统预留字段。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `fragmentShader`（公开） | `string`；`""` | 完整 |
| `values`（公开） | `按初始化值推断`；`new ShaderValues(ValuesChanged)` | 状态由 `value`、`touchValue` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get value(): ShaderValueRecord`  | 支持 number、Vec2、Mat3、Float32Array、Texture、RenderTarget 的代理对象。 |
| `set value(value: ShaderValueRecord)`  | 无返回值。 |
| `touchValue(name: string): void`  | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ValuesChanged` | 无返回值；执行时读取 ShaderValues 的版本，不创建 GPU 资源。 |

```ts
ValuesChanged(false, false);
```

### 导出关系

```ts
export default WgslPass;
export { WgslPassRaw };
```

## 3. 其他源码文件

## 4. 注意事项

- 先 render.renderPass(input)，再 post.process(input) 或 post.render(input)。Bloom/Shadow 按 Style 的完整参数值合批，参数不放到 PostProcess。内部结果只在下次执行或清理前有效。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">后处理 通道 发光 阴影 抗锯齿 合批</keywords>
<keywords language="en">postprocess pass bloom shadow smaa fxaa batching</keywords>
```
