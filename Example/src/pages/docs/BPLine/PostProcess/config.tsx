import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "PostProcess",
    intro: {
        cn: "顺序执行离屏画面的后处理通道。所有 Pass 共用传入 Render 的设备，内部复用中间 RenderTarget，不为每个步骤创建新渲染器。",
        en: "Run an ordered post-processing chain on an offscreen image. Passes share the supplied Render device and reuse intermediate RenderTargets instead of creating a renderer per step.",
    },
    detail: {
        cn: "先 render.renderPass(target)，再 post.render(target) 显示结果；仅想取得处理后画面时用 post.process(target)。Bloom/Shadow 从原始 target.scene 获取对象效果和遮罩；通常先阴影、发光，再抗锯齿，改变画面 UV 的自定义效果放在对象效果之后。静态画面在尺寸、场景或 HDR 状态变化后需重新执行整条链。",
        en: "First call render.renderPass(target), then post.render(target) to present; use post.process(target) to obtain an image without presenting. Bloom/Shadow read object settings and masks from the original target.scene. A typical order is shadow, bloom, then anti-aliasing; put UV-warping custom effects after object effects. Static images need the full chain redrawn after viewport, scene or HDR changes.",
    },
    code: `import { BaseMaterial, Bloom, Camera, Mesh, PostProcess, Rect2D, Render, RenderTarget, Scene, Shadow, SMAA, Style } from "bplinejs";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const scene = new Scene();
const camera = new Camera(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");
style.bloom.enabled = true;
style.bloom.color.setHex("#45baff");
style.bloom.radius = 24;
style.shadow.enabled = true;
const mesh = new Mesh(new Rect2D({ width: 180, height: 120 }), new BaseMaterial(style), style);
mesh.rotation = 0.3;
scene.add(mesh);

const target = new RenderTarget(scene, camera);
const post = new PostProcess(render);
post.add("shadow", new Shadow());
post.add("bloom", new Bloom());
post.add("aa", new SMAA());
render.renderPass(target);
post.render(target);
// To use the result in another material without presenting:
// const processed = post.process(target);
// anotherStyle.solid.texture = processed;`,
    properties: [
        entry("enabled: boolean = true", "总开关；关闭后 process 返回输入，render 仍会把输入显示到 Canvas。", "Master switch. When disabled, process returns the input and render still presents that input."),
        entry("readonly passes: readonly (readonly [string, PostProcessPass])[]", "通道顺序快照；修改数组不改变队列。PostProcessPass 包含 WgslPass 和预置通道。", "A snapshot of ordered entries; mutating the array does not change the chain. PostProcessPass includes WgslPass and preset passes."),
        entry("readonly output: RenderTarget | null", "最近一次 process/render 的结果，首次处理前为 null。内部结果只保证在下次执行或清理前有效，不宜作为永久截图保存。", "Most recent process/render result, initially null. Internal results are only valid until the next execution or cleanup and should not be treated as permanent snapshots."),
    ],
    methods: [
        entry("new PostProcess(render: Render)", "绑定同一渲染器；执行 process/render 前必须 await render.ready。", "Use one renderer; await render.ready before processing or presenting."),
        entry("add(key: string, pass: PostProcessPass): this", "按添加顺序执行；同名替换保留位置并释放该步骤的旧内部资源。", "Run in insertion order; replacing a key preserves its position and releases the old step resources."),
        entry("get(key: string): PostProcessPass | undefined", "取得通道配置；可以修改 enabled。", "Retrieve a pass configuration, for example to change enabled."),
        entry("move(key: string, index: number): this", "移动到零基下标，名称不存在或下标非法时抛出 RangeError。", "Move to a zero-based index; an unknown key or invalid index throws RangeError."),
        entry("delete(key: string): boolean", "移除通道并释放其内部资源；保留用户 Pass 配置和输入纹理。", "Remove a pass and its internal resources while retaining user pass configurations and input textures."),
        entry("process(input: RenderTarget): RenderTarget", "仅处理已绘制的输入，不自动重绘来源，也不更新 Canvas。没有启用步骤时原样返回输入。", "Process an already rendered input without redrawing its source or updating the canvas. With no enabled passes, return the input."),
        entry("render(input: RenderTarget): void", "执行 process 后将结果铺满 Render 的 Canvas。", "Process, then present the result across the renderer canvas."),
        entry("clear(): void", "清空通道和内部结果，保留 Render、输入和用户通道对象；之后仍可 add。", "Clear passes and internal outputs, retaining Render, inputs and user pass objects. The manager can be reused."),
        entry("destroy(): void", "释放内部资源并禁止再使用，不销毁 Render 和用户输入。", "Release internal resources and prevent reuse without destroying Render or user inputs."),
    ],
    links: [
        { label: "RenderTarget", to: "/docs/bpline/render-target" },
        { label: "Bloom", to: "/docs/bpline/post-process/bloom" },
        { label: "Shadow", to: "/docs/bpline/post-process/shadow" },
        { label: "SMAA", to: "/docs/bpline/post-process/smaa" },
        { label: "FXAA", to: "/docs/bpline/post-process/fxaa" },
        { label: "WgslPass", to: "/docs/bpline/post-process/wgsl" },
    ],
};
