import {
    BaseMaterial, Camera, CameraControl, Editor, EditorKey, Font,
    Mesh, NGon2D, Poly2D, Rect2D, Render, Scene, Style, Text,
} from "bplinejs";
import type { EditorDocument } from "bplinejs/Editor";
import GUI from "lil-gui";

// Paste into a TypeScript entry after installing bplinejs, lil-gui.
const container = document.createElement("div");
container.style.cssText = "position: fixed; inset: 0 230px 0 0;";
document.body.append(container);
const render = new Render(container, "production");
render.backgroundColor = { r: 0.08, g: 0.1, b: 0.14, a: 1 };
await render.ready;
const scene = new Scene();
const camera = new Camera();
let fitted = false;

/**
 * Synchronize the canvas and camera after a container resize.
 * @example resize();
 * @returns No value.
 */
const resize = (): void => {
    render.resize();
    const bounds = container.getBoundingClientRect();
    const width = Math.max(1, bounds.width * render.dpr);
    const height = Math.max(1, bounds.height * render.dpr);
    camera.setViewport(width, height);
    // Fit once, retaining later user pan and zoom.
    if (fitted === false) {
        camera.zoom = Math.max(0.1, Math.min(render.dpr, width / 350, height / 280));
        fitted = true;
    }
};
resize();
const observer = new ResizeObserver(resize);
observer.observe(container);

// Replace this public demo font URL with your own WOFF2 URL if needed.
await Font.register("MiSans", "https://raw.githubusercontent.com/assfafa/BPLINE/main/Example/src/assets/ttf/MiSans-Normal.woff2");
const editor = new Editor(scene, render, camera, { nest: true });
const cameraControl = new CameraControl(camera, render);
const keys = new EditorKey(editor, cameraControl);
editor.textEditTool.fontFamily = "MiSans";
editor.textEditTool.fontSize = 18;
let saved: EditorDocument | null = null;

const shapes = [
    new Rect2D({ width: 72, height: 54, radius: 12 }),
    new NGon2D({ outer: 35, inner: 13, sides: 6 }),
    new Poly2D(new Float32Array([-32, -22, -18, 30, 30, 24, 14, -30])),
    new Text("再次单击\nClick again", 18, "MiSans"),
];
const positions = [[-65, 52], [65, 52], [-65, -45], [65, -45]];
const colors = ["#5d93ee", "#42b9a9", "#b67ada", "#f4c578"];
const meshes: Mesh[] = [];
// Each entity keeps an independent style and material after selection.
for (let index = 0; index < shapes.length; index += 1) {
    const material = new BaseMaterial();
    material.cullMode = "none";
    const mesh = new Mesh(shapes[index], material);
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(colors[index]);
    mesh.style = style;
    mesh.position.set(positions[index][0], positions[index][1]);
    meshes.push(mesh);
}
editor.push(meshes);

/**
 * Keep the latest JSON document in memory.
 * @param document Serializable editor document.
 * @example editor.onSave("preview", receiveSave);
 * @returns No value.
 */
const receiveSave = (document: EditorDocument): void => {
    saved = document;
    console.log("Editor document", document);
};
editor.onSave("preview", receiveSave);

/**
 * Export through the same API used by Ctrl+S.
 * @example actions.save();
 * @returns No value.
 */
const save = (): void => {
    editor.save();
};
/**
 * Restore the last saved document without downloading files.
 * @example actions.load();
 * @returns No value.
 */
const load = (): void => {
    // Until the first save, loading is intentionally a no-op.
    if (saved !== null) {
        editor.load(saved);
    }
};
/**
 * Undo the last complete editing gesture.
 * @example actions.undo();
 * @returns No value.
 */
const undo = (): void => {
    editor.undo();
};
/**
 * Restore an undone gesture.
 * @example actions.redo();
 * @returns No value.
 */
const redo = (): void => {
    editor.redo();
};
/**
 * Convert the current selection to editable Base boundaries.
 * @example actions.toBase();
 * @returns No value.
 */
const toBase = (): void => {
    editor.toBase();
};
const actions = { save, load, undo, redo, toBase };
const status = { selected: 0, types: "", orderMax: 0, undoCount: 0, redoCount: 0, saved: false };
const transforms = {
    activeOnly: true,
    constrain: false,
    rotationEnabled: true,
    translationStep: 10,
    rotationStep: 15,
    translationStepEnabled: false,
    rotationStepEnabled: false,
};
/**
 * Apply shared transform preferences to all shape tools.
 * @example transformGui.onChange(applyTransforms);
 * @returns No value.
 */
const applyTransforms = (): void => {
    const tools = [editor.rectEditTool, editor.ngonEditTool, editor.polyEditTool, editor.textEditTool];
    // The editor owns group gestures, using the same tool preferences.
    for (const tool of tools) {
        tool.activeOnly = transforms.activeOnly;
        tool.constrain = transforms.constrain;
        tool.rotationEnabled = transforms.rotationEnabled;
        tool.translationStep = transforms.translationStep;
        tool.rotationStep = transforms.rotationStep;
        tool.translationStepEnabled = transforms.translationStepEnabled;
        tool.rotationStepEnabled = transforms.rotationStepEnabled;
    }
};
applyTransforms();


const gui = new GUI({ title: "Editor", width: 220 });
gui.add(editor, "shape", ["rect", "ngon", "poly", "text", "group"]).listen();
gui.add(editor, "activeType", ["view", "edit", "add", "sub", "group"]).listen();
gui.add(editor, "mult").listen();
gui.add(editor, "nest");
gui.add(editor, "raiseSelected");
gui.add(editor, "snap").listen();
const snapping = gui.addFolder("Snap options");
snapping.add(editor.snapOptions, "vertex").listen();
snapping.add(editor.snapOptions, "edge").listen();
snapping.add(editor.snapOptions, "intersection").listen();
snapping.add(editor.snapOptions, "grid").listen();
snapping.close();
gui.add(editor, "ignoreZoom");
gui.add(editor, "autoPrecision");
gui.add(editor, "order", -10, 10, 1);
const transformGui = gui.addFolder("Transform");
transformGui.add(transforms, "activeOnly").onChange(applyTransforms).listen();
transformGui.add(transforms, "constrain").onChange(applyTransforms).listen();
transformGui.add(transforms, "rotationEnabled").onChange(applyTransforms).listen();
transformGui.add(transforms, "translationStep", 1, 100, 1).onChange(applyTransforms).listen();
transformGui.add(transforms, "rotationStep", 1, 90, 1).onChange(applyTransforms).listen();
transformGui.add(transforms, "translationStepEnabled").onChange(applyTransforms).listen();
transformGui.add(transforms, "rotationStepEnabled").onChange(applyTransforms).listen();
transformGui.close();
// Rectangle creation pins its world origin on pointer down; wheel zoom keeps that origin fixed.
// Enable snapping with editor.snap; stepping is optional and the closer screen-space result wins.
const rect = gui.addFolder("Rect");
rect.add(editor.rectEditTool, "origin", ["left", "center"]).listen();
rect.close();
const ngon = gui.addFolder("NGon");
ngon.add(editor.ngonEditTool, "sides", 3, 90, 1).listen();
ngon.add(editor.ngonEditTool, "uvMode", ["bounding", "polar"]);
ngon.close();
const text = gui.addFolder("Text");
text.add(editor.textEditTool, "fontSize", 8, 64, 1);
text.add(editor.textEditTool, "letterSpacing", 0, 10, 1);
text.add(editor.textEditTool, "lineSpacing", 0, 20, 1);
text.add(editor.textEditTool, "textAlign", ["left", "center", "right"]);
text.close();
const interaction = gui.addFolder("Interaction");
interaction.add(editor.switches, "pick");
interaction.add(editor.switches, "marquee");
interaction.add(editor.switches, "create");
interaction.add(editor.switches, "move");
interaction.add(editor.switches, "resize");
interaction.add(editor.switches, "scale");
interaction.add(editor.switches, "rotate");
interaction.add(editor.switches, "insertVertex");
interaction.add(editor.switches, "reparent");
interaction.close();
const types = gui.addFolder("Types");
types.add(editor, "rect");
types.add(editor, "ngon");
types.add(editor, "poly");
types.add(editor, "text");
types.add(editor, "group");
types.close();
const historyGui = gui.addFolder("Document");
historyGui.add(status, "selected").disable().listen();
historyGui.add(status, "types").disable().listen();
historyGui.add(status, "orderMax").disable().listen();
historyGui.add(status, "undoCount").disable().listen();
historyGui.add(status, "redoCount").disable().listen();
historyGui.add(status, "saved").disable().listen();
historyGui.add(actions, "save");
historyGui.add(actions, "load");
historyGui.add(actions, "undo");
historyGui.add(actions, "redo");
historyGui.add(actions, "toBase");
let frame = 0;
/**
 * Update interaction and submit the next frame.
 * @example requestAnimationFrame(draw);
 * @returns No value.
 */
const draw = (): void => {
    cameraControl.update();
    editor.update();
    status.selected = editor.actives.length;
    const types: string[] = [];
    // Expose geometry ownership so conversion and undo are visible in the GUI.
    for (const mesh of editor.actives) {
        // A released entity may no longer have drawable geometry.
        if (mesh.data !== undefined) {
            types.push(mesh.data.type);
        }
    }
    status.types = types.join(", ");
    status.orderMax = editor.orderMax;
    status.undoCount = editor.undoCount;
    status.redoCount = editor.redoCount;
    status.saved = saved !== null;
    const settings = editor.rectEditTool;
    transforms.activeOnly = settings.activeOnly;
    transforms.constrain = settings.constrain;
    transforms.rotationEnabled = settings.rotationEnabled;
    transforms.translationStep = settings.translationStep;
    transforms.rotationStep = settings.rotationStep;
    transforms.translationStepEnabled = settings.translationStepEnabled;
    transforms.rotationStepEnabled = settings.rotationStepEnabled;
    render.render(scene, camera);
    frame = requestAnimationFrame(draw);
};
frame = requestAnimationFrame(draw);

/**
 * Release the standalone example when leaving the page.
 * @example destroy();
 * @returns No value.
 */
const destroy = (): void => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    keys.destroy();
    editor.destroy();
    cameraControl.dispose();
    gui.destroy();
    render.destroy();
    container.remove();
};
window.addEventListener("beforeunload", destroy, { once: true });
