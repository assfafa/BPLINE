import{n as e}from"./index-BFfsRdpP.js";import{t}from"./Vec2-CPTFB0d0.js";import{O as n,R as r,c as i,g as a,t as o,x as s,z as c}from"./lil-gui.esm-toYGkY8E.js";import{t as l}from"./SceneRuntime-BvrdPi4o.js";var u=`struct VertexOutput {
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
}`,f=e=>{let r=new l(e),c=new n;c.solid.enabled=!0;let f=new a(c),p=new t(1,1),m={strength:1,speed:1,animate:!0};f.raw.value={time:0,viewport:p,strength:m.strength},f.raw.fragmentShader=d,e.advanced&&(f.raw.vertexShader=u);let h=new i(new s({width:220,height:150}),f,!1);h.style=c,h.culling=!1,r.scene.add(h);let g=null,_=0,v=performance.now();return e.advanced&&e.guiContainer&&(g=new o({autoPlace:!1,container:e.guiContainer,title:`WGSLMaterial`,width:200}),g.add(m,`strength`,0,2,.05),g.add(m,`speed`,0,3,.1),g.add(m,`animate`)),r.update=()=>{let e=performance.now();m.animate&&(_+=(e-v)/1e3*m.speed),v=e,p.set(r.render.canvas.width/r.render.dpr,r.render.canvas.height/r.render.dpr),f.raw.value.time=_,f.raw.value.strength=m.strength},r.start(),()=>{g?.destroy(),r.destroy()}},p=e(),m=({advanced:e})=>(0,p.jsx)(r,{advanced:e,controlsId:`wgsl-controls`,mountScene:f}),h=`const style = new Style();
style.solid.enabled = true;
const material = new WGSLMaterial(style);
const viewport = new Vec2(1, 1);
const settings = { strength: 1, speed: 1, animate: true };
material.raw.value = { time: 0, viewport, strength: 1 };
material.raw.fragmentShader = \`${d}\`;
`,g=`const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, false);
mesh.style = style;
mesh.culling = false;
scene.add(mesh);
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
    requestAnimationFrame(draw);
};
draw();
`,_=`import { Camera, Mesh, Rect2D, Render, Scene, Style, WGSLMaterial } from "bplinejs";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const scene = new Scene();
const style = new Style();
style.solid.enabled = true;
const material = new WGSLMaterial();
material.raw.value = { time: 0 };
material.raw.fragmentShader = \`${d}\`;
const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, false);
mesh.style = style;
scene.add(mesh);

const draw = (): void => {
    material.raw.value.time = performance.now() / 1000;
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`,v=`import { Camera, Mesh, Rect2D, Render, Scene, Style, WGSLMaterial } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";
import GUI from "lil-gui";
const container = document.createElement("div");
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
`+h+`material.raw.vertexShader = \`${u}\`;
const gui = new GUI();
gui.add(settings, "strength", 0, 2, 0.05);
gui.add(settings, "speed", 0, 3, 0.1);
gui.add(settings, "animate");
`+g,y=()=>(0,p.jsx)(c,{title:`WGSLMaterial`,shortCode:_,fullCode:v,Preview:m});export{y as default};