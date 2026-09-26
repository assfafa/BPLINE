import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5577ee");
const rectangle = new Rect2D({ width: 180, height: 110, radius: 18 });
const material = new BaseMaterial();
const mesh = new Mesh(rectangle, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`;

export { fullCode };
