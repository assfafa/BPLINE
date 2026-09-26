import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import imageUrl from "@/assets/ttf/50.jpg?url";

const texture = await new Texture().load(imageUrl);
const style = new Style();
style.solid.enabled = true;
style.solid.texture = texture;
const geometry = new Rect2D({ width: 300, height: 210 });
const material = new BaseMaterial();
const mesh = new Mesh(geometry, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const render = new Render(container);
await render.ready;
render.render(scene, new Camera(width, height));`;

export { fullCode };
