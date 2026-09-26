import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Render",
    intro: {
        cn: "管理画布和 WebGPU 资源。等待 ready 后，可用 render(scene, camera) 绘制；结束时调用 destroy()。",
        en: "Own the canvas and WebGPU resources. Await ready, draw with render(scene, camera), and call destroy() when finished.",
    },
    code: `import { Camera, Render, Scene } from "bplinejs";

const container = document.getElementById("stage");
if (container) {
    const render = new Render(container, "production");
    await render.ready;
    const scene = new Scene();
    const camera = new Camera(container.clientWidth, container.clientHeight);
    render.render(scene, camera);
    // Call render.destroy() when the canvas is no longer needed.
}`,
    properties: [
        entry("ready: Promise<void>", "WebGPU 初始化完成信号。", "WebGPU initialization promise."),
        entry("container: HTMLElement; canvas: HTMLCanvasElement", "渲染宿主与创建的画布。", "Render host and its canvas."),
        entry("backgroundColor: GPUColorDict", "每帧清屏背景色。", "Per-frame clear color."),
        entry("alphaMode: GPUCanvasAlphaMode", "画布透明度模式。", "Canvas alpha mode."),
        entry("renderMode: RenderMode", "development 或 production。", "development or production mode."),
        entry("dpr: number", "当前设备像素比。", "Current device pixel ratio."),
    ],
    methods: [
        entry("new Render(container: HTMLElement | string, renderMode?: RenderMode)", "创建渲染器并异步初始化 WebGPU。", "Create a renderer and initialize WebGPU asynchronously."),
        entry("render(scene: Scene, camera: Camera): void", "准备资源并提交绘制。", "Prepare resources and submit a draw."),
        entry("warmup(scene: Scene, camera: Camera): void", "准备缓存，不提交绘制。", "Prepare caches without submitting a draw."),
        entry("resize(): void", "按容器尺寸更新画布。", "Resize the canvas to its container."),
        entry("trim(scene: Scene): void", "回收当前场景不再引用的 GPU 缓存。", "Collect GPU caches no longer referenced by the scene."),
        entry("destroyMesh / destroyTexture / destroyMaterial / destroyGeometry", "按对象或 ID 显式释放对应渲染资源。", "Explicitly release a rendered resource by object or ID."),
        entry("destroy(): void", "释放渲染器拥有的 GPU 资源。", "Release GPU resources owned by the renderer."),
    ],
};
