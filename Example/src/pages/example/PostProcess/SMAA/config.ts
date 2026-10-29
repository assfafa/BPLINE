import { createCode } from "../code.ts";

const setup = `const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#409dff");

const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
mesh.rotation = 0.32;
scene.add(mesh);
const pass = new SMAA();
post.add("smaa", pass);`;
const source = setup;
const controls = `const gui = new GUI();
gui.add(pass, "enabled").name("SMAA enabled");
gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
// Toggle pass.enabled to compare the same diagonal edge before and after SMAA.`;

export const shortCode = createCode("SMAA", source, "", "", 350);
export const fullCode = createCode("SMAA", source, controls, "", 350);
