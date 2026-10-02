import{i as e,n as t,r as n}from"./index-YNW6j57L.js";import{_ as r,g as i,h as a,n as o,p as s,r as c,t as l,v as u}from"./lil-gui.esm-BEHuxiGy.js";import{t as d}from"./NGon2D-CAS5gElU.js";import{t as f}from"./baseMaterial-B1gmKtPJ.js";var p=e=>{let t=new c(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={outer:85,inner:0,sides:7,startAngle:90,uvMode:`bounding`,rotation:0,fill:`#9c7cf0`,edgeEnabled:!0,edgeWidth:6,edgeColor:`#8bd5ff`,pointsEnabled:!0,pointsVertices:!0,pointsMidpoints:!1,pointsRadius:6,pointsMinLength:28,pointsMinEdgeLength:28,pointsColor:`#ffca79`};e.advanced&&(n.inner=32);let r=new a;r.solid.enabled=!0,r.solid.color.setHex(n.fill),e.advanced&&(r.edge.enabled=!0,r.edge.width=n.edgeWidth,r.edge.color.setHex(n.edgeColor),r.points.enabled=!0,r.points.vertices=n.pointsVertices,r.points.midpoints=n.pointsMidpoints,r.points.radius=n.pointsRadius,r.points.minPointsLength=n.pointsMinLength,r.points.minEdgePointsLength=n.pointsMinEdgeLength,r.points.color.setHex(n.pointsColor));let u=new d({outer:n.outer,inner:n.inner,sides:n.sides,uvMode:n.uvMode,startAngle:n.startAngle*Math.PI/180}),p=new f,m=new s(u,p);m.style=r;let h=new o;h.add(m);let g=new i,_,v=0,y=!0,b=()=>{u.outer=n.outer,u.inner=n.inner,u.sides=n.sides,u.startAngle=n.startAngle*Math.PI/180,u.uvMode=n.uvMode,m.rotation=n.rotation*Math.PI/180,r.solid.color.setHex(n.fill),r.edge.enabled=n.edgeEnabled,r.edge.width=n.edgeWidth,r.edge.color.setHex(n.edgeColor),r.points.enabled=n.pointsEnabled,r.points.vertices=n.pointsVertices,r.points.midpoints=n.pointsMidpoints,r.points.radius=n.pointsRadius,r.points.minPointsLength=n.pointsMinLength,r.points.minEdgePointsLength=n.pointsMinEdgeLength,r.points.color.setHex(n.pointsColor)};e.advanced&&e.guiContainer&&(_=new l({autoPlace:!1,container:e.guiContainer,title:`Regular polygon`,width:200}),_.add(n,`outer`,30,130,1).onChange(b),_.add(n,`inner`,0,100,1).onChange(b),_.add(n,`sides`,3,32,1).onChange(b),_.add(n,`startAngle`,-180,180,1).onChange(b),_.add(n,`uvMode`,[`bounding`,`polar`]).onChange(b),_.add(n,`rotation`,-180,180,1).onChange(b),_.addColor(n,`fill`).onChange(b),_.add(n,`edgeEnabled`).onChange(b),_.add(n,`edgeWidth`,0,24,1).onChange(b),_.addColor(n,`edgeColor`).onChange(b),_.add(n,`pointsEnabled`).onChange(b),_.add(n,`pointsVertices`).onChange(b),_.add(n,`pointsMidpoints`).onChange(b),_.add(n,`pointsRadius`,1,16,1).onChange(b),_.add(n,`pointsMinLength`,0,120,1).name(`vertex threshold`).onChange(b),_.add(n,`pointsMinEdgeLength`,0,120,1).name(`edge threshold`).onChange(b),_.addColor(n,`pointsColor`).onChange(b));let x=()=>{let n=e.container.getBoundingClientRect();t.resize(),g.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},S=new ResizeObserver(x),C=()=>{y&&(t.render(h,g),v=requestAnimationFrame(C))};return t.ready.then(()=>{y&&(x(),S.observe(e.container),v=requestAnimationFrame(C))},t=>{y&&e.onError(t)}),()=>{y=!1,cancelAnimationFrame(v),S.disconnect(),_&&_.destroy(),t.destroy()}},m=t(),h=({advanced:e})=>(0,m.jsx)(r,{advanced:e,controlsId:`ngon-controls`,mountScene:p}),g=`import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";
import type { NGonUVMode } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface NGonControls {
    outer: number;
    inner: number;
    sides: number;
    startAngle: number;
    uvMode: NGonUVMode;
    rotation: number;
    fill: string;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
    pointsEnabled: boolean;
    pointsVertices: boolean;
    pointsMidpoints: boolean;
    pointsRadius: number;
    pointsMinLength: number;
    pointsMinEdgeLength: number;
    pointsColor: string;
}

/**
 * Mount an editable regular polygon or ring using NGon2D.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountNGonScene(options);
 * @returns Cleanup for WebGPU, animation, resize observer, and GUI.
 */
export const mountNGonScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: NGonControls = {
        outer: 85,
        inner: 0,
        sides: 7,
        startAngle: 90,
        uvMode: "bounding",
        rotation: 0,
        fill: "#9c7cf0",
        edgeEnabled: true,
        edgeWidth: 6,
        edgeColor: "#8bd5ff",
        pointsEnabled: true,
        pointsVertices: true,
        pointsMidpoints: false,
        pointsRadius: 6,
        pointsMinLength: 28,
        pointsMinEdgeLength: 28,
        pointsColor: "#ffca79",
    };
    // The advanced preview starts as a ring so the inner radius is visible.
    if (options.advanced) {
        parameters.inner = 32;
    }
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(parameters.fill);

    // Edges and filtered point markers make the advanced topology visible.
    if (options.advanced) {
        style.edge.enabled = true;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.points.enabled = true;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    }

    const geometry = new NGon2D({
        outer: parameters.outer,
        inner: parameters.inner,
        sides: parameters.sides,
        uvMode: parameters.uvMode,
        startAngle: parameters.startAngle * Math.PI / 180,
    });
    const material = new BaseMaterial();
    const mesh = new Mesh(geometry, material);
    mesh.style = style;
    const scene = new Scene();
    scene.add(mesh);
    const camera = new Camera();
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Apply controls through public NGon2D, Mesh, and Style properties.
     * @example
     * gui.add(parameters, "sides").onChange(updateNGon);
     * @returns No value.
     */
    const updateNGon = (): void => {
        geometry.outer = parameters.outer;
        geometry.inner = parameters.inner;
        geometry.sides = parameters.sides;
        geometry.startAngle = parameters.startAngle * Math.PI / 180;
        geometry.uvMode = parameters.uvMode;
        mesh.rotation = parameters.rotation * Math.PI / 180;
        style.solid.color.setHex(parameters.fill);
        style.edge.enabled = parameters.edgeEnabled;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.points.enabled = parameters.pointsEnabled;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    };

    // The GUI is confined to the advanced canvas cell.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Regular polygon", width: 200 });
        gui.add(parameters, "outer", 30, 130, 1).onChange(updateNGon);
        gui.add(parameters, "inner", 0, 100, 1).onChange(updateNGon);
        gui.add(parameters, "sides", 3, 32, 1).onChange(updateNGon);
        gui.add(parameters, "startAngle", -180, 180, 1).onChange(updateNGon);
        gui.add(parameters, "uvMode", ["bounding", "polar"]).onChange(updateNGon);
        gui.add(parameters, "rotation", -180, 180, 1).onChange(updateNGon);
        gui.addColor(parameters, "fill").onChange(updateNGon);
        gui.add(parameters, "edgeEnabled").onChange(updateNGon);
        gui.add(parameters, "edgeWidth", 0, 24, 1).onChange(updateNGon);
        gui.addColor(parameters, "edgeColor").onChange(updateNGon);
        gui.add(parameters, "pointsEnabled").onChange(updateNGon);
        gui.add(parameters, "pointsVertices").onChange(updateNGon);
        gui.add(parameters, "pointsMidpoints").onChange(updateNGon);
        gui.add(parameters, "pointsRadius", 1, 16, 1).onChange(updateNGon);
        gui.add(parameters, "pointsMinLength", 0, 120, 1).name("vertex threshold").onChange(updateNGon);
        gui.add(parameters, "pointsMinEdgeLength", 0, 120, 1).name("edge threshold").onChange(updateNGon);
        gui.addColor(parameters, "pointsColor").onChange(updateNGon);
    }

    /**
     * Keep the camera in physical pixels when its preview cell is resized.
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
     * Draw until route cleanup stops the animation loop.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A disposed renderer must never receive another frame.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start resizing and drawing once the GPU device is ready.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // StrictMode can dispose a first mount before device initialization finishes.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Report WebGPU setup failures to the visible preview cell.
     * @param error Initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // Ignore failures arriving after this route has been left.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release resources owned by this preview on route changes.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // lil-gui registers DOM listeners only while the advanced cell is mounted.
        if (gui) {
            gui.destroy();
        }
        render.destroy();
    };

    return dispose;
};
`,_=`import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#9c7cf0");
const geometry = new NGon2D({ outer: 85, sides: 7, startAngle: Math.PI / 2 });
const material = new BaseMaterial();
const mesh = new Mesh(geometry, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`,v=()=>{let{language:t}=e(),r=n.translate(t,`example.ngonTitle`);return(0,m.jsx)(u,{title:r,shortCode:_,fullCode:g,Preview:h})};export{v as default};