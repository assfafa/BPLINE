import{t as e}from"./Vec2-CPTFB0d0.js";import{A as t,E as n,L as r,O as i,_ as a,a as o,c as s,g as c,n as l,v as u}from"./lil-gui.esm-toYGkY8E.js";var d=class{id=r();type=`WgslPass`;enabled=!0;raw=new f;_resolutionScale=1;constructor(e=``){this.raw.fragmentShader=e}get resolutionScale(){return this._resolutionScale}set resolutionScale(e){if(Number.isFinite(e)&&e>0)this._resolutionScale=e;else throw RangeError(`WgslPass resolutionScale must be positive and finite.`)}},f=class{fragmentShader=``;values=new a(p);get value(){return this.values.value}set value(e){this.values.value=e}touchValue(e){this.values.touch(e)}},p=(e,t)=>{},m=class{id=r();type=`PresetPass`;enabled=!0;process(e,t,n){return t}},h=`struct PostVertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

// 单个三角形覆盖全屏，忽略相机位置、旋转和缩放。
@vertex fn main(@location(0) position: vec2f) -> PostVertexOutput {
    var output: PostVertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.uv = position * 0.5 + 0.5;
    return output;
}
`,g=`@group(1) @binding(1) var postInput: texture_2d_array<f32>;
@group(1) @binding(2) var postSampler: sampler;

// UV 与普通材质一致，原点在左下；输入和返回值均为非预乘 RGBA。
fn sampleInput(uv: vec2f) -> vec4f {
    return textureSampleLevel(postInput, postSampler, uv, 0, 0.0);
}

fn inputResolution() -> vec2f {
    return vec2f(textureDimensions(postInput));
}

fn resolution() -> vec2f {
    return value_postResolution;
}

fn texelSize() -> vec2f {
    return vec2f(1.0) / inputResolution();
}
`,_=class{scene=new o;camera=new t(1,1);_style=new i;_resolution=new e(1,1);_material=new c(this._style);_geometry;_mesh;_valuesVersion=-1;_fragment=null;constructor(){this._style.solid.enabled=!0,this._style.solid.addressModeU=`clamp-to-edge`,this._style.solid.addressModeV=`clamp-to-edge`,this._material.cullMode=`none`,this._material.raw.vertexShader=h,this._geometry=new n({vertices:new Float32Array([-1,-1,3,-1,-1,3]),style:this._style}),this._mesh=new s(this._geometry,this._material,this._style),this._mesh.culling=!1,this._mesh.noSelect=!0,this.scene.add(this._mesh)}prepare(e,t,n,r,i=!1){this.camera.setViewport(n,r),this._resolution.set(n,r),this._style.solid.texture=t;let a=v;if(e!==null){let t=e.raw.values;if(Object.hasOwn(t.value,`postResolution`))throw TypeError(`WgslPass value name postResolution is reserved.`);this._valuesVersion!==t.version&&(this._material.raw.value={...t.value,postResolution:this._resolution},this._valuesVersion=t.version),e.raw.fragmentShader!==``&&(a=e.raw.fragmentShader)}else this._material.raw.value.postResolution=this._resolution,i&&(a=y);a!==this._fragment&&(this._fragment=a,this._material.raw.fragmentShader=g+`
`+a)}destroy(e){this.scene.removeChild(this._mesh),this._style.solid.texture=void 0,this._material.raw.value={},e.destroyMesh(this._mesh.id),e.destroyGeometry(this._geometry.id),e.destroyMaterial(this._material.id),e.trim(this.scene),this._mesh.dispose(),this._geometry.dispose(),this._material.dispose(),this.camera.dispose()}},v=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f { return sampleInput(uv); }`,y=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let color = sampleInput(uv);
    return vec4f(color.rgb * color.a, color.a);
}`,b=class{render;_targets=new Map;_steps=new Map;_used=new Set;_textures=new Set;_protected=new Set;_retired=new Set;constructor(e){this.render=e}begin(e=new Set){this._protected=e,this._used.clear()}step(e,t){let n=this._steps.get(e);return n===void 0&&(n={pass:new d(t),resources:new _},this._steps.set(e,n)),this._used.add(e),n.pass}draw(e,t,n=!1,r=t.format){let i=this._steps.get(e);if(i===void 0)throw Error(`Create the preset shader step before drawing it.`);{let a=this.target(e,t.width,t.height,r,n);if(a===t||i.pass.raw.values.textures.includes(a))throw Error(`Preset pass cannot read and write the same target.`);return i.resources.prepare(i.pass,t,t.width,t.height),a.scene=i.resources.scene,this.render.renderPass(a),a}}mask(e,t,n,r=!1){let i=this.target(e,t.width,t.height,t.format,!1);return i.scene=t.scene,i.camera=t.camera,this.render.renderMask(i,n,r),i}ownTexture(e){this._textures.add(e)}end(){for(let[e,t]of this._targets)this._used.has(e)===!1&&(this._retired.add(t),this._targets.delete(e));for(let[e,t]of this._steps)this._used.has(e)===!1&&(t.resources.destroy(this.render),this._steps.delete(e));for(let e of this._retired)this._protected.has(e)===!1&&(e.destroy(),this._retired.delete(e))}destroy(){this.begin(),this.end();for(let e of this._textures)this.render.destroyTexture(e);this._textures.clear()}target(e,n,r,i,a){let s=this._targets.get(e);return s!==void 0&&this._protected.has(s)&&(this._retired.add(s),this._targets.delete(e),s=void 0),s===void 0&&(s=new u(new o,new t(n,r),{format:i,data:a}),this._targets.set(e,s)),(s.width!==n||s.height!==r)&&(s.camera=new t(n,r)),s.format=i,this._used.add(e),s}},x=class{type=`PostProcess`;enabled=!0;_render;_passes=new Map;_resources=new Map;_presets=new Map;_pool=[];_present=null;_output=null;_destroyed=!1;constructor(e){this._render=e}get output(){return this._output}get passes(){return Array.from(this._passes.entries())}add(e,t){return this.assertAlive(),this._passes.get(e)!==t&&(this._resources.get(e)?.destroy(this._render),this._resources.delete(e),this._presets.get(e)?.destroy(),this._presets.delete(e),this._passes.set(e,t)),this}get(e){return this._passes.get(e)}move(e,t){this.assertAlive();let n=this._passes.get(e);if(n!==void 0&&Number.isInteger(t)&&t>=0&&t<this._passes.size){this._passes.delete(e);let r=Array.from(this._passes.entries());r.splice(t,0,[e,n]),this._passes.clear();for(let[e,t]of r)this._passes.set(e,t);return this}throw RangeError(`Unknown postprocess pass or invalid index.`)}delete(e){return this.assertAlive(),this._resources.get(e)?.destroy(this._render),this._resources.delete(e),this._presets.get(e)?.destroy(),this._presets.delete(e),this._passes.delete(e)}process(e){if(this.assertAlive(),this._render.pipeline.device===void 0)throw Error(`Await render.ready before processing a RenderTarget.`);e.syncViewport();let t=new Set([e]),n=new Set,r=e;if(this.enabled){for(let e of this._passes.values())if(e.enabled&&e instanceof d)for(let n of e.raw.values.textures)n instanceof u&&t.add(n);for(let[i,a]of this._passes)if(a.enabled&&a instanceof m){let n=this._presets.get(i);n===void 0&&(n=new b(this._render),this._presets.set(i,n)),n.begin(t);try{r=a.process(n,r,e)}finally{n.end()}}else if(a.enabled&&a instanceof d){let o=Math.max(1,Math.ceil(e.width*a.resolutionScale)),s=Math.max(1,Math.ceil(e.height*a.resolutionScale)),c=this._resources.get(i);c===void 0&&(c=new _,this._resources.set(i,c)),c.prepare(a,r,o,s);let l=r.format;this._render.hdrEnabled&&(l=`rgba16float`);let u=this.acquire(r,t,n,o,s,l);u.scene=c.scene,this._render.renderPass(u),n.add(u),r=u}}for(let[e,n]of this._presets)(this.enabled===!1||this._passes.get(e)?.enabled===!1)&&(n.begin(t),n.end());return this._output=r,this.trimPool(n,t),r}render(e){let t=this.process(e);this._present??=new _;let n=this._render;this._present.prepare(null,t,n.canvas.width,n.canvas.height,n.alphaMode===`premultiplied`),n.render(this._present.scene,this._present.camera)}clear(){this.assertAlive();for(let e of this._resources.values())e.destroy(this._render);this._resources.clear();for(let e of this._presets.values())e.destroy();this._presets.clear(),this._passes.clear(),this._present?.destroy(this._render),this._present=null;for(let e of this._pool)e.destroy();this._pool=[],this._output=null}destroy(){this._destroyed===!1&&(this.clear(),this._destroyed=!0)}acquire(e,n,r,i,a,s){let c,l;for(let t of this._pool)if(t.destroyed===!1&&t!==e&&n.has(t)===!1){if(t.width===i&&t.height===a&&t.format===s){c=t;break}r.has(t)===!1&&(l=t)}let d=c??l;return d===void 0?(d=new u(new o,new t(i,a),{format:s}),this._pool.push(d)):(d.camera.setViewport(i,a),d.format=s),d}trimPool(e,t){let n=[];for(let r of this._pool)e.has(r)||t.has(r)?n.push(r):r.destroy();this._pool=n}assertAlive(){if(this._destroyed)throw Error(`PostProcess has been destroyed.`)}},S=(e,t,n=``,r=``,i=350)=>{let a=`import { BaseMaterial, Camera, Mesh, PostProcess, Rect2D, Render, RenderTarget, Scene, Style, ${e} } from "bplinejs";\n`;return n.length>0&&(a+=`import GUI from "lil-gui";
`),a+`
const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#f1f5f9)";
document.body.append(container);
const render = new Render(container);
await render.ready;
const scene = new Scene();
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
const target = new RenderTarget(scene, camera);
const post = new PostProcess(render);

${t.trim()}
${n}
// ResizeObserver also handles a containing panel changing size.
const observer = new ResizeObserver(() => {
    render.resize();
});
observer.observe(container);

const draw = (): void => {
    camera.setViewport(render.canvas.width, render.canvas.height);
    camera.zoom = Math.min(render.dpr, render.canvas.width / ${String(i)}, render.canvas.height / ${String(i)});
${r}    render.renderPass(target);
    post.render(target);
    requestAnimationFrame(draw);
};
draw();`},C=class{scene=new o;camera=new t;render;target;post;update=w;_options;_extent;_mounted=!0;_dirty=!0;_frame=0;_width=0;_height=0;_observer=null;constructor(e,t=350){this._options=e,this._extent=t,this.render=new l(e.container,`production`),this.camera.setViewport(1,1),this.target=new u(this.scene,this.camera),this.post=new x(this.render)}async start(){try{await this.render.ready,this._mounted&&(this.render.onHDR(`preview`,this.invalidate),this._observer=new ResizeObserver(this.resize),this._observer.observe(this._options.container),this.resize(),this._frame=requestAnimationFrame(this.draw))}catch(e){this._mounted&&this._options.onError(e)}}invalidate=()=>{this._dirty=!0};resize=()=>{this.render.resize(),this.invalidate()};draw=()=>{if(this._mounted)try{let e=this.render.canvas.width,t=this.render.canvas.height;(e!==this._width||t!==this._height)&&(this._width=e,this._height=t,this.camera.setViewport(e,t),this.camera.zoom=Math.min(this.render.dpr,e/this._extent,t/this._extent),this._dirty=!0),this._dirty&&(this._dirty=!1,this.update(),this.render.renderPass(this.target),this.post.render(this.target)),this._frame=requestAnimationFrame(this.draw)}catch(e){this._options.onError(e)}};destroy(){this._mounted=!1,cancelAnimationFrame(this._frame),this._observer?.disconnect(),this.render.deleteHDR(`preview`),this.post.destroy(),this.target.destroy(),this.render.destroy()}},w=()=>{};export{d as i,S as n,m as r,C as t};