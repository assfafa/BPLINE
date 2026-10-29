/** Gaussian radius is in CSS pixels; the input texture uses physical pixels. */
export const fragmentShader = `@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let radius = i32(value_radius);
    let sigma = max(value_radius / 3.0, 0.1);
    let pixel = texelSize() * value_pixelRatio;
    var color = vec4f(0.0);
    var totalWeight = 0.0;
    // Premultiply before filtering so transparent pixels do not darken the edge.
    for (var y = -radius; y <= radius; y++) {
        for (var x = -radius; x <= radius; x++) {
            let offset = vec2f(f32(x), f32(y));
            let weight = exp(-dot(offset, offset) / (2.0 * sigma * sigma));
            let sample = sampleInput(uv + offset * pixel);
            color += vec4f(sample.rgb * sample.a, sample.a) * weight;
            totalWeight += weight;
        }
    }
    if (color.a > 0.0) {
        return vec4f(color.rgb / color.a, color.a / totalWeight);
    } else {
        return vec4f(0.0);
    }
}`;
