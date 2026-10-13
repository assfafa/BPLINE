# 矩形生成 Rect

目录：`bpmatrixjs/src/scripts/Geometry/Rect`

## 1. 文件结构与作用

矩形与圆角轮廓、UV、周长、边框和标记点。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `geometry.ts` | 获取矩形实际离散轮廓的周长。 宽高和圆角使用与几何生成相同的限制及分段规则。；生成矩形填充三角面。 以 (0, 0) 为中心，圆角半径会自动限制到半宽半高的较小值。；生成由顶点着色器扩宽的矩形边框载体三角面。 geometry 只保存中心轮廓，lineWidth 和 align 不会提前烘焙到顶点位置。 normal 保存单位外法线，miterScale 保存直角处的扩展补偿倍率。 |
| `perimeter.ts` | 创建圆角边框的中心轮廓、法线和 miter 数据。；创建直角边框路径数据。 每个角依次保存上一条边法线、斜向 miter 和下一条边法线。 三个顶点共用位置与 U，GPU 扩宽后会生成直角连接面；角点最后一组顶点使用下一条边法线， 随后直接进入下一条边，因此右边转下边时由下边接管，下边转左边时由左边接管。；创建相对中心轮廓向外偏移一个单位的参考点。 参考点与中心轮廓的差值用于拆分单位法线和 miter 补偿倍率。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：geometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetRectPerimeter` | 获取矩形实际离散轮廓的周长。 宽高和圆角使用与几何生成相同的限制及分段规则。 |
| `CreateRectGeometry` | 生成矩形填充三角面。 以 (0, 0) 为中心，圆角半径会自动限制到半宽半高的较小值。 |
| `CreateRectBorderGeometry` | 生成由顶点着色器扩宽的矩形边框载体三角面。 geometry 只保存中心轮廓，lineWidth 和 align 不会提前烘焙到顶点位置。 normal 保存单位外法线，miterScale 保存直角处的扩展补偿倍率。 |
| `CreateRectLineGeometry` | 生成矩形轮廓的 line-list 顶点、UV 与索引。 |
| `CreateRectPointGeometry` | 利用矩形的 indexed line-list 坐标生成线框点位三角面。 圆角采样点也属于顶点；闭合处的重复顶点只生成一次，零长度边不参与筛选。 每个点型独立使用以自身中心为 (0.5, 0.5) 的包围盒 UV，不随尺寸重复或畸变。 geometry 保留展开后的顶点，position 为逐顶点对应的点型中心坐标。 |

```ts
GetRectPerimeter(width, height, radius);
```

### 导出关系

```ts
export { CollectLinePointCenters, CreateBorderBuffers, CreateEmptyBorderGeometryBuffers, CreateEmptyGeometryBuffers, CreateEmptyGeometryData, CreateExtrudeReferencePoints, CreateFillGeometryBuffer, CreateFillIndexBuffer, CreateFillNormalBuffer, CreateFillUvBuffer, CreateLineBuffers, CreatePathProgress, CreatePerimeterNormalData, CreatePerimeterPoints, CreateRectBorderGeometry, CreateRectGeometry, CreateRectLineGeometry, CreateRectPointGeometry, CreateRoundedBorderPathData, CreateSharpBorderPathData, DefaultRectPrecision, GetClosedPathLength, GetCornerSegments, GetPointDistance, GetRectPerimeter, NormalizeBorderAlign, NormalizeRectParameters, PushArc, ToNonNegativeFinite };
```

### 文件：perimeter.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateRoundedBorderPathData` | 创建圆角边框的中心轮廓、法线和 miter 数据。 |
| `CreateSharpBorderPathData` | 创建直角边框路径数据。 每个角依次保存上一条边法线、斜向 miter 和下一条边法线。 三个顶点共用位置与 U，GPU 扩宽后会生成直角连接面；角点最后一组顶点使用下一条边法线， 随后直接进入下一条边，因此右边转下边时由下边接管，下边转左边时由左边接管。 |
| `CreateExtrudeReferencePoints` | 创建相对中心轮廓向外偏移一个单位的参考点。 参考点与中心轮廓的差值用于拆分单位法线和 miter 补偿倍率。 |
| `CollectLinePointCenters` | 从闭合 line-list 中筛选点型中心；先输出顶点，再输出中点。 |
| `CreatePerimeterPoints` | 生成按顺时针排列的矩形边界点。 每个圆角都保留起点，圆角之间由矩形直边连接。 |
| `PushArc` | 添加包含起点和终点的圆角圆弧点。 |
| `CreateFillGeometryBuffer` | 生成中心三角扇使用的填充顶点。 |
| `CreateFillNormalBuffer` | 生成中心三角扇使用的二维轮廓外法线。 中心顶点不属于边界，使用 [0, 0]；其余顶点与边界点一一对应。 |
| `CreateFillUvBuffer` | 生成中心三角扇使用的填充 UV。 |
| `CreateFillIndexBuffer` | 生成中心三角扇使用的填充索引。 |
| `CreatePerimeterNormalData` | 将向外偏移一个单位的参考轮廓拆分为单位法线与 miter 补偿倍率。 |
| `CreateBorderBuffers` | 生成中心轮廓载体组成的边框三角面、法线、miter 倍率、UV 与索引。 闭合处复制首对顶点，使 U 可以从 0 连续增长到 uvRepeat。 |
| `CreateLineBuffers` | 生成 line-list 使用的轮廓顶点、UV 与索引。 |
| `CreatePathProgress` | 计算闭合轮廓中每个点沿路径的归一化累计距离。 |
| `GetClosedPathLength` | 累计闭合轮廓中所有线段的长度。 |
| `GetPointDistance` | 计算两个点之间的距离。 |
| `GetCornerSegments` | 计算每个圆角的分段数。 上限保证边框双顶点和闭合复制点不会超过 Uint16 索引范围。 |
| `DefaultRectPrecision` | 省略精度时保留原有半径推算及尺寸规范化行为。 |
| `NormalizeBorderAlign` | 规范化运行时传入的边框对齐方式。 |
| `NormalizeRectParameters` | 规范化矩形参数。 |
| `ToNonNegativeFinite` | 将数值限制为有限非负数。 |
| `CreateEmptyGeometryBuffers` | 创建空几何缓冲。 |
| `CreateEmptyBorderGeometryBuffers` | 创建空边框载体缓冲。 |
| `CreateEmptyGeometryData` | 创建空矩形几何数据。 |

```ts
CreateRoundedBorderPathData(halfWidth, halfHeight, radius, segments);
```

### 导出关系

```ts
export { CollectLinePointCenters, CreateBorderBuffers, CreateEmptyBorderGeometryBuffers, CreateEmptyGeometryBuffers, CreateEmptyGeometryData, CreateExtrudeReferencePoints, CreateFillGeometryBuffer, CreateFillIndexBuffer, CreateFillNormalBuffer, CreateFillUvBuffer, CreateLineBuffers, CreatePathProgress, CreatePerimeterNormalData, CreatePerimeterPoints, CreateRoundedBorderPathData, CreateSharpBorderPathData, DefaultRectPrecision, GetClosedPathLength, GetCornerSegments, GetPointDistance, NormalizeBorderAlign, NormalizeRectParameters, PushArc, ToNonNegativeFinite };
```

### 文件：types.ts


### 类型索引

`RectPoint`、`RectBorderAlign`、`RectBorderPathData`、`RectGeometryData`、`RectBorderGeometryData`、`RectLineGeometryData`、`RectPointGeometryData`、`RectLike`

### 导出关系

```ts
export type { RectBorderAlign, RectBorderGeometryData, RectBorderPathData, RectGeometryData, RectLike, RectLineGeometryData, RectPoint, RectPointGeometryData };
```

## 4. 注意事项

- 入口在上级 Rect.ts；geometry 提供公开生成函数，perimeter 维护轮廓与偏移计算，types 维护数据契约。所有辅助几何传递同一精度。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">矩形 圆角 分段 周长 边框 关键点</keywords>
<keywords language="en">rectangle rounded segments perimeter border marker</keywords>
```
