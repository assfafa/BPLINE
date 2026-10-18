import{t as e}from"./Vec2-CPTFB0d0.js";import{t}from"./Mat3-CfrbxqK5.js";import{C as n,E as r,T as i,h as a,s as o}from"./lil-gui.esm-BYuo0NrH.js";var s=class{_gridMinorColor=new r(`#2e333d`);_gridMajorColor=new r(`#4a5463`);_rulerMinorColor=new r(`#929aa6`);_rulerMajorColor=new r(`#c9d1de`);_rulerTextColor=new r(`#c9d1de`);_subscribers=new Set;_batching=!1;_pendingChange=!1;_version=0;constructor(e){this._gridMinorColor.add(this,`gridMinorColor`),this._gridMajorColor.add(this,`gridMajorColor`),this._rulerMinorColor.add(this,`rulerMinorColor`),this._rulerMajorColor.add(this,`rulerMajorColor`),this._rulerTextColor.add(this,`rulerTextColor`),e!==void 0&&this.setColors(e)}get version(){return this._version}get gridMinorColor(){return this._gridMinorColor}set gridMinorColor(e){this.replaceColor(`gridMinorColor`,e)}get gridMajorColor(){return this._gridMajorColor}set gridMajorColor(e){this.replaceColor(`gridMajorColor`,e)}get rulerMinorColor(){return this._rulerMinorColor}set rulerMinorColor(e){this.replaceColor(`rulerMinorColor`,e)}get rulerMajorColor(){return this._rulerMajorColor}set rulerMajorColor(e){this.replaceColor(`rulerMajorColor`,e)}get rulerTextColor(){return this._rulerTextColor}set rulerTextColor(e){this.replaceColor(`rulerTextColor`,e)}setColors(e){let t=e.gridMinorColor,n=e.gridMajorColor,i=e.rulerMinorColor,a=e.rulerMajorColor,o=e.rulerTextColor;if(t instanceof r&&n instanceof r&&i instanceof r&&a instanceof r&&o instanceof r){this._batching=!0;try{this.gridMinorColor=t,this.gridMajorColor=n,this.rulerMinorColor=i,this.rulerMajorColor=a,this.rulerTextColor=o}finally{this._batching=!1,this._pendingChange&&(this._pendingChange=!1,this.notify())}return this}throw TypeError(`HelperGrid custom colors must be Color objects.`)}add(e){this._subscribers.add(e)}delete(e){this._subscribers.delete(e)}onColorChange(e,t){this.getColor(t)===e&&this.notify()}dispose(){this._gridMinorColor.delete(this,`gridMinorColor`),this._gridMajorColor.delete(this,`gridMajorColor`),this._rulerMinorColor.delete(this,`rulerMinorColor`),this._rulerMajorColor.delete(this,`rulerMajorColor`),this._rulerTextColor.delete(this,`rulerTextColor`),this._subscribers.clear()}getColor(e){return e===`gridMinorColor`?this._gridMinorColor:e===`gridMajorColor`?this._gridMajorColor:e===`rulerMinorColor`?this._rulerMinorColor:e===`rulerMajorColor`?this._rulerMajorColor:e===`rulerTextColor`?this._rulerTextColor:null}replaceColor(e,t){if(!(t instanceof r))throw TypeError(`HelperGrid custom colors must be Color objects.`);let n=this.getColor(e);n!==t&&n!==null&&(n.delete(this,e),e===`gridMinorColor`?this._gridMinorColor=t:e===`gridMajorColor`?this._gridMajorColor=t:e===`rulerMinorColor`?this._rulerMinorColor=t:e===`rulerMajorColor`?this._rulerMajorColor=t:this._rulerTextColor=t,t.add(this,e),this.notify())}notify(){if(this._batching)this._pendingChange=!0;else{this._version++;for(let e of[...this._subscribers])e.onHelperGridCustomStyleChange(this)}}},c=(t,n)=>{t.ensureWorldMatrix();let r=n.canvas.width,i=n.canvas.height,a=t.zoom;if(r>0&&i>0&&a>0){let o=t.worldMatrix.data,s=t.width/(r*a),c=t.height/(i*a),l=new e(o[0]*s,o[1]*s),u=new e(-o[3]*c,-o[4]*c),d=Math.max(Math.hypot(l.x,l.y),Math.hypot(u.x,u.y));return 10**Math.floor(Math.log10(d*48*n.dpr))}return 0},l=(e,t)=>{let n=0;for(;n<12;n+=1){let e=t*10**n;if(Math.abs(e-Math.round(e))<1e-7)break}let r=10**n,i=BigInt(Math.round(t*r)),a=BigInt(e)*i,o=BigInt(r),s=a,c=``;a<0n&&(s=-a,c=`-`);let l=String(s/o);if(n===0)return c+l;{let e=String(s%o).padStart(n,`0`);return c+l+`.`+e}},u=e=>{let t=e.charCodeAt(0)-48;return t>=0&&t<=9?t:e===`.`?10:e===`-`?11:-1},d=(e,t,n,r,i,a)=>{if(a.fill(0),Number.isFinite(e)&&Number.isFinite(t)&&Math.abs(t)>1e-15&&n>0){let o=n/Math.abs(t),s=e%n;s<0&&(s+=n),Math.abs(s-n)<n*1e-8&&(s=0);let c=0,d=1;t>0?s>n*1e-8&&(c=(n-s)/t):(c=s/-t,d=-1);let f=0;if(o>=28*i&&Number.isFinite(o)){f=Math.min(64,Math.max(0,Math.ceil((r-c)/o)));let i=Math.round((e+t*c)/n);for(let e=0;e<f;e+=1){let t=l(i+d*e,n);if(t.length<=20){let n=e*21;a[n]=t.length;for(let e=0;e<t.length;e+=1)a[n+1+e]=u(t[e])}}}return{start:c,spacing:o,count:f}}return{start:0,spacing:1e9,count:0}},f=`struct FragmentInput {
    @builtin(position) pixel: vec4f,
};

fn lineOpacity(coordinate: f32, step: f32, worldPerPixel: f32, halfWidth: f32) -> f32 {
    let nearest = round(coordinate / step) * step;
    let distance = abs(coordinate - nearest) / max(worldPerPixel, 0.000000000001);
    return 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // transform 的平移是 CPU 按主栅格周期取余后的相位，不含大世界坐标。
    let screenOffset = input.pixel.xy - value_viewport * 0.5;
    let gridPosition = (value_transform * vec3f(screenOffset, 1.0)).xy;
    let xWorldPerPixel = length(vec2f(value_transform[0].x, value_transform[1].x));
    let yWorldPerPixel = length(vec2f(value_transform[0].y, value_transform[1].y));
    let dpr = max(value_dpr, 0.1);
    let minorX = lineOpacity(gridPosition.x, value_minorStep, xWorldPerPixel, 0.45 * dpr);
    let minorY = lineOpacity(gridPosition.y, value_minorStep, yWorldPerPixel, 0.45 * dpr);
    let majorX = lineOpacity(gridPosition.x, value_majorStep, xWorldPerPixel, 0.9 * dpr);
    let majorY = lineOpacity(gridPosition.y, value_majorStep, yWorldPerPixel, 0.9 * dpr);

    var background = vec3f(0.965, 0.972, 0.982);
    var minorColor = vec4f(0.84, 0.86, 0.89, 1.0);
    var majorColor = vec4f(0.64, 0.68, 0.73, 1.0);
    if (value_mode > 0.5 && value_mode < 1.5) {
        background = vec3f(0.105, 0.12, 0.15);
        minorColor = vec4f(0.18, 0.20, 0.24, 1.0);
        majorColor = vec4f(0.29, 0.33, 0.39, 1.0);
    } else if (value_mode > 1.5) {
        // 自定义模式保留深色底色，只替换用户提供的两级网格线。
        background = vec3f(0.105, 0.12, 0.15);
        minorColor = vec4f(
            value_customColors[0u], value_customColors[1u],
            value_customColors[2u], value_customColors[3u],
        );
        majorColor = vec4f(
            value_customColors[4u], value_customColors[5u],
            value_customColors[6u], value_customColors[7u],
        );
    }
    var color = mix(background, minorColor.rgb, max(minorX, minorY) * minorColor.a);
    color = mix(color, majorColor.rgb, max(majorX, majorY) * majorColor.a);
    return vec4f(color, 1.0);
}
`,p=`struct VertexOutput {
    @builtin(position) position: vec4f,
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let corners = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0),
    );
    var output: VertexOutput;
    output.position = vec4f(corners[vertexIndex], 0.99999994, 1.0);
    return output;
}
`,m=`struct FragmentInput {
    @builtin(position) pixel: vec4f,
};

// Inigo Quilez, "Segment - exact", https://iquilezles.org/articles/distfunctions2d/
// 数字编码由 CPU 给出，线段距离函数只负责像素空间字形。
fn sdSegment(point: vec2f, start: vec2f, end: vec2f) -> f32 {
    let fromStart = point - start;
    let direction = end - start;
    let ratio = clamp(dot(fromStart, direction) / dot(direction, direction), 0.0, 1.0);
    return length(fromStart - direction * ratio);
}

fn digitMask(digit: i32) -> u32 {
    switch digit {
        case 0: { return 63u; }
        case 1: { return 6u; }
        case 2: { return 91u; }
        case 3: { return 79u; }
        case 4: { return 102u; }
        case 5: { return 109u; }
        case 6: { return 125u; }
        case 7: { return 7u; }
        case 8: { return 127u; }
        case 9: { return 111u; }
        default: { return 0u; }
    }
}

fn glyphDistance(point: vec2f, character: i32) -> f32 {
    if (character == 10) {
        return length(point - vec2f(3.0, 9.0)) - 0.65;
    }
    if (character == 11) {
        return sdSegment(point, vec2f(1.0, 5.0), vec2f(5.0, 5.0)) - 0.55;
    }
    let mask = digitMask(character);
    let starts = array<vec2f, 7>(
        vec2f(1.0, 1.0), vec2f(5.0, 1.0), vec2f(5.0, 5.0),
        vec2f(1.0, 9.0), vec2f(1.0, 5.0), vec2f(1.0, 1.0),
        vec2f(1.0, 5.0),
    );
    let ends = array<vec2f, 7>(
        vec2f(5.0, 1.0), vec2f(5.0, 5.0), vec2f(5.0, 9.0),
        vec2f(5.0, 9.0), vec2f(1.0, 9.0), vec2f(1.0, 5.0),
        vec2f(5.0, 5.0),
    );
    var distance = 1000.0;
    for (var segment = 0u; segment < 7u; segment += 1u) {
        if ((mask & (1u << segment)) != 0u) {
            distance = min(distance, sdSegment(point, starts[segment], ends[segment]) - 0.55);
        }
    }
    return distance;
}

fn tickOpacity(axisPixel: f32, startPixel: f32, spacing: f32, halfWidth: f32) -> f32 {
    let relative = axisPixel - startPixel;
    let nearest = round(relative / spacing) * spacing;
    return 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, abs(relative - nearest));
}

fn labelOpacity(
    axisPixel: f32,
    crossPixel: f32,
    startPixel: f32,
    spacing: f32,
    labels: ptr<storage, array<f32>, read>,
) -> f32 {
    let labelIndex = i32(floor((axisPixel - startPixel) / spacing));
    if (labelIndex < 0 || labelIndex >= 64) {
        return 0.0;
    }
    let labelStart = startPixel + f32(labelIndex) * spacing;
    let glyphAxis = (axisPixel - labelStart) / value_config[0].z - 4.0;
    let column = i32(floor(glyphAxis / 7.0));
    let labelOffset = u32(labelIndex) * 21u;
    let glyphCount = i32((*labels)[labelOffset]);
    if (column < 0 || column >= glyphCount) {
        return 0.0;
    }
    let character = i32((*labels)[labelOffset + 1u + u32(column)]);
    let local = vec2f(glyphAxis - f32(column) * 7.0, crossPixel);
    let distance = glyphDistance(local, character);
    return 1.0 - smoothstep(0.0, 1.0, distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // 隐藏区域输出零 alpha；Cent Browser 中使用 discard 会让整条标尺消失。
    if (value_config[1].y < 0.5) {
        return vec4f(0.0);
    }
    let pixel = input.pixel.xy;
    let rulerHeight = 24.0 * value_config[0].z;
    let rulerWidth = 32.0 * value_config[0].z;
    var horizontalStart = value_config[0].y;
    var verticalStart = value_config[0].x;
    if (value_config[1].z > 1.5) {
        horizontalStart = 0.0;
    } else if (value_config[1].z > 0.5) {
        horizontalStart = value_config[0].y - rulerHeight;
    }
    if (value_config[2].x > 1.5) {
        verticalStart = value_config[0].x - rulerWidth;
    } else if (value_config[2].x > 0.5) {
        verticalStart = 0.0;
    }
    let inHorizontal = value_config[1].z > 0.5
        && pixel.y >= horizontalStart && pixel.y < horizontalStart + rulerHeight;
    let inVertical = value_config[2].x > 0.5
        && pixel.x >= verticalStart && pixel.x < verticalStart + rulerWidth;
    if (!inHorizontal && !inVertical) {
        return vec4f(0.0);
    }

    var rulerColor = vec3f(0.91, 0.93, 0.95);
    var textColor = vec4f(0.27, 0.31, 0.37, 1.0);
    if (value_config[1].x > 0.5) {
        rulerColor = vec3f(0.16, 0.18, 0.22);
        textColor = vec4f(0.79, 0.82, 0.87, 1.0);
    }
    var minorColor = textColor;
    var majorColor = textColor;
    var minorStrength = 0.65;
    if (value_config[1].x > 1.5) {
        // 自定义模式分别读取次刻度、主刻度和数字颜色。
        minorColor = vec4f(
            value_customColors[8u], value_customColors[9u],
            value_customColors[10u], value_customColors[11u],
        );
        majorColor = vec4f(
            value_customColors[12u], value_customColors[13u],
            value_customColors[14u], value_customColors[15u],
        );
        textColor = vec4f(
            value_customColors[16u], value_customColors[17u],
            value_customColors[18u], value_customColors[19u],
        );
        minorStrength = 1.0;
    }
    var color = rulerColor;
    if (inHorizontal && !inVertical) {
        let localY = (pixel.y - horizontalStart) / value_config[0].z;
        let tickSide = select(localY, 24.0 - localY, value_config[1].z > 1.5);
        let major = tickOpacity(pixel.x, value_horizontalTicks.x, value_horizontalTicks.y, 0.8 * value_config[0].z);
        let minor = tickOpacity(pixel.x, value_horizontalTicks.x, value_horizontalTicks.y / value_config[2].y, 0.6 * value_config[0].z);
        if (tickSide < 5.0) {
            color = mix(color, minorColor.rgb, minor * minorStrength * minorColor.a);
        }
        if (tickSide < 11.0) {
            color = mix(color, majorColor.rgb, major * majorColor.a);
        }
        let label = labelOpacity(
            pixel.x, localY - 11.0, value_horizontalTicks.x, value_horizontalTicks.y,
            &value_horizontalLabels,
        );
        color = mix(color, textColor.rgb, label * textColor.a);
    }
    if (inVertical && !inHorizontal) {
        let localX = (pixel.x - verticalStart) / value_config[0].z;
        let tickSide = select(localX, 32.0 - localX, value_config[2].x > 1.5);
        let major = tickOpacity(pixel.y, value_verticalTicks.x, value_verticalTicks.y, 0.8 * value_config[0].z);
        let minor = tickOpacity(pixel.y, value_verticalTicks.x, value_verticalTicks.y / value_config[2].y, 0.6 * value_config[0].z);
        if (tickSide < 5.0) {
            color = mix(color, minorColor.rgb, minor * minorStrength * minorColor.a);
        }
        if (tickSide < 11.0) {
            color = mix(color, majorColor.rgb, major * majorColor.a);
        }
        let label = labelOpacity(
            pixel.y, localX - 14.0, value_verticalTicks.x, value_verticalTicks.y,
            &value_verticalLabels,
        );
        color = mix(color, textColor.rgb, label * textColor.a);
    }
    return vec4f(color, 1.0);
}
`,h=class{_gridStyle=v();_rulerStyle=v();_gridGeometry=new n({vertices:g,style:this._gridStyle});_rulerGeometry=new n({vertices:g,style:this._rulerStyle});material=new a(this._gridStyle);mesh=new o(this._gridGeometry,this.material,this._gridStyle);rulerMaterial=new a(this._rulerStyle);rulerMesh=new o(this._rulerGeometry,this.rulerMaterial,this._rulerStyle);render;camera;_transform=new t;_rulerConfig=new t;_viewport=new e(1,1);_horizontalTicks=new e(0,1e9);_verticalTicks=new e(0,1e9);_horizontalLabels=new Float32Array(1344);_verticalLabels=new Float32Array(1344);_custom=new s;_customColors=new Float32Array(20);_mode=`dark`;_minorPerMajor=10;_ruler=!0;_horizontalRuler=`bottom`;_verticalRuler=`left`;_snapshot=null;_destroyed=!1;constructor(e,t,n){this.render=t,this.camera=n,this.material.raw.vertexShader=p,this.material.raw.fragmentShader=f,this.material.depthTest=!0,this.material.depthWrite=!0,this.material.cullMode=`none`,this.material.raw.value={transform:this._transform,viewport:this._viewport,minorStep:10,majorStep:100,dpr:1,mode:1,customColors:this._customColors},this.mesh.noSelect=!0,this.mesh.culling=!1,this.mesh.order=-(2**53-1),e.add(this.mesh),this.rulerMaterial.raw.vertexShader=p,this.rulerMaterial.raw.fragmentShader=m,this.rulerMaterial.transparent=!0,this.rulerMaterial.cullMode=`none`,this.rulerMaterial.raw.value={config:this._rulerConfig,horizontalTicks:this._horizontalTicks,verticalTicks:this._verticalTicks,horizontalLabels:this._horizontalLabels,verticalLabels:this._verticalLabels,customColors:this._customColors},this.rulerMesh.noSelect=!0,this.rulerMesh.culling=!1,this.rulerMesh.order=2**53-1,e.add(this.rulerMesh),this._custom.add(this),this.syncCustomColors(),this.update()}get mode(){return this._mode}set mode(e){this._mode=e,e===`dark`?this.material.raw.value.mode=1:e===`custom`?(this.material.raw.value.mode=2,this.syncCustomColors()):this.material.raw.value.mode=0,this.syncRulerConfig()}get custom(){return this._custom}set custom(e){this._custom.setColors(e)}onHelperGridCustomStyleChange(e){this._mode===`custom`&&e===this._custom&&this.syncCustomColors()}syncCustomColors(){this._custom.gridMinorColor.writeTo(this._customColors,0),this._custom.gridMajorColor.writeTo(this._customColors,4),this._custom.rulerMinorColor.writeTo(this._customColors,8),this._custom.rulerMajorColor.writeTo(this._customColors,12),this._custom.rulerTextColor.writeTo(this._customColors,16),this.material.raw.touchValue(`customColors`),this.rulerMaterial.raw.touchValue(`customColors`)}get minorPerMajor(){return this._minorPerMajor}set minorPerMajor(e){if(!Number.isInteger(e)||e<2)throw RangeError(`HelperGrid minorPerMajor must be an integer of at least 2.`);this._minorPerMajor=e,this.syncRulerConfig(),this._snapshot=null}get ruler(){return this._ruler}set ruler(e){this._ruler=e,this.syncRulerConfig()}get horizontalRuler(){return this._horizontalRuler}set horizontalRuler(e){this._horizontalRuler=e,this.syncRulerConfig(),this._snapshot=null}get verticalRuler(){return this._verticalRuler}set verticalRuler(e){this._verticalRuler=e,this.syncRulerConfig(),this._snapshot=null}syncRulerConfig(){let e=0,t=0,n=0,r=0;this._mode===`dark`?e=1:this._mode===`custom`&&(e=2),this._ruler&&(t=1),this._horizontalRuler===`bottom`?n=1:this._horizontalRuler===`top`&&(n=2),this._verticalRuler===`left`?r=1:this._verticalRuler===`right`&&(r=2),this._rulerConfig.set([this._viewport.x,this._viewport.y,this.render.dpr,e,t,n,r,this._minorPerMajor,0])}update(){if(this._destroyed===!1){this.camera.ensureWorldMatrix();let t=this.render.canvas.width,n=this.render.canvas.height,r=this.camera.zoom,i=this.render.dpr,a=this.camera.worldMatrix,o=this._snapshot,s=!0;if(o!==null&&(s=o.worldVersion!==a.version||o.zoom!==r||o.cameraWidth!==this.camera.width||o.cameraHeight!==this.camera.height||o.viewportWidth!==t||o.viewportHeight!==n||o.dpr!==i),s&&t>0&&n>0&&r>0){let o=a.data,s=this.camera.width/(t*r),l=this.camera.height/(n*r),u=new e(o[0]*s,o[1]*s),f=new e(-o[3]*l,-o[4]*l),p=c(this.camera,this.render),m=p*this._minorPerMajor,h=_(o[6],m),g=_(o[7],m);this._transform.set([u.x,u.y,0,f.x,f.y,0,h,g,1]),this._viewport.set(t,n),this.material.raw.value.minorStep=p,this.material.raw.value.majorStep=m,this.material.raw.value.dpr=i,this.syncRulerConfig();let v=n-12*i,y=16*i;this._horizontalRuler===`top`&&(v=12*i),this._verticalRuler===`right`&&(y=t-16*i);let b=o[6]-u.x*t*.5+f.x*(v-n*.5),x=o[7]+u.y*(y-t*.5)-f.y*n*.5,S=d(b,u.x,m,t,i,this._horizontalLabels),C=d(x,f.y,m,n,i,this._verticalLabels);this._horizontalTicks.set(S.start,S.spacing),this._verticalTicks.set(C.start,C.spacing),this.rulerMaterial.raw.touchValue(`horizontalLabels`),this.rulerMaterial.raw.touchValue(`verticalLabels`),this._snapshot={worldVersion:a.version,zoom:r,cameraWidth:this.camera.width,cameraHeight:this.camera.height,viewportWidth:t,viewportHeight:n,dpr:i}}}}destroy(){this._destroyed||(this._destroyed=!0,this.mesh.removeSelf(),this.rulerMesh.removeSelf(),this.mesh.dispose(),this.rulerMesh.dispose(),this.material.dispose(),this.rulerMaterial.dispose(),this._custom.delete(this),this._custom.dispose(),this._gridGeometry.dispose(),this._rulerGeometry.dispose())}},g=new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),_=(e,t)=>{let n=e%t;return n<0&&(n+=t),n},v=()=>{let e=new i;return e.solid.enabled=!0,e};export{c as n,h as t};