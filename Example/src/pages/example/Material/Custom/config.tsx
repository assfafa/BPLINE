import fullCode from "./scene.ts?raw";

export const shortCode = `import { Camera, CompositeMaterial, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
const geometry = new Rect2D({ width: 104, height: 84, radius: 11, style });
const material = new CompositeMaterial(style);
material.raw.solidShader = "return vec4f(input.uv.x, 0.35, 0.9, 1.0);";
const mesh = new Mesh(geometry, material, false);
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`;

export { fullCode };
