import type { Material2d } from "../global-types";
import IMesh from "../IMesh";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import DepthManager from "./DepthManager";
import SamplerManager from "./SamplerManager";
import type { GeometryBufferLike, PipelineLike, PipelineTemplateLike } from "./types";
interface DrawCallManagerLike {
    /**
     * warmup 只创建深度附件，不提交绘制。
     * @param width 画布物理像素宽度
     * @param height 画布物理像素高度
     * @example
     * drawCallManager.prepare(width, height);
     * @returns 无返回值。
     */
    prepare(width: number, height: number): void;
    /**
     * 编码并提交当前场景的基础绘制命令。
     * @param scene 场景对象
     * @param backgroundColor 清空画布使用的 RGBA 颜色
     * @param alphaMode Canvas Alpha 合成方式
     * @example
     * drawCallManager.draw(scene, backgroundColor, alphaMode);
     * @returns 无返回值
     */
    draw(scene: Scene, backgroundColor: GPUColorDict, alphaMode: GPUCanvasAlphaMode): void;
}
/**
 * 负责编码 BindGroup、DrawCall 并向 GPUQueue 提交命令。
 * @class
 */
class DrawCallManager implements DrawCallManagerLike {
    private readonly pipeline: PipelineLike;
    private readonly samplerManager: SamplerManager;
    private readonly depthManager: DepthManager;
    /**
     * 创建 DrawCall 管理器。
     * @param pipeline 当前 Render 的共享管线资源
     * @param samplerManager Sampler 管理器
     * @example
     * const drawCallManager = new DrawCallManager(pipeline, samplerManager);
     * @returns 创建的 DrawCallManager 对象。
     */
    public constructor(pipeline: PipelineLike, samplerManager: SamplerManager) {
        this.pipeline = pipeline;
        this.depthManager = new DepthManager(pipeline);
        this.samplerManager = samplerManager;
    }
    /**
     * warmup 只创建深度附件，不提交绘制。
     * @param width 画布物理像素宽度
     * @param height 画布物理像素高度
     * @example
     * drawCallManager.prepare(width, height);
     * @returns 无返回值。
     */
    public prepare(width: number, height: number): void {
        this.depthManager.ensureTexture(width, height);
    }
    /**
     * 编码并提交当前场景的基础绘制命令。
     * @param scene 场景对象
     * @param backgroundColor 清空画布使用的 RGBA 颜色
     * @param alphaMode Canvas Alpha 合成方式
     * @example
     * drawCallManager.draw(scene, backgroundColor, alphaMode);
     * @returns 无返回值
     */
    public draw(scene: Scene, backgroundColor: GPUColorDict, alphaMode: GPUCanvasAlphaMode): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        const context: GPUCanvasContext | undefined = this.pipeline.context;
        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
        if (device !== undefined && context !== undefined) {
            const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
            const target: GPUTexture = context.getCurrentTexture();
            const depth = this.depthManager.ensureTexture(target.width, target.height);
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (depth !== undefined) {
                const textureView: GPUTextureView = target.createView();
                let clearValue: GPUColorDict;
                // 透明画布清屏颜色先预乘 alpha，避免与 HTML 合成时颜色过强。
                if (alphaMode === "premultiplied") {
                    clearValue = {
                        r: backgroundColor.r * backgroundColor.a,
                        g: backgroundColor.g * backgroundColor.a,
                        b: backgroundColor.b * backgroundColor.a,
                        a: backgroundColor.a,
                    };
                } else {
                    clearValue = backgroundColor;
                }
                const renderPass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: textureView,
                            clearValue,
                            loadOp: "clear",
                            storeOp: "store",
                        },
                    ],
                    depthStencilAttachment: {
                        view: depth.view,
                        depthClearValue: 1,
                        depthLoadOp: "clear",
                        depthStoreOp: "discard",
                    },
                });
                const viewBuffer: GPUBuffer = this.pipeline.buffers.cameraUniform[0];
                const orthogonalBuffer: GPUBuffer = this.pipeline.buffers.cameraUniform[1];
                const renderCameraBuffer: GPUBuffer = this.pipeline.buffers.cameraUniform[2];
                // 只反向提交可安全提前写深度的不透明对象，drawList 本身不重排。
                for (let index = scene.drawList.length - 1; index >= 0; index--) {
                    const mesh = scene.drawList[index];
                    const material = mesh.material;
                    // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
                    if (material?.depthTest && material.depthWrite && !material.transparent) {
                        this.drawMesh(
                            device,
                            renderPass,
                            mesh,
                            viewBuffer,
                            orthogonalBuffer,
                            renderCameraBuffer,
                        );
                    }
                }
                // 透明 / 不写深度对象仍按原始后→前顺序，测试已有的不透明深度。
                for (const mesh of scene.drawList) {
                    const material = mesh.material;
                    // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
                    if (material?.depthTest && (!material.depthWrite || material.transparent)) {
                        this.drawMesh(
                            device,
                            renderPass,
                            mesh,
                            viewBuffer,
                            orthogonalBuffer,
                            renderCameraBuffer,
                        );
                    }
                }
                // 关闭测试意味着忽略世界遮挡：作为覆盖层最后绘制，层内仍遵循原队列顺序。
                for (const mesh of scene.drawList) {
                    // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
                    if (mesh.material !== undefined && !mesh.material.depthTest) {
                        this.drawMesh(
                            device,
                            renderPass,
                            mesh,
                            viewBuffer,
                            orthogonalBuffer,
                            renderCameraBuffer,
                        );
                    }
                }
                renderPass.end();
                device.queue.submit([commandEncoder.finish()]);
            } else {
                return;
            }
        } else {
            return;
        }
    }
    /**
     * 编码单个 Mesh 的资源绑定与索引绘制命令。
     * @param device 当前 WebGPU 设备
     * @param renderPass 当前 RenderPass
     * @param mesh 当前 Mesh
     * @param viewBuffer 相机视图矩阵缓冲
     * @param orthogonalBuffer 相机投影矩阵缓冲
     * @param renderCameraBuffer Render 与 Camera 公共参数缓冲
     * @example
     * this.drawMesh(device, renderPass, mesh, viewBuffer, orthogonalBuffer, renderCameraBuffer);
     * @returns 无返回值
     */
    private drawMesh(
        device: GPUDevice,
        renderPass: GPURenderPassEncoder,
        mesh: MeshLike,
        viewBuffer: GPUBuffer,
        orthogonalBuffer: GPUBuffer,
        renderCameraBuffer: GPUBuffer,
    ): void {
        const geometry = mesh.data;
        const depthBuffer = this.pipeline.buffers.meshDepth.get(mesh.id);
        const material: Material2d | undefined = mesh.material;
        const matrixBuffer = this.pipeline.buffers.meshMatrix.get(mesh.id);
        let geometryBuffer: GeometryBufferLike | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometry === undefined) {
            geometryBuffer = undefined;
        } else {
            geometryBuffer = this.pipeline.buffers.geometry.get(geometry.id);
        }
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (
            depthBuffer !== undefined &&
            mesh.count !== 0 &&
            matrixBuffer !== undefined &&
            geometryBuffer !== undefined &&
            geometry !== undefined &&
            (geometry.style.solid.enabled ||
                geometry.style.edge.enabled ||
                geometry.style.wireframe.enabled ||
                geometry.style.points.enabled) &&
            material !== undefined
        ) {
            const pipelineTemplate: PipelineTemplateLike | undefined = this.pipeline.pipelineTemplates.get(
                material.getPipelineKey(geometry.type),
            );
            const triangles = geometryBuffer.geometry;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (pipelineTemplate !== undefined) {
                const materialBindGroup: GPUBindGroup | undefined = this.createMaterialBindGroup(
                    device,
                    mesh,
                    material,
                    pipelineTemplate,
                );
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (materialBindGroup !== undefined) {
                    // writeBuffer 只改变内容，不改变绑定对象。扩容、几何重建、布局更换才需重建绑定。
                    const layout = pipelineTemplate.defaultBindGroupLayout;
                    let binding = matrixBuffer.bindGroup;
                    // 绑定依赖的资源身份变化后使 BindGroup 失效，下一次绘制重新绑定。
                    if (
                        binding?.layout !== layout ||
                        binding.view !== viewBuffer ||
                        binding.projection !== orthogonalBuffer ||
                        binding.parameters !== renderCameraBuffer ||
                        binding.geometry !== geometryBuffer.uniform ||
                        binding.depth !== depthBuffer.buffer
                    ) {
                        binding = {
                            layout,
                            view: viewBuffer,
                            projection: orthogonalBuffer,
                            parameters: renderCameraBuffer,
                            geometry: geometryBuffer.uniform,
                            depth: depthBuffer.buffer,
                            group: device.createBindGroup({
                                layout,
                                entries: [
                                    { binding: 0, resource: { buffer: matrixBuffer.buffer } },
                                    { binding: 1, resource: { buffer: viewBuffer } },
                                    { binding: 2, resource: { buffer: orthogonalBuffer } },
                                    { binding: 3, resource: { buffer: renderCameraBuffer } },
                                    { binding: 4, resource: { buffer: geometryBuffer.uniform } },
                                    { binding: 5, resource: { buffer: depthBuffer.buffer } },
                                ],
                            }),
                        };
                        matrixBuffer.bindGroup = binding;
                    }
                    renderPass.setBindGroup(0, binding.group);
                    renderPass.setBindGroup(1, materialBindGroup);
                    const individualStyles: boolean = mesh instanceof IMesh;
                    const hasLine: boolean =
                        geometry.style.wireframe.enabled &&
                        (individualStyles || material.style.wireframe.enabled) &&
                        pipelineTemplate.lineRenderPipeline !== undefined &&
                        geometryBuffer.linePoints !== undefined &&
                        geometry.linePoints !== undefined;
                    const canDrawTriangles: boolean =
                        (geometry.style.solid.enabled &&
                            (individualStyles || material.style.solid.enabled)) ||
                        (geometry.style.edge.enabled && (individualStyles || material.style.edge.enabled)) ||
                        (geometry.style.points.enabled &&
                            (individualStyles || material.style.points.enabled));
                    /**
                     * 使用同一套合并顶点与材质资源绘制指定索引范围。
                     * @param firstIndex 起始索引，不是字节偏移
                     * @param count 本次索引数量
                     * @param first 起始实例编号，原生线框回退时用于保持整体顺序
                     * @param amount 本次绘制的实例条数
                     * @example
                     * DrawTriangles(firstIndex, count, first, amount);
                     * @returns 无返回值
                     */
                    const DrawTriangles = (
                        firstIndex: number,
                        count: number,
                        first: number,
                        amount: number,
                    ): void => {
                        // 区分空数据和有效内容，空集合不创建可绘制资源。
                        if (
                            canDrawTriangles &&
                            count !== 0 &&
                            triangles?.vertexType !== undefined &&
                            triangles.position !== undefined &&
                            triangles.miterScale !== undefined &&
                            pipelineTemplate.renderPipeline !== undefined
                        ) {
                            renderPass.setPipeline(pipelineTemplate.renderPipeline);
                            renderPass.setVertexBuffer(0, triangles.vertex);
                            renderPass.setVertexBuffer(1, triangles.uv);
                            renderPass.setVertexBuffer(2, triangles.normal);
                            renderPass.setVertexBuffer(3, triangles.miterScale);
                            renderPass.setVertexBuffer(4, triangles.position);
                            renderPass.setVertexBuffer(5, triangles.vertexType);
                            renderPass.setIndexBuffer(triangles.index, triangles.indexFormat);
                            renderPass.drawIndexed(count, amount, firstIndex, 0, first);
                        } else {
                            return;
                        }
                    };
                    // 原生线框是另一种 topology，按实例回退绘制，保留透明对象之间的完整层级。
                    // 只有合并三角面时仍是一次 drawIndexed(indexCount, count)。
                    let amount: number;
                    // 原生线框需要逐实例保持分区顺序，不能将所有实例分成独立的面层和线层。
                    if (hasLine) {
                        amount = 1;
                    } else {
                        amount = mesh.count;
                    }
                    // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
                    for (let first = 0; first < mesh.count; first += amount) {
                        const totalIndices: number = geometry.index?.length ?? 0;
                        const splitPoints: boolean =
                            hasLine &&
                            (individualStyles || material.style.points.enabled) &&
                            triangles !== undefined &&
                            triangles.pointsFirstIndex < totalIndices;
                        let firstCount: number;
                        // 原生线插在实体面与关键点之间时，按关键点起始索引拆分三角面绘制。
                        if (splitPoints) {
                            firstCount = triangles?.pointsFirstIndex ?? 0;
                        } else {
                            firstCount = totalIndices;
                        }
                        DrawTriangles(0, firstCount, first, amount);
                        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                        if (
                            hasLine &&
                            pipelineTemplate.lineRenderPipeline !== undefined &&
                            geometryBuffer.linePoints !== undefined &&
                            geometry.linePoints !== undefined
                        ) {
                            renderPass.setPipeline(pipelineTemplate.lineRenderPipeline);
                            renderPass.setVertexBuffer(0, geometryBuffer.linePoints.vertex);
                            renderPass.setVertexBuffer(1, geometryBuffer.linePoints.normal);
                            renderPass.setIndexBuffer(
                                geometryBuffer.linePoints.index,
                                geometryBuffer.linePoints.indexFormat,
                            );
                            renderPass.drawIndexed(geometry.linePoints.index.length, amount, 0, 0, first);
                        }
                        // line-list 不能与 triangle-list 放进同一次绘制；关键点仍最后覆盖线框。
                        if (splitPoints) {
                            DrawTriangles(firstCount, totalIndices - firstCount, first, amount);
                        }
                    }
                } else {
                    return;
                }
            } else {
                return;
            }
        } else {
            return;
        }
    }
    /**
     * 一次绑定 Mesh 实例样式 Storage 与三种几何的贴图，Sampler 各自独立。
     * @param device 当前 WebGPU 设备
     * @param mesh 当前 Mesh，提供独立实例样式缓冲
     * @param material 当前材质
     * @param pipelineTemplate 当前几何类型对应的 Pipeline 模板
     * @example
     * this.createMaterialBindGroup(device, mesh, material, pipelineTemplate);
     * @returns 材质 BindGroup，必要资源未就绪时返回 undefined
     */
    private createMaterialBindGroup(
        device: GPUDevice,
        mesh: MeshLike,
        material: Material2d,
        pipelineTemplate: PipelineTemplateLike,
    ): GPUBindGroup | undefined {
        const fallbackTexture = this.pipeline.fallbackTexture;
        const baseSampler = this.samplerManager.get(
            material.style.solid.addressModeU,
            material.style.solid.addressModeV,
        );
        const edgeSampler = this.samplerManager.get(
            material.style.edge.addressModeU,
            material.style.edge.addressModeV,
        );
        const pointsSampler = this.samplerManager.get(
            material.style.points.addressModeU,
            material.style.points.addressModeV,
        );
        const styleBuffer = this.pipeline.buffers.meshStyle.get(mesh.id);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (
            fallbackTexture !== undefined &&
            baseSampler !== undefined &&
            edgeSampler !== undefined &&
            pointsSampler !== undefined &&
            styleBuffer !== undefined
        ) {
            /**
             * 获取当前贴图视图，空源或尚未上传时使用白色后备资源。
             * @param texture CPU 贴图引用
             * @example
             * GetView(texture);
             * @returns 可绑定的纹理视图
             */
            const GetView = (texture: MeshLike["textures"][number]): GPUTextureView => {
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (texture === undefined) {
                    return fallbackTexture.view;
                } else {
                    return this.pipeline.textures.get(texture.id)?.view ?? fallbackTexture.view;
                }
            };
            const textures = mesh.textures;
            const baseView = GetView(textures[0]);
            const edgeView = GetView(textures[1]);
            const pointsView = GetView(textures[2]);
            const layout = pipelineTemplate.materialBindGroupLayout;
            let binding = styleBuffer.bindGroup;
            // 比较实际 GPU 引用而非材质版本：颜色、透明度变化只上传原缓冲即可。
            if (
                binding?.layout !== layout ||
                binding.baseView !== baseView ||
                binding.edgeView !== edgeView ||
                binding.pointsView !== pointsView ||
                binding.baseSampler !== baseSampler ||
                binding.edgeSampler !== edgeSampler ||
                binding.pointsSampler !== pointsSampler
            ) {
                binding = {
                    layout,
                    baseView,
                    edgeView,
                    pointsView,
                    baseSampler,
                    edgeSampler,
                    pointsSampler,
                    group: device.createBindGroup({
                        layout,
                        entries: [
                            { binding: 0, resource: { buffer: styleBuffer.buffer } },
                            { binding: 1, resource: baseView },
                            { binding: 2, resource: baseSampler },
                            { binding: 3, resource: edgeView },
                            { binding: 4, resource: edgeSampler },
                            { binding: 5, resource: pointsView },
                            { binding: 6, resource: pointsSampler },
                        ],
                    }),
                };
                styleBuffer.bindGroup = binding;
            }
            return binding.group;
        } else {
            return undefined;
        }
    }
}
export default DrawCallManager;
export type { DrawCallManagerLike };
