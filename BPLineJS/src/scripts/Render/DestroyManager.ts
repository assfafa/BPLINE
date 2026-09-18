import type { GeoData } from "../Geometry";
import type { Material2d } from "../global-types";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import type { TextureResource } from "../Texture/Layers";
import type { GeometryBufferLike, GeometryBufferPartLike, PipelineLike, SceneResourcesLike } from "./types";
interface DestroyManagerLike {
    /**
     * 销毁指定 Mesh 的模型矩阵缓冲及可取得的关联资源。
     * @param mesh Mesh 对象或全局 ID
     * @example
     * destroyManager.destroyMesh(mesh);
     * @returns 是否销毁了任意资源
     */
    destroyMesh(mesh: MeshLike | number): boolean;
    /**
     * 销毁指定 Texture 的 GPUTexture 缓存。
     * @param texture Texture 对象或全局 ID
     * @example
     * destroyManager.destroyTexture(texture);
     * @returns 是否找到并销毁了对应资源
     */
    destroyTexture(texture: TextureResource | number): boolean;
    /**
     * 销毁所有关联此 Material 的 Mesh 实例样式缓冲，并在可取得对象时销毁其基础、边框和点型贴图。
     * @param material Material 对象或全局 ID
     * @example
     * destroyManager.destroyMaterial(material);
     * @returns 是否销毁了任意资源
     */
    destroyMaterial(material: Material2d | number): boolean;
    /**
     * 销毁指定 Geometry 的全部 GPUBuffer。
     * @param geometry Geometry 对象或全局 ID
     * @example
     * destroyManager.destroyGeometry(geometry);
     * @returns 是否找到并销毁了对应资源
     */
    destroyGeometry(geometry: GeoData | number): boolean;
    /**
     * 更新场景资源使用记录并回收所有场景均未引用的缓存。
     * @param scene 需要同步资源记录的场景
     * @example
     * destroyManager.trim(scene);
     * @returns 无返回值
     */
    trim(scene: Scene): void;
    /**
     * 销毁当前 Render 持有的全部 WebGPU 资源和设备。
     * @example
     * destroyManager.destroyAll();
     * @returns 无返回值
     */
    destroyAll(): void;
}
/**
 * 统一负责当前 Render 的 GPU 资源销毁与无引用缓存回收。
 * @class
 */
class DestroyManager implements DestroyManagerLike {
    private readonly pipeline: PipelineLike;
    /**
     * 创建销毁管理器。
     * @param pipeline 当前 Render 的共享管线资源
     * @example
     * const destroyManager = new DestroyManager(pipeline);
     * @returns 创建的 DestroyManager 对象。
     */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
    }
    /**
     * 销毁指定 Mesh 的模型矩阵缓冲及可取得的关联资源。
     * @param mesh Mesh 对象或全局 ID
     * @example
     * destroyManager.destroyMesh(mesh);
     * @returns 是否销毁了任意资源
     */
    public destroyMesh(mesh: MeshLike | number): boolean {
        let meshId: number;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof mesh === "number") {
            meshId = mesh;
        } else {
            meshId = mesh.id;
        }
        const matrixBuffer = this.pipeline.buffers.meshMatrix.get(meshId);
        let destroyed: boolean = false;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (matrixBuffer !== undefined) {
            matrixBuffer.buffer.destroy();
            this.pipeline.buffers.meshMatrix.delete(meshId);
            destroyed = true;
        }
        const depthBuffer = this.pipeline.buffers.meshDepth.get(meshId);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (depthBuffer !== undefined) {
            depthBuffer.buffer.destroy();
            this.pipeline.buffers.meshDepth.delete(meshId);
            destroyed = true;
        }
        const styleBuffer = this.pipeline.buffers.meshStyle.get(meshId);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (styleBuffer !== undefined) {
            styleBuffer.buffer.destroy();
            this.pipeline.buffers.meshStyle.delete(meshId);
            destroyed = true;
        }
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof mesh !== "number") {
            // 遍历当前缓存条目，按实际引用关系处理资源。
            for (const texture of mesh.textures) {
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (texture !== undefined) {
                    destroyed = this.destroyTexture(texture) || destroyed;
                }
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (mesh.data !== undefined) {
                destroyed = this.destroyGeometry(mesh.data) || destroyed;
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (mesh.material !== undefined) {
                destroyed = this.destroyMaterial(mesh.material) || destroyed;
            }
        }
        return destroyed;
    }
    /**
     * 销毁指定 Texture 的 GPUTexture 缓存。
     * @param texture Texture 对象或全局 ID
     * @example
     * destroyManager.destroyTexture(texture);
     * @returns 是否找到并销毁了对应资源
     */
    public destroyTexture(texture: TextureResource | number): boolean {
        let textureId: number;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof texture === "number") {
            textureId = texture;
        } else {
            textureId = texture.id;
        }
        let destroyed: boolean = false;
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const [id, resource] of this.pipeline.textures) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (id === textureId || resource.sourceIds?.has(textureId)) {
                this.releaseTextureBindings(resource.view);
                resource.texture.destroy();
                this.pipeline.textures.delete(id);
                destroyed = true;
            } else {
                continue;
            }
        }
        return destroyed;
    }
    /**
     * 销毁所有关联此 Material 的 Mesh 实例样式缓冲，并在可取得对象时销毁其基础、边框和点型贴图。
     * @param material Material 对象或全局 ID
     * @example
     * destroyManager.destroyMaterial(material);
     * @returns 是否销毁了任意资源
     */
    public destroyMaterial(material: Material2d | number): boolean {
        let materialId: number;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof material === "number") {
            materialId = material;
        } else {
            materialId = material.id;
        }
        let destroyed: boolean = false;
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const [meshId, styleBuffer] of this.pipeline.buffers.meshStyle) {
            // 只销毁关联当前材质的实例样式缓冲，不影响其他材质。
            if (styleBuffer.materialId === materialId) {
                styleBuffer.buffer.destroy();
                this.pipeline.buffers.meshStyle.delete(meshId);
                destroyed = true;
            } else {
                continue;
            }
        }
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof material !== "number") {
            const textureIds: Set<number> = new Set<number>();
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (material.style.solid.texture !== undefined) {
                textureIds.add(material.style.solid.texture.id);
                destroyed = this.destroyTexture(material.style.solid.texture) || destroyed;
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (
                material.style.edge.texture !== undefined &&
                !textureIds.has(material.style.edge.texture.id)
            ) {
                textureIds.add(material.style.edge.texture.id);
                destroyed = this.destroyTexture(material.style.edge.texture) || destroyed;
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (
                material.style.points.texture !== undefined &&
                !textureIds.has(material.style.points.texture.id)
            ) {
                destroyed = this.destroyTexture(material.style.points.texture) || destroyed;
            }
        }
        return destroyed;
    }
    /**
     * 销毁指定 Geometry 的全部 GPUBuffer。
     * @param geometry Geometry 对象或全局 ID
     * @example
     * destroyManager.destroyGeometry(geometry);
     * @returns 是否找到并销毁了对应资源
     */
    public destroyGeometry(geometry: GeoData | number): boolean {
        let geometryId: number;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof geometry === "number") {
            geometryId = geometry;
        } else {
            geometryId = geometry.id;
        }
        const geometryBuffer: GeometryBufferLike | undefined = this.pipeline.buffers.geometry.get(geometryId);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometryBuffer === undefined) {
            return false;
        } else {
            this.destroyGeometryBuffer(geometryBuffer);
            this.pipeline.buffers.geometry.delete(geometryId);
            return true;
        }
    }
    /**
     * 更新场景资源使用记录并回收所有场景均未引用的缓存。
     * @param scene 需要同步资源记录的场景
     * @example
     * destroyManager.trim(scene);
     * @returns 无返回值
     */
    public trim(scene: Scene): void {
        scene.ensureLists();
        const sceneResources: SceneResourcesLike = {
            version: scene.version,
            meshIds: new Set<number>(),
            geometryIds: new Set<number>(),
            materialIds: new Set<number>(),
            textureIds: new Set<number>(),
            pipelineKeys: new Set<string>(),
        };
        // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
        for (const mesh of scene.drawList) {
            sceneResources.meshIds.add(mesh.id);
        }
        // 每个共享几何只处理一次，避免多个 Mesh 重复创建同一资源。
        for (const geometry of scene.geometryList) {
            sceneResources.geometryIds.add(geometry.id);
        }
        // 按去重后的材质列表处理共享状态。
        for (const material of scene.materialList) {
            sceneResources.materialIds.add(material.id);
        }
        // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
        for (const mesh of scene.drawList) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (mesh.data !== undefined && mesh.material !== undefined) {
                sceneResources.pipelineKeys.add(mesh.material.getPipelineKey(mesh.data.type));
            }
        }
        // 逐项处理贴图来源，保留图层顺序与样式层号的对应关系。
        for (const texture of scene.textureList) {
            sceneResources.textureIds.add(texture.id);
        }
        this.pipeline.sceneResources.set(scene.id, sceneResources);
        const usedResources: SceneResourcesLike = {
            version: 0,
            meshIds: new Set<number>(),
            geometryIds: new Set<number>(),
            materialIds: new Set<number>(),
            textureIds: new Set<number>(),
            pipelineKeys: new Set<string>(),
        };
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const resources of this.pipeline.sceneResources.values()) {
            // 逐项处理 resources.meshIds，保持集合中的既定顺序。
            for (const id of resources.meshIds) {
                usedResources.meshIds.add(id);
            }
            // 逐项处理 resources.geometryIds，保持集合中的既定顺序。
            for (const id of resources.geometryIds) {
                usedResources.geometryIds.add(id);
            }
            // 逐项处理 resources.materialIds，保持集合中的既定顺序。
            for (const id of resources.materialIds) {
                usedResources.materialIds.add(id);
            }
            // 逐项处理 resources.textureIds，保持集合中的既定顺序。
            for (const id of resources.textureIds) {
                usedResources.textureIds.add(id);
            }
            // 逐项处理 resources.pipelineKeys，保持集合中的既定顺序。
            for (const key of resources.pipelineKeys) {
                usedResources.pipelineKeys.add(key);
            }
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const matrixBuffer of this.pipeline.buffers.meshMatrix.values()) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (!usedResources.meshIds.has(matrixBuffer.meshId)) {
                this.destroyMesh(matrixBuffer.meshId);
            }
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const meshId of this.pipeline.buffers.meshDepth.keys()) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (!usedResources.meshIds.has(meshId)) {
                this.destroyMesh(meshId);
            }
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const geometryId of this.pipeline.buffers.geometry.keys()) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (!usedResources.geometryIds.has(geometryId)) {
                this.destroyGeometry(geometryId);
            }
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const meshId of this.pipeline.buffers.meshStyle.keys()) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (!usedResources.meshIds.has(meshId)) {
                this.destroyMesh(meshId);
            }
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const [textureId, texture] of this.pipeline.textures) {
            // trim 只清理这个资源；源图单层缓存闲置不代表其他层组也闲置。
            if (!usedResources.textureIds.has(textureId)) {
                this.releaseTextureBindings(texture.view);
                texture.texture.destroy();
                this.pipeline.textures.delete(textureId);
            }
        }
        // 逐项处理 this.pipeline.pipelineTemplates.keys()，保持集合中的既定顺序。
        for (const pipelineKey of this.pipeline.pipelineTemplates.keys()) {
            // 检查集合中的关联关系，避免重复处理或遗漏引用。
            if (!usedResources.pipelineKeys.has(pipelineKey)) {
                // GPURenderPipeline 没有 destroy()，删除引用后交由浏览器回收。
                this.pipeline.pipelineTemplates.delete(pipelineKey);
            }
        }
    }
    /**
     * 销毁当前 Render 持有的全部 WebGPU 资源和设备。
     * @example
     * destroyManager.destroyAll();
     * @returns 无返回值
     */
    public destroyAll(): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        this.pipeline.context?.unconfigure();
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const matrixBuffer of this.pipeline.buffers.meshMatrix.values()) {
            matrixBuffer.buffer.destroy();
        }
        // 全量销毁先清绑定，后续逐个释放几何时无需再扫描这些 Mesh。
        this.pipeline.buffers.meshMatrix.clear();
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const depthBuffer of this.pipeline.buffers.meshDepth.values()) {
            depthBuffer.buffer.destroy();
        }
        this.pipeline.depthTexture?.texture.destroy();
        this.pipeline.depthTexture = undefined;
        this.pipeline.buffers.meshDepth.clear();
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const geometryBuffer of this.pipeline.buffers.geometry.values()) {
            this.destroyGeometryBuffer(geometryBuffer);
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const materialBuffer of this.pipeline.buffers.meshStyle.values()) {
            materialBuffer.buffer.destroy();
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const cameraBuffer of this.pipeline.buffers.cameraUniform) {
            cameraBuffer.destroy();
        }
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const textureResource of this.pipeline.textures.values()) {
            textureResource.texture.destroy();
        }
        this.pipeline.fallbackTexture?.texture.destroy();
        this.pipeline.buffers.geometry.clear();
        this.pipeline.buffers.meshStyle.clear();
        this.pipeline.buffers.cameraUniform.length = 0;
        this.pipeline.textures.clear();
        this.pipeline.samplers.clear();
        this.pipeline.pipelineTemplates.clear();
        this.pipeline.sceneResources.clear();
        this.pipeline.adapter = undefined;
        this.pipeline.device = undefined;
        this.pipeline.context = undefined;
        this.pipeline.format = undefined;
        this.pipeline.defaultBindGroupLayout = undefined;
        this.pipeline.baseMaterialBindGroupLayout = undefined;
        this.pipeline.fallbackTexture = undefined;
        device?.destroy();
    }
    /**
     * 销毁 Geometry 所有绘制模式已经创建的全部缓冲。
     * @param geometryBuffer Geometry GPU 缓存集合
     * @example
     * this.destroyGeometryBuffer(geometryBuffer);
     * @returns 无返回值
     */
    private destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void {
        // BindGroup 没有 destroy()，解除引用即可；避免保留已销毁几何的绑定。
        for (const entry of this.pipeline.buffers.meshMatrix.values()) {
            // 几何 uniform 被销毁时同步清除引用它的 BindGroup 缓存。
            if (entry.bindGroup?.geometry === geometryBuffer.uniform) {
                entry.bindGroup = undefined;
            }
        }
        /**
         * 释放当前几何分区已经创建的 GPU 缓冲。
         * @param part 当前几何分区
         * @example
         * DestroyPart(part);
         * @returns 无返回值。
         */
        const DestroyPart = (part: GeometryBufferPartLike | undefined): void => {
            part?.vertex.destroy();
            part?.normal.destroy();
            part?.uv.destroy();
            part?.index.destroy();
            part?.miterScale?.destroy();
            part?.position?.destroy();
            part?.vertexType?.destroy();
        };
        DestroyPart(geometryBuffer.geometry);
        DestroyPart(geometryBuffer.linePoints);
        geometryBuffer.uniform.destroy();
    }
    /**
     * 解除引用某个纹理视图的缓存绑定，不影响其他 Mesh。
     * @param view 即将销毁的 GPU 纹理视图
     * @example
     * this.releaseTextureBindings(view);
     * @returns 无返回值。
     */
    private releaseTextureBindings(view: GPUTextureView): void {
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const entry of this.pipeline.buffers.meshStyle.values()) {
            const binding = entry.bindGroup;
            // 绑定依赖的资源身份变化后使 BindGroup 失效，下一次绘制重新绑定。
            if (binding?.baseView === view || binding?.edgeView === view || binding?.pointsView === view) {
                entry.bindGroup = undefined;
            }
        }
    }
}
export default DestroyManager;
export type { DestroyManagerLike };
