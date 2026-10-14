import{i as e,n as t,r as n}from"./index-C3ECKfp6.js";import{N as r,P as i,t as a}from"./lil-gui.esm-Bv8wnYKH.js";import{t as o}from"./CameraControl-DbkLHlCb.js";import{n as s,t as c}from"./SceneRuntime-DuI4giDg.js";var l=`import { Camera, HelperGrid, Render, Scene } from "bplinejs";

// Paste into a TypeScript entry after installing bplinejs.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0;";
document.body.append(container);
const render = new Render(container, "production");
render.backgroundColor = { r: 0.08, g: 0.1, b: 0.14, a: 1 };
await render.ready;
const scene = new Scene();
const camera = new Camera();
let fitted = false;

/**
 * Synchronize the canvas and camera after a container resize.
 * @example resize();
 * @returns No value.
 */
const resize = (): void => {
    render.resize();
    const bounds = container.getBoundingClientRect();
    const width = Math.max(1, bounds.width * render.dpr);
    const height = Math.max(1, bounds.height * render.dpr);
    camera.setViewport(width, height);
    // Fit once, retaining later user pan and zoom.
    if (fitted === false) {
        camera.zoom = Math.max(0.1, Math.min(render.dpr, width / 350, height / 280));
        fitted = true;
    }
};
resize();
const observer = new ResizeObserver(resize);
observer.observe(container);

const helper = new HelperGrid(scene, render, camera);
// Defaults: dark grid; bottom horizontal ruler; left vertical ruler.

let frame = 0;
/**
 * Update interaction and submit the next frame.
 * @example requestAnimationFrame(draw);
 * @returns No value.
 */
const draw = (): void => {
    helper.update();
    render.render(scene, camera);
    frame = requestAnimationFrame(draw);
};
frame = requestAnimationFrame(draw);

/**
 * Release the standalone example when leaving the page.
 * @example destroy();
 * @returns No value.
 */
const destroy = (): void => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    helper.destroy();
    render.destroy();
    container.remove();
};
window.addEventListener("beforeunload", destroy, { once: true });
`,u=`import { Camera, CameraControl, HelperGrid, Render, Scene } from "bplinejs";
import GUI from "lil-gui";

// Paste into a TypeScript entry after installing bplinejs, lil-gui.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0 230px 0 0;";
document.body.append(container);
const render = new Render(container, "production");
render.backgroundColor = { r: 0.08, g: 0.1, b: 0.14, a: 1 };
await render.ready;
const scene = new Scene();
const camera = new Camera();
let fitted = false;

/**
 * Synchronize the canvas and camera after a container resize.
 * @example resize();
 * @returns No value.
 */
const resize = (): void => {
    render.resize();
    const bounds = container.getBoundingClientRect();
    const width = Math.max(1, bounds.width * render.dpr);
    const height = Math.max(1, bounds.height * render.dpr);
    camera.setViewport(width, height);
    // Fit once, retaining later user pan and zoom.
    if (fitted === false) {
        camera.zoom = Math.max(0.1, Math.min(render.dpr, width / 350, height / 280));
        fitted = true;
    }
};
resize();
const observer = new ResizeObserver(resize);
observer.observe(container);

const helper = new HelperGrid(scene, render, camera);
const cameraControl = new CameraControl(camera, render);

const gui = new GUI({ title: "HelperGrid", width: 220 });
gui.add(helper, "mode", ["dark", "light", "custom"]).listen();
gui.add(helper, "minorPerMajor", 2, 20, 1);
gui.add(helper, "ruler");
gui.add(helper, "horizontalRuler", ["bottom", "top", "none"]);
gui.add(helper, "verticalRuler", ["left", "right", "none"]);
gui.add(camera, "zoom", 0.1, 8, 0.1).listen();
const colors = {
    gridMinorColor: "#2e333d",
    gridMajorColor: "#4a5463",
    rulerMinorColor: "#929aa6",
    rulerMajorColor: "#c9d1de",
    rulerTextColor: "#c9d1de",
};
/**
 * Apply the five custom colors as observable Color mutations.
 * @example gui.addColor(colors, "gridMajorColor").onChange(applyColors);
 * @returns No value.
 */
const applyColors = (): void => {
    helper.mode = "custom";
    helper.custom.gridMinorColor.setHex(colors.gridMinorColor);
    helper.custom.gridMajorColor.setHex(colors.gridMajorColor);
    helper.custom.rulerMinorColor.setHex(colors.rulerMinorColor);
    helper.custom.rulerMajorColor.setHex(colors.rulerMajorColor);
    helper.custom.rulerTextColor.setHex(colors.rulerTextColor);
};
const palette = gui.addFolder("Custom colors");
palette.addColor(colors, "gridMinorColor").onChange(applyColors);
palette.addColor(colors, "gridMajorColor").onChange(applyColors);
palette.addColor(colors, "rulerMinorColor").onChange(applyColors);
palette.addColor(colors, "rulerMajorColor").onChange(applyColors);
palette.addColor(colors, "rulerTextColor").onChange(applyColors);
let frame = 0;
/**
 * Update interaction and submit the next frame.
 * @example requestAnimationFrame(draw);
 * @returns No value.
 */
const draw = (): void => {
    cameraControl.update();
    helper.update();
    render.render(scene, camera);
    frame = requestAnimationFrame(draw);
};
frame = requestAnimationFrame(draw);

/**
 * Release the standalone example when leaving the page.
 * @example destroy();
 * @returns No value.
 */
const destroy = (): void => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    helper.destroy();
    cameraControl.dispose();
    gui.destroy();
    render.destroy();
    container.remove();
};
window.addEventListener("beforeunload", destroy, { once: true });
`,d=(e,t,n)=>new s(e,t,n),f=e=>{let t=new c(e),n=d(t.scene,t.render,t.camera),r=null,i=null;if(e.advanced){let s=new o(t.camera,t.render);if(r=s,t.update=()=>{s.update(),n.update()},e.guiContainer){i=new a({autoPlace:!1,container:e.guiContainer,title:`HelperGrid`,width:200}),i.add(n,`mode`,[`dark`,`light`,`custom`]).listen(),i.add(n,`minorPerMajor`,2,20,1),i.add(n,`ruler`),i.add(n,`horizontalRuler`,[`bottom`,`top`,`none`]),i.add(n,`verticalRuler`,[`left`,`right`,`none`]),i.add(t.camera,`zoom`,.1,8,.1).listen();let r={gridMinorColor:`#2e333d`,gridMajorColor:`#4a5463`,rulerMinorColor:`#929aa6`,rulerMajorColor:`#c9d1de`,rulerTextColor:`#c9d1de`},o=()=>{n.mode=`custom`,n.custom.gridMinorColor.setHex(r.gridMinorColor),n.custom.gridMajorColor.setHex(r.gridMajorColor),n.custom.rulerMinorColor.setHex(r.rulerMinorColor),n.custom.rulerMajorColor.setHex(r.rulerMajorColor),n.custom.rulerTextColor.setHex(r.rulerTextColor)},s=i.addFolder(`Custom colors`);s.addColor(r,`gridMinorColor`).onChange(o),s.addColor(r,`gridMajorColor`).onChange(o),s.addColor(r,`rulerMinorColor`).onChange(o),s.addColor(r,`rulerMajorColor`).onChange(o),s.addColor(r,`rulerTextColor`).onChange(o)}}else t.update=()=>{n.update()};return t.start(),()=>{n.destroy(),r?.dispose(),i?.destroy(),t.destroy()}},p=t(),m=({advanced:t})=>{let{language:i}=e(),a=n.translate(i,`example.helperSimpleHint`);return t&&(a=n.translate(i,`example.helperHint`)),(0,p.jsxs)(`div`,{className:`relative h-full`,children:[(0,p.jsx)(r,{advanced:t,controlsId:`helpergrid-controls`,mountScene:f}),(0,p.jsx)(`p`,{className:`pointer-events-none absolute bottom-8 left-8 max-w-[70%] rounded bg-black/60 px-2 py-1 text-[10px] text-white lg:max-w-[calc(100%-270px)]`,children:a})]})},h=()=>{let{language:t}=e();return(0,p.jsx)(i,{title:n.translate(t,`example.helperGridTitle`),shortCode:l,fullCode:u,Preview:m})};export{h as default};