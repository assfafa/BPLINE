import{n as e}from"./index-CiU_kM4v.js";import{F as t,P as n,T as r,d as i,g as a,s as o,t as s,v as c}from"./lil-gui.esm-BYuo0NrH.js";import{t as l}from"./SceneRuntime-BR9jLxXU.js";var u=new URL(`big-buck-bunny-10s-Dsffn8CQ.mp4`,import.meta.url).href,d=e=>{let t=new l(e),n=new a,d=new r;d.solid.enabled=!0,d.solid.texture=n;let f=new o(new c({width:300,height:169,radius:10}),new i,!1);f.style=d,t.scene.add(f);let p=null,m=null,h=()=>t.mounted,g={position:0,speed:1,loop:!0},_=document.createElement(`button`);_.type=`button`,_.textContent=`Play / Pause`,_.className=`absolute bottom-3 left-3 z-10 rounded border border-border bg-background px-3 py-1 text-foreground`,e.advanced&&e.container.append(_);let v=async()=>{try{await p?.play()}catch{_.textContent=`Play`}},y=()=>{p!==null&&(p.paused?v():p.pause())};_.addEventListener(`click`,y);let b=e=>{p!==null&&(p.currentTime=Math.min(p.duration,Math.max(0,e)))};return t.update=()=>{p!==null&&(p.playbackRate=g.speed,p.loop=g.loop,g.position=p.currentTime,_.textContent=`Pause`,p.paused&&(_.textContent=`Play`))},(async()=>{try{await n.load(u,`video`);let r=n.source;t.mounted&&r instanceof HTMLVideoElement?(p=r,p.muted=!0,p.playsInline=!0,p.loop=!0,e.advanced&&e.guiContainer&&(m=new s({autoPlace:!1,container:e.guiContainer,title:`Video texture`,width:200}),m.add(g,`position`,0,p.duration,.01).listen().onChange(b),m.add(g,`speed`,.25,2,.25),m.add(g,`loop`)),await t.start(),h()&&await v()):r instanceof HTMLVideoElement&&(r.pause(),r.removeAttribute(`src`),r.load(),n.clearSource())}catch(n){t.mounted&&e.onError(n)}})(),()=>{_.removeEventListener(`click`,y),_.remove(),m?.destroy(),p!==null&&(p.pause(),p.removeAttribute(`src`),p.load()),n.clearSource(),t.destroy()}},f=e(),p=({advanced:e})=>(0,f.jsxs)(`div`,{className:`relative h-full`,children:[(0,f.jsx)(n,{advanced:e,controlsId:`video-controls`,mountScene:d}),(0,f.jsx)(`a`,{href:`https://peach.blender.org/about/`,target:`_blank`,rel:`noreferrer`,className:`absolute bottom-1 right-2 z-20 rounded bg-background/90 px-1 text-[10px] text-muted-foreground`,children:`Big Buck Bunny © 2008 Blender Foundation · CC BY 3.0 · 10s excerpt`})]}),m=`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import videoUrl from "./big-buck-bunny-10s.mp4?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const scene = new Scene();
const texture = new Texture();
await texture.load(videoUrl, "video");
const video = texture.source as HTMLVideoElement;
video.muted = true;
video.loop = true;
video.playsInline = true;
await video.play();

const style = new Style();
style.solid.enabled = true;
style.solid.texture = texture;
const mesh = new Mesh(new Rect2D({ width: 300, height: 169, radius: 10 }), new BaseMaterial(), false);
mesh.style = style;
scene.add(mesh);
const draw = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`,h=`import GUI from "lil-gui";
import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import videoUrl from "./big-buck-bunny-10s.mp4?url";
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

const texture = new Texture();
await texture.load(videoUrl, "video");
const video = texture.source as HTMLVideoElement;
video.muted = true;
video.loop = true;
video.playsInline = true;
const style = new Style();
style.solid.enabled = true;
style.solid.texture = texture;
const mesh = new Mesh(new Rect2D({ width: 300, height: 169, radius: 10 }), new BaseMaterial(), false);
mesh.style = style;
scene.add(mesh);
const button = document.createElement("button");
button.style.cssText = "position:absolute;bottom:12px;left:12px";
button.textContent = "Play / Pause";
container.append(button);
button.onclick = () => {
    if (video.paused) {
        void video.play().catch(console.error);
    } else {
        video.pause();
    }
};
await video.play().catch(() => { button.textContent = "Play"; });
const gui = new GUI();
gui.add(video, "currentTime", 0, video.duration, 0.01).name("Position");
gui.add(video, "playbackRate", 0.25, 2, 0.25).name("Speed");
gui.add(video, "loop");
/** @example draw(); @returns No value; Render uploads ready video frames. */
const draw = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();
`,g=()=>(0,f.jsx)(t,{title:`Video texture / 视频贴图`,shortCode:m,fullCode:h,Preview:p});export{g as default};