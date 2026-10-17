import { BaseMaterial, Camera, Font, Mesh, Rect2D, Render, Scene, Style, Text } from "bplinejs";
import type { TextWritingMode } from "bplinejs";
import GUI from "lil-gui";
import fontUrl from "./MiSans-Normal.woff2?url";

const container = document.createElement("div");
container.style.cssText = "position:fixed;inset:0;background:var(--background,#fff)";
document.body.append(container);
const render = new Render(container);
await render.ready;
await Font.register("MiSans", fontUrl);
const scene = new Scene();
const camera = new Camera();
const parameters = {
    content: "Hello World\\nHello World",
    fontSize: 52,
    precision: 8,
    lineSpacing: 12,
    letterSpacing: 2,
    textAlign: "center" as "left" | "center" | "right",
    baseline: "middle" as "top" | "middle" | "bottom",
    writingMode: "horizontal-tb" as TextWritingMode,
    fill: "#5584dc",
    edgeEnabled: true,
    edgeWidth: 3,
    edgeColor: "#67d8ff",
    pointsEnabled: false,
    pointsRadius: 2,
    pointsColor: "#ffc76d",
};
const text = new Text(parameters.content.replaceAll("\\n", "\n"), parameters.fontSize, "MiSans", parameters);
const mesh = new Mesh(text, new BaseMaterial(), false);
const style = new Style();
style.solid.enabled = true;
style.points.vertices = true;
style.points.midpoints = false;
style.points.minPointsLength = 18;
mesh.style = style;
scene.add(mesh);

// baseline selects anchorY; this marker moves while the text geometry remains centered.
const anchor = new Mesh(new Rect2D({ width: 7, height: 7, radius: 1 }), new BaseMaterial(), false);
const anchorStyle = new Style();
anchorStyle.solid.enabled = true;
anchorStyle.solid.color.setHex("#e55287");
anchor.style = anchorStyle;
anchor.ignoreZoom = true;
anchor.order = 1;
scene.add(anchor);
const anchors = { anchorX: 0, anchorY: 0 };

/** @example fit(); @returns No value; fit horizontal text and long vertical columns. */
const fit = (): void => {
    render.resize();
    camera.setViewport(render.canvas.width, render.canvas.height);
    camera.zoom = Math.max(0.001, Math.min(render.dpr,
        render.canvas.width / (text.width + 36), render.canvas.height / (text.height + 36)));
};

/** @example update(); @returns No value; apply layout, style and anchor controls. */
const update = (): void => {
    text.text = parameters.content.replaceAll("\\n", "\n");
    text.fontSize = parameters.fontSize;
    text.precision = parameters.precision;
    text.lineSpacing = parameters.lineSpacing;
    text.letterSpacing = parameters.letterSpacing;
    text.textAlign = parameters.textAlign;
    text.baseline = parameters.baseline;
    text.writingMode = parameters.writingMode;
    style.solid.color.setHex(parameters.fill);
    style.edge.enabled = parameters.edgeEnabled;
    style.edge.width = parameters.edgeWidth;
    style.edge.color.setHex(parameters.edgeColor);
    style.points.enabled = parameters.pointsEnabled;
    style.points.radius = parameters.pointsRadius;
    style.points.color.setHex(parameters.pointsColor);
    anchors.anchorX = text.anchorX;
    anchors.anchorY = text.anchorY;
    anchor.position.set(anchors.anchorX, anchors.anchorY);
    fit();
};
update();
const observer = new ResizeObserver(fit);
observer.observe(container);

/** @example compareAlignment(); @returns No value; compare unequal row or column lengths. */
const compareAlignment = (): void => {
    parameters.content = "Hello World\\nHello";
    update();
};
const actions = { compareAlignment };
const gui = new GUI({ title: "Text" });
gui.add(parameters, "content").name("text (\\n = line)").onFinishChange(update).listen();
gui.add(actions, "compareAlignment").name("Compare alignment");
gui.add(parameters, "fontSize", 16, 96, 1).onChange(update);
gui.add(parameters, "precision", 3, 100, 1).onChange(update);
gui.add(parameters, "lineSpacing", 0, 40, 1).onChange(update);
gui.add(parameters, "letterSpacing", -10, 20, 1).onChange(update);
gui.add(parameters, "textAlign", ["left", "center", "right"]).onChange(update);
gui.add(parameters, "baseline", ["top", "middle", "bottom"]).name("baseline (anchorY)").onChange(update);
gui.add(parameters, "writingMode", ["horizontal-tb", "vertical-rl"]).onChange(update);
gui.add(anchors, "anchorX").disable().listen();
gui.add(anchors, "anchorY").disable().listen();
gui.addColor(parameters, "fill").onChange(update);
gui.add(parameters, "edgeEnabled").onChange(update);
gui.add(parameters, "edgeWidth", 0, 10, 1).onChange(update);
gui.addColor(parameters, "edgeColor").onChange(update);
gui.add(parameters, "pointsEnabled").onChange(update);
gui.add(parameters, "pointsRadius", 1, 8, 1).onChange(update);
gui.addColor(parameters, "pointsColor").onChange(update);

/** @example draw(); @returns No value; render the current text and its anchor marker. */
const draw = (): void => {
    render.render(scene, camera);
    requestAnimationFrame(draw);
};
draw();
