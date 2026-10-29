import RenderTarget from "../RenderTarget";
import type { TextureInput, TextureSubscriber } from "../Texture";
import TextureLayers from "../Texture/Layers";
import TextureBlit from "./TextureBlit";
import type { PipelineLike, RenderTargetResourceLike } from "./types";

/** 所有离屏 GPU 附件只属于一个 Render，不进入图片上传和自动 trim 生命周期。 */
class RenderTargetManager implements TextureSubscriber {
    private readonly _pipeline: PipelineLike;
    private _blit: TextureBlit | null = null;

    /** @param pipeline 所属 Render 的资源表 @example const manager = new RenderTargetManager(pipeline); @returns 资源管理器。 */
    public constructor(pipeline: PipelineLike) {
        this._pipeline = pipeline;
    }

    /** @example manager.blitter; @returns 延迟创建的 GPU 转换器。 */
    public get blitter(): TextureBlit {
        const device = this._pipeline.device;
        // 初始化完成后才允许创建 GPU 对象。
        if (device) {
            // 所有目标共享转换管线，不为每张纹理重复创建。
            this._blit ??= new TextureBlit(device);
            return this._blit;
        } else {
            throw new Error("Await render.ready before using RenderTarget.");
        }
    }

    /** @param target 离屏目标 @example manager.ensure(target); @returns 已匹配配置的附件；新目标采样内容透明。 */
    public ensure(target: RenderTarget): RenderTargetResourceLike {
        const device = this._pipeline.device;
        target.syncViewport();
        // 尺寸限制在分配前验证，防止缓存一个无效的 GPUTexture。
        if (device !== undefined && target.width <= device.limits.maxTextureDimension2D && target.height <= device.limits.maxTextureDimension2D) {
            target.claim(this);
            const previous = this._pipeline.renderTargets.get(target.id);
            // 静止帧直接使用已有附件和视图。
            if (previous?.version === target.version) {
                return previous;
            } else {
                const size = { width: target.width, height: target.height };
                const color = device.createTexture({ label: "RenderTarget color", size, format: target.format,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
                const sampled = device.createTexture({ label: "RenderTarget sampled", size, format: target.format,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC });
                const depth = device.createTexture({ label: "RenderTarget depth", size, format: "depth32float",
                    usage: GPUTextureUsage.RENDER_ATTACHMENT });
                const resource: RenderTargetResourceLike = {
                    target, version: target.version, color, colorView: color.createView(),
                    sampleView: sampled.createView(),
                    sample: { textureId: target.id, version: target.version, texture: sampled,
                        view: sampled.createView({ dimension: "2d-array" }) },
                    depth: { texture: depth, view: depth.createView(), ...size },
                };
                // 分配完成后替换旧资源，独立目标不会被其他 Scene 的 trim 清理。
                this.destroy(target.id);
                target.claim(this);
                target.add(this);
                this._pipeline.renderTargets.set(target.id, resource);
                this._pipeline.textures.set(target.id, resource.sample);
                return resource;
            }
        } else {
            throw new RangeError("RenderTarget exceeds device limits or Render is not ready.");
        }
    }

    /** @param encoder 场景命令编码器 @param target 刚完成绘制的目标 @example manager.finish(encoder, target); @returns 无返回值，在同一次提交中生成可复用的材质贴图。 */
    public finish(encoder: GPUCommandEncoder, target: RenderTarget): void {
        const resource = this.ensure(target);
        let normalize: boolean | "data" = true;
        // 权重等数值附件的 Alpha 也是数据，不参与透明颜色变换。
        if (target.data) {
            normalize = "data";
        }
        this.blitter.encode(encoder, resource.colorView, resource.sampleView, target.format, normalize);
    }

    /** @param inputs 场景引用的资源 @param target 当前写入目标 @example manager.validateInputs(scene.textureList, target); @returns 无返回值；拒绝直接和 IMesh 层表中的反馈读写。 */
    public validateInputs(inputs: readonly (TextureInput | TextureLayers)[], target: RenderTarget): void {
        // 即使该对象暂时在视口外，也拒绝同一渲染步骤依赖自己的输出。
        for (const input of inputs) {
            let feedback = input === target;
            // IMesh 将各实例贴图放入层表，仍需要检查源引用。
            if (input instanceof TextureLayers) {
                feedback = input.layers.includes(target);
            }
            // 明确报错，避免看似成功但读到上一帧的隐式反馈。
            if (feedback) {
                throw new Error("Cannot sample the RenderTarget being rendered. Use two targets.");
            }
        }
    }

    /** @param texture 发出生命周期变化的目标 @example manager.onTextureChange(target); @returns 无返回值，销毁立即释放，resize 延迟到下一次使用。 */
    public onTextureChange(texture: TextureInput): void {
        // 普通图片不属于该管理器，配置变化无需提前申请 GPU 资源。
        if (texture instanceof RenderTarget && texture.destroyed) {
            this.destroy(texture.id);
        }
    }

    /** @param id 目标资源编号 @example manager.destroy(target.id); @returns 是否释放了目标，描述可在未永久销毁时再次使用。 */
    public destroy(id: number): boolean {
        const resource = this._pipeline.renderTargets.get(id);
        // 独立清理所有附件，不让 TextureManager 单独释放采样附件。
        if (resource) {
            resource.target.delete(this);
            resource.target.release(this);
            // 解除仍引用旧附件的绑定，避免 resize 后保留失效视图。
            for (const style of this._pipeline.buffers.meshStyle.values()) {
                const binding = style.bindGroup;
                // 三个样式分区都可能直接接收同一个目标。
                if (binding?.baseView === resource.sample.view || binding?.edgeView === resource.sample.view || binding?.pointsView === resource.sample.view) {
                    style.bindGroup = undefined;
                }
            }
            // 自定义材质的多个字段同样按实际视图身份失效。
            for (const values of this._pipeline.customValues.values()) {
                // 普通数值缓冲不需要重新上传。
                if (values.resources?.includes(resource.sample.view)) {
                    values.bindGroup = undefined;
                    values.resources = undefined;
                }
            }
            resource.color.destroy();
            resource.sample.texture.destroy();
            resource.depth.texture.destroy();
            this._pipeline.textures.delete(id);
            this._pipeline.renderTargets.delete(id);
            return true;
        } else {
            return false;
        }
    }

    /** @example manager.destroyAll(); @returns 无返回值，释放当前 Render 的目标与转换缓存。 */
    public destroyAll(): void {
        // 迭代 Map 的现有键允许逐项删除，不复制 GPU 资源。
        for (const id of this._pipeline.renderTargets.keys()) {
            this.destroy(id);
        }
        this._blit?.destroy();
        this._blit = null;
    }
}

export default RenderTargetManager;
