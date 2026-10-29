// FXAA 的方向搜索实现，背景未知时同时将 Alpha 边界纳入亮度判断。
// 算法参考：Timothy Lottes, NVIDIA FXAA Whitepaper；本文件为项目 WGSL 实现。
fn signal(color: vec4f) -> f32 {
    return dot(color.rgb, vec3f(0.299, 0.587, 0.114)) + color.a * 0.25;
}
fn straight(color: vec4f) -> vec4f {
    if (color.a > 0.000001) { return vec4f(color.rgb / color.a, color.a); }
    return vec4f(0.0);
}
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let pixel = texelSize();
    let center = premultInput(uv);
    let nw = signal(premultInput(uv + pixel * vec2f(-1.0, -1.0)));
    let ne = signal(premultInput(uv + pixel * vec2f(1.0, -1.0)));
    let sw = signal(premultInput(uv + pixel * vec2f(-1.0, 1.0)));
    let se = signal(premultInput(uv + pixel * vec2f(1.0, 1.0)));
    let middle = signal(center);
    let low = min(middle, min(min(nw, ne), min(sw, se)));
    let high = max(middle, max(max(nw, ne), max(sw, se)));
    // 平坦区域不做混合，保留文字内部和实色区域的清晰度。
    if (high - low < max(0.0312, high * 0.125)) { return straight(center); }
    var direction = vec2f(-(nw + ne - sw - se), nw + sw - ne - se);
    let reduction = max((nw + ne + sw + se) * 0.03125, 0.0078125);
    direction = clamp(direction / (min(abs(direction.x), abs(direction.y)) + reduction), vec2f(-8.0), vec2f(8.0)) * pixel;
    let narrow = 0.5 * (premultInput(uv - direction / 6.0) + premultInput(uv + direction / 6.0));
    let wide = narrow * 0.5 + 0.25 * (premultInput(uv - direction * 0.5) + premultInput(uv + direction * 0.5));
    let wideSignal = signal(wide);
    if (wideSignal < low || wideSignal > high) { return straight(narrow); }
    return straight(wide);
}
