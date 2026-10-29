fn maskSample(uv: vec2f) -> vec4f {
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
