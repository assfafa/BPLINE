import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Mesh, Poly2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5b8def");
const points = new Float32Array([
    -105, -75, 105, -75, 105, 75, 0, 30, -105, 75,
]);
const polygon = new Poly2D(points);
const material = new BaseMaterial();
const mesh = new Mesh(polygon, material);
mesh.style = style;
const scene = new Scene();
scene.add(mesh);
const camera = new Camera(width, height);
render.render(scene, camera);`;

export { fullCode };
