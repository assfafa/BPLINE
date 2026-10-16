# 字体几何 Text

目录：`bpmatrixjs/src/scripts/Geometry/Text`

## 1. 文件结构与作用

字体注册、布局、曲线离散及带孔字形剖分。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Buffers.ts` | 根据总顶点数挑选索引位宽。；包装文字几何公共度量及缓冲。；为填充区域生成包围盒 UV；零尺寸轴返回中线 UV。 |
| `Fonts.ts` | 已注册的 WASM 字体；字体字节、曲线和三角化均由 C++ 管理。 |
| `index.ts` | WOFF2 等字体的二维文字几何生成器。 字体数据须预先使用 RegisterTextFont 注册；填充网格按可见包围盒居中。 |
| `Outline.ts` | 读取 WASM 排版及三角化结果，按完整生成参数共享内部缓存。 |
| `types.ts` | 类型、桶导出或模块入口；具体符号见下面的文件索引。 |

## 2. index 入口、案例与类接口

### Text

WOFF2 等字体的二维文字几何生成器。
字体数据须预先使用 RegisterTextFont 注册；填充网格按可见包围盒居中。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_metadata`（内部） | `TextMetadata`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`set`、`createBorderGeometry`、`createLineGeometry` 读取或维护；完整处理见对应函数。 |
| `_originPrecision`（内部） | `number`；`由构造参数或初始化过程赋值` | 用户最后指定的精度。（originPrecision 的内部状态）。 |
| `_outline`（内部） | `TextOutline`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`set`、`getPerimeter`、`createBorderGeometry` 读取或维护；完整处理见对应函数。 |
| `_data`（内部） | `TextGeometryData`；`由构造参数或初始化过程赋值` | 填充三角面数据（data 的内部状态）。 |
| `_borderData`（内部） | `TextBorderGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的边框数据（borderData 的内部状态）。 |
| `_lineData`（内部） | `TextLineGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的线框数据（lineData 的内部状态）。 |
| `_pointData`（内部） | `TextPointGeometryData \| undefined`；`由构造参数或初始化过程赋值` | 最近生成的点位数据（pointData 的内部状态）。 |

#### 构造与案例

```ts
constructor(text: string, fontSize: number, fontFamily: string, options: TextOptions = {})
```

创建文字几何，默认居中且没有额外行距和字距。

```ts
const textGeometry = new Text("你好\n世界", 32, "MiSans", { lineSpacing: 4 });
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `set(text: string, fontSize: number = this.fontSize, fontFamily: string = this.fontFamily, options: TextOptions = {}): this`  | 原子更新文字及排版设置，并使边框、线框和点位缓存失效。 |
| `getPerimeter(): number`  | 获取所有可见字形边界的周长。 |
| `createBorderGeometry( lineWidth: number = 1, uvRepeat: number = 1, align: TextBorderAlign = "normal", ): TextBorderGeometryData`  | 生成双顶点边框载体，边框宽度由 Shader 使用。 |
| `createLineGeometry(uvRepeat: number = 1): TextLineGeometryData`  | 生成所有可见字形边界的 line-list。 |
| `createPointGeometry( pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, ): TextPointGeometryData`  | 沿字形边界生成可独立绘制的顶点和中点标记。 |
| `get precision(): number`  | 当前字体曲线精度，误差为 4 / precision。 |
| `set precision(value: number)`  | 无返回值，重建曲线并清理附加缓存。 |
| `get originPrecision(): number`  | 用户最后指定的精度。 |
| `get text(): string`  | 当前文字内容 |
| `get fontSize(): number`  | 当前字号 |
| `get fontFamily(): string`  | 当前字体名称 |
| `get width(): number`  | 可见文字包围盒宽度 |
| `get height(): number`  | 可见文字包围盒高度 |
| `get advanceWidth(): number`  | 最大行的排版宽度 |
| `get lineSpacing(): number`  | 当前额外行距 |
| `get letterSpacing(): number`  | 当前额外字距 |
| `get textAlign(): TextAlign`  | 当前水平对齐方式 |
| `get baseline(): TextBaseline`  | 当前垂直基线锚点 |
| `get data(): TextGeometryData`  | 填充三角面数据 |
| `get contours(): Float32Array[]`  | 全部可见外圈与孔圈的独立 Float32 副本，不含剖分添加的直边节点。 |
| `get borderData(): TextBorderGeometryData \| undefined`  | 最近生成的边框数据 |
| `get lineData(): TextLineGeometryData \| undefined`  | 最近生成的线框数据 |
| `get pointData(): TextPointGeometryData \| undefined`  | 最近生成的点位数据 |
| `static CreateGeometry(text: string, fontSize: number, fontFamily: string, options: TextOptions = {}): TextGeometryData`  | 静态创建填充三角面，与 CreateTextGeometry 等价。 |
| `static CreateBorderGeometry( text: string, fontSize: number, fontFamily: string, lineWidth: number = 1, uvRepeat: number = 1, align: TextBorderAlign = "normal", options: TextOptions = {}, ): TextBorderGeometryData`  | 静态创建边框载体，与 CreateTextBorderGeometry 等价。 |
| `static CreateLineGeometry( text: string, fontSize: number, fontFamily: string, uvRepeat: number = 1, options: TextOptions = {}, ): TextLineGeometryData`  | 静态创建 line-list，与 CreateTextLineGeometry 等价。 |
| `static CreatePointGeometry( text: string, fontSize: number, fontFamily: string, pointRadius: number = 2, sides: number = 4, vertexPoints: boolean = true, midpointPoints: boolean = false, vertexThreshold: number = 0, midpointThreshold: number = 0, options: TextOptions = {}, ): TextPointGeometryData`  | 静态创建边界关键点，与 CreateTextPointGeometry 等价。 |
| `static GetPerimeter(text: string, fontSize: number, fontFamily: string, options: TextOptions = {}): number`  | 静态取得可见边界周长。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Nonnegative` | 校验有限非负的几何参数。 |
| `NormalizeOptions` | 标准化新增的文字排版参数。 |
| `CreateTextGeometry` | 直接创建文字填充几何。 |
| `CreateTextBorderGeometry` | 直接创建文字边框载体。 |
| `CreateTextLineGeometry` | 直接创建文字 line-list。 |
| `CreateTextPointGeometry` | 直接创建文字边界关键点。 |
| `GetTextPerimeter` | 取得文字所有可见边界的总周长。 |

```ts
Nonnegative(2, "lineWidth");
```

### 导出关系

```ts
export {
    CreateTextBorderGeometry, CreateTextGeometry, CreateTextLineGeometry,
    CreateTextPointGeometry,
    GetTextFont, GetTextPerimeter, HasTextFont, RegisterTextFont, Text, TextFont, UnregisterTextFont,
};
export type {
    TextCacheStats, TextGlyph, TextGlyphPosition, TextRun,
    TextAlign,
    TextBaseline, TextBorderAlign, TextBorderGeometryData, TextGeometryData, TextLike, TextLineGeometryData, TextOptions, TextPointGeometryData,
};
export default Text;
```

## 3. 其他源码文件

### 文件：Buffers.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `PackIndices` | 根据总顶点数挑选索引位宽。 |
| `Pack` | 包装文字几何公共度量及缓冲。 |
| `FillUv` | 为填充区域生成包围盒 UV；零尺寸轴返回中线 UV。 |
| `BuildFillBuffers` | 将剖分器输出的三角面统一改为顺时针绕序。 |
| `CreateFillBuffers` | 复用完整填充模板，仅复制公开可修改的类型化数组；轮廓释放后模板自动回收。 |
| `GetJoin` | 计算字形轮廓在一个节点处的外法线和斜接倍数。 剖分器边界的填充总在路径左侧，右法线指向非填充区，包括内孔。 |
| `GetDistances` | 计算闭合边界各节点的累计长度和总长。 |
| `CreateLineBuffers` | 生成每条填充边界独立闭合的 line-list。 |
| `CreateBorderBuffers` | 生成与 Rect 一致的双顶点 Shader 外扩边框载体。 |
| `CollectPointCenters` | 收集经过长度筛选的边界节点和线段中点。 |
| `CreatePointBuffers` | 在筛选后的边界关键点上生成独立点型三角面。 |

```ts
PackIndices(3, [0, 1, 2]);
```

### 类型索引

`TextMetadata`

### 导出关系

```ts
export { CreateBorderBuffers, CreateFillBuffers, CreateLineBuffers, CreatePointBuffers };
export type { TextMetadata };
```

### 文件：Fonts.ts

### TextFont

已注册的 WASM 字体；字体字节、曲线和三角化均由 C++ 管理。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `version`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor`、`shape`、`mesh`、`cacheStats` 读取或维护；完整处理见对应函数。 |
| `unitsPerEm`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |
| `ascent`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |
| `descent`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |
| `lineGap`（公开） | `number`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |
| `_module`（内部） | `TextWasmModule`；`由构造参数或初始化过程赋值` | 原生模块（构造参数引用）。 |
| `_disposed`（内部） | `按初始化值推断`；`false` | 状态由 `dispose`、`requireActive` 读取或维护；完整处理见对应函数。 |
| `_shapes`（内部） | `按初始化值推断`；`new TextCache<TextRun>()` | 状态由 `shape`、`cacheStats`、`clearCache`、`dispose` 读取或维护；完整处理见对应函数。 |
| `_outlines`（内部） | `按初始化值推断`；`new TextCache<TextOutline>()` | 状态由 `outline`、`cacheStats`、`clearCache`、`dispose` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor(module: TextWasmModule, metrics: Float64Array)
```

原生字体的 JS 所有者。

```ts
new TextFont(module, metrics);
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `shape(text: string): TextRun`  | 只读字形定位和 UTF-16 簇信息，不生成三角面。 |
| `outline(key: string, create: () => TextOutline): TextOutline`  | 内部共享的只读轮廓。 |
| `mesh(text: string, fontSize: number, lineSpacing: number, letterSpacing: number, align: number, tolerance: number): Float64Array`  | 调用 C++ 的完整文字几何管线。 |
| `get cacheStats(): TextCacheStats`  | 缓存命中、构建次数及内存估算快照。 |
| `clearCache(): void`  | 清空缓存及统计，保留字体注册。 |
| `dispose(): void`  | 释放字体及缓存，重复调用安全。 |
| `requireActive(): void` （内部） | 已释放字体抛错，避免访问无效句柄。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `RegisterTextFont` | 异步初始化 WASM 并注册字体，完成后可同步创建几何。 |
| `HasTextFont` | 注册完成状态。 |
| `UnregisterTextFont` | 是否删除已有字体；同时取消在途注册。 |
| `GetTextFont` | 已注册 WASM 字体。 |

```ts
await RegisterTextFont("MiSans", await response.arrayBuffer());
```

### 类型索引

`TextGlyph`、`TextGlyphPosition`、`TextRun`、`TextCacheStats`

### 导出关系

```ts
export { GetTextFont, HasTextFont, RegisterTextFont, TextFont, UnregisterTextFont };
export type { TextCacheStats, TextGlyph, TextGlyphPosition, TextRun };
```

### 文件：Outline.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateTextOutline` | 读取 WASM 排版及三角化结果，按完整生成参数共享内部缓存。 |

```ts
CreateTextOutline("你好", 16, "MiSans");
```

### 类型索引

`TextPoint`、`TextOutline`

### 导出关系

```ts
export { CreateTextOutline };
export type { TextOutline, TextPoint };
```

### 文件：types.ts


### 类型索引

`TextAlign`、`TextBaseline`、`TextOptions`、`TextGeometryData`、`TextBorderAlign`、`TextBorderGeometryData`、`TextLineGeometryData`、`TextPointGeometryData`、`TextLike`

### 导出关系

```ts
export type {
    TextAlign,
    TextBaseline, TextBorderAlign,
    TextBorderGeometryData, TextGeometryData, TextLike, TextLineGeometryData, TextOptions, TextPointGeometryData,
};
```

## 4. 注意事项

- 字体名称先注册；轮廓按字形真实包围盒居中，细分精度变化不改变排版中心。孔轮廓由文字专用剖分处理。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">字体 文字 字形 排版 字距 行距 三角化</keywords>
<keywords language="en">font text glyph layout spacing triangulation</keywords>
```
