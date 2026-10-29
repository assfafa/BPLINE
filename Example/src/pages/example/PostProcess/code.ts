/**
 * Assemble complete, copyable TypeScript without website lifecycle helpers.
 * @param passName Public pass import.
 * @param setup Scene, style and pass setup.
 * @param controls Optional GUI setup for the full example.
 * @param update Optional per-frame uniform refresh.
 * @param extent World-space area fitted in the preview.
 * @example createCode("Bloom", setup);
 * @returns A standalone TypeScript page using the same scene settings as the preview.
 */
export const createCode = (passName: string, setup: string, controls: string = "", update: string = "", extent: number = 350): string => {
    let imports = `import { BaseMaterial, Camera, Mesh, PostProcess, Rect2D, Render, RenderTarget, Scene, Style, ${passName} } from "bplinejs";\n`;
    // Only the complete example has a GUI dependency.
    if (controls.length > 0) {
        imports += "import GUI from \"lil-gui\";\n";
    }
    return imports + `
const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#f1f5f9)";
document.body.append(container);
const render = new Render(container);
await render.ready;
const scene = new Scene();
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
const target = new RenderTarget(scene, camera);
const post = new PostProcess(render);

${setup.trim()}
${controls}
// ResizeObserver also handles a containing panel changing size.
const observer = new ResizeObserver(() => {
    render.resize();
});
observer.observe(container);

const draw = (): void => {
    camera.setViewport(render.canvas.width, render.canvas.height);
    camera.zoom = Math.min(render.dpr, render.canvas.width / ${String(extent)}, render.canvas.height / ${String(extent)});
${update}    render.renderPass(target);
    post.render(target);
    requestAnimationFrame(draw);
};
draw();`;
};
