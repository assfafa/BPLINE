import fullCode from "./fullCode.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Font, Mesh, Render, Scene, Style, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
// Await font loading and WASM initialization; Text geometry is then generated synchronously.
await Font.register("MiSans", fontUrl);
const geometry = new Text("Hello World\\nHello World", 52, "MiSans", {
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
