import modelsCode from "./models.ts?raw";
import sceneCode from "./scene.ts?raw";

export const shortCode = `import { BaseMaterial, Camera, Mesh, NGon2D, Rect2D, Render, Scene, Select, Style } from "bplinejs";

const scene = new Scene();
const colors = ["#4fd1c5", "#8b9cff"];
for (let index = 0; index < 24; index += 1) {
    const size = 23 + Math.random() * 17;
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(colors[index % 2]);
    style.edge.color.setHex("#ffeb57");
    style.edge.width = 4;
    let shape;
    if (index % 2 === 0) {
        shape = new Rect2D({ width: size * 2, height: size * 1.5, radius: 7, style });
    } else {
        shape = new NGon2D({ outer: size, sides: 3 + Math.floor(Math.random() * 6), style });
    }
    const material = new BaseMaterial();
    material.cullMode = "none";
    const mesh = new Mesh(shape, material);
    mesh.style = style;
    mesh.position.set((Math.random() - 0.5) * 280, (Math.random() - 0.5) * 300);
    mesh.rotation = (Math.random() - 0.5) * 0.6;
    scene.add(mesh);
}

const render = new Render(container);
await render.ready;
render.resize();
const bounds = container.getBoundingClientRect();
const camera = new Camera(bounds.width * render.dpr, bounds.height * render.dpr, 1.08);
const select = new Select(scene, render, camera);
select.linePicker = false;
select.pointPicker = false;
render.container.addEventListener("click", (event) => {
    const hits = select.SelectPicker(event);
    for (const mesh of scene.drawList) {
        if (mesh instanceof Mesh && mesh.style) {
            mesh.style.edge.enabled = false;
        }
    }
    for (const mesh of [...hits.Rect2D, ...hits.NGon, ...hits.Poly2D, ...hits.Base2D]) {
        if (mesh.style) {
            mesh.style.edge.enabled = true;
        }
    }
});
const draw = () => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`;

export const fullCode = `// models.ts\n${modelsCode}\n\n// scene.ts\n${sceneCode}`;
