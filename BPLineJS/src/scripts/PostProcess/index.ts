import Camera from "../Camera";
import type Render from "../Render";
import RenderTarget, { type RenderTargetFormat } from "../RenderTarget";
import Scene from "../Scene";
import PassResources from "./PassResources";
import WgslPass from "./WgslPass";
import PresetPass from "./PresetPass";
import PresetResources from "./PresetResources";

/** 有序后处理通道；共用一个 Render，内部复用离屏附件并保持输入画面不变。 */
class PostProcess {
    public readonly type: string = "PostProcess";
    /** 总开关；关闭时 process 返回输入，render 直接显示输入。 */
    public enabled: boolean = true;
    private readonly _render: Render;
    private readonly _passes = new Map<string, PostProcessPass>();
    private readonly _resources = new Map<string, PassResources>();
    private readonly _presets = new Map<string, PresetResources>();
    private _pool: RenderTarget[] = [];
    private _present: PassResources | null = null;
    private _output: RenderTarget | null = null;
    private _destroyed: boolean = false;

    /** @param render 共用 GPUDevice 的渲染器 @example const post = new PostProcess(render); @returns 后处理通道管理器。 */
    public constructor(render: Render) {
        this._render = render;
    }

    /** @example post.output; @returns 最近 process 的结果，首次执行前为 null；内部结果只保证在下次执行或清理前有效。 */
    public get output(): RenderTarget | null {
        return this._output;
    }
    /** @example post.passes; @returns 按执行顺序排列的键与通道快照，修改快照不会改动队列。 */
    public get passes(): readonly (readonly [string, PostProcessPass])[] {
        return Array.from(this._passes.entries());
    }

    /** @param key 通道名称 @param pass 后处理步骤 @example post.add("color", new WgslPass()); @returns 当前管理器；同名替换保留原来的顺序。 */
    public add(key: string, pass: PostProcessPass): this {
        this.assertAlive();
        // 同一实例重复设置无需丢弃已经准备的材质与缓冲。
        if (this._passes.get(key) !== pass) {
            this._resources.get(key)?.destroy(this._render);
            this._resources.delete(key);
            this._presets.get(key)?.destroy();
            this._presets.delete(key);
            this._passes.set(key, pass);
        }
        return this;
    }
    /** @param key 通道名称 @example post.get("color"); @returns 通道或 undefined。 */
    public get(key: string): PostProcessPass | undefined {
        return this._passes.get(key);
    }
    /** @param key 通道名称 @param index 新的零基下标 @example post.move("color", 0); @returns 当前管理器；名称或位置无效时抛出错误。 */
    public move(key: string, index: number): this {
        this.assertAlive();
        const pass = this._passes.get(key);
        // 排序只改变执行次序，不销毁可复用的通道资源。
        if (pass !== undefined && Number.isInteger(index) && index >= 0 && index < this._passes.size) {
            this._passes.delete(key);
            const entries = Array.from(this._passes.entries());
            entries.splice(index, 0, [key, pass]);
            this._passes.clear();
            // Map 的插入顺序即渲染顺序。
            for (const [name, entry] of entries) {
                this._passes.set(name, entry);
            }
            return this;
        } else {
            throw new RangeError("Unknown postprocess pass or invalid index.");
        }
    }
    /** @param key 通道名称 @example post.delete("color"); @returns 是否移除了通道；不销毁用户 WgslPass 或输入纹理。 */
    public delete(key: string): boolean {
        this.assertAlive();
        this._resources.get(key)?.destroy(this._render);
        this._resources.delete(key);
        this._presets.get(key)?.destroy();
        this._presets.delete(key);
        return this._passes.delete(key);
    }

    /**
     * 按顺序处理已经绘制的输入；不会自动重新渲染输入的场景，也不更新 Canvas。
     * @param input 已执行 render.renderPass 的离屏目标
     * @example const result = post.process(target); mesh.style.solid.texture = result;
     * @returns 最后一个启用通道的输出；全关或无通道时返回输入本身。
     */
    public process(input: RenderTarget): RenderTarget {
        this.assertAlive();
        // 在 GPU 未就绪时明确提示，避免返回一张从未绘制的离屏画面。
        if (this._render.pipeline.device === undefined) {
            throw new Error("Await render.ready before processing a RenderTarget.");
        }
        input.syncViewport();
        const protectedTargets = new Set<RenderTarget>([input]);
        const used = new Set<RenderTarget>();
        let current = input;
        // 总开关只跳过效果，Canvas 呈现仍由 render 方法负责。
        if (this.enabled) {
            // 后面的通道可以再次采样原始输入或其他目标，池子不得覆盖这些画面。
            for (const pass of this._passes.values()) {
                // 关闭的步骤没有读取依赖。
                if (pass.enabled && pass instanceof WgslPass) {
                    for (const texture of pass.raw.values.textures) {
                        // 普通图片不属于离屏附件池。
                        if (texture instanceof RenderTarget) {
                            protectedTargets.add(texture);
                        }
                    }
                }
            }
            // 每个公开通道可包含多个内部步骤，按 add 的顺序把结果交给下一个通道。
            for (const [key, pass] of this._passes) {
                // 多步骤预置独立维护内部资源，普通 WGSL 继续使用附件池。
                if (pass.enabled && pass instanceof PresetPass) {
                    let resources = this._presets.get(key);
                    // GPU 资源属于管理器，同一预置配置可以供多个 Render 使用。
                    if (resources === undefined) {
                        resources = new PresetResources(this._render);
                        this._presets.set(key, resources);
                    }
                    resources.begin(protectedTargets);
                    try {
                        current = pass.process(resources, current, input);
                    } finally {
                        resources.end();
                    }
                } else {
                    // 普通通道只执行一个全屏步骤。
                    if (pass.enabled && pass instanceof WgslPass) {
                        const width = Math.max(1, Math.ceil(input.width * pass.resolutionScale));
                        const height = Math.max(1, Math.ceil(input.height * pass.resolutionScale));
                        let resources = this._resources.get(key);
                        // 普通 WGSL 通道保留原来的 ping-pong 附件池。
                        if (resources === undefined) {
                            resources = new PassResources();
                            this._resources.set(key, resources);
                        }
                        resources.prepare(pass, current, width, height);
                        let format = current.format;
                        // 继承上一阶段的高亮范围；自定义 WGSL 在 HDR 下也可直接产生高亮。
                        if (this._render.hdrEnabled) {
                            format = "rgba16float";
                        }
                        const target = this.acquire(current, protectedTargets, used, width, height, format);
                        target.scene = resources.scene;
                        this._render.renderPass(target);
                        used.add(target);
                        current = target;
                    }
                }
            }
        }
        // 关闭的预置保留配置，但立即回收不再使用的效果附件。
        for (const [key, resources] of this._presets) {
            // 开关切换后及时释放无用遮罩，但保留用户的效果配置。
            if (this.enabled === false || this._passes.get(key)?.enabled === false) {
                resources.begin(protectedTargets);
                resources.end();
            }
        }
        this._output = current;
        this.trimPool(used, protectedTargets);
        return current;
    }

    /** @param input 已绘制的离屏目标 @example render.renderPass(target); post.render(target); @returns 无返回值，执行全部通道并将结果铺满 Canvas。 */
    public render(input: RenderTarget): void {
        const output = this.process(input);
        this._present ??= new PassResources();
        const render = this._render;
        this._present.prepare(null, output, render.canvas.width, render.canvas.height, render.alphaMode === "premultiplied");
        render.render(this._present.scene, this._present.camera);
    }

    /** @example post.clear(); @returns 无返回值，移除所有通道并释放内部结果，保留外部输入和 WgslPass 配置。 */
    public clear(): void {
        this.assertAlive();
        // 每个步骤只持有自己的材质和全屏缓冲。
        for (const resources of this._resources.values()) {
            resources.destroy(this._render);
        }
        this._resources.clear();
        // 每个预置拥有独立的内部遮罩、模糊和抗锯齿资源。
        for (const resources of this._presets.values()) {
            resources.destroy();
        }
        this._presets.clear();
        this._passes.clear();
        this._present?.destroy(this._render);
        this._present = null;
        // 离屏附件由目标的销毁通知交还 Render 统一释放。
        for (const target of this._pool) {
            target.destroy();
        }
        this._pool = [];
        this._output = null;
    }
    /** @example post.destroy(); @returns 无返回值，释放内部资源并禁止复用；不销毁 Render 和用户输入。 */
    public destroy(): void {
        // 允许应用统一清理时重复调用。
        if (this._destroyed === false) {
            this.clear();
            this._destroyed = true;
        }
    }

    /** @param current 上一步结果 @param protectedTargets 用户显式引用的目标 @param used 本帧使用过的附件 @param width 输出像素宽度 @param height 输出像素高度 @param format 输出格式 @example this.acquire(input, protectedTargets, used, 512, 512, input.format); @returns 不与任何读取输入冲突的可复用目标。 */
    private acquire(current: RenderTarget, protectedTargets: ReadonlySet<RenderTarget>, used: ReadonlySet<RenderTarget>, width: number, height: number, format: RenderTargetFormat): RenderTarget {
        let matched: RenderTarget | undefined;
        let reusable: RenderTarget | undefined;
        // 同尺寸附件优先；不同尺寸仅复用本帧未使用的附件，避免降采样链每步反复重建。
        for (const target of this._pool) {
            // 用户读取依赖与当前输入不能同时作为输出附件。
            if (target.destroyed === false && target !== current && protectedTargets.has(target) === false) {
                // 同尺寸目标可在链内交替使用。
                if (target.width === width && target.height === height && target.format === format) {
                    matched = target;
                    break;
                } else if (used.has(target) === false) {
                    // resize 时优先改造旧附件，不持续积累历史 viewport 的纹理。
                    reusable = target;
                }
            }
        }
        let target = matched ?? reusable;
        // 首次执行或被多个显式输入占用时扩展池子。
        if (target === undefined) {
            target = new RenderTarget(new Scene(), new Camera(width, height), { format });
            this._pool.push(target);
        } else {
            target.camera.setViewport(width, height);
            target.format = format;
        }
        return target;
    }
    /** @param used 本帧使用过的附件 @param protectedTargets 被用户显式读取的旧结果 @example this.trimPool(used, protectedTargets); @returns 无返回值，回收关闭通道或 resize 后不再需要的附件。 */
    private trimPool(used: ReadonlySet<RenderTarget>, protectedTargets: ReadonlySet<RenderTarget>): void {
        const retained: RenderTarget[] = [];
        // 保留仍需要的目标身份，其他附件立即释放显存。
        for (const target of this._pool) {
            // 用户可能把前一次结果用作下次输入或另一通道的具名纹理。
            if (used.has(target) || protectedTargets.has(target)) {
                retained.push(target);
            } else {
                target.destroy();
            }
        }
        this._pool = retained;
    }
    /** @example this.assertAlive(); @returns 无返回值，销毁后操作明确报错。 */
    private assertAlive(): void {
        // 已清理的管理器不能重新关联渲染资源。
        if (this._destroyed) {
            throw new Error("PostProcess has been destroyed.");
        }
    }
}

type PostProcessPass = WgslPass | PresetPass;

export type { PostProcessPass };
export default PostProcess;
export { WgslPass };
export type { WgslPassRaw } from "./WgslPass";

export { default as Bloom } from "./Bloom";
export { default as Shadow } from "./Shadow";
export { default as SMAA } from "./SMAA";
export { default as FXAA } from "./FXAA";
