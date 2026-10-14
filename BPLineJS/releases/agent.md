# 发布记录 Releases

目录：`bplinejs/releases`

## 1. 文件结构与作用

对应 npm 版本的变更说明。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `0.0.102.md` | 本目录维护的配置、资源或验证文件。 |
| `0.0.103-beta.11.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.103.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.104-beta.11.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.104-beta.12.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.104-beta.13.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.104-beta.14.md` | 本目录维护的配置、资源或验证文件。 |
| `0.1.104-beta.15.md` | 本目录维护的配置、资源或验证文件。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- 发布前核对本地 CHANGES.md；发布完成及文档同步后清理本地记录。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">发布 版本 beta 变更</keywords>
<keywords language="en">release version beta changes</keywords>
```
