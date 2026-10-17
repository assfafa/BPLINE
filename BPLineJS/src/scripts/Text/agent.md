# 文字 Text

目录：`bplinejs/src/scripts/Text`

## 1. 文件结构与作用

静态字体表、排版几何和光标布局。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `font.ts` | 按名称共享已加载字体，供后续文字几何直接使用。 |
| `index.ts` | 可编辑文字几何；填充、实体边框、关键点和线框共享同一次字体排版。 |
| `layout.ts` | 测量文字的可交互矩形及字符区域，空文字至少保留一个 em 方框。 |
| `VerticalLayout.ts` | 用与 WASM 相同的竖排字形定位度量计算包围盒和原文字符区域。 |

## 2. index 入口、案例与类接口

### Text

可编辑文字几何；填充、实体边框、关键点和线框共享同一次字体排版。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Text"` | 用于材质和管线选择的几何类型。 |
| `_text`（内部） | `string`；`""` | 未经排列转换的输入文字。（text 的内部状态）。 |
| `_layoutText`（内部） | `string`；`""` | 竖排转置后的行文本预览；实际几何按原文和 writingMode 布局。（layoutText 的内部状态）。 |
| `_fontSize`（内部） | `number`；`16` | 当前几何字号。（fontSize 的内部状态）。 |
| `_fontFamily`（内部） | `string`；`""` | 已注册的字体名称。（fontFamily 的内部状态）。 |
| `_lineSpacing`（内部） | `number`；`0` | 当前额外行距。（lineSpacing 的内部状态）。 |
| `_letterSpacing`（内部） | `number`；`0` | 当前额外字距。（letterSpacing 的内部状态）。 |
| `_textAlign`（内部） | `TextAlign`；`"center"` | 水平对齐方式。（textAlign 的内部状态）。 |
| `_baseline`（内部） | `TextBaseline`；`"middle"` | 基线锚点方式。（baseline 的内部状态）。 |
| `_writingMode`（内部） | `TextWritingMode`；`"horizontal-tb"` | 当前文字排列顺序。（writingMode 的内部状态）。 |
| `_width`（内部） | `number`；`0` | 居中可见包围盒宽度。（width 的内部状态）。 |
| `_height`（内部） | `number`；`0` | 居中可见包围盒高度。（height 的内部状态）。 |
| `_advanceWidth`（内部） | `number`；`0` | 排版后的最大行宽。（advanceWidth 的内部状态）。 |
| `_anchorX`（内部） | `number`；`0` | 按 textAlign 选取的局部水平锚点。（anchorX 的内部状态）。 |
| `_anchorY`（内部） | `number`；`0` | 按 baseline 选取的局部垂直锚点。（anchorY 的内部状态）。 |
| `_perimeter`（内部） | `number`；`0` | 可见字形边界总长度。（perimeter 的内部状态）。 |
| `_contours`（内部） | `Float32Array[]`；`[]` | 全部可见字形边界的独立副本，用于降级编辑，不改变文字的包围盒选取方式。（contours 的内部状态）。 |

#### 构造与案例

```ts
constructor(
        text: string,
        fontSize: number = 16,
        fontFamily: string = GetDefaultFontFamily(),
        options: Text2DOptions | null = null,
    )
```

创建文字几何。字体须先通过 Font.register 加载。

```ts
const text = new Text("你好");
const vertical = new Text("你好\n世界", 48, "MiSans", { writingMode: "vertical-rl" });
```

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override copy(source: Text): this`  | 当前文字几何体。 |
| `override clone(): Text`  | 独立的文字几何体。 |
| `get text(): string`  | 未经排列转换的输入文字。 |
| `set text(value: string)`  | 设置原文，并根据 writingMode 转成几何生成器使用的行文本。 |
| `get layoutText(): string`  | 竖排转置后的行文本预览；实际几何按原文和 writingMode 布局。 |
| `get fontSize(): number`  | 当前几何字号。 |
| `set fontSize(value: number)`  | 修改字号，在下次生成时重新计算排版与轮廓。 |
| `get fontFamily(): string`  | 已注册的字体名称。 |
| `set fontFamily(value: string)`  | 切换到另一份已加载字体。 |
| `get lineSpacing(): number`  | 当前额外行距。 |
| `set lineSpacing(value: number)`  | 修改额外行距。 |
| `get letterSpacing(): number`  | 当前额外字距。 |
| `set letterSpacing(value: number)`  | 修改额外字距，允许负值。 |
| `get textAlign(): TextAlign`  | 水平对齐方式。 |
| `set textAlign(value: TextAlign)`  | 修改行文本的水平对齐方式。 |
| `get baseline(): TextBaseline`  | 基线锚点方式。 |
| `set baseline(value: TextBaseline)`  | 修改顶部、中线或底部基线锚点。 |
| `get writingMode(): TextWritingMode`  | 当前文字排列顺序。 |
| `set writingMode(value: TextWritingMode)`  | 切换横排或从上到下、从右到左的竖排，并重算原文转换。 |
| `get width(): number`  | 居中可见包围盒宽度。 |
| `get height(): number`  | 居中可见包围盒高度。 |
| `get advanceWidth(): number`  | 排版后的最大行宽。 |
| `get anchorX(): number`  | 按 textAlign 选取的局部水平锚点。 |
| `get anchorY(): number`  | 按 baseline 选取的局部垂直锚点。 |
| `get perimeter(): number`  | 可见字形边界总长度。 |
| `get contours(): Float32Array[]`  | 全部可见字形边界的独立副本，用于降级编辑，不改变文字的包围盒选取方式。 |
| `updateGeometry(): this`  | 按当前排版与样式重建填充、实体边框、关键点及线框。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `GetDefaultFontFamily` | 选择静态字体表中最先注册的字体作为默认字体。 |
| `ConvertText` | 将每个输入行作为一列，并按上到下、右到左转成横排生成器可读的行。 |

```ts
const fontFamily = GetDefaultFontFamily();
```

### 类型索引

`TextWritingMode`、`Text2DOptions`、`Text2DLike`

### 导出关系

```ts
export type { TextGeometryFactory } from "./font";
export { Font, Text };
export type { Text2DLike, Text2DOptions, TextWritingMode };
export default Text;
```

## 3. 其他源码文件

### 文件：font.ts

### Font

按名称共享已加载字体，供后续文字几何直接使用。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_urls`（内部） | `按初始化值推断`；`new Map<string, string>()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_factories`（内部） | `按初始化值推断`；`new Map<string, TextGeometryFactory>()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_pending`（内部） | `按初始化值推断`；`new Map<string, PendingFont>()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_browserFaces`（内部） | `按初始化值推断`；`new Map<string, Promise<FontFace>>()` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static get map(): ReadonlyMap<string, TextGeometryFactory>`  | 已成功注册的字体名称与几何创建函数。返回同一个只读 Map 视图。 |
| `static register(fontFamily: string, url: string): Promise<TextGeometryFactory>`  | 下载并注册字体；同名同址的并发调用共用一次请求。 |
| `static get(fontFamily: string): TextGeometryFactory`  | 根据注册名称取得可调用的文字几何创建函数。 |
| `static has(fontFamily: string): boolean`  | 查询字体是否已完成注册。 |
| `static browserFace(fontFamily: string): Promise<FontFace>`  | 按同一字体地址注册浏览器输入字体，用于文字编辑的光标、选区与输入法。 |
| `static async load(fontFamily: string, url: string): Promise<TextGeometryFactory>` （内部） | 下载字体字节并提交到 BPMatrixJS 的字体表。 |

### 类型索引

`TextGeometryFactory`、`PendingFont`

### 导出关系

```ts
export default Font;
export type { TextGeometryFactory };
```

### 文件：layout.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `MeasureText` | 测量文字的可交互矩形及字符区域，空文字至少保留一个 em 方框。 |

```ts
const layout = MeasureText(text);
```

### 类型索引

`TextCell`、`TextLayout`

### 导出关系

```ts
export { MeasureText };
export type { TextCell, TextLayout };
```

### 文件：VerticalLayout.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `MeasureVerticalText` | 用与 WASM 相同的竖排字形定位度量计算包围盒和原文字符区域。 |

```ts
MeasureVerticalText(text);
```

### 导出关系

```ts
export { MeasureVerticalText };
```

## 4. 注意事项

- 通过 Font.register 注册名称后创建 Text；字符索引用 UTF-16，字素簇和换行由排版流程处理。包围盒中心为局部零点。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- 几何生成把原文与 writingMode 直接传给数学库；layoutText 只是转置行文本预览，不可再用横排行对齐来代替竖排列对齐。VerticalLayout 的字形定位必须与原生 TTB 排版保持一致。
- baseline 只改变返回的 anchorY，不移动以包围盒居中的顶点；案例通过独立标记显示锚点变化。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">文字 字体 注册 字号 字距 行距 基线</keywords>
<keywords language="en">text font register size spacing baseline caret</keywords>
```
