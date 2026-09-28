import{n as e}from"./index-CuA_KabQ.js";import t from"./reference-B-XCIEbK.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`BaseMaterial`,intro:{cn:`内置矩形、多边形和正多边形/圆环 WGSL 材质。显示参数由 Style 设置。`,en:`Built-in WGSL material for rectangles, polygons, regular polygons, and rings. Style controls appearance.`},code:`import { BaseMaterial, Mesh, Rect2D, Style } from "bplinejs";

const geometry = new Rect2D({ width: 180, height: 110 });
const style = new Style();
style.solid.enabled = true;
const material = new BaseMaterial();
const mesh = new Mesh(geometry, material, style);`,methods:[n(`new BaseMaterial(style?: Style)`,`创建内置材质，可传入共享样式。`,`Create the built-in material with an optional shared style.`)],links:[{label:`Material`,to:`/docs/bpline/material/material`},{label:`Style`,to:`/docs/bpline/style/style`}]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};