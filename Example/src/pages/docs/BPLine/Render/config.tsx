import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Render",
    intro: {
        cn: "管理画布和 WebGPU 资源。等待 ready 后，用 render(scene, camera) 绘制到画布，或 renderPass(target) 绘制离屏目标；PostProcess 与所有目标共用这个 Render。",
        en: "Own the canvas and WebGPU resources. Await ready, then use render(scene, camera) for the canvas or renderPass(target) for an offscreen target. PostProcess and its targets share this Render.",
    },
    code: `import { Camera, Render, Scene } from "bplinejs";

const container = document.getElementById("stage");
if (container) {
    const render = new Render(container, "production");
    await render.ready;
    const scene = new Scene();
    render.resize();
    render.precisionDebounce = 100;
    const camera = new Camera(container.clientWidth * render.dpr, container.clientHeight * render.dpr);
    scene.box = camera;
    render.render(scene, camera);
    // Call render.destroy() when the canvas is no longer needed.
}`,
    properties: [
        entry("boxDebounce: number = 100", "box 视口查询防抖毫秒；0 即时查询。相机连续变化期间使用完整有序列表避免漏画，停止后恢复筛选；不影响 quad。", "Box viewport query debounce in milliseconds; 0 queries immediately. During camera changes, draw the full ordered list to avoid stale culling, then resume filtering. Does not debounce quad."),
        entry("precisionDebounce: number = 100", "自动精度重建防抖，单位毫秒；0 立即更新。每个 Render 独立管理并在 destroy 清理。", "Automatic precision rebuild debounce in milliseconds; 0 updates immediately. Owned and cleaned up per Render."),
        entry("ready: Promise<void>", "WebGPU 初始化完成信号。", "WebGPU initialization promise."),
        entry("container: HTMLElement; canvas: HTMLCanvasElement", "渲染宿主与创建的画布。", "Render host and its canvas."),
        entry("backgroundColor: GPUColorDict", "每帧清屏背景色。", "Per-frame clear color."),
        entry("alphaMode: GPUCanvasAlphaMode", "画布透明度模式。", "Canvas alpha mode."),
        entry("renderMode: RenderMode", "development 或 production。", "development or production mode."),
        entry("dpr: number", "当前设备像素比。", "Current device pixel ratio."),
        entry("hdr: \"auto\" | boolean = \"auto\"", "HDR 请求模式，可在 ready 前设置。auto 按浏览器 dynamic-range: high 检测结果请求 rgba16float + extended；true 强制请求，false 使用 SDR。不支持时回退 SDR。普通材质 0–1 颜色保持原值，Bloom 根据 HDR 状态保留超过 1 的高亮。", "Requested HDR mode, configurable before ready. auto requests rgba16float + extended when the browser reports dynamic-range: high; true requests it regardless, and false uses SDR. Unsupported configurations fall back to SDR. Ordinary 0–1 material colors remain unchanged; Bloom retains highlights above 1 when HDR is enabled."),
        entry("readonly hdrAvailable: boolean", "浏览器当前 HDR 能力报告，跟随媒体查询变化；不代表对显示器物理亮度的测量。", "Current browser HDR capability report, updated by media-query changes; not a measurement of physical display brightness."),
        entry("readonly hdrEnabled: boolean", "Canvas 已接受 rgba16float + extended；ready 前或回退 SDR 时为 false。强制请求时可能为 true 而 available 为 false；只确认输出配置，不验证屏幕实际亮度。", "Whether the canvas accepted rgba16float + extended; false before ready or after SDR fallback. Forced mode may be enabled while available is false. This confirms output configuration, not actual screen brightness."),
    ],
    methods: [
        entry("new Render(container, \"development\")", "开发模式检查资源及相机：zoom 超出 1e-13…999999999999 会警告。控制器负责限制，Camera 本身不自动钳制。", "Development mode validates resources and warns for camera zoom outside 1e-13…999999999999. Controls enforce limits; Camera itself does not clamp."),
        entry("new Render(container: HTMLElement | string, renderMode?: RenderMode)", "创建渲染器并异步初始化 WebGPU。", "Create a renderer and initialize WebGPU asynchronously."),
        entry("render(scene: Scene, camera: Camera): void", "准备资源并提交绘制。", "Prepare resources and submit a draw."),
        entry("renderPass(target: RenderTarget): void", "绘制 target.scene 与 target.camera 到离屏附件，不提交到 Canvas；附件尺寸来自 camera.viewport。", "Render target.scene with target.camera into offscreen attachments without presenting to the canvas. Dimensions come from camera.viewport."),
        entry("onHDR(key: string, callback: HDRChangeCallback): void", "按 key 注册或替换监听，不立即调用。状态快照包含 mode、available、enabled、format、toneMapping；静态页面在回调里重绘。", "Register or replace a keyed listener without calling it immediately. The snapshot contains mode, available, enabled, format and toneMapping; redraw static content in the callback."),
        entry("deleteHDR(key: string): boolean", "移除对应 HDR 监听；destroy 也会清理所有监听。", "Remove a keyed HDR listener; destroy clears all listeners."),
        entry("warmup(scene: Scene, camera: Camera): void", "准备缓存，不提交绘制。", "Prepare caches without submitting a draw."),
        entry("warmupPass(target: RenderTarget): void", "准备离屏目标所需资源，不提交绘制；要更新画面仍需 renderPass(target)。", "Prepare resources for an offscreen target without drawing; call renderPass(target) to update the image."),
        entry("resize(): void", "按容器尺寸更新画布。", "Resize the canvas to its container."),
        entry("trim(scene: Scene): void", "回收当前场景不再引用的 GPU 缓存。", "Collect GPU caches no longer referenced by the scene."),
        entry("destroyMesh / destroyTexture / destroyMaterial / destroyGeometry", "按对象或 ID 显式释放对应渲染资源。", "Explicitly release a rendered resource by object or ID."),
        entry("destroy(): void", "释放渲染器拥有的 GPU 资源。", "Release GPU resources owned by the renderer."),
    ],
    links: [
        { label: "RenderTarget", to: "/docs/bpline/render-target" },
        { label: "PostProcess", to: "/docs/bpline/post-process" },
        { label: "Bloom example", to: "/example/post-process/bloom" },
    ],
};
