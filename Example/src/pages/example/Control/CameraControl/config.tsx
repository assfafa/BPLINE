import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, CameraControl, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const render = new Render(container);
await render.ready;
const camera = new Camera(width, height);
const control = new CameraControl(camera, render);
control.is = true;
const scene = new Scene();
const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#8c72ef");
const mesh = new Mesh(new Rect2D({ width: 120, height: 80 }), new BaseMaterial());
mesh.style = style;
scene.add(mesh);
function frame() {
    control.update();
    render.render(scene, camera);
    requestAnimationFrame(frame);
}
frame();
// On teardown: control.dispose(); render.destroy();`;

export { fullCode };
