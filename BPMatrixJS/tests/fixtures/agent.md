# 回归测试 Tests

目录：`bpmatrixjs/tests/fixtures`

## 1. 文件结构与作用

数学、几何、字体与边界行为的 Node 检查。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `MiSans-subset.woff2` | 本地字体验证资源，保持原始二进制。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- 测试以生成数组、拓扑、面积和订阅行为为依据；fixtures 保持确定输入。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">测试 回归 验证 夹具</keywords>
<keywords language="en">test regression validation fixture</keywords>
```
