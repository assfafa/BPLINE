# 选择 Select

目录：`bplinejs/src/scripts/Select/TextSelectTool`

## 1. 文件结构与作用

集合点选、框选、边线和顶点命中。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 文字只以排版矩形进行点选与框选，不读取字形三角面。 |

## 2. index 入口、案例与类接口

### TextSelectTool

文字只以排版矩形进行点选与框选，不读取字形三角面。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `picker`（公开） | `boolean`；`true` | 是否允许点选，默认开启。 |
| `selector`（公开） | `boolean`；`true` | 是否允许框选，默认开启。 |
| `selectionMode`（公开） | `RectSelectionMode`；`"all"` | 完整包围或任意相交，与其他面选择器一致。 |
| `_scene`（内部） | `Scene`；`由构造参数或初始化过程赋值` | 待选择场景（构造参数引用）。 |
| `_render`（内部） | `Render`；`由构造参数或初始化过程赋值` | 画布与屏幕尺寸（构造参数引用）。 |
| `_camera`（内部） | `Camera`；`由构造参数或初始化过程赋值` | 显示矩阵对应相机（构造参数引用）。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera)
```

创建只检查文字包围框的选择器。

```ts
const tool = new TextSelectTool(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `SelectPicker(event: MouseEvent): Mesh[]`  | 从上到下命中的文字 Mesh。 |
| `Selector(selectionMesh: Mesh): Mesh[]`  | 包围盒满足框选模式的文字 Mesh。 |
| `locate(mesh: Mesh, client: Vec2): TextSelection \| null`  | 把已选文字中的屏幕位置解析成最近的字符区域和插入位置。 |
| `SelectCaret(event: MouseEvent): TextSelection[]`  | 命中文字的字符区域和最近光标位置。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateTextFootprint` | 排版矩形，非文字返回 null。 |

```ts
CreateTextFootprint(mesh);
```

### 类型索引

`TextSelection`

### 导出关系

```ts
export default TextSelectTool;
export { CreateTextFootprint };
export type { TextSelection };
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
