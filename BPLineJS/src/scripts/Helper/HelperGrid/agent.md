# 辅助显示 Helper

目录：`bplinejs/src/scripts/Helper/HelperGrid`

## 1. 文件结构与作用

背景网格、标尺与缩放适配。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `CustomStyle.ts` | 五个颜色字段分别订阅 Color；替换引用或修改颜色分量都会通知网格。 |
| `gridFragment.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `gridVertex.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `index.ts` | 网格与标尺各由一件 Mesh 绘制，分别拥有材质和排序层级。 |
| `rulerFragment.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `RulerLabels.ts` | 将刻度编号转换为十进制字符串，先用整数单位组合以避开浮点尾数和 GPU 精度问题。；编码一个数字字符，10 是小数点，11 是负号。；生成屏幕刻度位置及字形缓存；世界坐标仅在 CPU 上生成标签内容。 |

## 2. index 入口、案例与类接口

### HelperGrid

网格与标尺各由一件 Mesh 绘制，分别拥有材质和排序层级。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_gridStyle`（内部） | `Style`；`CreateHelperStyle()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_rulerStyle`（内部） | `Style`；`CreateHelperStyle()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_gridGeometry`（内部） | `Base2D`；`new Base2D({ vertices: SCREEN_TRIANGLES, style: this._gridStyle })` | 状态由 `destroy` 读取或维护；完整处理见对应函数。 |
| `_rulerGeometry`（内部） | `Base2D`；`new Base2D({ vertices: SCREEN_TRIANGLES, style: this._rulerStyle })` | 状态由 `destroy` 读取或维护；完整处理见对应函数。 |
| `material`（公开） | `WGSLMaterial`；`new WGSLMaterial(this._gridStyle)` | 网格的自定义 WGSL 材质。 |
| `mesh`（公开） | `Mesh`；`new Mesh(this._gridGeometry, this.material, this._gridStyle)` | 世界网格背景 Mesh；始终不参与选择器拾取。 |
| `rulerMaterial`（公开） | `WGSLMaterial`；`new WGSLMaterial(this._rulerStyle)` | 标尺独立的自定义 WGSL 材质。 |
| `rulerMesh`（公开） | `Mesh`；`new Mesh(this._rulerGeometry, this.rulerMaterial, this._rulerStyle)` | 屏幕标尺 Mesh，默认盖在场景内容上。 |
| `render`（公开） | `Render`；`由构造参数或初始化过程赋值` | 网格所在的渲染器。 |
| `camera`（公开） | `Camera`；`由构造参数或初始化过程赋值` | 坐标和缩放基准相机。 |
| `_transform`（内部） | `Mat3`；`new Mat3()` | 状态由 `constructor`、`update` 读取或维护；完整处理见对应函数。 |
| `_rulerConfig`（内部） | `Mat3`；`new Mat3()` | 状态由 `constructor`、`syncRulerConfig` 读取或维护；完整处理见对应函数。 |
| `_viewport`（内部） | `Vec2`；`new Vec2(1, 1)` | 状态由 `constructor`、`syncRulerConfig`、`update` 读取或维护；完整处理见对应函数。 |
| `_horizontalTicks`（内部） | `Vec2`；`new Vec2(0, 1000000000)` | 状态由 `constructor`、`update` 读取或维护；完整处理见对应函数。 |
| `_verticalTicks`（内部） | `Vec2`；`new Vec2(0, 1000000000)` | 状态由 `constructor`、`update` 读取或维护；完整处理见对应函数。 |
| `_horizontalLabels`（内部） | `Float32Array`；`new Float32Array(RULER_LABEL_CAPACITY * RULER_LABEL_STRIDE)` | 状态由 `constructor`、`update` 读取或维护；完整处理见对应函数。 |
| `_verticalLabels`（内部） | `Float32Array`；`new Float32Array(RULER_LABEL_CAPACITY * RULER_LABEL_STRIDE)` | 状态由 `constructor`、`update` 读取或维护；完整处理见对应函数。 |
| `_custom`（内部） | `HelperGridCustomStyle`；`new HelperGridCustomStyle()` | 当前自定义配色对象。（custom 的内部状态）。 |
| `_customColors`（内部） | `Float32Array<ArrayBuffer>`；`new Float32Array(20)` | 状态由 `constructor`、`syncCustomColors` 读取或维护；完整处理见对应函数。 |
| `_mode`（内部） | `HelperGridMode`；`"dark"` | 当前日间、夜间或自定义模式。（mode 的内部状态）。 |
| `_minorPerMajor`（内部） | `number`；`10` | 每条主栅格线之间的次栅格数。（minorPerMajor 的内部状态）。 |
| `_ruler`（内部） | `boolean`；`true` | 是否绘制尺子。（ruler 的内部状态）。 |
| `_horizontalRuler`（内部） | `HorizontalRuler`；`"bottom"` | 横尺所在边。（horizontalRuler 的内部状态）。 |
| `_verticalRuler`（内部） | `VerticalRuler`；`"left"` | 竖尺所在边。（verticalRuler 的内部状态）。 |
| `_snapshot`（内部） | `GridSnapshot \| null`；`null` | 状态由 `minorPerMajor`、`horizontalRuler`、`verticalRuler`、`update` 读取或维护；完整处理见对应函数。 |
| `_destroyed`（内部） | `boolean`；`false` | 状态由 `update`、`destroy` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(scene: Scene, render: Render, camera: Camera)
```

创建屏幕背景与独立标尺。每个 Render 应创建自己的 HelperGrid。

```ts
const grid = new HelperGrid(scene, render, camera);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get mode(): HelperGridMode`  | 当前日间、夜间或自定义模式。 |
| `set mode(value: HelperGridMode)`  | 无返回值。 |
| `get custom(): HelperGridCustomStyle`  | 当前自定义配色对象。 |
| `set custom(value: HelperGridCustomColors)`  | 无返回值。 |
| `onHelperGridCustomStyleChange(style: HelperGridCustomStyle): void`  | 将 Color 的原地修改转交给材质数组更新。 |
| `syncCustomColors(): void` （内部） | 无返回值。 |
| `get minorPerMajor(): number`  | 每条主栅格线之间的次栅格数。 |
| `set minorPerMajor(value: number)`  | 无返回值。 |
| `get ruler(): boolean`  | 是否绘制尺子。 |
| `set ruler(value: boolean)`  | 无返回值。 |
| `get horizontalRuler(): HorizontalRuler`  | 横尺所在边。 |
| `set horizontalRuler(value: HorizontalRuler)`  | 无返回值。 |
| `get verticalRuler(): VerticalRuler`  | 竖尺所在边。 |
| `set verticalRuler(value: VerticalRuler)`  | 无返回值。 |
| `syncRulerConfig(): void` （内部） | 把标尺配置打包为一个 mat3 uniform，避免超过每阶段 uniform 绑定数量上限。 |
| `update(): void`  | 将相机的双精度世界位置折叠为周期相位，并重新生成可见尺子数字。 |
| `destroy(): void`  | 移除两层辅助 Mesh 并解除各自的材质与几何订阅。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GridPhase` | 将可能为负数的世界坐标折叠到当前主栅格周期，避免大坐标进入 GPU。 |
| `CreateHelperStyle` | 开启实体面的独立辅助样式，网格与标尺不共享材质。 |

```ts
GridPhase(-105, 100);
```

### 类型索引

`HelperGridMode`、`HorizontalRuler`、`VerticalRuler`、`GridSnapshot`

### 导出关系

```ts
export default HelperGrid;
export { HelperGridCustomStyle };
export type { HelperGridCustomColors, HelperGridMode, HorizontalRuler, VerticalRuler };
```

## 3. 其他源码文件

### 文件：CustomStyle.ts

### HelperGridCustomStyle

五个颜色字段分别订阅 Color；替换引用或修改颜色分量都会通知网格。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_gridMinorColor`（内部） | `Color`；`new Color("#2e333d")` | 次栅格颜色。（gridMinorColor 的内部状态）。 |
| `_gridMajorColor`（内部） | `Color`；`new Color("#4a5463")` | 主栅格颜色。（gridMajorColor 的内部状态）。 |
| `_rulerMinorColor`（内部） | `Color`；`new Color("#929aa6")` | 标尺次刻度颜色。（rulerMinorColor 的内部状态）。 |
| `_rulerMajorColor`（内部） | `Color`；`new Color("#c9d1de")` | 标尺主刻度颜色。（rulerMajorColor 的内部状态）。 |
| `_rulerTextColor`（内部） | `Color`；`new Color("#c9d1de")` | 标尺数字颜色。（rulerTextColor 的内部状态）。 |
| `_subscribers`（内部） | `按初始化值推断`；`new Set<HelperGridCustomStyleSubscriber>()` | 状态由 `add`、`delete`、`dispose`、`notify` 读取或维护；完整处理见对应函数。 |
| `_batching`（内部） | `boolean`；`false` | 状态由 `setColors`、`notify` 读取或维护；完整处理见对应函数。 |
| `_pendingChange`（内部） | `boolean`；`false` | 状态由 `setColors`、`notify` 读取或维护；完整处理见对应函数。 |
| `_version`（内部） | `number`；`0` | 配色变化版本。（version 的内部状态）。 |

#### 构造与案例

```ts
constructor(colors?: HelperGridCustomColors)
```

创建网格与标尺自定义配色。

```ts
const colors = new HelperGridCustomStyle();
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get version(): number`  | 配色变化版本。 |
| `get gridMinorColor(): Color`  | 次栅格颜色。 |
| `set gridMinorColor(value: Color)`  | 无返回值。 |
| `get gridMajorColor(): Color`  | 主栅格颜色。 |
| `set gridMajorColor(value: Color)`  | 无返回值。 |
| `get rulerMinorColor(): Color`  | 标尺次刻度颜色。 |
| `set rulerMinorColor(value: Color)`  | 无返回值。 |
| `get rulerMajorColor(): Color`  | 标尺主刻度颜色。 |
| `set rulerMajorColor(value: Color)`  | 无返回值。 |
| `get rulerTextColor(): Color`  | 标尺数字颜色。 |
| `set rulerTextColor(value: Color)`  | 无返回值。 |
| `setColors(colors: HelperGridCustomColors): this`  | 批量替换五个颜色引用，一次提交变更通知。 |
| `add(subscriber: HelperGridCustomStyleSubscriber): void`  | 绑定网格消费者。 |
| `delete(subscriber: HelperGridCustomStyleSubscriber): void`  | 解除网格消费者。 |
| `onColorChange(color: Color, field: string): void`  | 将 Color 的原地修改转为配色变化。 |
| `dispose(): void`  | 无返回值。 |
| `getColor(field: string): Color \| null` （内部） | 取得字段当前绑定的 Color。 |
| `replaceColor(field: keyof HelperGridCustomColors, value: Color): void` （内部） | 更换一个 Color 字段并重绑订阅。 |
| `notify(): void` （内部） | 无返回值。 |

### 类型索引

`HelperGridCustomColors`、`HelperGridCustomStyleSubscriber`

### 导出关系

```ts
export default HelperGridCustomStyle;
export type { HelperGridCustomColors, HelperGridCustomStyleSubscriber };
```

### 文件：RulerLabels.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `FormatRulerNumber` | 将刻度编号转换为十进制字符串，先用整数单位组合以避开浮点尾数和 GPU 精度问题。 |
| `EncodeRulerCharacter` | 编码一个数字字符，10 是小数点，11 是负号。 |
| `FillRulerLabels` | 生成屏幕刻度位置及字形缓存；世界坐标仅在 CPU 上生成标签内容。 |

```ts
FormatRulerNumber(100, 0.01);
```

### 类型索引

`RulerTickLayout`

### 导出关系

```ts
export { FillRulerLabels, FormatRulerNumber, RULER_LABEL_CAPACITY, RULER_LABEL_STRIDE };
export type { RulerTickLayout };
```

## 4. 注意事项

- 屏幕辅助 Shader 绕过普通世界包围盒裁剪；网格与标尺各有独立 Mesh 和材质。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">辅助 网格 标尺 尺子 主题</keywords>
<keywords language="en">helper grid ruler scale theme</keywords>
```
