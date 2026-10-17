import { fragmentShader, vertexShader } from "./shaders.ts";

const setup = "const container = document.createElement(\"div\");\ncontainer.style.cssText = \"position:fixed;inset:0;background:var(--background,#fff)\";\ndocument.body.append(container);\nconst render = new Render(container);\nawait render.ready;\nconst scene = new Scene();\nconst camera = new Camera();\n/** @example resize(); @returns No value. */\nconst resize = (): void => {\n    render.resize();\n    camera.setViewport(render.canvas.width, render.canvas.height);\n    camera.zoom = render.dpr;\n};\nresize();\nconst observer = new ResizeObserver(resize);\nobserver.observe(container);\n";
const body = `const style = new Style();
style.solid.enabled = true;
const material = new WGSLMaterial(style);
const viewport = new Vec2(1, 1);
const settings = { strength: 1, speed: 1, animate: true };
material.raw.value = { time: 0, viewport, strength: 1 };
material.raw.fragmentShader = \`${fragmentShader}\`;
`;
const draw = `const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, false);
mesh.style = style;
mesh.culling = false;
scene.add(mesh);
let time = 0;
let previous = performance.now();
/** @example draw(); @returns No value. */
const draw = (): void => {
    const now = performance.now();
    if (settings.animate) {
        time += (now - previous) / 1000 * settings.speed;
    }
    previous = now;
    viewport.set(render.canvas.width / render.dpr, render.canvas.height / render.dpr);
    material.raw.value.time = time;
    material.raw.value.strength = settings.strength;
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();
`;
const imports = "import { Camera, Mesh, Rect2D, Render, Scene, Style, WGSLMaterial } from \"bplinejs\";\nimport { Vec2 } from \"bpmatrixjs/Math\";\n";
export const shortCode = `import { Camera, Mesh, Rect2D, Render, Scene, Style, WGSLMaterial } from "bplinejs";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const scene = new Scene();
const style = new Style();
style.solid.enabled = true;
const material = new WGSLMaterial();
material.raw.value = { time: 0 };
material.raw.fragmentShader = \`${fragmentShader}\`;
const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, false);
mesh.style = style;
scene.add(mesh);

const draw = (): void => {
    material.raw.value.time = performance.now() / 1000;
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`;
export const fullCode = imports + "import GUI from \"lil-gui\";\n" + setup + body +
    `material.raw.vertexShader = \`${vertexShader}\`;
const gui = new GUI();
gui.add(settings, "strength", 0, 2, 0.05);
gui.add(settings, "speed", 0, 3, 0.1);
gui.add(settings, "animate");
` + draw;
