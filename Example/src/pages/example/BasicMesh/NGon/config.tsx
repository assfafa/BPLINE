import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#9c7cf0");
const geometry = new NGon2D({ outer: 85, sides: 7, startAngle: Math.PI / 2 });
const material = new BaseMaterial();
const mesh = new Mesh(geometry, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`;

export { fullCode };
