import type RenderTarget from "../../RenderTarget";
import PresetPass from "../PresetPass";
import type PresetResources from "../PresetResources";
import Lookup from "./Lookup";
import edgesShader from "./edges.wgsl?raw";
import weightsShader from "./weights.wgsl?raw";
import premultShader from "../wgsls/premult.wgsl?raw";
import blendShader from "./blend.wgsl?raw";

/** SMAA 1x Medium：边缘检测、官方查找表权重、邻域混合；不使用时间历史或多重采样。 */
class SMAA extends PresetPass {
    public override readonly type: string = "SMAA";
    private _lookup: Lookup | null = null;

    /** @internal @param resources 管理器私有资源 @param input 上一通道结果 @param source 原始场景 @example post.add("smaa", new SMAA()); @returns 三步骤抗锯齿画面，保持透明背景。 */
    public override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget {
        void source;
        // CPU 查找表延迟解码；跨 Render 使用时各自上传，不共享 GPUTexture。
        this._lookup ??= new Lookup();
        resources.ownTexture(this._lookup.area);
        resources.ownTexture(this._lookup.search);
        resources.step("edges", edgesShader);
        // 边缘与权重只是单位区间数据；最终颜色仍继承 HDR 输入的浮点格式。
        const edges = resources.draw("edges", input, true, "rgba8unorm");
        const weights = resources.step("weights", weightsShader);
        weights.raw.value = { area: this._lookup.area, search: this._lookup.search };
        const blend = resources.draw("weights", edges, true);
        const compose = resources.step("blend", premultShader + "\n" + blendShader);
        compose.raw.value = { weights: blend };
        return resources.draw("blend", input);
    }
}
export default SMAA;
