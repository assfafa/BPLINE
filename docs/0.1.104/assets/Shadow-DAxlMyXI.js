import{n as e}from"./index-BFfsRdpP.js";import{t}from"./Vec2-CPTFB0d0.js";import{O as n,R as r,c as i,f as a,t as o,x as s,z as c}from"./lil-gui.esm-toYGkY8E.js";import{n as l,r as u,t as d}from"./Runtime-9y0ZUxDl.js";import{n as f,t as p}from"./EffectGroups-C2Gisc4E.js";var m=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let base = sampleInput(uv);
    let coverage = textureSampleLevel(value_mask, valueSampler_mask, uv, 0, 0.0).a;
    let shifted = uv - value_offset;
    var shadow = 0.0;
    var innerCoverage = 0.0;
    if (all(shifted >= vec2f(0.0)) && all(shifted <= vec2f(1.0))) {
        shadow = textureSampleLevel(value_blurred, valueSampler_blurred, shifted, 0, 0.0).a;
        innerCoverage = textureSampleLevel(value_innerMask, valueSampler_innerMask, shifted, 0, 0.0).a;
    }
    let tint = vec3f(value_tint[0], value_tint[1], value_tint[2]);
    let opacity = value_opacity * value_tint[3];
    let outside = clamp(shadow * opacity * value_outer, 0.0, 1.0);
    let inside = clamp((1.0 - innerCoverage) * coverage * opacity * value_inner, 0.0, 1.0);
    let objects = textureSampleLevel(value_objects, valueSampler_objects, uv, 0, 0.0);
    let uncovered = 1.0 - objects.a;
    let backgroundAlpha = clamp((base.a - objects.a) / max(uncovered, 0.000001), 0.0, 1.0);
    let backgroundRGB = max(base.rgb * base.a - objects.rgb * objects.a, vec3f(0.0)) / max(uncovered, 0.000001);
    let visibleShadow = outside * uncovered;
    let alpha = base.a + visibleShadow * (1.0 - backgroundAlpha);
    // 内阴影仅改变已有颜色，外阴影在最终画面后方补充覆盖度。
    let baseRGB = mix(base.rgb, tint, inside);
    if (alpha > 0.0) {
        return vec4f((baseRGB * base.a + visibleShadow * (tint - backgroundRGB)) / alpha, alpha);
    }
    return vec4f(0.0);
}
`,h=class extends u{type=`Shadow`;process(e,n,r){let i=n,a=p.collect(r.scene,`shadow`),o=n;if(a.some(e=>e.settings.outer)){let t=new Map;for(let e of r.scene.drawList)t.set(e.id,null);o=e.mask(`sceneCoverage`,r,t)}for(let n of a){let a=n.settings;if(a.inner||a.outer){let s=e.mask(n.key+`:mask`,r,n.selection),c=f.apply(e,n.key,s,a.blur*e.render.dpr,a.spread*e.render.dpr),l=c;a.inner&&a.spread>0&&(l=f.apply(e,n.key+`:inner`,s,a.blur*e.render.dpr,-a.spread*e.render.dpr));let u=n.key+`:composite`,d=e.step(u,m);d.raw.value={mask:s,blurred:c,innerMask:l,objects:o,tint:new Float32Array(a.color),opacity:a.opacity,offset:new t(a.offsetX*e.render.dpr/r.width,a.offsetY*e.render.dpr/r.height),inner:Number(a.inner),outer:Number(a.outer)},i=e.draw(u,i)}}return i}},g=`const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");
style.shadow.enabled = true;
style.shadow.color.setHex("#000000");
style.shadow.opacity = 0.6;
style.shadow.blur = 18;
style.shadow.spread = 2;
style.shadow.offsetX = 12;
style.shadow.offsetY = -12;
style.shadow.inner = false;
style.shadow.outer = true;
const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
mesh.rotation = 0.32;
scene.add(mesh);
const pass = new Shadow();
post.add("shadow", pass);`,_=`const gui = new GUI();
gui.add(pass, "enabled").name("Shadow enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
gui.add(style.shadow, "enabled").name("style.shadow.enabled");
gui.add(style.shadow, "blur", 0, 50, 1);
gui.add(style.shadow, "spread", 0, 20, 1);
gui.add(style.shadow, "offsetX", -40, 40, 1);
gui.add(style.shadow, "offsetY", -40, 40, 1);
gui.add(style.shadow, "opacity", 0, 1, 0.05);
gui.add(style.shadow, "inner");
gui.add(style.shadow, "outer");
const colors = { color: "#000000" };
/** @param value CSS hex color. @example setColor("#45baff"); @returns No value; update the effect color. */
const setColor = (value: string): void => {
    style.shadow.color.setHex(value);
};
gui.addColor(colors, "color").onChange(setColor);`,v=l(`Shadow`,g,``,``,350),y=l(`Shadow`,g,_,``,350),b=e=>{let t=new d(e,350),{scene:r,post:c}=t,l=new n;l.solid.enabled=!0,l.solid.color.setHex(`#409dff`),l.shadow.enabled=!0,l.shadow.color.setHex(`#000000`),l.shadow.opacity=.6,l.shadow.blur=18,l.shadow.spread=2,l.shadow.offsetX=12,l.shadow.offsetY=-12,l.shadow.inner=!1,l.shadow.outer=!0;let u=new i(new s({width:180,height:120,style:l}),new a(l),l);u.rotation=.32,r.add(u);let f=new h;c.add(`shadow`,f);let p=null;return e.advanced&&e.guiContainer&&(p=new o({autoPlace:!1,container:e.guiContainer,title:`Shadow`,width:200}),p.add(f,`enabled`).name(`Shadow enabled`),p.add(u,`rotation`,-Math.PI,Math.PI,.01),p.add(l.shadow,`enabled`).name(`style.shadow.enabled`),p.add(l.shadow,`blur`,0,50,1),p.add(l.shadow,`spread`,0,20,1),p.add(l.shadow,`offsetX`,-40,40,1),p.add(l.shadow,`offsetY`,-40,40,1),p.add(l.shadow,`opacity`,0,1,.05),p.add(l.shadow,`inner`),p.add(l.shadow,`outer`),p.addColor({color:`#000000`},`color`).onChange(e=>{l.shadow.color.setHex(e)}),p.onChange(t.invalidate)),t.start(),()=>{p?.destroy(),t.destroy()}},x=e(),S=({advanced:e})=>(0,x.jsx)(r,{advanced:e,controlsId:`post-shadow-controls`,mountScene:b}),C=()=>(0,x.jsx)(c,{title:`Shadow`,shortCode:v,fullCode:y,Preview:S});export{C as default};