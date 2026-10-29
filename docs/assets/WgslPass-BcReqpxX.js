import{n as e}from"./index-DpiUqL2G.js";import{O as t,R as n,c as r,f as i,t as a,x as o,z as s}from"./lil-gui.esm-Cd3UrPGu.js";import{i as c,n as l,t as u}from"./Runtime-De8IM9hC.js";var d=`@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let radius = i32(value_radius);
    let sigma = max(value_radius / 3.0, 0.1);
    let pixel = texelSize() * value_pixelRatio;
    var color = vec4f(0.0);
    var totalWeight = 0.0;
    // Premultiply before filtering so transparent pixels do not darken the edge.
    for (var y = -radius; y <= radius; y++) {
        for (var x = -radius; x <= radius; x++) {
            let offset = vec2f(f32(x), f32(y));
            let weight = exp(-dot(offset, offset) / (2.0 * sigma * sigma));
            let sample = sampleInput(uv + offset * pixel);
            color += vec4f(sample.rgb * sample.a, sample.a) * weight;
            totalWeight += weight;
        }
    }
    if (color.a > 0.0) {
        return vec4f(color.rgb / color.a, color.a / totalWeight);
    } else {
        return vec4f(0.0);
    }
}`,f=`const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#ff8a34");

const mesh = new Mesh(new Rect2D({ width: 600, height: 600, style }), new BaseMaterial(style), style);
mesh.rotation = 0;
scene.add(mesh);
const pass = new WgslPass();
pass.raw.value = { radius: 20, pixelRatio: render.dpr };
pass.raw.fragmentShader = fragmentShader;
post.add("wgsl", pass);`.replace(`pass.raw.fragmentShader = fragmentShader;`,"pass.raw.fragmentShader = `"+d+"`;"),p=`const gui = new GUI();
gui.add(pass, "enabled").name("WgslPass enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
const settings = { radius: 20 };
/** @param value Gaussian radius in CSS pixels. @example setRadius(20); @returns No value; update the named shader uniform. */
const setRadius = (value: number): void => {
    pass.raw.value.radius = value;
};
gui.add(settings, "radius", 0, 24, 1).onChange(setRadius);
gui.add(pass, "resolutionScale", { Half: 0.5, Full: 1 });`,m=l(`WgslPass`,f,``,`    pass.raw.value.pixelRatio = render.dpr;
`,760),h=l(`WgslPass`,f,p,`    pass.raw.value.pixelRatio = render.dpr;
`,760),g=e=>{let n=new u(e,760),{scene:s,post:l,render:f}=n,p=new t;p.solid.enabled=!0,p.solid.color.setHex(`#ff8a34`);let m=new r(new o({width:600,height:600,style:p}),new i(p),p);m.rotation=0,s.add(m);let h=new c;h.raw.value={radius:20,pixelRatio:f.dpr},h.raw.fragmentShader=d,l.add(`wgsl`,h);let g=null;return e.advanced&&e.guiContainer&&(g=new a({autoPlace:!1,container:e.guiContainer,title:`WgslPass`,width:200}),g.add(h,`enabled`).name(`WgslPass enabled`),g.add(m,`rotation`,-Math.PI,Math.PI,.01),g.add({radius:20},`radius`,0,24,1).onChange(e=>{h.raw.value.radius=e}),g.add(h,`resolutionScale`,{Half:.5,Full:1}),g.onChange(n.invalidate)),n.update=()=>{h.raw.value.pixelRatio=f.dpr},n.start(),()=>{g?.destroy(),n.destroy()}},_=e(),v=({advanced:e})=>(0,_.jsx)(n,{advanced:e,controlsId:`post-wgsl-controls`,mountScene:g}),y=()=>(0,_.jsx)(s,{title:`WgslPass`,shortCode:m,fullCode:h,Preview:v});export{y as default};