import type { GeoData } from "../Geometry";
import type { Material2d } from "../global-types";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import type { TextureResource } from "../Texture/Layers";
import type {
    GeometryBufferLike,
    GeometryBufferPartLike,
    PipelineLike,
    SceneResourcesLike,
} from "./types";

interface DestroyManagerLike {
    destroyMesh(mesh: MeshLike | number): boolean;
    destroyTexture(texture: TextureResource | number): boolean;
    destroyMaterial(material: Material2d | number): boolean;
    destroyGeometry(geometry: GeoData | number): boolean;
    trim(scene: Scene): void;
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
     */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
    }

    /**
     * 销毁指定 Mesh 的模型矩阵缓冲及可取得的关联资源。
     * @param mesh Mesh 对象或全局 ID
     * @returns 是否销毁了任意资源
     */
    public destroyMesh(mesh: MeshLike | number): boolean {
        const meshId: number = typeof mesh === "number" ? mesh : mesh.id;
        const matrixBuffer = this.pipeline.buffers.meshMatrix.get(meshId);
        let destroyed: boolean = false;

        if (matrixBuffer !== undefined) {
            matrixBuffer.buffer.destroy();
            this.pipeline.buffers.meshMatrix.delete(meshId);
            destroyed = true;
        }

        const depthBuffer = this.pipeline.buffers.meshDepth.get(meshId);
        if (depthBuffer !== undefined) {
            depthBuffer.buffer.destroy();
            this.pipeline.buffers.meshDepth.delete(meshId);
            destroyed = true;
        }
        const styleBuffer = this.pipeline.buffers.meshStyle.get(meshId);
        if (styleBuffer !== undefined) {
            styleBuffer.buffer.destroy();
            this.pipeline.buffers.meshStyle.delete(meshId);
            destroyed = true;
        }

        if (typeof mesh !== "number") {
            for (const texture of mesh.textures) {
                if (texture !== undefined) destroyed = this.destroyTexture(texture) || destroyed;
            }
            if (mesh.data !== undefined) {
                destroyed = this.destroyGeometry(mesh.data) || destroyed;
            }
            if (mesh.material !== undefined) {
                destroyed = this.destroyMaterial(mesh.material) || destroyed;
            }
        }

        return destroyed;
    }

    /**
     * 销毁指定 Texture 的 GPUTexture 缓存。
     * @param texture Texture 对象或全局 ID
     * @returns 是否找到并销毁了对应资源
     */
    public destroyTexture(texture: TextureResource | number): boolean {
        const textureId: number = typeof texture === "number" ? texture : texture.id;
        let destroyed: boolean = false;
        for (const [id, resource] of this.pipeline.textures) {
            if (id !== textureId && !resource.sourceIds?.has(textureId)) continue;
            this.releaseTextureBindings(resource.view);
            resource.texture.destroy();
            this.pipeline.textures.delete(id);
            destroyed = true;
        }
        return destroyed;
    }

    /**
     * 销毁所有关联此 Material 的 Mesh 实例样式缓冲，并在可取得对象时销毁其基础、边框和点型贴图。
     * @param material Material 对象或全局 ID
     * @returns 是否销毁了任意资源
     */
    public destroyMaterial(material: Material2d | number): boolean {
        const materialId: number = typeof material === "number" ? material : material.id;
        let destroyed: boolean = false;
        for (const [meshId, styleBuffer] of this.pipeline.buffers.meshStyle) {
            if (styleBuffer.materialId !== materialId) continue;
            styleBuffer.buffer.destroy();
            this.pipeline.buffers.meshStyle.delete(meshId);
            destroyed = true;
        }

        if (typeof material !== "number") {
            const textureIds: Set<number> = new Set<number>();

            if (material.style.solid.texture !== undefined) {
                textureIds.add(material.style.solid.texture.id);
                destroyed = this.destroyTexture(material.style.solid.texture) || destroyed;
            }
            if (material.style.edge.texture !== undefined && !textureIds.has(material.style.edge.texture.id)) {
                textureIds.add(material.style.edge.texture.id);
                destroyed = this.destroyTexture(material.style.edge.texture) || destroyed;
            }
            if (material.style.points.texture !== undefined && !textureIds.has(material.style.points.texture.id)) {
                destroyed = this.destroyTexture(material.style.points.texture) || destroyed;
            }
        }

        return destroyed;
    }

    /**
     * 销毁指定 Geometry 的全部 GPUBuffer。
     * @param geometry Geometry 对象或全局 ID
     * @returns 是否找到并销毁了对应资源
     */
    public destroyGeometry(geometry: GeoData | number): boolean {
        const geometryId: number = typeof geometry === "number" ? geometry : geometry.id;
        const geometryBuffer: GeometryBufferLike | undefined = this.pipeline.buffers.geometry.get(geometryId);

        if (geometryBuffer === undefined) {
            return false;
        }

        this.destroyGeometryBuffer(geometryBuffer);
        this.pipeline.buffers.geometry.delete(geometryId);
        return true;
    }

    /**
     * 更新场景资源使用记录并回收所有场景均未引用的缓存。
     * @param scene 需要同步资源记录的场景
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

        for (const mesh of scene.drawList) sceneResources.meshIds.add(mesh.id);
        for (const geometry of scene.geometryList) sceneResources.geometryIds.add(geometry.id);
        for (const material of scene.materialList) {
            sceneResources.materialIds.add(material.id);
        }
        for (const mesh of scene.drawList) {
            if (mesh.data !== undefined && mesh.material !== undefined) {
                sceneResources.pipelineKeys.add(mesh.material.getPipelineKey(mesh.data.type));
            }
        }
        for (const texture of scene.textureList) sceneResources.textureIds.add(texture.id);

        this.pipeline.sceneResources.set(scene.id, sceneResources);

        const usedResources: SceneResourcesLike = {
            version: 0,
            meshIds: new Set<number>(),
            geometryIds: new Set<number>(),
            materialIds: new Set<number>(),
            textureIds: new Set<number>(),
            pipelineKeys: new Set<string>(),
        };

        for (const resources of this.pipeline.sceneResources.values()) {
            for (const id of resources.meshIds) usedResources.meshIds.add(id);
            for (const id of resources.geometryIds) usedResources.geometryIds.add(id);
            for (const id of resources.materialIds) usedResources.materialIds.add(id);
            for (const id of resources.textureIds) usedResources.textureIds.add(id);
            for (const key of resources.pipelineKeys) usedResources.pipelineKeys.add(key);
        }

        for (const matrixBuffer of this.pipeline.buffers.meshMatrix.values()) {
            if (!usedResources.meshIds.has(matrixBuffer.meshId)) this.destroyMesh(matrixBuffer.meshId);
        }
        for (const meshId of this.pipeline.buffers.meshDepth.keys()) {
            if (!usedResources.meshIds.has(meshId)) this.destroyMesh(meshId);
        }
        for (const geometryId of this.pipeline.buffers.geometry.keys()) {
            if (!usedResources.geometryIds.has(geometryId)) this.destroyGeometry(geometryId);
        }
        for (const meshId of this.pipeline.buffers.meshStyle.keys()) {
            if (!usedResources.meshIds.has(meshId)) this.destroyMesh(meshId);
        }
        for (const [textureId, texture] of this.pipeline.textures) {
            // trim 只清理这个资源；源图单层缓存闲置不代表其他层组也闲置。
            if (!usedResources.textureIds.has(textureId)) {
                this.releaseTextureBindings(texture.view);
                texture.texture.destroy();
                this.pipeline.textures.delete(textureId);
            }
        }
        for (const pipelineKey of this.pipeline.pipelineTemplates.keys()) {
            if (!usedResources.pipelineKeys.has(pipelineKey)) {
                // GPURenderPipeline 没有 destroy()，删除引用后交由浏览器回收。
                this.pipeline.pipelineTemplates.delete(pipelineKey);
            }
        }
    }

    /**
     * 销毁当前 Render 持有的全部 WebGPU 资源和设备。
     * @returns 无返回值
     */
    public destroyAll(): void {
        const device: GPUDevice | undefined = this.pipeline.device;

        this.pipeline.context?.unconfigure();

        for (const matrixBuffer of this.pipeline.buffers.meshMatrix.values()) matrixBuffer.buffer.destroy();
        // 全量销毁先清绑定，后续逐个释放几何时无需再扫描这些 Mesh。
        this.pipeline.buffers.meshMatrix.clear();
        for (const depthBuffer of this.pipeline.buffers.meshDepth.values()) depthBuffer.buffer.destroy();
        this.pipeline.depthTexture?.texture.destroy();
        this.pipeline.depthTexture = undefined;
        this.pipeline.buffers.meshDepth.clear();
        for (const geometryBuffer of this.pipeline.buffers.geometry.values()) {
            this.destroyGeometryBuffer(geometryBuffer);
        }
        for (const materialBuffer of this.pipeline.buffers.meshStyle.values()) materialBuffer.buffer.destroy();
        for (const cameraBuffer of this.pipeline.buffers.cameraUniform) cameraBuffer.destroy();
        for (const textureResource of this.pipeline.textures.values()) textureResource.texture.destroy();

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
     * @returns 无返回值
     */
    private destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void {
        // BindGroup 没有 destroy()，解除引用即可；避免保留已销毁几何的绑定。
        for (const entry of this.pipeline.buffers.meshMatrix.values()) {
            if (entry.bindGroup?.geometry === geometryBuffer.uniform) entry.bindGroup = undefined;
        }
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
     */
    private releaseTextureBindings(view: GPUTextureView): void {
        for (const entry of this.pipeline.buffers.meshStyle.values()) {
            const binding = entry.bindGroup;
            if (binding?.baseView === view || binding?.edgeView === view || binding?.pointsView === view) {
                entry.bindGroup = undefined;
            }
        }
    }
}

export default DestroyManager;
export type { DestroyManagerLike };
