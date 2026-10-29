@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
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
