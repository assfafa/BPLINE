import type { Material2d } from "../global-types";
import lineFragmentShader from "../Material/shaders/line/fragment.shader?raw";
import lineVertexShader from "../Material/shaders/line/vertex.shader?raw";
import type Scene from "../Scene";
import SamplerManager from "./SamplerManager";
import TextureManager from "./TextureManager";
import type { PipelineLike, PipelineTemplateLike } from "./types";

interface PipelineManagerLike {
    initResources(device: GPUDevice): void;
    draw(scene: Scene): void;
}

/**
 * 管理 BindGroupLayout、Sampler 和可复用的 GPURenderPipeline 模板。
 * @class
 */
class PipelineManager implements PipelineManagerLike {
    private readonly pipeline: PipelineLike;
    private readonly textureManager: TextureManager;
    private readonly samplerManager: SamplerManager;

    /**
     * 创建管线管理器。
     * @param pipeline 当前 Render 的共享管线资源
     * @param textureManager 贴图管理器
     * @param samplerManager Sampler 管理器
     */
    public constructor(
        pipeline: PipelineLike,
        textureManager: TextureManager,
        samplerManager: SamplerManager,
    ) {
        this.pipeline = pipeline;
        this.textureManager = textureManager;
        this.samplerManager = samplerManager;
    }

    /**
     * 创建当前 Render 共用的 Layout 和后备贴图。
     * @param device 当前 Render 对应的 WebGPU 设备
     * @returns 无返回值
     */
    public initResources(device: GPUDevice): void {
        this.pipeline.defaultBindGroupLayout = device.createBindGroupLayout({
            label: "Default Matrix Bind Group Layout",
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                { binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
                { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
                { binding: 5, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
            ],
        });
        this.pipeline.baseMaterialBindGroupLayout = device.createBindGroupLayout({
            label: "BaseMaterial Bind Group Layout",
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d-array" } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
                // 三套贴图和寻址状态同时绑定，Shader 根据 vertexType 选择。
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d-array" } },
                { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
                { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float", viewDimension: "2d-array" } },
                { binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            ],
        });
        this.pipeline.fallbackTexture = this.textureManager.createFallbackTexture(device);
    }

    /**
     * 按 materialList 创建材质管线和采样器，几何类型组合由 Scene 维护。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public draw(scene: Scene): void {
        for (const material of scene.materialList) {
            this.samplerManager.get(material.style.solid.addressModeU, material.style.solid.addressModeV);
            this.samplerManager.get(material.style.edge.addressModeU, material.style.edge.addressModeV);
            this.samplerManager.get(material.style.points.addressModeU, material.style.points.addressModeV);
            for (const geometryType of scene.getMaterialGeometryTypes(material.id)) {
                const key: string = material.getPipelineKey(geometryType);
                if (this.pipeline.pipelineTemplates.has(key)) continue;
                const template = this.createPipelineTemplate(material, geometryType);
                if (template !== undefined) this.pipeline.pipelineTemplates.set(key, template);
            }
        }
    }

    /**
     * 按几何类型选择统一三角面 Shader，原生线框仍使用独立管线。
     * 未支持的几何不会误用矩形 Shader。
     * @param material 材质状态和源码集合
     * @param geometryType Geometry.type
     * @returns 模板，设备或 Layout 未就绪时为 undefined
     */
    private createPipelineTemplate(material: Material2d, geometryType: string): PipelineTemplateLike | undefined {
        const device = this.pipeline.device;
        const format = this.pipeline.format;
        const defaultBindGroupLayout = this.pipeline.defaultBindGroupLayout;
        const materialBindGroupLayout = this.pipeline.baseMaterialBindGroupLayout;
        if (device === undefined || format === undefined || defaultBindGroupLayout === undefined || materialBindGroupLayout === undefined) {
            return undefined;
        }
        const layout: GPUPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [defaultBindGroupLayout, materialBindGroupLayout],
        });
        const blend: GPUBlendState | undefined = material.transparent ? {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
        } : undefined;

        /**
         * 创建一套图元管线，顶点缓冲槽位顺序由 attributes 决定。
         * @param label 调试标签
         * @param vertex 顶点源码
         * @param fragment 片元源码
         * @param topology 图元类型
         * @param attributes 顶点属性布局
         * @returns 已创建的管线，源码未提供时为 undefined
         */
        const CreatePipeline = (
            label: string,
            vertex: string | undefined,
            fragment: string | undefined,
            topology: GPUPrimitiveTopology,
            attributes: GPUVertexBufferLayout[],
        ): GPURenderPipeline | undefined => {
            if (vertex === undefined || fragment === undefined) {
                return undefined;
            }
            return device.createRenderPipeline({
                label,
                layout,
                vertex: {
                    module: device.createShaderModule({ code: vertex }),
                    entryPoint: "main",
                    buffers: attributes,
                },
                fragment: {
                    module: device.createShaderModule({ code: fragment }),
                    entryPoint: "main",
                    targets: [{ format, blend }],
                },
                depthStencil: {
                    format: "depth32float",
                    depthWriteEnabled: material.depthWrite,
                    // 同一实例的面/边框/点共享深度，equal 允许后绘制分区覆盖前面的分区。
                    depthCompare: material.depthTest ? "less-equal" : "always",
                },
                primitive: {
                    topology,
                    // 现有 2D 几何采用顺时针三角面；line-list 不剔除面。
                    frontFace: "cw",
                    cullMode: topology === "line-list" ? "none" : material.cullMode,
                },
            });
        };

        const vectorAttributes: GPUVertexBufferLayout[] = [0, 1, 2].map((location: number): GPUVertexBufferLayout => ({
            arrayStride: 8,
            attributes: [{ shaderLocation: location, offset: 0, format: "float32x2" }],
        }));
        let renderPipeline: GPURenderPipeline | undefined;
        if (geometryType === "Rect2d" || geometryType === "Poly2D") {
            const polygon: boolean = geometryType === "Poly2D";
            renderPipeline = CreatePipeline(
                polygon ? "BaseMaterial Poly Pipeline" : "BaseMaterial Rect Pipeline",
                polygon ? material.polyVertexShader : material.rectVertexShader,
                polygon ? material.polyFragmentShader : material.rectFragmentShader,
                "triangle-list", [
                    ...vectorAttributes,
                    { arrayStride: 4, attributes: [{ shaderLocation: 3, offset: 0, format: "float32" }] },
                    { arrayStride: 8, attributes: [{ shaderLocation: 4, offset: 0, format: "float32x2" }] },
                    { arrayStride: 4, attributes: [{ shaderLocation: 5, offset: 0, format: "float32" }] },
                ],
            );
        }
        const lineRenderPipeline = CreatePipeline("Line Pipeline", lineVertexShader, lineFragmentShader, "line-list", [
            vectorAttributes[0], vectorAttributes[2],
        ]);

        return {
            key: material.getPipelineKey(geometryType),
            renderPipeline,
            lineRenderPipeline,
            defaultBindGroupLayout,
            materialBindGroupLayout,
        };
    }
}

export default PipelineManager;
export type { PipelineManagerLike };
