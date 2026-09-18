import type Scene from "../Scene";
import type { TextureLike, TextureSource } from "../Texture";
import TextureLayers from "../Texture/Layers";
import type { GPUTextureResourceLike, PipelineLike } from "./types";
interface TextureManagerLike {
    /**
     * 创建或同步本次渲染所需的资源。
     * @param scene 当前场景，按资源自己的版本更新，不清除共享版本
     * @example
     * textureManager.draw(scene);
     * @returns 无返回值。
     */
    draw(scene: Scene): void;
    /**
     * 创建缺省白色贴图，使未提供图片的材质仍有有效绑定。
     * @param device 当前设备
     * @example
     * textureManager.createFallbackTexture(device);
     * @returns 只有一层的白色后备贴图
     */
    createFallbackTexture(device: GPUDevice): GPUTextureResourceLike;
}
/** 按 textureList 上传图片；单张图片和多层图片统一使用 2d-array 视图。 */
class TextureManager implements TextureManagerLike {
    private readonly pipeline: PipelineLike;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param pipeline Render 资源
     * @example
     * const textureManager = new TextureManager(pipeline);
     * @returns 创建的 TextureManager 对象。
     */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
    }
    /**
     * 创建或同步本次渲染所需的资源。
     * @param scene 当前场景，按资源自己的版本更新，不清除共享版本
     * @example
     * textureManager.draw(scene);
     * @returns 无返回值。
     */
    public draw(scene: Scene): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
        if (device === undefined) {
            return;
        } else {
            // 逐项处理贴图来源，保留图层顺序与样式层号的对应关系。
            for (const resource of scene.textureList) {
                const cached = this.pipeline.textures.get(resource.id);
                // 比较当前版本与处理快照，只同步尚未处理的变化。
                if (cached?.version !== resource.version) {
                    let layers;
                    // 区分输入数据形态，使用与实际类型匹配的处理方式。
                    if (resource instanceof TextureLayers) {
                        layers = resource.layers;
                    } else {
                        layers = [resource];
                    }
                    // 按贴图加载状态决定能否上传，未就绪来源保留缺省资源。
                    if (layers.length !== 0 && (resource instanceof TextureLayers || IsReady(resource))) {
                        const created = this.createTexture(device, resource.id, resource.version, layers);
                        // 新资源全部创建成功后才释放旧资源，失败不会留下一个“已上传”的假快照。
                        this.releaseTexture(cached);
                        this.pipeline.textures.set(resource.id, created);
                    } else {
                        // 无效单图只移除自己的视图，不能反复误删其他仍使用此源的层组。
                        this.releaseTexture(cached);
                        this.pipeline.textures.delete(resource.id);
                        continue;
                    }
                } else {
                    continue;
                }
            }
        }
    }
    /**
     * 创建缺省白色贴图，使未提供图片的材质仍有有效绑定。
     * @param device 当前设备
     * @example
     * textureManager.createFallbackTexture(device);
     * @returns 只有一层的白色后备贴图
     */
    public createFallbackTexture(device: GPUDevice): GPUTextureResourceLike {
        return this.createTexture(device, -1, 0, [undefined]);
    }
    /**
     * 释放旧纹理及引用其视图的绑定缓存，重建时不会误用旧视图。
     * @param resource 被替换或失效的纹理资源
     * @example
     * this.releaseTexture(resource);
     * @returns 无返回值。
     */
    private releaseTexture(resource: GPUTextureResourceLike | undefined): void {
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (resource !== undefined) {
            // 遍历当前缓存条目，按实际引用关系处理资源。
            for (const entry of this.pipeline.buffers.meshStyle.values()) {
                const binding = entry.bindGroup;
                // 绑定依赖的资源身份变化后使 BindGroup 失效，下一次绘制重新绑定。
                if (
                    binding?.baseView === resource.view ||
                    binding?.edgeView === resource.view ||
                    binding?.pointsView === resource.view
                ) {
                    entry.bindGroup = undefined;
                }
            }
            resource.texture.destroy();
        } else {
            return;
        }
    }
    /**
     * 层号由 CPU 层表决定，空源和 loading 都写白色，不能跳过层造成编号错位。
     * 同组图片统一到最大宽高，缩放整张图片，不裁切 UV。
     * @param device 当前设备
     * @param textureId 数组资源 ID
     * @param version 本次上传版本
     * @param layers 有序图片，单图长度为 1
     * @example
     * this.createTexture(device, textureId, version, layers);
     * @returns 完整纹理资源
     */
    private createTexture(
        device: GPUDevice,
        textureId: number,
        version: number,
        layers: readonly (TextureLike | undefined)[],
    ): GPUTextureResourceLike {
        let width: number = 1;
        let height: number = 1;
        const sourceIds = new Set<number>();
        // 逐项处理贴图来源，保留图层顺序与样式层号的对应关系。
        for (const image of layers) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (image !== undefined) {
                sourceIds.add(image.id);
            }
            // 按贴图加载状态决定能否上传，未就绪来源保留缺省资源。
            if (IsReady(image)) {
                width = Math.max(width, image.width);
                height = Math.max(height, image.height);
            }
        }
        // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
        if (layers.length > device.limits.maxTextureArrayLayers) {
            throw new RangeError("Texture layers exceed maxTextureArrayLayers.");
        }
        // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
        if (width > device.limits.maxTextureDimension2D || height > device.limits.maxTextureDimension2D) {
            throw new RangeError("Texture dimensions exceed maxTextureDimension2D.");
        }
        let label: string = "Texture " + String(textureId);
        // 缺省白图使用独立调试标签，与用户贴图缓存区分。
        if (textureId === -1) {
            label = "Fallback White Texture";
        }
        const texture = device.createTexture({
            label,
            size: { width, height, depthOrArrayLayers: layers.length },
            format: "rgba8unorm",
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        try {
            let staging: OffscreenCanvas | undefined;
            // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
            for (let layer = 0; layer < layers.length; layer++) {
                const image = layers[layer];
                let source: TextureSource | null;
                // 按贴图加载状态决定能否上传，未就绪来源保留缺省资源。
                if (IsReady(image)) {
                    source = image.source;
                } else {
                    source = null;
                }
                const destination: GPUCopyExternalImageDestInfo = {
                    texture,
                    origin: { x: 0, y: 0, z: layer },
                };
                const extent: GPUExtent3DDict = { width, height, depthOrArrayLayers: 1 };
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (source !== null || width !== 1 || height !== 1) {
                    const imageData: boolean =
                        typeof ImageData !== "undefined" && source instanceof ImageData;
                    // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                    if (source === null || imageData || image?.width !== width || image.height !== height) {
                        staging ??= new OffscreenCanvas(width, height);
                        const context = staging.getContext("2d");
                        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
                        if (context === null) {
                            throw new Error("Cannot create texture normalization canvas.");
                        }
                        context.clearRect(0, 0, width, height);
                        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                        if (source === null) {
                            context.fillStyle = "#ffffff";
                            context.fillRect(0, 0, width, height);
                        } else if (imageData) {
                            // ImageData 走字节上传；其他图片来源使用外部图像复制。
                            const pixels = source as ImageData;
                            const input = new OffscreenCanvas(pixels.width, pixels.height);
                            const inputContext = input.getContext("2d");
                            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                            if (inputContext === null) {
                                throw new Error("Cannot upload ImageData.");
                            }
                            inputContext.putImageData(pixels, 0, 0);
                            context.drawImage(input, 0, 0, width, height);
                        } else {
                            context.drawImage(source as HTMLImageElement | ImageBitmap, 0, 0, width, height);
                        }
                        device.queue.copyExternalImageToTexture(
                            { source: staging, flipY: true },
                            destination,
                            extent,
                        );
                    } else {
                        device.queue.copyExternalImageToTexture(
                            { source: source, flipY: true },
                            destination,
                            extent,
                        );
                        continue;
                    }
                } else {
                    device.queue.writeTexture(
                        destination,
                        new Uint8Array([255, 255, 255, 255]),
                        { bytesPerRow: 4, rowsPerImage: 1 },
                        extent,
                    );
                    continue;
                }
            }
            return {
                textureId,
                version,
                sourceIds,
                texture,
                view: texture.createView({ dimension: "2d-array" }),
            };
        } catch (error) {
            texture.destroy();
            throw error;
        }
    }
}
/**
 * 判断贴图是否已有可上传的有效来源。
 * @param image 源图
 * @example
 * IsReady(image);
 * @returns 是否具有可上传的有效源
 */
const IsReady = (image: TextureLike | undefined): image is TextureLike =>
    image !== undefined &&
    image.loaded &&
    image.source !== null &&
    Number.isInteger(image.width) &&
    Number.isInteger(image.height) &&
    image.width > 0 &&
    image.height > 0;
export default TextureManager;
export type { TextureManagerLike };
