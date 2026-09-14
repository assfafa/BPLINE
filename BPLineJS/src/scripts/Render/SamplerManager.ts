import type { PipelineLike } from "./types";

interface SamplerManagerLike {
    get(addressModeU: GPUAddressMode, addressModeV: GPUAddressMode): GPUSampler | undefined;
}

/**
 * 管理当前 Render 对应 GPUDevice 创建的 Sampler 缓存。
 * 相同 U/V 寻址组合在多个材质和 DrawCall 之间复用同一个 GPUSampler。
 * @class
 */
class SamplerManager implements SamplerManagerLike {
    private readonly pipeline: PipelineLike;

    /**
     * 创建 Sampler 管理器。
     * @param pipeline 当前 Render 的共享管线资源
     */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
    }

    /**
     * 获取或创建指定寻址组合的 Sampler。
     * @param addressModeU 水平方向寻址方式
     * @param addressModeV 垂直方向寻址方式
     * @returns 可复用 Sampler，GPUDevice 尚未就绪时返回 undefined
     */
    public get(addressModeU: GPUAddressMode, addressModeV: GPUAddressMode): GPUSampler | undefined {
        const device: GPUDevice | undefined = this.pipeline.device;

        if (device === undefined) {
            return undefined;
        }

        const key: string = addressModeU + "_" + addressModeV;
        const cachedSampler: GPUSampler | undefined = this.pipeline.samplers.get(key);

        if (cachedSampler !== undefined) {
            return cachedSampler;
        }

        const sampler: GPUSampler = device.createSampler({
            label: "Texture Sampler " + key,
            addressModeU,
            addressModeV,
            magFilter: "linear",
            minFilter: "linear",
        });

        this.pipeline.samplers.set(key, sampler);
        return sampler;
    }
}

export default SamplerManager;
export type { SamplerManagerLike };
