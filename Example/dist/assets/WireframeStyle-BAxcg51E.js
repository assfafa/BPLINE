import{n as e}from"./index-DFaRmisn.js";import t from"./reference-DK6VgIiC.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`WireframeStyle`,intro:{cn:`原生 line-list 线框分区，拥有独立的开关、颜色和透明度；不提供线宽。`,en:`Native line-list wireframe part with its own enabled switch, color, and opacity. It does not set line width.`},code:`import { Style } from "bplinejs";

const style = new Style();
style.wireframe.enabled = true;
style.wireframe.color.setHex("#ffffff");`,properties:[n(`enabled: boolean`,`启用原生线框。`,`Enable native wireframe drawing.`),n(`color: Color; opacity: number`,`线框颜色和透明度。`,`Wireframe color and opacity.`)],methods:[n(`new WireframeStyle()`,`创建默认关闭的线框样式。`,`Create a wireframe style that starts disabled.`)]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};