import type Scene from "../Scene";
import type { DepthTextureLike, PipelineLike } from "./types";

/** 以 24 位整数层级生成精确可表示的 f32 深度，避免相邻对象因舍入获得相同深度。 */
const DEPTH_LEVELS: number = 16777216;

/** 深度纹理和每个 Mesh 的绘制参数均属于当前 Render，不写入共享 CPU 样式。 */
class DepthManager {
    private readonly pipeline: PipelineLike;

    /** @param pipeline 当前 Render 的 GPU 资源 */
    public constructor(pipeline: PipelineLike) { this.pipeline = pipeline; }

    /**
     * 按原始排序分配层级，反向提交只改变访问方向，不重新定义谁在上面。
     * 每个 Mesh 仅上传四个 u32：全局起点、条数、是否反读、补位。
     * @param scene 已准备 drawList 的场景
     */
    public prepare(scene: Scene): void {
        const device = this.pipeline.device;
        if (device === undefined) return;
        let total: number = 0;
        for (const mesh of scene.drawList) total += mesh.count;
        if (!Number.isSafeInteger(total) || total >= DEPTH_LEVELS) {
            throw new RangeError("Scene exceeds 16777215 distinct depth levels.");
        }
        let base: number = 0;
        for (const mesh of scene.drawList) {
            const material = mesh.material;
            const count: number = mesh.count;
            if (count > 0 && material !== undefined) {
                const reverse: number = Number(material.depthTest && material.depthWrite && !material.transparent);
                let cached = this.pipeline.buffers.meshDepth.get(mesh.id);
                if (cached === undefined) {
                    const data: Uint32Array<ArrayBuffer> = new Uint32Array([base, count, reverse, 0]);
                    const buffer = device.createBuffer({
                        label: "Mesh " + String(mesh.id) + " Depth Parameters", size: 16,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    });
                    device.queue.writeBuffer(buffer, 0, data);
                    cached = { meshId: mesh.id, buffer, data };
                    this.pipeline.buffers.meshDepth.set(mesh.id, cached);
                } else if (cached.data[0] !== base || cached.data[1] !== count || cached.data[2] !== reverse) {
                    cached.data.set([base, count, reverse, 0]);
                    device.queue.writeBuffer(cached.buffer, 0, cached.data);
                }
            }
            base += count;
        }
    }

    /**
     * 复用与颜色附件同尺寸的深度纹理，实际像素尺寸变化才重建。
     * @param width 画布物理像素宽度，不是 CSS 宽度
     * @param height 画布物理像素高度
     * @returns 深度附件，设备尚未初始化时为 undefined
     */
    public ensureTexture(width: number, height: number): DepthTextureLike | undefined {
        const device = this.pipeline.device;
        if (device === undefined) return undefined;
        const cached = this.pipeline.depthTexture;
        if (cached?.width === width && cached.height === height) return cached;
        const texture = device.createTexture({
            label: "Render Depth Texture", size: { width, height },
            format: "depth32float", usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const resource: DepthTextureLike = { texture, view: texture.createView(), width, height };
        cached?.texture.destroy();
        this.pipeline.depthTexture = resource;
        return resource;
    }
}

export default DepthManager;
