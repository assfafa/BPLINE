import type { PipelineLike } from "./types";

/** Canvas 的 SDR/HDR 配置与系统状态监听；不改动普通材质颜色或离屏来源。 */
class CanvasOutput {
    /** 用户请求模式，默认跟随浏览器。 */
    public mode: HDRMode = "auto";
    /** 媒体查询报告的当前 HDR 能力。 */
    public available: boolean = false;
    /** Canvas 实际接受 extended 配置。 */
    public enabled: boolean = false;
    private readonly _pipeline: PipelineLike;
    private readonly _changed: () => void;
    private _query: MediaQueryList | null = null;
    private _supportsHDR: boolean | null = null;
    private _configuredHDR: boolean | null = null;
    private _configuredAlpha: GPUCanvasAlphaMode | null = null;
    private _destroyed: boolean = false;

    /** @param event 浏览器当前显示设备的 HDR 状态 @example query.addEventListener("change", this.handleChange); @returns 更新状态并通知 Render 重新配置。 */
    private readonly handleChange = (event: MediaQueryListEvent): void => {
        // 已销毁对象忽略排队中的事件，强制模式也更新 available 供 UI 查看。
        if (this._destroyed === false && this.available !== event.matches) {
            this.available = event.matches;
            this._changed();
        }
    };

    /** @param pipeline Render 私有设备资源 @param changed 系统 HDR 状态变化后的回调 @example new CanvasOutput(pipeline, UpdateHDR); @returns 自动跟随浏览器的输出配置管理器。 */
    public constructor(pipeline: PipelineLike, changed: () => void) {
        this._pipeline = pipeline;
        this._changed = changed;
        // 部分测试环境没有 matchMedia，默认按 SDR 能力处理。
        if (typeof window.matchMedia === "function") {
            this._query = window.matchMedia("(dynamic-range: high)");
            this.available = this._query.matches;
            this._query.addEventListener("change", this.handleChange);
        }
    }

    /** @param alphaMode Canvas 透明合成方式 @example output.configure("premultiplied"); @returns 无返回值，按实际接受的配置同步 pipeline；不支持时回退 SDR。 */
    public configure(alphaMode: GPUCanvasAlphaMode): void {
        const { device, context } = this._pipeline;
        // 初始化前只记录模式，设备和上下文就绪后才调用 configure。
        if (this._destroyed === false && device !== undefined && context !== undefined) {
            const requested = this.mode === true || (this.mode === "auto" && this.available);
            const desired = requested && this._supportsHDR !== false;
            // configure 会清空画布；稳定状态下不得重复执行。
            if (this._configuredHDR !== desired || this._configuredAlpha !== alphaMode) {
                this.enabled = false;
                // 配置成功仍需检测 toneMapping 是否被浏览器接受，避免把忽略字段误报为 HDR。
                if (desired) {
                    try {
                        context.configure({ device, format: "rgba16float", colorSpace: "srgb",
                            alphaMode, toneMapping: { mode: "extended" } });
                        // 旧实现可能尚未提供 getConfiguration；不能仅凭 configure 未抛错认定成功。
                        const legacyContext: Partial<GPUCanvasContext> = context;
                        const configuration = legacyContext.getConfiguration?.();
                        this.enabled = configuration?.format === "rgba16float" && configuration.toneMapping?.mode === "extended";
                    } catch {
                        this.enabled = false;
                    }
                    this._supportsHDR = this.enabled;
                }
                // 不支持 extended、自动检测为 SDR 或显式关闭时恢复浏览器首选格式。
                if (this.enabled) {
                    this._pipeline.format = "rgba16float";
                    this._pipeline.toneMapping = { mode: "extended" };
                } else {
                    const format = navigator.gpu.getPreferredCanvasFormat();
                    context.configure({ device, format, colorSpace: "srgb", alphaMode, toneMapping: { mode: "standard" } });
                    this._pipeline.format = format;
                    this._pipeline.toneMapping = { mode: "standard" };
                }
                this._configuredHDR = this.enabled;
                this._configuredAlpha = alphaMode;
            }
        }
    }

    /** @example output.destroy(); @returns 移除媒体查询订阅；设备与上下文交由 Render 销毁。 */
    public destroy(): void {
        this._destroyed = true;
        this._query?.removeEventListener("change", this.handleChange);
        this._query = null;
        this.enabled = false;
    }
}

type HDRMode = "auto" | boolean;
interface HDRState {
    /** 用户请求模式，默认 auto。 */
    readonly mode: HDRMode;
    /** 浏览器报告的当前 HDR 能力，不表示已验证物理显示亮度。 */
    readonly available: boolean;
    /** Canvas 已接受 rgba16float + extended；强制模式不要求 available=true。 */
    readonly enabled: boolean;
    readonly format: GPUTextureFormat | undefined;
    readonly toneMapping: GPUCanvasToneMappingMode;
}
/** @param state 模式和当前实际配置快照 @example render.onHDR("status", UpdateStatus); @returns 无返回值。 */
type HDRChangeCallback = (state: HDRState) => void;

export default CanvasOutput;
export type { HDRMode, HDRState, HDRChangeCallback };
