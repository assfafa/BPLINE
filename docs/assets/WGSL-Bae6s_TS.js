import{n as e}from"./index-DVMNyWrB.js";import{t}from"./Vec2-CPTFB0d0.js";import{N as n,P as r,T as i,h as a,s as o,t as s,v as c}from"./lil-gui.esm-D9DGme-G.js";import{t as l}from"./SceneRuntime-CqqxZYGx.js";var u=`struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};
@vertex
fn main(@location(0) position: vec2f, @location(1) uv: vec2f) -> VertexOutput {
    var output: VertexOutput;
    let offset = sin(value_time + position.y * 0.025) * value_strength * 35.0;
    output.position = vec4f((position + vec2f(offset, 0.0)) / value_viewport * 2.0, 0.0, 1.0);
    output.uv = uv;
    return output;
}`,d=`@fragment
fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let pulse = 0.65 + 0.25 * sin(value_time);
    return vec4f(uv.x * pulse, 0.35 + uv.y * 0.4, 0.85, 1.0);
}`,f=e=>{let n=new l(e),r=new i;r.solid.enabled=!0;let f=new a(r),p=new t(1,1),m={strength:1,speed:1,animate:!0};f.raw.value={time:0,viewport:p,strength:m.strength},f.raw.fragmentShader=d,e.advanced&&(f.raw.vertexShader=u);let h=new o(new c({width:220,height:150}),f,r);h.culling=!1,n.scene.add(h);let g=null,_=0,v=performance.now();return e.advanced&&e.guiContainer&&(g=new s({autoPlace:!1,container:e.guiContainer,title:`WGSLMaterial`,width:200}),g.add(m,`strength`,0,2,.05),g.add(m,`speed`,0,3,.1),g.add(m,`animate`)),n.update=()=>{let e=performance.now();m.animate&&(_+=(e-v)/1e3*m.speed),v=e,p.set(n.render.canvas.width/n.render.dpr,n.render.canvas.height/n.render.dpr),f.raw.value.time=_,f.raw.value.strength=m.strength},n.start(),()=>{g?.destroy(),n.destroy()}},p=e(),m=({advanced:e})=>(0,p.jsx)(n,{advanced:e,controlsId:`wgsl-controls`,mountScene:f}),h=`const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#fff)";
document.body.append(container);
const render = new Render(container);
await render.ready;
const scene = new Scene();
const camera = new Camera();
/** @example resize(); @returns No value. */
const resize = (): void => {
    render.resize();
    camera.setViewport(render.canvas.width, render.canvas.height);
    camera.zoom = render.dpr;
};
resize();
const observer = new ResizeObserver(resize);
observer.observe(container);
`,g=`const style = new Style();
style.solid.enabled = true;
const material = new WGSLMaterial(style);
const viewport = new Vec2(1, 1);
const settings = { strength: 1, speed: 1, animate: true };
material.raw.value = { time: 0, viewport, strength: 1 };
material.raw.fragmentShader = \`${d}\`;
`,_=`const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, style);
mesh.culling = false;
scene.add(mesh);
let frame = 0;
let time = 0;
let previous = performance.now();
/** @example draw(); @returns No value. */
const draw = (): void => {
    const now = performance.now();
    if (settings.animate) {
        time += (now - previous) / 1000 * settings.speed;
    }
    previous = now;
    viewport.set(render.canvas.width / render.dpr, render.canvas.height / render.dpr);
    material.raw.value.time = time;
    material.raw.value.strength = settings.strength;
    render.render(scene, camera);
    frame = requestAnimationFrame(draw);
};
draw();
`,v=`import { Camera, Mesh, Rect2D, Render, Scene, Style, WGSLMaterial } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";
`,y=`window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    render.destroy();
    container.remove();
}, { once: true });`,b=v+h+g+_+y,x=v+`import GUI from "lil-gui";
`+h+g+`material.raw.vertexShader = \`${u}\`;
const gui = new GUI();
gui.add(settings, "strength", 0, 2, 0.05);
gui.add(settings, "speed", 0, 3, 0.1);
gui.add(settings, "animate");
window.addEventListener("beforeunload", () => gui.destroy(), { once: true });
`+_+y,S=()=>(0,p.jsx)(r,{title:`WGSLMaterial`,shortCode:b,fullCode:x,Preview:m});export{S as default};