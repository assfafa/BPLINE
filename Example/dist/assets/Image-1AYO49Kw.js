import{i as e,n as t,r as n}from"./index-DFaRmisn.js";import{c as r,d as i,f as a,i as o,l as s,n as c,o as l,r as u,t as d,u as f}from"./lil-gui.esm-d1pmZuDk.js";import{t as p}from"./Rect2D-DKRL83oq.js";var m=class{id;type=`Texture`;_version=0;_subscribers=new Set;_url=null;_source=null;_loaded=!1;_width=0;_height=0;constructor(){this.id=f()}get version(){return this._version}get url(){return this._url}set url(e){if(this._url!==e)this._url=e,this.updateVersion();else return}get source(){return this._source}set source(e){this._source!==e&&(e===null?this.clearSource():this.setSource(e,this._url))}get loaded(){return this._loaded}set loaded(e){if(this._loaded!==e)this._loaded=e,this.updateVersion();else return}get width(){return this._width}set width(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture width must be a non-negative integer.`);if(this._width!==e)this._width=e,this.updateVersion();else return}get height(){return this._height}set height(e){if(!Number.isInteger(e)||e<0)throw RangeError(`Texture height must be a non-negative integer.`);if(this._height!==e)this._height=e,this.updateVersion();else return}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}updateVersion(){this._version++;for(let e of[...this._subscribers])e.onTextureChange(this)}setSource(e,t=null){return this._url=t,this._source=e,this._loaded=!0,this._width=g(e),this._height=_(e),this.updateVersion(),this}clearSource(){return this._url=null,this._source=null,this._loaded=!1,this._width=0,this._height=0,this.updateVersion(),this}async load(e){let t=await h(e);return this.setSource(t,e)}},h=e=>new Promise((t,n)=>{let r=new Image;r.onload=()=>{t(r)},r.onerror=()=>{n(Error(`Texture load failed: ${e}`))},r.src=e}),g=e=>`naturalWidth`in e?e.naturalWidth:e.width,_=e=>`naturalHeight`in e?e.naturalHeight:e.height,v=new URL(`50-DAG8pIi9.jpg`,import.meta.url).href,y=e=>{let t=new u(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={width:300,height:210,radius:12,rotation:0,tint:`#ffffff`,addressMode:`clamp-to-edge`,edgeEnabled:e.advanced,edgeWidth:5,edgeColor:`#a997f1`},i=new m,a=new r;a.solid.enabled=!0,a.solid.texture=i,a.edge.enabled=n.edgeEnabled,a.edge.width=n.edgeWidth,a.edge.color.setHex(n.edgeColor);let f=new p({width:n.width,height:n.height,radius:n.radius}),h=new l(f,new o);h.style=a;let g=new c;g.add(h);let _=new s,y,b=0,x=!0,S=()=>{f.width=n.width,f.height=n.height,f.radius=n.radius,h.rotation=n.rotation*Math.PI/180,a.solid.color.setHex(n.tint),a.solid.addressModeU=n.addressMode,a.solid.addressModeV=n.addressMode,a.edge.enabled=n.edgeEnabled,a.edge.width=n.edgeWidth,a.edge.color.setHex(n.edgeColor)};e.advanced&&e.guiContainer&&(y=new d({autoPlace:!1,container:e.guiContainer,title:`Texture`,width:200}),y.add(n,`width`,160,380,1).onChange(S),y.add(n,`height`,100,280,1).onChange(S),y.add(n,`radius`,0,60,1).onChange(S),y.add(n,`rotation`,-90,90,1).onChange(S),y.addColor(n,`tint`).onChange(S),y.add(n,`addressMode`,[`clamp-to-edge`,`repeat`,`mirror-repeat`]).onChange(S),y.add(n,`edgeEnabled`).onChange(S),y.add(n,`edgeWidth`,1,16,1).onChange(S),y.addColor(n,`edgeColor`).onChange(S));let C=()=>{let n=e.container.getBoundingClientRect();t.resize(),_.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},w=new ResizeObserver(C),T=()=>{x&&(t.render(g,_),b=requestAnimationFrame(T))};return Promise.all([t.ready,i.load(v)]).then(()=>{x&&(C(),w.observe(e.container),b=requestAnimationFrame(T))},t=>{x&&e.onError(t)}),()=>{x=!1,cancelAnimationFrame(b),w.disconnect(),y&&y.destroy(),t.destroy()}},b=t(),x=({advanced:e})=>(0,b.jsx)(i,{advanced:e,controlsId:`texture-controls`,mountScene:y}),S=`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
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
`,C=`import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
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
render.render(scene, new Camera(width, height));`,w=()=>{let{language:t}=e(),r=n.translate(t,`example.textureTitle`);return(0,b.jsx)(a,{title:r,shortCode:C,fullCode:S,Preview:x})};export{w as default};