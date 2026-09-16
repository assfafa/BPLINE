
// 深度来自队列层级，而不是提交顺序。矩阵和样式数组不因倒序绘制而搬动。
struct DrawDepth {
    base: u32,
    count: u32,
    reverse: u32,
    _padding: u32,
};
@group(0) @binding(5) var<uniform> drawDepth: DrawDepth;

fn ResolveIndex(index: u32) -> u32 {
    return select(index, drawDepth.count - 1u - index, drawDepth.reverse != 0u);
}

fn GetDepth(index: u32) -> f32 {
    // 24 位整数除以 2^24，depth32float 可以精确表示；实际深度避开清空值 1。
    return 1.0 - f32(drawDepth.base + index + 1u) / 16777216.0;
}

struct VertexInput {
    @location(0) position: vec2f,
    @builtin(instance_index) instanceIndex: u32,
    // 当前 basic line 暂不使用法线，保留给后续线条效果。
    @location(2) normal: vec2f,
};

// linePoints 与标准三角面共用 Mesh 和 Camera 矩阵缓冲。
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) @interpolate(flat) instanceIndex: u32,
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
    // 保留入口 builtin 原值；用独立编号读取矩阵、样式并传给片段阶段。
    let resolvedIndex = ResolveIndex(input.instanceIndex);
    let modelMatrix = modelMatrices[resolvedIndex];
    let worldPosition = modelMatrix * vec3f(input.position, 1.0);
    let viewPosition = viewMatrix * worldPosition;
    let clipPosition = orthogonalMatrix * viewPosition;

    var output: VertexOutput;
    output.position = vec4f(clipPosition.xy, GetDepth(resolvedIndex), 1.0);
    output.instanceIndex = resolvedIndex;
    return output;
}
