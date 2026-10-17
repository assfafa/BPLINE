const setup = "import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from \"bplinejs\";\nimport videoUrl from \"./big-buck-bunny-10s.mp4?url\";\nconst container = document.createElement(\"div\");\ncontainer.style.cssText = \"position:fixed;inset:0;background:var(--background,#fff)\";\ndocument.body.append(container);\nconst render = new Render(container);\nawait render.ready;\nconst scene = new Scene();\nconst camera = new Camera();\n/** @example resize(); @returns No value. */\nconst resize = (): void => {\n    render.resize();\n    camera.setViewport(render.canvas.width, render.canvas.height);\n    camera.zoom = render.dpr;\n};\nresize();\nconst observer = new ResizeObserver(resize);\nobserver.observe(container);\n\nconst texture = new Texture();\nawait texture.load(videoUrl, \"video\");\nconst video = texture.source as HTMLVideoElement;\nvideo.muted = true;\nvideo.loop = true;\nvideo.playsInline = true;\nconst style = new Style();\nstyle.solid.enabled = true;\nstyle.solid.texture = texture;\nconst mesh = new Mesh(new Rect2D({ width: 300, height: 169, radius: 10 }), new BaseMaterial(), false);\nmesh.style = style;\nscene.add(mesh);\nconst button = document.createElement(\"button\");\nbutton.style.cssText = \"position:absolute;bottom:12px;left:12px\";\nbutton.textContent = \"Play / Pause\";\ncontainer.append(button);\nbutton.onclick = () => {\n    if (video.paused) {\n        void video.play().catch(console.error);\n    } else {\n        video.pause();\n    }\n};\nawait video.play().catch(() => { button.textContent = \"Play\"; });\n";
const draw = "/** @example draw(); @returns No value; Render uploads ready video frames. */\nconst draw = (): void => {\n    render.render(scene, camera);\n    requestAnimationFrame(draw);\n};\ndraw();\n";
export const shortCode = `import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style, Texture } from "bplinejs";
import videoUrl from "./big-buck-bunny-10s.mp4?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0";
document.body.append(container);
const render = new Render(container);
await render.ready;
const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
camera.zoom = render.dpr;
const scene = new Scene();
const texture = new Texture();
await texture.load(videoUrl, "video");
const video = texture.source as HTMLVideoElement;
video.muted = true;
video.loop = true;
video.playsInline = true;
await video.play();

const style = new Style();
style.solid.enabled = true;
style.solid.texture = texture;
const mesh = new Mesh(new Rect2D({ width: 300, height: 169, radius: 10 }), new BaseMaterial(), false);
mesh.style = style;
scene.add(mesh);
const draw = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();`;
export const fullCode = "import GUI from \"lil-gui\";\n" + setup + `const gui = new GUI();
gui.add(video, "currentTime", 0, video.duration, 0.01).name("Position");
gui.add(video, "playbackRate", 0.25, 2, 0.25).name("Speed");
gui.add(video, "loop");
` + draw;
