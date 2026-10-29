@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let base = sampleInput(uv);
    let glow = textureSampleLevel(value_glow, valueSampler_glow, uv, 0, 0.0);
    let alpha = base.a + clamp(glow.a, 0.0, 1.0) * (1.0 - base.a);
    if (alpha > 0.0) {
        var rgb = (base.rgb * base.a + glow.rgb) / alpha;
        // HDR 仅放开 RGB；SDR 保持原有饱和显示，Alpha 始终表示覆盖率。
        if (value_hdr < 0.5) {
            rgb = clamp(rgb, vec3f(0.0), vec3f(1.0));
        }
        return vec4f(rgb, alpha);
    }
    return vec4f(0.0);
}
