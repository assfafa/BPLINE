# 纹理 Texture

目录：`bplinejs/src/scripts/Texture`

## 1. 文件结构与作用

图片、视频、Canvas、来源变更和实例纹理层。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 贴图对象 用于描述贴图资源本身 不直接绑定具体渲染后端的 GPU 纹理对象 |
| `Layers.ts` | 多层纹理的 CPU 引用集合，GPUTexture 仍只属于 Render。 |

## 2. index 入口、案例与类接口

### Texture

贴图对象
用于描述贴图资源本身
不直接绑定具体渲染后端的 GPU 纹理对象

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 全局唯一贴图 ID |
| `type`（公开） | `string`；`"Texture"` | 对象类型 |
| `_version`（内部） | `number`；`0` | 单一贴图版本，每个 Render 独立记录已上传版本。（version 的内部状态）。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<TextureSubscriber>()` | 状态由 `add`、`delete`、`updateVersion` 读取或维护；完整处理见对应函数。 |
| `_url`（内部） | `string \| null`；`null` | 贴图来源地址 |
| `_source`（内部） | `TextureSource \| null`；`null` | 贴图源数据 |
| `_loaded`（内部） | `boolean`；`false` | 是否已加载完成 |
| `_width`（内部） | `number`；`0` | 贴图宽度 |
| `_height`（内部） | `number`；`0` | 贴图高度 |
| `_videoChange`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 视频元数据或播放源变化时，原子同步贴图状态。 |

#### 构造与案例

```ts
constructor()
```

创建贴图对象

```ts
const texture = new Texture();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 单一贴图版本，每个 Render 独立记录已上传版本。 |
| `get url(): string \| null`  | 贴图来源地址；修改地址本身不会自动下载。 |
| `set url(value: string \| null)`  | 贴图来源地址；修改地址本身不会自动下载。 |
| `get source(): TextureSource \| null`  | 当前浏览器图片或视频源；视频帧在每次 Render 渲染时上传。 |
| `set source(value: TextureSource \| null)`  | 当前浏览器图片或视频源；调用方负责播放视频并持续渲染。 |
| `get loaded(): boolean`  | 当前图片或视频是否可上传。 |
| `set loaded(value: boolean)`  | 当前图片是否可上传。 |
| `get width(): number`  | 图片或视频宽度，单位为源像素。 |
| `set width(value: number)`  | 图片宽度，单位为源像素。 |
| `get height(): number`  | 图片或视频高度，单位为源像素。 |
| `set height(value: number)`  | 图片高度，单位为源像素。 |
| `add(subscriber: TextureSubscriber): void`  | 关联贴图消费者；多个分区可以共享同一 Texture。 |
| `delete(subscriber: TextureSubscriber): void`  | 解绑贴图消费者，不销毁图片源和任何 Render 的缓存。 |
| `updateVersion(): void`  | 原地修改静态图片像素后手动递增版本并通知；视频帧由 Render 自动上传。 |
| `setSource(source: TextureSource, url: string \| null = null): this`  | 设置图片或视频来源。 |
| `clearSource(): this`  | 清空贴图源数据 |
| `unbindVideoSource(): void` （内部） | 从旧视频解除监听，避免替换来源后继续接收旧视频事件。 |
| `syncVideoState(): void` （内部） | 同步当前视频的首帧状态和原始尺寸，仅在状态变化时通知消费者。 |
| `async load(url: string, sourceType: "auto" \| "image" \| "video" = "auto"): Promise<this>`  | 从地址加载图片或视频。常见视频扩展名自动识别；无扩展名或 blob 地址可指定 video。 加载视频只取得首帧，播放和持续渲染由调用方控制。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IsVideoUrl` | 从 URL 的媒体类型或文件扩展名识别常见视频资源。 |
| `LoadVideo` | 加载视频元素直至首帧可用于 GPU 上传，不负责开始播放。 |
| `LoadImage` | 加载图片元素 |
| `GetTextureWidth` | 获取贴图宽度 |
| `GetTextureHeight` | 获取贴图高度 |
| `IsVideoSource` | 判断来源是否为浏览器视频元素。 |
| `IsVideoReady` | 判断视频是否已有可复制的首帧。 |

```ts
IsVideoUrl("/movie.webm?version=1");
```

### 类型索引

`TextureSource`、`TextureSubscriber`、`TextureLike`、`TextureInput`

### 导出关系

```ts
export default Texture;
export { default as TextureLayers } from "./Layers";
export type { TextureResource } from "./Layers";
export type { TextureInput, TextureLike, TextureSource, TextureSubscriber };
```

## 3. 其他源码文件

### 文件：Layers.ts

### TextureLayers

多层纹理的 CPU 引用集合，GPUTexture 仍只属于 Render。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 数组资源 ID，与层内图片 ID 独立。 |
| `type`（公开） | `string`；`"TextureLayers"` | 对象类型。 |
| `_version`（内部） | `number`；`0` | 任一源图或层表变化时递增。（version 的内部状态）。 |
| `_layers`（内部） | `readonly (TextureInput \| undefined)[]`；`[]` | 有序层表；undefined 对应白色，不改变其他层的编号。（layers 的内部状态）。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 任一源图或层表变化时递增。 |
| `get layers(): readonly (TextureInput \| undefined)[]`  | 有序层表；undefined 对应白色，不改变其他层的编号。 |
| `set(layers: readonly (TextureInput \| undefined)[]): void`  | 原子替换层表；相同引用序列不更新，不保留废弃源的订阅。 |
| `onTextureChange(texture: TextureInput): void`  | 接收贴图来源变化，通知依赖的样式或图层缓存。 |
| `dispose(): void`  | 解除图片订阅，不销毁共享图片或 GPU 缓存。 |

### 类型索引

`TextureResource`

### 导出关系

```ts
export default TextureLayers;
export type { TextureResource };
```

## 4. 注意事项

- source DOM 可由用户控制播放和跳转；GPU 上传属于 Render。视频逐帧传图像，不把纹理内容更新误作管线结构变化。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">纹理 图片 视频 画布 来源 图层</keywords>
<keywords language="en">texture image video canvas source layers</keywords>
```
