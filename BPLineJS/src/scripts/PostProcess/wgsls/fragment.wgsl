@group(1) @binding(1) var postInput: texture_2d_array<f32>;
@group(1) @binding(2) var postSampler: sampler;

// UV 与普通材质一致，原点在左下；输入和返回值均为非预乘 RGBA。
fn sampleInput(uv: vec2f) -> vec4f {
    return textureSampleLevel(postInput, postSampler, uv, 0, 0.0);
}

fn inputResolution() -> vec2f {
    return vec2f(textureDimensions(postInput));
}

fn resolution() -> vec2f {
    return value_postResolution;
}

fn texelSize() -> vec2f {
    return vec2f(1.0) / inputResolution();
}
