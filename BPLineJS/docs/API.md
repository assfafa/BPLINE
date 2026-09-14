# BPLineJS API

本文档对应 `bplinejs@0.0.1`。除特别说明外，类和类型都可以从 `bplinejs` 总入口导入；默认导入可使用相应目录子路径。

## ObjectNode

所有场景节点的变换基类，构造参数为 `new ObjectNode(x, y)`。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `readonly number` | 全局自增对象 ID |
| `type` | `readonly string` | 固定为 `ObjectNode`，子类覆盖 |
| `parent` | `AddObject \| null` | 父节点 |
| `position` | `Vec2` | 本地位置；分量或对象变化自动增加版本 |
| `rotation` | `number` | 本地旋转弧度；修改时自动增加版本 |
| `scale` | `Vec2` | 本地缩放；替换对象时自动标脏 |
| `matrix` | `Mat3` | 本地矩阵 |
| `worldMatrix` | `Mat3` | 世界矩阵 |
| `order` | `number` | 绘制顺序，加入 Scene 后修改增加 Scene 版本 |
| `version` | `readonly number` | 节点输入版本，消费者各存快照 |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `updateVersion()` | `void` | 手动提交节点输入变化；正常 setter 自动处理 |
| `ensureMatrix()` | `Mat3` | 按输入版本生成本地矩阵 |
| `ensureWorldMatrix()` | `Mat3` | 先更新祖先，再根据输入和父矩阵版本更新自身 |
| `onMathChange(source, field)` | `void` | 数学对象订阅通知入口 |
| `dispose()` | `void` | 最终解绑数学对象订阅，不删除场景节点 |
| `updateMatrix()` | `Mat3` | 强制按变换参数生成本地矩阵，覆盖手动矩阵 |
| `updateWorldMatrix()` | `Mat3` | 强制更新世界矩阵，保留参数未变化时显式指定的本地矩阵 |

Vec2 的 x/y、set/setX/setY、data 整体赋值及算术方法自动通知 ObjectNode。手动修改 Mat3 的方法也会通知，Mat3.data 整体赋值会同步 GPUData；不要绕过 TS 只读类型直接修改 data[index]。

## Group

继承 `ObjectNode`，构造参数为 `new Group(x, y)`。

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `children` | `AddObject[]` | 直接子节点列表 |
| `add(child)` | `void` | 添加或迁移子节点，并同步所属 Scene 列表 |
| `removeSelf()` | `boolean` | 从父组删除自己 |
| `removeChild(child)` | `boolean` | 删除一个直接子节点 |
| `removeAll()` | `void` | 删除全部直接子节点 |
| `updateWorldMatrix()` | `Mat3` | 更新自身并递归更新后代世界矩阵 |

## Scene

继承 `Group`，是场景树根节点，构造方式为 `new Scene()`。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `version` | `readonly number` | Scene 单一版本，继承 ObjectNode；结构/资源/order 变化时递增 |
| `drawList` | `MeshLike[]` | 当前可绘制 Mesh 列表 |
| `geometryList` | `Geometry2d[]` | 按 ID 去重的 Geometry 列表 |
| `materialList` | `Material2d[]` | 按 ID 去重的 Material 列表 |
| `textureList` | `TextureLike[]` | 按 ID 去重的 Texture 列表 |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `addToLists(child)` | `void` | 增量加入节点及后代资源 |
| `removeFromLists(child)` | `void` | 删除节点及后代 Mesh 引用 |
| `ensureLists()` | `MeshLike[]` | 版本落后才更新 CPU 列表 |
| `updateLists()` | `MeshLike[]` | 强制重建四个场景列表并提交版本 |
| `updateResourceLists()` | `void` | 根据 drawList 重建资源列表 |
| `updateDrawList()` | `MeshLike[]` | 递归重建绘制列表和资源列表 |
| `updateTextureList()` | `TextureLike[]` | 根据材质资源变化更新贴图列表 |
| `getMaterialGeometryTypes(materialId)` | `ReadonlySet<string>` | 当前场景中该材质实际使用的几何类型，只读集合供管线准备 |
| `updateDrawOrder()` | `void` | 按 `order` 从小到大排序 |

## Camera

继承 `ObjectNode`，构造方式为 `new Camera(width = 100, height = 100, zoom = 1)`。相机不允许添加子节点。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `width` / `height` | `number` | 正交视口尺寸，修改后增加相机版本 |
| `zoom` | `number` | 相机缩放，修改后投影矩阵标脏 |
| `top` / `left` / `bottom` / `right` | `readonly number` | 当前正交边界 |
| `orthogonalMatrix` | `Mat3` | 正交投影矩阵 |
| `viewMatrix` | `Mat3` | 视图矩阵 |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `setViewport(width, height)` | `void` | 同时设置视口尺寸 |
| `updateOrthogonalMatrix()` | `Mat3` | 强制重建投影矩阵 |
| `updateViewMatrix()` | `Mat3` | 强制重建视图矩阵 |
| `updateCameraMatrix()` | `void` | 强制更新两组相机矩阵 |
| `ensureCameraMatrix()` | `void` | 按输入和世界矩阵快照更新；支持父级变换 |

## Color

`new Color(hex = "#ffffff")`。字符串支持 #RGB、#RGBA、#RRGGBB、#RRGGBBAA；数字按 0xRRGGBB 解释。未带 alpha 时设为 1，不做颜色空间转换。

| 成员 | 说明 |
| --- | --- |
| `r / g / b / a` | getter/setter，归一化分量，有限值钳制到 0 到 1 |
| `setRGB(r, g, b)` | 保留当前 alpha，原子更新并只通知一次，返回 this |
| `setRGBA(r, g, b, a = 1)` | 原子更新 RGBA；非有限值抛错且不修改颜色，返回 this |
| `setHex(hex)` | 十六进制设置，返回 this |
| `toHex(alpha = false)` | 返回 #rrggbb 或 #rrggbbaa |
| `copy(color) / clone()` | 复制数值 / 新建独立颜色，不复制订阅关系 |
| `writeTo(target, offset = 0)` | 写入调用者 Float32Array，offset 是分量偏移，返回目标数组 |
| `add(subscriber, field = "color")` | 登记 ColorSubscriber，同一对象不同字段分别关联 |
| `delete(subscriber, field?)` | 解除字段订阅，省略 field 解除该对象全部订阅 |

内部数组不开放可变引用；颜色分量 setter 会自动通知，不再需要手动更新材质版本。ColorSubscriber 实现 `onColorChange(color, field)`。

## Style

`new Style()` 构建四个分区并登记本体。分区引用只读，内部一级参数均通过 getter/setter 修改。

| 成员 | 说明 |
| --- | --- |
| `solid` | SolidStyle，实体面与自身 SDF 边框 |
| `wireframe` | WireframeStyle，原生 line-list |
| `edge` | EdgeStyle，三角面实体边框 |
| `points` | PointsStyle，关键点 |
| `version` | 只读，任意分区变化递增 |
| `add(subscriber) / delete(subscriber)` | 登记 / 解除 StyleSubscriber，不销毁资源 |
| `dispose()` | 所有使用者停止使用后，释放四个分区与 Color 的整条订阅链，不销毁共享贴图或颜色；不应再复用 |
| `onPartChange(area, field)` | 分区通知入口，向所有订阅者转发区域及字段 |

StyleSubscriber 实现 `onStyleChange(change)`。change 包含只读的 source（Style）、area（solid/wireframe/edge/points/whole）、field。协议不限定订阅者为 Geometry 或 Material，未来 IMesh 可直接实现。whole 为保留的全量替换区域，当前 style setter 自行全量失效。

### 四个样式分区

所有分区继承 enabled=false、color=独立白色 Color、opacity=1，opacity 作用于该分区最终输出 alpha。各分区另有只读 area，以及 add/delete/onColorChange 通知方法。enabled 互不排斥，不再使用 lineRenderMode。

| 类 | 特有参数及默认值 |
| --- | --- |
| SolidStyle | texture=undefined；addressModeU/V=repeat；borderColor=独立黑色；borderWidth=0（SDF）；borderAlign=normal；pixelAligned=px |
| WireframeStyle | 无附加参数；原生线不提供宽度、贴图或像素模式 |
| EdgeStyle | texture=undefined；addressModeU=repeat、addressModeV=clamp-to-edge；width=1；borderAlign=normal；pixelAligned=px；uvRepeat=1 |
| PointsStyle | texture=undefined；addressModeU/V=clamp-to-edge；pixelAligned=px；radius=2；segments=4；vertices=true；midpoints=false；minPointsLength=6；minEdgePointsLength=4 |

BorderAlign 为 inset/normal/outset。PixelAligned 为 px（固定屏幕像素）或 zoom（跟随相机缩放）。宽度、半径和 UV 重复次数钳制为非负有限值；segments 要求至少 3 的安全整数。非有限值抛错，非法枚举抛错。

points.enabled 是总开关，vertices/midpoints 选择点位来源。二者都关闭时不生成点型，开发模式给出提示。顶点阈值检查相邻边长度之和，边中点阈值检查单条边长度，均为严格大于。

```ts
const style = new Style();
style.edge.enabled = true;
style.edge.width = 10;
style.edge.color.setHex("#ff8800");
style.points.enabled = true;
style.points.midpoints = true;
const geometry = new Rect2d({ width: 100, height: 60, radius: 0, style });
const material = new BaseMaterial(style);
const mesh = new Mesh(geometry, material, style);
```

Geometry / Material 的 style setter 先解绑旧对象，再绑定新对象并更新自身版本。Geometry 仅响应 enabled、edge 的 width/borderAlign/uvRepeat、points 的点位选择/尺寸/阈值等生成字段，颜色变化不重建 CPU 数组。Material 响应所有分区变化，通过通知 Mesh 标记下帧工作；Scene 不再逐帧扫描材质版本。每个 Render 仍独立比较 GPU 缓存版本。

SolidStyle、EdgeStyle、PointsStyle 通过 `onTextureChange(texture)` 接收贴图内部变化，再转发 `field="textureData"`。替换 texture 引用则通知 `field="texture"`，两者分开以避免无关的样式数组上传和资源列表重建。dispose 会解绑 Texture 和 Color，不销毁它们。

最终不用的 Geometry / Material 调用 dispose 解除强引用订阅；仅从 Scene 移除不应解绑，Render.destroyGeometry/destroyMaterial 也只清理 GPU 缓存。不要继续使用已 dispose 的对象。

## Geo

几何体基类，保存 CPU 数组并以版本号驱动 Render 缓存更新。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` / `type` | `readonly number` / `readonly string` | 几何体身份和类型 |
| `geometry` | `Float32Array \| undefined` | 合并的实体面、宽边框、关键点二维顶点；替换数组会递增版本 |
| `normal` | `Float32Array \| undefined` | 合并顶点的二维法线 |
| `uv` | `Float32Array \| undefined` | 合并顶点的 UV，各分区保留原映射 |
| `index` | `Uint16Array \| Uint32Array \| undefined` | 合并三角面索引，按合并后的顶点偏移重定位 |
| `linePoints` | `GeoPartDataLike \| undefined` | 原生 `line-list` 数据 |
| `vertexType` | `Float32Array \| undefined` | 每顶点一个值：0 实体面、0.5 宽边框、1 关键点，不改变对象的 `type` |
| `position` | `Float32Array \| undefined` | 与 geometry 等长的逐顶点关键点中心，其他类型填 0 |
| `miterScale` | `Float32Array \| undefined` | 每顶点一个宽边框连接倍率，其他类型填 1 |
| `uniformData` | `readonly Float32Array` | Geometry Shader 参数 |
| `version` | `readonly number` | 参数或 CPU 数据变化的唯一版本 |
| `style` | `Style` | 共享样式引用，setter 自动解绑、绑定并递增几何版本 |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `updateVersion()` | `void` | 递增版本，通知 CPU 生成器和 GPU 缓存 |
| `ensureGeometry()` | `this` | CPU 缓存版本不同才生成数组 |
| `updateGeometry()` | `this` | 强制生成并提交新版本；子类应先生成数组 |
| `onStyleChange(change)` | `void` | 按区域和字段筛选几何生成依赖 |
| `add(subscriber) / delete(subscriber)` | `void` | 登记或解绑 GeometrySubscriber，回调为 onGeometryChange(geometry)，重复 add 自动去重 |
| `dispose()` | `void` | 最终停止使用时解除 Style 订阅，不清理 GPU |

几何体只有一个变化版本；内部保存 CPU 已生成版本，各 Render 保存 GPU 已上传版本，都是同一版本的缓存快照。参数可连续修改，渲染前由 `ensureGeometry()` 统一生成。手动调用 `updateGeometry()` 后，所有 Render 仍能检测到数据变化。

## Rect2d

继承 `Geo`，构造方式为 `new Rect2d(options = {})`，公开参数类型为 `Rect2dOptions`。

| 构造参数 | 默认值 | 说明 |
| --- | --- | --- |
| `width` / `height` | `1` | 矩形宽高，显式的 0 会保留 |
| `radius` | `1` | 圆角半径，限制到半宽、半高的较小值 |
| `style` | `new Style()` | 四个分区默认关闭，显式共享给 Geometry 与 Material |

四个样式分区可以独立开启；没有启用分区时不生成可绘制几何。旧的 solid/edge/wireframe/points 等构造选项已移除，改用 style 分区。

点位依据实际离散 line-list 生成，圆角采样点也属于顶点。所有三角面按实体面、宽边框、关键点顺序合并到 `geometry`，原 `lineGeometry`、`pointsGeometry` 已移除。关键点顶点通过 `geometry - position` 获取局部偏移，UV 独立归一化。合并顶点超过 Uint16 范围时索引自动使用 Uint32Array。任意几何参数版本变化时，全量重新生成合并数组和 GPU 几何缓存。

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `width` | `number` | 矩形宽度，修改后递增版本 |
| `height` | `number` | 矩形高度，修改后递增版本 |
| `radius` | `number` | 圆角半径，更新时自动限制到合法范围 |
| `perimeter` | `readonly number` | 与离散圆角轮廓一致的周长 |
| `updateGeometry()` | `this` | 全量生成合并三角面和可选原生线框 |

## Poly2D

继承 `Geo`，构造方式为 `new Poly2D(points, style?, options?)`，从总入口或 `bplinejs/Geometry/Poly2D` 导入。

| 构造参数 | 类型及默认值 | 说明 |
| --- | --- | --- |
| `points` | `Float32Array`，默认空数组 | 有序单轮廓 `[x,y,x,y,...]`，复制输入且不自动居中；闭合不足三个、开放不足两个节点时返回空几何，不报错 |
| `style` | `Style \| null \| undefined` | 可传空，内部创建四个显示分区全部关闭的 Style |
| `options.closed` | `boolean = true` | 是否连接首尾；开放路径禁止开启 solid |

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `points` | `Float32Array` | setter 复制输入并递增版本；直接修改 getter 返回数组的元素后，需要调用 updateVersion 或 updateGeometry |
| `closed` | `boolean` | getter/setter；先关闭 solid 才能设为 false |
| `width` / `height` | `readonly number` | 当前原始轮廓包围盒尺寸，不包含边框和点型外扩 |
| `perimeter` | `readonly number` | 原始中心路径长度，开放路径不含末点到首点 |
| `updateGeometry()` | `this` | 全量重建填充、宽边框、辅助点与可选 line-list；提交单一版本 |

支持简单凹多边形三角剖分，允许自交、接触和回折路径。自交填充无法耳切时，剩余区域使用扇形降级，允许重叠或不规则填充，不保证 Canvas evenodd/nonzero 规则。连续重复节点合并；仍不支持洞或多轮廓。实体 UV 按原始包围盒归一化。宽边框、点型沿用现有 merged geometry 格式和实例化资源，几何版本变化通过 geometryList 重建缓存。

`new Poly2D()` 可以先创建空对象，再通过 `points = new Float32Array(...)` 设置节点；清空同样使用空数组，下一帧释放旧几何缓存。点数不足的中间状态不绘制。非有限数和不完整 x/y 对仍然属于非法输入。

`style.join` 只控制宽边框节点连接，不将实体轮廓改成圆角，不改变原生线框或辅助点位置。开放路径使用平头端点；inset/outset 对闭合路径是内/外侧，对开放路径是沿输入方向的左/右侧。极宽边框遇到狭窄凹口可能自重叠，当前不做轮廓布尔裁剪。

Poly Shader 不使用矩形 SDF；`style.solid.borderWidth` 对 Poly 无效，开发模式会提醒改用 `style.edge`。每个 IMesh 共用一个几何连接模板，Raw 的 join 不会生成另一套拓扑。

## JoinStyle

由 `new Style()` 自动创建，只读引用 `style.join`。也可从总入口、`bplinejs/Style` 或 `bplinejs/Style/JoinStyle` 导入类。

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `type` | `JoinType = "miter"` | getter/setter；miter 尖角、round 圆接、bevel 切角。切角不断开边框 |
| `seg` | `number = 8` | getter/setter；1 到 4096 的整数，仅 round 使用细分精度 |
| `add(subscriber)` / `delete(subscriber)` | `void` | 关联或解绑 PartSubscriber，通常由所属 Style 调用 |
| `dispose()` | `void` | 清理订阅，不销毁其他资源 |

变化经 `JoinStyle → Style → Poly2D → Mesh` 通知，`StyleArea` 增加 `"join"`。Rect2d 忽略 join 的几何重建通知。

## Material

抽象材质基类。`id` 用于资源身份和销毁，`key` 用于共享固定状态相同的 Pipeline。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` / `type` | `readonly number` / `readonly string` | 材质身份和类型 |
| `key` | `readonly string` | Pipeline 缓存键 |
| `version` | `readonly number` | 材质变化版本 |
| `transparent` | `boolean` | 是否启用 Alpha 混合 |
| `cullMode` | `GPUCullMode` | 要剔除的面，默认 `back` |
| `style` | `Style` | 四个独立分区参数的共享来源 |
| `rectVertexShader` / `rectFragmentShader` | `string \| undefined` | 矩形统一三角面着色器源码，按 vertexType 选择面、边框和关键点逻辑 |
| `polyVertexShader` / `polyFragmentShader` | `string \| undefined` | 多边形统一三角面着色器；setter 递增材质版本并更新管线 key |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `updateVersion(kind = "all")` | `void` | 递增唯一版本并同步 key、发通知；手动调用默认全部失效 |
| `updateKey()` | `void` | 根据固定管线状态重建缓存键 |
| `addGeometryType(type)` | `void` | 去重追加几何类型标记，Rect2d 对应 rect、Poly2D 对应 poly；Mesh 自动调用 |
| `getPipelineKey(type)` | `string` | 根据材质 key 与当前几何类型获取最终模板缓存键 |
| `onStyleChange(change)` | `void` | 接收 Style 通知并更新版本 |
| `add(subscriber) / delete(subscriber)` | `void` | 登记或解绑 MaterialSubscriber，回调为 onMaterialChange(change) |
| `dispose()` | `void` | 最终停止使用时解除 Style 订阅 |

独立的 borderVertexShader / borderFragmentShader / pointsVertexShader / pointsFragmentShader 已移除，按几何类型维护 base/rect 和 base/poly 下的合并着色器。Style 的 solid/edge/points.enabled 作为实例样式开关；wireframe.enabled 会改变附加原生线管线的缓存键。

材质所有状态共用一个 `version`。每个 Render 的 `buffers.meshStyle` 按 Mesh ID 保存 `{ meshId, materialId, buffer, capacity, version }`，version 对应打包后的 Mesh.styleVersion。Pipeline 通过包含 Shader 源码的 `key` 复用，颜色或贴图修改无需重新编译 Pipeline。

MaterialChange 含只读 `source`、`style`（是否重打包实例样式）、`resources`（是否刷新场景资源引用或 Pipeline key）。MaterialChangeKind 为 all/style/pipeline/texture/textureData/sampler，是通知影响范围，不是六套版本号。Setter 自动选择范围；通常不用手动传 kind。

## BaseMaterial

`new BaseMaterial(style?)`，继承 Material。配置矩形和多边形两套 Shader，Render 按 Geometry.type 选择独立管线；不重复保存颜色、贴图、透明度、边框宽度等显示值。

group 1：binding 0 为只读 Storage 样式数组，1/2 为 solid.texture/Sampler，3/4 为 edge.texture/Sampler，5/6 为 points.texture/Sampler。
每实例样式占 176 字节：前五个 vec4 分别为 solid.color、solid.borderColor、edge.color、points.color、wireframe.color；接着五个 vec4 为 solid 参数、edge 参数、points 参数、wireframe 参数及四个 enabled；最后一个 vec4 为 solid/edge/points 贴图层号和补位。布局以 Style/WriteStyleData 和 WGSL 中注释为准。

三角面统一一次 DrawCall。原生线框使用独立 line-list，在合并三角面中的关键点之前插入，保留覆盖顺序。
透明混合和 cullMode 仍由 Material 统一控制，不能在同一次绘制中按分区切换。各分区 opacity 与 Color.a 只影响各自最终输出。

旧的 backgroundColor/baseTexture/edgeTexture/pointsTexture/opacity/borderWidth/borderColor/pixelAligned/lineRenderMode 等属性已移除；不要继续向这些名称赋值，使用 Style。

## Texture

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `id` / `type` | `readonly number` / `readonly string` | 贴图身份和类型 |
| `url` | `string \| null` | 来源地址 |
| `source` | `HTMLImageElement \| ImageBitmap \| ImageData \| null` | CPU 图片源 |
| `loaded` | `boolean` | 是否已有可上传来源 |
| `width` / `height` | `number` | 图片尺寸 |
| `version` | `readonly number` | 单一贴图版本，各 Render 保存自己的上传版本 |
| `add(subscriber) / delete(subscriber)` | `void` | 登记或解绑 TextureSubscriber，回调为 onTextureChange(texture) |
| `setSource(source, url?)` | `this` | 使用已存在的图片源 |
| `updateVersion()` | `void` | 原地修改像素后提交变化并通知 |
| `clearSource()` | `this` | 清空来源并递增版本 |
| `load(url)` | `Promise<this>` | 异步加载图片 |

url/source/loaded/width/height 均为 getter/setter。source setter 同步宽高和 loaded；setSource/clearSource 在状态完整后只通知一次。url setter 不发起下载，下载使用 load。width/height 必须为非负整数。图片源内部像素修改无法被 setter 捕获，需要 updateVersion()；它递增 version 并通知，不存在清除版本操作。GPUTextureResourceLike.version 是该 Render 的已上传版本。

## Mesh

继承 `Group`，构造方式为 `new Mesh(geometry, material, style = true)`。true 新建默认 Style（所有分区关闭），false 不创建或覆盖资源已有样式，传 Style 则让 Mesh、Geometry、Material 共用它。

| 公开成员 | 类型或返回值 | 说明 |
| --- | --- | --- |
| `data` | `Geometry2d \| undefined` | getter/setter，替换后同步材质类型标记和场景列表 |
| `material` | `Material2d \| undefined` | getter/setter，替换后同步几何类型标记和场景列表 |
| `init(data, material)` | `this` | 更换 Geometry 和 Material，同步 Mesh.style（如果存在）及 Scene |
| `style` | `Style \\| undefined` | getter/setter，同步当前几何材质；undefined 停止接管而非清除样式 |
| `count / capacity` | `readonly number` | 普通 Mesh 均为 1，分别表示实际绘制数量与已分配容量 |
| `matrixData / styleData` | `readonly Float32Array<ArrayBuffer>` | 两块预分配连续数组，分别为 12 / 44 个 float，不直接修改 |
| `textures` | `readonly (TextureResource \| undefined)[]` | solid/edge/points 三个资源位置；普通 Mesh 为单图，层号固定 0 |
| `matrixVersion / styleVersion` | `readonly number` | 对应打包数组的版本，每个 Render 独立记录上传状态 |
| `updateInstanceData()` | `void` | 世界矩阵计算后调用，更新打包数组和版本，由 Render 自动调用 |
| `geometryPending / materialPending` | `readonly boolean` | 资源通知待处理标记；不代替各 Render 的版本快照 |
| `onGeometryChange(geometry)` | `void` | 几何通知入口，只标记绑定检查，不生成几何 |
| `onMaterialChange(change)` | `void` | 标记实例样式更新，必要时通知 Scene 刷新资源引用 |
| `dispose()` | `void` | 最终停止使用时解绑 Geometry/Material，不销毁共享 CPU 或 GPU 资源 |

Mesh 共享 Geometry 或 Material 时，修改 style 会影响所有引用这些资源的对象。没有复制资源或实现每 Mesh 的覆盖层。普通 Mesh 的 Shader 使用 instance_index=0；多实例使用 IMesh，共用同一套 Storage 和二维数组纹理绑定。

Mesh 自动对当前 Geometry/Material add，替换时 delete 旧引用；通知不反向覆盖 Mesh.style，也不写回资源 Style，避免通知环。updateInstanceData 合并多次通知后打包一次；静止帧不再检查 Style 引用及版本。先从场景移除且确定不复用时再 dispose；单纯 remove 不自动解绑。

## Render

构造方式为 `new Render(containerOrId, renderMode = "development")`。每个 Render 拥有独立 `GPUDevice` 缓存，必须在不再使用时调用 `destroy()`。

| 公开属性 | 类型 | 说明 |
| --- | --- | --- |
| `id` / `type` | `readonly number` / `readonly string` | Render 身份和类型 |
| `container` | `HTMLElement` | Canvas 容器 |
| `canvas` | `HTMLCanvasElement` | WebGPU Canvas |
| `backgroundColor` | `GPUColorDict` | 每帧清屏颜色 |
| `alphaMode` | `GPUCanvasAlphaMode` | 与下层 HTML 的合成方式，默认 `premultiplied` |
| `dpr` | `readonly number` | 当前设备像素比 |
| `renderMode` | `"development" \| "production"` | 是否启用运行时验证 |
| `pipeline` | `PipelineLike` | 当前 Render 的 GPU 缓存集合 |
| `ready` | `readonly Promise<void>` | WebGPU 初始化 Promise；使用 `await render.ready` 等待完成 |

| 公开方法 | 返回值 | 说明 |
| --- | --- | --- |
| `initWebGPU()` | `Promise<void>` | 初始化 Adapter、Device 和 CanvasContext |
| `warmup(scene, camera)` | `void` | 创建或更新缓存，不提交绘制 |
| `render(scene, camera)` | `void` | 预热并绘制场景 |
| `resize()` | `void` | 100ms 防抖更新 Canvas 像素尺寸和 DPR |
| `destroyMesh(meshOrId)` | `boolean` | 手动销毁 Mesh 缓存及可取得的关联资源 |
| `destroyTexture(textureOrId)` | `boolean` | 手动销毁 GPUTexture |
| `destroyMaterial(materialOrId)` | `boolean` | 销毁绑定该材质的所有 Mesh 样式缓冲和可取得的贴图 |
| `destroyGeometry(geometryOrId)` | `boolean` | 手动销毁 Geometry 缓冲 |
| `trim(scene)` | `void` | 根据所有已记录 Scene 引用回收无用缓存 |
| `destroy()` | `void` | 释放全部 GPU 资源、Device 与 Canvas |

`drawBuffers`、`drawTextures`、`drawPipelines`、`drawCall`、`matrixUpdate`、`initScene` 和 `initCamera` 是公开的高级流程步骤，通常由 `warmup`/`render` 统一调度，不建议普通业务拆开调用。

## 高级管理器

以下类从 `bplinejs/Render` 导出，主要供扩展渲染流程使用。它们接收当前 Render 的 `PipelineLike`，不应跨 Render 共享。

geometryList 独立负责几何生成与 GPUBuffer，materialList 负责开发检查及 Pipeline/Sampler，drawList 负责 Mesh 实例缓冲，textureList 负责 GPUTexture。几何先准备，Mesh 再消费通知，不把几何生成工作塞进 Mesh 循环。

| 类 | 公开方法 | 作用 |
| --- | --- | --- |
| `DevelopmentValidator` | `validateCamera`、`validateMaterial`、`validateGeometry`、`validateMesh` | 开发模式运行时检查 |
| `DestroyManager` | `destroyMesh`、`destroyTexture`、`destroyMaterial`、`destroyGeometry`、`trim`、`destroyAll` | GPU 资源销毁与回收 |
| `DrawCallManager` | `draw` | 创建绑定组、RenderPass 并提交绘制 |
| `PipelineManager` | `initResources`、`draw` | 创建 Layout、后备资源与 Pipeline 模板 |
| `SamplerManager` | `get` | 按 U/V 寻址方式复用 Sampler |
| `TextureManager` | `draw`、`createFallbackTexture` | 创建和更新 GPUTexture |

## 公共类型与函数

### IMesh / Raws

`new IMesh(geometry, material, { raw = true, capacity = 2, growthFactor = 2 } = {})` 继承 Mesh，保留资源自己的 Style，不像普通 Mesh 默认创建新 Style。从 `bplinejs/IMesh` 默认导入，或从总入口具名导入。空占位 Styles 及其子路径已删除，改为 `bplinejs/Raws`。

| 公开成员 | 说明 |
| --- | --- |
| `count` | 只读实际条数，初始 0；enabled=false 仍占槽位 |
| `capacity` | getter/setter，预留槽数；只能增大，不能小于 count；不等于倍率 |
| `growthFactor` | getter/setter，整数且至少 2，默认 2 |
| `raw` | 只读，构建时指定是否保留并订阅原始值 |
| `raws` | 只读 Raws 管理器，map 按稳定 ID 查询 Raw，size 为记录数 |
| `push(options?)` | 追加并返回稳定 ID；不是 index |
| `updateAt(index, options)` | 按槽位完整覆盖；不是局部 patch，省略参数恢复默认值 |
| `clear()` | 解绑并移除所有原始值和层引用，count=0，保留容量 |
| `dispose()` | clear 后解绑 Mesh 资源，不销毁共享几何/材质/图片 |
| `textures` | 三套只读 TextureLayers 引用，按 solid/edge/points 排列，由 IMesh 管理层号 |
| `onRawChange(raw, change)` | 内部通知入口，只安排下一帧处理，不创建 GPU 缓存 |
| `updateInstanceData()` | 处理待更新槽位及层号；Render 自动调用 |

RawOptions：`position?: Vec2`（默认原点）、`rotation?: number`（默认 0 弧度）、`scale?: Vec2`（默认 1,1）、`style?: Style`（默认引用当前材质 Style）、`enabled?: boolean`（默认 true）。

受管 Raw 公开只读 id/index/version，以及 position/rotation/scale/style/enabled 的 getter/setter。Vec2、Style 和 Color 内部更新自动通知 IMesh；替换引用解除旧关联。Raw.version 只反映原始值变化，扩容和 GPU 上传不改变它。`Raw.add/delete` 接收 RawSubscriber；`dispose` 解除订阅。Raws.map 为 ReadonlyMap，直接改原始 Map 或调用管理器的内部 add/clear 会破坏 IMesh 槽位关系，业务增删使用 IMesh.push/clear。

默认容量变化为 2→4→8→16，达到 100000 后改为按 100000 批量增长。只在扩容时新建连续内存并复制有效数据；matrixData 每槽 12 个 float（48 字节），styleData 每槽 44 个 float（176 字节）。各 Render 独立比较 matrixVersion/styleVersion，在创建前按 GPUDevice.limits.maxBufferSize/maxStorageBufferBindingSize 检查容量。浏览器没有可靠的剩余显存查询接口，合法大小也不保证内存分配必定成功。

`raw=true` 保留 Raw，矩阵为 IMesh.worldMatrix × Raw 的局部 TRS；父组、IMesh 和 Raw 变化都会安排世界矩阵更新，连续数组不另存局部矩阵。`raw=false` 不保存/订阅 Vec2 和 Style，raws.map 为空；push/updateAt 当时计算的世界矩阵和样式是快照，之后移动父组或 IMesh 也不更新旧槽。updateAt 必须重新传入要使用的完整原始值。图片选择保持快照，但 Texture 自身更新像素仍属于独立资源版本，会正常重传纹理。

一次三角面 drawIndexed 使用 count 个实例，每个实例完整绘制模板的实体/边框/关键点，顺序为 push 顺序。原生 line-list 无法混入 triangle-list，为保留透明层级，模板含 wireframe 时按实例回退为实体→线框→关键点绘制，失去单次实例绘制的收益。

**共用边界：** Raw 独立控制颜色、透明度、分区 enabled、SDF 参数、对齐和 pixelAligned。Geometry 决定已有分区、点型半径/段数/位置选择、实体边框生成宽度及 UV Repeat；Raw 不能生成另一套形状。Material 决定 shader、transparent、cullMode 以及三个分区的 U/V Sampler，不能在同一次绘制中按实例切换这些固定状态。开发模式会提醒受管记录中的冲突。修改 IMesh 继承的 style 属性仍会同步共享几何材质，不是批量替换 Raw.style。

### TextureLayers

从总入口或 `bplinejs/Texture` 具名导出。TextureResource 为 TextureLike | TextureLayers，Scene.textureList 和 Render.destroyTexture 接受该联合类型。

| 公开成员 | 说明 |
| --- | --- |
| `id / type / version` | 只读资源身份、类型和单一版本 |
| `layers` | 只读有序图片表，undefined 为白色层 |
| `set(layers)` | 原子更换有序层表，解绑旧图并订阅新图；相同序列不更新 |
| `onTextureChange(texture)` | 源图变化时递增层组版本，不重打包实例样式 |
| `dispose()` | 清空层表并解绑，不销毁源图或 GPU 缓存 |

IMesh 对每个分区去重并自动分配层号，换图时压缩层表，业务不要自行修改 mesh.textures 内部层表。普通 Mesh/Material 的 Style.texture 仍接收单个 Texture，不需要改为数组；Render 将其上传为只有一层的 texture_2d_array。

同层组格式统一 rgba8unorm，图片缩放到组内最大宽/高，保留整图 UV，不裁切；这可能扩大低分辨率图片占用。未加载、无源图片使用同尺寸白色占位，不移动层号。限制由 maxTextureArrayLayers/maxTextureDimension2D 校验，超出直接报错，不静默漏图。TextureLayers 不持有 GPU 资源，多 Render 分别缓存。显式 destroyTexture(源图) 会销毁引用它的层组，下次 warmup 重建；trim 只销毁没有场景引用的数组资源。

总入口同时导出 `GETID()`、`AddObject`、`Geometry2d`、`Material2d`、各类 `*Like` 接口、WebGPU 缓存接口以及 `BorderAlign`、`PixelAligned`、`RenderMode` 等联合类型。`GETID()` 返回全局只增不减的数字 ID。
## 版本迁移说明

### CPU 缓存索引与绑定复用

`render.pipeline.buffers.meshMatrix` 由数组改为 `Map<number, MeshMatrixBufferLike>`，以 Mesh ID 查询：`meshMatrix.get(mesh.id)`。遍历使用 `meshMatrix.values()`，数量使用 `meshMatrix.size`。此修改不影响 Mesh / IMesh 的 `matrixData`，GPU 上传仍使用连续 Float32Array。

矩阵缓存和样式缓存的可选 `bindGroup` 是 Render 内部绑定快照，不需要业务维护。稳定帧和原缓冲的数值更新复用已有绑定；缓冲扩容、几何重建、纹理视图、Sampler 或 Layout 替换时自动重建。手动 destroy 和 trim 同时释放相关引用，BindGroup 本身没有 destroy 方法。

`material.getPipelineKey(type)` 返回缓存的完整 key；实际管线 key 改变时失效。颜色等不改变管线配置的更新不会清除此缓存。

### 深度状态与层级

Material / BaseMaterial 增加 `depthTest: boolean = false`、`depthWrite: boolean = false`，均为 getter/setter。改变时更新材质版本及 Pipeline key，不更改 transparent。IMesh 不会自动开启它们。

- 不透明物体一般开启测试和写入；从 drawList 末尾向前提交，但逻辑层级不变。
- 开启测试但不写入的物体，以及 transparent=true 的测试物体，按 drawList 正序提交；通常透明物体应关闭写入。
- 关闭测试的对象最后作为覆盖层正序绘制，不受场景已有深度遮挡。所有对象均使用默认值时保持原有画家顺序。
- 同一 IMesh 使用材质统一深度状态；实例层级仍按 push 顺序。倒序优化由 Shader 反读实例索引实现，不重排 Raw 或连续数组。
- 比较函数固定为 less-equal，同一实例的实体、边框、点位允许互相覆盖。透明度为零的片元 discard，不写颜色或深度；半透明片元不会自动跳过深度写入。

`DepthManager` 从总入口和 Render 目录导出，也可默认导入 `bplinejs/Render/DepthManager`。构造参数为 `PipelineLike`。

| 方法 / 缓存 | 说明 |
| --- | --- |
| `prepare(scene): void` | 根据已排序列表生成每个 Mesh 的层级参数，仅变化时上传 |
| `ensureTexture(width, height): DepthTextureLike \| undefined` | 按物理像素尺寸复用 depth32float 纹理，设备未准备时返回 undefined |
| `DrawCallManager.prepare(width, height): void` | warmup 预备附件，不提交命令 |
| `pipeline.buffers.meshDepth` | `Map<number, MeshDepthBufferLike>`，以 mesh.id 索引 16 字节 uniform |
| `pipeline.depthTexture` | 可选 `DepthTextureLike`，含 texture/view/width/height，由 Render 管理 |

深度为 `1 - (rank + 1) / 16777216`，rank 是原队列中所有实例槽位的连续下标，不是 order 数字本身。每个 Scene 上限为 16777215 槽位（禁用槽位也计数）；超出明确报错。深度清空值为 1，每帧重新生成附件内容。

自定义顶点 Shader 需同步新的 `@group(0) @binding(5)` uniform：四个 u32 分别是 base、count、reverse、padding。reverse 非零时，先将 instance_index 转成 `count - 1 - instance_index`，再用它读取矩阵、样式和计算深度；传给片段的索引也必须是转换后的值。参考内置矩形和 line 顶点 Shader。

`destroyMesh` / `trim` 回收对应 meshDepth；`destroyAll` 销毁所有深度缓冲与深度纹理。资源仍属于单个 Render，不存放到共享 Scene 或 Material。

ObjectNode、Scene、Camera、Texture 不再提供 dirty/setDirty/clearDirty 或 renderId。Scene 的结构、排序和资源引用共用一个 version；当前按此版本统一准备四个列表。SceneResourcesLike.version 属于单个 Render 的处理快照，不受另一个 Render 初始化影响。

BufferManager.draw(scene, camera, dpr, renderMode) 和 Render.drawBuffers(scene, camera) 不再接收 dirty 参数。相机 GPU 上传以 Camera 身份、矩阵身份与版本、zoom/dpr 判断；切换相机无需修改共享相机状态。

数学对象由 bpmatrixjs 提供 MathSubscriber / VersionedMath、Vec2Data / Mat3Data。订阅 add(subscriber, field?) / delete(subscriber, field?) 与 Color 一样区分字段；Vec2.add(vec2) 保留加法重载。矩阵写入完成后先同步 GPUData，再发通知。数据 getter 为 TS 只读视图，不使用 Proxy；需要原地编辑底层数组的 JS 调用者必须执行 updateVersion()，通常应使用 data setter 或类方法。
