import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Font, Mesh, Render, Scene, Style, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

// Await font loading and WASM initialization; Text geometry is then generated synchronously.
await Font.register("MiSans", fontUrl);
const geometry = new Text("再次单击\\n文字几何", 52, "MiSans", {
    precision: 8,
    lineSpacing: 12,
    letterSpacing: 2,
});
const mesh = new Mesh(geometry, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5584dc");
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const render = new Render(container, "production");
const camera = new Camera();
await render.ready;
camera.setViewport(render.canvas.width, render.canvas.height);
render.render(scene, camera);`;

export { fullCode };
