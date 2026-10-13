# 场景分组 Group

目录：`bplinejs/src/scripts/Group`

## 1. 文件结构与作用

节点添加删除、任意层级和场景通知。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 组对象 用于组织子节点和维护基础变换信息 |

## 2. index 入口、案例与类接口

### Group

组对象
用于组织子节点和维护基础变换信息

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Group"` | 对象类型 |
| `children`（公开） | `AddObject[]`；`[]` | 子节点列表 |

#### 构造与案例

```ts
constructor(x: number, y: number)
```

创建组对象

```ts
const group = new Group(x, y);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `add(child: AddObject): void`  | 添加子节点 |
| `removeSelf(): boolean`  | 从父组中删除当前节点。 当前节点没有父组时不进行处理。 |
| `removeChild(child: AddObject): boolean`  | 删除当前组中的一个直接子节点。 |
| `removeAll(): void`  | 删除当前组中的全部直接子节点。 |
| `updateWorldMatrix(): Mat3`  | 强制更新当前节点及子节点世界矩阵 |
| `getScene(node: AddObject): SceneLike \| undefined`  | 从当前节点沿父级查找所属场景。 |

### 类型索引

`GroupLike`

### 导出关系

```ts
export default Group;
export type { GroupLike };
```

## 3. 其他源码文件

## 4. 注意事项

- 修改层级通过 add/remove；保持世界姿态时先做父级坐标换算，避免循环嵌套。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">分组 层级 父子 节点</keywords>
<keywords language="en">group hierarchy parent child node</keywords>
```
