# 后处理 PostProcess

目录：`bplinejs/src/scripts/PostProcess`

## 1. 文件结构与作用

有序 WgslPass 与 Bloom/Shadow/SMAA/FXAA 预置、离屏附件复用和 Canvas 呈现。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Bloom/` | 按 style.bloom 值分组，联合遮罩、阈值提取、可分离高斯及加色合成。 详见该目录的 agent.md。 |
| `Blur.ts` | 预乘颜色/Alpha 遮罩的可分离高斯；两个有界一维步骤复用同参数组的结果。 |
| `EffectGroups.ts` | 按实际效果值而非 Style 身份合并对象；同参数的一组只绘制一次遮罩。 |
| `FXAA/` | 单通道方向搜索与透明边缘友好的预乘混合。 详见该目录的 agent.md。 |
| `index.ts` | 有序后处理通道；共用一个 Render，内部复用离屏附件并保持输入画面不变。 |
| `PassResources.ts` | 单个通道的私有全屏三角形，复用现有材质传值、绑定缓存和资源回收路径。 |
| `PresetPass.ts` | 多步骤预置通道只保存 CPU 设置，GPU 附件由每个 PostProcess 独立维护。 |
| `PresetResources.ts` | 一个预置通道的渲染资源；按步骤及效果组复用，不在 Style 保存 GPU 状态。 |
| `Shadow/` | 按 style.shadow 值分组，生成偏移、扩散、内阴影及外阴影。 详见该目录的 agent.md。 |
| `SMAA/` | SMAA 1x Medium 的边缘、权重、邻域混合三步骤与官方 LUT。 详见该目录的 agent.md。 |
| `WgslPass/` | 有序 WgslPass 与 Bloom/Shadow/SMAA/FXAA 预置、离屏附件复用和 Canvas 呈现。 详见该目录的 agent.md。 |
| `wgsls/` | 有序 WgslPass 与 Bloom/Shadow/SMAA/FXAA 预置、离屏附件复用和 Canvas 呈现。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口

### PostProcess

有序后处理通道；共用一个 Render，内部复用离屏附件并保持输入画面不变。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"PostProcess"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `enabled`（公开） | `boolean`；`true` | 总开关；关闭时 process 返回输入，render 直接显示输入。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 共用 GPUDevice 的渲染器（构造参数引用）。 |
| `_passes`（内部） | `按初始化值推断`；`new Map<string, PostProcessPass>()` | 按执行顺序排列的键与通道快照，修改快照不会改动队列。（passes 的内部状态）。 |
| `_resources`（内部） | `按初始化值推断`；`new Map<string, PassResources>()` | 状态由 `add`、`delete`、`process`、`clear` 读取或维护；完整处理见对应函数。 |
| `_presets`（内部） | `按初始化值推断`；`new Map<string, PresetResources>()` | 状态由 `add`、`delete`、`process`、`clear` 读取或维护；完整处理见对应函数。 |
| `_pool`（内部） | `RenderTarget[]`；`[]` | 状态由 `clear`、`acquire`、`trimPool` 读取或维护；完整处理见对应函数。 |
| `_present`（内部） | `PassResources \| null`；`null` | 状态由 `render`、`clear` 读取或维护；完整处理见对应函数。 |
| `_output`（内部） | `RenderTarget \| null`；`null` | 最近 process 的结果，首次执行前为 null；内部结果只保证在下次执行或清理前有效。（output 的内部状态）。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `destroy`、`assertAlive` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(render: Render)
```

后处理通道管理器。

```ts
const post = new PostProcess(render);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get output(): RenderTarget \| null`  | 最近 process 的结果，首次执行前为 null；内部结果只保证在下次执行或清理前有效。 |
| `get passes(): readonly (readonly [string, PostProcessPass])[]`  | 按执行顺序排列的键与通道快照，修改快照不会改动队列。 |
| `add(key: string, pass: PostProcessPass): this`  | 当前管理器；同名替换保留原来的顺序。 |
| `get(key: string): PostProcessPass \| undefined`  | 通道或 undefined。 |
| `move(key: string, index: number): this`  | 当前管理器；名称或位置无效时抛出错误。 |
| `delete(key: string): boolean`  | 是否移除了通道；不销毁用户 WgslPass 或输入纹理。 |
| `process(input: RenderTarget): RenderTarget`  | 按顺序处理已经绘制的输入；不会自动重新渲染输入的场景，也不更新 Canvas。 |
| `render(input: RenderTarget): void`  | 无返回值，执行全部通道并将结果铺满 Canvas。 |
| `clear(): void`  | 无返回值，移除所有通道并释放内部结果，保留外部输入和 WgslPass 配置。 |
| `destroy(): void`  | 无返回值，释放内部资源并禁止复用；不销毁 Render 和用户输入。 |
| `acquire(current: RenderTarget, protectedTargets: ReadonlySet<RenderTarget>, used: ReadonlySet<RenderTarget>, width: number, height: number, format: RenderTargetFormat): RenderTarget` （内部） | 不与任何读取输入冲突的可复用目标。 |
| `trimPool(used: ReadonlySet<RenderTarget>, protectedTargets: ReadonlySet<RenderTarget>): void` （内部） | 无返回值，回收关闭通道或 resize 后不再需要的附件。 |
| `assertAlive(): void` （内部） | 无返回值，销毁后操作明确报错。 |

### 类型索引

`PostProcessPass`

### 导出关系

```ts
export type { PostProcessPass };
export default PostProcess;
export { WgslPass };
export type { WgslPassRaw } from "./WgslPass";
export { default as Bloom } from "./Bloom";
export { default as Shadow } from "./Shadow";
export { default as SMAA } from "./SMAA";
export { default as FXAA } from "./FXAA";
```

## 3. 其他源码文件

### 文件：Blur.ts

### Blur

预乘颜色/Alpha 遮罩的可分离高斯；两个有界一维步骤复用同参数组的结果。

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static apply(resources: PresetResources, key: string, input: RenderTarget, radius: number, spread: number = 0): RenderTarget`  | 模糊后的数据目标，零半径透传。 |

### 导出关系

```ts
export default Blur;
```

### 文件：EffectGroups.ts

### EffectGroups

按实际效果值而非 Style 身份合并对象；同参数的一组只绘制一次遮罩。

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static collect<T extends keyof EffectData>(scene: Scene, area: T): EffectGroup<T>[]`  | 稳定场景次序的效果组。 |
| `static append<T extends keyof EffectData>(groups: Map<string, EffectGroup<T>>, settings: EffectData[T], id: number, instance: number \| null): void` （内部） | 无返回值，按值分组。 |

### 类型索引

`EffectGroup`

### 导出关系

```ts
export default EffectGroups;
export type { EffectGroup };
```

### 文件：PassResources.ts

### PassResources

单个通道的私有全屏三角形，复用现有材质传值、绑定缓存和资源回收路径。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（公开） | `按初始化值推断`；`new Scene()` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `camera`（公开） | `按初始化值推断`；`new Camera(1, 1)` | 状态由 `prepare`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_style`（内部） | `按初始化值推断`；`new Style()` | 状态由 `constructor`、`prepare`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_resolution`（内部） | `按初始化值推断`；`new Vec2(1, 1)` | 状态由 `prepare` 读取或维护；完整处理见对应函数。 |
| `_material`（内部） | `按初始化值推断`；`new WGSLMaterial(this._style)` | 状态由 `constructor`、`prepare`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_geometry`（内部） | `Base2D`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_mesh`（内部） | `Mesh`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_valuesVersion`（内部） | `number`；`-1` | 状态由 `prepare` 读取或维护；完整处理见对应函数。 |
| `_fragment`（内部） | `string \| null`；`null` | 状态由 `prepare` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor()
```

独立的 CPU 全屏绘制资源。

```ts
const resources = new PassResources();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `prepare(pass: WgslPass \| null, input: RenderTarget, width: number, height: number, premultiply: boolean = false): void`  | 无返回值，仅同步 CPU 状态。 |
| `destroy(render: Render): void`  | 无返回值，清除私有缓存与订阅，不销毁用户输入。 |

### 导出关系

```ts
export default PassResources;
```

### 文件：PresetPass.ts

### PresetPass

多步骤预置通道只保存 CPU 设置，GPU 附件由每个 PostProcess 独立维护。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `type`（公开） | `string`；`"PresetPass"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `enabled`（公开） | `boolean`；`true` | 通道总开关；对象自己的效果配置放在 Style。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget`  | 处理后的目标。 |

### 导出关系

```ts
export default PresetPass;
```

### 文件：PresetResources.ts

### PresetResources

一个预置通道的渲染资源；按步骤及效果组复用，不在 Style 保存 GPU 状态。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 所属渲染器（构造参数引用）。 |
| `_targets`（内部） | `按初始化值推断`；`new Map<string, RenderTarget>()` | 状态由 `end`、`target` 读取或维护；完整处理见对应函数。 |
| `_steps`（内部） | `按初始化值推断`；`new Map<string, { pass: WgslPass; resources: PassResources }>()` | 状态由 `step`、`draw`、`end` 读取或维护；完整处理见对应函数。 |
| `_used`（内部） | `按初始化值推断`；`new Set<string>()` | 状态由 `begin`、`step`、`end`、`target` 读取或维护；完整处理见对应函数。 |
| `_textures`（内部） | `按初始化值推断`；`new Set<Texture>()` | 状态由 `ownTexture`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_protected`（内部） | `ReadonlySet<RenderTarget>`；`new Set()` | 状态由 `begin`、`end`、`target` 读取或维护；完整处理见对应函数。 |
| `_retired`（内部） | `按初始化值推断`；`new Set<RenderTarget>()` | 状态由 `end`、`target` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(render: Render)
```

延迟分配的资源容器。

```ts
const resources = new PresetResources(render);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `begin(protectedTargets: ReadonlySet<RenderTarget> = new Set()): void`  | 无返回值，开始记录本轮仍使用的步骤。 |
| `step(key: string, shader: string): WgslPass`  | 可更新传值的内部 WgslPass。 |
| `draw(key: string, input: RenderTarget, data: boolean = false, format: RenderTargetFormat = input.format): RenderTarget`  | 独立的可采样结果。 |
| `mask(key: string, source: RenderTarget, selection: DrawSelection, occlude: boolean = false): RenderTarget`  | 透明背景的组遮罩；不改变场景层级或材质。 |
| `ownTexture(texture: Texture): void`  | 无返回值，清理时释放本 Render 的纹理缓存。 |
| `end(): void`  | 无返回值，回收本帧消失的分组，避免反复调参数累积附件。 |
| `destroy(): void`  | 无返回值，释放私有附件、材质及 LUT。 |
| `target(key: string, width: number, height: number, format: RenderTargetFormat, data: boolean): RenderTarget` （内部） | 可复用附件。 |

### 导出关系

```ts
export default PresetResources;
```

## 4. 注意事项

- 先 render.renderPass(input)，再 post.process(input) 或 post.render(input)。Bloom/Shadow 按 Style 的完整参数值合批，参数不放到 PostProcess。内部结果只在下次执行或清理前有效。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- Bloom 遮罩保留其他物体的遮挡并支持半透明衰减；各组光晕按亮度保留最强的一份完整颜色，最后合成一次。Shadow 的轮廓遮罩维持原语义，不跟随 Bloom 改成可见遮罩。
- HDR 开启时 Bloom 合成和普通 WgslPass 颜色输出使用 rgba16float，后续颜色通道继承当前输入格式，不能重新套用最初 SDR 来源格式。SMAA 边缘/权重保留 rgba8unorm 数据附件；普通材质与原始 RenderTarget 不被隐式修改。
- Bloom/Shadow 的对象参数只存于 `style.bloom` / `style.shadow`，两者默认关闭。按完整参数值合并独立 Style；同组共享一次联合遮罩、模糊和合成。IMesh 按槽位效果快照分组，全组同值保留实例批量绘制。
- 外阴影另绘制一次所有组共用的场景覆盖图，使阴影位于物体后方、不透明背景前方；内阴影只作用于本组轮廓。半径、扩散和位移使用 CSS 像素，屏幕 Y 正方向向上。
- 效果遮罩来自原始 RenderTarget 的 Scene/Camera，建议 Shadow → Bloom → SMAA（或 FXAA）。前置自定义通道若扭曲画面坐标，不能自动同步原场景遮罩。SMAA/FXAA 通常二选一。
- 中间附件按效果组复用，失效组及时回收；SMAA 权重和模糊中间值使用 data 目标，不进行 Alpha 颜色转换。
- `new PostProcess(render)` 不创建 Render 或 GPUDevice；`render.renderPass(input)` 由用户先执行，处理链不会递归重绘来源。`process(input)` 返回目标，`render(input)` 处理后铺满 Canvas。
- `add/get/move/delete/clear` 维护有序通道。总开关与 WgslPass.enabled 都支持透传；resolutionScale 相对最初输入 viewport，默认 1。结果池随 resize 更新并释放不用的附件。
- WgslPass.raw.fragmentShader 是完整 `@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f`。内置 `sampleInput(uv)`、`inputResolution()`、`resolution()`、`texelSize()`；UV 原点左下，使用非预乘 RGBA，空源码透传。
- raw.value 与自定义材质同样支持 number、Vec2、Mat3、Float32Array、Texture、RenderTarget；WGSL 使用 value_名称。数组原地修改调用 raw.touchValue。postResolution 为内部分辨率字段，禁止作为用户名称。
- 额外 RenderTarget 输入保留到本轮通道结束，池子不会覆盖正在读取的目标。process 返回的内部结果可供材质即时使用，但不保证跨下一次执行/clear 的身份和内容；clear/destroy 只清理内部资源，不销毁外部输入与 WgslPass 配置。
- 当前每个步骤复用一个全屏三角形及现有 WGSLMaterial 缓存，附带离屏方向/Alpha 转换。Canvas 最终呈现按 alphaMode 处理，不能让用户效果自行重复预乘颜色。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">后处理 通道 发光 阴影 抗锯齿 合批</keywords>
<keywords language="en">postprocess pass bloom shadow smaa fxaa batching</keywords>
```
