import { Camera, CameraControl, HelperGrid, Render, Scene } from "bplinejs";
import GUI from "lil-gui";

// Paste into a TypeScript entry after installing bplinejs, lil-gui.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0 230px 0 0;";
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
const cameraControl = new CameraControl(camera, render);

const gui = new GUI({ title: "HelperGrid", width: 220 });
gui.add(helper, "mode", ["dark", "light", "custom"]).listen();
gui.add(helper, "minorPerMajor", 2, 20, 1);
gui.add(helper, "ruler");
gui.add(helper, "horizontalRuler", ["bottom", "top", "none"]);
gui.add(helper, "verticalRuler", ["left", "right", "none"]);
gui.add(camera, "zoom", 0.1, 8, 0.1).listen();
const colors = {
    gridMinorColor: "#2e333d",
    gridMajorColor: "#4a5463",
    rulerMinorColor: "#929aa6",
    rulerMajorColor: "#c9d1de",
    rulerTextColor: "#c9d1de",
};
/**
 * Apply the five custom colors as observable Color mutations.
 * @example gui.addColor(colors, "gridMajorColor").onChange(applyColors);
 * @returns No value.
 */
const applyColors = (): void => {
    helper.mode = "custom";
    helper.custom.gridMinorColor.setHex(colors.gridMinorColor);
    helper.custom.gridMajorColor.setHex(colors.gridMajorColor);
    helper.custom.rulerMinorColor.setHex(colors.rulerMinorColor);
    helper.custom.rulerMajorColor.setHex(colors.rulerMajorColor);
    helper.custom.rulerTextColor.setHex(colors.rulerTextColor);
};
const palette = gui.addFolder("Custom colors");
palette.addColor(colors, "gridMinorColor").onChange(applyColors);
palette.addColor(colors, "gridMajorColor").onChange(applyColors);
palette.addColor(colors, "rulerMinorColor").onChange(applyColors);
palette.addColor(colors, "rulerMajorColor").onChange(applyColors);
palette.addColor(colors, "rulerTextColor").onChange(applyColors);
let frame = 0;
/**
 * Update interaction and submit the next frame.
 * @example requestAnimationFrame(draw);
 * @returns No value.
 */
const draw = (): void => {
    cameraControl.update();
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
    cameraControl.dispose();
    gui.destroy();
    render.destroy();
    container.remove();
};
window.addEventListener("beforeunload", destroy, { once: true });
