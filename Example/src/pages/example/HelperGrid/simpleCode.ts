import { Camera, HelperGrid, Render, Scene } from "bplinejs";

// Paste into a TypeScript entry after installing bplinejs.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0;";
document.body.append(container);
const render = new Render(container, "production");
render.backgroundColor = { r: 0.08, g: 0.1, b: 0.14, a: 1 };
await render.ready;
const scene = new Scene();
const camera = new Camera();
let fitted = false;

/**
 * Synchronize the canvas and camera after a container resize.
 * @example resize();
 * @returns No value.
 */
const resize = (): void => {
    render.resize();
    const bounds = container.getBoundingClientRect();
    const width = Math.max(1, bounds.width * render.dpr);
    const height = Math.max(1, bounds.height * render.dpr);
    camera.setViewport(width, height);
    // Fit once, retaining later user pan and zoom.
    if (fitted === false) {
        camera.zoom = Math.max(0.1, Math.min(render.dpr, width / 350, height / 280));
        fitted = true;
    }
};
resize();
const observer = new ResizeObserver(resize);
observer.observe(container);

const helper = new HelperGrid(scene, render, camera);
// Defaults: dark grid; bottom horizontal ruler; left vertical ruler.

let frame = 0;
/**
 * Update interaction and submit the next frame.
 * @example requestAnimationFrame(draw);
 * @returns No value.
 */
const draw = (): void => {
    helper.update();
    render.render(scene, camera);
    frame = requestAnimationFrame(draw);
};
frame = requestAnimationFrame(draw);

/**
 * Release the standalone example when leaving the page.
 * @example destroy();
 * @returns No value.
 */
const destroy = (): void => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    helper.destroy();
    render.destroy();
    container.remove();
};
window.addEventListener("beforeunload", destroy, { once: true });
