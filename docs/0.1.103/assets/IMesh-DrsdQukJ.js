import{i as e,n as t,r as n}from"./index-DY15zU6K.js";import{t as r}from"./Vec2-NTeaCz1R.js";import{_ as i,f as a,g as o,h as s,n as c,r as l,t as u,v as d}from"./lil-gui.esm-BlALyeMe.js";import{t as f}from"./CameraControl-Cb_m4PQx.js";import{t as p}from"./Rect2D-Bfwhim2E.js";import{t as m}from"./baseMaterial-BQGKj56n.js";var h=e=>{let t=new l(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={count:5e4,spacing:13,size:12,rotation:0,zoom:.1,palette:`checker`,primary:`#9377ed`,secondary:`#54c8db`},i=new s;i.solid.enabled=!0;let d=new p({width:n.size,height:n.size,radius:1,style:i}),h=new a(d,new m,{raw:!1,capacity:5e4}),g=new c,_=new o,v=new f(_,t);v.is=!0;let y,b=0,x=!0,S=()=>{h.clear();let e=Math.ceil(Math.sqrt(n.count)),t=Math.ceil(n.count/e),i=new s;i.solid.enabled=!0,i.solid.color.setHex(n.primary);let a=new s;a.solid.enabled=!0,a.solid.color.setHex(n.secondary);let o=new r,c={position:o,scale:new r(1,1),rotation:n.rotation*Math.PI/180,style:i};for(let r=0;r<n.count;r++){let s=r%e,l=Math.floor(r/e);o.set((s-(e-1)/2)*n.spacing,(l-(t-1)/2)*n.spacing);let u=(Math.floor(l/16)+Math.floor(s/16))%2==0;n.palette===`stripes`?u=Math.floor(s/16)%2==0:n.palette===`gradient`&&(u=l<t/2),c.style=u?i:a,h.push(c)}};S(),g.add(h);let C=()=>{let r=e.container.getBoundingClientRect(),i=Math.ceil(Math.sqrt(n.count)),a=Math.ceil(n.count/i),o=i*n.spacing,s=a*n.spacing;n.zoom=Number((Math.min(r.width*t.dpr/o,r.height*t.dpr/s)*.6).toFixed(2)),_.position.set(0,0),_.zoom=n.zoom},w=()=>{d.width=n.size,d.height=n.size},T=()=>{_.zoom=n.zoom},E=()=>{S(),C()};e.advanced&&e.guiContainer&&(y=new u({autoPlace:!1,container:e.guiContainer,title:`Instanced mesh`,width:200}),y.add(n,`count`,{"50,000":5e4,"100,000":1e5}).onChange(E),y.add(n,`spacing`,8,20,1).onFinishChange(E),y.add(n,`size`,4,16,1).onChange(w),y.add(n,`rotation`,-90,90,1).onFinishChange(S),y.add(n,`zoom`,.05,2,.01).listen().onChange(T),y.add(n,`palette`,[`checker`,`stripes`,`gradient`]).onChange(S),y.addColor(n,`primary`).onFinishChange(S),y.addColor(n,`secondary`).onFinishChange(S),y.add({fit:C},`fit`).name(`fit all`));let D=()=>{let n=e.container.getBoundingClientRect();t.resize(),_.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},O=new ResizeObserver(D),k=()=>{x&&(v.update(),n.zoom=Number(_.zoom.toFixed(2)),t.render(g,_),b=requestAnimationFrame(k))};return t.ready.then(()=>{x&&(D(),C(),O.observe(e.container),b=requestAnimationFrame(k))},t=>{x&&e.onError(t)}),()=>{x=!1,cancelAnimationFrame(b),O.disconnect(),y&&y.destroy(),v.dispose(),t.destroy()}},g=t(),_=({advanced:t})=>{let{language:r}=e();return(0,g.jsxs)(`div`,{className:`relative h-full`,children:[(0,g.jsx)(i,{advanced:t,controlsId:`instance-controls`,mountScene:h}),(0,g.jsx)(`p`,{className:`pointer-events-none absolute bottom-2 left-2 rounded bg-background/85 px-2 py-1 text-xs text-foreground`,children:n.translate(r,`example.controlHint`)})]})},v=`import { BaseMaterial, Camera, CameraControl, IMesh, Rect2D, Render, Scene, Style } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface InstanceControls {
    count: number;
    spacing: number;
    size: number;
    rotation: number;
    zoom: number;
    palette: "checker" | "stripes" | "gradient";
    primary: string;
    secondary: string;
}

/**
 * Mount a shared-geometry IMesh with independently styled instances.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountInstanceScene(options);
 * @returns Cleanup for the renderer, animation, observer, and GUI.
 */
export const mountInstanceScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: InstanceControls = {
        count: 50000,
        spacing: 13,
        size: 12,
        rotation: 0,
        zoom: 0.1,
        palette: "checker",
        primary: "#9377ed",
        secondary: "#54c8db",
    };
    // Geometry enables the solid partition once; each instance supplies its own color.
    const geometryStyle = new Style();
    geometryStyle.solid.enabled = true;
    const geometry = new Rect2D({ width: parameters.size, height: parameters.size, radius: 1, style: geometryStyle });
    const mesh = new IMesh(geometry, new BaseMaterial(), { raw: false, capacity: 50000 });
    const scene = new Scene();
    const camera = new Camera();
    const control = new CameraControl(camera, render);
    control.is = true;
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Pack 50,000 or 100,000 frozen instances into one shared mesh.
     * @example
     * gui.add(parameters, "count").onChange(rebuildAndFit);
     * @returns No value.
     */
    const rebuildInstances = (): void => {
        mesh.clear();
        const columns = Math.ceil(Math.sqrt(parameters.count));
        const rows = Math.ceil(parameters.count / columns);
        const primaryStyle = new Style();
        primaryStyle.solid.enabled = true;
        primaryStyle.solid.color.setHex(parameters.primary);
        const secondaryStyle = new Style();
        secondaryStyle.solid.enabled = true;
        secondaryStyle.solid.color.setHex(parameters.secondary);
        // Frozen records copy the position and style immediately, so these inputs are reused.
        const position = new Vec2();
        const scale = new Vec2(1, 1);
        const instance = { position, scale, rotation: parameters.rotation * Math.PI / 180, style: primaryStyle };
        for (let index = 0; index < parameters.count; index++) {
            // Center the complete grid, including its shorter final row.
            const column = index % columns;
            const row = Math.floor(index / columns);
            position.set((column - (columns - 1) / 2) * parameters.spacing, (row - (rows - 1) / 2) * parameters.spacing);
            let usePrimary = (Math.floor(row / 16) + Math.floor(column / 16)) % 2 === 0;
            // Larger color blocks stay legible when the complete grid is fitted to the preview.
            if (parameters.palette === "stripes") {
                usePrimary = Math.floor(column / 16) % 2 === 0;
            } else if (parameters.palette === "gradient") {
                // The gradient palette divides the field across rows.
                usePrimary = row < rows / 2;
            }
            // Both styles are shared because raw=false snapshots their values at push time.
            if (usePrimary) {
                instance.style = primaryStyle;
            } else {
                instance.style = secondaryStyle;
            }
            mesh.push(instance);
        }
    };
    rebuildInstances();
    scene.add(mesh);

    /**
     * Fit the entire instance field inside its current canvas cell.
     * @example
     * fitInstances();
     * @returns No value.
     */
    const fitInstances = (): void => {
        const bounds = options.container.getBoundingClientRect();
        const columns = Math.ceil(Math.sqrt(parameters.count));
        const rows = Math.ceil(parameters.count / columns);
        const width = columns * parameters.spacing;
        const height = rows * parameters.spacing;
        parameters.zoom = Number((Math.min(bounds.width * render.dpr / width, bounds.height * render.dpr / height) * 0.6).toFixed(2));
        camera.position.set(0, 0);
        camera.zoom = parameters.zoom;
    };

    /**
     * Update rectangle geometry without repacking existing instance transforms.
     * @example
     * gui.add(parameters, "size").onChange(updateGeometry);
     * @returns No value.
     */
    const updateGeometry = (): void => {
        geometry.width = parameters.size;
        geometry.height = parameters.size;
    };

    /**
     * Apply a zoom slider change without rebuilding instance buffers.
     * @example
     * gui.add(parameters, "zoom").onChange(updateZoom);
     * @returns No value.
     */
    const updateZoom = (): void => {
        camera.zoom = parameters.zoom;
    };

    /**
     * Repack the grid and refit it after count or spacing changes.
     * @example
     * gui.add(parameters, "count").onFinishChange(rebuildAndFit);
     * @returns No value.
     */
    const rebuildAndFit = (): void => {
        rebuildInstances();
        fitInstances();
    };

    // Repack only after a control is released; each repack writes tens of thousands of instances.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Instanced mesh", width: 200 });
        gui.add(parameters, "count", { "50,000": 50000, "100,000": 100000 }).onChange(rebuildAndFit);
        gui.add(parameters, "spacing", 8, 20, 1).onFinishChange(rebuildAndFit);
        gui.add(parameters, "size", 4, 16, 1).onChange(updateGeometry);
        gui.add(parameters, "rotation", -90, 90, 1).onFinishChange(rebuildInstances);
        gui.add(parameters, "zoom", 0.05, 2, 0.01).listen().onChange(updateZoom);
        gui.add(parameters, "palette", ["checker", "stripes", "gradient"]).onChange(rebuildInstances);
        gui.addColor(parameters, "primary").onFinishChange(rebuildInstances);
        gui.addColor(parameters, "secondary").onFinishChange(rebuildInstances);
        gui.add({ fit: fitInstances }, "fit").name("fit all");
    }

    /**
     * Match the camera viewport to the actual WebGPU drawing surface.
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
     * Draw the current instance data until this preview unmounts.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // Frames scheduled before unmount must not access a destroyed renderer.
        if (mounted) {
            control.update();
            // Reflect wheel and pinch zoom in the GUI without showing a long fractional value.
            parameters.zoom = Number(camera.zoom.toFixed(2));
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start the preview when GPU initialization finishes.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // GPU readiness may arrive after React has already removed this preview.
        if (mounted) {
            updateViewport();
            fitInstances();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Show GPU failures in the preview cell.
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
     * Release this scene when the route or preview mode changes.
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
`,y=`import { BaseMaterial, Camera, CameraControl, IMesh, Rect2D, Render, Scene, Style } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const geometryStyle = new Style();
geometryStyle.solid.enabled = true;
const geometry = new Rect2D({ width: 12, height: 12, style: geometryStyle });
const mesh = new IMesh(geometry, new BaseMaterial(), { raw: false, capacity: 50000 });
const purple = new Style();
purple.solid.enabled = true;
purple.solid.color.setHex("#9377ed");
const cyan = new Style();
cyan.solid.enabled = true;
cyan.solid.color.setHex("#54c8db");
const columns = Math.ceil(Math.sqrt(50000));
const rows = Math.ceil(50000 / columns);
// Frozen instances copy these temporary inputs during each push.
const position = new Vec2();
const scale = new Vec2(1, 1);
const instance = { position, scale, style: purple };
for (let index = 0; index < 50000; index++) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    position.set((column - (columns - 1) / 2) * 13, (row - (rows - 1) / 2) * 13);
    if ((Math.floor(column / 16) + Math.floor(row / 16)) % 2 === 0) {
        instance.style = purple;
    } else {
        instance.style = cyan;
    }
    mesh.push(instance);
}
const scene = new Scene();
scene.add(mesh);
const render = new Render(container);
await render.ready;
const camera = new Camera(width, height);
camera.zoom = Math.min(width / (columns * 13), height / (rows * 13)) * 0.6;
const control = new CameraControl(camera, render);
control.is = true;
const frame = () => {
    control.update();
    render.render(scene, camera);
    requestAnimationFrame(frame);
};
frame();
// On teardown: control.dispose(); render.destroy();`,b=()=>{let{language:t}=e(),r=n.translate(t,`example.instanceTitle`);return(0,g.jsx)(d,{title:r,shortCode:y,fullCode:v,Preview:_})};export{b as default};