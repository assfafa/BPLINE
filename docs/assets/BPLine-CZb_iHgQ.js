import{n as e}from"./index-CMmBvX-I.js";import t from"./reference-BkLbgLef.js";var n={title:`BPLineJS`,intro:{cn:`BPLineJS 使用 WebGPU 绘制二维网格体。典型流程是创建几何、材质、网格体与场景，再由 Render 和 Camera 完成绘制。`,en:`BPLineJS draws 2D meshes with WebGPU. Create geometry, material, mesh, and scene, then render through Render and Camera.`},code:`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene } from "bplinejs";

const container = document.getElementById("stage");
if (container) {
    const render = new Render(container);
    await render.ready;
    const scene = new Scene();
    scene.add(new Mesh(new Rect2D({ width: 180, height: 110 }), new BaseMaterial()));
    render.render(scene, new Camera(container.clientWidth, container.clientHeight));
}`,links:[{label:`Camera`,to:`/docs/bpline/camera`},{label:`Color`,to:`/docs/bpline/color`},{label:`CameraControl`,to:`/docs/bpline/control/camera-control`},{label:`Geometry`,to:`/docs/bpline/geometry/geo`},{label:`Group`,to:`/docs/bpline/group`},{label:`IMesh`,to:`/docs/bpline/imesh`},{label:`Material`,to:`/docs/bpline/material/material`},{label:`Mesh`,to:`/docs/bpline/mesh`},{label:`ObjectNode`,to:`/docs/bpline/object`},{label:`Raws`,to:`/docs/bpline/raws`},{label:`Render`,to:`/docs/bpline/render`},{label:`Scene`,to:`/docs/bpline/scene`},{label:`Style`,to:`/docs/bpline/style/style`},{label:`Texture`,to:`/docs/bpline/texture`}]},r=e(),i=()=>(0,r.jsx)(t,{config:n});export{i as default};