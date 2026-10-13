# WGSL 着色器 WGSL

目录：`bplinejs/src/scripts/Material/wgsls/base/rect`

## 1. 文件结构与作用

标准图元和原生线框的顶点、片元阶段。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `fragment.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `vertex.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- 与 CPU 打包布局同步：矩阵列补齐、样式 44 floats、纹理数组绑定和实例深度秩。修改阶段接口时同步全部图元。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">着色器 顶点 片元 深度 精度 纹理</keywords>
<keywords language="en">wgsl shader vertex fragment depth precision texture</keywords>
```
