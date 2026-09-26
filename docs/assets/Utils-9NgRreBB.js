import{n as e}from"./index-CMmBvX-I.js";import t from"./reference-BkLbgLef.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`Utils`,intro:{cn:`BPMatrixJS 的独立工具：数值钳制、窗口与画布坐标、时间统计和 UUID。Utils 的公开入口为 bpmatrixjs/Utils。`,en:`BPMatrixJS utilities cover clamping, window and canvas coordinates, timing, and UUIDs. Import them from bpmatrixjs/Utils.`},code:`import { Clamp, GetInner, Time, UUID } from "bpmatrixjs/Utils";

const limited = Clamp(12, 0, 10); // 10
const size = GetInner();
const clock = new Time();
const id = UUID();`,methods:[n(`Clamp(value: number, min: number, max: number): number`,`把数值限制在最小值与最大值之间。`,`Constrain a number between minimum and maximum values.`)],links:[{label:`Inner`,to:`/docs/utils/inner`},{label:`Time`,to:`/docs/utils/time`},{label:`UUID`,to:`/docs/utils/uuid`}]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};