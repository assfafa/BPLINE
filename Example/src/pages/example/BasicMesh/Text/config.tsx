import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Font, Mesh, Render, Scene, Style, Text } from "bplinejs";
import fontUrl from "./MiSans-Normal.woff2?url";

await Font.register("MiSans", fontUrl);
const geometry = new Text("你好世界\\n文字几何", 52, "MiSans", {
    lineSpacing: 12,
    letterSpacing: 2,
});
const mesh = new Mesh(geometry, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#f4f7ff");
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const render = new Render(container, "production");
render.backgroundColor = { r: 0.06, g: 0.09, b: 0.15, a: 1 };
const camera = new Camera();
await render.ready;
camera.setViewport(render.canvas.width, render.canvas.height);
render.render(scene, camera);`;

export { fullCode };
