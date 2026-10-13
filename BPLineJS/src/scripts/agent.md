# 包与入口 Package

目录：`bplinejs/src/scripts`

## 1. 文件结构与作用

包入口、源码目录、构建配置与导出路径。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Camera/` | 正交视口、坐标投影、缩放和相机版本。 详见该目录的 agent.md。 |
| `Color/` | 归一化 RGBA、十六进制转换和颜色订阅。 详见该目录的 agent.md。 |
| `Control/` | 鼠标、单指、双指操作和相机惯性。 详见该目录的 agent.md。 |
| `Editor/` | 集合分派、图元编辑、快捷键、历史及文档回显。 详见该目录的 agent.md。 |
| `Examples/` | 开发验证入口、交互案例和测试资源。 详见该目录的 agent.md。 |
| `Geometry/` | 填充、边框、关键点和线框的 CPU 生成。 详见该目录的 agent.md。 |
| `global-types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `Group/` | 节点添加删除、任意层级和场景通知。 详见该目录的 agent.md。 |
| `Helper/` | 背景网格、标尺与缩放适配。 详见该目录的 agent.md。 |
| `ID.ts` | 获取全局唯一的递增对象 ID。 |
| `IMesh/` | 管理或冻结实例记录、连续缓冲和整批包围盒。 详见该目录的 agent.md。 |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `Material/` | 标准材质、自定义 WGSL、具名传值和管线身份。 详见该目录的 agent.md。 |
| `Mesh/` | 几何与材质资源、变换、实例打包和包围盒。 详见该目录的 agent.md。 |
| `Object/` | 局部 TRS、显式矩阵和世界变换缓存。 详见该目录的 agent.md。 |
| `Raws/` | 稳定编号的单条 Raw 与记录集合。 详见该目录的 agent.md。 |
| `Render/` | 资源准备、GPU 上传、绘制提交和开发诊断。 详见该目录的 agent.md。 |
| `Scene/` | 资源归属列表、视口筛选和世界四叉树。 详见该目录的 agent.md。 |
| `Select/` | 集合点选、框选、边线和顶点命中。 详见该目录的 agent.md。 |
| `Style/` | 实体面、线框、边框、关键点和连接的订阅链。 详见该目录的 agent.md。 |
| `Text/` | 静态字体表、排版几何和光标布局。 详见该目录的 agent.md。 |
| `Texture/` | 图片、视频、Canvas、来源变更和实例纹理层。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export type { CameraBuffersLike, CameraLike } from "./Camera";
export type { ColorSubscriber } from "./Color";
export { CameraControl } from "./Control";
export type {
    CameraControlChange, CameraControlOptions, CameraControlState, CameraPositionChange,
    CameraRotationChange, CameraZoomChange,
} from "./Control";
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorMaterialData, EditorMode, EditorNodeData, EditorOptions, EditorShape, EditorStyleData, EditorTextureData, EditSwitches } from "./Editor";
export type { NGonEditDocument, NGonEditMode, NGonEditOrigin, NGonEditRecord, NGonHandle } from "./Editor/NGonEditTool";
export type { PolyEditDocument, PolyEditMode, PolyEditOrigin, PolyEditRecord, PolyHandle } from "./Editor/PolyEditTool";
export type { RectEditDocument, RectEditMode, RectEditOrigin, RectEditRecord, RectEditStyleData, RectHandle, SelectionOperation } from "./Editor/RectEditTool";
export type { SnapOptions } from "./Editor/Snap";
export type { TextEditDocument, TextEditRecord } from "./Editor/TextEditTool";
export type { Base2DLike, Base2DOptions } from "./Geometry/Base2D";
export type {
    BorderAlign,
    GeoBuffersLike,
    GeoData, GeometrySubscriber, GeoPartDataLike,
} from "./Geometry/Geo";
export type { NGon2DLike, NGon2DOptions, NGonUVMode } from "./Geometry/NGon2D";
export type { Poly2DLike, Poly2DOptions } from "./Geometry/Poly2D";
export type { Rect2DLike, Rect2DOptions } from "./Geometry/Rect2D";
export type { AddObject, Geometry2d, Material2d } from "./global-types";
export type { GroupLike } from "./Group";
export type { HelperGridCustomColors, HelperGridMode, HorizontalRuler, VerticalRuler } from "./Helper";
export type { IMeshOptions } from "./IMesh";
export type { BaseMaterialLike } from "./Material/baseMaterial";
export type { CompositeMaterialLike } from "./Material/CompositeMaterial";
export type {
    MaterialBuffersLike,
    MaterialChange,
    MaterialChangeKind,
    MaterialLike,
    MaterialSubscriber,
    PixelAligned,
    ShadersLike,
} from "./Material/Material";
export type { ShaderValue, ShaderValueRecord } from "./Material/ShaderValues";
export type { WGSLMaterialLike } from "./Material/WGSLMaterial";
export type { MeshBoundingBox, MeshBoundingRect, MeshLike } from "./Mesh";
export type { ObjectNodeLike } from "./Object";
export { Raw } from "./Raws";
export type { RawChange, RawOptions, RawSubscriber } from "./Raws";
export {
    BufferManager,
    DepthManager, DestroyManager, DevelopmentValidator, DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
} from "./Render";
export type {
    BufferManagerLike,
    DepthTextureLike, DestroyManagerLike, DevelopmentValidatorLike, DrawCallManagerLike, GeometryBufferLike, GeometryBufferPartLike, GPUTextureResourceLike, MeshDepthBufferLike, MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineManagerLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SamplerManagerLike,
    SceneResourcesLike,
    TextureManagerLike,
} from "./Render";
export type { DrawList, GeometryList, MaterialList, QuadTreeEntry, SceneLike, TextureList } from "./Scene";
export type { SelectResult, SelectSortDirection } from "./Select";
export type { LineSelection } from "./Select/LineSelectTool";
export type { PointSelection } from "./Select/PointSelectTool";
export type { RectSelectionMode } from "./Select/RectSelectTool";
export type { TextSelection } from "./Select/TextSelectTool";
export { EdgeStyle, JoinStyle, PointsStyle, SolidStyle, STYLE_STRIDE, WireframeStyle, WriteStyleData } from "./Style";
export type { JoinType, PartSubscriber, StyleArea, StyleChange, StyleSubscriber } from "./Style";
export type { Text2DLike, Text2DOptions, TextGeometryFactory, TextWritingMode } from "./Text";
export type { TextureLike, TextureSource, TextureSubscriber } from "./Texture";
export { default as TextureLayers } from "./Texture/Layers";
export type { TextureResource } from "./Texture/Layers";
export {
    Base2D, BaseMaterial, BaseSelectTool, Camera,
    Color, CompositeMaterial, Editor,
    EditorGroup,
    EditorKey, Font, Geo, GETID,
    Group, HelperGrid,
    HelperGridCustomStyle, IMesh, LineSelectTool, Material,
    Mesh, NGon2D, NGonEditTool,
    NGonEditToolKey, NGonSelectTool, ObjectNode, PointSelectTool, Poly2D, PolyEditTool,
    PolyEditToolKey, PolySelectTool, QuadTree, Raws, Rect2D, RectEditTool,
    RectEditToolKey, RectSelectTool, Render,
    Scene, Select, Style, Text, TextEditTool,
    TextEditToolKey, TextSelectTool, Texture, WGSLMaterial,
};
```

## 3. 其他源码文件

### 文件：global-types.ts


### 类型索引

`AddObject`、`Geometry2d`、`Material2d`

### 导出关系

```ts
export type { AddObject, Geometry2d, Material2d };
```

### 文件：ID.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GETID` | 获取全局唯一的递增对象 ID。 |

```ts
GETID();
```

### 导出关系

```ts
export { GETID };
```

## 4. 注意事项

- 源码按 imports、class（字段/构造/方法）、类型、辅助函数、exports 排列；独立默认值写在字段声明上，构造函数保留参数赋值和初始化绑定。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">项目 包 入口 构建 导出</keywords>
<keywords language="en">package entry source build exports</keywords>
```
