# 离屏目标 RenderTarget

目录：`bplinejs/src/scripts/RenderTarget`

## 1. 文件结构与作用

可直接传给材质的离屏画面描述；GPU 颜色、采样及深度附件由 Render 维护。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 离屏画面的描述和生命周期；颜色、采样及深度附件由所属 Render 维护。 |

## 2. index 入口、案例与类接口

### RenderTarget

离屏画面的描述和生命周期；颜色、采样及深度附件由所属 Render 维护。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `id`（公开） | `number`；`GETID()` | 资源身份，可直接作为 Style.texture 或 raw.value 的值。 |
| `type`（公开） | `string`；`"RenderTarget"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `scene`（公开） | `Scene`；`由构造参数或初始化过程赋值` | 离屏绘制使用的场景；更换场景后调用 renderPass 更新画面。 |
| `data`（公开） | `boolean`；`由构造参数或初始化过程赋值` | 数据附件只翻转采样方向，不预乘/还原 Alpha；用于抗锯齿权重等数值结果。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 离屏绘制使用的相机，viewport 同时决定附件尺寸。 |
| `_width`（内部） | `number`；`0` | 相机 viewport 的物理像素宽度，小数向上取整；通过 camera.setViewport 修改。（width 的内部状态）。 |
| `_height`（内部） | `number`；`0` | 相机 viewport 的物理像素高度，小数向上取整；通过 camera.setViewport 修改。（height 的内部状态）。 |
| `_format`（内部） | `RenderTargetFormat`；`"rgba8unorm"` | 可采样的颜色附件格式。（format 的内部状态）。 |
| `_version`（内部） | `number`；`0` | 附件配置版本，不是帧序号。（version 的内部状态）。 |
| `_destroyed`（内部） | `boolean`；`false` | 是否已经永久销毁。（destroyed 的内部状态）。 |
| `_owner`（内部） | `object \| null`；`null` | 状态由 `claim`、`release` 读取或维护；完整处理见对应函数。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<TextureSubscriber>()` | 状态由 `add`、`delete`、`updateVersion`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, camera: Camera, options: RenderTargetOptions = {})
```

离屏目标。

```ts
const target = new RenderTarget(scene, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get width(): number`  | 相机 viewport 的物理像素宽度，小数向上取整；通过 camera.setViewport 修改。 |
| `get height(): number`  | 相机 viewport 的物理像素高度，小数向上取整；通过 camera.setViewport 修改。 |
| `get format(): RenderTargetFormat`  | 可采样的颜色附件格式。 |
| `set format(value: RenderTargetFormat)`  | 无返回值。 |
| `get version(): number`  | 附件配置版本，不是帧序号。 |
| `get destroyed(): boolean`  | 是否已经永久销毁。 |
| `syncViewport(): void`  | 无返回值；使用前同步两轴，仅尺寸变化通知订阅者重建附件。 |
| `add(subscriber: TextureSubscriber): void`  | 无返回值。 |
| `delete(subscriber: TextureSubscriber): void`  | 无返回值。 |
| `updateVersion(): void`  | 无返回值，使附件在下次使用时重建。 |
| `claim(owner: object): void`  | 无返回值；禁止跨设备静默读取另一张空图。 |
| `release(owner: object): void`  | 无返回值。 |
| `destroy(): void`  | 无返回值，释放全部附件并禁止后续使用。 |
| `assertAlive(): void` （内部） | 无返回值，销毁后抛出错误。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ViewportPixels` | 正整数物理像素；非法视口在分配前报错。 |

```ts
ViewportPixels(camera.width);
```

### 类型索引

`RenderTargetFormat`、`RenderTargetOptions`

### 导出关系

```ts
export default RenderTarget;
export type { RenderTargetOptions, RenderTargetFormat };
```

## 3. 其他源码文件

## 4. 注意事项

- 使用 new RenderTarget(scene, camera) 与 render.renderPass(target) 离屏绘制；尺寸跟随 camera viewport，Style.texture 和 raw.value 直接接收 target；已归属目标不能跨 Render 使用。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- `{ data: true }` 用于后处理数值附件：只统一采样方向，不预乘/反预乘颜色，Alpha 通道可保存权重。默认 false，普通画面纹理继续使用标准透明颜色路径。
- `new RenderTarget(scene, camera, { format? })` 绑定场景和相机；默认 rgba8unorm，另支持 bgra8unorm、rgba16float，当前均为单采样。width/height 只读，取相机 viewport 的物理像素（小数向上取整），不额外乘 DPR 或 zoom。修改 camera.setViewport 后下次使用自动重建，重新分配后内容透明，必须重绘。
- 标准样式使用 `style.solid.texture = target`，自定义材质使用 `material.raw.value.image = target`；不暴露需要用户单独传递的 `.texture`。边框、关键点及 IMesh 层表同样接收目标。
- 不递归渲染依赖：先渲染来源目标，再渲染使用者。直接或通过 IMesh 层表采样当前输出目标会报错。
- 一份目标只归属一个 Render。`render.destroyTexture(target)` 释放附件并允许再次分配/迁移，`target.destroy()` 永久销毁；离屏目标不随 Scene.trim 自动回收。
- 内部附件保存预乘颜色；同次提交的 GPU 全屏转换产生左下原点、非预乘采样结果，与图片纹理保持一致。无 CPU 像素回读。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">离屏 渲染目标 纹理 附件 尺寸 透明 后处理</keywords>
<keywords language="en">offscreen render target texture attachment resize alpha postprocessing</keywords>
```
