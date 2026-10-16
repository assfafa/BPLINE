import { Camera, HelperGrid, Render, Scene } from "bplinejs";

// Paste into a TypeScript entry after installing bplinejs.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0; background: var(--background, #fff);";
document.body.append(container);
const render = new Render(container, "production");
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
let currentTheme = "";
/** @example syncTheme(); @returns No value; follow the page theme without resetting edits. */
const syncTheme = (): void => {
    let mode: "light" | "dark" = "light";
    // Match the class maintained by React ThemeProvider.
    if (document.documentElement.classList.contains("dark")) {
        mode = "dark";
    }
    // Preserve custom palette edits until the page theme changes.
    if (currentTheme !== mode) {
        helper.mode = mode;
        currentTheme = mode;
    }
};
syncTheme();
const themeObserver = new MutationObserver(syncTheme);
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
/** @example stopTheme(); @returns No value; remove the standalone theme observer. */
const stopTheme = (): void => {
    themeObserver.disconnect();
};
window.addEventListener("beforeunload", stopTheme, { once: true });
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
