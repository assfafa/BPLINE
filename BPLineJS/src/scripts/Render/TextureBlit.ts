/** Render 私有的全屏纹理转换；统一离屏采样方向、Alpha 以及 IMesh 层尺寸。 */
class TextureBlit {
    private readonly _device: GPUDevice;
    private readonly _layout: GPUBindGroupLayout;
    private readonly _sampler: GPUSampler;
    private readonly _pipelines = new Map<string, GPURenderPipeline>();
    private _bindings = new WeakMap<GPUTextureView, GPUBindGroup>();

    /** @param device 所属 Render 的设备 @example const blit = new TextureBlit(device); @returns 转换器。 */
    public constructor(device: GPUDevice) {
        this._device = device;
        this._layout = device.createBindGroupLayout({ entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: "2d" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        ] });
        this._sampler = device.createSampler({ minFilter: "linear", magFilter: "linear" });
    }

    /** @param encoder 本次命令编码器 @param source 输入的二维视图 @param target 输出的二维附件 @param format 输出格式 @param normalize 是否翻转 Y 并将预乘颜色还原为普通纹理颜色 @example blit.encode(encoder, source, target, "rgba8unorm", true); @returns 无返回值，仅编码不提交。 */
    public encode(encoder: GPUCommandEncoder, source: GPUTextureView, target: GPUTextureView, format: GPUTextureFormat, normalize: boolean | "data" = false): void {
        const key = format + ":" + String(normalize);
        let pipeline = this._pipelines.get(key);
        // 输出格式和转换方式决定管线，纹理内容变化不需要重新编译。
        if (pipeline === undefined) {
            let transform = "return textureSample(sourceTexture, sourceSampler, input.uv);";
            // 材质贴图统一为左下原点和非预乘 Alpha，避免重复混合变暗。
            if (normalize === "data") {
                transform = "return textureSample(sourceTexture, sourceSampler, vec2f(input.uv.x, 1.0 - input.uv.y));";
            } else {
                // 普通颜色目标仍还原 Alpha。
                if (normalize) {
                    transform = `let color = textureSample(sourceTexture, sourceSampler, vec2f(input.uv.x, 1.0 - input.uv.y));
    if (color.a > 0.0) { return vec4f(color.rgb / color.a, color.a); }
    return vec4f(0.0);`;
                }
            }
            const module = this._device.createShaderModule({ code: BLIT_SHADER + "\n@fragment fn fragmentMain(input: Output) -> @location(0) vec4f {\n" + transform + "\n}" });
            pipeline = this._device.createRenderPipeline({
                layout: this._device.createPipelineLayout({ bindGroupLayouts: [this._layout] }),
                vertex: { module, entryPoint: "vertexMain" },
                fragment: { module, entryPoint: "fragmentMain", targets: [{ format }] },
                primitive: { topology: "triangle-list" },
            });
            this._pipelines.set(key, pipeline);
        }
        let binding = this._bindings.get(source);
        // 同一纹理视图沿用绑定，resize 后的新视图自然获得新绑定。
        if (binding === undefined) {
            binding = this._device.createBindGroup({ layout: this._layout, entries: [
                { binding: 0, resource: source }, { binding: 1, resource: this._sampler },
            ] });
            this._bindings.set(source, binding);
        }
        const pass = encoder.beginRenderPass({ colorAttachments: [{
            view: target, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store",
        }] });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, binding);
        pass.draw(3);
        pass.end();
    }

    /** @example blit.destroy(); @returns 无返回值，解除管线和绑定引用。 */
    public destroy(): void {
        this._pipelines.clear();
        this._bindings = new WeakMap();
    }
}

const BLIT_SHADER = `
@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;
struct Output { @builtin(position) position: vec4f, @location(0) uv: vec2f };
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Output {
    let xy = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
    var output: Output;
    output.position = vec4f(xy * 2.0 - 1.0, 0.0, 1.0);
    output.uv = vec2f(xy.x, 1.0 - xy.y);
    return output;
}`;

export default TextureBlit;
