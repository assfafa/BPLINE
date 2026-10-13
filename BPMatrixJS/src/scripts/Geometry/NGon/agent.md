# 正多边形生成 NGon

目录：`bpmatrixjs/src/scripts/Geometry/NGon`

## 1. 文件结构与作用

等边形、圆盘近似和内外圈拓扑。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `geometry.ts` | 校验并整理几何选项，保证后续生成器使用一致的参数。；按边数和起始角生成等边形轮廓节点。；计算轮廓包围盒，供 UV 映射和尺寸查询使用。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：geometry.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Normalize` | 校验并整理几何选项，保证后续生成器使用一致的参数。 |
| `Nodes` | 按边数和起始角生成等边形轮廓节点。 |
| `GetBounds` | 计算轮廓包围盒，供 UV 映射和尺寸查询使用。 |
| `Empty` | 创建保留包围盒信息但不包含可绘制顶点的几何结果。 |
| `Fill` | 圆盘使用中心扇形，圆环逐段缝合内外圈；不会用扇形跨过内孔。 |
| `Merge` | 合并独立内外轮廓，索引仅做偏移，不额外连接两圈。 |

```ts
Normalize(options);
```

### 导出关系

```ts
export { Empty, Fill, GetBounds, Merge, Nodes, Normalize };
```

### 文件：types.ts


### 类型索引

`NGonUVMode`、`NGonOptions`、`NGonLike`、`Settings`、`Bounds`、`Part`

### 导出关系

```ts
export type { Bounds, NGonLike, NGonOptions, NGonUVMode, Part, Settings };
```

## 4. 注意事项

- 入口在上级 NGon.ts；孔环通过对应边拼接，不能用中心扇形填满内圈。两边退化为开放直径，没有填充面。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">正多边形 圆盘 圆环 内圈 极坐标</keywords>
<keywords language="en">ngon regular polygon disk annulus polar</keywords>
```
