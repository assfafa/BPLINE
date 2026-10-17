import{i as e,n as t,r as n}from"./index-_pD-vuBA.js";import{D as r,N as i,P as a,T as o,a as s,d as c,g as l,n as u,s as d,t as f,v as p}from"./lil-gui.esm-93vgqqqI.js";var m=new URL(`50-DAG8pIi9.jpg`,import.meta.url).href,h=e=>{let t=new u(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={width:300,height:210,radius:12,rotation:0,tint:`#ffffff`,addressMode:`clamp-to-edge`,edgeEnabled:e.advanced,edgeWidth:5,edgeColor:`#a997f1`},i=new l,a=new o;a.solid.enabled=!0,a.solid.texture=i,a.edge.enabled=n.edgeEnabled,a.edge.width=n.edgeWidth,a.edge.color.setHex(n.edgeColor);let h=new p({width:n.width,height:n.height,radius:n.radius}),g=new d(h,new c);g.style=a;let _=new s;_.add(g);let v=new r,y,b=0,x=!0,S=()=>{h.width=n.width,h.height=n.height,h.radius=n.radius,g.rotation=n.rotation*Math.PI/180,a.solid.color.setHex(n.tint),a.solid.addressModeU=n.addressMode,a.solid.addressModeV=n.addressMode,a.edge.enabled=n.edgeEnabled,a.edge.width=n.edgeWidth,a.edge.color.setHex(n.edgeColor)};e.advanced&&e.guiContainer&&(y=new f({autoPlace:!1,container:e.guiContainer,title:`Texture`,width:200}),y.add(n,`width`,160,380,1).onChange(S),y.add(n,`height`,100,280,1).onChange(S),y.add(n,`radius`,0,60,1).onChange(S),y.add(n,`rotation`,-90,90,1).onChange(S),y.addColor(n,`tint`).onChange(S),y.add(n,`addressMode`,[`clamp-to-edge`,`repeat`,`mirror-repeat`]).onChange(S),y.add(n,`edgeEnabled`).onChange(S),y.add(n,`edgeWidth`,1,16,1).onChange(S),y.addColor(n,`edgeColor`).onChange(S));let C=()=>{let n=e.container.getBoundingClientRect();t.resize(),v.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},w=new ResizeObserver(C),T=()=>{x&&(t.render(_,v),b=requestAnimationFrame(T))};return Promise.all([t.ready,i.load(m)]).then(()=>{x&&(C(),w.observe(e.container),b=requestAnimationFrame(T))},t=>{x&&e.onError(t)}),()=>{x=!1,cancelAnimationFrame(b),w.disconnect(),y&&y.destroy(),t.destroy()}},g=t(),_=({advanced:e})=>(0,g.jsx)(i,{advanced:e,controlsId:`texture-controls`,mountScene:h}),v=`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import GUI from "lil-gui";
import imageUrl from "@/assets/ttf/50.jpg?url";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface TextureControls {
    width: number;
    height: number;
    radius: number;
    rotation: number;
    tint: string;
    addressMode: GPUAddressMode;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
}

/**
 * Mount a rectangle textured with the local example image.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountTextureScene(options);
 * @returns Cleanup for image loading, rendering, observer, and GUI.
 */
export const mountTextureScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: TextureControls = {
        width: 300,
        height: 210,
        radius: 12,
        rotation: 0,
        tint: "#ffffff",
        addressMode: "clamp-to-edge",
        edgeEnabled: options.advanced,
        edgeWidth: 5,
        edgeColor: "#a997f1",
    };
    const texture = new Texture();
    const style = new Style();
    style.solid.enabled = true;
    style.solid.texture = texture;
    style.edge.enabled = parameters.edgeEnabled;
    style.edge.width = parameters.edgeWidth;
    style.edge.color.setHex(parameters.edgeColor);
    const geometry = new Rect2D({ width: parameters.width, height: parameters.height, radius: parameters.radius });
    const mesh = new Mesh(geometry, new BaseMaterial());
    mesh.style = style;
    const scene = new Scene();
    scene.add(mesh);
    const camera = new Camera();
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Apply GUI values to the public geometry, mesh, and texture style properties.
     * @example
     * gui.add(parameters, "width").onChange(updateTexture);
     * @returns No value.
     */
    const updateTexture = (): void => {
        geometry.width = parameters.width;
        geometry.height = parameters.height;
        geometry.radius = parameters.radius;
        mesh.rotation = parameters.rotation * Math.PI / 180;
        style.solid.color.setHex(parameters.tint);
        style.solid.addressModeU = parameters.addressMode;
        style.solid.addressModeV = parameters.addressMode;
        style.edge.enabled = parameters.edgeEnabled;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
    };

    // The same loaded image remains bound while geometry and sampling change.
    // Only the advanced preview owns an editable floating panel.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Texture", width: 200 });
        gui.add(parameters, "width", 160, 380, 1).onChange(updateTexture);
        gui.add(parameters, "height", 100, 280, 1).onChange(updateTexture);
        gui.add(parameters, "radius", 0, 60, 1).onChange(updateTexture);
        gui.add(parameters, "rotation", -90, 90, 1).onChange(updateTexture);
        gui.addColor(parameters, "tint").onChange(updateTexture);
        gui.add(parameters, "addressMode", ["clamp-to-edge", "repeat", "mirror-repeat"]).onChange(updateTexture);
        gui.add(parameters, "edgeEnabled").onChange(updateTexture);
        gui.add(parameters, "edgeWidth", 1, 16, 1).onChange(updateTexture);
        gui.addColor(parameters, "edgeColor").onChange(updateTexture);
    }

    /**
     * Match the camera to the visible WebGPU drawing surface.
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
     * Draw while this preview remains mounted.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // Frames scheduled before unmount must not access a destroyed renderer.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start drawing after both WebGPU and the local image are ready.
     * @example
     * void Promise.all([render.ready, texture.load(imageUrl)]).then(handleReady, handleError);
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
     * Report a failed image request or GPU initialization in the preview.
     * @param error Image loading or GPU setup failure.
     * @example
     * void Promise.all([render.ready, texture.load(imageUrl)]).then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // A stale asynchronous failure should not update an unmounted preview.
        if (mounted) {
            options.onError(error);
        }
    };
    void Promise.all([render.ready, texture.load(imageUrl)]).then(handleReady, handleError);

    /**
     * Release resources when this preview is replaced.
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
        render.destroy();
    };
    return dispose;
};
`,y=`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import imageUrl from "@/assets/ttf/50.jpg?url";

const texture = await new Texture().load(imageUrl);
const style = new Style();
style.solid.enabled = true;
style.solid.texture = texture;
const geometry = new Rect2D({ width: 300, height: 210 });
const material = new BaseMaterial();
const mesh = new Mesh(geometry, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const render = new Render(container);
await render.ready;
render.render(scene, new Camera(width, height));`,b=()=>{let{language:t}=e(),r=n.translate(t,`example.textureTitle`);return(0,g.jsx)(a,{title:r,shortCode:y,fullCode:v,Preview:_})};export{b as default};