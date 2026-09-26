import fullCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, CameraControl, IMesh, Rect2D, Render, Scene, Style } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const geometryStyle = new Style();
geometryStyle.solid.enabled = true;
const geometry = new Rect2D({ width: 12, height: 12, style: geometryStyle });
const mesh = new IMesh(geometry, new BaseMaterial(), { raw: false, capacity: 50000 });
const purple = new Style();
purple.solid.enabled = true;
purple.solid.color.setHex("#9377ed");
const cyan = new Style();
cyan.solid.enabled = true;
cyan.solid.color.setHex("#54c8db");
const columns = Math.ceil(Math.sqrt(50000));
const rows = Math.ceil(50000 / columns);
// Frozen instances copy these temporary inputs during each push.
const position = new Vec2();
const scale = new Vec2(1, 1);
const instance = { position, scale, style: purple };
for (let index = 0; index < 50000; index++) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    position.set((column - (columns - 1) / 2) * 13, (row - (rows - 1) / 2) * 13);
    if ((Math.floor(column / 16) + Math.floor(row / 16)) % 2 === 0) {
        instance.style = purple;
    } else {
        instance.style = cyan;
    }
    mesh.push(instance);
}
const scene = new Scene();
scene.add(mesh);
const render = new Render(container);
await render.ready;
const camera = new Camera(width, height);
camera.zoom = Math.min(width / (columns * 13), height / (rows * 13)) * 0.6;
const control = new CameraControl(camera, render);
control.is = true;
const frame = () => {
    control.update();
    render.render(scene, camera);
    requestAnimationFrame(frame);
};
frame();
// On teardown: control.dispose(); render.destroy();`;

export { fullCode };
