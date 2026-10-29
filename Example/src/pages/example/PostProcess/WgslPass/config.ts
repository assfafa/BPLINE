import { createCode } from "../code.ts";
import { fragmentShader } from "./shader.ts";

const setup = `const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#ff8a34");

const mesh = new Mesh(new Rect2D({ width: 600, height: 600, style }), new BaseMaterial(style), style);
mesh.rotation = 0;
scene.add(mesh);
const pass = new WgslPass();
pass.raw.value = { radius: 20, pixelRatio: render.dpr };
pass.raw.fragmentShader = fragmentShader;
post.add("wgsl", pass);`;
const source = setup.replace("pass.raw.fragmentShader = fragmentShader;", "pass.raw.fragmentShader = \x60" + fragmentShader + "\x60;");
const controls = `const gui = new GUI();
gui.add(pass, "enabled").name("WgslPass enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
const settings = { radius: 20 };
/** @param value Gaussian radius in CSS pixels. @example setRadius(20); @returns No value; update the named shader uniform. */
const setRadius = (value: number): void => {
    pass.raw.value.radius = value;
};
gui.add(settings, "radius", 0, 24, 1).onChange(setRadius);
gui.add(pass, "resolutionScale", { Half: 0.5, Full: 1 });`;

export const shortCode = createCode("WgslPass", source, "", "    pass.raw.value.pixelRatio = render.dpr;\n", 760);
export const fullCode = createCode("WgslPass", source, controls, "    pass.raw.value.pixelRatio = render.dpr;\n", 760);
