import{i as e,n as t,r as n}from"./index-DY15zU6K.js";import{_ as r,g as i,h as a,n as o,p as s,r as c,t as l,v as u}from"./lil-gui.esm-BlALyeMe.js";import{t as d}from"./CameraControl-Cb_m4PQx.js";import{t as f}from"./Rect2D-Bfwhim2E.js";import{t as p}from"./baseMaterial-BQGKj56n.js";var m=e=>{let t=new c(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n=new o,r=[`#9276ed`,`#5ac5d5`,`#f4b66c`,`#e888a7`,`#7bbf9e`,`#abc8f0`];for(let e=0;e<r.length;e++){let t=new a;t.solid.enabled=!0,t.solid.color.setHex(r[e]),t.edge.enabled=!0,t.edge.width=3,t.edge.color.setHex(`#ffffff`);let i=new s(new f({width:90,height:70,radius:10}),new p);i.style=t,i.position.set((e%3-1)*125,(Math.floor(e/3)-.5)*125),n.add(i)}let u=new i,m=new d(u,t);m.is=!0;let h={enabled:!0,drag:!0,rightDrag:!0,zoom:!0,rotate:!0,inertia:!0,damp:.3,zoomRate:1},g,_=0,v=!0,y=()=>{m.is=h.enabled,m.drag=h.drag,m.rightDrag=h.rightDrag,m.zoom=h.zoom,m.rotate=h.rotate,m.inertia=h.inertia,m.damp=h.damp,m.zoomRate=h.zoomRate};e.advanced&&e.guiContainer&&(g=new l({autoPlace:!1,container:e.guiContainer,title:`Camera control`,width:200}),g.add(h,`enabled`).onChange(y),g.add(h,`drag`).onChange(y),g.add(h,`rightDrag`).onChange(y),g.add(h,`zoom`).onChange(y),g.add(h,`rotate`).onChange(y),g.add(h,`inertia`).onChange(y),g.add(h,`damp`,0,.95,.01).onChange(y),g.add(h,`zoomRate`,.2,2,.1).onChange(y),g.add({reset:()=>{u.position.set(0,0),u.zoom=1,u.rotation=0}},`reset`).name(`reset camera`));let b=()=>{let n=e.container.getBoundingClientRect();t.resize(),u.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},x=new ResizeObserver(b),S=()=>{v&&(m.update(),t.render(n,u),_=requestAnimationFrame(S))};return t.ready.then(()=>{v&&(b(),x.observe(e.container),_=requestAnimationFrame(S))},t=>{v&&e.onError(t)}),()=>{v=!1,cancelAnimationFrame(_),x.disconnect(),g&&g.destroy(),m.dispose(),t.destroy()}},h=t(),g=({advanced:t})=>{let{language:i}=e();return(0,h.jsxs)(`div`,{className:`relative h-full`,children:[(0,h.jsx)(r,{advanced:t,controlsId:`control-controls`,mountScene:m}),(0,h.jsx)(`p`,{className:`pointer-events-none absolute bottom-2 left-2 rounded bg-background/85 px-2 py-1 text-xs text-foreground`,children:n.translate(i,`example.controlHint`)})]})},_=`import { BaseMaterial, Camera, CameraControl, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface ControlParameters {
    enabled: boolean;
    drag: boolean;
    rightDrag: boolean;
    zoom: boolean;
    rotate: boolean;
    inertia: boolean;
    damp: number;
    zoomRate: number;
}

/**
 * Mount a scene whose camera responds to mouse and touch input.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountCameraControlScene(options);
 * @returns Cleanup for input listeners, renderer, observer, and GUI.
 */
export const mountCameraControlScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const scene = new Scene();
    const colors = ["#9276ed", "#5ac5d5", "#f4b66c", "#e888a7", "#7bbf9e", "#abc8f0"];
    for (let index = 0; index < colors.length; index++) {
        // Offset landmarks make pan and zoom visible even after leaving the center.
        const style = new Style();
        style.solid.enabled = true;
        style.solid.color.setHex(colors[index]);
        style.edge.enabled = true;
        style.edge.width = 3;
        style.edge.color.setHex("#ffffff");
        const mesh = new Mesh(new Rect2D({ width: 90, height: 70, radius: 10 }), new BaseMaterial());
        mesh.style = style;
        mesh.position.set((index % 3 - 1) * 125, (Math.floor(index / 3) - 0.5) * 125);
        scene.add(mesh);
    }
    const camera = new Camera();
    const control = new CameraControl(camera, render);
    control.is = true;
    const parameters: ControlParameters = {
        enabled: true,
        drag: true,
        rightDrag: true,
        zoom: true,
        rotate: true,
        inertia: true,
        damp: 0.3,
        zoomRate: 1,
    };
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Apply control switches and motion settings without replacing event listeners.
     * @example
     * gui.add(parameters, "drag").onChange(updateControl);
     * @returns No value.
     */
    const updateControl = (): void => {
        control.is = parameters.enabled;
        control.drag = parameters.drag;
        control.rightDrag = parameters.rightDrag;
        control.zoom = parameters.zoom;
        control.rotate = parameters.rotate;
        control.inertia = parameters.inertia;
        control.damp = parameters.damp;
        control.zoomRate = parameters.zoomRate;
    };

    /**
     * Restore the camera after exploring the scene.
     * @example
     * gui.add(actions, "reset");
     * @returns No value.
     */
    const resetCamera = (): void => {
        camera.position.set(0, 0);
        camera.zoom = 1;
        camera.rotation = 0;
    };
    const actions = { reset: resetCamera };
    // Only the advanced preview owns an editable floating panel.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Camera control", width: 200 });
        gui.add(parameters, "enabled").onChange(updateControl);
        gui.add(parameters, "drag").onChange(updateControl);
        gui.add(parameters, "rightDrag").onChange(updateControl);
        gui.add(parameters, "zoom").onChange(updateControl);
        gui.add(parameters, "rotate").onChange(updateControl);
        gui.add(parameters, "inertia").onChange(updateControl);
        gui.add(parameters, "damp", 0, 0.95, 0.01).onChange(updateControl);
        gui.add(parameters, "zoomRate", 0.2, 2, 0.1).onChange(updateControl);
        gui.add(actions, "reset").name("reset camera");
    }

    /**
     * Keep viewport measurements aligned with the canvas cell.
     * @example
     * resizeObserver.observe(options.container);
     * @returns No value.
     */
    const updateViewport = (): void => {
        const bounds = options.container.getBoundingClientRect();
        render.resize();
        camera.setViewport(Math.max(1, bounds.width * render.dpr), Math.max(1, bounds.height * render.dpr));
    };
    const resizeObserver = new ResizeObserver(updateViewport);

    /**
     * Advance inertia and draw while this route remains active.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // Frames scheduled before unmount must not access disposed input listeners.
        if (mounted) {
            control.update();
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start the animation once the WebGPU device is ready.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // GPU readiness may arrive after React has already removed this preview.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Surface WebGPU failures inside the example cell.
     * @param error Initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // A stale asynchronous failure should not update an unmounted preview.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Remove pointer listeners before destroying the renderer.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // Simple previews never create a GUI, so only destroy an existing panel.
        if (gui) {
            gui.destroy();
        }
        control.dispose();
        render.destroy();
    };
    return dispose;
};
`,v=`import { BaseMaterial, Camera, CameraControl, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const camera = new Camera(width, height);
const control = new CameraControl(camera, render);
control.is = true;
const scene = new Scene();
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#8c72ef");
const mesh = new Mesh(new Rect2D({ width: 120, height: 80 }), new BaseMaterial());
mesh.style = style;
scene.add(mesh);
function frame() {
    control.update();
    render.render(scene, camera);
    requestAnimationFrame(frame);
}
frame();
// On teardown: control.dispose(); render.destroy();`,y=()=>{let{language:t}=e(),r=n.translate(t,`example.controlTitle`);return(0,h.jsx)(u,{title:r,shortCode:v,fullCode:_,Preview:g})};export{y as default};