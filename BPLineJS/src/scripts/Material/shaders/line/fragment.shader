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
@group(1) @binding(0) var<storage, read> materialStyles: array<MaterialUniform>;

@fragment
fn main(@location(0) @interpolate(flat) instanceIndex: u32) -> @location(0) vec4f {
    let materialUniform = materialStyles[instanceIndex];
    if (materialUniform.enabled.y == 0.0) { discard; }
    let color = materialUniform.wireframeColor;
    let alpha = color.a * materialUniform.wireframe.x;
    if (alpha <= 0.0) { discard; }
    return vec4f(color.rgb, alpha);
}
