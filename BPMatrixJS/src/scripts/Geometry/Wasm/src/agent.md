# 文字原生计算 Text WASM

目录：`bpmatrixjs/src/scripts/Geometry/Wasm/src`

## 1. 文件结构与作用

C++ 字体解码、HarfBuzz 排版、曲线采样、nonzero 三角化与有界缓存。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `build.py` | 按 SHA-256 校验下载依赖，在项目缓存编译，将运行产物复制到 lib。 |
| `text/` | C++ 字体解码、HarfBuzz 排版、曲线采样、nonzero 三角化与有界缓存。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- build:wasm 在 build 生成加载器和 WASM；src 保存 C++。依赖与对象缓存位于根目录 .local/wasm-text。只使用 MIT 依赖，LICENSE 随包复制。注册必须 await，几何创建同步。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">文字 字体 原生 编译 缓存 孔洞</keywords>
<keywords language="en">text font wasm native build cache winding holes</keywords>
```
