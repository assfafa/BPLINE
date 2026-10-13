struct VertexOutput {
    @builtin(position) position: vec4f,
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let corners = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0),
    );
    var output: VertexOutput;
    output.position = vec4f(corners[vertexIndex], 0.99999994, 1.0);
    return output;
}
