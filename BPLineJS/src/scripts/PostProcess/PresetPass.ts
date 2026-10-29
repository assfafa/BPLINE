import { GETID } from "../ID";
import type RenderTarget from "../RenderTarget";
import type PresetResources from "./PresetResources";

/** 多步骤预置通道只保存 CPU 设置，GPU 附件由每个 PostProcess 独立维护。 */
abstract class PresetPass {
    public readonly id: number = GETID();
    public readonly type: string = "PresetPass";
    /** 通道总开关；对象自己的效果配置放在 Style。 */
    public enabled: boolean = true;

    /** @internal @param resources 本管理器的私有执行资源 @param input 上一步结果 @param source 原始场景目标 @example pass.process(resources, input, source); @returns 处理后的目标。 */
    public process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget {
        void resources;
        void source;
        return input;
    }
}

export default PresetPass;
