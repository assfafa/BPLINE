@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let base = sampleInput(uv);
    let coverage = textureSampleLevel(value_mask, valueSampler_mask, uv, 0, 0.0).a;
    let shifted = uv - value_offset;
    var shadow = 0.0;
    var innerCoverage = 0.0;
    if (all(shifted >= vec2f(0.0)) && all(shifted <= vec2f(1.0))) {
        shadow = textureSampleLevel(value_blurred, valueSampler_blurred, shifted, 0, 0.0).a;
        innerCoverage = textureSampleLevel(value_innerMask, valueSampler_innerMask, shifted, 0, 0.0).a;
    }
    let tint = vec3f(value_tint[0], value_tint[1], value_tint[2]);
    let opacity = value_opacity * value_tint[3];
    let outside = clamp(shadow * opacity * value_outer, 0.0, 1.0);
    let inside = clamp((1.0 - innerCoverage) * coverage * opacity * value_inner, 0.0, 1.0);
    let objects = textureSampleLevel(value_objects, valueSampler_objects, uv, 0, 0.0);
    let uncovered = 1.0 - objects.a;
    let backgroundAlpha = clamp((base.a - objects.a) / max(uncovered, 0.000001), 0.0, 1.0);
    let backgroundRGB = max(base.rgb * base.a - objects.rgb * objects.a, vec3f(0.0)) / max(uncovered, 0.000001);
    let visibleShadow = outside * uncovered;
    let alpha = base.a + visibleShadow * (1.0 - backgroundAlpha);
    // 内阴影仅改变已有颜色，外阴影在最终画面后方补充覆盖度。
    let baseRGB = mix(base.rgb, tint, inside);
    if (alpha > 0.0) {
        return vec4f((baseRGB * base.a + visibleShadow * (tint - backgroundRGB)) / alpha, alpha);
    }
    return vec4f(0.0);
}
