import type Scene from "../Scene";
import type { TextureLike, TextureSource } from "../Texture";
import TextureLayers from "../Texture/Layers";
import type { GPUTextureResourceLike, PipelineLike } from "./types";

interface TextureManagerLike {
    draw(scene: Scene): void;
    createFallbackTexture(device: GPUDevice): GPUTextureResourceLike;
}

/** 按 textureList 上传图片；单张图片和多层图片统一使用 2d-array 视图。 */
class TextureManager implements TextureManagerLike {
    private readonly pipeline: PipelineLike;

    /** @param pipeline Render 资源 */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
    }

    /** @param scene 当前场景，按资源自己的版本更新，不清除共享版本 */
    public draw(scene: Scene): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        if (device === undefined) return;
        for (const resource of scene.textureList) {
            const cached = this.pipeline.textures.get(resource.id);
            if (cached?.version === resource.version) continue;
            const layers = resource instanceof TextureLayers ? resource.layers : [resource];
            if (layers.length === 0 || (!(resource instanceof TextureLayers) && !IsReady(resource))) {
                // 无效单图只移除自己的视图，不能反复误删其他仍使用此源的层组。
                this.releaseTexture(cached);
                this.pipeline.textures.delete(resource.id);
                continue;
            }
            const created = this.createTexture(device, resource.id, resource.version, layers);
            // 新资源全部创建成功后才释放旧资源，失败不会留下一个“已上传”的假快照。
            this.releaseTexture(cached);
            this.pipeline.textures.set(resource.id, created);
        }
    }

    /** @param device 当前设备 @returns 只有一层的白色后备贴图 */
    public createFallbackTexture(device: GPUDevice): GPUTextureResourceLike {
        return this.createTexture(device, -1, 0, [undefined]);
    }

    /**
     * 释放旧纹理及引用其视图的绑定缓存，重建时不会误用旧视图。
     * @param resource 被替换或失效的纹理资源
     */
    private releaseTexture(resource: GPUTextureResourceLike | undefined): void {
        if (resource === undefined) return;
        for (const entry of this.pipeline.buffers.meshStyle.values()) {
            const binding = entry.bindGroup;
            if (binding?.baseView === resource.view || binding?.edgeView === resource.view
                || binding?.pointsView === resource.view) entry.bindGroup = undefined;
        }
        resource.texture.destroy();
    }

    /**
     * 层号由 CPU 层表决定，空源和 loading 都写白色，不能跳过层造成编号错位。
     * 同组图片统一到最大宽高，缩放整张图片，不裁切 UV。
     * @param device 当前设备
     * @param textureId 数组资源 ID
     * @param version 本次上传版本
     * @param layers 有序图片，单图长度为 1
     * @returns 完整纹理资源
     */
    private createTexture(device: GPUDevice, textureId: number, version: number, layers: readonly (TextureLike | undefined)[]): GPUTextureResourceLike {
        let width: number = 1;
        let height: number = 1;
        const sourceIds = new Set<number>();
        for (const image of layers) {
            if (image !== undefined) sourceIds.add(image.id);
            if (IsReady(image)) {
                width = Math.max(width, image.width);
                height = Math.max(height, image.height);
            }
        }
        if (layers.length > device.limits.maxTextureArrayLayers) throw new RangeError("Texture layers exceed maxTextureArrayLayers.");
        if (width > device.limits.maxTextureDimension2D || height > device.limits.maxTextureDimension2D) {
            throw new RangeError("Texture dimensions exceed maxTextureDimension2D.");
        }
        const texture = device.createTexture({
            label: textureId === -1 ? "Fallback White Texture" : "Texture " + String(textureId),
            size: { width, height, depthOrArrayLayers: layers.length },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        try {
            let staging: OffscreenCanvas | undefined;
            for (let layer = 0; layer < layers.length; layer++) {
                const image = layers[layer];
                const source: TextureSource | null = IsReady(image) ? image.source : null;
                const destination: GPUCopyExternalImageDestInfo = { texture, origin: { x: 0, y: 0, z: layer } };
                const extent: GPUExtent3DDict = { width, height, depthOrArrayLayers: 1 };
                if (source === null && width === 1 && height === 1) {
                    device.queue.writeTexture(destination, new Uint8Array([255, 255, 255, 255]), { bytesPerRow: 4, rowsPerImage: 1 }, extent);
                    continue;
                }
                const imageData: boolean = typeof ImageData !== "undefined" && source instanceof ImageData;
                if (source !== null && !imageData && image?.width === width && image.height === height) {
                    device.queue.copyExternalImageToTexture({ source: source, flipY: true }, destination, extent);
                    continue;
                }
                staging ??= new OffscreenCanvas(width, height);
                const context = staging.getContext("2d");
                if (context === null) throw new Error("Cannot create texture normalization canvas.");
                context.clearRect(0, 0, width, height);
                if (source === null) {
                    context.fillStyle = "#ffffff";
                    context.fillRect(0, 0, width, height);
                } else if (imageData) {
                    const pixels = source as ImageData;
                    const input = new OffscreenCanvas(pixels.width, pixels.height);
                    const inputContext = input.getContext("2d");
                    if (inputContext === null) throw new Error("Cannot upload ImageData.");
                    inputContext.putImageData(pixels, 0, 0);
                    context.drawImage(input, 0, 0, width, height);
                } else {
                    context.drawImage(source as HTMLImageElement | ImageBitmap, 0, 0, width, height);
                }
                device.queue.copyExternalImageToTexture({ source: staging, flipY: true }, destination, extent);
            }
            return { textureId, version, sourceIds, texture, view: texture.createView({ dimension: "2d-array" }) };
        } catch (error) {
            texture.destroy();
            throw error;
        }
    }
}

/** @param image 源图 @returns 是否具有可上传的有效源 */
const IsReady = (image: TextureLike | undefined): image is TextureLike => image !== undefined
    && image.loaded && image.source !== null && Number.isInteger(image.width) && Number.isInteger(image.height)
    && image.width > 0 && image.height > 0;

export default TextureManager;
export type { TextureManagerLike };
