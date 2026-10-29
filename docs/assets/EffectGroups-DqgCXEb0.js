import{t as e}from"./Vec2-CPTFB0d0.js";import{o as t,s as n}from"./lil-gui.esm-Cd3UrPGu.js";var r=`fn maskSample(uv: vec2f) -> vec4f {
    // 视口之外是透明区域，不能用边界颜色无限延伸。
    if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { return vec4f(0.0); }
    return sampleInput(uv);
}
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let count = min(32, i32(ceil(value_radius)));
    let spacing = value_radius / f32(max(count, 1));
    let sigma = max(value_radius / 3.0, 0.25);
    var result = vec4f(0.0);
    // 负扩散使用最小值收缩遮罩，让内阴影向轮廓内部扩张。
    if (value_maximum < -0.5) { result = vec4f(1.0); }
    var weightSum = 0.0;
    // 大半径保持固定采样上限，不随 zoom 或用户参数产生无界循环。
    for (var i = -count; i <= count; i++) {
        let distance = f32(i) * spacing;
        let color = maskSample(uv + value_direction * texelSize() * distance);
        if (value_maximum > 0.5) {
            result = max(result, color);
        } else if (value_maximum < -0.5) {
            result = min(result, color);
        } else {
            let weight = exp(-distance * distance / (2.0 * sigma * sigma));
            result += color * weight;
            weightSum += weight;
        }
    }
    if (abs(value_maximum) > 0.5) { return result; }
    return result / max(weightSum, 0.000001);
}
`,i=class{static apply(t,n,i,a,o=0){let s=i;for(let i of[`spread`,`blur`]){let c=a,l=0;if(i===`spread`&&(c=Math.abs(o),l=Math.sign(o)),c>0)for(let[a,o]of[[`x`,new e(1,0)],[`y`,new e(0,1)]]){let e=n+`:`+i+`:`+a,u=t.step(e,r);u.raw.value={direction:o,radius:c,maximum:l},s=t.draw(e,s,!0,`rgba16float`)}}return s}},a=class e{static collect(r,i){let a=new Map,o=new Map;for(let s of r.drawList)if(o.set(s.id,s.count),s instanceof t){s.updateInstanceData();for(let t=0;t<s.count;t++){let n=s.effectAt(t);n!==void 0&&e.append(a,n[i],s.id,t)}}else s.material!==void 0&&e.append(a,n.capture(s.material.style)[i],s.id,null);for(let e of a.values())for(let[t,n]of e.selection)n!==null&&n.length===o.get(t)&&e.selection.set(t,null);return Array.from(a.values())}static append(e,t,n,r){if(t.enabled&&t.opacity>0&&t.color[3]>0){let i=JSON.stringify(t),a=e.get(i);if(a===void 0&&(a={key:i,settings:t,selection:new Map},e.set(i,a)),r===null)a.selection.set(n,null);else{let e=a.selection.get(n)??[];e.push(r),a.selection.set(n,e)}}}};export{i as n,a as t};