import type RenderTarget from "../../RenderTarget";
import type { RenderTargetFormat } from "../../RenderTarget";
import Blur from "../Blur";
import EffectGroups from "../EffectGroups";
import PresetPass from "../PresetPass";
import type PresetResources from "../PresetResources";
import extractShader from "./extract.wgsl?raw";
import compositeShader from "./composite.wgsl?raw";
import strongestShader from "./strongest.wgsl?raw";

/** 对象发光；同值对象共享可见遮罩和模糊，各组按亮度保留最强的完整发光颜色。 */
class Bloom extends PresetPass {
    public override readonly type: string = "Bloom";

    /** @internal @param resources 管理器私有资源 @param input 上一通道结果 @param source 原始场景目标 @example post.add("bloom", new Bloom()); @returns 加入发光的画面，无启用对象时透传。 */
    public override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget {
        let current = input;
        let strongest: RenderTarget | null = null;
        const hdr = resources.render.hdrEnabled;
        let format: RenderTargetFormat = input.format;
        // 普通来源仍可为 SDR；从第一次发光合成开始才需要保存超过 1 的 RGB。
        if (hdr) {
            format = "rgba16float";
        }
        // 每组只绘制一次对象集合，不能按 Style ID 或 Mesh 分别模糊。
        for (const group of EffectGroups.collect(source.scene, "bloom")) {
            const settings = group.settings;
            // 零强度等同关闭，不生成遮罩及模糊附件。
            if (settings.intensity > 0) {
                const mask = resources.mask(group.key + ":mask", source, group.selection, true);
                const extractKey = group.key + ":extract";
                const extract = resources.step(extractKey, extractShader);
                extract.raw.value = { threshold: settings.threshold, tint: new Float32Array(settings.color) };
                const seed = resources.draw(extractKey, mask, true, "rgba16float");
                const glow = Blur.apply(resources, group.key, seed, settings.radius * resources.render.dpr);
                const mergeKey = group.key + ":strongest";
                const merge = resources.step(mergeKey, strongestShader);
                // 强度与透明度先作用于候选，按预乘亮度比较并保留整份颜色/Alpha，避免各通道拼白。
                merge.raw.value = { glow, strength: settings.intensity * settings.opacity, first: Number(strongest === null) };
                strongest = resources.draw(mergeKey, strongest ?? glow, true, "rgba16float");
            }
        }
        // 所有组只挑一次最强发光，最后与原画面合成一次；不再逐组累加提亮。
        if (strongest !== null) {
            const composite = resources.step("composite", compositeShader);
            composite.raw.value = { glow: strongest, hdr: Number(hdr) };
            current = resources.draw("composite", input, false, format);
        }
        return current;
    }
}
export default Bloom;
