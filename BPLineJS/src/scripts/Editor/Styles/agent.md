# 编辑默认样式 Editor Styles

目录：`bplinejs/src/scripts/Editor/Styles`

## 1. 文件结构与作用

独立绘制模板与黄色边框/关键点模板。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 创建蓝色填充的绘制模板；每次调用均独立持有颜色及样式分区。；创建黄色边框与节点显示模板；矩形可额外显示边中点。 |

## 2. index 入口、案例与类接口


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateDrawingStyle` | 创建蓝色填充的绘制模板；每次调用均独立持有颜色及样式分区。 |
| `CreateSelectionStyle` | 创建黄色边框与节点显示模板；矩形可额外显示边中点。 |

```ts
const style = CreateDrawingStyle();
```

### 导出关系

```ts
export { CreateDrawingStyle, CreateSelectionStyle };
```

## 3. 其他源码文件

## 4. 注意事项

- 工厂每次返回独立 Style；Rect 显示边中点，NGon/Poly 只显示原始顶点。模板在字段初始化，构造只做场景接入。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">编辑器 默认 样式 模板 黄色 边框</keywords>
<keywords language="en">editor default style template yellow border</keywords>
```
