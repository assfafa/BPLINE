// SMAA 1x Medium WGSL port, MIT; see LICENSE. Alpha-aware color edge detection.
fn delta(a: vec4f, b: vec4f) -> f32 {
    let rgb = abs(a.rgb * a.a - b.rgb * b.a);
    return max(max(max(rgb.r, rgb.g), rgb.b), abs(a.a - b.a));
}
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let p = texelSize();
    let center = sampleInput(uv);
    let left = sampleInput(uv - vec2f(p.x, 0.0));
    let top = sampleInput(uv - vec2f(0.0, p.y));
    let d = vec2f(delta(center, left), delta(center, top));
    var edges = step(vec2f(0.1), d);
    // 返回零数据代替 discard，兼容曾出现 discard 异常的浏览器后端。
    if (dot(edges, vec2f(1.0)) == 0.0) { return vec4f(0.0); }
    let opposite = vec2f(delta(center, sampleInput(uv + vec2f(p.x, 0.0))),
        delta(center, sampleInput(uv + vec2f(0.0, p.y))));
    let distant = vec2f(delta(left, sampleInput(uv - vec2f(2.0 * p.x, 0.0))),
        delta(top, sampleInput(uv - vec2f(0.0, 2.0 * p.y))));
    let maximum = max(max(d, opposite), distant);
    edges *= step(vec2f(max(maximum.x, maximum.y)), 2.0 * d);
    return vec4f(edges, 0.0, 0.0);
}
