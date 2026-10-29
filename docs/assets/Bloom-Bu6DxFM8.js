import{n as e}from"./index-DpiUqL2G.js";import{O as t,R as n,c as r,f as i,t as a,x as o,z as s}from"./lil-gui.esm-Cd3UrPGu.js";import{n as c,r as l,t as u}from"./Runtime-De8IM9hC.js";import{n as d,t as f}from"./EffectGroups-DqgCXEb0.js";var p=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let color = sampleInput(uv);
    let luma = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
    var gain = 1.0;
    // threshold=0 允许黑色对象参与自定义颜色发光；其他阈值按实际亮度提取。
    if (value_threshold > 0.0) {
        gain = max(luma - value_threshold, 0.0) / max(luma, 0.000001);
    }
    let alpha = color.a * value_tint[3] * gain;
    return vec4f(vec3f(value_tint[0], value_tint[1], value_tint[2]) * alpha, alpha);
}
`,m=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let base = sampleInput(uv);
    let glow = textureSampleLevel(value_glow, valueSampler_glow, uv, 0, 0.0);
    let alpha = base.a + clamp(glow.a, 0.0, 1.0) * (1.0 - base.a);
    if (alpha > 0.0) {
        var rgb = (base.rgb * base.a + glow.rgb) / alpha;
        // HDR 仅放开 RGB；SDR 保持原有饱和显示，Alpha 始终表示覆盖率。
        if (value_hdr < 0.5) {
            rgb = clamp(rgb, vec3f(0.0), vec3f(1.0));
        }
        return vec4f(rgb, alpha);
    }
    return vec4f(0.0);
}
`,h=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let candidate = textureSampleLevel(value_glow, valueSampler_glow, uv, 0, 0.0) * value_strength;
    var previous = vec4f(0.0);
    // 第一组从零开始，之后读取上一份最强结果；附件始终保存预乘浮点数据。
    if (value_first < 0.5) {
        previous = sampleInput(uv);
    }
    let weights = vec3f(0.2126, 0.7152, 0.0722);
    let candidateBrightness = dot(candidate.rgb, weights);
    let previousBrightness = dot(previous.rgb, weights);
    // 亮度相等时保持已有结果，避免因分别取 RGB 最大值混出不存在的白色。
    if (candidateBrightness > previousBrightness) {
        return candidate;
    }
    return previous;
}
`,g=class extends l{type=`Bloom`;process(e,t,n){let r=t,i=null,a=e.render.hdrEnabled,o=t.format;a&&(o=`rgba16float`);for(let t of f.collect(n.scene,`bloom`)){let r=t.settings;if(r.intensity>0){let a=e.mask(t.key+`:mask`,n,t.selection,!0),o=t.key+`:extract`,s=e.step(o,p);s.raw.value={threshold:r.threshold,tint:new Float32Array(r.color)};let c=e.draw(o,a,!0,`rgba16float`),l=d.apply(e,t.key,c,r.radius*e.render.dpr),u=t.key+`:strongest`,f=e.step(u,h);f.raw.value={glow:l,strength:r.intensity*r.opacity,first:Number(i===null)},i=e.draw(u,i??l,!0,`rgba16float`)}}if(i!==null){let n=e.step(`composite`,m);n.raw.value={glow:i,hdr:Number(a)},r=e.draw(`composite`,t,!1,o)}return r}},_=`const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");
style.bloom.enabled = true;
style.bloom.color.setHex("#45baff");
style.bloom.radius = 24;
style.bloom.intensity = 1.2;
const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
mesh.rotation = 0.32;
scene.add(mesh);
const pass = new Bloom();
post.add("bloom", pass);`,v=`const gui = new GUI();
gui.add(pass, "enabled").name("Bloom enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
gui.add(style.bloom, "enabled").name("style.bloom.enabled");
gui.add(style.bloom, "radius", 0, 60, 1);
gui.add(style.bloom, "intensity", 0, 5, 0.1);
gui.add(style.bloom, "opacity", 0, 1, 0.05);
gui.add(style.bloom, "threshold", 0, 1, 0.01);
const colors = { color: "#45baff" };
/** @param value CSS hex color. @example setColor("#45baff"); @returns No value; update the effect color. */
const setColor = (value: string): void => {
    style.bloom.color.setHex(value);
};
gui.addColor(colors, "color").onChange(setColor);
gui.add(render, "hdr", { Auto: "auto", SDR: false, HDR: true });
const status = document.createElement("output");
status.style.cssText = "position:absolute;left:8px;bottom:8px;font:11px monospace;pointer-events:none;color:inherit";
container.append(status);`,y=c(`Bloom`,_,``,``,350),b=c(`Bloom`,_,v,`    status.textContent = "HDR available: " + String(render.hdrAvailable) + " / enabled: " + String(render.hdrEnabled);
`,350),x=e=>{let n=new u(e,350),{scene:s,post:c,render:l}=n,d=new t;d.solid.enabled=!0,d.solid.color.setHex(`#409dff`),d.bloom.enabled=!0,d.bloom.color.setHex(`#45baff`),d.bloom.radius=24,d.bloom.intensity=1.2;let f=new r(new o({width:180,height:120,style:d}),new i(d),d);f.rotation=.32,s.add(f);let p=new g;c.add(`bloom`,p);let m=null,h=null;return e.advanced&&e.guiContainer&&(m=new a({autoPlace:!1,container:e.guiContainer,title:`Bloom`,width:200}),m.add(p,`enabled`).name(`Bloom enabled`),m.add(f,`rotation`,-Math.PI,Math.PI,.01),m.add(d.bloom,`enabled`).name(`style.bloom.enabled`),m.add(d.bloom,`radius`,0,60,1),m.add(d.bloom,`intensity`,0,5,.1),m.add(d.bloom,`opacity`,0,1,.05),m.add(d.bloom,`threshold`,0,1,.01),m.addColor({color:`#45baff`},`color`).onChange(e=>{d.bloom.color.setHex(e)}),m.add(l,`hdr`,{Auto:`auto`,SDR:!1,HDR:!0}),h=document.createElement(`output`),h.style.cssText=`position:absolute;left:8px;bottom:8px;font:11px monospace;pointer-events:none;color:inherit`,e.container.append(h),m.onChange(n.invalidate)),n.update=()=>{h&&(h.textContent=`HDR available: `+String(l.hdrAvailable)+` / enabled: `+String(l.hdrEnabled))},n.start(),()=>{m?.destroy(),h?.remove(),n.destroy()}},S=e(),C=({advanced:e})=>(0,S.jsx)(n,{advanced:e,controlsId:`post-bloom-controls`,mountScene:x}),w=()=>(0,S.jsx)(s,{title:`Bloom`,shortCode:y,fullCode:b,Preview:C});export{w as default};