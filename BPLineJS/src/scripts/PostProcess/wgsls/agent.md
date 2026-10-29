# 后处理 PostProcess

目录：`bplinejs/src/scripts/PostProcess/wgsls`

## 1. 文件结构与作用

有序 WgslPass 与 Bloom/Shadow/SMAA/FXAA 预置、离屏附件复用和 Canvas 呈现。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `blur.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `fragment.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `premult.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `vertex.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- 先 render.renderPass(input)，再 post.process(input) 或 post.render(input)。Bloom/Shadow 按 Style 的完整参数值合批，参数不放到 PostProcess。内部结果只在下次执行或清理前有效。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">后处理 通道 发光 阴影 抗锯齿 合批</keywords>
<keywords language="en">postprocess pass bloom shadow smaa fxaa batching</keywords>
```
