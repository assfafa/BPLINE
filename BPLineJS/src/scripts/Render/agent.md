# 渲染 Render

目录：`bplinejs/src/scripts/Render`

## 1. 文件结构与作用

资源准备、GPU 上传、绘制提交、HDR 输出和开发诊断。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `BoxManager.ts` | 合并连续相机变化的 box 查询；等待期间保守绘制，避免新进入视口的实体被旧结果裁掉。 |
| `BufferManager.ts` | 管理当前 Render 对应的 Camera、Material、Mesh 和 Geometry GPUBuffer。 |
| `CanvasOutput.ts` | Canvas 的 SDR/HDR 配置与系统状态监听；不改动普通材质颜色或离屏来源。 |
| `DepthManager.ts` | 深度纹理和每个 Mesh 的绘制参数均属于当前 Render，不写入共享 CPU 样式。 |
| `DestroyManager.ts` | 统一负责当前 Render 的 GPU 资源销毁与无引用缓存回收。 |
| `DevelopmentValidator.ts` | 开发模式 GPUBuffer 数据与渲染配置校验器。 只报告 TypeScript 无法约束的运行时数据问题，并按对象和问题类型去重。 |
| `DrawCallManager.ts` | 负责编码 BindGroup、DrawCall 并向 GPUQueue 提交命令。 |
| `index.ts` | WebGPU 2D 渲染器。 负责生命周期和渲染流程调度，具体 GPU 资源由各管理器维护。 |
| `PipelineManager.ts` | 管理 BindGroupLayout、Sampler 和可复用的 GPURenderPipeline 模板。 |
| `PrecisionManager.ts` | 每个 Render 保存自己的相机快照及防抖定时器。 |
| `RenderTargetManager.ts` | 所有离屏 GPU 附件只属于一个 Render，不进入图片上传和自动 trim 生命周期。 |
| `SamplerManager.ts` | 管理当前 Render 对应 GPUDevice 创建的 Sampler 缓存。 相同 U/V 寻址组合在多个材质和 DrawCall 之间复用同一个 GPUSampler。 |
| `SceneUpdate.ts` | 更新场景节点的世界矩阵，供后续缓冲上传使用。；刷新场景资源列表，让渲染准备阶段使用当前引用关系。；确保相机投影及视图矩阵与当前输入参数一致。 |
| `TextureBlit.ts` | Render 私有的全屏纹理转换；统一离屏采样方向、Alpha 以及 IMesh 层尺寸。 |
| `TextureManager.ts` | 按 textureList 上传图片；单张图片和多层图片统一使用 2d-array 视图。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### Render

WebGPU 2D 渲染器。
负责生命周期和渲染流程调度，具体 GPU 资源由各管理器维护。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 当前 Render 的全局唯一 ID。 |
| `type`（公开） | `string`；`"Render"` | 对象类型。 |
| `container`（公开） | `HTMLElement`；`由构造参数或初始化过程赋值` | 画布容器。 |
| `canvas`（公开） | `HTMLCanvasElement`；`document.createElement("canvas")` | 渲染画布。 |
| `backgroundColor`（公开） | `GPUColorDict`；`{ r: 0, g: 0, b: 0, a: 0 }` | 每帧开始前用于清空画布的 RGBA 颜色。 |
| `pipeline`（公开） | `PipelineLike`；`{ pipelineTemplates: new Map<string, PipelineTemplateLike>(), renderTargets: new Map(), targetPipelineKeys: new Map(), textures: new Map<number, GPUTextureResourceLike>(), samplers: new Map<string, GPUSampler>(), sceneResources: new Map<number, SceneResourcesLike>(), customValues: new Map(), buffers: { meshMatrix: new Map(), meshDepth: new Map(), geometry: new Map<number, GeometryBufferLike>(), meshStyle: new Map<number, MeshStyleBufferLike>(), cameraUniform: [], }, }` | 当前 Render 的共享 WebGPU 资源。 |
| `ready`（公开） | `Promise<void>`；`由构造参数或初始化过程赋值` | WebGPU 初始化完成状态。 |
| `_alphaMode`（内部） | `GPUCanvasAlphaMode`；`"premultiplied"` | 设置 Canvas 与下层 HTML 内容的 Alpha 合成方式。（alphaMode 的内部状态）。 |
| `outputManager`（内部） | `CanvasOutput`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`hdr`、`hdrAvailable`、`hdrEnabled` 读取或维护；完整处理见对应函数。 |
| `_onHDR`（内部） | `按初始化值推断`；`new Map<string, HDRChangeCallback>()` | 状态由 `onHDR`、`deleteHDR`、`updateHDR`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_resizeTimer`（内部） | `number \| null`；`null` | 状态由 `destroy`、`resize` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `hdr`、`prepare`、`submit`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_dpr`（内部） | `number`；`GetInner().dpr` | 获取当前 Canvas 使用的设备像素比。（dpr 的内部状态）。 |
| `_renderMode`（内部） | `RenderMode`；`由构造参数或初始化过程赋值` | 设置 Render 运行模式。 production 会跳过 GPUBuffer 创建前的全部开发检查。（renderMode 的内部状态）。 |
| `_precisionDebounce`（内部） | `number`；`100` | 自动精度重建防抖毫秒，默认 100。（precisionDebounce 的内部状态）。 |
| `_boxDebounce`（内部） | `number`；`100` | 视口查询防抖毫秒，默认 100；等待期间保守绘制完整列表。（boxDebounce 的内部状态）。 |
| `boxManager`（内部） | `BoxManager`；`new BoxManager()` | 状态由 `prepare`、`destroy` 读取或维护；完整处理见对应函数。 |
| `precisionManager`（内部） | `PrecisionManager`；`new PrecisionManager()` | 状态由 `prepare`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_renderScene`（内部） | `Scene \| null`；`null` | 状态由 `prepare`、`submit`、`redrawCurrent` 读取或维护；完整处理见对应函数。 |
| `_renderCamera`（内部） | `Camera \| null`；`null` | 状态由 `prepare`、`submit`、`redrawCurrent` 读取或维护；完整处理见对应函数。 |
| `_renderTarget`（内部） | `RenderTarget \| null`；`null` | 状态由 `prepare`、`submit`、`redrawCurrent` 读取或维护；完整处理见对应函数。 |
| `targetManager`（内部） | `RenderTargetManager`；`new RenderTargetManager(this.pipeline)` | 状态由 `prepare` 读取或维护；完整处理见对应函数。 |
| `bufferManager`（内部） | `BufferManager`；`new BufferManager(this.pipeline)` | 状态由 `drawBuffers` 读取或维护；完整处理见对应函数。 |
| `destroyManager`（内部） | `DestroyManager`；`new DestroyManager(this.pipeline, this.targetManager)` | 状态由 `destroyMesh`、`destroyTexture`、`destroyMaterial`、`destroyGeometry` 读取或维护；完整处理见对应函数。 |
| `textureManager`（内部） | `TextureManager`；`new TextureManager(this.pipeline, this.targetManager)` | 状态由 `drawTextures` 读取或维护；完整处理见对应函数。 |
| `samplerManager`（内部） | `SamplerManager`；`new SamplerManager(this.pipeline)` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `drawCallManager`（内部） | `DrawCallManager`；`new DrawCallManager(this.pipeline, this.samplerManager, this.targetManager, this.textureManager)` | 状态由 `prepare`、`renderMask`、`submit`、`drawCall` 读取或维护；完整处理见对应函数。 |
| `pipelineManager`（内部） | `PipelineManager`；`new PipelineManager(this.pipeline, this.textureManager, this.samplerManager)` | 状态由 `initWebGPU`、`prepare`、`renderMask`、`drawPipelines` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(div: HTMLElement | string, renderMode: RenderMode = "development")
```

创建渲染器并开始异步初始化 WebGPU。

```ts
const render = new Render(div, renderMode);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get hdr(): HDRMode`  | HDR 请求模式，默认 auto：跟随浏览器当前显示状态。 |
| `set hdr(value: HDRMode)`  | 同步输出配置；不支持 extended 时保留 SDR。 |
| `get hdrAvailable(): boolean`  | 浏览器报告的当前 HDR 输出能力，不能验证屏幕实际亮度。 |
| `get hdrEnabled(): boolean`  | Canvas 已接受 HDR 配置；ready 前或回退 SDR 时为 false。 |
| `onHDR(key: string, callback: HDRChangeCallback): void`  | 注册监听，不立即调用；静态后处理页面可在此重新绘制整条链。 |
| `deleteHDR(key: string): boolean`  | 是否移除了监听。 |
| `updateHDR(): void` （内部） | 重新配置输出并通知状态订阅者，不自行重绘来源或后处理链。 |
| `get boxDebounce(): number`  | 视口查询防抖毫秒，默认 100；等待期间保守绘制完整列表。 |
| `set boxDebounce(value: number)`  | 无返回值。 |
| `get precisionDebounce(): number`  | 自动精度重建防抖毫秒，默认 100。 |
| `set precisionDebounce(value: number)`  | 无返回值。 |
| `async initWebGPU(): Promise<void>`  | 创建当前画布对应的 WebGPU 设备与呈现上下文。 |
| `set alphaMode(alphaMode: GPUCanvasAlphaMode)`  | 设置 Canvas 与下层 HTML 内容的 Alpha 合成方式。 |
| `get alphaMode(): GPUCanvasAlphaMode`  | 获取 Canvas Alpha 合成方式。 |
| `get dpr(): number`  | 获取当前 Canvas 使用的设备像素比。 |
| `set renderMode(renderMode: RenderMode)`  | 设置 Render 运行模式。 production 会跳过 GPUBuffer 创建前的全部开发检查。 |
| `get renderMode(): RenderMode`  | 获取 Render 运行模式。 |
| `warmup(scene: Scene, camera: Camera): void`  | 预热场景所需缓存，但不提交 DrawCall。 |
| `warmupPass(target: RenderTarget): void`  | 预热离屏场景及附件，不提交绘制或改变当前输出。 |
| `prepare(scene: Scene, camera: Camera, redraw: boolean, target: RenderTarget \| null): void` （内部） | 无返回值，准备阶段不提交 DrawCall。 |
| `render(scene: Scene, camera: Camera): void`  | 预热缓存并将当前场景绘制到 Canvas。 |
| `renderMask(target: RenderTarget, selection: DrawSelection, occlude: boolean = false): void`  | 透明背景绘制指定对象，可按原场景顺序擦除被遮挡部分；不接管延迟重绘。 |
| `renderPass(target: RenderTarget): void`  | 无返回值，提交离屏画面。 |
| `submit(scene: Scene, camera: Camera, target: RenderTarget \| null): void` （内部） | 统一准备和提交，两个公开入口各自确定输出位置。 |
| `redrawCurrent(): void` （内部） | 无返回值，延迟任务沿用最近输出且不绘制已更换配置的目标。 |
| `drawBuffers(scene: Scene, camera: Camera): void`  | 创建或更新当前场景的 GPUBuffer。 |
| `drawTextures(scene: Scene): void`  | 创建或更新当前场景的 GPUTexture。 |
| `drawPipelines(scene: Scene): void`  | 创建或更新当前场景的 Pipeline 模板。 |
| `drawCall(scene: Scene): void`  | 编码并提交当前场景的绘制命令。 |
| `destroyMesh(mesh: MeshLike \| number): boolean`  | 销毁指定 Mesh 缓存。 |
| `destroyTexture(texture: TextureResource \| number): boolean`  | 销毁指定 Texture 缓存。 |
| `destroyMaterial(material: Material2d \| number): boolean`  | 销毁指定 Material 缓存。 |
| `destroyGeometry(geometry: GeoData \| number): boolean`  | 销毁指定 Geometry 缓存。 |
| `trim(scene: Scene): void`  | 回收所有场景均未引用的 GPU 缓存。 |
| `matrixUpdate(scene: Scene): void`  | 更新场景版本落后的节点矩阵。 |
| `initScene(scene: Scene): void`  | 根据版本更新 Scene 列表。 |
| `initCamera(camera: Camera): void`  | 根据版本更新 Camera 矩阵。 |
| `destroy(): void`  | 销毁当前 Render 持有的全部资源并移除 Canvas。 |
| `resize(): void`  | 延迟更新 Canvas 实际像素尺寸。 连续 100ms 没有新的调用时才执行。 |
| `isDestroyed(): boolean` （内部） | 获取当前 Render 销毁状态。 |

### 导出关系

```ts
export default Render;
export type { BufferManagerLike } from "./BufferManager";
export type { DestroyManagerLike } from "./DestroyManager";
export type { DevelopmentValidatorLike } from "./DevelopmentValidator";
export type { DrawCallManagerLike } from "./DrawCallManager";
export type { PipelineManagerLike } from "./PipelineManager";
export type { SamplerManagerLike } from "./SamplerManager";
export type { TextureManagerLike } from "./TextureManager";
export type { HDRMode, HDRState, HDRChangeCallback } from "./CanvasOutput";
export type {
    DepthTextureLike, GeometryBufferLike, GeometryBufferPartLike, GPUTextureResourceLike, MeshDepthBufferLike, MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
} from "./types";
export {
    BufferManager,
    DepthManager, DestroyManager, DevelopmentValidator, DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
};
```

## 3. 其他源码文件

### 文件：BoxManager.ts

### BoxManager

合并连续相机变化的 box 查询；等待期间保守绘制，避免新进入视口的实体被旧结果裁掉。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_states`（内部） | `按初始化值推断`；`new Map<Scene, BoxState>()` | 状态由 `update`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `update(scene: Scene, delay: number, redraw: BoxRedraw): void`  | 无返回值。 |
| `cancel(state: BoxState \| undefined): void` （内部） | 无返回值，清除待执行回调。 |
| `destroy(): void`  | 无返回值，释放全部计时器与场景引用。 |

### 类型索引

`BoxState`、`BoxRedraw`

### 导出关系

```ts
export default BoxManager;
```

### 文件：BufferManager.ts

### BufferManager

管理当前 Render 对应的 Camera、Material、Mesh 和 Geometry GPUBuffer。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的共享管线资源（构造参数引用）。 |
| `depthManager`（内部） | `DepthManager`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`draw` 读取或维护；完整处理见对应函数。 |
| `developmentValidator`（内部） | `DevelopmentValidator`；`new DevelopmentValidator()` | 状态由 `draw`、`prepareMaterials`、`drawMeshBuffers`、`drawGeometryBuffers` 读取或维护；完整处理见对应函数。 |
| `_cameraSnapshot`（内部） | `\| { camera: Camera; view: Mat3; viewVersion: number; projection: Mat3; projectionVersion: number; zoom: number; dpr: number; relative: boolean; } \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `drawCameraBuffers` 读取或维护；完整处理见对应函数。 |
| `_validatedMaterials`（内部） | `按初始化值推断`；`new WeakMap<Material2d, number>()` | 状态由 `prepareMaterials` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike)
```

创建缓冲管理器。

```ts
const bufferManager = new BufferManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `draw(scene: Scene, camera: Camera, dpr: number, renderMode: RenderMode): void`  | 创建或更新当前场景需要的 GPUBuffer。 |
| `prepareMaterials(scene: Scene, renderMode: RenderMode): void` （内部） | 按 materialList 检查材质，共享材质每个版本只检查一次。 材质显示数值的 GPU 存储属于 Mesh 实例数组，不在这里重复创建一份缓冲。 |
| `drawCustomValueBuffers(device: GPUDevice, scene: Scene): void` （内部） | 上传材质具名数值；同尺寸字段只更新原有 GPUBuffer，不改变绑定。 |
| `createBuffer( device: GPUDevice, label: string, data: GPUAllowSharedBufferSource, usage: GPUBufferUsageFlags, ): GPUBuffer` （内部） | 创建并写入基础 GPUBuffer。 |
| `drawCameraBuffers(device: GPUDevice, camera: Camera, dpr: number): void` （内部） | 按当前 Render 自己的矩阵身份和版本快照上传相机数据。 |
| `drawMeshBuffers(device: GPUDevice, scene: Scene, camera: Camera, renderMode: RenderMode): void` （内部） | 创建或更新每个 Mesh 的连续矩阵与样式 Storage 数组，分别对比版本。 |
| `useCameraRelativeMatrices(camera: Camera): boolean` （内部） | f32 位移误差可能达到可见像素时是否启用相对矩阵。 |
| `renderMatrices(mesh: Scene["drawList"][number], camera: Camera, relative: boolean, originX: number, originY: number, zoomScale: number): Float32Array<ArrayBuffer>` （内部） | 为当前 Render 生成固定尺寸及相机相对矩阵，不改动 Mesh 的原始实例数据。 |
| `usesBuiltInVertex(mesh: Scene["drawList"][number]): boolean` （内部） | 顶点着色器是否支持局部锚点。 |
| `drawGeometryBuffers(device: GPUDevice, scene: Scene, renderMode: RenderMode): void` （内部） | 为去重后的 Geometry 创建顶点、二维轮廓法线、UV、索引和参数缓冲。 |
| `updateBase2DBuffers(device: GPUDevice, geometry: GeoData, cached: GeometryBufferLike): boolean` （内部） | 同尺寸更新 Base2D 的全部顶点属性及几何参数。 |
| `createGeometryBufferPart( device: GPUDevice, label: string, data: GeoPartDataLike, ): GeometryBufferPartLike` （内部） | 创建单种几何绘制模式的顶点、二维轮廓法线、UV 和索引缓冲。 |
| `getPointsFirstIndex(data: GeoPartDataLike): number` （内部） | 获取关键点索引段起点，缓存后绘制时无需重复遍历。 原生 line-list 需要插在实体面与关键点之间时，复用同一个合并缓冲分段绘制。 |
| `destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void` （内部） | 销毁一个 Geometry 缓存集合中的全部已创建缓冲。 |

### 类型索引

`BufferManagerLike`

### 导出关系

```ts
export default BufferManager;
export type { BufferManagerLike };
```

### 文件：CanvasOutput.ts

### CanvasOutput

Canvas 的 SDR/HDR 配置与系统状态监听；不改动普通材质颜色或离屏来源。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `mode`（公开） | `HDRMode`；`"auto"` | 用户请求模式，默认跟随浏览器。 |
| `available`（公开） | `boolean`；`false` | 媒体查询报告的当前 HDR 能力。 |
| `enabled`（公开） | `boolean`；`false` | Canvas 实际接受 extended 配置。 |
| `_pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | Render 私有设备资源（构造参数引用）。 |
| `_changed`（内部） | `() => void`；`由构造参数或初始化过程赋值` | 系统 HDR 状态变化后的回调（构造参数引用）。 |
| `_query`（内部） | `MediaQueryList \| null`；`null` | 状态由 `constructor`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_supportsHDR`（内部） | `boolean \| null`；`null` | 状态由 `configure` 读取或维护；完整处理见对应函数。 |
| `_configuredHDR`（内部） | `boolean \| null`；`null` | 状态由 `configure` 读取或维护；完整处理见对应函数。 |
| `_configuredAlpha`（内部） | `GPUCanvasAlphaMode \| null`；`null` | 状态由 `configure` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `configure`、`destroy` 读取或维护；完整处理见对应函数。 |
| `handleChange`（内部） | `按初始化值推断`；`(event: MediaQueryListEvent): void => { // 已销毁对象忽略排队中的事件，强制模式也更新 available 供 UI 查看。 if (this._destroyed === false && this.available !== event.matches) { this.available = event.matches; this._changed(); } }` | 更新状态并通知 Render 重新配置。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike, changed: () => void)
```

自动跟随浏览器的输出配置管理器。

```ts
new CanvasOutput(pipeline, UpdateHDR);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `configure(alphaMode: GPUCanvasAlphaMode): void`  | 无返回值，按实际接受的配置同步 pipeline；不支持时回退 SDR。 |
| `destroy(): void`  | 移除媒体查询订阅；设备与上下文交由 Render 销毁。 |

### 类型索引

`HDRMode`、`HDRState`、`HDRChangeCallback`

### 导出关系

```ts
export default CanvasOutput;
export type { HDRMode, HDRState, HDRChangeCallback };
```

### 文件：DepthManager.ts

### DepthManager

深度纹理和每个 Mesh 的绘制参数均属于当前 Render，不写入共享 CPU 样式。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的 GPU 资源（构造参数引用）。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike)
```

创建对象并建立初始状态及依赖关联。

```ts
const depthManager = new DepthManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `prepare(scene: Scene): void`  | 按原始排序分配层级，反向提交只改变访问方向，不重新定义谁在上面。 每个 Mesh 仅上传四个 u32：全局起点、条数、是否反读、补位。 |
| `ensureTexture(width: number, height: number): DepthTextureLike \| undefined`  | 复用与颜色附件同尺寸的深度纹理，实际像素尺寸变化才重建。 |

### 导出关系

```ts
export default DepthManager;
```

### 文件：DestroyManager.ts

### DestroyManager

统一负责当前 Render 的 GPU 资源销毁与无引用缓存回收。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的共享管线资源（构造参数引用）。 |
| `targetManager`（内部） | `RenderTargetManager`；`由构造参数或初始化过程赋值` | 当前 Render 共用的离屏资源管理器（构造参数引用）。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike, targetManager: RenderTargetManager = new RenderTargetManager(pipeline))
```

创建销毁管理器。

```ts
const destroyManager = new DestroyManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `destroyMesh(mesh: MeshLike \| number): boolean`  | 销毁指定 Mesh 的模型矩阵缓冲及可取得的关联资源。 |
| `destroyTexture(texture: TextureResource \| number): boolean`  | 销毁指定 Texture 的 GPUTexture 缓存。 |
| `destroyMaterial(material: Material2d \| number): boolean`  | 销毁所有关联此 Material 的 Mesh 实例样式缓冲，并在可取得对象时销毁其基础、边框和点型贴图。 |
| `destroyGeometry(geometry: GeoData \| number): boolean`  | 销毁指定 Geometry 的全部 GPUBuffer。 |
| `trim(scene: Scene): void`  | 更新场景资源使用记录并回收所有场景均未引用的缓存。 |
| `destroyAll(): void`  | 销毁当前 Render 持有的全部 WebGPU 资源和设备。 |
| `destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void` （内部） | 销毁 Geometry 所有绘制模式已经创建的全部缓冲。 |
| `releaseTextureBindings(view: GPUTextureView): void` （内部） | 解除引用某个纹理视图的缓存绑定，不影响其他 Mesh。 |

### 类型索引

`DestroyManagerLike`

### 导出关系

```ts
export default DestroyManager;
export type { DestroyManagerLike };
```

### 文件：DevelopmentValidator.ts

### DevelopmentValidator

开发模式 GPUBuffer 数据与渲染配置校验器。
只报告 TypeScript 无法约束的运行时数据问题，并按对象和问题类型去重。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `reported`（内部） | `Set<string>`；`new Set<string>()` | 状态由 `warn`、`error` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `validateCamera(camera: Camera): void`  | 检查 Camera 是否能生成有效矩阵与 Uniform。 |
| `validateMaterial(material: Material2d): void`  | 检查材质样式数据和分区配置。 |
| `validateGeometry(geometry: GeoData): void`  | 检查 Geometry 各缓冲分区的长度、有限值和索引范围。 |
| `validateMesh(mesh: MeshLike): void`  | 检查 Mesh 的 Geometry 与 Material 是否能组成目标边框绘制模式。 |
| `validatePart( geometryId: number, name: string, data: GeoPartDataLike, primitiveSize: 2 \| 3, requireMiterScale: boolean, source: object, ): void` （内部） | 检查单个几何缓冲分区。 |
| `warn(code: string, objectId: number, message: string, source: object): void` （内部） | 输出一次开发模式警告。 |
| `error(code: string, objectId: number, message: string, source: object): void` （内部） | 输出一次开发模式错误。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetInvalidNumberIndex` | 获取数组中首个非有限数索引。 |

```ts
GetInvalidNumberIndex(data);
```

### 类型索引

`DevelopmentValidatorLike`

### 导出关系

```ts
export default DevelopmentValidator;
export type { DevelopmentValidatorLike };
```

### 文件：DrawCallManager.ts

### DrawCallManager

负责编码 BindGroup、DrawCall 并向 GPUQueue 提交命令。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的共享管线资源（构造参数引用）。 |
| `samplerManager`（内部） | `SamplerManager`；`由构造参数或初始化过程赋值` | Sampler 管理器（构造参数引用）。 |
| `depthManager`（内部） | `DepthManager`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`prepare`、`draw` 读取或维护；完整处理见对应函数。 |
| `targetManager`（内部） | `RenderTargetManager`；`由构造参数或初始化过程赋值` | 离屏附件管理器（构造参数引用）。 |
| `textureManager`（内部） | `TextureManager`；`由构造参数或初始化过程赋值` | 图片和离屏层上传管理器（构造参数引用）。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike, samplerManager: SamplerManager, targetManager: RenderTargetManager = new RenderTargetManager(pipeline), textureManager: TextureManager = new TextureManager(pipeline, targetManager))
```

创建 DrawCall 管理器。

```ts
const drawCallManager = new DrawCallManager(pipeline, samplerManager);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `prepare(width: number, height: number, target: RenderTarget \| null = null): void`  | warmup 只创建深度附件，不提交绘制。 |
| `draw(scene: Scene, backgroundColor: GPUColorDict, alphaMode: GPUCanvasAlphaMode, output: RenderTarget \| null = null, selection: DrawSelection \| null = null, occlude: boolean = false): void`  | 编码并提交当前场景的基础绘制命令。 |
| `drawMesh( device: GPUDevice, renderPass: GPURenderPassEncoder, mesh: MeshLike, viewBuffer: GPUBuffer, orthogonalBuffer: GPUBuffer, renderCameraBuffer: GPUBuffer, format: GPUTextureFormat \| undefined, offscreen: boolean, instances: readonly number[] \| null = null, occlude: boolean = false, ): void` （内部） | 编码单个 Mesh 的资源绑定与索引绘制命令。 |
| `createCustomBindGroup( device: GPUDevice, material: Material2d, template: PipelineTemplateLike, ): GPUBindGroup \| undefined` （内部） | 绑定 group(2) 的具名数值和多张贴图；同名贴图更换只重建 BindGroup。 |
| `createMaterialBindGroup( device: GPUDevice, mesh: MeshLike, material: Material2d, pipelineTemplate: PipelineTemplateLike, ): GPUBindGroup \| undefined` （内部） | 一次绑定 Mesh 实例样式 Storage 与三种几何的贴图，Sampler 各自独立。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CompareSlots` | 原始提交次序。 |

```ts
CompareSlots(0, 1);
```

### 类型索引

`DrawCallManagerLike`、`DrawSelection`

### 导出关系

```ts
export type { DrawSelection };
export default DrawCallManager;
export type { DrawCallManagerLike };
```

### 文件：PipelineManager.ts

### PipelineManager

管理 BindGroupLayout、Sampler 和可复用的 GPURenderPipeline 模板。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的共享管线资源（构造参数引用）。 |
| `textureManager`（内部） | `TextureManager`；`由构造参数或初始化过程赋值` | 贴图管理器（构造参数引用）。 |
| `samplerManager`（内部） | `SamplerManager`；`由构造参数或初始化过程赋值` | Sampler 管理器（构造参数引用）。 |

#### 构造与案例

```ts
constructor(
        pipeline: PipelineLike,
        textureManager: TextureManager,
        samplerManager: SamplerManager,
    )
```

创建管线管理器。

```ts
const pipelineManager = new PipelineManager(pipeline, textureManager, samplerManager);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `initResources(device: GPUDevice): void`  | 创建当前 Render 共用的 Layout 和后备贴图。 |
| `draw(scene: Scene, format: GPUTextureFormat \| undefined = this.pipeline.format, offscreen: boolean = false, occluder: boolean = false): void`  | 按 materialList 创建材质管线和采样器，几何类型组合由 Scene 维护。 |
| `createPipelineTemplate( material: Material2d, geometryType: string, format: GPUTextureFormat \| undefined, offscreen: boolean, occluder: boolean, ): PipelineTemplateLike \| undefined` （内部） | 按几何类型选择统一三角面 Shader，原生线框仍使用独立管线。 未支持的几何不会误用矩形 Shader。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetTargetPipelineKey` | Render 内的管线变体键。 |

```ts
GetTargetPipelineKey(pipeline, key, "rgba8unorm", true);
```

### 类型索引

`PipelineManagerLike`

### 导出关系

```ts
export { GetTargetPipelineKey };
export default PipelineManager;
export type { PipelineManagerLike };
```

### 文件：PrecisionManager.ts

### PrecisionManager

每个 Render 保存自己的相机快照及防抖定时器。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_states`（内部） | `按初始化值推断`；`new Map<Scene, PrecisionState>()` | 状态由 `update`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `update(scene: Scene, camera: Camera, delay: number, redraw: PrecisionRedraw): void`  | 无返回值。 |
| `apply(scene: Scene, camera: Camera, state: PrecisionState): void` （内部） | 无返回值。 |
| `destroy(): void`  | 无返回值，清理全部延迟任务与场景引用。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `PrecisionEntries` | 自动细分的曲线对象及其基准快照。 |
| `CameraStamp` | 输入、父级和显式矩阵变化的快照。 |
| `SameEntries` | 开关、几何身份与基准是否一致。 |

```ts
PrecisionEntries(scene);
```

### 类型索引

`PrecisionRedraw`、`PrecisionEntry`、`PrecisionState`

### 导出关系

```ts
export default PrecisionManager;
```

### 文件：RenderTargetManager.ts

### RenderTargetManager

所有离屏 GPU 附件只属于一个 Render，不进入图片上传和自动 trim 生命周期。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 所属 Render 的资源表（构造参数引用）。 |
| `_blit`（内部） | `TextureBlit \| null`；`null` | 状态由 `blitter`、`destroyAll` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike)
```

资源管理器。

```ts
const manager = new RenderTargetManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get blitter(): TextureBlit`  | 延迟创建的 GPU 转换器。 |
| `ensure(target: RenderTarget): RenderTargetResourceLike`  | 已匹配配置的附件；新目标采样内容透明。 |
| `finish(encoder: GPUCommandEncoder, target: RenderTarget): void`  | 无返回值，在同一次提交中生成可复用的材质贴图。 |
| `validateInputs(inputs: readonly (TextureInput \| TextureLayers)[], target: RenderTarget): void`  | 无返回值；拒绝直接和 IMesh 层表中的反馈读写。 |
| `onTextureChange(texture: TextureInput): void`  | 无返回值，销毁立即释放，resize 延迟到下一次使用。 |
| `destroy(id: number): boolean`  | 是否释放了目标，描述可在未永久销毁时再次使用。 |
| `destroyAll(): void`  | 无返回值，释放当前 Render 的目标与转换缓存。 |

### 导出关系

```ts
export default RenderTargetManager;
```

### 文件：SamplerManager.ts

### SamplerManager

管理当前 Render 对应 GPUDevice 创建的 Sampler 缓存。
相同 U/V 寻址组合在多个材质和 DrawCall 之间复用同一个 GPUSampler。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | 当前 Render 的共享管线资源（构造参数引用）。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike)
```

创建 Sampler 管理器。

```ts
const samplerManager = new SamplerManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get(addressModeU: GPUAddressMode, addressModeV: GPUAddressMode): GPUSampler \| undefined`  | 获取或创建指定寻址组合的 Sampler。 |

### 类型索引

`SamplerManagerLike`

### 导出关系

```ts
export default SamplerManager;
export type { SamplerManagerLike };
```

### 文件：SceneUpdate.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `MatrixUpdate` | 更新场景节点的世界矩阵，供后续缓冲上传使用。 |
| `InitScene` | 刷新场景资源列表，让渲染准备阶段使用当前引用关系。 |
| `InitCamera` | 确保相机投影及视图矩阵与当前输入参数一致。 |

```ts
MatrixUpdate(scene);
```

### 导出关系

```ts
export { InitCamera, InitScene, MatrixUpdate };
```

### 文件：TextureBlit.ts

### TextureBlit

Render 私有的全屏纹理转换；统一离屏采样方向、Alpha 以及 IMesh 层尺寸。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_device`（内部） | `GPUDevice`；`由构造参数或初始化过程赋值` | 所属 Render 的设备（构造参数引用）。 |
| `_layout`（内部） | `GPUBindGroupLayout`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`encode` 读取或维护；完整处理见对应函数。 |
| `_sampler`（内部） | `GPUSampler`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`encode` 读取或维护；完整处理见对应函数。 |
| `_pipelines`（内部） | `按初始化值推断`；`new Map<string, GPURenderPipeline>()` | 状态由 `encode`、`destroy` 读取或维护；完整处理见对应函数。 |
| `_bindings`（内部） | `按初始化值推断`；`new WeakMap<GPUTextureView, GPUBindGroup>()` | 状态由 `encode`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(device: GPUDevice)
```

转换器。

```ts
const blit = new TextureBlit(device);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `encode(encoder: GPUCommandEncoder, source: GPUTextureView, target: GPUTextureView, format: GPUTextureFormat, normalize: boolean \| "data" = false): void`  | 无返回值，仅编码不提交。 |
| `destroy(): void`  | 无返回值，解除管线和绑定引用。 |

### 导出关系

```ts
export default TextureBlit;
```

### 文件：TextureManager.ts

### TextureManager

按 textureList 上传图片；单张图片和多层图片统一使用 2d-array 视图。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `pipeline`（内部） | `PipelineLike`；`由构造参数或初始化过程赋值` | Render 资源（构造参数引用）。 |
| `targetManager`（内部） | `RenderTargetManager`；`由构造参数或初始化过程赋值` | 当前 Render 共用的离屏资源管理器（构造参数引用）。 |

#### 构造与案例

```ts
constructor(pipeline: PipelineLike, targetManager: RenderTargetManager = new RenderTargetManager(pipeline))
```

创建对象并建立初始状态及依赖关联。

```ts
const textureManager = new TextureManager(pipeline);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `draw(scene: Scene): void`  | 创建或同步本次渲染所需的资源。 |
| `createFallbackTexture(device: GPUDevice): GPUTextureResourceLike`  | 创建缺省白色贴图，使未提供图片的材质仍有有效绑定。 |
| `encodeTargets(encoder: GPUCommandEncoder, scene: Scene): void`  | 无返回值，GPU 缩放离屏画面到层数组，warmup 不调用。 |
| `releaseTexture(resource: GPUTextureResourceLike \| undefined): void` （内部） | 释放旧纹理及引用其视图的绑定缓存，重建时不会误用旧视图。 |
| `uploadVideoFrames( device: GPUDevice, cached: GPUTextureResourceLike, resource: TextureLike \| TextureLayers, ): void` （内部） | 每次渲染把视频当前帧写入原有纹理层，不改变纹理视图或样式版本。 |
| `createTexture( device: GPUDevice, textureId: number, version: number, layers: readonly (TextureInput \| undefined)[], ): GPUTextureResourceLike` （内部） | 层号由 CPU 层表决定，空源和 loading 都写白色，不能跳过层造成编号错位。 同组图片统一到最大宽高，缩放整张图片，不裁切 UV。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IsReady` | 判断贴图是否已有可上传的有效来源。 |

```ts
IsReady(image);
```

### 类型索引

`TextureManagerLike`

### 导出关系

```ts
export default TextureManager;
export type { TextureManagerLike };
```

### 文件：types.ts


### 类型索引

`RenderMode`、`MatrixBindGroupCache`、`StyleBindGroupCache`、`MeshMatrixBufferLike`、`MeshStyleBufferLike`、`GeometryBufferPartLike`、`GeometryBufferLike`、`MeshDepthBufferLike`、`DepthTextureLike`、`PipelineBuffersLike`、`SceneResourcesLike`、`GPUTextureResourceLike`、`PipelineTemplateLike`、`CustomValueBufferLike`、`CustomValueResourcesLike`、`RenderTargetResourceLike`、`PipelineLike`、`RenderLike`

### 导出关系

```ts
export type {
    RenderTargetResourceLike, DepthTextureLike, GeometryBufferLike, GeometryBufferPartLike, GPUTextureResourceLike, MeshDepthBufferLike, MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
};
```

## 4. 注意事项

- warmup 只准备，render 才提交。缓存属于单个 Render；筛选只改变提交子集，资源和深度前缀仍按完整 drawList 管理。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- `renderMask(target, selection, true)` 保留完整场景提交/深度顺序，非本组对象使用擦除混合变体，只按原 Shader 的 Alpha、discard 和材质透明开关去除下层组遮罩，不写自身颜色或 Alpha。普通遮罩默认仍只绘制选中组。混合 IMesh 按真实槽位切换发光/遮挡，含不透明深度反序；全入选或全遮挡保持实例批量绘制。
- `hdr` 默认 `"auto"`，通过 `(dynamic-range: high)` 跟随浏览器；`true` 强制请求，`false` 使用 SDR。`hdrAvailable` 是检测值，`hdrEnabled` 是 Canvas 已接受 `rgba16float + extended` 的状态，不等同于测得物理屏幕亮度。不支持 extended 时回退首选 SDR 格式。
- `CanvasOutput` 监听媒体查询并缓存 configure 状态，普通材质仍保持原色值；`onHDR/deleteHDR` 通知配置变化，静态后处理案例需要据此重新绘制完整通道链。GPU 管线继续按附件格式区分，toneMapping 只属于 Canvas 配置。
- `render/warmup(scene, camera)` 用于 Canvas，`renderPass/warmupPass(target)` 使用目标内的场景、相机及 viewport 尺寸。Pipeline 缓存按材质键、附件格式和离屏预乘规则区分。目标附件独立持有，不能被普通 texture trim 回收。
- `RenderTargetManager` 管理颜色、采样和深度附件；`TextureBlit` 处理上下方向与 Alpha，以及 IMesh 混合贴图层的 GPU 缩放。warmup 可分配附件但不能提交这些转换。
- 自动精度不改变用户 originPrecision；单独隔离自动细分的共享几何。ignoreZoom 实体按基准精度处理，NGon 边数和 Base 顶点不参与自动细分。
- 全屏屏幕空间 Shader 的 Mesh 必须关闭 culling，避免 CPU 按逻辑几何范围裁掉辅助显示。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">渲染 GPU 缓冲 管线 绑定 深度 筛选 精度 高动态范围 HDR</keywords>
<keywords language="en">render webgpu buffer pipeline bind depth culling precision hdr toneMapping</keywords>
```
