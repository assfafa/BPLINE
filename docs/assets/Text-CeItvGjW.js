import{i as e,n as t,r as n}from"./index-DmF06zal.js";import{D as r,N as i,P as a,T as o,a as s,d as c,f as l,n as u,p as d,s as f,t as p,v as m}from"./lil-gui.esm-BVy_w4WL.js";import{t as h}from"./MiSans-Normal-DsmYdAD3.js";var g=e=>{let t={content:`Hello World
Hello World`,fontSize:52,precision:8,lineSpacing:12,letterSpacing:2,textAlign:`center`,baseline:`middle`,writingMode:`horizontal-tb`,fill:`#5584dc`,edgeEnabled:!0,edgeWidth:3,edgeColor:`#67d8ff`,pointsEnabled:!1,pointsRadius:2,pointsColor:`#ffc76d`},n={mounted:!0},i=0,a,g,_,v=()=>n.mounted;return(async()=>{try{if(await d.register(`MiSans`,h),n.mounted){let n=new o;n.solid.enabled=!0,n.solid.color.setHex(t.fill),e.advanced&&(n.edge.enabled=!0,n.edge.width=t.edgeWidth,n.edge.color.setHex(t.edgeColor),n.points.enabled=t.pointsEnabled,n.points.vertices=!0,n.points.midpoints=!1,n.points.radius=t.pointsRadius,n.points.minPointsLength=18,n.points.color.setHex(t.pointsColor));let d={precision:t.precision,lineSpacing:t.lineSpacing,letterSpacing:t.letterSpacing,textAlign:t.textAlign,baseline:t.baseline,writingMode:t.writingMode},h=new l(t.content.replaceAll(`\\n`,`
`),t.fontSize,`MiSans`,d),y=new f(h,new c,!1);y.style=n;let b=new s;b.add(y);let x=new o;x.solid.enabled=!0,x.solid.color.setHex(`#e55287`);let S=new f(new m({width:7,height:7,radius:1}),new c,!1);S.style=x,S.noSelect=!0,S.ignoreZoom=!0,S.order=1;let C={anchorX:0,anchorY:0};e.advanced&&b.add(S);let w=()=>{C.anchorX=h.anchorX,C.anchorY=h.anchorY,S.position.set(C.anchorX,C.anchorY)};w();let T={compareAlignment:()=>{t.content=`Hello World\\nHello`,O()}},E=new r,D=new u(e.container,`production`);a=D;let O=()=>{h.text=t.content.replaceAll(`\\n`,`
`),h.fontSize=t.fontSize,h.precision=t.precision,h.lineSpacing=t.lineSpacing,h.letterSpacing=t.letterSpacing,h.textAlign=t.textAlign,h.baseline=t.baseline,h.writingMode=t.writingMode,n.solid.color.setHex(t.fill),n.edge.enabled=t.edgeEnabled,n.edge.width=t.edgeWidth,n.edge.color.setHex(t.edgeColor),n.points.enabled=t.pointsEnabled,n.points.radius=t.pointsRadius,n.points.color.setHex(t.pointsColor),w(),k()};e.advanced&&e.guiContainer&&(g=new p({autoPlace:!1,container:e.guiContainer,title:`Text`,width:200}),g.add(t,`content`).name(`text (\\n = line)`).onFinishChange(O).listen(),g.add(T,`compareAlignment`).name(`Compare alignment`),g.add(t,`fontSize`,16,96,1).onChange(O),g.add(t,`precision`,3,100,1).onChange(O),g.add(t,`lineSpacing`,0,40,1).onChange(O),g.add(t,`letterSpacing`,-10,20,1).onChange(O),g.add(t,`textAlign`,[`left`,`center`,`right`]).onChange(O),g.add(t,`baseline`,[`top`,`middle`,`bottom`]).name(`baseline (anchorY)`).onChange(O),g.add(t,`writingMode`,[`horizontal-tb`,`vertical-rl`]).onChange(O),g.add(C,`anchorX`).disable().listen(),g.add(C,`anchorY`).disable().listen(),g.addColor(t,`fill`).onChange(O),g.add(t,`edgeEnabled`).onChange(O),g.add(t,`edgeWidth`,0,10,1).onChange(O),g.addColor(t,`edgeColor`).onChange(O),g.add(t,`pointsEnabled`).onChange(O),g.add(t,`pointsRadius`,1,8,1).onChange(O),g.addColor(t,`pointsColor`).onChange(O));let k=()=>{let t=e.container.getBoundingClientRect();D.resize(),E.setViewport(Math.max(1,t.width*D.dpr),Math.max(1,t.height*D.dpr)),E.zoom=Math.max(.001,Math.min(D.dpr,D.canvas.width/(h.width+36),D.canvas.height/(h.height+36)))},A=()=>{v()&&(D.render(b,E),i=requestAnimationFrame(A))};await D.ready,v()&&(k(),_=new ResizeObserver(k),_.observe(e.container),i=requestAnimationFrame(A))}}catch(t){n.mounted&&e.onError(t)}})(),()=>{n.mounted=!1,cancelAnimationFrame(i),_&&_.disconnect(),g&&g.destroy(),a&&a.destroy()}},_=t(),v=({advanced:e})=>(0,_.jsx)(i,{advanced:e,controlsId:`text-controls`,mountScene:g}),y=`import { BaseMaterial, Camera, Font, Mesh, Rect2D, Render, Scene, Style, Text } from "bplinejs";
import type { TextWritingMode } from "bplinejs";
import GUI from "lil-gui";
import fontUrl from "./MiSans-Normal.woff2?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#fff)";
document.body.append(container);
const render = new Render(container);
await render.ready;
await Font.register("MiSans", fontUrl);
const scene = new Scene();
const camera = new Camera();
const parameters = {
    content: "Hello World\\\\nHello World",
    fontSize: 52,
    precision: 8,
    lineSpacing: 12,
    letterSpacing: 2,
    textAlign: "center" as "left" | "center" | "right",
    baseline: "middle" as "top" | "middle" | "bottom",
    writingMode: "horizontal-tb" as TextWritingMode,
    fill: "#5584dc",
    edgeEnabled: true,
    edgeWidth: 3,
    edgeColor: "#67d8ff",
    pointsEnabled: false,
    pointsRadius: 2,
    pointsColor: "#ffc76d",
};
const text = new Text(parameters.content.replaceAll("\\\\n", "\\n"), parameters.fontSize, "MiSans", parameters);
const mesh = new Mesh(text, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.points.vertices = true;
style.points.midpoints = false;
style.points.minPointsLength = 18;
mesh.style = style;
scene.add(mesh);

// baseline selects anchorY; this marker moves while the text geometry remains centered.
const anchor = new Mesh(new Rect2D({ width: 7, height: 7, radius: 1 }), new BaseMaterial(), false);
const anchorStyle = new Style();
anchorStyle.solid.enabled = true;
anchorStyle.solid.color.setHex("#e55287");
anchor.style = anchorStyle;
anchor.ignoreZoom = true;
anchor.order = 1;
scene.add(anchor);
const anchors = { anchorX: 0, anchorY: 0 };

/** @example fit(); @returns No value; fit horizontal text and long vertical columns. */
const fit = (): void => {
    render.resize();
    camera.setViewport(render.canvas.width, render.canvas.height);
    camera.zoom = Math.max(0.001, Math.min(render.dpr,
        render.canvas.width / (text.width + 36), render.canvas.height / (text.height + 36)));
};

/** @example update(); @returns No value; apply layout, style and anchor controls. */
const update = (): void => {
    text.text = parameters.content.replaceAll("\\\\n", "\\n");
    text.fontSize = parameters.fontSize;
    text.precision = parameters.precision;
    text.lineSpacing = parameters.lineSpacing;
    text.letterSpacing = parameters.letterSpacing;
    text.textAlign = parameters.textAlign;
    text.baseline = parameters.baseline;
    text.writingMode = parameters.writingMode;
    style.solid.color.setHex(parameters.fill);
    style.edge.enabled = parameters.edgeEnabled;
    style.edge.width = parameters.edgeWidth;
    style.edge.color.setHex(parameters.edgeColor);
    style.points.enabled = parameters.pointsEnabled;
    style.points.radius = parameters.pointsRadius;
    style.points.color.setHex(parameters.pointsColor);
    anchors.anchorX = text.anchorX;
    anchors.anchorY = text.anchorY;
    anchor.position.set(anchors.anchorX, anchors.anchorY);
    fit();
};
update();
const observer = new ResizeObserver(fit);
observer.observe(container);

/** @example compareAlignment(); @returns No value; compare unequal row or column lengths. */
const compareAlignment = (): void => {
    parameters.content = "Hello World\\\\nHello";
    update();
};
const actions = { compareAlignment };
const gui = new GUI({ title: "Text" });
gui.add(parameters, "content").name("text (\\\\n = line)").onFinishChange(update).listen();
gui.add(actions, "compareAlignment").name("Compare alignment");
gui.add(parameters, "fontSize", 16, 96, 1).onChange(update);
gui.add(parameters, "precision", 3, 100, 1).onChange(update);
gui.add(parameters, "lineSpacing", 0, 40, 1).onChange(update);
gui.add(parameters, "letterSpacing", -10, 20, 1).onChange(update);
gui.add(parameters, "textAlign", ["left", "center", "right"]).onChange(update);
gui.add(parameters, "baseline", ["top", "middle", "bottom"]).name("baseline (anchorY)").onChange(update);
gui.add(parameters, "writingMode", ["horizontal-tb", "vertical-rl"]).onChange(update);
gui.add(anchors, "anchorX").disable().listen();
gui.add(anchors, "anchorY").disable().listen();
gui.addColor(parameters, "fill").onChange(update);
gui.add(parameters, "edgeEnabled").onChange(update);
gui.add(parameters, "edgeWidth", 0, 10, 1).onChange(update);
gui.addColor(parameters, "edgeColor").onChange(update);
gui.add(parameters, "pointsEnabled").onChange(update);
gui.add(parameters, "pointsRadius", 1, 8, 1).onChange(update);
gui.addColor(parameters, "pointsColor").onChange(update);

/** @example draw(); @returns No value; render the current text and its anchor marker. */
const draw = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();
`,b=`import { BaseMaterial, Camera, Font, Mesh, Render, Scene, Style, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
// Await font loading and WASM initialization; Text geometry is then generated synchronously.
await Font.register("MiSans", fontUrl);
const geometry = new Text("Hello World\\nHello World", 52, "MiSans", {
    precision: 8,
    lineSpacing: 12,
    letterSpacing: 2,
});
const mesh = new Mesh(geometry, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5584dc");
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const render = new Render(container, "production");
const camera = new Camera();
await render.ready;
camera.setViewport(render.canvas.width, render.canvas.height);
render.render(scene, camera);`,x=()=>{let{language:t}=e(),r=n.translate(t,`example.textTitle`);return(0,_.jsx)(a,{title:r,shortCode:b,fullCode:y,Preview:v})};export{x as default};