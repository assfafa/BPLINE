# 材质 Material

目录：`bplinejs/src/scripts/Material`

## 1. 文件结构与作用

标准材质、自定义 WGSL、具名传值和管线身份。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `baseMaterial.ts` | 矩形、多边形与正多边形/圆环材质；按几何类型选择 WGSL，显示参数来自 Style。 |
| `CloneMaterial.ts` | 复制自定义材质的具名值；GPU 纹理保留共享资源引用。；保留材质类型、着色器、固定管线状态及具名值，绑定指定的独立样式。 |
| `CompositeMaterial.ts` | 将三个颜色函数体合入形状的片元模板，顶点变换保持基础材质行为。；三个 Shader 字段均为函数体，返回颜色乘数；缺省时为 vec4f(1.0)。 |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `Material.ts` | 材质只持有 Shader、固定管线状态及 Style 引用，不重复保存显示参数。 |
| `ShaderValues.ts` | 为自定义材质维护稳定的 WGSL 绑定顺序和可替换的具名值。 |
| `WGSLMaterial.ts` | 允许完整替换顶点和片元阶段，同时沿用现有 Mesh、几何和资源绑定约定。；完整 WGSL 阶段源码和具名传值接口。 |
| `wgsls/` | 标准图元和原生线框的顶点、片元阶段。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export { default as BaseMaterial } from "./baseMaterial";
export type { BaseMaterialLike } from "./baseMaterial";
export { default as CompositeMaterial } from "./CompositeMaterial";
export type { CompositeMaterialLike } from "./CompositeMaterial";
export { default as Material } from "./Material";
export type {
    BorderAlign,
    MaterialBuffersLike,
    MaterialChange,
    MaterialChangeKind,
    MaterialLike,
    MaterialSubscriber,
    PixelAligned,
    ShadersLike,
} from "./Material";
export type { ShaderValue, ShaderValueRecord } from "./ShaderValues";
export { default as WGSLMaterial } from "./WGSLMaterial";
export type { WGSLMaterialLike } from "./WGSLMaterial";
```

## 3. 其他源码文件

### 文件：baseMaterial.ts

### BaseMaterial

矩形、多边形与正多边形/圆环材质；按几何类型选择 WGSL，显示参数来自 Style。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `按初始化值推断`；`"BaseMaterial" as const` | 对象类型。 |

#### 构造与案例

```ts
constructor(style?: Style)
```

创建对象并建立初始状态及依赖关联。

```ts
const baseMaterial = new BaseMaterial(style);
```

### 类型索引

`BaseMaterialLike`

### 导出关系

```ts
export default BaseMaterial;
export type { BaseMaterialLike };
```

### 文件：CloneMaterial.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CloneValues` | 复制自定义材质的具名值；GPU 纹理保留共享资源引用。 |
| `CloneMaterial` | 保留材质类型、着色器、固定管线状态及具名值，绑定指定的独立样式。 |

```ts
const copied = CloneValues(material.raw.value);
```

### 导出关系

```ts
export default CloneMaterial;
```

### 文件：CompositeMaterial.ts

### CompositeMaterial

将三个颜色函数体合入形状的片元模板，顶点变换保持基础材质行为。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `按初始化值推断`；`"CompositeMaterial" as const` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `raw`（公开） | `CompositeMaterialRaw`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`refreshShaders` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(style?: Style)
```

创建可逐分区定制片元颜色的材质。

```ts
const material = new CompositeMaterial(style);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `refreshShaders(): void` （内部） | 重新组装三个形状模板；数据变化不调用此方法。 |
### CompositeMaterialRaw

三个 Shader 字段均为函数体，返回颜色乘数；缺省时为 vec4f(1.0)。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_solidShader`（内部） | `string`；`""` | 实体面函数体。（solidShader 的内部状态）。 |
| `_edgeShader`（内部） | `string`；`""` | 边框函数体。（edgeShader 的内部状态）。 |
| `_pointShader`（内部） | `string`；`""` | 关键点函数体。（pointShader 的内部状态）。 |
| `_values`（内部） | `ShaderValues`；`由构造参数或初始化过程赋值` | 共用传值容器（构造参数引用）。 |
| `_onShaderChange`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 函数体变化通知（构造参数引用）。 |

#### 构造与案例

```ts
constructor(values: ShaderValues, onShaderChange: () => void)
```

创建可修改的 Shader 与具名传值接口。

```ts
const raw = new CompositeMaterialRaw(values, onShaderChange);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get solidShader(): string`  | 实体面函数体。 |
| `set solidShader(source: string)`  | 实体面函数体。 |
| `get edgeShader(): string`  | 边框函数体。 |
| `set edgeShader(source: string)`  | 边框函数体。 |
| `get pointShader(): string`  | 关键点函数体。 |
| `set pointShader(source: string)`  | 关键点函数体。 |
| `get value(): ShaderValueRecord`  | 支持 number、Vec2、Mat3、Float32Array 和多个 Texture 的具名值。 |
| `set value(value: ShaderValueRecord)`  | 一次替换全部具名值。 |
| `touchValue(name: string): void`  | 原地修改 Float32Array 后安排下一帧上传。 |
| `setShader(area: "solid" \| "edge" \| "point", source: string): void` （内部） | 保存一个函数体并使合成的片元源码失效。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Compose` | 替换基础片元源码中的三个默认白色函数。 |

```ts
Compose(template, declarations, solid, edge, point);
```

### 类型索引

`CompositeMaterialLike`

### 导出关系

```ts
export default CompositeMaterial;
export type { CompositeMaterialLike };
```

### 文件：Material.ts

### Material

材质只持有 Shader、固定管线状态及 Style 引用，不重复保存显示参数。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 全局材质 ID。 |
| `type`（公开） | `string`；`由构造参数或初始化过程赋值` | 材质类型。 |
| `_version`（内部） | `number`；`0` | 单一材质版本。（version 的内部状态）。 |
| `_key`（内部） | `string`；`""` | 固定管线状态与 Shader 对应的缓存键。（key 的内部状态）。 |
| `_pipelineKeys`（内部） | `按初始化值推断`；`new Map<string, string>()` | 缓存完整几何管线键，避免每个 Mesh 每帧拼接和散列 Shader 长字符串。 |
| `_style`（内部） | `Style`；`由构造参数或初始化过程赋值` | 当前共享样式。（style 的内部状态）。 |
| `_disposed`（内部） | `boolean`；`false` | 状态由 `style`、`onStyleChange`、`dispose`、`add` 读取或维护；完整处理见对应函数。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<MaterialSubscriber>()` | 状态由 `dispose`、`add`、`delete`、`updateVersion` 读取或维护；完整处理见对应函数。 |
| `_transparent`（内部） | `boolean`；`false` | 所有分区共用的透明混合状态。（transparent 的内部状态）。 |
| `_depthTest`（内部） | `boolean`；`false` | 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。（depthTest 的内部状态）。 |
| `_depthWrite`（内部） | `boolean`；`false` | 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。（depthWrite 的内部状态）。 |
| `_cullMode`（内部） | `GPUCullMode`；`"back"` | 所有三角面共用的剔除状态。（cullMode 的内部状态）。 |
| `_geometryTypes`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `addGeometryType` 读取或维护；完整处理见对应函数。 |
| `_shaders`（内部） | `ShadersLike`；`{}` | 状态由 `rectVertexShader`、`rectFragmentShader`、`polyVertexShader`、`polyFragmentShader` 读取或维护；完整处理见对应函数。 |
| `_values`（公开） | `ShaderValues \| undefined`；`由构造参数或初始化过程赋值` | 自定义材质可提供的具名 GPU 传值。（values 的内部状态）。 |
| `_customShaderKey`（公开） | `string`；`""` | 状态由 `setCustomShaderKey`、`updateKey` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(style: Style = new Style())
```

创建对象并建立初始状态及依赖关联。

```ts
// Material 为抽象类，通过 new BaseMaterial(style) 创建标准材质。
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get style(): Style`  | 当前共享样式。 |
| `set style(value: Style)`  | 当前共享样式。 |
| `onStyleChange(change: StyleChange): void`  | 接收共享样式的字段变化，通知当前对象的使用者。 |
| `dispose(): void`  | 最终停止使用时解绑 Style，不销毁共享贴图或 GPU 缓存。 |
| `add(subscriber: MaterialSubscriber): void`  | 关联使用当前材质的消费者，Set 自动去重。 |
| `delete(subscriber: MaterialSubscriber): void`  | 解绑消费者，不销毁共享 Style、Texture 或 GPU 缓存。 |
| `get version(): number`  | 单一材质版本。 |
| `get key(): string`  | 固定管线状态与 Shader 对应的缓存键。 |
| `get values(): ShaderValues \| undefined`  | 自定义材质可提供的具名 GPU 传值。 |
| `setCustomShaderKey(key: string): void`  | 更新完整自定义着色器的源码标识。 |
| `getShaderSource(geometryType: string): { vertex: string \| undefined; fragment: string \| undefined }`  | 按几何类型选择完整着色器源码。 |
| `updateVersion(kind: MaterialChangeKind = "all"): void`  | 递增单一版本并通知消费者，颜色变化不会改变 key。 |
| `get transparent(): boolean`  | 所有分区共用的透明混合状态。 |
| `set transparent(value: boolean)`  | 所有分区共用的透明混合状态。 |
| `get depthTest(): boolean`  | 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。 |
| `set depthTest(value: boolean)`  | 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。 |
| `get depthWrite(): boolean`  | 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。 |
| `set depthWrite(value: boolean)`  | 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。 |
| `get cullMode(): GPUCullMode`  | 所有三角面共用的剔除状态。 |
| `set cullMode(value: GPUCullMode)`  | 所有三角面共用的剔除状态。 |
| `addGeometryType(type: string): void`  | 追加已使用的几何类型标记；Rect2D 对应 rect，重复绑定不递增版本。 |
| `getPipelineKey(type: string): string`  | 获取指定几何类型的管线缓存键。 材质 key 描述共享状态，类型后缀区分同一材质的不同几何模板。 |
| `set rectVertexShader(vertexShader: string \| undefined)`  | 设置矩形合并三角面顶点着色器源码。 |
| `get rectVertexShader(): string \| undefined`  | 获取矩形合并三角面顶点着色器源码。 |
| `set rectFragmentShader(fragmentShader: string \| undefined)`  | 设置矩形合并三角面片元着色器源码。 |
| `get rectFragmentShader(): string \| undefined`  | 获取矩形合并三角面片元着色器源码。 |
| `get polyVertexShader(): string \| undefined`  | 多边形合并三角面顶点 Shader。 |
| `set polyVertexShader(value: string \| undefined)`  | 多边形合并三角面顶点 Shader。 |
| `get polyFragmentShader(): string \| undefined`  | 多边形填充、边框和点型片段 Shader。 |
| `set polyFragmentShader(value: string \| undefined)`  | 多边形填充、边框和点型片段 Shader。 |
| `get ngonVertexShader(): string \| undefined`  | 正多边形/圆环的合并三角面顶点 WGSL。 |
| `set ngonVertexShader(value: string \| undefined)`  | 正多边形/圆环的合并三角面顶点 WGSL。 |
| `get ngonFragmentShader(): string \| undefined`  | 正多边形/圆环的填充、边框和点型片段 WGSL。 |
| `set ngonFragmentShader(value: string \| undefined)`  | 正多边形/圆环的填充、边框和点型片段 WGSL。 |
| `updateKey(): void`  | 原生线开关决定是否需要附加 line-list 管线，其余分区通过 Uniform 控制。 |

### 类型索引

`MaterialBuffersLike`、`ShadersLike`、`MaterialChangeKind`、`MaterialChange`、`MaterialSubscriber`、`MaterialLike`

### 导出关系

```ts
export default Material;
export type {
    BorderAlign,
    MaterialBuffersLike,
    MaterialChange,
    MaterialChangeKind,
    MaterialLike,
    MaterialSubscriber,
    PixelAligned,
    ShadersLike,
};
```

### 文件：ShaderValues.ts

### ShaderValues

为自定义材质维护稳定的 WGSL 绑定顺序和可替换的具名值。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_record`（内部） | `ShaderValueRecord`；`{}` | 状态由 `value`、`entries`、`textures`、`set` 读取或维护；完整处理见对应函数。 |
| `_proxy`（内部） | `ShaderValueRecord`；`new Proxy(this._record, { set: this.setProxyValue.bind(this), deleteProperty: this.deleteProxyValue.bind(this), })` | 状态由 `value` 读取或维护；完整处理见对应函数。 |
| `_onChange`（内部） | `(schemaChanged: boolean, textureChanged: boolean) => void`；`由构造参数或初始化过程赋值` | 传值类型或资源引用变化通知（构造参数引用）。 |
| `_version`（内部） | `number`；`0` | 当前数值修订号。（version 的内部状态）。 |
| `_schemaKey`（内部） | `string`；`"[]"` | 字段名和类型组成的稳定布局键，不包含数值及 Texture 身份。（schemaKey 的内部状态）。 |

#### 构造与案例

```ts
constructor(onChange: (schemaChanged: boolean, textureChanged: boolean) => void)
```

创建传值容器；属性赋值会通知材质，原地修改 Float32Array 后需调用 touch。

```ts
const values = new ShaderValues(onChange);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `setProxyValue(_target: ShaderValueRecord, name: string \| symbol, value: unknown): boolean` （内部） | 是否接受代理写入。 |
| `deleteProxyValue(_target: ShaderValueRecord, name: string \| symbol): boolean` （内部） | 是否接受代理删除。 |
| `get value(): ShaderValueRecord`  | 可直接按名字替换值的对象。 |
| `set value(next: ShaderValueRecord)`  | 整体替换具名值，字段类型不变时保留 Pipeline 布局。 |
| `get version(): number`  | 当前数值修订号。 |
| `get schemaKey(): string`  | 字段名和类型组成的稳定布局键，不包含数值及 Texture 身份。 |
| `get entries(): ShaderValueEntry[]`  | 按字段名排序后的绑定列表。 |
| `get textures(): Texture[]`  | 自定义贴图列表，供 Scene 收集和按引用销毁。 |
| `get declarations(): string`  | 生成可以直接在 WGSL 中使用的 value_字段名声明。 |
| `set(name: string, value: unknown): void`  | 按名字替换一个值；同名同类型 Texture 只改变绑定引用。 |
| `delete(name: string): void`  | 删除字段并重建布局。 |
| `touch(name: string): void`  | 原地修改 Float32Array 后通知上传；Vec2 和 Mat3 可直接使用自身版本。 |
| `getBufferData(entry: ShaderValueEntry): Float32Array<ArrayBuffer>`  | 获取一个值对应的上传数组。 |
| `getKind(value: ShaderValue): ShaderValueKind` （内部） | 计算字段类型，Texture 与数值使用不同绑定资源。 |
| `validate(name: string, value: unknown): void` （内部） | 校验字段名称与支持的数据类型。 |
| `commit(previousSchema: string, previousTextures: Texture[]): void` （内部） | 提交布局与资源变化，保留同名同类型值的 Pipeline。 |

### 类型索引

`ShaderValue`、`ShaderValueKind`、`ShaderValueRecord`、`ShaderValueEntry`

### 导出关系

```ts
export default ShaderValues;
export type { ShaderValue, ShaderValueEntry, ShaderValueKind, ShaderValueRecord };
```

### 文件：WGSLMaterial.ts

### WGSLMaterial

允许完整替换顶点和片元阶段，同时沿用现有 Mesh、几何和资源绑定约定。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `按初始化值推断`；`"WGSLMaterial" as const` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `raw`（公开） | `WGSLMaterialRaw`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`getShaderSource` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(style?: Style)
```

创建完整 WGSL 材质。

```ts
const material = new WGSLMaterial(style);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override getShaderSource(geometryType: string): { vertex: string \| undefined; fragment: string \| undefined }`  | 为一个几何类型挑选自定义阶段或有效的默认阶段。 |
### WGSLMaterialRaw

完整 WGSL 阶段源码和具名传值接口。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_vertexShader`（内部） | `string`；`""` | 完整顶点 WGSL，空字符串使用当前几何类型的基础顶点变换。（vertexShader 的内部状态）。 |
| `_fragmentShader`（内部） | `string`；`""` | 完整片元 WGSL，空字符串返回白色。（fragmentShader 的内部状态）。 |
| `_values`（内部） | `ShaderValues`；`由构造参数或初始化过程赋值` | 具名传值容器（构造参数引用）。 |
| `_onShaderChange`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 阶段源码变化通知（构造参数引用）。 |

#### 构造与案例

```ts
constructor(values: ShaderValues, onShaderChange: () => void)
```

创建原始 WGSL 接口。

```ts
const raw = new WGSLMaterialRaw(values, onShaderChange);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get vertexShader(): string`  | 完整顶点 WGSL，空字符串使用当前几何类型的基础顶点变换。 |
| `set vertexShader(source: string)`  | 完整顶点 WGSL。 |
| `get fragmentShader(): string`  | 完整片元 WGSL，空字符串返回白色。 |
| `set fragmentShader(source: string)`  | 完整片元 WGSL。 |
| `get value(): ShaderValueRecord`  | 可直接按名称更新的 GPU 传值。 |
| `set value(value: ShaderValueRecord)`  | 整体替换具名传值。 |
| `touchValue(name: string): void`  | 原地修改数组后标记其 GPU 数据需要更新。 |

### 类型索引

`WGSLMaterialLike`

### 导出关系

```ts
export default WGSLMaterial;
export type { WGSLMaterialLike };
```

## 4. 注意事项

- GPU 资源属于 Render；材质 key 与数值版本分开。纹理替换更新绑定，数值更新不能无故重建管线。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">材质 着色器 管线 纹理 绑定 传值</keywords>
<keywords language="en">material shader pipeline texture binding values</keywords>
```
