// 对输入颜色做正确的预乘双线性过滤；返回预乘 RGBA。
fn premultInput(uv: vec2f) -> vec4f {
    // 显式取四个 texel 后预乘，避免透明 texel 的 RGB 参与线性过滤形成黑边。
    let size = vec2i(textureDimensions(postInput));
    let pixel = uv * vec2f(size) - 0.5;
    let origin = vec2i(floor(pixel));
    let fraction = fract(pixel);
    var result = vec4f(0.0);
    for (var y = 0; y < 2; y++) {
        for (var x = 0; x < 2; x++) {
            let color = textureLoad(postInput, clamp(origin + vec2i(x, y), vec2i(0), size - 1), 0, 0);
            let blend = mix(vec2f(1.0) - fraction, fraction, vec2f(f32(x), f32(y)));
            result += vec4f(color.rgb * color.a, color.a) * blend.x * blend.y;
        }
    }
    return result;
}
