# 实例批次 IMesh

目录：`bplinejs/src/scripts/IMesh`

## 1. 文件结构与作用

管理或冻结实例记录、连续缓冲和整批包围盒。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 共用 Geometry / Material 的实例网格，每个槽位独立储存世界矩阵和样式。 |

## 2. index 入口、案例与类接口

### IMesh

共用 Geometry / Material 的实例网格，每个槽位独立储存世界矩阵和样式。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"IMesh"` | 对象类型；Scene 仍通过 Mesh 基类识别。 |
| `_count`（公开） | `number`；`0` | 实例批次从空集合开始，覆盖普通 Mesh 的单实体默认值。 |
| `_capacity`（公开） | `number`；`0` | 由构造参数 capacity 触发首次分配；字段初始值不占用实例槽位。 |
| `_raw`（内部） | `boolean`；`由构造参数或初始化过程赋值` | 是否订阅原始记录。（raw 的内部状态）。 |
| `_raws`（内部） | `Raws`；`new Raws()` | 原始记录按稳定 ID 查询；raw=false 时 Map 为空。（raws 的内部状态）。 |
| `_growthFactor`（内部） | `number`；`2` | 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。（growthFactor 的内部状态）。 |
| `_ids`（内部） | `number[]`；`[]` | 状态由 `push`、`updateAt`、`updateInstanceData`、`clear` 读取或维护；完整处理见对应函数。 |
| `_pendingMatrices`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `updateAt`、`onRawChange`、`updateInstanceData`、`clear` 读取或维护；完整处理见对应函数。 |
| `_pendingStyles`（内部） | `按初始化值推断`；`new Set<number>()` | 状态由 `updateAt`、`onRawChange`、`updateInstanceData`、`clear` 读取或维护；完整处理见对应函数。 |
| `_local`（内部） | `Mat3`；`new Mat3()` | 状态由 `writeMatrix` 读取或维护；完整处理见对应函数。 |
| `_world`（内部） | `Mat3`；`new Mat3()` | 状态由 `writeMatrix` 读取或维护；完整处理见对应函数。 |
| `_effects`（内部） | `EffectData[]`；`[]` | 状态由 `effectAt`、`clear`、`writeStyle` 读取或维护；完整处理见对应函数。 |
| `_sources`（内部） | `(TextureInput \| undefined)[][]`；`[]` | 状态由 `clear`、`setSources`、`updateTextureLayers`、`writeLayers` 读取或维护；完整处理见对应函数。 |
| `_textures`（内部） | `readonly TextureLayers[]`；`[ new TextureLayers(), new TextureLayers(), new TextureLayers(), ]` | 三套独立图片层表；普通 Mesh 在相同绑定位置只使用一层。（textures 的内部状态）。 |
| `_layerIndices`（内部） | `Map<TextureInput \| undefined, number>[]`；`[ new Map<TextureInput \| undefined, number>(), new Map<TextureInput \| undefined, number>(), new Map<TextureInput \| undefined, number>(), ]` | 状态由 `clear`、`updateTextureLayers`、`writeLayers` 读取或维护；完整处理见对应函数。 |
| `_layersPending`（内部） | `boolean`；`false` | 状态由 `clear`、`setSources`、`updateTextureLayers` 读取或维护；完整处理见对应函数。 |
| `_instanceBounds`（内部） | `MeshBoundingBox \| null`；`null` | 状态由 `aggregateBounds` 读取或维护；完整处理见对应函数。 |
| `_boundsGeometry`（内部） | `Geometry2d \| undefined`；`由构造参数或初始化过程赋值` | 状态由 `aggregateBounds` 读取或维护；完整处理见对应函数。 |
| `_boundsGeometryVersion`（内部） | `number`；`-1` | 状态由 `aggregateBounds` 读取或维护；完整处理见对应函数。 |
| `_boundsMatrixVersion`（内部） | `number`；`-1` | 状态由 `aggregateBounds` 读取或维护；完整处理见对应函数。 |
| `_boundsZoom`（内部） | `number`；`Number.NaN` | 状态由 `aggregateBounds` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(data: Geometry2d, material: Material2d, options: IMeshOptions = {})
```

创建对象并建立初始状态及依赖关联。

```ts
const iMesh = new IMesh(data, material, options);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override get boundingBox(): MeshBoundingBox \| null`  | 全部实例共用的整体包围盒；空实例集合返回 null。 |
| `override getRenderBoundingBox(camera: CameraLike): MeshBoundingBox \| null`  | 含 ignoreZoom 补偿的实例整体范围。 |
| `aggregateBounds(zoom: number): MeshBoundingBox \| null` （内部） | 共享局部范围及所有实例的世界并集。 |
| `effectAt(index: number): EffectData \| undefined`  | 已同步的纯数据效果；raw=false 不持有 Style 引用。 |
| `get raw(): boolean`  | 是否订阅原始记录。 |
| `get raws(): Raws`  | 原始记录按稳定 ID 查询；raw=false 时 Map 为空。 |
| `get growthFactor(): number`  | 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。 |
| `set growthFactor(value: number)`  | 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。 |
| `override get capacity(): number`  | 已分配的槽数，不等于有效条数 count。 |
| `set capacity(value: number)`  | 显式预留容量；不缩容、不丢弃记录。GPU 限制在 Render 上传前校验。 |
| `override get textures(): readonly TextureLayers[]`  | 三套独立图片层表；普通 Mesh 在相同绑定位置只使用一层。 |
| `push(options: RawOptions = {}): number`  | 按 push 顺序绘制，返回 ID 而非槽位。raw=false 冻结本次调用时的世界矩阵。 |
| `updateAt(index: number, options: RawOptions): void`  | 手动完整覆盖一个槽位，省略值使用默认值，不是局部 patch。 raw=false 不建立订阅，按当前 IMesh 世界矩阵重新计算这个槽位。 |
| `onRawChange(record: Raw, change: RawChange): void`  | 变化只登记槽位；共享 Style 可以通知多个记录，不同步上传 GPU。 |
| `override onMathChange(source: VersionedMath, field: string): void`  | 只在受管模式下由父级世界矩阵变化安排全体矩阵重算。 |
| `override updateInstanceData(): void`  | 按待处理槽位打包，静止帧不重新分配数组；世界矩阵仅储存一份。 |
| `clear(): void`  | 清空记录并解绑，保留已分配 CPU 容量供后续 push 使用。 |
| `override dispose(): void`  | 解除原始记录、贴图层表和资源订阅，不销毁共享几何、材质或图片。 |
| `ensureCapacity(count: number): void` （内部） | 容量不足时扩展实例连续数组，保留已有记录及其下标。 |
| `resolve(options: RawOptions): Required<RawOptions>` （内部） | 将输入参数转换为本次实例记录使用的完整值。 |
| `writeMatrix(index: number, values: Required<RawOptions> \| Raw): void` （内部） | 计算指定实例的世界矩阵并写入连续矩阵数组。 |
| `writeStyle(index: number, style: Style, enabled: boolean): void` （内部） | 将指定实例的样式打包到连续样式数组。 |
| `setSources(index: number, style: Style): void` （内部） | 记录实例的贴图来源，供图层表建立和更新使用。 |
| `updateTextureLayers(): void` （内部） | 图片引用变化时才重建去重层表，避免反复换图后无限积累废弃层。 |
| `writeLayers(index: number): void` （内部） | 将贴图层号写入对应实例的样式记录。 |
| `assertActive(): void` （内部） | 拦截销毁后复用。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ValidateOptions` | 检查实例化配置，避免无效容量参数进入分配流程。 |

```ts
ValidateOptions(options);
```

### 类型索引

`IMeshOptions`

### 导出关系

```ts
export default IMesh;
export type { RawOptions } from "../Raws";
export type { IMeshOptions };
```

## 3. 其他源码文件

## 4. 注意事项

- 稳定 ID 与数组槽位分开；raw=false 不保留可变输入引用。整批共用一个包围盒和一个几何模板。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- 每个有效实例槽位保存 Bloom/Shadow 的纯值快照，供后处理按相同参数合批；raw=false 不因此持有 Style/Color 引用。全槽位同组时仍使用一次 instanced draw。
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">实例 批次 冻结 连续缓冲 包围盒</keywords>
<keywords language="en">instance batch frozen buffer bounding box</keywords>
```
