import{n as e}from"./index-J8u9icNN.js";import t from"./reference-DhmTcxX_.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`JoinStyle`,intro:{cn:`控制多边形边框节点的连接形式；属于几何生成参数，不单独控制颜色或线宽。`,en:`Control polygon border joins. This affects geometry generation and does not separately set color or width.`},code:`import { Style } from "bplinejs";

const style = new Style();
style.join.type = "round";
style.join.seg = 8;`,properties:[n(`type: "miter" | "round" | "bevel"`,`尖角、圆接或切角连接。`,`Miter, round, or bevel joins.`),n(`seg: number`,`圆接细分段数；只有 round 使用。`,`Round-join segment count; used only for round.`)],methods:[n(`new JoinStyle()`,`创建默认 miter 连接样式。`,`Create the default miter join style.`)]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};