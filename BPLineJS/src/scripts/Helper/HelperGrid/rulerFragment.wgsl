struct FragmentInput {
    @builtin(position) pixel: vec4f,
};

// Inigo Quilez, "Segment - exact", https://iquilezles.org/articles/distfunctions2d/
// 数字编码由 CPU 给出，线段距离函数只负责像素空间字形。
fn sdSegment(point: vec2f, start: vec2f, end: vec2f) -> f32 {
    let fromStart = point - start;
    let direction = end - start;
    let ratio = clamp(dot(fromStart, direction) / dot(direction, direction), 0.0, 1.0);
    return length(fromStart - direction * ratio);
}

fn digitMask(digit: i32) -> u32 {
    switch digit {
        case 0: { return 63u; }
        case 1: { return 6u; }
        case 2: { return 91u; }
        case 3: { return 79u; }
        case 4: { return 102u; }
        case 5: { return 109u; }
        case 6: { return 125u; }
        case 7: { return 7u; }
        case 8: { return 127u; }
        case 9: { return 111u; }
        default: { return 0u; }
    }
}

fn glyphDistance(point: vec2f, character: i32) -> f32 {
    if (character == 10) {
        return length(point - vec2f(3.0, 9.0)) - 0.65;
    }
    if (character == 11) {
        return sdSegment(point, vec2f(1.0, 5.0), vec2f(5.0, 5.0)) - 0.55;
    }
    let mask = digitMask(character);
    let starts = array<vec2f, 7>(
        vec2f(1.0, 1.0), vec2f(5.0, 1.0), vec2f(5.0, 5.0),
        vec2f(1.0, 9.0), vec2f(1.0, 5.0), vec2f(1.0, 1.0),
        vec2f(1.0, 5.0),
    );
    let ends = array<vec2f, 7>(
        vec2f(5.0, 1.0), vec2f(5.0, 5.0), vec2f(5.0, 9.0),
        vec2f(5.0, 9.0), vec2f(1.0, 9.0), vec2f(1.0, 5.0),
        vec2f(5.0, 5.0),
    );
    var distance = 1000.0;
    for (var segment = 0u; segment < 7u; segment += 1u) {
        if ((mask & (1u << segment)) != 0u) {
            distance = min(distance, sdSegment(point, starts[segment], ends[segment]) - 0.55);
        }
    }
    return distance;
}

fn tickOpacity(axisPixel: f32, startPixel: f32, spacing: f32, halfWidth: f32) -> f32 {
    let relative = axisPixel - startPixel;
    let nearest = round(relative / spacing) * spacing;
    return 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, abs(relative - nearest));
}

fn labelOpacity(
    axisPixel: f32,
    crossPixel: f32,
    startPixel: f32,
    spacing: f32,
    labels: ptr<storage, array<f32>, read>,
) -> f32 {
    let labelIndex = i32(floor((axisPixel - startPixel) / spacing));
    if (labelIndex < 0 || labelIndex >= 64) {
        return 0.0;
    }
    let labelStart = startPixel + f32(labelIndex) * spacing;
    let glyphAxis = (axisPixel - labelStart) / value_config[0].z - 4.0;
    let column = i32(floor(glyphAxis / 7.0));
    let labelOffset = u32(labelIndex) * 21u;
    let glyphCount = i32((*labels)[labelOffset]);
    if (column < 0 || column >= glyphCount) {
        return 0.0;
    }
    let character = i32((*labels)[labelOffset + 1u + u32(column)]);
    let local = vec2f(glyphAxis - f32(column) * 7.0, crossPixel);
    let distance = glyphDistance(local, character);
    return 1.0 - smoothstep(0.0, 1.0, distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // 隐藏区域输出零 alpha；Cent Browser 中使用 discard 会让整条标尺消失。
    if (value_config[1].y < 0.5) {
        return vec4f(0.0);
    }
    let pixel = input.pixel.xy;
    let rulerHeight = 24.0 * value_config[0].z;
    let rulerWidth = 32.0 * value_config[0].z;
    var horizontalStart = value_config[0].y;
    var verticalStart = value_config[0].x;
    if (value_config[1].z > 1.5) {
        horizontalStart = 0.0;
    } else if (value_config[1].z > 0.5) {
        horizontalStart = value_config[0].y - rulerHeight;
    }
    if (value_config[2].x > 1.5) {
        verticalStart = value_config[0].x - rulerWidth;
    } else if (value_config[2].x > 0.5) {
        verticalStart = 0.0;
    }
    let inHorizontal = value_config[1].z > 0.5
        && pixel.y >= horizontalStart && pixel.y < horizontalStart + rulerHeight;
    let inVertical = value_config[2].x > 0.5
        && pixel.x >= verticalStart && pixel.x < verticalStart + rulerWidth;
    if (!inHorizontal && !inVertical) {
        return vec4f(0.0);
    }

    var rulerColor = vec3f(0.91, 0.93, 0.95);
    var textColor = vec4f(0.27, 0.31, 0.37, 1.0);
    if (value_config[1].x > 0.5) {
        rulerColor = vec3f(0.16, 0.18, 0.22);
        textColor = vec4f(0.79, 0.82, 0.87, 1.0);
    }
    var minorColor = textColor;
    var majorColor = textColor;
    var minorStrength = 0.65;
    if (value_config[1].x > 1.5) {
        // 自定义模式分别读取次刻度、主刻度和数字颜色。
        minorColor = vec4f(
            value_customColors[8u], value_customColors[9u],
            value_customColors[10u], value_customColors[11u],
        );
        majorColor = vec4f(
            value_customColors[12u], value_customColors[13u],
            value_customColors[14u], value_customColors[15u],
        );
        textColor = vec4f(
            value_customColors[16u], value_customColors[17u],
            value_customColors[18u], value_customColors[19u],
        );
        minorStrength = 1.0;
    }
    var color = rulerColor;
    if (inHorizontal && !inVertical) {
        let localY = (pixel.y - horizontalStart) / value_config[0].z;
        let tickSide = select(localY, 24.0 - localY, value_config[1].z > 1.5);
        let major = tickOpacity(pixel.x, value_horizontalTicks.x, value_horizontalTicks.y, 0.8 * value_config[0].z);
        let minor = tickOpacity(pixel.x, value_horizontalTicks.x, value_horizontalTicks.y / value_config[2].y, 0.6 * value_config[0].z);
        if (tickSide < 5.0) {
            color = mix(color, minorColor.rgb, minor * minorStrength * minorColor.a);
        }
        if (tickSide < 11.0) {
            color = mix(color, majorColor.rgb, major * majorColor.a);
        }
        let label = labelOpacity(
            pixel.x, localY - 11.0, value_horizontalTicks.x, value_horizontalTicks.y,
            &value_horizontalLabels,
        );
        color = mix(color, textColor.rgb, label * textColor.a);
    }
    if (inVertical && !inHorizontal) {
        let localX = (pixel.x - verticalStart) / value_config[0].z;
        let tickSide = select(localX, 32.0 - localX, value_config[2].x > 1.5);
        let major = tickOpacity(pixel.y, value_verticalTicks.x, value_verticalTicks.y, 0.8 * value_config[0].z);
        let minor = tickOpacity(pixel.y, value_verticalTicks.x, value_verticalTicks.y / value_config[2].y, 0.6 * value_config[0].z);
        if (tickSide < 5.0) {
            color = mix(color, minorColor.rgb, minor * minorStrength * minorColor.a);
        }
        if (tickSide < 11.0) {
            color = mix(color, majorColor.rgb, major * majorColor.a);
        }
        let label = labelOpacity(
            pixel.y, localX - 14.0, value_verticalTicks.x, value_verticalTicks.y,
            &value_verticalLabels,
        );
        color = mix(color, textColor.rgb, label * textColor.a);
    }
    return vec4f(color, 1.0);
}
