# 编辑记录 History

目录：`bplinejs/src/scripts/Editor/History`

## 1. 文件结构与作用

选择身份、剪贴板克隆和快照条目读取。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `records.ts` | 稳定运行期编号。；独立的实体副本，资源按 Mesh.clone 规则复制。；条目对应的真实实体。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：records.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `MeshId` | 稳定运行期编号。 |
| `CloneMesh` | 独立的实体副本，资源按 Mesh.clone 规则复制。 |
| `HistoryMesh` | 条目对应的真实实体。 |
| `HistoryData` | 比较编辑前后变化时使用的纯数据。 |
| `SelectedHistoryMeshes` | 按条目顺序恢复的选择集合。 |

```ts
meshes.map(MeshId);
```

### 类型索引

`HistoryMeshReference`、`HistoryDataReference`

### 导出关系

```ts
export { CloneMesh, HistoryData, HistoryMesh, MeshId, SelectedHistoryMeshes };
export type { HistoryDataReference, HistoryMeshReference };
```

## 4. 注意事项

- 历史比较用户输入和基准精度，不能把临时选择样式或自动精度当作用户编辑。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">历史 快照 选择 编号 克隆</keywords>
<keywords language="en">history snapshot selection id clone</keywords>
```
