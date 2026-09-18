import type { Material2d } from "../global-types";
import lineFragmentShader from "../Material/wgsls/line/fragment.wgsl?raw";
import lineVertexShader from "../Material/wgsls/line/vertex.wgsl?raw";
import type Scene from "../Scene";
import SamplerManager from "./SamplerManager";
import TextureManager from "./TextureManager";
import type { PipelineLike, PipelineTemplateLike } from "./types";
interface PipelineManagerLike {
    /**
     * 创建当前 Render 共用的 Layout 和后备贴图。
     * @param device 当前 Render 对应的 WebGPU 设备
     * @example
     * pipelineManager.initResources(device);
     * @returns 无返回值
     */
    initResources(device: GPUDevice): void;
    /**
     * 按 materialList 创建材质管线和采样器，几何类型组合由 Scene 维护。
     * @param scene 场景对象
     * @example
     * pipelineManager.draw(scene);
     * @returns 无返回值
     */
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
     * @example
     * const pipelineManager = new PipelineManager(pipeline, textureManager, samplerManager);
     * @returns 创建的 PipelineManager 对象。
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
     * @example
     * pipelineManager.initResources(device);
     * @returns 无返回值
     */
    public initResources(device: GPUDevice): void {
        this.pipeline.defaultBindGroupLayout = device.createBindGroupLayout({
            label: "Default Matrix Bind Group Layout",
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
                { binding: 5, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
            ],
        });
        this.pipeline.baseMaterialBindGroupLayout = device.createBindGroupLayout({
            label: "BaseMaterial Bind Group Layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: { type: "read-only-storage" },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float", viewDimension: "2d-array" },
                },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
                // 三套贴图和寻址状态同时绑定，Shader 根据 vertexType 选择。
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float", viewDimension: "2d-array" },
                },
                { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float", viewDimension: "2d-array" },
                },
                { binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            ],
        });
        this.pipeline.fallbackTexture = this.textureManager.createFallbackTexture(device);
    }
    /**
     * 按 materialList 创建材质管线和采样器，几何类型组合由 Scene 维护。
     * @param scene 场景对象
     * @example
     * pipelineManager.draw(scene);
     * @returns 无返回值
     */
    public draw(scene: Scene): void {
        // 按去重后的材质列表处理共享状态。
        for (const material of scene.materialList) {
            this.samplerManager.get(material.style.solid.addressModeU, material.style.solid.addressModeV);
            this.samplerManager.get(material.style.edge.addressModeU, material.style.edge.addressModeV);
            this.samplerManager.get(material.style.points.addressModeU, material.style.points.addressModeV);
            // 逐项处理 scene.getMaterialGeometryTypes(material.id)，保持集合中的既定顺序。
            for (const geometryType of scene.getMaterialGeometryTypes(material.id)) {
                const key: string = material.getPipelineKey(geometryType);
                // 检查集合中的关联关系，避免重复处理或遗漏引用。
                if (!this.pipeline.pipelineTemplates.has(key)) {
                    const template = this.createPipelineTemplate(material, geometryType);
                    // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                    if (template !== undefined) {
                        this.pipeline.pipelineTemplates.set(key, template);
                    }
                } else {
                    continue;
                }
            }
        }
    }
    /**
     * 按几何类型选择统一三角面 Shader，原生线框仍使用独立管线。
     * 未支持的几何不会误用矩形 Shader。
     * @param material 材质状态和源码集合
     * @param geometryType Geometry.type
     * @example
     * this.createPipelineTemplate(material, geometryType);
     * @returns 模板，设备或 Layout 未就绪时为 undefined
     */
    private createPipelineTemplate(
        material: Material2d,
        geometryType: string,
    ): PipelineTemplateLike | undefined {
        const device = this.pipeline.device;
        const format = this.pipeline.format;
        const defaultBindGroupLayout = this.pipeline.defaultBindGroupLayout;
        const materialBindGroupLayout = this.pipeline.baseMaterialBindGroupLayout;
        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
        if (
            device !== undefined &&
            format !== undefined &&
            defaultBindGroupLayout !== undefined &&
            materialBindGroupLayout !== undefined
        ) {
            const layout: GPUPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [defaultBindGroupLayout, materialBindGroupLayout],
            });
            let blend: GPUBlendState | undefined;
            // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
            if (material.transparent) {
                blend = {
                    color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                    alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
                };
            } else {
                blend = undefined;
            }
            /**
             * 创建一套图元管线，顶点缓冲槽位顺序由 attributes 决定。
             * @param label 调试标签
             * @param vertex 顶点源码
             * @param fragment 片元源码
             * @param topology 图元类型
             * @param attributes 顶点属性布局
             * @example
             * CreatePipeline(label, vertex, fragment, topology, attributes);
             * @returns 已创建的管线，源码未提供时为 undefined
             */
            const CreatePipeline = (
                label: string,
                vertex: string | undefined,
                fragment: string | undefined,
                topology: GPUPrimitiveTopology,
                attributes: GPUVertexBufferLayout[],
            ): GPURenderPipeline | undefined => {
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (vertex !== undefined && fragment !== undefined) {
                    let depthCompare: GPUCompareFunction = "always";
                    // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
                    if (material.depthTest) {
                        depthCompare = "less-equal";
                    }
                    let cullMode: GPUCullMode = material.cullMode;
                    // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                    if (topology === "line-list") {
                        cullMode = "none";
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
                            depthCompare,
                        },
                        primitive: {
                            topology,
                            // 现有 2D 几何采用顺时针三角面；line-list 不剔除面。
                            frontFace: "cw",
                            cullMode,
                        },
                    });
                } else {
                    return undefined;
                }
            };
            /**
             * 为二维向量属性生成八字节步长的顶点缓冲布局。
             * @param location 顶点属性槽位
             * @example
             * CreateVectorAttribute(location);
             * @returns 指定槽位的顶点属性布局。
             */
            const CreateVectorAttribute = (location: number): GPUVertexBufferLayout => ({
                arrayStride: 8,
                attributes: [{ shaderLocation: location, offset: 0, format: "float32x2" }],
            });
            const vectorAttributes: GPUVertexBufferLayout[] = [0, 1, 2].map(CreateVectorAttribute);
            let renderPipeline: GPURenderPipeline | undefined;
            const shaders: Partial<
                Record<
                    string,
                    {
                        vertex: string | undefined;
                        fragment: string | undefined;
                    }
                >
            > = {
                Rect2D: { vertex: material.rectVertexShader, fragment: material.rectFragmentShader },
                Poly2D: { vertex: material.polyVertexShader, fragment: material.polyFragmentShader },
                NGon2D: { vertex: material.ngonVertexShader, fragment: material.ngonFragmentShader },
            };
            const shader = shaders[geometryType];
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (shader !== undefined) {
                renderPipeline = CreatePipeline(
                    "BaseMaterial " + geometryType + " Pipeline",
                    shader.vertex,
                    shader.fragment,
                    "triangle-list",
                    [
                        ...vectorAttributes,
                        { arrayStride: 4, attributes: [{ shaderLocation: 3, offset: 0, format: "float32" }] },
                        {
                            arrayStride: 8,
                            attributes: [{ shaderLocation: 4, offset: 0, format: "float32x2" }],
                        },
                        { arrayStride: 4, attributes: [{ shaderLocation: 5, offset: 0, format: "float32" }] },
                    ],
                );
            }
            const lineRenderPipeline = CreatePipeline(
                "Line Pipeline",
                lineVertexShader,
                lineFragmentShader,
                "line-list",
                [vectorAttributes[0], vectorAttributes[2]],
            );
            return {
                key: material.getPipelineKey(geometryType),
                renderPipeline,
                lineRenderPipeline,
                defaultBindGroupLayout,
                materialBindGroupLayout,
            };
        } else {
            return undefined;
        }
    }
}
export default PipelineManager;
export type { PipelineManagerLike };
