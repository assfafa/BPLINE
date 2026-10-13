# 编辑光标 Cursors

目录：`bplinejs/src/scripts/Editor/cursors`

## 1. 文件结构与作用

Phosphor SVG 光标、方向投影和旋转缓存。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `cursor-text.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `diagonal-nesw.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `diagonal-nwse.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `hand-grabbing.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `hand.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `horizontal.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `index.ts` | 将屏幕法线转成以中心为热点的旋转箭头。；投影世界方向，仅计算矩阵线性部分，避免大坐标端点相减损失精度。；根据矩形框的显示矩阵计算屏幕法线；四角使用相邻单位法线的角平分线。 |
| `LICENSE` | 对应代码或资源的许可说明，打包时保持要求的声明。 |
| `move.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `plus.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `rotate.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |
| `vertical.svg` | 矢量光标资源，通过模块 URL 引入；方向由编辑器投影计算。 |

## 2. index 入口、案例与类接口


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ResizeCursor` | 将屏幕法线转成以中心为热点的旋转箭头。 |
| `ProjectCursorDirection` | 投影世界方向，仅计算矩阵线性部分，避免大坐标端点相减损失精度。 |
| `FrameResizeCursor` | 根据矩形框的显示矩阵计算屏幕法线；四角使用相邻单位法线的角平分线。 |
| `ContourResizeCursor` | 在屏幕轮廓上寻找最近的顶点或边并生成缩放光标。 |
| `UnitNormal` | 将切线旋转 90 度并归一化。 |

```ts
const css = ResizeCursor(new Vec2(1, 1));
```

### 类型索引

`ResizeHandle`

### 导出关系

```ts
export { ContourResizeCursor, FrameResizeCursor, ResizeCursor };
export type { ResizeHandle };
```

## 3. 其他源码文件

## 4. 注意事项

- 缩放光标按屏幕空间法线定向；SVG 与许可说明保留，选中框由 Mesh 绘制。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">光标 鼠标 图标 法线 屏幕方向</keywords>
<keywords language="en">cursor mouse icon normal screen direction</keywords>
```
