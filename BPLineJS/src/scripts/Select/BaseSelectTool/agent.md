# 选择 Select

目录：`bplinejs/src/scripts/Select/BaseSelectTool`

## 1. 文件结构与作用

集合点选、框选、边线和顶点命中。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | Base2D 普通 Mesh 的三角面点选与 Rect2D 框选工具。 |

## 2. index 入口、案例与类接口

### BaseSelectTool

Base2D 普通 Mesh 的三角面点选与 Rect2D 框选工具。

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera, autoEnableBounding: boolean = true)
```

建立选择器并可自动开启候选 Mesh 的包围盒。

```ts
const select = new BaseSelectTool(scene, render, camera);
```

### 导出关系

```ts
export default BaseSelectTool;
```

## 3. 其他源码文件

## 4. 注意事项

- 使用完整场景搜索，noSelect 跳过辅助实体；命中按显示矩阵处理 ignoreZoom。点选和框选开关独立。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">选择器 点选 框选 边线 顶点 排序</keywords>
<keywords language="en">select picker selector edge point sorting</keywords>
```
