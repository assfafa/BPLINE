# 包与入口 Package

目录：`bplinejs/src`

## 1. 文件结构与作用

包入口、源码目录、构建配置与导出路径。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `main.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `scripts/` | 包入口、源码目录、构建配置与导出路径。 详见该目录的 agent.md。 |
| `style.css` | 本目录维护的配置、资源或验证文件。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：main.ts



## 4. 注意事项

- 源码按 imports、class（字段/构造/方法）、类型、辅助函数、exports 排列；独立默认值写在字段声明上，构造函数保留参数赋值和初始化绑定。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">项目 包 入口 构建 导出</keywords>
<keywords language="en">package entry source build exports</keywords>
```
