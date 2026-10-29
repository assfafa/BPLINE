import { createCode } from "../code.ts";

const setup = `const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");
style.bloom.enabled = true;
style.bloom.color.setHex("#45baff");
style.bloom.radius = 24;
style.bloom.intensity = 1.2;
const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
mesh.rotation = 0.32;
scene.add(mesh);
const pass = new Bloom();
post.add("bloom", pass);`;
const source = setup;
const controls = `const gui = new GUI();
gui.add(pass, "enabled").name("Bloom enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
gui.add(style.bloom, "enabled").name("style.bloom.enabled");
gui.add(style.bloom, "radius", 0, 60, 1);
gui.add(style.bloom, "intensity", 0, 5, 0.1);
gui.add(style.bloom, "opacity", 0, 1, 0.05);
gui.add(style.bloom, "threshold", 0, 1, 0.01);
const colors = { color: "#45baff" };
/** @param value CSS hex color. @example setColor("#45baff"); @returns No value; update the effect color. */
const setColor = (value: string): void => {
    style.bloom.color.setHex(value);
};
gui.addColor(colors, "color").onChange(setColor);
gui.add(render, "hdr", { Auto: "auto", SDR: false, HDR: true });
const status = document.createElement("output");
status.style.cssText = "position:absolute;left:8px;bottom:8px;font:11px monospace;pointer-events:none;color:inherit";
container.append(status);`;

export const shortCode = createCode("Bloom", source, "", "", 350);
export const fullCode = createCode("Bloom", source, controls, "    status.textContent = \"HDR available: \" + String(render.hdrAvailable) + \" / enabled: \" + String(render.hdrEnabled);\n", 350);
