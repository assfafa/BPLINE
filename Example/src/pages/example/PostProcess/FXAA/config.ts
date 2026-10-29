import { createCode } from "../code.ts";

const setup = `const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");

const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
mesh.rotation = 0.32;
scene.add(mesh);
const pass = new FXAA();
post.add("fxaa", pass);`;
const source = setup;
const controls = `const gui = new GUI();
gui.add(pass, "enabled").name("FXAA enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
// Toggle pass.enabled to compare the same diagonal edge before and after FXAA.`;

export const shortCode = createCode("FXAA", source, "", "", 350);
export const fullCode = createCode("FXAA", source, controls, "", 350);
