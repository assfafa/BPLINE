import{n as e}from"./index-CuA_KabQ.js";import t from"./reference-B-XCIEbK.js";var n={title:`Geometry`,intro:{cn:`BPMatrixJS 的几何生成器返回 CPU 顶点、法线、UV 和索引数据，可单独用于形状计算。`,en:`BPMatrixJS geometry builders return CPU vertex, normal, UV, and index data for shape calculations.`},code:`import { NGon, Poly, Rect } from "bpmatrixjs/Geometry";

const rectangle = new Rect(180, 110, 18);
const polygon = new Poly([[0, 0], [80, 0], [40, 60]]);
const ngon = new NGon({ sides: 6, outer: 50 });`,links:[{label:`NGon`,to:`/docs/geometry/ngon`},{label:`Rect`,to:`/docs/geometry/rect`},{label:`Poly`,to:`/docs/geometry/poly`}]},r=e(),i=()=>(0,r.jsx)(t,{config:n});export{i as default};