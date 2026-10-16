# 通用算法 Utils

目录：`bpmatrixjs/src/scripts/Utils/Bool`

## 1. 文件结构与作用

纯数值、平面几何、事件坐标和计时工具。

| 文件 / 子目录 | 作用 |
| --- | --- |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

## 4. 注意事项

- 通用算法不依赖 Mesh/Scene/Editor；编辑器负责屏幕容差和业务开关，数学工具负责坐标与几何计算。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">工具 通用算法 相交 投影 距离 环绕 精度</keywords>
<keywords language="en">utils algorithm intersection projection distance winding precision</keywords>
```
