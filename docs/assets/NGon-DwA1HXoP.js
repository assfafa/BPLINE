import{i as e,n as t,r as n}from"./index-CuA_KabQ.js";import{c as r,d as i,f as a,i as o,l as s,n as c,o as l,r as u,s as d,t as f}from"./lil-gui.esm-BC1tc9Cf.js";import{t as p}from"./Poly-PgkD2eHm.js";var m=e=>{if(!Number.isInteger(e.sides)||e.sides<2||e.sides>65536)throw RangeError(`NGon sides must be an integer in [2, 65536].`);if(!new Set([`bounding`,`polar`]).has(e.nvMode))throw TypeError(`Invalid NGon nvMode.`);if(typeof e.hole!=`boolean`||typeof e.solid!=`boolean`)throw TypeError(`NGon switches must be boolean.`);for(let t of[e.outer,e.inter])if(t<0||!Number.isFinite(Math.fround(t*2)))throw RangeError(`NGon radii must be finite, nonnegative Float32 sizes.`);if(!Number.isFinite(e.startAngle))throw RangeError(`NGon startAngle must be finite.`);return Object.freeze({...e,startAngle:e.startAngle%(Math.PI*2),inter:Math.min(e.inter,e.outer)})},h=(e,t)=>t===0?[]:Array.from({length:e.sides},(n,r)=>{let i=e.startAngle+r*Math.PI*2/e.sides;return{x:Math.cos(i)*t,y:Math.sin(i)*t}}),g=e=>{if(e.length===0)return{width:0,height:0,minX:0,minY:0};{let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let a of e)t=Math.min(t,a.x),n=Math.min(n,a.y),r=Math.max(r,a.x),i=Math.max(i,a.y);return{minX:t,minY:n,width:r-t,height:i-n}}},_=e=>({...e,closed:!0,geometry:new Float32Array,normal:new Float32Array,uv:new Float32Array,index:new Uint16Array}),v=(e,t,n)=>{let r;if(r=e.hole?e.inter:0,e.solid&&e.sides!==2&&e.outer!==0&&r!==e.outer){let i=[],a=[],o=[],s=[],c=(t,r,s,c)=>{let l=i.length/2,u=Math.hypot(t.x,t.y);i.push(t.x,t.y);let d=0,f=0;return u!==0&&(d=c*t.x/u,f=c*t.y/u),a.push(d,f),e.nvMode===`polar`?o.push(r,s):o.push((t.x-n.minX)/n.width,(t.y-n.minY)/n.height),l};for(let n=0;n<=e.sides;n++){let i=t[n%e.sides],a=n/e.sides;r>0&&c({x:i.x*r/e.outer,y:i.y*r/e.outer},a,0,-1),c(i,a,1,1)}let l;l=r===0&&e.nvMode===`bounding`?c({x:0,y:0},.5,0,0):-1;for(let t=0;t<e.sides;t++)if(r>0){let e=t*2;s.push(e,e+3,e+1,e,e+2,e+3)}else{let n;n=l>=0?l:c({x:0,y:0},(t+.5)/e.sides,0,0),s.push(n,t+1,t)}let u;return u=i.length/2>65536?new Uint32Array(s):new Uint16Array(s),{...n,closed:!0,geometry:new Float32Array(i),normal:new Float32Array(a),uv:new Float32Array(o),index:u}}return _(n)},y=(e,t)=>{let n=e.reduce((e,t)=>e+t.geometry.length/2,0),r=e.reduce((e,t)=>e+t.index.length,0),i;i=n>65536?new Uint32Array(r):new Uint16Array(r);let a={..._(t),geometry:new Float32Array(n*2),normal:new Float32Array(n*2),uv:new Float32Array(n*2),index:i,miterScale:new Float32Array(n).fill(1),position:new Float32Array(n*2)},o=0,s=0;for(let t of e){a.geometry.set(t.geometry,o*2),a.normal.set(t.normal,o*2),a.uv.set(t.uv,o*2),t.miterScale!==void 0&&a.miterScale.set(t.miterScale,o),t.position!==void 0&&a.position.set(t.position,o*2);for(let e of t.index)a.index[s++]=e+o;o+=t.geometry.length/2}return a},b=class{_settings;_nodes;_data;_borderData;_lineData;_pointData;constructor(e={}){this._settings=m({sides:e.sides??32,hole:e.hole??!1,nvMode:e.nvMode??`bounding`,outer:e.outer??1,inter:e.inter??.5,startAngle:e.startAngle??0,solid:e.solid??!0}),this._nodes=h(this._settings,this._settings.outer),this._data=v(this._settings,this._nodes,g(this._nodes))}get sides(){return this._settings.sides}set sides(e){this.set({sides:e})}get hole(){return this._settings.hole}set hole(e){this.set({hole:e})}get nvMode(){return this._settings.nvMode}set nvMode(e){this.set({nvMode:e})}get outer(){return this._settings.outer}set outer(e){this.set({outer:e})}get inter(){return this._settings.inter}set inter(e){this.set({inter:e})}get startAngle(){return this._settings.startAngle}set startAngle(e){this.set({startAngle:e})}get solid(){return this._settings.solid}set solid(e){this.set({solid:e})}get width(){return this._data.width}get height(){return this._data.height}get data(){return this._data}get borderData(){return this._borderData}get lineData(){return this._lineData}get pointData(){return this._pointData}set(e){let t=m({...this._settings,...e}),n=h(t,t.outer),r=v(t,n,g(n));return this._settings=t,this._nodes=n,this._data=r,this._borderData=void 0,this._lineData=void 0,this._pointData=void 0,this}getPerimeter(){let e=this.outer;return this.hole&&this.inter>0&&this.inter<this.outer&&(e+=this.inter),this.sides===2?e*2:2*this.sides*e*Math.sin(Math.PI/this.sides)}contours(){if(this.outer===0)return[];{let e=[{poly:new p(this._nodes,{closed:this.sides>2,solid:!1}),inner:!1}];return this.hole&&this.inter>0&&this.inter<this.outer&&e.push({poly:new p(h(this._settings,this.inter),{closed:this.sides>2,solid:!1}),inner:!0}),e}}createBorderGeometry(e,t=1,n=`normal`){new p([],{solid:!1}).createBorderGeometry(e,t,n);let r;r=this.outer>0?[this.outer]:[],this.hole&&this.inter>0&&this.inter<this.outer&&r.push(this.inter);let i;i=r.length>0?new p(h(this._settings,10),{closed:this.sides>2,solid:!1}).createBorderGeometry(e,t,n):void 0;let a=r.map((e,t)=>{if(i===void 0)throw Error(`Missing NGon border template.`);let n=t=>t*e/10,r={...i,geometry:i.geometry.map(n),normal:i.normal.slice(),index:i.index.slice()};if(t>0){for(let e=0;e<r.normal.length;e++)r.normal[e]*=-1;for(let e=0;e<r.index.length;e+=3)[r.index[e+1],r.index[e+2]]=[r.index[e+2],r.index[e+1]]}return r});return this._borderData={...y(a,this._data),lineWidth:e,uvRepeat:t,align:n},this._borderData}createLineGeometry(e=1){new p([],{solid:!1}).createLineGeometry(e);let t=this.contours().map(t=>{let{poly:n,inner:r}=t,i=n.createLineGeometry(e);if(r)for(let e=0;e<i.normal.length;e++)i.normal[e]*=-1;return i});return this._lineData={...y(t,this._data),uvRepeat:e},this._lineData}createPointGeometry(e=2,t=4,n=!0,r=!1,i=0,a=0){new p([],{solid:!1}).createPointGeometry(e,t,n,r,i,a);let o=this.contours().map(o=>o.poly.createPointGeometry(e,t,n,r,i,a)),s=(e,t)=>e+t.pointCount;return this._pointData={...y(o,this._data),pointRadius:e,sides:t,pointCount:o.reduce(s,0)},this._pointData}},x=e=>{if(e<0||!Number.isFinite(Math.fround(e*2)))throw RangeError(`NGon2D radii must be finite, nonnegative Float32 sizes.`);return e},S=class extends d{type=`NGon2D`;_outer;_inner;_sides;_uvMode;_startAngle;_width=0;_height=0;_perimeter=0;constructor(e={}){let t=new b({outer:e.outer??1,inter:e.inner??0,sides:e.sides??32,nvMode:e.uvMode??`bounding`,startAngle:e.startAngle??0,solid:!1});super(e.style??void 0),this._outer=t.outer,this._inner=t.inter,this._sides=t.sides,this._uvMode=t.nvMode,this._startAngle=t.startAngle;try{this.updateGeometry()}catch(e){throw this.dispose(),e}}get outer(){return this._outer}set outer(e){if(x(e),this._outer!==e)this._outer=e,this._inner=Math.min(this._inner,e),this.updateVersion();else return}get inner(){return this._inner}set inner(e){if(e=Math.min(x(e),this._outer),this._inner!==e)this._inner=e,this.updateVersion();else return}get sides(){return this._sides}set sides(e){if(!Number.isInteger(e)||e<2||e>65536)throw RangeError(`NGon2D sides must be an integer in [2, 65536].`);if(this._sides!==e)this._sides=e,this.updateVersion();else return}get uvMode(){return this._uvMode}set uvMode(e){if(![`bounding`,`polar`].includes(e))throw TypeError(`Invalid NGon2D uvMode.`);if(this._uvMode!==e)this._uvMode=e,this.updateVersion();else return}get startAngle(){return this._startAngle}set startAngle(e){if(!Number.isFinite(e))throw RangeError(`NGon2D startAngle must be finite.`);if(e%=Math.PI*2,this._startAngle!==e)this._startAngle=e,this.updateVersion();else return}get width(){return this.ensureGeometry(),this._width}get height(){return this.ensureGeometry(),this._height}get perimeter(){return this.ensureGeometry(),this._perimeter}updateGeometry(){let e=new b({outer:this._outer,inter:this._inner,hole:this._inner>0,sides:this._sides,nvMode:this._uvMode,startAngle:this._startAngle,solid:this.style.solid.enabled}),t=[];this.style.solid.enabled&&t.push({data:e.data,vertexType:0});let n=this.style.edge;n.enabled&&n.width>0&&t.push({data:e.createBorderGeometry(n.width,n.uvRepeat,n.borderAlign),vertexType:.5});let r=this.style.points;r.enabled&&(r.vertices||r.midpoints)&&t.push({data:e.createPointGeometry(r.radius,r.segments,r.vertices,r.midpoints,r.minPointsLength,r.minEdgePointsLength),vertexType:1});let i;return i=this.style.wireframe.enabled?e.createLineGeometry():void 0,this.mergeGeometry(t),this.linePoints=i,this._width=e.width,this._height=e.height,this._perimeter=e.getPerimeter(),this.uniformData.set([this._outer,this._inner,this._sides,n.width]),super.updateGeometry(),this}},C=e=>{let t=new u(e.container,`production`);t.backgroundColor={r:0,g:0,b:0,a:0};let n={outer:85,inner:0,sides:7,startAngle:90,uvMode:`bounding`,rotation:0,fill:`#9c7cf0`,edgeEnabled:!0,edgeWidth:6,edgeColor:`#8bd5ff`,pointsEnabled:!0,pointsVertices:!0,pointsMidpoints:!1,pointsRadius:6,pointsMinLength:28,pointsMinEdgeLength:28,pointsColor:`#ffca79`};e.advanced&&(n.inner=32);let i=new r;i.solid.enabled=!0,i.solid.color.setHex(n.fill),e.advanced&&(i.edge.enabled=!0,i.edge.width=n.edgeWidth,i.edge.color.setHex(n.edgeColor),i.points.enabled=!0,i.points.vertices=n.pointsVertices,i.points.midpoints=n.pointsMidpoints,i.points.radius=n.pointsRadius,i.points.minPointsLength=n.pointsMinLength,i.points.minEdgePointsLength=n.pointsMinEdgeLength,i.points.color.setHex(n.pointsColor));let a=new S({outer:n.outer,inner:n.inner,sides:n.sides,uvMode:n.uvMode,startAngle:n.startAngle*Math.PI/180}),d=new o,p=new l(a,d);p.style=i;let m=new c;m.add(p);let h=new s,g,_=0,v=!0,y=()=>{a.outer=n.outer,a.inner=n.inner,a.sides=n.sides,a.startAngle=n.startAngle*Math.PI/180,a.uvMode=n.uvMode,p.rotation=n.rotation*Math.PI/180,i.solid.color.setHex(n.fill),i.edge.enabled=n.edgeEnabled,i.edge.width=n.edgeWidth,i.edge.color.setHex(n.edgeColor),i.points.enabled=n.pointsEnabled,i.points.vertices=n.pointsVertices,i.points.midpoints=n.pointsMidpoints,i.points.radius=n.pointsRadius,i.points.minPointsLength=n.pointsMinLength,i.points.minEdgePointsLength=n.pointsMinEdgeLength,i.points.color.setHex(n.pointsColor)};e.advanced&&e.guiContainer&&(g=new f({autoPlace:!1,container:e.guiContainer,title:`Regular polygon`,width:200}),g.add(n,`outer`,30,130,1).onChange(y),g.add(n,`inner`,0,100,1).onChange(y),g.add(n,`sides`,3,32,1).onChange(y),g.add(n,`startAngle`,-180,180,1).onChange(y),g.add(n,`uvMode`,[`bounding`,`polar`]).onChange(y),g.add(n,`rotation`,-180,180,1).onChange(y),g.addColor(n,`fill`).onChange(y),g.add(n,`edgeEnabled`).onChange(y),g.add(n,`edgeWidth`,0,24,1).onChange(y),g.addColor(n,`edgeColor`).onChange(y),g.add(n,`pointsEnabled`).onChange(y),g.add(n,`pointsVertices`).onChange(y),g.add(n,`pointsMidpoints`).onChange(y),g.add(n,`pointsRadius`,1,16,1).onChange(y),g.add(n,`pointsMinLength`,0,120,1).name(`vertex threshold`).onChange(y),g.add(n,`pointsMinEdgeLength`,0,120,1).name(`edge threshold`).onChange(y),g.addColor(n,`pointsColor`).onChange(y));let b=()=>{let n=e.container.getBoundingClientRect();t.resize(),h.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},x=new ResizeObserver(b),C=()=>{v&&(t.render(m,h),_=requestAnimationFrame(C))};return t.ready.then(()=>{v&&(b(),x.observe(e.container),_=requestAnimationFrame(C))},t=>{v&&e.onError(t)}),()=>{v=!1,cancelAnimationFrame(_),x.disconnect(),g&&g.destroy(),t.destroy()}},w=t(),T=({advanced:e})=>(0,w.jsx)(i,{advanced:e,controlsId:`ngon-controls`,mountScene:C}),E=`import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";
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
`,D=`import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";

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
render.render(scene, camera);`,O=()=>{let{language:t}=e(),r=n.translate(t,`example.ngonTitle`);return(0,w.jsx)(a,{title:r,shortCode:D,fullCode:E,Preview:T})};export{O as default};