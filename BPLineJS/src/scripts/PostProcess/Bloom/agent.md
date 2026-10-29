# 对象发光 Bloom

目录：`bplinejs/src/scripts/PostProcess/Bloom`

## 1. 文件结构与作用

按 style.bloom 值分组，联合遮罩、阈值提取、可分离高斯及加色合成。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `composite.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `extract.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `index.ts` | 对象发光；同值对象共享可见遮罩和模糊，各组按亮度保留最强的完整发光颜色。 |
| `strongest.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |

## 2. index 入口、案例与类接口

### Bloom

对象发光；同值对象共享可见遮罩和模糊，各组按亮度保留最强的完整发光颜色。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Bloom"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget`  | 加入发光的画面，无启用对象时透传。 |

### 导出关系

```ts
export default Bloom;
```

## 3. 其他源码文件

## 4. 注意事项

- 颜色、强度、阈值、半径和透明度来自 style.bloom；关闭的对象不参加。半径是 CSS px，SDF 和纹理 Alpha 来自原材质。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- 遮罩先保留场景可见性：非本组物体参与遮挡，半透明按实际覆盖率衰减，圆角、贴图、自定义 Shader 及 depth/order 沿用正常渲染规则。不能直接把非发光物体跳过，也不能让其黑色 Alpha 被 threshold=0 当成发光来源。
- 各组提取和模糊后，先乘 intensity/opacity，按预乘 RGB 的亮度比较，保留最强组的完整 RGBA；同亮度保留先前结果。禁止逐组累加或逐 RGB 通道取 max，以免混出白色。最后只与来源画面合成一次。同参数仍合组渲染。
- 使用 Render.hdrEnabled 决定合成模式：HDR 输出 rgba16float 并保留超过 1 的 RGB，SDR 限制 RGB 到 0–1；Alpha 始终是覆盖率。不开启整体曝光倍增，不修改普通材质颜色。相同参数的对象继续合批。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">发光 高斯 遮罩 分组</keywords>
<keywords language="en">bloom gaussian mask batching</keywords>
```
