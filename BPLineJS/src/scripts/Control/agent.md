# 相机控制 Control

目录：`bplinejs/src/scripts/Control`

## 1. 文件结构与作用

鼠标、单指、双指操作和相机惯性。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `CameraControl/` | 鼠标、单指、双指操作和相机惯性。 详见该目录的 agent.md。 |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口


### 导出关系

```ts
export { default as CameraControl } from "./CameraControl";
export type {
    CameraControlChange, CameraControlOptions, CameraControlState, CameraPositionChange,
    CameraRotationChange, CameraZoomChange,
} from "./CameraControl";
```

## 3. 其他源码文件

## 4. 注意事项

- drag 是平移总开关，leftDrag/rightDrag/oFDrag/tFDrag 分开控制；通知使用局部变换，新值和旧值是独立快照。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">控制器 拖动 缩放 旋转 惯性 单指 双指 回调</keywords>
<keywords language="en">controller drag zoom rotation inertia touch callback</keywords>
```
