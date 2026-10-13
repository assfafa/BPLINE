# 相机 Camera

目录：`bplinejs/src/scripts/Camera`

## 1. 文件结构与作用

正交视口、坐标投影、缩放和相机版本。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 正交相机：输入沿用节点单一版本，矩阵与每个 Render 独立保存处理快照。 |

## 2. index 入口、案例与类接口

### Camera

正交相机：输入沿用节点单一版本，矩阵与每个 Render 独立保存处理快照。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Camera"` | 对象类型。 |
| `_width`（内部） | `number`；`由构造参数或初始化过程赋值` | 视口宽度。（width 的内部状态）。 |
| `_height`（内部） | `number`；`由构造参数或初始化过程赋值` | 视口高度。（height 的内部状态）。 |
| `_zoom`（内部） | `number`；`由构造参数或初始化过程赋值` | 相机缩放。（zoom 的内部状态）。 |
| `_zoomVersion`（内部） | `number`；`0` | 仅缩放变化的版本，供空间索引与精度缓存使用。（zoomVersion 的内部状态）。 |
| `_orthogonalMatrix`（内部） | `按初始化值推断`；`new Mat3()` | 投影矩阵，GPU 上传比较矩阵版本。（orthogonalMatrix 的内部状态）。 |
| `_viewMatrix`（内部） | `按初始化值推断`；`new Mat3()` | 视图矩阵，通常为世界矩阵的逆。（viewMatrix 的内部状态）。 |
| `_projectionSnapshot`（内部） | `number`；`-1` | 状态由 `onMathChange`、`ensureCameraMatrix`、`updateOrthogonalMatrix` 读取或维护；完整处理见对应函数。 |
| `_viewWorldMatrix`（内部） | `Mat3 \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `onMathChange`、`ensureCameraMatrix`、`updateViewMatrix` 读取或维护；完整处理见对应函数。 |
| `_viewWorldVersion`（内部） | `number`；`-1` | 状态由 `onMathChange`、`ensureCameraMatrix`、`updateViewMatrix` 读取或维护；完整处理见对应函数。 |
| `_writingCamera`（内部） | `boolean`；`false` | 状态由 `onMathChange`、`updateOrthogonalMatrix`、`updateViewMatrix` 读取或维护；完整处理见对应函数。 |
| `buffers`（公开） | `CameraBuffersLike`；`{}` | 保留的缓冲描述；实际 GPUBuffer 仍由 Render 持有。 |

#### 构造与案例

```ts
constructor(width: number = 100, height: number = 100, zoom: number = 1)
```

创建对象并建立初始状态及依赖关联。

```ts
const camera = new Camera(width, height, zoom);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get width(): number`  | 视口宽度。 |
| `set width(value: number)`  | 视口宽度。 |
| `get height(): number`  | 视口高度。 |
| `set height(value: number)`  | 视口高度。 |
| `get zoomVersion(): number`  | 仅缩放变化的版本，供空间索引与精度缓存使用。 |
| `get zoom(): number`  | 相机缩放。 |
| `set zoom(value: number)`  | 相机缩放。 |
| `get top(): number`  | 正交视口上边界。 |
| `get bottom(): number`  | 正交视口下边界。 |
| `get left(): number`  | 正交视口左边界。 |
| `get right(): number`  | 正交视口右边界。 |
| `get orthogonalMatrix(): Mat3`  | 投影矩阵，GPU 上传比较矩阵版本。 |
| `set orthogonalMatrix(value: Mat3)`  | 投影矩阵，GPU 上传比较矩阵版本。 |
| `get viewMatrix(): Mat3`  | 视图矩阵，通常为世界矩阵的逆。 |
| `set viewMatrix(value: Mat3)`  | 视图矩阵，通常为世界矩阵的逆。 |
| `override onMathChange(source: VersionedMath, field: string): void`  | 接收数学对象的变化通知，更新对应字段的消费者版本。 |
| `setViewport(width: number = 100, height: number = 100): void`  | 同时更新相机视口宽高，通知投影矩阵在下一次使用前更新。 |
| `add(): void`  | 相机不提供子节点容器。 |
| `ensureCameraMatrix(): void`  | 在渲染前更新版本落后的矩阵；支持相机挂在 Group/Mesh 内以及独立相机。 |
| `updateOrthogonalMatrix(): Mat3`  | 强制计算投影矩阵，保持 Y 正方向向上。 |
| `updateViewMatrix(): Mat3`  | 先确保父级与自身世界矩阵有效，再计算逆矩阵。 |
| `updateCameraMatrix(): void`  | 强制更新投影矩阵和视图矩阵。 |
| `override dispose(): void`  | 最终释放相机对所有数学对象的订阅，不销毁共享矩阵。 |
| `worldToNdc(position: Vec2): Vec2`  | 世界坐标转归一化NDC坐标。 |
| `ndcToScreen(position: Vec2, render?: RenderLike): Vec2`  | 归一化NDC坐标转画布坐标。 |
| `worldToScreen(position: Vec2, render?: RenderLike): Vec2`  | 世界坐标转画布坐标。 |
| `screenToNdc(position: Vec2, render?: RenderLike): Vec2`  | 画布坐标转归一化NDC坐标。 |
| `ndcToWorld(position: Vec2): Vec2`  | 归一化ndc坐标转世界坐标 |
| `screenToWorld(position: Vec2, render?: RenderLike): Vec2`  | 画布坐标转世界坐标 |
| `worldToWindow(position: Vec2, render: RenderLike): Vec2`  | 世界坐标转浏览器视口坐标，适用于 DOM 定位；支持 CSS 平移/轴向缩放，不含旋转/倾斜。 |
| `windowToWorld(position: Vec2, render: RenderLike): Vec2`  | 浏览器视口坐标转世界坐标。 |

### 类型索引

`CameraBuffersLike`、`CameraLike`

### 导出关系

```ts
export default Camera;
export type { CameraBuffersLike, CameraLike };
```

## 3. 其他源码文件

## 4. 注意事项

- zoomVersion 只记录实际缩放变化；变换与投影按版本同步，Y 正方向向上。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">相机 视口 投影 缩放 旋转</keywords>
<keywords language="en">camera viewport projection zoom rotation</keywords>
```
