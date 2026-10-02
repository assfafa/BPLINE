import { BaseMaterial, Mesh, NGon2D, Poly2D, Rect2D, Scene, Style } from "bplinejs";

/**
 * Populate a small mixed scene for both selection previews.
 * @param scene Scene that will own the generated meshes.
 * @param advanced Include Poly2D meshes in the full API preview.
 * @example
 * createModels(scene, true);
 * @returns No value.
 */
export const createModels = (scene: Scene, advanced: boolean): void => {
    const colors = ["#4fd1c5", "#8b9cff", "#d691ed"];

    // The short preview keeps two shape constructors; the full preview adds concave polygons.
    for (let index = 0; index < 24; index += 1) {
        let kind = index % 2;
        // The advanced result includes a third face group for Poly2D.
        if (advanced) {
            kind = index % 3;
        }
        const size = 23 + Math.random() * 17;
        const style = new Style();
        style.solid.enabled = true;
        style.solid.color.setHex(colors[kind]);
        style.edge.width = 4;
        style.edge.color.setHex("#ffeb57");

        let geometry: Rect2D | NGon2D | Poly2D;
        // Each mesh owns its style so highlighting one result leaves the others unchanged.
        if (kind === 0) {
            geometry = new Rect2D({ width: size * 2, height: size * 1.5, radius: 7, style });
        } else {
            // NGons provide a variable edge count; the last case exercises a concave outline.
            if (kind === 1) {
                geometry = new NGon2D({ outer: size, sides: 3 + Math.floor(Math.random() * 6), style });
            } else {
                geometry = new Poly2D(new Float32Array([-size, -size, size, -size, size * 0.3, size, -size, size]), style);
            }
        }

        const material = new BaseMaterial();
        material.cullMode = "none";
        const mesh = new Mesh(geometry, material);
        mesh.style = style;
        mesh.position.set((Math.random() - 0.5) * 280, (Math.random() - 0.5) * 300);
        mesh.rotation = (Math.random() - 0.5) * 0.6;
        scene.add(mesh);
    }
};
