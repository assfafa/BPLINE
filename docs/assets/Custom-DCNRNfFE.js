import{i as e,n as t,r as n}from"./index-J8u9icNN.js";import{t as r}from"./Vec2-NTeaCz1R.js";import{t as i}from"./Mat3-DaAa6MZ7.js";import{_ as a,a as o,c as s,d as c,g as l,h as u,i as d,l as f,m as p,n as m,o as h,p as g,r as _,s as v,t as y,u as b,v as x}from"./lil-gui.esm-m0qGYmge.js";import{t as S}from"./Rect2D-BpADIFQO.js";var C=class extends p{type=`Base2D`;_input;constructor(e){super(e.style),this._input=w(e),this.updateGeometry()}setData(e){this._input=w(e),e.style!==void 0&&e.style!==this.style&&(this.style=e.style),this.updateGeometry()}updateGeometry(){let e=this._input,t=e.vertices,n=t.length/2;if(this._geometry=t,this.normal=e.normal??new Float32Array(t.length),this.uv=e.uv??new Float32Array(t.length),this.position=e.position??new Float32Array(t.length),this.vertexType=e.vertexType??new Float32Array(n),this.miterScale=e.miterScale??new Float32Array(n).fill(1),e.index===void 0){let e;e=n>65536?new Uint32Array(n):new Uint16Array(n);for(let t=0;t<n;t+=1)e[t]=t;this.index=e}else this.index=e.index;let r=1/0,i=-1/0,a=1/0,o=-1/0;for(let e=0;e<t.length;e+=2)r=Math.min(r,t[e]),i=Math.max(i,t[e]),a=Math.min(a,t[e+1]),o=Math.max(o,t[e+1]);let s=0,c=0;return n>0&&(s=i-r,c=o-a),this.uniformData.set([s,c,0,this.style.edge.width]),super.updateGeometry(),this}},w=e=>{let t=e.vertices;if(!(t instanceof Float32Array)||t.length%2!=0)throw TypeError(`Base2D vertices must be complete Float32Array x/y pairs.`);let n=t.length/2;if(e.index===void 0&&n%3!=0)throw RangeError(`Base2D sequential vertices must form complete triangles.`);let r=[e.uv,e.normal,e.position];for(let e of r)if(e!==void 0&&(!(e instanceof Float32Array)||e.length!==t.length))throw RangeError(`Base2D vec2 attributes must match vertices length.`);if(e.vertexType!==void 0&&e.vertexType.length!==n)throw RangeError(`Base2D vertexType length must match vertex count.`);if(e.miterScale!==void 0&&e.miterScale.length!==n)throw RangeError(`Base2D miterScale length must match vertex count.`);let i=e.index;if(i!==void 0){if(!(i instanceof Uint16Array)&&!(i instanceof Uint32Array))throw TypeError(`Base2D index must be Uint16Array or Uint32Array.`);if(i.length%3!=0)throw RangeError(`Base2D indices must form complete triangles.`);for(let e of i)if(e>=n)throw RangeError(`Base2D index exceeds vertex count.`)}let a,o,s,c,l,u;return e.uv!==void 0&&(a=new Float32Array(e.uv)),e.normal!==void 0&&(o=new Float32Array(e.normal)),i instanceof Uint32Array&&(s=new Uint32Array(i)),i instanceof Uint16Array&&(s=new Uint16Array(i)),e.vertexType!==void 0&&(c=new Float32Array(e.vertexType)),e.position!==void 0&&(l=new Float32Array(e.position)),e.miterScale!==void 0&&(u=new Float32Array(e.miterScale)),{vertices:new Float32Array(t),uv:a,normal:o,index:s,vertexType:c,position:l,miterScale:u,style:e.style}},T=class{_record={};_proxy;_onChange;_version=0;_schemaKey=`[]`;constructor(e){this._onChange=e;let t=(e,t,n)=>typeof t==`string`&&(this.set(t,n),!0),n=(e,t)=>typeof t==`string`&&(this.delete(t),!0);this._proxy=new Proxy(this._record,{set:t,deleteProperty:n})}get value(){return this._proxy}set value(e){let t=this._schemaKey,n=this.textures,r=Object.entries(e);for(let[e,t]of r)this.validate(e,t);for(let e of Object.keys(this._record))Reflect.deleteProperty(this._record,e);for(let[e,t]of r)this._record[e]=t;this.commit(t,n)}get version(){return this._version}get schemaKey(){return this._schemaKey}get entries(){let e=0,t=[];for(let n of Object.keys(this._record).sort()){let r=this._record[n],i=this.getKind(r);t.push({name:n,value:r,kind:i,binding:e}),e+=i===`texture`?2:1}return t}get textures(){let e=[];for(let t of Object.values(this._record))t instanceof d&&e.push(t);return e}get declarations(){let e=[];for(let t of this.entries){let n=`value_`+t.name,r=String(t.binding);t.kind===`texture`?(e.push(`@group(2) @binding(${r}) var ${n}: texture_2d_array<f32>;`),e.push(`@group(2) @binding(${String(t.binding+1)}) var valueSampler_${t.name}: sampler;`)):t.kind===`array<f32>`?e.push(`@group(2) @binding(${r}) var<storage, read> ${n}: array<f32>;`):e.push(`@group(2) @binding(${r}) var<uniform> ${n}: ${t.kind};`)}return e.join(`
`)}set(e,t){if(this.validate(e,t),this._record[e]!==t){let n=this._schemaKey,r=this.textures;this._record[e]=t,this.commit(n,r)}}delete(e){if(Object.hasOwn(this._record,e)){let t=this._schemaKey,n=this.textures;Reflect.deleteProperty(this._record,e),this.commit(t,n)}}touch(e){if(Object.hasOwn(this._record,e))this._version++;else throw RangeError(`Unknown shader value: `+e)}getBufferData(e){if(typeof e.value==`number`)return new Float32Array([e.value]);if(e.value instanceof r)return new Float32Array([e.value.x,e.value.y]);if(e.value instanceof i)return e.value.GPUData;if(e.value instanceof Float32Array)return new Float32Array(e.value);throw TypeError(`Texture values do not have numeric GPUBuffer data.`)}getKind(e){return typeof e==`number`?`f32`:e instanceof r?`vec2f`:e instanceof i?`mat3x3f`:e instanceof Float32Array?`array<f32>`:`texture`}validate(e,t){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(e))throw TypeError(`Shader value names must be WGSL-safe identifiers.`);if(typeof t==`number`){if(!Number.isFinite(t))throw RangeError(`Shader numbers must be finite.`)}else if(t instanceof Float32Array&&t.length===0)throw RangeError(`Shader arrays must contain at least one float.`);if(!(t instanceof r)&&!(t instanceof i)&&!(t instanceof d)&&typeof t!=`number`&&!(t instanceof Float32Array))throw TypeError(`Shader values support number, Vec2, Mat3, Float32Array, and Texture.`)}commit(e,t){let n=e=>[e.name,e.kind];this._schemaKey=JSON.stringify(this.entries.map(n)),this._version++;let r=this.textures,i=t.length!==r.length||t.some((e,t)=>e!==r[t]);this._onChange(e!==this._schemaKey,i)}},E=class{_solidShader=``;_edgeShader=``;_pointShader=``;_values;_onShaderChange;constructor(e,t){this._values=e,this._onShaderChange=t}get solidShader(){return this._solidShader}set solidShader(e){this.setShader(`solid`,e)}get edgeShader(){return this._edgeShader}set edgeShader(e){this.setShader(`edge`,e)}get pointShader(){return this._pointShader}set pointShader(e){this.setShader(`point`,e)}get value(){return this._values.value}set value(e){this._values.value=e}touchValue(e){this._values.touch(e)}setShader(e,t){e===`solid`&&this._solidShader!==t&&(this._solidShader=t,this._onShaderChange()),e===`edge`&&this._edgeShader!==t&&(this._edgeShader=t,this._onShaderChange()),e===`point`&&this._pointShader!==t&&(this._pointShader=t,this._onShaderChange())}},D=class extends c{type=`CompositeMaterial`;raw;constructor(e){super(e);let t=(e,t)=>{e&&this.refreshShaders(),t&&!e&&this.updateVersion(`texture`)},n=()=>{this.refreshShaders()};this._values=new T(t),this.raw=new E(this._values,n),this.rectVertexShader=b,this.polyVertexShader=s,this.ngonVertexShader=h,this.refreshShaders()}refreshShaders(){let e=this._values?.declarations??``;this.rectFragmentShader=O(f,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader),this.polyFragmentShader=O(v,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader),this.ngonFragmentShader=O(o,e,this.raw.solidShader,this.raw.edgeShader,this.raw.pointShader)}},O=(e,t,n,r,i)=>{let a=e,o=[[`SolidShader`,n],[`EdgeShader`,r],[`PointShader`,i]];for(let[e,t]of o){let n=`fn ${e}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n    return vec4f(1.0);\n}`,r=`fn ${e}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n${t||`    return vec4f(1.0);`}\n}`;if(!a.includes(n))throw Error(`Composite shader template is missing `+e+`.`);a=a.replace(n,r)}return t+`
`+a},k=`@fragment fn main() -> @location(0) vec4f { return vec4f(1.0); }`,A=class{_vertexShader=``;_fragmentShader=``;_values;_onShaderChange;constructor(e,t){this._values=e,this._onShaderChange=t}get vertexShader(){return this._vertexShader}set vertexShader(e){this._vertexShader!==e&&(this._vertexShader=e,this._onShaderChange())}get fragmentShader(){return this._fragmentShader}set fragmentShader(e){this._fragmentShader!==e&&(this._fragmentShader=e,this._onShaderChange())}get value(){return this._values.value}set value(e){this._values.value=e}touchValue(e){this._values.touch(e)}},j=class extends c{type=`WGSLMaterial`;raw;constructor(e){super(e);let t=(e,t)=>{e&&this.updateVersion(`pipeline`),t&&!e&&this.updateVersion(`texture`)},n=()=>{let e=JSON.stringify([this.raw.vertexShader,this.raw.fragmentShader]);this.setCustomShaderKey(e)};this._values=new T(t),this.raw=new A(this._values,n),this.rectVertexShader=b,this.polyVertexShader=s,this.ngonVertexShader=h,this.setCustomShaderKey(JSON.stringify([``,``]))}getShaderSource(e){let t=super.getShaderSource(e),n=this._values?.declarations??``,r=t.vertex;this.raw.vertexShader!==``&&(r=n+`
`+this.raw.vertexShader);let i=k;return this.raw.fragmentShader!==``&&(i=this.raw.fragmentShader),{vertex:r,fragment:n+`
`+i}}},M=`
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;

struct VertexInput {
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
};
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@vertex fn main(input: VertexInput) -> VertexOutput {
    let local = vec3f(input.position + value_offset, 1.0);
    let clip = orthogonalMatrix * viewMatrix * modelMatrices[input.instanceIndex] * local;
    var output: VertexOutput;
    output.position = vec4f(clip.xy, 0.5, 1.0);
    output.uv = input.uv;
    return output;
}`,N=`
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let mapped = value_transform * vec3f(uv, 1.0);
    return vec4f(mapped.x * value_weights[0], mapped.y, value_blue, 1.0);
}`,P=(e,t,n)=>{let r=new Uint8ClampedArray([e,t,n,255,e,t,n,255,e,t,n,255,e,t,n,255]);return new d().setSource(new ImageData(r,2,2))},F=e=>{let t=new _(e.container,`production`);t.backgroundColor={r:.08,g:.11,b:.19,a:1};let n=new m,a=new l,o=new u;o.solid.enabled=!0;let s=new S({width:104,height:84,radius:11,style:o}),c=new D(o);c.raw.solidShader=`return vec4f(input.uv.x, 0.35, 0.9, 1.0);`;let d=new g(s,c,!1);n.add(d);let f;if(e.advanced){d.position.set(-72,0),o.edge.enabled=!0,o.edge.width=6,o.points.enabled=!0,o.points.radius=5;let t=P(255,80,95),a=P(70,115,255),s=P(250,200,65),l=new Float32Array([.88]);c.raw.value={first:t,second:a,blend:.55,tint:new r(1,1),transform:new i,weights:l},c.raw.solidShader=`
    let mapped = value_transform * vec3f(input.uv, 1.0);
    let first = textureSampleLevel(value_first, valueSampler_first, mapped.xy, 0, 0.0);
    let second = textureSampleLevel(value_second, valueSampler_second, mapped.xy, 0, 0.0);
    return mix(first, second, value_blend) * vec4f(value_tint, value_weights[0], 1.0);`,c.raw.edgeShader=`return vec4f(0.15, 0.95, 0.85, 1.0);`,c.raw.pointShader=`return vec4f(1.0, 0.78, 0.18, 1.0);`;let p=new u;p.solid.enabled=!0;let m=new Float32Array([0,0,1,0,.5,1]),h=new C({vertices:new Float32Array([-48,-42,48,-42,0,50]),uv:m,style:p}),_=new j(p);_.cullMode=`none`,_.raw.value={offset:new r(0,0),transform:new i,weights:new Float32Array([.92]),blue:.82},_.raw.vertexShader=M,_.raw.fragmentShader=N;let v=new g(h,_,!1);v.position.set(72,0),n.add(v);let b={blend:.55,blue:.82,alternate:!1,tipX:0},x=()=>{c.raw.value.blend=b.blend,_.raw.value.blue=b.blue,b.alternate?c.raw.value.second=s:c.raw.value.second=a,h.setData({vertices:new Float32Array([-48,-42,48,-42,b.tipX,50]),uv:m,style:p})};e.guiContainer&&(f=new y({autoPlace:!1,container:e.guiContainer,title:`Custom shaders`,width:200}),f.add(b,`blend`,0,1,.01).onChange(x),f.add(b,`blue`,0,1,.01).onChange(x),f.add(b,`alternate`).onChange(x),f.add(b,`tipX`,-40,40,1).onChange(x))}let p=0,h=!0,v=()=>{let n=e.container.getBoundingClientRect();t.resize(),a.setViewport(Math.max(1,n.width*t.dpr),Math.max(1,n.height*t.dpr))},b=new ResizeObserver(v),x=()=>{h&&(t.render(n,a),p=requestAnimationFrame(x))};return t.ready.then(()=>{h&&(v(),b.observe(e.container),p=requestAnimationFrame(x))},t=>{h&&e.onError(t)}),()=>{h=!1,cancelAnimationFrame(p),b.disconnect(),f&&f.destroy(),t.destroy()}},I=t(),L=({advanced:e})=>(0,I.jsx)(a,{advanced:e,controlsId:`custom-material-controls`,mountScene:F}),R=`import { Mat3, Vec2 } from "bpmatrixjs/Math";
import {
    Base2D,
    Camera,
    CompositeMaterial,
    Mesh,
    Rect2D,
    Render,
    Scene,
    Style,
    Texture,
    WGSLMaterial,
} from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

/** A full vertex stage follows the existing Mesh matrix binding contract. */
const triangleVertexShader = \`
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;

struct VertexInput {
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
};
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@vertex fn main(input: VertexInput) -> VertexOutput {
    let local = vec3f(input.position + value_offset, 1.0);
    let clip = orthogonalMatrix * viewMatrix * modelMatrices[input.instanceIndex] * local;
    var output: VertexOutput;
    output.position = vec4f(clip.xy, 0.5, 1.0);
    output.uv = input.uv;
    return output;
}\`;

/** The fragment stage reads a Mat3, Float32Array, and numeric value. */
const triangleFragmentShader = \`
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let mapped = value_transform * vec3f(uv, 1.0);
    return vec4f(mapped.x * value_weights[0], mapped.y, value_blue, 1.0);
}\`;

/**
 * Create a tiny in-memory texture for the named bindings.
 * @param red Red channel.
 * @param green Green channel.
 * @param blue Blue channel.
 * @example
 * const texture = createColorTexture(255, 70, 100);
 * @returns Loaded Texture with four pixels.
 */
const createColorTexture = (red: number, green: number, blue: number): Texture => {
    const pixels = new Uint8ClampedArray([
        red, green, blue, 255,
        red, green, blue, 255,
        red, green, blue, 255,
        red, green, blue, 255,
    ]);
    return new Texture().setSource(new ImageData(pixels, 2, 2));
};

/**
 * Mount a simple section shader or the full multi-texture and direct-vertex scene.
 * @param options Canvas, GUI host, preview mode, and error reporter.
 * @example
 * const dispose = mountCustomMaterialScene(options);
 * @returns Cleanup for the renderer, observer, frame, and GUI.
 */
export const mountCustomMaterialScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0.08, g: 0.11, b: 0.19, a: 1 };
    const scene = new Scene();
    const camera = new Camera();
    const style = new Style();
    style.solid.enabled = true;
    const geometry = new Rect2D({ width: 104, height: 84, radius: 11, style });
    const material = new CompositeMaterial(style);
    material.raw.solidShader = "return vec4f(input.uv.x, 0.35, 0.9, 1.0);";
    const mesh = new Mesh(geometry, material, false);
    scene.add(mesh);

    let gui: GUI | undefined;
    // The full preview adds all three shader sections, two textures, and a direct-vertex mesh.
    if (options.advanced) {
        mesh.position.set(-72, 0);
        style.edge.enabled = true;
        style.edge.width = 6;
        style.points.enabled = true;
        style.points.radius = 5;
        const first = createColorTexture(255, 80, 95);
        const second = createColorTexture(70, 115, 255);
        const alternate = createColorTexture(250, 200, 65);
        const weights = new Float32Array([0.88]);
        material.raw.value = {
            first,
            second,
            blend: 0.55,
            tint: new Vec2(1, 1),
            transform: new Mat3(),
            weights,
        };
        material.raw.solidShader = \`
    let mapped = value_transform * vec3f(input.uv, 1.0);
    let first = textureSampleLevel(value_first, valueSampler_first, mapped.xy, 0, 0.0);
    let second = textureSampleLevel(value_second, valueSampler_second, mapped.xy, 0, 0.0);
    return mix(first, second, value_blend) * vec4f(value_tint, value_weights[0], 1.0);\`;
        material.raw.edgeShader = "return vec4f(0.15, 0.95, 0.85, 1.0);";
        material.raw.pointShader = "return vec4f(1.0, 0.78, 0.18, 1.0);";

        const triangleStyle = new Style();
        triangleStyle.solid.enabled = true;
        const triangleUv = new Float32Array([0, 0, 1, 0, 0.5, 1]);
        const triangle = new Base2D({
            vertices: new Float32Array([-48, -42, 48, -42, 0, 50]),
            uv: triangleUv,
            style: triangleStyle,
        });
        const triangleMaterial = new WGSLMaterial(triangleStyle);
        triangleMaterial.cullMode = "none";
        triangleMaterial.raw.value = {
            offset: new Vec2(0, 0),
            transform: new Mat3(),
            weights: new Float32Array([0.92]),
            blue: 0.82,
        };
        triangleMaterial.raw.vertexShader = triangleVertexShader;
        triangleMaterial.raw.fragmentShader = triangleFragmentShader;
        const triangleMesh = new Mesh(triangle, triangleMaterial, false);
        triangleMesh.position.set(72, 0);
        scene.add(triangleMesh);

        const parameters = {
            blend: 0.55,
            blue: 0.82,
            alternate: false,
            tipX: 0,
        };
        /**
         * Update numeric values, one texture binding, and same-size vertex data.
         * @example
         * gui.add(parameters, "blend").onChange(updateValues);
         * @returns No value.
         */
        const updateValues = (): void => {
            material.raw.value.blend = parameters.blend;
            triangleMaterial.raw.value.blue = parameters.blue;
            // The same field and type keeps the CompositeMaterial Pipeline key stable.
            if (parameters.alternate) {
                material.raw.value.second = alternate;
            } else {
                material.raw.value.second = second;
            }
            triangle.setData({
                vertices: new Float32Array([-48, -42, 48, -42, parameters.tipX, 50]),
                uv: triangleUv,
                style: triangleStyle,
            });
        };
        // Advanced controls are hosted by the preview cell's floating GUI slot.
        if (options.guiContainer) {
            gui = new GUI({
                autoPlace: false,
                container: options.guiContainer,
                title: "Custom shaders",
                width: 200,
            });
            gui.add(parameters, "blend", 0, 1, 0.01).onChange(updateValues);
            gui.add(parameters, "blue", 0, 1, 0.01).onChange(updateValues);
            gui.add(parameters, "alternate").onChange(updateValues);
            gui.add(parameters, "tipX", -40, 40, 1).onChange(updateValues);
        }
    }

    let animationFrame = 0;
    let mounted = true;
    /**
     * Keep the camera matched to the physical canvas size.
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
     * Draw the current GPU state until the preview unmounts.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A removed route must not schedule work on a destroyed Render.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };
    /**
     * Start the scene after WebGPU initializes.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // StrictMode can dispose the first mount before the device resolves.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };
    /**
     * Show a device failure inside the preview.
     * @param error WebGPU initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // A late error is irrelevant after route cleanup.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release the scene, GUI, and browser callbacks.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // Only the advanced cell creates a GUI.
        if (gui) {
            gui.destroy();
        }
        render.destroy();
    };
    return dispose;
};
`,z=`import { Camera, CompositeMaterial, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
const geometry = new Rect2D({ width: 104, height: 84, radius: 11, style });
const material = new CompositeMaterial(style);
material.raw.solidShader = "return vec4f(input.uv.x, 0.35, 0.9, 1.0);";
const mesh = new Mesh(geometry, material, false);
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`,B=()=>{let{language:t}=e(),r=n.translate(t,`example.customMaterialTitle`);return(0,I.jsx)(x,{title:r,shortCode:z,fullCode:R,Preview:L})};export{B as default};