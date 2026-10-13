# 实体 Mesh

目录：`bplinejs/src/scripts/Mesh`

## 1. 文件结构与作用

几何与材质资源、变换、实例打包和包围盒。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 网格对象 在组对象基础上增加几何数据和材质数据 |

## 2. index 入口、案例与类接口

### Mesh

网格对象
在组对象基础上增加几何数据和材质数据

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Mesh"` | 对象类型 |
| `noSelect`（公开） | `boolean`；`false` | 编辑辅助 Mesh 等对象可显示在场景中，但不参与任何选择器拾取。 |
| `_ignoreZoom`（内部） | `boolean`；`false` | 是否抵消相机 zoom，默认关闭。开启后以局部原点固定显示尺寸，位置仍使用世界坐标。 IMesh 继承此开关，分别固定每个实例的尺寸，不改变实例之间的位置。（ignoreZoom 的内部状态）。 |
| `_culling`（内部） | `boolean`；`true` | 是否参与视口筛选，默认 true；屏幕空间自定义 Shader 可关闭。（culling 的内部状态）。 |
| `_autoPrecision`（内部） | `boolean`；`false` | 是否随相机 zoom 调整曲线精度，默认 false。（autoPrecision 的内部状态）。 |
| `_precisionMax`（内部） | `number`；`100` | 自动细分上限，默认 100；不限制手动精度。（precisionMax 的内部状态）。 |
| `_precisionGeometry`（内部） | `Geometry2d \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `preparePrecisionGeometry`、`copyTransform` 读取或维护；完整处理见对应函数。 |
| `_renderMatrix`（内部） | `Mat3 \| null`；`null` | 状态由 `getRenderMatrix` 读取或维护；完整处理见对应函数。 |
| `_renderMatrixSource`（内部） | `Mat3 \| null`；`null` | 状态由 `getRenderMatrix` 读取或维护；完整处理见对应函数。 |
| `_renderMatrixSourceVersion`（内部） | `number`；`-1` | 状态由 `getRenderMatrix` 读取或维护；完整处理见对应函数。 |
| `_renderMatrixZoom`（内部） | `number`；`Number.NaN` | 状态由 `getRenderMatrix` 读取或维护；完整处理见对应函数。 |
| `_renderBounds`（内部） | `MeshBoundingBox \| null`；`null` | 状态由 `getRenderBoundingBox` 读取或维护；完整处理见对应函数。 |
| `_renderBoundsGeometry`（内部） | `Geometry2d \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `getRenderBoundingBox` 读取或维护；完整处理见对应函数。 |
| `_renderBoundsGeometryVersion`（内部） | `number`；`-1` | 状态由 `getRenderBoundingBox` 读取或维护；完整处理见对应函数。 |
| `_renderBoundsMatrix`（内部） | `Mat3 \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `getRenderBoundingBox` 读取或维护；完整处理见对应函数。 |
| `_renderBoundsMatrixVersion`（内部） | `number`；`-1` | 状态由 `getRenderBoundingBox` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `Geometry2d \| undefined`；`由构造参数或初始化过程赋值` | 几何数据 |
| `_material`（内部） | `Material2d \| undefined`；`由构造参数或初始化过程赋值` | 材质数据 |
| `_style`（内部） | `Style \| undefined`；`由构造参数或初始化过程赋值` | Mesh 管理的样式；undefined 表示不接管 Geometry / Material 的样式。（style 的内部状态）。 |
| `_bounding`（内部） | `boolean`；`false` | 是否启用自身几何的包围盒计算，默认关闭。（bounding 的内部状态）。 |
| `_boundingBox`（内部） | `MeshBoundingBox \| null`；`null` | 按需获取局部及世界坐标轴向包围盒；x/y 是最小坐标。 关闭计算或几何没有顶点时返回 null，不包含子节点。（boundingBox 的内部状态）。 |
| `_boundingGeometry`（内部） | `Geometry2d \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `bounding`、`boundingBox` 读取或维护；完整处理见对应函数。 |
| `_boundingGeometryVersion`（内部） | `number`；`-1` | 状态由 `boundingBox` 读取或维护；完整处理见对应函数。 |
| `_boundingWorldMatrix`（内部） | `Mat3 \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `bounding`、`boundingBox` 读取或维护；完整处理见对应函数。 |
| `_boundingWorldMatrixVersion`（内部） | `number`；`-1` | 状态由 `boundingBox` 读取或维护；完整处理见对应函数。 |
| `_matrixVersion`（公开） | `number`；`0` | 连续矩阵数据版本，各 Render 独立记录上传快照。（matrixVersion 的内部状态）。 |
| `_styleVersion`（公开） | `number`；`0` | 连续样式数据版本，各 Render 独立记录上传快照。（styleVersion 的内部状态）。 |
| `_stylePending`（公开） | `boolean`；`true` | 状态由 `onMaterialChange`、`updateInstanceData`、`material`、`init` 读取或维护；完整处理见对应函数。 |
| `_geometryPending`（公开） | `boolean`；`true` | 几何通知待处理；生成和 GPU 上传仍归 geometryList，不在 Mesh 回调里执行。（geometryPending 的内部状态）。 |
| `_materialPending`（公开） | `boolean`；`true` | 材质通知待处理，用于下帧校验和更新 Mesh 自己的样式数组。（materialPending 的内部状态）。 |
| `_disposed`（公开） | `boolean`；`false` | 状态由 `style`、`onGeometryChange`、`onMaterialChange`、`dispose` 读取或维护；完整处理见对应函数。 |
| `_matrixPending`（公开） | `boolean`；`true` | 状态由 `updateInstanceData`、`onMathChange` 读取或维护；完整处理见对应函数。 |
| `_count`（公开） | `number`；`1` | 普通 Mesh 只有一个实例，后续 IMesh 扩展时仍按实际数量绘制。 |
| `_capacity`（公开） | `number`；`1` | 当前实例容量，普通 Mesh 不提前分配大量空槽。 |
| `_matrixData`（公开） | `Float32Array<ArrayBuffer>`；`new Float32Array(12)` | 连续实例矩阵，每实例 12 个 float（含 Mat3 对齐补位），由 updateInstanceData 写入。 |
| `_styleData`（公开） | `Float32Array<ArrayBuffer>`；`new Float32Array(STYLE_STRIDE)` | 连续实例样式，每实例 44 个 float，由 updateInstanceData 写入，不直接修改。 |

#### 构造与案例

```ts
constructor(data: Geometry2d, material: Material2d, style: Style | boolean = true)
```

创建网格对象

```ts
const mesh = new Mesh(data, material, style);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get culling(): boolean`  | 是否参与视口筛选，默认 true；屏幕空间自定义 Shader 可关闭。 |
| `set culling(value: boolean)`  | 无返回值。 |
| `get autoPrecision(): boolean`  | 是否随相机 zoom 调整曲线精度，默认 false。 |
| `set autoPrecision(value: boolean)`  | 无返回值，关闭时恢复用户精度。 |
| `get precisionMax(): number`  | 自动细分上限，默认 100；不限制手动精度。 |
| `set precisionMax(value: number)`  | 无返回值，下次渲染按新上限计算。 |
| `get precision(): number`  | 当前几何的曲线精度。 |
| `set precision(value: number)`  | 无返回值。 |
| `get originPrecision(): number`  | 几何最后手动设置的基准精度。 |
| `preparePrecisionGeometry(): Geometry2d \| undefined`  | 自动模式独享的几何；IMesh 的所有实例仍共享一个模板。 |
| `get count(): number`  | 当前有效绘制条数。 |
| `get ignoreZoom(): boolean`  | 是否抵消相机 zoom，默认关闭。开启后以局部原点固定显示尺寸，位置仍使用世界坐标。 IMesh 继承此开关，分别固定每个实例的尺寸，不改变实例之间的位置。 |
| `set ignoreZoom(value: boolean)`  | 切换固定显示尺寸，并通知每个 Render 重新上传矩阵和分区缩放标记。 |
| `getRenderMatrix(camera: CameraLike): Mat3`  | 获取相机专属的显示矩阵；返回值供读取，不能用于修改 Mesh 的位姿。 |
| `getRenderBoundingBox(camera: CameraLike): MeshBoundingBox \| null`  | 查询显示包围盒；boundingBox 本身仍保留与相机无关的逻辑世界边界。 |
| `get capacity(): number`  | 已分配槽数，不是扩容倍率。 |
| `get matrixData(): Float32Array<ArrayBuffer>`  | 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。 |
| `get styleData(): Float32Array<ArrayBuffer>`  | 连续样式数组，最后四个 float 保存三种贴图层号与补位。 |
| `get textures(): readonly (TextureResource \| undefined)[]`  | 普通 Mesh 每个分区只绑定一张图片，Shader 层号始终为 0。 |
| `get style(): Style \| undefined`  | Mesh 管理的样式；undefined 表示不接管 Geometry / Material 的样式。 |
| `set style(value: Style \| undefined)`  | 更换 Mesh 样式，并同步到当前几何和材质。 undefined 仅停止接管，不清除它们已有的样式，也不销毁共享 Style。 |
| `get bounding(): boolean`  | 是否启用自身几何的包围盒计算，默认关闭。 |
| `set bounding(value: boolean)`  | 开启或关闭包围盒计算；变化时更新 Mesh 输入版本。 |
| `get boundingBox(): MeshBoundingBox \| null`  | 按需获取局部及世界坐标轴向包围盒；x/y 是最小坐标。 关闭计算或几何没有顶点时返回 null，不包含子节点。 |
| `createBoundingBox(geometry: Geometry2d, worldMatrix: Mat3): MeshBoundingBox \| null`  | 从三角面和线框顶点同时计算两个坐标系的轴向范围。 |
| `get matrixVersion(): number`  | 连续矩阵数据版本，各 Render 独立记录上传快照。 |
| `get styleVersion(): number`  | 连续样式数据版本，各 Render 独立记录上传快照。 |
| `get geometryPending(): boolean`  | 几何通知待处理；生成和 GPU 上传仍归 geometryList，不在 Mesh 回调里执行。 |
| `get materialPending(): boolean`  | 材质通知待处理，用于下帧校验和更新 Mesh 自己的样式数组。 |
| `onGeometryChange(geometry: GeoData): void`  | 几何发生变化，只标记本 Mesh 的绑定需要检查。 |
| `onMaterialChange(change: MaterialChange): void`  | 材质变化只安排下帧工作，不在通知链内上传 GPU 或递归改写 Style。 |
| `dispose(): void`  | 最终停用 Mesh 时解绑资源；从 Scene 移除不会自动调用，也不销毁共享资源。 |
| `syncStyle(): void` （内部） | 将 Mesh 主动指定的样式同步给新绑定的几何及材质。 |
| `updateInstanceData(): void`  | 世界矩阵计算完成后，将单实例数据打包到预分配数组。 数组不每帧分配；矩阵与样式分别更新版本，静止或只移动时不重复上传样式。 |
| `override onMathChange(source: VersionedMath, field: string): void`  | 世界矩阵完成修改后标记连续数组需要重打包，不再逐帧比较 12 个 float。 |
| `get data(): Geometry2d \| undefined`  | 获取当前几何体。 |
| `set data(data: Geometry2d \| undefined)`  | 替换几何体，追加材质类型标记并刷新所在场景的资源引用。 |
| `get material(): Material2d \| undefined`  | 获取当前材质。 |
| `set material(material: Material2d \| undefined)`  | 替换材质，追加当前几何类型标记并刷新场景引用。 |
| `updateResources(): void` （内部） | 同步材质几何类型与场景引用，不修改共享材质的着色器选择。 |
| `copy(source: Mesh): this`  | 复制 Mesh 的几何、材质、样式和局部变换，不复制父子层级与 ID。 |
| `clone(): Mesh`  | 创建独立 Mesh；图像和纹理资源可共享，参数及可变样式独立。 |
| `copyTransform(source: Mesh): void` （内部） | 保留自定义仿射矩阵和公开 TRS 参数，来源父节点不随副本继承。 |
| `init(data: Geometry2d, material: Material2d): this`  | 设置当前 Mesh 使用的 Geometry 与 Material。 Mesh 已加入 Scene 时会标记场景结构变化，下次初始化将重建四个资源列表。 |

### 类型索引

`MeshBoundingRect`、`MeshBoundingBox`、`MeshLike`

### 导出关系

```ts
export default Mesh;
export type { MeshBoundingBox, MeshBoundingRect, MeshLike };
```

## 3. 其他源码文件

## 4. 注意事项

- 逻辑 boundingBox 不受相机影响，getRenderBoundingBox 使用显示矩阵。autoPrecision 默认关闭，编辑器为实体开启；precisionMax 默认 100。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">实体 模型 变换 包围盒 精度 固定尺寸</keywords>
<keywords language="en">mesh model transform bounding precision ignoreZoom</keywords>
```
