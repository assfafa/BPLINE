/** Complete vertex module: deform local vertices and project to screen space. */
export const vertexShader = `struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};
@vertex
fn main(@location(0) position: vec2f, @location(1) uv: vec2f) -> VertexOutput {
    var output: VertexOutput;
    let offset = sin(value_time + position.y * 0.025) * value_strength * 35.0;
    output.position = vec4f((position + vec2f(offset, 0.0)) / value_viewport * 2.0, 0.0, 1.0);
    output.uv = uv;
    return output;
}`;

/** Complete fragment module; named values are declared by WGSLMaterial. */
export const fragmentShader = `@fragment
fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let pulse = 0.65 + 0.25 * sin(value_time);
    return vec4f(uv.x * pulse, 0.35 + uv.y * 0.4, 0.85, 1.0);
}`;
