import{n as e}from"./index-CuA_KabQ.js";import t from"./reference-B-XCIEbK.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`Scene`,intro:{cn:`场景树的根容器。通过继承自 Group 的 add、removeChild 和 removeAll 管理对象，再交给 Render 绘制。`,en:`Root container of the scene tree. Manage objects with Group methods add, removeChild, and removeAll, then pass the scene to Render.`},code:`import { BaseMaterial, Mesh, Rect2D, Scene } from "bplinejs";

const scene = new Scene();
const mesh = new Mesh(new Rect2D({ width: 80, height: 50 }), new BaseMaterial());
scene.add(mesh);
scene.removeChild(mesh);`,methods:[n(`new Scene()`,`创建场景根节点。`,`Create a scene root.`),n(`add(child: AddObject): void`,`把网格体或子组加入场景。`,`Add a mesh or child group to the scene.`),n(`removeChild(child: AddObject): boolean`,`移除直接子节点。`,`Remove a direct child.`),n(`removeAll(): void`,`清空场景子节点。`,`Remove all scene children.`)]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};