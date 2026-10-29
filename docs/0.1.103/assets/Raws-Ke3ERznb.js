import{n as e}from"./index-DY15zU6K.js";import t from"./reference-Gwz-cIfE.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`Raws / Raw`,intro:{cn:`IMesh 在 raw: true 时保存可编辑的 Raw 实例。通过 IMesh.raws.map.get(id) 按稳定 ID 读取记录；不要直接修改 Map。`,en:`With raw: true, IMesh retains editable Raw records. Read them by stable ID with IMesh.raws.map.get(id); do not mutate the Map directly.`},code:`import { BaseMaterial, IMesh, Rect2D } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const mesh = new IMesh(new Rect2D({ width: 8, height: 8 }), new BaseMaterial(), { raw: true });
const id = mesh.push({ position: new Vec2(20, 30) });
const raw = mesh.raws.map.get(id);
raw?.position.set(40, 50);`,properties:[n(`raws.map: ReadonlyMap<number, Raw>`,`按稳定 ID 查询记录。`,`Find records by stable ID.`),n(`raws.size: number`,`可编辑记录数；raw: false 时为 0。`,`Editable record count; zero with raw: false.`),n(`raw.position: Vec2; raw.rotation: number; raw.scale: Vec2`,`实例的局部位置、弧度旋转和缩放。`,`Instance position, rotation in radians, and scale.`),n(`raw.style: Style; raw.enabled: boolean`,`单条实例的外观与启用状态。`,`Per-instance appearance and enabled state.`)]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};