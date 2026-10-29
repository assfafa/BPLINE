import Camera from "../Camera";
import type Render from "../Render";
import RenderTarget, { type RenderTargetFormat } from "../RenderTarget";
import Scene from "../Scene";
import type Texture from "../Texture";
import type { DrawSelection } from "../Render/DrawCallManager";
import PassResources from "./PassResources";
import WgslPass from "./WgslPass";

/** 一个预置通道的渲染资源；按步骤及效果组复用，不在 Style 保存 GPU 状态。 */
class PresetResources {
    public readonly render: Render;
    private readonly _targets = new Map<string, RenderTarget>();
    private readonly _steps = new Map<string, { pass: WgslPass; resources: PassResources }>();
    private readonly _used = new Set<string>();
    private readonly _textures = new Set<Texture>();
    private _protected: ReadonlySet<RenderTarget> = new Set();
    private readonly _retired = new Set<RenderTarget>();

    /** @param render 所属渲染器 @example const resources = new PresetResources(render); @returns 延迟分配的资源容器。 */
    public constructor(render: Render) {
        this.render = render;
    }
    /** @param protectedTargets 用户显式读取的目标 @example resources.begin(protectedTargets); @returns 无返回值，开始记录本轮仍使用的步骤。 */
    public begin(protectedTargets: ReadonlySet<RenderTarget> = new Set()): void {
        this._protected = protectedTargets;
        this._used.clear();
    }
    /** @param key 稳定的步骤键 @param shader 完整 WGSL @example resources.step("blur", shader); @returns 可更新传值的内部 WgslPass。 */
    public step(key: string, shader: string): WgslPass {
        let entry = this._steps.get(key);
        // 效果参数变化更新 uniform，相同拓扑持续复用管线与绑定。
        if (entry === undefined) {
            entry = { pass: new WgslPass(shader), resources: new PassResources() };
            this._steps.set(key, entry);
        }
        this._used.add(key);
        return entry.pass;
    }
    /** @param key 内部步骤键 @param input 该步骤输入 @param data 是否为未经 Alpha 合成的数据附件 @param format 输出精度 @example resources.draw("blur", mask); @returns 独立的可采样结果。 */
    public draw(key: string, input: RenderTarget, data: boolean = false, format: RenderTargetFormat = input.format): RenderTarget {
        const entry = this._steps.get(key);
        // step 必须先提供着色器及具名值，避免创建未配置的空白步骤。
        if (entry === undefined) {
            throw new Error("Create the preset shader step before drawing it.");
        } else {
            const target = this.target(key, input.width, input.height, format, data);
            // 禁止原地覆盖上一步；这个检查也覆盖用户回传旧内部结果的情况。
            if (target === input || entry.pass.raw.values.textures.includes(target)) {
                throw new Error("Preset pass cannot read and write the same target.");
            }
            entry.resources.prepare(entry.pass, input, input.width, input.height);
            target.scene = entry.resources.scene;
            this.render.renderPass(target);
            return target;
        }
    }
    /** @param key 效果组身份 @param source 原始场景与相机 @param selection Mesh 及实例槽位集合 @param occlude 是否保留非本组对象的遮挡 @example resources.mask(key, source, selection, true); @returns 透明背景的组遮罩；不改变场景层级或材质。 */
    public mask(key: string, source: RenderTarget, selection: DrawSelection, occlude: boolean = false): RenderTarget {
        const target = this.target(key, source.width, source.height, source.format, false);
        target.scene = source.scene;
        target.camera = source.camera;
        this.render.renderMask(target, selection, occlude);
        return target;
    }
    /** @param texture 本通道拥有的查找纹理 @example resources.ownTexture(texture); @returns 无返回值，清理时释放本 Render 的纹理缓存。 */
    public ownTexture(texture: Texture): void {
        this._textures.add(texture);
    }
    /** @example resources.end(); @returns 无返回值，回收本帧消失的分组，避免反复调参数累积附件。 */
    public end(): void {
        // 删除只影响当前容器；外部 Mesh、Style 和原始输入均保持原样。
        for (const [key, target] of this._targets) {
            // 参数变化或对象删除后，不再保留旧组的显存。
            if (this._used.has(key) === false) {
                this._retired.add(target);
                this._targets.delete(key);
            }
        }
        // 步骤材质与纹理附件使用同一轮存活标记。
        for (const [key, entry] of this._steps) {
            // 关闭效果或删掉对象会让这个步骤消失。
            if (this._used.has(key) === false) {
                entry.resources.destroy(this.render);
                this._steps.delete(key);
            }
        }
        // 仍被显式引用的旧结果保留到本轮消费完成，不能作为新的输出覆盖。
        for (const target of this._retired) {
            // 下一轮不再作为输入时才释放原附件。
            if (this._protected.has(target) === false) {
                target.destroy();
                this._retired.delete(target);
            }
        }
    }
    /** @example resources.destroy(); @returns 无返回值，释放私有附件、材质及 LUT。 */
    public destroy(): void {
        this.begin();
        this.end();
        // LUT 是 CPU 纹理对象，GPU 缓存只销毁当前 Render 的副本。
        for (const texture of this._textures) {
            this.render.destroyTexture(texture);
        }
        this._textures.clear();
    }
    /** @param key 步骤或分组键 @param width 物理宽度 @param height 物理高度 @param format 附件精度 @param data 原始数据模式 @example this.target(key, 512, 512, "rgba8unorm", false); @returns 可复用附件。 */
    private target(key: string, width: number, height: number, format: RenderTargetFormat, data: boolean): RenderTarget {
        let target = this._targets.get(key);
        // 用户可以把前一轮结果传回链中；重新分配输出以避免破坏这个输入。
        if (target !== undefined && this._protected.has(target)) {
            this._retired.add(target);
            this._targets.delete(key);
            target = undefined;
        }
        // 同键稳定复用，尺寸由 viewport 变化通知 Render 重建。
        if (target === undefined) {
            target = new RenderTarget(new Scene(), new Camera(width, height), { format, data });
            this._targets.set(key, target);
        }
        // 遮罩相机引用原场景，不能通过附件准备修改该相机的 viewport。
        if (target.width !== width || target.height !== height) {
            target.camera = new Camera(width, height);
        }
        target.format = format;
        this._used.add(key);
        return target;
    }
}

export default PresetResources;
