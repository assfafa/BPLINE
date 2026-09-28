import{i as e,n as t,r as n}from"./index-CuA_KabQ.js";import{c as r,d as i,f as a,i as o,l as s,n as c,o as l,r as u,s as d,t as f}from"./lil-gui.esm-BC1tc9Cf.js";import{t as p}from"./Poly-PgkD2eHm.js";var m=e=>{if(!(e instanceof Float32Array))throw TypeError(`Poly2D points must be a Float32Array.`);if(e.length%2!=0)throw RangeError(`Poly2D needs complete x/y pairs.`);for(let t of e)if(!Number.isFinite(t))throw RangeError(`Poly2D coordinates must be finite.`);return new Float32Array(e)},h=class extends d{type=`Poly2D`;_points;_closed;_width=0;_height=0;_perimeter=0;constructor(e=new Float32Array,t,n={}){let r=m(e);super(t??void 0),this._points=r,this._closed=n.closed??!0;try{this.updateGeometry()}catch(e){throw this.dispose(),e}}get points(){return this._points}set points(e){let t=m(e);this._points=t,this.updateVersion()}get closed(){return this._closed}set closed(e){if(this._closed!==e){if(!e&&this.style.solid.enabled)throw Error(`Disable solid before opening Poly2D.`);this._closed=e,this.updateVersion()}else return}get width(){return this.ensureGeometry(),this._width}get height(){return this.ensureGeometry(),this._height}get perimeter(){return this.ensureGeometry(),this._perimeter}updateGeometry(){let e=this.style.join,t=[];for(let n=0;n<this._points.length;n+=2){let r=e.seg;e.type===`bevel`&&(r=1),t.push({x:this._points[n],y:this._points[n+1],round:e.type!==`miter`,segments:r})}let n=new p(t,{closed:this._closed,solid:this.style.solid.enabled}),r;r=this.style.solid.enabled?n.data:void 0;let i;i=this.style.wireframe.enabled?n.createLineGeometry():void 0;let a=this.style.edge,o;o=a.enabled&&a.width>0?n.createBorderGeometry(a.width,a.uvRepeat,a.borderAlign):void 0;let s=this.style.points,c;c=s.enabled&&(s.vertices||s.midpoints)?n.createPointGeometry(s.radius,s.segments,s.vertices,s.midpoints,s.minPointsLength,s.minEdgePointsLength):void 0;let l=[];return r!==void 0&&l.push({data:r,vertexType:0}),o!==void 0&&l.push({data:o,vertexType:.5}),c!==void 0&&l.push({data:c,vertexType:1}),this.mergeGeometry(l),this.linePoints=i,this._width=n.width,this._height=n.height,this._perimeter=n.getPerimeter(),this.uniformData.set([n.width,n.height,0,a.width]),super.updateGeometry(),this}},g=(e,t,n)=>{let r=e/2,i=t/2;return new Float32Array([-r,-i,r,-i,r,i,0,i-n,-r,i])},_=e=>{let t=new u(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={width:210,height:150,notch:45,closed:!0,rotation:0,fill:`#5b8def`,edgeEnabled:!0,edgeWidth:7,edgeColor:`#92e6cc`,join:`round`,joinSegments:10,pointsEnabled:!0,pointsVertices:!0,pointsMidpoints:!0,pointsRadius:6,pointsMinLength:22,pointsMinEdgeLength:30,pointsColor:`#ffcb77`},i=new r;i.solid.enabled=!0,i.solid.color.setHex(n.fill),e.advanced&&(i.edge.enabled=!0,i.edge.width=n.edgeWidth,i.edge.color.setHex(n.edgeColor),i.join.type=n.join,i.join.seg=n.joinSegments,i.points.enabled=!0,i.points.vertices=n.pointsVertices,i.points.midpoints=n.pointsMidpoints,i.points.radius=n.pointsRadius,i.points.minPointsLength=n.pointsMinLength,i.points.minEdgePointsLength=n.pointsMinEdgeLength,i.points.color.setHex(n.pointsColor));let a=new h(g(n.width,n.height,n.notch)),d=new o,p=new l(a,d);p.style=i;let m=new c;m.add(p);let _=new s,v,y=0,b=!0,x=()=>{n.closed?(a.closed=!0,i.solid.enabled=!0):(i.solid.enabled=!1,a.closed=!1),a.points=g(n.width,n.height,n.notch),p.rotation=n.rotation*Math.PI/180,i.solid.color.setHex(n.fill),i.edge.enabled=n.edgeEnabled,i.edge.width=n.edgeWidth,i.edge.color.setHex(n.edgeColor),i.join.type=n.join,i.join.seg=n.joinSegments,i.points.enabled=n.pointsEnabled,i.points.vertices=n.pointsVertices,i.points.midpoints=n.pointsMidpoints,i.points.radius=n.pointsRadius,i.points.minPointsLength=n.pointsMinLength,i.points.minEdgePointsLength=n.pointsMinEdgeLength,i.points.color.setHex(n.pointsColor)};e.advanced&&e.guiContainer&&(v=new f({autoPlace:!1,container:e.guiContainer,title:`Polygon`,width:200}),v.add(n,`width`,100,300,1).onChange(x),v.add(n,`height`,80,220,1).onChange(x),v.add(n,`notch`,0,80,1).onChange(x),v.add(n,`closed`).onChange(x),v.add(n,`rotation`,-180,180,1).onChange(x),v.addColor(n,`fill`).onChange(x),v.add(n,`edgeEnabled`).onChange(x),v.add(n,`edgeWidth`,0,24,1).onChange(x),v.addColor(n,`edgeColor`).onChange(x),v.add(n,`join`,[`miter`,`round`,`bevel`]).onChange(x),v.add(n,`joinSegments`,1,24,1).onChange(x),v.add(n,`pointsEnabled`).onChange(x),v.add(n,`pointsVertices`).onChange(x),v.add(n,`pointsMidpoints`).onChange(x),v.add(n,`pointsRadius`,1,16,1).onChange(x),v.add(n,`pointsMinLength`,0,120,1).name(`vertex threshold`).onChange(x),v.add(n,`pointsMinEdgeLength`,0,120,1).name(`edge threshold`).onChange(x),v.addColor(n,`pointsColor`).onChange(x));let S=()=>{let n=e.container.getBoundingClientRect();t.resize(),_.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},C=new ResizeObserver(S),w=()=>{b&&(t.render(m,_),y=requestAnimationFrame(w))};return t.ready.then(()=>{b&&(S(),C.observe(e.container),y=requestAnimationFrame(w))},t=>{b&&e.onError(t)}),()=>{b=!1,cancelAnimationFrame(y),C.disconnect(),v&&v.destroy(),t.destroy()}},v=t(),y=({advanced:e})=>(0,v.jsx)(i,{advanced:e,controlsId:`polygon-controls`,mountScene:_}),b=`import { BaseMaterial, Camera, Mesh, Poly2D, Render, Scene, Style } from "bplinejs";
import type { JoinType } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface PolygonControls {
    width: number;
    height: number;
    notch: number;
    closed: boolean;
    rotation: number;
    fill: string;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
    join: JoinType;
    joinSegments: number;
    pointsEnabled: boolean;
    pointsVertices: boolean;
    pointsMidpoints: boolean;
    pointsRadius: number;
    pointsMinLength: number;
    pointsMinEdgeLength: number;
    pointsColor: string;
}

/**
 * Build a concave five-point outline from editable dimensions.
 * @param width Overall polygon width.
 * @param height Overall polygon height.
 * @param notch Depth of the upper inward corner.
 * @example
 * createPolygonPoints(210, 150, 45);
 * @returns Flat x/y coordinates for Poly2D.
 */
const createPolygonPoints = (width: number, height: number, notch: number): Float32Array => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return new Float32Array([
        -halfWidth, -halfHeight,
        halfWidth, -halfHeight,
        halfWidth, halfHeight,
        0, halfHeight - notch,
        -halfWidth, halfHeight,
    ]);
};

/**
 * Mount an editable Poly2D scene with edge, join, and point styling.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountPolygonScene(options);
 * @returns Cleanup for WebGPU, animation, resize observer, and GUI.
 */
export const mountPolygonScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: PolygonControls = {
        width: 210,
        height: 150,
        notch: 45,
        closed: true,
        rotation: 0,
        fill: "#5b8def",
        edgeEnabled: true,
        edgeWidth: 7,
        edgeColor: "#92e6cc",
        join: "round",
        joinSegments: 10,
        pointsEnabled: true,
        pointsVertices: true,
        pointsMidpoints: true,
        pointsRadius: 6,
        pointsMinLength: 22,
        pointsMinEdgeLength: 30,
        pointsColor: "#ffcb77",
    };
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(parameters.fill);

    // The advanced cell demonstrates extra public Style sections.
    if (options.advanced) {
        style.edge.enabled = true;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.join.type = parameters.join;
        style.join.seg = parameters.joinSegments;
        style.points.enabled = true;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    }

    const geometry = new Poly2D(createPolygonPoints(parameters.width, parameters.height, parameters.notch));
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
     * Apply GUI values through the public Poly2D, Mesh, and Style APIs.
     * @example
     * gui.add(parameters, "notch").onChange(updatePolygon);
     * @returns No value.
     */
    const updatePolygon = (): void => {
        // Disable fill before opening the path; Poly2D disallows solid open paths.
        if (parameters.closed) {
            geometry.closed = true;
            style.solid.enabled = true;
        } else {
            style.solid.enabled = false;
            geometry.closed = false;
        }
        geometry.points = createPolygonPoints(parameters.width, parameters.height, parameters.notch);
        mesh.rotation = parameters.rotation * Math.PI / 180;
        style.solid.color.setHex(parameters.fill);
        style.edge.enabled = parameters.edgeEnabled;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.join.type = parameters.join;
        style.join.seg = parameters.joinSegments;
        style.points.enabled = parameters.pointsEnabled;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    };

    // The GUI floats over the advanced preview and leaves the simple cell unchanged.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Polygon", width: 200 });
        gui.add(parameters, "width", 100, 300, 1).onChange(updatePolygon);
        gui.add(parameters, "height", 80, 220, 1).onChange(updatePolygon);
        gui.add(parameters, "notch", 0, 80, 1).onChange(updatePolygon);
        gui.add(parameters, "closed").onChange(updatePolygon);
        gui.add(parameters, "rotation", -180, 180, 1).onChange(updatePolygon);
        gui.addColor(parameters, "fill").onChange(updatePolygon);
        gui.add(parameters, "edgeEnabled").onChange(updatePolygon);
        gui.add(parameters, "edgeWidth", 0, 24, 1).onChange(updatePolygon);
        gui.addColor(parameters, "edgeColor").onChange(updatePolygon);
        gui.add(parameters, "join", ["miter", "round", "bevel"]).onChange(updatePolygon);
        gui.add(parameters, "joinSegments", 1, 24, 1).onChange(updatePolygon);
        gui.add(parameters, "pointsEnabled").onChange(updatePolygon);
        gui.add(parameters, "pointsVertices").onChange(updatePolygon);
        gui.add(parameters, "pointsMidpoints").onChange(updatePolygon);
        gui.add(parameters, "pointsRadius", 1, 16, 1).onChange(updatePolygon);
        gui.add(parameters, "pointsMinLength", 0, 120, 1).name("vertex threshold").onChange(updatePolygon);
        gui.add(parameters, "pointsMinEdgeLength", 0, 120, 1).name("edge threshold").onChange(updatePolygon);
        gui.addColor(parameters, "pointsColor").onChange(updatePolygon);
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
`,x=`import { BaseMaterial, Camera, Mesh, Poly2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5b8def");
const points = new Float32Array([
    -105, -75, 105, -75, 105, 75, 0, 30, -105, 75,
]);
const polygon = new Poly2D(points);
const material = new BaseMaterial();
const mesh = new Mesh(polygon, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`,S=()=>{let{language:t}=e(),r=n.translate(t,`example.polygonTitle`);return(0,v.jsx)(a,{title:r,shortCode:x,fullCode:b,Preview:y})};export{S as default};