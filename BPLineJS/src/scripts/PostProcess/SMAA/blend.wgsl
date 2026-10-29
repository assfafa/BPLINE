// SMAA neighborhood blending, MIT; see LICENSE. Filter in premultiplied space.
fn weights(uv: vec2f) -> vec4f {
    return textureSampleLevel(value_weights, valueSampler_weights, uv, 0, 0.0);
}
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let p = texelSize();
    let own = weights(uv);
    let a = vec4f(weights(uv + vec2f(p.x, 0.0)).a, weights(uv + vec2f(0.0, p.y)).g, own.b, own.r);
    if (dot(a, vec4f(1.0)) < 0.00001) { return sampleInput(uv); }
    var direction = vec2f(0.0, 1.0);
    var blend = a.yw;
    if (max(a.x, a.z) > max(a.y, a.w)) {
        direction = vec2f(1.0, 0.0);
        blend = a.xz;
    }
    let total = blend.x + blend.y;
    let color = (premultInput(uv + direction * p * blend.x) * blend.x + premultInput(uv - direction * p * blend.y) * blend.y) / total;
    if (color.a > 0.000001) { return vec4f(color.rgb / color.a, color.a); }
    return vec4f(0.0);
}
