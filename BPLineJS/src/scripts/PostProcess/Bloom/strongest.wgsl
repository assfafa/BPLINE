@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let candidate = textureSampleLevel(value_glow, valueSampler_glow, uv, 0, 0.0) * value_strength;
    var previous = vec4f(0.0);
    // 第一组从零开始，之后读取上一份最强结果；附件始终保存预乘浮点数据。
    if (value_first < 0.5) {
        previous = sampleInput(uv);
    }
    let weights = vec3f(0.2126, 0.7152, 0.0722);
    let candidateBrightness = dot(candidate.rgb, weights);
    let previousBrightness = dot(previous.rgb, weights);
    // 亮度相等时保持已有结果，避免因分别取 RGB 最大值混出不存在的白色。
    if (candidateBrightness > previousBrightness) {
        return candidate;
    }
    return previous;
}
