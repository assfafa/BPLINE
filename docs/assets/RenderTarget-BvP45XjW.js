import{n as e}from"./index-DpiUqL2G.js";import t from"./reference-BkWidWEx.js";import{t as n}from"./types-DQN6DUYN.js";var r={title:`RenderTarget`,intro:{cn:`离屏画面对象，保存场景与相机；尺寸来自 camera.viewport。由同一个 Render 执行 renderPass，材质直接接收 target，无需访问 target.texture。`,en:`An offscreen image with its own scene and camera. Dimensions come from the camera viewport. Draw it with the same Render and pass the target itself to materials; there is no target.texture step.`},detail:{cn:`renderPass 只更新离屏附件，不更新 Canvas。材质采样前先绘制来源；不要在写入某个 target 时同时采样它。目标不能跨 Render/GPUDevice 直接共享。修改 viewport 或 format 后，下一次绘制会更新附件和绑定；更换 scene/camera 本身不会自动重绘。`,en:`renderPass updates offscreen attachments without presenting to the canvas. Render sources before sampling them, and never read a target while writing it. Targets cannot be shared directly across Render/GPUDevice instances. Viewport or format changes update attachments and bindings on the next draw; assigning a scene/camera alone does not redraw.`},code:`import { BaseMaterial, Camera, Mesh, Rect2D, Render, RenderTarget, Scene, Style } from "bplinejs";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const scene = new Scene();
const camera = new Camera(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const sourceScene = new Scene();
const sourceCamera = new Camera(512, 512);
const sourceStyle = new Style();
sourceStyle.solid.enabled = true;
sourceStyle.solid.color.setHex("#409dff");
sourceScene.add(new Mesh(new Rect2D({ width: 360, height: 240 }), new BaseMaterial(sourceStyle), sourceStyle));
const target = new RenderTarget(sourceScene, sourceCamera);
render.renderPass(target);

const style = new Style();
style.solid.enabled = true;
style.solid.texture = target;
scene.add(new Mesh(new Rect2D({ width: 256, height: 256 }), new BaseMaterial(style), style));
render.render(scene, camera);`,properties:[n(`scene: Scene; camera: Camera`,`可重新指定离屏来源；随后调用 render.renderPass(target)。`,`Replace the offscreen source, then call render.renderPass(target).`),n(`readonly width: number; readonly height: number`,`相机 viewport 的物理像素尺寸，向上取整；宽高必须是正有限数。不会再乘 zoom 或 DPR。`,`Physical-pixel camera viewport dimensions, rounded up. Both must be positive and finite; no extra zoom or DPR multiplier is applied.`),n(`format: RenderTargetFormat = "rgba8unorm"`,`可选 rgba8unorm、bgra8unorm、rgba16float。需保存超过 1 的颜色时显式选 rgba16float。`,`Accepts rgba8unorm, bgra8unorm or rgba16float. Select rgba16float explicitly when the source must retain RGB above 1.`),n(`readonly data: boolean = false`,`构建选项。普通颜色使用 false；数值中间附件可用 true，避免颜色的预乘/还原 Alpha 转换。`,`Constructor option. Keep false for colors; use true for numerical intermediate data to bypass color alpha premultiplication/unpremultiplication.`),n(`readonly version: number; readonly destroyed: boolean`,`version 记录附件配置变化，不是逐帧计数；destroyed 表示已永久销毁。`,`version tracks attachment configuration changes, not frames; destroyed indicates permanent disposal.`)],methods:[n(`new RenderTarget(scene: Scene, camera: Camera, options?: RenderTargetOptions)`,`options 支持 format 和 data；构建时不创建另一套 Render。`,`options accepts format and data; construction does not create another renderer.`),n(`camera.setViewport(width, height)`,`通过相机调整目标大小；随后重新执行来源绘制和后处理。`,`Resize through the camera, then redraw the source and process it again.`),n(`destroy(): void`,`释放目标附件并通知订阅者；不会销毁场景、相机或 Render。先停止采样再销毁；重复调用安全。`,`Release attachments and notify subscribers, leaving the scene, camera and Render intact. Stop sampling first; repeated calls are safe.`)],links:[{label:`Render`,to:`/docs/bpline/render`},{label:`PostProcess`,to:`/docs/bpline/post-process`},{label:`SolidStyle`,to:`/docs/bpline/style/solid-style`},{label:`WgslPass`,to:`/docs/bpline/post-process/wgsl`}]},i=e(),a=()=>(0,i.jsx)(t,{config:r});export{a as default};