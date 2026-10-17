import { BaseMaterial, Camera, Editor, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#fff)";
document.body.append(container);
const render = new Render(container, "production");
await render.ready;
const scene = new Scene();
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
camera.zoom = Math.max(0.1, Math.min(render.dpr, render.canvas.width / 350, render.canvas.height / 280));
const editor = new Editor(scene, render, camera);
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5d93ee");
const mesh = new Mesh(new Rect2D({ width: 110, height: 70, radius: 14 }), new BaseMaterial(), false);
mesh.style = style;
editor.push(mesh);

/** @example draw(); @returns No value; update the helper theme and draw one frame. */
const draw = (): void => {
    let mode: "light" | "dark" = "light";
    // React ThemeProvider maintains the page's dark class.
    if (document.documentElement.classList.contains("dark")) {
        mode = "dark";
    }
    editor.helperGrid.mode = mode;
    editor.update();
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();
