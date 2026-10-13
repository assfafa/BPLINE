# 选择 Select

目录：`bplinejs/src/scripts/Select/PointSelectTool`

## 1. 文件结构与作用

集合点选、框选、边线和顶点命中。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 普通 Mesh 轮廓顶点的屏幕半径点选工具。 |

## 2. index 入口、案例与类接口

### PointSelectTool

普通 Mesh 轮廓顶点的屏幕半径点选工具。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 待查询场景。（构造参数引用）。 |
| `render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 提供画布位置的渲染器。（构造参数引用）。 |
| `camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 将世界顶点投影到屏幕的相机。（构造参数引用）。 |
| `_radius`（内部） | `number`；`8` | 当前屏幕 CSS 像素误差半径。（radius 的内部状态）。 |
| `picker`（公开） | `boolean`；`true` | 是否允许 SelectPicker 点选，默认开启。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera, radius: number = 8)
```

绑定场景、渲染器和相机。

```ts
const select = new PointSelectTool(scene, render, camera, 8);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get radius(): number`  | 当前屏幕 CSS 像素误差半径。 |
| `set radius(value: number)`  | 修改屏幕 CSS 像素误差半径。 |
| `SelectPicker(event: MouseEvent): PointSelection[]`  | 查询指针半径内的轮廓顶点，靠上的 Mesh 排在前面。 |

### 类型索引

`PointSelection`

### 导出关系

```ts
export default PointSelectTool;
export type { PointSelection };
```

## 3. 其他源码文件

## 4. 注意事项

- 使用完整场景搜索，noSelect 跳过辅助实体；命中按显示矩阵处理 ignoreZoom。点选和框选开关独立。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">选择器 点选 框选 边线 顶点 排序</keywords>
<keywords language="en">select picker selector edge point sorting</keywords>
```
