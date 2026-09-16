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
// 当前 Geometry 的包围盒宽高、保留项与边框宽度，供后续 SDF 计算使用。
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

// 填充轮廓已由几何三角面决定。多边形边框走 vertexType=0.5，不使用矩形 SDF。
fn ShadePoly(textureColor: vec4f, materialUniform: MaterialUniform) -> vec4f {
    var color = textureColor * materialUniform.solidColor;
    color.a *= materialUniform.solid.x;
    if (color.a <= 0.0) { discard; }
    return color;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialUniform = materialStyles[input.instanceIndex];
    // 使用几何提供的 UV，允许非中心原点和自定义纹理坐标。
    let fillUv = input.uv;
    // vertexType 在三角面内不插值，但不同图元仍可能进入不同分支。
    // 导数在分支前统一求值，再使用 textureSampleGrad，避免非一致控制流中的隐式导数报错。
    let fillDx = dpdx(fillUv);
    let fillDy = dpdy(fillUv);
    let uvDx = dpdx(input.uv);
    let uvDy = dpdy(input.uv);
    if (input.vertexType == 0.0) {
        if (materialUniform.enabled.x == 0.0) { discard; }
        return ShadePoly(textureSampleGrad(textureMap, textureSampler, fillUv, i32(materialUniform.textureLayers.x), fillDx, fillDy), materialUniform);
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
