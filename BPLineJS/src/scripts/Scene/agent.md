# 场景 Scene

目录：`bplinejs/src/scripts/Scene`

## 1. 文件结构与作用

资源归属列表、视口筛选和世界四叉树。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 场景对象 作为场景树的根级容器使用 |
| `QuadTree.ts` | 场景整体范围作为根；跨分区物体留在父节点，不重复绘制。 |
| `Spatial.ts` | 空间缓存只保存 CPU 引用，资源列表与深度排序仍由完整 drawList 管理。 |

## 2. index 入口、案例与类接口

### Scene

场景对象
作为场景树的根级容器使用

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Scene"` | 对象类型 |
| `_listsSnapshot`（内部） | `number`；`-1` | CPU 四个列表与贴图列表分别处理到的版本快照，不是额外版本源。 |
| `_box`（内部） | `Camera \| null`；`null` | 视口包围盒筛选相机，null 表示关闭。（box 的内部状态）。 |
| `_quad`（内部） | `Camera \| null`；`null` | 四叉树查询相机，null 表示关闭。（quad 的内部状态）。 |
| `_quadTreeDepth`（内部） | `number`；`2` | 根区域向下分区的层数，默认 2。（quadTreeDepth 的内部状态）。 |
| `_spatial`（内部） | `SceneSpatial`；`new SceneSpatial()` | 状态由 `box`、`quad`、`quadTree`、`updateSpatialLists` 读取或维护；完整处理见对应函数。 |
| `_spatialMode`（内部） | `"box" \| "quad" \| null`；`null` | 状态由 `box`、`quad`、`updateSpatialLists` 读取或维护；完整处理见对应函数。 |
| `boxDrawList`（公开） | `DrawList[]`；`[]` | 视口筛选的有序 Mesh/IMesh 子集，由 Render 更新。 |
| `quadDrawList`（公开） | `DrawList[]`；`[]` | 四叉树区域查询的有序子集，由 Render 更新。 |
| `_textureSnapshot`（内部） | `number`；`-1` | 状态由 `updateResourceLists`、`updateTextureList` 读取或维护；完整处理见对应函数。 |
| `_materialGeometryTypes`（内部） | `按初始化值推断`；`new Map<number, Set<string>>()` | 当前 Scene 中材质实际搭配的几何类型，不使用材质历史类型创建闲置模板。 |
| `drawList`（公开） | `DrawList[]`；`[]` | 当前绘制列表 |
| `geometryList`（公开） | `GeometryList[]`；`[]` | 当前场景使用的去重 Geometry 列表。 多个 Mesh 共用同一 Geometry 时只保留一个对象引用。 |
| `materialList`（公开） | `MaterialList[]`；`[]` | 当前场景使用的去重 Material 列表。 Material 对象同时提供 id 和 key，分别用于资源销毁与 Pipeline 复用。 |
| `textureList`（公开） | `TextureList[]`；`[]` | 当前场景使用的去重 Texture 列表。 |

#### 构造与案例

```ts
constructor()
```

创建场景对象

```ts
const scene = new Scene();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get box(): Camera \| null`  | 视口包围盒筛选相机，null 表示关闭。 |
| `set box(value: Camera \| null)`  | 无返回值，开启后关闭 quad。 |
| `get quad(): Camera \| null`  | 四叉树查询相机，null 表示关闭。 |
| `set quad(value: Camera \| null)`  | 无返回值，开启后关闭 box。 |
| `get quadTreeDepth(): number`  | 根区域向下分区的层数，默认 2。 |
| `set quadTreeDepth(value: number)`  | 无返回值，下次渲染重建分区。 |
| `get quadTree(): QuadTree \| null`  | 最近渲染阶段建立的场景四叉树。 |
| `quadTreeUpdate(): void`  | 无返回值，立即根据当前物体包围盒重建分区。 |
| `updateSpatialLists(force: boolean = false): void`  | 无返回值，由 Render 在矩阵更新后调用。 |
| `getRenderDrawList(): DrawList[]`  | 本次渲染的有序子集；资源与选择仍使用完整 drawList。 |
| `ensureLists(): DrawList[]`  | 版本变化后统一重建四个列表；一个 Render 处理后不影响其他 Render 的缓存快照。 |
| `addToLists(child: AddObject): void`  | 将新加入场景的节点及其后代增量写入四个列表。 该方法只负责补充引用；删除节点时由 removeFromLists 处理共享资源校准。 |
| `removeFromLists(child: AddObject): void`  | 从 drawList 中移除节点及其后代包含的 Mesh。 资源可能仍被其他 Mesh 共用，因此只标记下一帧重建另外三个资源列表。 |
| `updateLists(): DrawList[]`  | 一次递归更新场景的 Mesh、Geometry、Material 和 Texture 四个列表。 Geometry、Material 与 Texture 按全局 ID 去重，供 Render 创建和回收缓存。 |
| `updateResourceLists(): void`  | 根据当前 drawList 重建 Geometry、Material 和 Texture 三个资源列表。 资源按全局 ID 去重，避免删除共享资源时误伤仍在场景中的 Mesh。 |
| `updateDrawList(): DrawList[]`  | 更新绘制列表及其关联资源列表。 保留原方法名，现有调用会同步更新全部四个列表。 |
| `updateTextureList(): TextureList[]`  | 根据材质列表单独刷新 Texture 列表。 适用于只替换 Style 中 solid、edge、points.texture 的普通渲染帧。 |
| `getMaterialGeometryTypes(materialId: number): ReadonlySet<string>`  | 获取当前场景中一个材质实际使用的几何类型，供 materialList 创建管线。 |
| `addMaterialGeometryType(materialId: number, geometryType: string): void` （内部） | 记录一个实际 Mesh 的材质与几何类型组合。 |
| `updateDrawOrder(): void`  | 更新场景绘制顺序。 仅按照 Mesh 的 order 从小到大重新排列 drawList，不重建其他资源列表。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetMeshTextures` | 获取网格使用的单层图片或实例层表；列表由调用者按 ID 去重。 |
| `HaveSameTextureIds` | 比较两个贴图列表是否包含相同 ID。 |

```ts
GetMeshTextures(mesh);
```

### 类型索引

`DrawList`、`GeometryList`、`MaterialList`、`TextureList`、`SceneLike`

### 导出关系

```ts
export default Scene;
export { default as QuadTree } from "./QuadTree";
export type { QuadTreeEntry } from "./QuadTree";
export type { DrawList, GeometryList, MaterialList, SceneLike, TextureList };
```

## 3. 其他源码文件

### 文件：QuadTree.ts

### QuadTree

场景整体范围作为根；跨分区物体留在父节点，不重复绘制。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `bounds`（公开） | `MeshBoundingRect`；`由构造参数或初始化过程赋值` | 根区域（构造参数引用）。 |
| `depth`（公开） | `number`；`由构造参数或初始化过程赋值` | 可向下划分层数（构造参数引用）。 |
| `_items`（内部） | `QuadTreeEntry[]`；`[]` | 状态由 `insert`、`query` 读取或维护；完整处理见对应函数。 |
| `_children`（内部） | `按初始化值推断`；`new Map<number, QuadTree>()` | 状态由 `insert`、`query` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(bounds: MeshBoundingRect, depth: number)
```

四叉树。

```ts
new QuadTree(bounds, 2);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `insert(entry: QuadTreeEntry): void`  | 无返回值，每个物体只存放一次。 |
| `query(bounds: MeshBoundingRect, result: Set<MeshLike>): void`  | 无返回值。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IntersectsBounds` | 是否相交或接触。 |

```ts
IntersectsBounds(a, b);
```

### 类型索引

`QuadTreeEntry`

### 导出关系

```ts
export default QuadTree;
export { IntersectsBounds };
export type { QuadTreeEntry };
```

### 文件：Spatial.ts

### SceneSpatial

空间缓存只保存 CPU 引用，资源列表与深度排序仍由完整 drawList 管理。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_entries`（内部） | `按初始化值推断`；`new Map<MeshLike, QuadTreeEntry>()` | 状态由 `update`、`boxList`、`quadList`、`remove` 读取或维护；完整处理见对应函数。 |
| `_tree`（内部） | `QuadTree \| null`；`null` | 最近一次根据场景包围盒构建的树。（tree 的内部状态）。 |
| `_depth`（内部） | `number`；`-1` | 状态由 `update`、`remove` 读取或维护；完整处理见对应函数。 |
| `_queryStamp`（内部） | `string`；`""` | 状态由 `update` 读取或维护；完整处理见对应函数。 |
| `_queryOrder`（内部） | `readonly MeshLike[]`；`[]` | 状态由 `update`、`remove` 读取或维护；完整处理见对应函数。 |
| `_queryVersions`（内部） | `按初始化值推断`；`new Map<MeshLike, string>()` | 状态由 `update`、`remove` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get tree(): QuadTree \| null`  | 最近一次根据场景包围盒构建的树。 |
| `update(meshes: readonly MeshLike[], camera: Camera, depth: number, force: boolean, useQuadTree: boolean): boolean`  | 是否需要刷新当前绘制子集。 |
| `boxList(meshes: readonly MeshLike[], camera: Camera): MeshLike[]`  | 视口与包围盒相交的物体，顺序保持不变。 |
| `quadList(meshes: readonly MeshLike[], camera: Camera): MeshLike[]`  | 四叉树视口查询结果，跨区物体去重并保留绘制顺序。 |
| `remove(ids: ReadonlySet<number>): void`  | 无返回值，立即清理索引引用。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `IsFiniteBounds` | 是否能安全参与空间比较。 |
| `SameBounds` | 四个数值是否相同。 |
| `UnionBounds` | 整体包围盒，空场景为 null。 |
| `ViewportBounds` | 旋转/父级变换之后的世界视口轴向范围。 |
| `ExpandBounds` | 保守扩展的范围。 |
| `Visible` | 是否接触当前视口。 |
| `MeshPadding` | Shader 外扩边框和点型的保守世界半径。 |
| `MeshMargin` | 按几何与实例样式版本缓存的外扩尺寸。 |
| `GeometryMargin` | 外扩连接倍率及点型半径缓存。 |

```ts
IsFiniteBounds(bounds);
```

### 类型索引

`MeshExtent`、`GeometryExtent`

### 导出关系

```ts
export default SceneSpatial;
```

## 4. 注意事项

- box/quad 互斥；四叉树根来自 Scene 世界包围盒，相机只查询。实体变化更新索引，相机平移或旋转保留普通实体树。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- IMesh 的空间筛选使用整批实例的聚合包围盒，不逐个实例分树。
- 四叉树根区域来自场景实体的包围盒并集；相机只查询可见区域。box/quad 子集不能替代完整 drawList 的资源收集或深度排序。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">场景 视口 包围盒 四叉树 区域 筛选</keywords>
<keywords language="en">scene viewport bounding quadtree region culling</keywords>
```
