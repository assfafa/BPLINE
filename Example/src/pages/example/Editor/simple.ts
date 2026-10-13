import { BaseMaterial, Camera, Editor, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

/**
 * Create the minimal collection editor shown in the simple preview.
 * @param scene Scene containing editable entities.
 * @param render Renderer already attached to a container.
 * @param camera Camera matched to the render viewport.
 * @example const editor = createSimpleEditor(scene, render, camera);
 * @returns Collection editor; call update before rendering each frame.
 */
export const createSimpleEditor = (scene: Scene, render: Render, camera: Camera): Editor => {
    const editor = new Editor(scene, render, camera);
    const mesh = new Mesh(new Rect2D({ width: 110, height: 70, radius: 14 }), new BaseMaterial());
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#5d93ee");
    mesh.style = style;
    editor.push(mesh);
    return editor;
};

// await render.ready;
// 每帧：editor.update(); render.render(scene, camera);
// 编辑：单击选中，拖动移动或调整，空白处拖动新增。
// 清理：editor.destroy();
