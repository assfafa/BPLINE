import { Camera, HelperGrid, Render, Scene } from "bplinejs";

/**
 * Add a self-contained adaptive grid and its default rulers.
 * @param scene Scene receiving two helper meshes.
 * @param render Renderer attached to the preview container.
 * @param camera Camera matched to the physical viewport.
 * @example const helper = createSimpleHelper(scene, render, camera);
 * @returns Helper; call update before rendering each frame.
 */
export const createSimpleHelper = (scene: Scene, render: Render, camera: Camera): HelperGrid => {
    return new HelperGrid(scene, render, camera);
};

// 每帧：helper.update(); render.render(scene, camera);
// 清理：helper.destroy();
