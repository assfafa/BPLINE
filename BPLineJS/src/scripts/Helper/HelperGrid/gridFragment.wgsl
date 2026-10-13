struct FragmentInput {
    @builtin(position) pixel: vec4f,
};

fn lineOpacity(coordinate: f32, step: f32, worldPerPixel: f32, halfWidth: f32) -> f32 {
    let nearest = round(coordinate / step) * step;
    let distance = abs(coordinate - nearest) / max(worldPerPixel, 0.000000000001);
    return 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // transform 的平移是 CPU 按主栅格周期取余后的相位，不含大世界坐标。
    let screenOffset = input.pixel.xy - value_viewport * 0.5;
    let gridPosition = (value_transform * vec3f(screenOffset, 1.0)).xy;
    let xWorldPerPixel = length(vec2f(value_transform[0].x, value_transform[1].x));
    let yWorldPerPixel = length(vec2f(value_transform[0].y, value_transform[1].y));
    let dpr = max(value_dpr, 0.1);
    let minorX = lineOpacity(gridPosition.x, value_minorStep, xWorldPerPixel, 0.45 * dpr);
    let minorY = lineOpacity(gridPosition.y, value_minorStep, yWorldPerPixel, 0.45 * dpr);
    let majorX = lineOpacity(gridPosition.x, value_majorStep, xWorldPerPixel, 0.9 * dpr);
    let majorY = lineOpacity(gridPosition.y, value_majorStep, yWorldPerPixel, 0.9 * dpr);

    var background = vec3f(0.965, 0.972, 0.982);
    var minorColor = vec4f(0.84, 0.86, 0.89, 1.0);
    var majorColor = vec4f(0.64, 0.68, 0.73, 1.0);
    if (value_mode > 0.5 && value_mode < 1.5) {
        background = vec3f(0.105, 0.12, 0.15);
        minorColor = vec4f(0.18, 0.20, 0.24, 1.0);
        majorColor = vec4f(0.29, 0.33, 0.39, 1.0);
    } else if (value_mode > 1.5) {
        // 自定义模式保留深色底色，只替换用户提供的两级网格线。
        background = vec3f(0.105, 0.12, 0.15);
        minorColor = vec4f(
            value_customColors[0u], value_customColors[1u],
            value_customColors[2u], value_customColors[3u],
        );
        majorColor = vec4f(
            value_customColors[4u], value_customColors[5u],
            value_customColors[6u], value_customColors[7u],
        );
    }
    var color = mix(background, minorColor.rgb, max(minorX, minorY) * minorColor.a);
    color = mix(color, majorColor.rgb, max(majorX, majorY) * majorColor.a);
    return vec4f(color, 1.0);
}
