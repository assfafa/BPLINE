struct PostVertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

// 单个三角形覆盖全屏，忽略相机位置、旋转和缩放。
@vertex fn main(@location(0) position: vec2f) -> PostVertexOutput {
    var output: PostVertexOutput;
    output.position = vec4f(position, 0.0, 1.0);
    output.uv = position * 0.5 + 0.5;
    return output;
}
