import { Vec2 } from "bpmatrixjs/Math";
import type RenderTarget from "../../RenderTarget";
import Blur from "../Blur";
import EffectGroups from "../EffectGroups";
import PresetPass from "../PresetPass";
import type PresetResources from "../PresetResources";
import compositeShader from "./composite.wgsl?raw";

/** 对象阴影；外阴影位于场景物体后方、背景前方，内阴影限定在本组轮廓内，参数来自 style.shadow。 */
class Shadow extends PresetPass {
    public override readonly type: string = "Shadow";

    /** @internal @param resources 管理器私有资源 @param input 上一通道结果 @param source 原始场景目标 @example post.add("shadow", new Shadow()); @returns 合成内外阴影后的画面。 */
    public override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget {
        let current = input;
        const groups = EffectGroups.collect(source.scene, "shadow");
        let objects = input;
        /** @param group 已启用效果组 @example HasOuter(group); @returns 是否需要区分场景覆盖与背景。 */
        const HasOuter = (group: (typeof groups)[number]): boolean => group.settings.outer;
        // 场景可能清屏为不透明颜色；一次公共覆盖渲染分离背景，避免外阴影被背景 Alpha 吞掉。
        if (groups.some(HasOuter)) {
            const selection = new Map<number, null>();
            // 这张覆盖图所有效果组共用，不逐对象或逐组重复绘制。
            for (const mesh of source.scene.drawList) {
                selection.set(mesh.id, null);
            }
            objects = resources.mask("sceneCoverage", source, selection);
        }
        // 同值对象使用联合轮廓，因此重叠区域不会重复产生组内投影。
        for (const group of groups) {
            const settings = group.settings;
            // 两类阴影都关闭时不产生任何中间画面。
            if (settings.inner || settings.outer) {
                const mask = resources.mask(group.key + ":mask", source, group.selection);
                const blurred = Blur.apply(resources, group.key, mask, settings.blur * resources.render.dpr,
                    settings.spread * resources.render.dpr);
                let innerMask = blurred;
                // 内外阴影的正扩散分别收缩/膨胀轮廓；零扩散共用同一模糊结果。
                if (settings.inner && settings.spread > 0) {
                    innerMask = Blur.apply(resources, group.key + ":inner", mask, settings.blur * resources.render.dpr,
                        -settings.spread * resources.render.dpr);
                }
                const key = group.key + ":composite";
                const pass = resources.step(key, compositeShader);
                pass.raw.value = { mask, blurred, innerMask, objects, tint: new Float32Array(settings.color), opacity: settings.opacity,
                    offset: new Vec2(settings.offsetX * resources.render.dpr / source.width,
                        settings.offsetY * resources.render.dpr / source.height),
                    inner: Number(settings.inner), outer: Number(settings.outer) };
                current = resources.draw(key, current);
            }
        }
        return current;
    }
}
export default Shadow;
