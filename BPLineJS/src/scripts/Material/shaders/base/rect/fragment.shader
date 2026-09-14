struct MaterialUniform {
    solidColor: vec4f,
    sdfBorderColor: vec4f,
    edgeColor: vec4f,
    pointsColor: vec4f,
    wireframeColor: vec4f,
    // opacity、SDF width、align、pixelAligned。
    solid: vec4f,
    // opacity、实体 width、align、pixelAligned。
    edge: vec4f,
    // opacity、pixelAligned、补位、补位。
    points: vec4f,
    // opacity，其余为补位。
    wireframe: vec4f,
    // solid、wireframe、edge、points 开关。
    enabled: vec4f,
    // solid、edge、points 的纹理层号，普通 Mesh 均为 0。
    textureLayers: vec4f,
};

struct RenderCameraUniform {
    zoom: f32,
    dpr: f32,
    _padding0: f32,
    _padding1: f32,
};

struct GeometryUniform {
    width: f32,
    height: f32,
    radius: f32,
    _padding0: f32,
};

// 当前 Render 的 DPR 与 Camera 缩放参数。
@group(0) @binding(3) var<uniform> renderCameraUniform: RenderCameraUniform;
// 当前 Geometry 的宽度、高度与圆角参数，供后续 SDF 计算使用。
@group(0) @binding(4) var<uniform> geometryUniform: GeometryUniform;
// 材质背景颜色，同时作为贴图颜色乘数。
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;
// 材质当前使用的二维贴图。
@group(1) @binding(1) var textureMap: texture_2d_array<f32>;
// 控制贴图过滤和寻址方式。
@group(1) @binding(2) var textureSampler: sampler;
// 三种几何各自的贴图和 Sampler 同时绑定，不能在一次 DrawCall 中途切换绑定。
@group(1) @binding(3) var edgeTexture: texture_2d_array<f32>;
@group(1) @binding(4) var edgeSampler: sampler;
@group(1) @binding(5) var pointsTexture: texture_2d_array<f32>;
@group(1) @binding(6) var pointsSampler: sampler;

struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) localPosition: vec2f,
    @location(2) @interpolate(flat) vertexType: f32,
    @location(3) @interpolate(flat) instanceIndex: u32,
};

// 计算点到圆角矩形边界的有符号距离：内部为负，边界为 0，外部为正。
fn RoundedRectDistance(position: vec2f, halfSize: vec2f, radius: f32) -> f32 {
    let safeRadius = clamp(radius, 0.0, min(halfSize.x, halfSize.y));
    let cornerOffset = abs(position) - (halfSize - vec2f(safeRadius));

    return length(max(cornerOffset, vec2f(0.0)))
        + min(max(cornerOffset.x, cornerOffset.y), 0.0)
        - safeRadius;
}

fn ShadeRect(input: FragmentInput, textureColor: vec4f, materialUniform: MaterialUniform) -> vec4f {
    let geometrySize = vec2f(geometryUniform.width, geometryUniform.height);
    let halfSize = geometrySize * 0.5;
    var outputColor = textureColor * materialUniform.solidColor;

    let safeZoom = max(abs(renderCameraUniform.zoom), 0.000001);
    let borderZoomScale = mix(1.0 / safeZoom, 1.0, materialUniform.solid.w);
    let borderWidth = materialUniform.solid.y * borderZoomScale;
    let outward = borderWidth * materialUniform.solid.z;
    let inward = borderWidth * (1.0 - materialUniform.solid.z);
    let originalRadius = clamp(geometryUniform.radius, 0.0, min(halfSize.x, halfSize.y));
    let outerHalfSize = halfSize + vec2f(outward);
    let innerHalfSize = max(halfSize - vec2f(inward), vec2f(0.0));
    // 原始直角保持直角；只有原矩形存在圆角时，内外半径才跟随边框偏移。
    let outerRadius = select(0.0, originalRadius + outward, originalRadius > 0.0);
    let innerRadius = select(0.0, max(originalRadius - inward, 0.0), originalRadius > 0.0);
    let outerDistance = RoundedRectDistance(input.localPosition, outerHalfSize, outerRadius);
    let innerDistance = RoundedRectDistance(input.localPosition, innerHalfSize, innerRadius);
    let hasInner = innerHalfSize.x > 0.0 && innerHalfSize.y > 0.0;

    if (outerDistance > 0.0) {
        discard;
    }

    if (materialUniform.solid.y > 0.0 && (!hasInner || innerDistance >= 0.0)) {
        outputColor = materialUniform.sdfBorderColor;
    }

    // opacity 作用于包含贴图在内的最终输出，而不是修改背景颜色本身。
    outputColor.a *= materialUniform.solid.x;
    // 透明空洞不写颜色或深度；半透明仍由材质混合与深度开关决定。
    if (outputColor.a <= 0.0) { discard; }
    return outputColor;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialUniform = materialStyles[input.instanceIndex];
    let geometrySize = max(vec2f(geometryUniform.width, geometryUniform.height), vec2f(0.000001));
    let fillUv = input.localPosition / geometrySize + vec2f(0.5);
    // vertexType 在三角面内不插值，但不同图元仍可能进入不同分支。
    // 导数在分支前统一求值，再使用 textureSampleGrad，避免非一致控制流中的隐式导数报错。
    let fillDx = dpdx(fillUv);
    let fillDy = dpdy(fillUv);
    let uvDx = dpdx(input.uv);
    let uvDy = dpdy(input.uv);
    if (input.vertexType == 0.0) {
        if (materialUniform.enabled.x == 0.0) { discard; }
        return ShadeRect(input, textureSampleGrad(textureMap, textureSampler, fillUv, i32(materialUniform.textureLayers.x), fillDx, fillDy), materialUniform);
    }
    var color: vec4f;
    var opacity: f32;
    if (input.vertexType == 0.5) {
        if (materialUniform.enabled.z == 0.0) { discard; }
        color = textureSampleGrad(edgeTexture, edgeSampler, input.uv, i32(materialUniform.textureLayers.y), uvDx, uvDy) * materialUniform.edgeColor;
        opacity = materialUniform.edge.x;
    } else {
        if (materialUniform.enabled.w == 0.0) { discard; }
        color = textureSampleGrad(pointsTexture, pointsSampler, input.uv, i32(materialUniform.textureLayers.z), uvDx, uvDy) * materialUniform.pointsColor;
        opacity = materialUniform.points.x;
    }
    let alpha = color.a * opacity;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
