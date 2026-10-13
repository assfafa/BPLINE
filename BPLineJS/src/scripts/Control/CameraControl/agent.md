# 相机控制 Control

目录：`bplinejs/src/scripts/Control/CameraControl`

## 1. 文件结构与作用

鼠标、单指、双指操作和相机惯性。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |
| `ZoomLimits.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### CameraControl

本文件的类实现。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 本次使用的相机（构造参数引用）。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 持有画布及 GPU 资源的渲染器（构造参数引用）。 |
| `is`（公开） | `boolean`；`false` | 状态由 `_startActive`、`_startMove`、`_pointerEnd`、`_resetTouchAnchors` 读取或维护；完整处理见对应函数。 |
| `isActive`（公开） | `boolean`；`false` | 状态由 `_startActive`、`_startMove`、`_pointerEnd`、`_resetTouchAnchors` 读取或维护；完整处理见对应函数。 |
| `startEvent`（公开） | `Vec2`；`new Vec2(0, 0)` | 状态由 `_resetTouchAnchors`、`_transformTouchPair`、`_resetDragAnchor` 读取或维护；完整处理见对应函数。 |
| `startCamera`（公开） | `Vec2`；`new Vec2(0, 0)` | 状态由 `_resetTouchAnchors`、`_resetDragAnchor` 读取或维护；完整处理见对应函数。 |
| `drag`（公开） | `boolean`；`true` | 状态由 `_startActive`、`_startMove`、`_contextMenu`、`_pointerDown` 读取或维护；完整处理见对应函数。 |
| `leftDrag`（公开） | `boolean`；`true` | 是否允许鼠标左键拖动，默认开启；不影响触屏手势。 |
| `rightDrag`（公开） | `boolean`；`true` | 是否允许右键像左键一样拖动，默认开启；drag 是拖动总开关。 |
| `oFDrag`（公开） | `boolean`；`true` | 是否允许单指触摸拖动，默认开启；关闭后仍跟踪触点以识别双指。 |
| `tFDrag`（公开） | `boolean`；`true` | 是否允许双指触摸中心拖动，默认开启；不控制双指缩放和旋转。 |
| `inertia`（公开） | `boolean`；`true` | 是否启用平移、旋转、缩放惯性，默认开启；关闭后下次 update 立即停止。 |
| `damp`（公开） | `number`；`0.3` | 每 100ms 保留的动量比例，默认 0.3；0 立即停止，越接近 1 滑行越久。 |
| `zoom`（公开） | `boolean`；`true` | 状态由 `_transformTouchPair`、`_scroll`、`_applyInertia` 读取或维护；完整处理见对应函数。 |
| `rotate`（公开） | `boolean`；`true` | 是否允许双指旋转，默认开启；不改变鼠标操作。 |
| `focus`（公开） | `Vec2`；`new Vec2(0, 0)` | 状态由 `_startActive`、`_startMove`、`_resetTouchAnchors`、`_updateTouch` 读取或维护；完整处理见对应函数。 |
| `startZoom`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`_resetTouchAnchors`、`_setZoomAt` 读取或维护；完整处理见对应函数。 |
| `zoomRate`（公开） | `number`；`1` | 状态由 `_scroll` 读取或维护；完整处理见对应函数。 |
| `_minZoom`（内部） | `number`；`DEFAULT_MIN_ZOOM` | 控制器允许的最小累计缩放值，默认 0.0000000000001。（minZoom 的内部状态）。 |
| `_maxZoom`（内部） | `number`；`DEFAULT_MAX_ZOOM` | 控制器允许的最大累计缩放值，默认 999999999999。（maxZoom 的内部状态）。 |
| `_zoomChange`（内部） | `按初始化值推断`；`new Map<string, CameraZoomChange>()` | 状态由 `onZoom`、`deleteZoom`、`dispose`、`_notifyChange` 读取或维护；完整处理见对应函数。 |
| `_positionChange`（内部） | `按初始化值推断`；`new Map<string, CameraPositionChange>()` | 状态由 `onPosition`、`deletePosition`、`dispose`、`_notifyChange` 读取或维护；完整处理见对应函数。 |
| `_rotationChange`（内部） | `按初始化值推断`；`new Map<string, CameraRotationChange>()` | 状态由 `onRotation`、`deleteRotation`、`dispose`、`_notifyChange` 读取或维护；完整处理见对应函数。 |
| `_change`（内部） | `按初始化值推断`；`new Map<string, CameraControlChange>()` | 状态由 `constructor`、`onChange`、`deleteChange`、`dispose` 读取或维护；完整处理见对应函数。 |
| `_changeState`（内部） | `CameraControlState`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`_notifyChange` 读取或维护；完整处理见对应函数。 |
| `_notifyingChange`（内部） | `boolean`；`false` | 回调中的主动修改延后到本批通知结束，避免事件顺序交错。 |
| `_dragWorld`（内部） | `Vec2`；`new Vec2(0, 0)` | 拖动时锁定在鼠标下的世界坐标，不混用相机局部 position。 |
| `_touches`（内部） | `Map<number, Vec2>`；`new Map<number, Vec2>()` | 当前按住的触点；未选中的触点只记录位置，不参与相机变换。 |
| `_touchKeys`（内部） | `number[]`；`[]` | 当前手势锁定的 pointerId，最多两个；松开后不使用其他触点补位。 |
| `_pairLocked`（内部） | `boolean`；`false` | 已建立过双指手势后，直到本轮所有手指松开才允许重新选点。 |
| `_touchWorld`（内部） | `[Vec2, Vec2]`；`[new Vec2(0, 0), new Vec2(0, 0)]` | 两个触点按下处的世界坐标，用于保持缩放、旋转时贴合手指。 |
| `_touchFrame`（内部） | `number \| undefined`；`undefined` | 同一帧集中处理触点，既收集同时按下的手指，也避免双指分别更新时抖动。 |
| `_mouseKey`（内部） | `number \| undefined`；`undefined` | 鼠标与触控共用 Pointer Events，但不会同时控制相机。 |
| `_mouseButton`（内部） | `number`；`0` | 当前鼠标拖动使用的按键，移动期间用于响应左右键开关变化。 |
| `_motionTime`（内部） | `number`；`Time.now()` | 统一使用 Time.now 的毫秒时钟，不创建帧数或 FPS 日志。 |
| `_motion`（内部） | `CameraMotionSample[]`；`[]` | 最近 100ms 的轨迹，额外保留窗口左侧一条数据以插值到准确时间边界。 |
| `_velocity`（内部） | `{ x: number; y: number; rotation: number; logZoom: number; }`；`{ x: 0, y: 0, rotation: 0, logZoom: 0 }` | 局部坐标/秒、弧度/秒、对数缩放/秒；停止后全部归零。 |
| `_wheelMotion`（内部） | `WheelMotionSample[]`；`[]` | 最近 100ms 的滚轮缩放增量，单个滚轮刻度也能生成惯性。 |
| `_wheelInertia`（内部） | `boolean`；`false` | 区分滚轮焦点缩放与拖动松手后的自由运动。 |
| `_wheelScreen`（内部） | `Vec2`；`new Vec2(0, 0)` | 最后一次滚轮事件的屏幕焦点，不跟随之后的鼠标悬停移动。 |
| `_wheelWorld`（内部） | `Vec2`；`new Vec2(0, 0)` | 滚轮惯性期间保持落在 _wheelScreen 下的世界坐标。 |
| `_events`（内部） | `AbortController`；`new AbortController()` | 注销控制器时统一移除监听器。 |
| `_touchAction`（内部） | `string`；`由构造参数或初始化过程赋值` | 注销后恢复容器原有的浏览器触摸行为。 |

#### 构造与案例

```ts
constructor(camera: Camera, render: Render)
```

创建对象并建立初始状态及依赖关联。

```ts
const cameraControl = new CameraControl(camera, render);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `onZoom(key: string, callback: CameraZoomChange): void`  | 无返回值。 |
| `deleteZoom(key: string): boolean`  | 是否移除了已有回调。 |
| `onPosition(key: string, callback: CameraPositionChange): void`  | 无返回值，位置使用相机父级局部坐标。 |
| `deletePosition(key: string): boolean`  | 是否移除了已有回调。 |
| `onRotation(key: string, callback: CameraRotationChange): void`  | 无返回值。 |
| `deleteRotation(key: string): boolean`  | 是否移除了已有回调。 |
| `onChange(key: string, callback: CameraControlChange): void`  | 无返回值，一次组合变换只通知一次，外部修改在 update 时检测。 |
| `deleteChange(key: string): boolean`  | 是否移除了已有回调。 |
| `get minZoom(): number`  | 控制器允许的最小累计缩放值，默认 0.0000000000001。 |
| `set minZoom(value: number)`  | 设置最小累计缩放值；修改边界时立即约束当前相机。 |
| `get maxZoom(): number`  | 控制器允许的最大累计缩放值，默认 999999999999。 |
| `set maxZoom(value: number)`  | 设置最大累计缩放值；修改边界时立即约束当前相机。 |
| `init(): void` （内部） | 初始化相机控制 |
| `_startActive(e: MouseEvent): void` （内部） | 开始激活相机控制 |
| `_startMove(e: MouseEvent): void` （内部） | 处理鼠标移动事件，更新相机位置 |
| `_contextMenu(e: MouseEvent): void` （内部） | 启用右键拖动时阻止菜单遮挡操作，关闭后保留浏览器菜单。 |
| `_pointerDown(e: PointerEvent): void` （内部） | 接收新指针；双指锁定后新增手指不会改变手势。 |
| `_pointerMove(e: PointerEvent): void` （内部） | 更新指针位置；只有锁定的触点才能驱动当前手势。 |
| `_pointerEnd(e: PointerEvent): void` （内部） | 松开锁定触点时降为单指或结束，不从其他手指中寻找替补。 |
| `_scheduleTouch(): void` （内部） | 将同一帧内的触摸事件合并，浏览器没有“同时 pointerdown”的单独事件。 |
| `_selectTouchPair(): void` （内部） | 初次建立双指手势时用 O(n²) 找最远点，之后只使用锁定 ID。 |
| `_resetTouchAnchors(): void` （内部） | 保存选中触点的世界锚点和屏幕中心，切换手势时不改变相机。 |
| `_updateTouch(): void` （内部） | 更新单指拖动或双指组合变换，缩放使用真实距离比例而非滚轮步进。 |
| `_transformTouchPair(first: Vec2, second: Vec2): void` （内部） | 让双指对应的世界线段贴合当前手指线段，并围绕中点缩放、旋转。 |
| `_cancelPointers(): void` （内部） | 失焦或注销时结束所有指针，避免重新回到页面后继续拖动。 |
| `dispose(): void`  | 移除控制器监听并恢复容器原有触摸行为，不销毁相机或渲染器。 |
| `_scroll(e: WheelEvent): void` （内部） | 按滚轮事件的实际位置缩放；拖动中先对齐锚点，再执行焦点缩放。 |
| `_wheelZoom(rate: number): void` （内部） | 累计最近 100ms 滚轮输入，并让后续惯性始终围绕最后的滚轮焦点。 |
| `_applyWheelZoom(boundedZoom: number): void` （内部） | 应用经过边界约束的滚轮缩放并记录实际产生的动量。 |
| `zoomUpdate(center: Vec2, rate: number): void`  | 围绕指定屏幕点缩放，保持该点对应的世界坐标不变。 |
| `_setZoomAt(center: Vec2, nextZoom: number): void` （内部） | 应用已验证的缩放值并保持焦点，不清除调用方正在收集的动量轨迹。 |
| `_limitZoom(value: number): number` （内部） | 把有效缩放值夹在当前控制器范围内，溢出时仍落在边界上。 |
| `_constrainCameraZoom(): void` （内部） | 配置边界改变后同步当前相机并清除过时的缩放动量。 |
| `_resetDragAnchor(): void` （内部） | 保存当前拖动基准；相机位置保存为世界坐标，不预乘 zoom。 |
| `_moveToAnchor(screen: Vec2, anchor: Vec2): void` （内部） | 平移相机，使指定世界坐标落在目标鼠标位置。 |
| `stopMotion(): void`  | 停止尚未结束的相机惯性，编辑器可在起笔时冻结当前视角。 |
| `_stopMotion(): void` （内部） | 清除动量和旧轨迹，不改变当前相机变换。 |
| `_beginMotion(): void` （内部） | 新操作立即中断惯性，并保存带毫秒时间戳的起始相机状态。 |
| `_recordMotion(now: number): void` （内部） | 记录相机状态并裁剪时间窗口；停住不动也要采样，避免松手使用旧速度。 |
| `_releaseMotion(): void` （内部） | 正常松手后按最近 100ms 的累计变化量计算每秒速度。 |
| `_applyInertia(seconds: number): void` （内部） | 按实际秒数积分指数衰减的速度，更新频率改变不会改变衰减时长。 |
| `update(): void`  | 操作中记录最近 100ms 轨迹，操作结束后按实际经过时间更新惯性。 由外部动画循环调用，不自行启动另一个持续运行的动画循环。 |
| `_captureChangeState(): CameraControlState` （内部） | 独立只读的相机局部变换快照。 |
| `_notifyChange(): void` （内部） | 无返回值，仅通知实际数值变化，静止帧不分配快照。 |

### 类型索引

`CameraControlState`、`CameraZoomChange`、`CameraPositionChange`、`CameraRotationChange`、`CameraControlChange`、`CameraMotionSample`、`WheelMotionSample`、`CameraControlOptions`

### 导出关系

```ts
export default CameraControl;
export type {
    CameraControlChange, CameraControlOptions, CameraControlState, CameraPositionChange,
    CameraRotationChange, CameraZoomChange,
};
```

## 3. 其他源码文件

### 文件：ZoomLimits.ts


### 导出关系

```ts
export { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM };
```

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
