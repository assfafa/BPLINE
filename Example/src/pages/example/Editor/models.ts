import { BaseMaterial, Editor, Mesh, NGon2D, Poly2D, Rect2D, Style, Text } from "bplinejs";

/**
 * Supply a compact mixed selection scene using independent materials.
 * @param editor Collection editor that records imported entities.
 * @example createEditorModels(editor);
 * @returns No value.
 */
export const createEditorModels = (editor: Editor): void => {
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
};
