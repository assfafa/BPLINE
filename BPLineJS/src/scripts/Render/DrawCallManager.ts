import type { Material2d } from "../global-types";
import IMesh from "../IMesh";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import Texture from "../Texture";
import RenderTarget from "../RenderTarget";
import RenderTargetManager from "./RenderTargetManager";
import TextureManager from "./TextureManager";
import { GetTargetPipelineKey } from "./PipelineManager";
import DepthManager from "./DepthManager";
import SamplerManager from "./SamplerManager";
import type { GeometryBufferLike, PipelineLike, PipelineTemplateLike } from "./types";

/**
 * 负责编码 BindGroup、DrawCall 并向 GPUQueue 提交命令。
 * @class
 */
class DrawCallManager implements DrawCallManagerLike {
    private readonly pipeline: PipelineLike;
    private readonly samplerManager: SamplerManager;
    private readonly depthManager: DepthManager;
    private readonly targetManager: RenderTargetManager;
    private readonly textureManager: TextureManager;
    /**
     * 创建 DrawCall 管理器。
     * @param pipeline 当前 Render 的共享管线资源
     * @param samplerManager Sampler 管理器
     * @param targetManager 离屏附件管理器
     * @param textureManager 图片和离屏层上传管理器
     * @example
     * const drawCallManager = new DrawCallManager(pipeline, samplerManager);
     * @returns 创建的 DrawCallManager 对象。
     */
    public constructor(pipeline: PipelineLike, samplerManager: SamplerManager, targetManager: RenderTargetManager = new RenderTargetManager(pipeline), textureManager: TextureManager = new TextureManager(pipeline, targetManager)) {
        this.targetManager = targetManager;
        this.textureManager = textureManager;
        this.pipeline = pipeline;
        this.depthManager = new DepthManager(pipeline);
        this.samplerManager = samplerManager;
    }
    /**
     * warmup 只创建深度附件，不提交绘制。
     * @param width 画布物理像素宽度
     * @param height 画布物理像素高度
     * @param target 离屏目标；null 表示 Canvas
     * @example
     * drawCallManager.prepare(width, height);
     * @returns 无返回值。
     */
    public prepare(width: number, height: number, target: RenderTarget | null = null): void {
        // 目标各自持有深度附件，切换尺寸不反复重建 Canvas 深度纹理。
        if (target !== null) {
            this.targetManager.ensure(target);
        } else {
            this.depthManager.ensureTexture(width, height);
        }
    }
    /**
     * 编码并提交当前场景的基础绘制命令。
     * @param scene 场景对象
     * @param backgroundColor 清空画布使用的 RGBA 颜色
     * @param alphaMode Canvas Alpha 合成方式
     * @param output 离屏目标；null 表示 Canvas
     * @param selection 可选遮罩过滤；null 为普通绘制
     * @param occlude 遮罩模式下仍绘制其他物体，按其真实覆盖擦除本组
     * @example
     * drawCallManager.draw(scene, backgroundColor, alphaMode);
     * @returns 无返回值
     */
    public draw(scene: Scene, backgroundColor: GPUColorDict, alphaMode: GPUCanvasAlphaMode, output: RenderTarget | null = null, selection: DrawSelection | null = null, occlude: boolean = false): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        const context: GPUCanvasContext | undefined = this.pipeline.context;
        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
        if (device !== undefined && (context !== undefined || output !== null)) {
            // 直接调用 drawCall 的使用者也不能创建隐式反馈读写。
            if (output !== null) {
                this.targetManager.validateInputs(scene.textureList, output);
            }
            const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
            this.textureManager.encodeTargets(commandEncoder, scene);
            let target: GPUTexture;
            let depth;
            let format = this.pipeline.format;
            // Canvas 和离屏目标共享绘制逻辑，附件及输出格式由本次调用决定。
            if (output !== null) {
                const resource = this.targetManager.ensure(output);
                target = resource.color;
                depth = resource.depth;
                format = output.format;
                alphaMode = "premultiplied";
            } else if (context !== undefined) {
                // Canvas 输出使用浏览器本帧提供的纹理。
                target = context.getCurrentTexture();
                depth = this.depthManager.ensureTexture(target.width, target.height);
            } else {
                throw new Error("Render canvas context is unavailable.");
            }
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
                let drawList = scene.getRenderDrawList();
                // 遮罩从场景所有对象中过滤；视口外边缘可参与局部效果，不改写 Scene 列表。
                if (selection !== null) {
                    // Bloom 需要完整的原始顺序；普通遮罩维持只绘制本组的行为。
                    if (occlude) {
                        drawList = scene.drawList;
                    } else {
                        /** @param mesh 候选对象 @example Selected(mesh); @returns 是否属于当前效果组。 */
                        const Selected = (mesh: MeshLike): boolean => selection.has(mesh.id);
                        drawList = scene.drawList.filter(Selected);
                    }
                }
                /** @param mesh 当前提交对象 @example SelectedInstances(mesh); @returns null 表示整批发光，空数组表示整批遮挡，其余是发光槽位。 */
                const SelectedInstances = (mesh: MeshLike): readonly number[] | null => {
                    // 非本组对象在普通遮罩中已被过滤，只在保留遮挡时传入空集合。
                    if (occlude && selection?.has(mesh.id) === false) {
                        return [];
                    } else {
                        return selection?.get(mesh.id) ?? null;
                    }
                };
                // 只反向提交可安全提前写深度的不透明对象，drawList 本身不重排。
                for (let index = drawList.length - 1; index >= 0; index--) {
                    const mesh = drawList[index];
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
                            format,
                            output !== null && output.data === false,
                            SelectedInstances(mesh),
                            occlude,
                        );
                    }
                }
                // 透明 / 不写深度对象仍按原始后→前顺序，测试已有的不透明深度。
                for (const mesh of drawList) {
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
                            format,
                            output !== null && output.data === false,
                            SelectedInstances(mesh),
                            occlude,
                        );
                    }
                }
                // 关闭测试意味着忽略世界遮挡：作为覆盖层最后绘制，层内仍遵循原队列顺序。
                for (const mesh of drawList) {
                    // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
                    if (mesh.material !== undefined && !mesh.material.depthTest) {
                        this.drawMesh(
                            device,
                            renderPass,
                            mesh,
                            viewBuffer,
                            orthogonalBuffer,
                            renderCameraBuffer,
                            format,
                            output !== null && output.data === false,
                            SelectedInstances(mesh),
                            occlude,
                        );
                    }
                }
                renderPass.end();
                // 在同一次提交中规范化采样结果，不经过 CPU 回读。
                if (output !== null) {
                    this.targetManager.finish(commandEncoder, output);
                }
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
     * @param format 当前颜色附件格式
     * @param offscreen 是否输出预乘离屏颜色
     * @param instances 可选实例槽位；null 为整批
     * @param occlude 是否让未入选槽位参与遮挡，而不是跳过它们
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
        format: GPUTextureFormat | undefined,
        offscreen: boolean,
        instances: readonly number[] | null = null,
        occlude: boolean = false,
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
                GetTargetPipelineKey(this.pipeline, material.getPipelineKey(geometry.type), format, offscreen),
            );
            let occluderTemplate: PipelineTemplateLike | undefined;
            // 变体使用相同 Shader 和布局，仅改变颜色/Alpha 混合，所有纹理透明边缘仍由原 Shader 决定。
            if (occlude) {
                occluderTemplate = this.pipeline.pipelineTemplates.get(
                    GetTargetPipelineKey(this.pipeline, material.getPipelineKey(geometry.type), format, offscreen, true),
                );
                // 遮挡不能静默退回普通颜色绘制，否则非发光物体会污染遮罩。
                if (occluderTemplate === undefined) {
                    throw new Error("Prepare occluder pipelines before drawing a visible mask.");
                }
            }
            const triangles = geometryBuffer.geometry;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (pipelineTemplate !== undefined) {
                let activeTemplate = pipelineTemplate;
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
                    // 具名值按材质布局绑定到第三组。
                    if (pipelineTemplate.customBindGroupLayout !== undefined) {
                        const customGroup = this.createCustomBindGroup(device, material, pipelineTemplate);
                        // 数值或纹理资源未就绪时跳过当前绘制。
                        if (customGroup === undefined) {
                            return;
                        }
                        renderPass.setBindGroup(2, customGroup);
                    }
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
                            activeTemplate.renderPipeline !== undefined
                        ) {
                            renderPass.setPipeline(activeTemplate.renderPipeline);
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
                    let selectedSlots: ReadonlySet<number> | null = null;
                    // 普通场景绘制不分配筛选集合，只为需要逐槽判断的遮罩创建查找表。
                    if (occlude && instances !== null) {
                        selectedSlots = new Set(instances);
                    }
                    const mixedOcclusion = selectedSlots !== null && selectedSlots.size > 0 && selectedSlots.size < mesh.count;
                    // 原生线框需要逐实例保持分区顺序，不能将所有实例分成独立的面层和线层。
                    if (hasLine || mixedOcclusion || (occlude === false && instances !== null)) {
                        amount = 1;
                    } else {
                        amount = mesh.count;
                    }
                    let starts: number[] | null = null;
                    // 深度写入管线反向读取槽位，筛选仍按用户的原始实例编号描述。
                    if (instances !== null && occlude === false) {
                        starts = [];
                        // 映射筛选的真实槽位到当前管线的提交编号。
                        for (const index of instances) {
                            let first = index;
                            // 与 DepthManager 的反向不透明提交保持一致。
                            if (mesh instanceof IMesh && material.depthTest && material.depthWrite && material.transparent === false) {
                                first = mesh.count - 1 - index;
                            }
                            starts.push(first);
                        }
                        starts.sort(CompareSlots);
                    }
                    // 每个入选槽位仍按实体面、原生线框、关键点的顺序提交。
                    for (let slot = 0; slot < (starts?.length ?? mesh.count); slot += amount) {
                        const first = starts?.[slot] ?? slot;
                        activeTemplate = pipelineTemplate;
                        // 混合 IMesh 必须在原实例序列中切换发光/遮挡，不能把两批分开绘制。
                        if (occlude && instances !== null && occluderTemplate !== undefined) {
                            let sourceSlot = first;
                            // 不透明深度写入的顶点 Shader 反向读取真实槽位。
                            if (mesh instanceof IMesh && material.depthTest && material.depthWrite && material.transparent === false) {
                                sourceSlot = mesh.count - 1 - first;
                            }
                            // 全非本组时仍保留实例批量提交；只有混合槽位逐实例切换变体。
                            if (selectedSlots?.has(sourceSlot) === false) {
                                activeTemplate = occluderTemplate;
                            }
                        }
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
                            activeTemplate.lineRenderPipeline !== undefined &&
                            geometryBuffer.linePoints !== undefined &&
                            geometry.linePoints !== undefined
                        ) {
                            renderPass.setPipeline(activeTemplate.lineRenderPipeline);
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
     * 绑定 group(2) 的具名数值和多张贴图；同名贴图更换只重建 BindGroup。
     * @param device 当前 WebGPU 设备
     * @param material 自定义材质
     * @param template 管线布局
     * @example
     * this.createCustomBindGroup(device, material, template);
     * @returns 自定义绑定组，数值资源未准备好时为 undefined。
     */
    private createCustomBindGroup(
        device: GPUDevice,
        material: Material2d,
        template: PipelineTemplateLike,
    ): GPUBindGroup | undefined {
        const layout = template.customBindGroupLayout;
        const values = material.values;
        const resources = this.pipeline.customValues.get(material.id);
        // 材质声明和值缓存都就绪后才能创建 group(2)。
        if (layout === undefined || values === undefined || resources === undefined) {
            return undefined;
        }
        const entries: GPUBindGroupEntry[] = [];
        const identities: unknown[] = [layout];
        // 保持 ShaderValues 声明和 Layout 相同的排序。
        for (const entry of values.entries) {
            // 一个 Texture 字段占纹理视图及采样器两个绑定。
            if (entry.kind === "texture" && (entry.value instanceof Texture || entry.value instanceof RenderTarget)) {
                const view = this.pipeline.textures.get(entry.value.id)?.view ?? this.pipeline.fallbackTexture?.view;
                const sampler = this.samplerManager.get("clamp-to-edge", "clamp-to-edge");
                // 首帧纹理未上传时允许先使用 Render 的白色回退视图。
                if (view === undefined || sampler === undefined) {
                    return undefined;
                }
                entries.push({ binding: entry.binding, resource: view });
                entries.push({ binding: entry.binding + 1, resource: sampler });
                identities.push(view, sampler);
            } else {
                const buffer = resources.buffers.get(entry.name)?.buffer;
                // 数值缓冲由 BufferManager 在绘制前上传。
                if (buffer === undefined) {
                    return undefined;
                }
                entries.push({ binding: entry.binding, resource: { buffer } });
                identities.push(buffer);
            }
        }
        let changed = resources.bindGroup === undefined || resources.layout !== layout;
        // 已缓存的组只在资源身份变化时需要重建。
        if (!changed && resources.resources !== undefined) {
            // 数量变化意味着声明布局发生变化。
            if (resources.resources.length !== identities.length) {
                changed = true;
            } else {
                // 比较 Layout、Buffer、TextureView 与 Sampler 的实际引用。
                for (let index = 0; index < identities.length; index += 1) {
                    // 任一资源被重新分配时创建新的 BindGroup。
                    if (resources.resources[index] === identities[index]) {
                        // 保持当前绑定身份。
                    } else {
                        changed = true;
                        break;
                    }
                }
            }
        }
        // GPUBuffer 内容写入不触发这里的资源身份变化。
        if (changed) {
            resources.bindGroup = device.createBindGroup({ layout, entries });
            resources.layout = layout;
            resources.resources = identities;
        }
        return resources.bindGroup;
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

interface DrawCallManagerLike {
    /**
     * warmup 只创建深度附件，不提交绘制。
     * @param width 画布物理像素宽度
     * @param height 画布物理像素高度
     * @param target 可选离屏输出配置
     * @example
     * drawCallManager.prepare(width, height);
     * @returns 无返回值。
     */
    prepare(width: number, height: number, target?: RenderTarget | null): void;
    /**
     * 编码并提交当前场景的基础绘制命令。
     * @param scene 场景对象
     * @param backgroundColor 清空画布使用的 RGBA 颜色
     * @param alphaMode Canvas Alpha 合成方式
     * @param output 可选离屏输出配置
     * @example
     * drawCallManager.draw(scene, backgroundColor, alphaMode);
     * @returns 无返回值
     */
    draw(scene: Scene, backgroundColor: GPUColorDict, alphaMode: GPUCanvasAlphaMode, output?: RenderTarget | null): void;
}

/** Mesh ID 映射到实例槽位；null 选择整个 Mesh。 */
type DrawSelection = ReadonlyMap<number, readonly number[] | null>;
/** @param left 左槽位 @param right 右槽位 @example CompareSlots(0, 1); @returns 原始提交次序。 */
const CompareSlots = (left: number, right: number): number => left - right;

export type { DrawSelection };
export default DrawCallManager;
export type { DrawCallManagerLike };
