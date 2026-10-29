// SMAA 1x Medium WGSL port of iryoku/smaa (MIT, see LICENSE).
// Medium intentionally disables diagonal and corner detection, with 8 search steps.
fn edges(uv: vec2f) -> vec2f { return sampleInput(uv).rg; }
fn searchLength(e: vec2f, side: f32) -> f32 {
    let scale = vec2f(32.0, -32.0) / vec2f(64.0, 16.0);
    let bias = (vec2f(66.0 * side, 33.0) + vec2f(0.5, -0.5)) / vec2f(64.0, 16.0);
    return textureSampleLevel(value_search, valueSampler_search, e * scale + bias, 0, 0.0).r;
}
fn search(start: vec2f, axis: vec2f, direction: f32) -> f32 {
    var uv = start;
    var e = vec2f(0.0, 1.0);
    let vertical = axis.y > 0.5;
    // 八步双像素搜索对应官方 Medium 预设。
    for (var i = 0; i < 8; i++) {
        if (e.y > 0.8281 && e.x == 0.0) {
            e = edges(uv);
            if (vertical) { e = e.yx; }
            uv += direction * axis * 2.0 * texelSize();
        } else { break; }
    }
    let side = select(0.0, 0.5, direction > 0.0);
    let correction = 3.25 - (255.0 / 127.0) * searchLength(e, side);
    return dot(uv - direction * correction * axis * texelSize(), axis);
}
fn area(distance: vec2f, e1: f32, e2: f32) -> vec2f {
    // 1x 只读取官方 160×560 图的首个 160×80 子表。
    let uv = (16.0 * round(4.0 * vec2f(e1, e2)) + sqrt(distance) + 0.5) / vec2f(160.0, 80.0);
    return textureSampleLevel(value_area, valueSampler_area, uv, 0, 0.0).rg;
}
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let p = texelSize();
    let e = edges(uv);
    var result = vec4f(0.0);
    if (e.g > 0.0) {
        let left = search(uv + p * vec2f(-0.25, -0.125), vec2f(1.0, 0.0), -1.0);
        let right = search(uv + p * vec2f(1.25, -0.125), vec2f(1.0, 0.0), 1.0);
        let crossing1 = edges(vec2f(left, uv.y - p.y * 0.25)).r;
        let crossing2 = edges(vec2f(right + p.x, uv.y - p.y * 0.25)).r;
        let distances = abs(round((vec2f(left, right) - uv.x) / p.x));
        let weights = area(distances, crossing1, crossing2);
        result.r = weights.x;
        result.g = weights.y;
    }
    if (e.r > 0.0) {
        let top = search(uv + p * vec2f(-0.125, -0.25), vec2f(0.0, 1.0), -1.0);
        let bottom = search(uv + p * vec2f(-0.125, 1.25), vec2f(0.0, 1.0), 1.0);
        let crossing1 = edges(vec2f(uv.x - p.x * 0.25, top)).g;
        let crossing2 = edges(vec2f(uv.x - p.x * 0.25, bottom + p.y)).g;
        let distances = abs(round((vec2f(top, bottom) - uv.y) / p.y));
        let weights = area(distances, crossing1, crossing2);
        result.b = weights.x;
        result.a = weights.y;
    }
    return result;
}
