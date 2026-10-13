# 辅助显示 Helper

目录：`bplinejs/src/scripts/Helper`

## 1. 文件结构与作用

背景网格、标尺与缩放适配。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `GridStep.ts` | 计算当前 HelperGrid 使用的世界坐标细格间距。 |
| `HelperGrid/` | 背景网格、标尺与缩放适配。 详见该目录的 agent.md。 |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export { default as HelperGrid, HelperGridCustomStyle } from "./HelperGrid";
export type {
    HelperGridCustomColors,
    HelperGridMode,
    HorizontalRuler,
    VerticalRuler,
} from "./HelperGrid";
```

## 3. 其他源码文件

### 文件：GridStep.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ComputeMinorGridStep` | 计算当前 HelperGrid 使用的世界坐标细格间距。 |

```ts
const step = ComputeMinorGridStep(camera, render);
```

### 导出关系

```ts
export { ComputeMinorGridStep };
```

## 4. 注意事项

- 屏幕辅助 Shader 绕过普通世界包围盒裁剪；网格与标尺各有独立 Mesh 和材质。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">辅助 网格 标尺 尺子 主题</keywords>
<keywords language="en">helper grid ruler scale theme</keywords>
```
