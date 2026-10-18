# 布尔几何 Boolean WASM

目录：`bpmatrixjs/src/scripts/Utils/Bool/src`

## 1. 文件结构与作用

Rust iOverlay 区域运算与 iTriangle 三角化；连续轮廓、三角网和混合输入，来源追踪与空间谓词。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `build.py` | 按 SHA-256 校验下载依赖，在项目缓存编译，将运行产物复制到 lib。 |
| `Cargo.lock` | Cargo 解析出的全部原生依赖版本和校验和。 |
| `Cargo.toml` | Rust WASM 原生入口、锁定依赖版本与 release 编译配置。 |
| `lib.rs` | 原生数值缓冲协议、i64 布尔与碰撞谓词、孔洞三角化及错误返回。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- await Bool.ready() 只初始化一次，后续运算同步。src 保存 Rust 与锁定依赖；build 是忽略的产物目录。所有依赖按 MIT 使用，LICENSE 随包复制。缓存和工具链位于 WSL .local/wasm-bool。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">布尔 并集 减法 交集 差集 打孔 分裂 来源 碰撞 覆盖</keywords>
<keywords language="en">boolean union difference intersection xor holes split provenance collision covers wasm rust</keywords>
```
