# bplinejs

基于 WebGPU 的 TypeScript 2D 渲染库，重点是矩形、SDF 边框、原生线框、可贴图宽边框和关键点。项目处于早期阶段，API 会随能力完善调整。

## 快速开始

运行环境需要 WebGPU 和安全上下文（HTTPS 或 localhost）。

```ts
import { BaseMaterial, Camera, Color, Mesh, Rect2d, Render, Scene, Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
style.solid.color = new Color("#168ddd");
style.solid.borderWidth = 4;
style.solid.borderColor.setHex("#ffffff");

const geometry = new Rect2d({ width: 320, height: 180, radius: 24, style });
const material = new BaseMaterial(style);
const scene = new Scene();
scene.add(new Mesh(geometry, material, style));
const camera = new Camera(window.innerWidth, window.innerHeight);
const render = new Render("app");

await render.ready;
render.warmup(scene, camera);
const Animate = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(Animate);
};
requestAnimationFrame(Animate);
```

总入口和目录入口均可使用，例如 `import Style from "bplinejs/Style"`、`import Color from "bplinejs/Color"`、`import Rect2d from "bplinejs/Geometry/Rect2d"`。

## 多边形

```ts
import { Poly2D, Style, BaseMaterial, Mesh } from "bplinejs";

const points = new Float32Array([0, 0, 160, 0, 160, 70, 80, 70, 80, 150, 0, 150]);
const style = new Style();
style.solid.enabled = true;
style.edge.enabled = true;
style.edge.width = 10;
style.join.type = "round"; // miter 尖角、round 圆角、bevel 切角
style.join.seg = 8;
const geometry = new Poly2D(points, style);
const mesh = new Mesh(geometry, new BaseMaterial(style), style);

const empty = new Poly2D(points, null); // 可省略 Style，默认所有显示区域关闭
const path = new Poly2D(new Float32Array([0, 0, 100, 80]), null, { closed: false });
```

支持单轮廓凹多边形，也允许自交线条；自交填充允许降级和重叠，不保证 Canvas 的填充规则。尚不支持洞。可先 `new Poly2D()`，后续设置 `points`；空集或点数不足时不渲染，清空会移除旧几何缓存。输入不会自动居中。开放路径不能开启 solid。转角样式仅改变实体边框，边框使用 `style.edge`。修改 points、closed 或 join 会通知下一帧全量更新几何缓冲。

`Examples/Poly.ts` 为点击追加节点案例。独立验证页 `/src/scripts/Examples/PolyCheck.html` 验证空集、逐点构建、自交轮廓及清空恢复，不影响默认案例。

## 共享样式与通知

`Style` 构造时创建四个独立分区，`enabled` 默认全部关闭。Geometry 根据其 Style 生成数据，Material 根据其 Style 上传显示参数，建议显式引用同一个 Style。Mesh 第三个参数传 Style 时同步两者；省略或 true 会新建一份默认关闭的 Style，false 则保留两者原有样式。

| 分区 | 用途 |
| --- | --- |
| `solid` | 实体面及它自己的 SDF 边框 |
| `wireframe` | 原生 line-list，只支持颜色和透明度，不提供无效的宽度选项 |
| `edge` | 三角面实体边框，独立贴图、宽度、对齐、像素模式 |
| `points` | 关键点，独立颜色、透明度、贴图、半径及像素模式 |

```ts
style.edge.enabled = true;
style.edge.width = 10;
style.edge.borderAlign = "normal";
style.edge.uvRepeat = geometry.perimeter / 200;
style.edge.pixelAligned = "px";
style.points.enabled = true;
style.points.vertices = true;
style.points.midpoints = true;
style.points.radius = 4;
style.points.pixelAligned = "zoom";

// 共享同一个颜色对象；改任意分量会自动通知两个分区。
const color = new Color("#ff8800");
style.edge.color = color;
style.points.color = color;
color.g = 0.5;
```

变化链为 `Color / Texture → 样式分区 → Style → Geometry / Material → Mesh`，携带区域及字段。各级使用 add/delete 关联和解绑，setter 只发通知并标记下一帧工作，不操作 GPU。颜色、贴图、透明度不会重建 CPU 顶点；生成开关、实体边框宽度或点半径等字段会递增几何版本，渲染前统一生成。每个 Render 比较自己的缓存版本，支持多个 Render 使用同一资源。

更换 `geometry.style` / `material.style`、`mesh.data` / `mesh.material`、分区的 `texture` 均自动解绑旧对象并绑定新对象。最终不再使用的 Mesh、Geometry、Material 调用 `dispose()` 解除强引用订阅；不要仅因移出 Scene 就调用。GPU 资源仍通过 Render 的 destroy/trim 管理，二者不同。

所有使用者均停止使用 Style 后，再调用 `style.dispose()`，解除分区对共享 Color 的订阅；这不会销毁颜色、贴图或 GPU 资源。dispose 是最终释放，不应继续复用对象。

颜色统一为 0 到 1。可用 `setRGB`、`setRGBA`、`setHex`、`toHex`、`copy`、`clone`；内部数组不公开，`writeTo(array, offset)` 用于写入调用者数组。批量设置只通知一次。没有自动 sRGB/线性颜色空间转换。

## 渲染与更新

各分区独立管理颜色、透明度；SDF 边框色属于 `solid.borderColor`，不会和 `edge.color` 共用。半透明绘制仍需 `material.transparent = true`，所有分区共用材质的透明混合和剔除状态。

四个 enabled 可以独立开启；全部关闭时不生成可绘制几何。关键点还受 `vertices` / `midpoints` 选择控制，二者均关闭时不生成点型。阈值 `points.minPointsLength` 默认 6，判断相邻两条边之和；`points.minEdgePointsLength` 默认 4，判断单条边长，均为严格大于。

全部三角面合并在 `geometry / normal / uv / index`，`vertexType` 为 0（实体）、0.5（边框）、1（关键点）。原生 `linePoints` 仍单独绘制；需要时在关键点前分段绘制，保证覆盖顺序。三套贴图和 Sampler 同时绑定，每实例样式为 11 个 vec4，共 176 字节，通过只读 Storage 数组传入。

替换 Mesh 的 position/scale、设置 rotation，以及修改 Vec2 内部分量都会自动通知节点：

```ts
mesh.position.set(100, 50);
// 不再需要 setDirty；position.x / setX / set 同样自动通知。
```

## 普通 Mesh 的单实例数据

```ts
const mesh = new Mesh(geometry, material);        // 新建默认 Style，所有分区关闭
const existing = new Mesh(geometry, material, false); // 保留资源各自的 Style
const shared = new Mesh(geometry, material, style);   // 显式同步共享 Style
shared.style = anotherStyle; // 同时更新当前 Geometry 和 Material 的 Style
```

普通 Mesh 的 count 和 capacity 均为 1，matrixData 为连续 12 个 float，styleData 为连续 44 个 float。预分配数组只更新内容，不每帧重新创建；两个缓存版本分别控制矩阵和样式上传。Shader 用内建 instance_index 读取数组，普通 Mesh 索引为 0，DrawCall 显式传 count。

GPU 缓存按 Mesh ID 保存为 buffers.meshMatrix 与 buffers.meshStyle，不再使用 materialUniform。样式缓存仍记录 materialId，手动 destroyMaterial 能找到关联 Mesh 的缓存。相机和几何公共参数继续使用 Uniform。

两者均为 CPU 端 Map，通过 `.get(mesh.id)` 查询；实际矩阵和样式数值仍为连续 Float32Array。BindGroup 在绑定对象不变时复用，不因 writeBuffer 更新内容而重建。`src/scripts/Examples/CacheCheck.html` 提供独立缓存验证，不改变默认案例入口。

缓冲各管各的：`geometryList` 生成和上传几何；`materialList` 做材质检查及 Pipeline/Sampler 准备；`drawList` 只打包和上传 Mesh 自己的实例矩阵、样式数组；`textureList` 上传贴图。普通 Mesh 的样式数组仍是实例数据，不额外复制一份材质 GPU 缓冲。

Mesh 通过通知合并样式更新，不再每帧读取 Material.style 的引用与版本。只有贴图引用或 Pipeline key 改变才标记 Scene 资源列表；图片内容变化只更新 Texture 缓存。Texture 的属性使用 getter/setter，`setSource()` 原子更新源、宽高和加载状态；直接修改已有源的像素后调用 `texture.updateVersion()`。Texture 缓存按各 Render 自己保存的 version 更新，不存在清除版本操作。

Mesh.style = undefined 仅停止样式接管，不清除 Geometry/Material 现有 Style。后续替换 data/material/init 时，有 Mesh.style 就同步它。共用 Geometry 或 Material 的其他 Mesh 也会看到这次修改；如需独立样式，请使用独立资源对象，不能将共享对象当作每个 Mesh 的私有副本。

## IMesh 实例化

```ts
import { IMesh, Rect2d, BaseMaterial, Style } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";

const template = new Style();
template.solid.enabled = true;
template.edge.enabled = true;
template.edge.width = 8;
const geometry = new Rect2d({ width: 100, height: 80, radius: 8, style: template });
const material = new BaseMaterial();
material.transparent = true;
const batch = new IMesh(geometry, material, { raw: true, capacity: 2 });

const first = new Style();
first.solid.enabled = true;
first.edge.enabled = true;
first.edge.width = template.edge.width;
first.edge.color.setHex("#ffffff");
// first.solid.texture = await new Texture().load(url);
const id = batch.push({ position: new Vec2(100, 0), style: first });
scene.add(batch);
batch.raws.map.get(id)!.position.x = 200; // 自动更新对应世界矩阵
```

count 是实际条数，capacity 是预留槽数，growthFactor 默认 2：2→4→8→16，达到 100000 后每批追加 100000。clear 清空记录但保留容量，dispose 解绑订阅；单条临时隐藏使用 raw.enabled=false，不压缩下标。

raw=false 不保存或订阅原始 TRS / Style，连父级移动也不更新已有世界矩阵；调用 updateAt(index, 完整参数) 手动重写。图片引用保留供资源重建，图片自身像素版本更新仍生效。

普通 Mesh 和 IMesh 使用相同的 texture_2d_array 绑定：普通对象仅一层、层号 0；IMesh 将每条 Style 的 solid/edge/points.texture 分别去重成层组，并把层号写入样式最后一个 vec4。不同图片尺寸统一缩放到该组最大宽高，未加载层使用白色。Render 按设备限制校验层数、尺寸和缓冲容量。

只含三角面时整批一次 DrawCall，保留每实例实体→边框→关键点的顺序。原生 wireframe 为 line-list，启用后按实例顺序回退多次绘制，避免透明叠加层级错误。

实例独立颜色、透明度、开关、SDF 参数；共用 Geometry 的形状、实体边框生成宽度、点型选择和 UV Repeat。Shader、混合、剔除及采样器寻址仍由 Material 统一决定。开发模式会提醒受管样式与模板冲突。

## 迁移说明

原 Geometry 的 solid/edge/wireframe/points 等开关、边框和点样式参数已迁移到 Style；Rect2d 构造参数现在是 `{ width, height, radius, style }`。
原 Material 的 backgroundColor/baseTexture/edgeTexture/pointsTexture/opacity/pixelAligned/lineRenderMode 等显示属性已移除，改用对应 Style 分区，不保留影子状态或旧属性别名。

删除 Styles 空类与 bplinejs/Styles 出口，替换为 Raws / Raw。普通 Mesh 的 instanceCount/instanceCapacity 更名为 count/capacity；自定义 Shader 需同步 44-float 样式布局和 texture_2d_array 绑定。

## 开发验证

```bash
npm run dev
npm run check
npm run build:app
npm run build:lib
npm run pack:check
```

`build:lib` 生成 ESM 和 .d.ts；`pack:check` 检查包内容，不发布。
案例统一放在 `src/scripts/Examples`，通过该目录的 `index.ts` 选择。当前 `IMesh.ts` 用于验证实例化、多层贴图和深度渲染。
完整公开接口见 [docs/API.md](docs/API.md)。
## 版本统一化

依赖 bpmatrixjs@0.1.101-beta.12。ObjectNode、Scene、Camera、Texture 的旧 dirty/setDirty/clearDirty 和 renderId 已移除。每个对象递增自己的 version，CPU 生成器与各 Render 分别保存已处理快照，不会互相消费状态。

Scene 当前用一个版本管理四个列表，结构、资源引用、order 变化后统一重建；没有另建三个版本计数器。ensureLists/ensureWorldMatrix/ensureCameraMatrix 是按需更新，updateLists/updateMatrix/updateWorldMatrix/updateCameraMatrix 保留强制更新用途。

Mat3.data 与 Vec2.data 改为 _data 和 getter/setter：getter 是 TS 只读视图，setter 复制数值后发通知。Vec2 的 add(vec2) 仍为加法，add(subscriber, field?) 是订阅重载；delete 解绑。不要绕过类型修改 data[index] 或 GPUData；原始 JS 必须操作底层数据时，调用 updateVersion() 提交。

更新数学包后若 Vite 仍提示 Mat3.add 不存在，重启开发服务并加 --force，清除旧依赖预构建。
## 深度测试

深度测试和写入由材质控制，默认都关闭；IMesh 不会自动改动共享材质。

```ts
// 不透明物体：测试并写入深度，允许从前向后提交。
material.depthTest = true;
material.depthWrite = true;

// 半透明物体：保留混合顺序，只测试已有深度。
transparentMaterial.transparent = true;
transparentMaterial.depthTest = true;
transparentMaterial.depthWrite = false;
```

层级仍来自 Scene 已排序的 drawList 和 IMesh 的 push 顺序，反向提交不会颠倒谁在上面。关闭 depthTest 的对象作为覆盖层最后绘制，层内遵循原排序；要让半透明对象参与场景遮挡，应开启 depthTest。三个开关互不自动切换。

深度纹理由 Render 按实际画布尺寸复用、重建和销毁。`warmup` 会预备深度资源但不提交绘制。浏览器案例统一位于 `src/scripts/Examples`。
