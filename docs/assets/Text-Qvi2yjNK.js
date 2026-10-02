import{n as e}from"./index-YNW6j57L.js";import t from"./reference-C3TeAsHq.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`Text (BPLineJS)`,intro:{cn:`继承 Geo 的可编辑文字几何。通过 Font 先注册字体，之后将 Text 交给 Mesh；填充、边框、关键点和线框由 mesh.style 控制。`,en:`Editable text geometry derived from Geo. Register a font first, pass Text to Mesh, then control fill, edge, points, and wireframe with mesh.style.`},detail:{cn:`横排从左到右、从上到下；vertical-rl 将原文每行作为一列，字从上到下、列从右到左。text 保留原文，layoutText 是转换后的排版文本。可见包围盒中心固定在局部 (0, 0)，anchorX 和 anchorY 返回选定的对齐锚点。`,en:`Horizontal text flows left to right and top to bottom. vertical-rl treats each source line as a column, with glyphs top to bottom and columns right to left. text preserves the source; layoutText is converted. Visible bounds stay centered at local (0, 0), while anchorX and anchorY expose alignment anchors.`},code:`import { BaseMaterial, Font, Mesh, Style, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

await Font.register("MiSans", fontUrl);
const geometry = new Text("你好\\n世界", 48, "MiSans", {
    lineSpacing: 8,
    letterSpacing: 2,
    textAlign: "center",
    baseline: "middle",
    writingMode: "vertical-rl",
});
const mesh = new Mesh(geometry, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.edge.enabled = true;
style.edge.width = 3;
mesh.style = style;`,properties:[n(`text: string; layoutText: string`,`原文可读写；layoutText 为转换后的只读排版文本。`,`Read/write source text; layoutText is the converted read-only layout text.`),n(`fontSize: number; fontFamily: string`,`字号默认 16；字体默认 Font.map 的首项。`,`Font size defaults to 16; family defaults to the first Font.map entry.`),n(`lineSpacing: number; letterSpacing: number`,`额外行距与字距；修改后重新生成几何。`,`Extra line and letter spacing; edits rebuild geometry.`),n(`textAlign: "left" | "center" | "right"`,`多行水平对齐，并决定 anchorX。`,`Align lines horizontally and select anchorX.`),n(`baseline: "top" | "middle" | "bottom"`,`选择 anchorY，不移动居中的几何。`,`Select anchorY without moving centered geometry.`),n(`writingMode: "horizontal-tb" | "vertical-rl"`,`控制原文转成横排或竖排布局。`,`Convert source text into horizontal or vertical layout.`),n(`width; height; advanceWidth; anchorX; anchorY; perimeter`,`包围盒、排版宽度、锚点与轮廓总周长。`,`Bounds, advance width, anchors, and total contour perimeter.`)],methods:[n(`new Text(text, fontSize = 16, fontFamily = first registered, options = null)`,`创建已注册字体的文字几何；options 可指定间距、对齐和排列。`,`Create text from a registered font; options control spacing, alignment, and writing mode.`),n(`updateGeometry(): this`,`按当前文字与 Mesh Style 重建填充、边框、点和线框。`,`Rebuild fill, border, points, and wireframe from text and Mesh Style.`)],links:[{label:`Font`,to:`/docs/bpline/font`},{label:`BPMatrixJS Text`,to:`/docs/geometry/text`}]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};