import { BaseMaterial, Mesh, Rect2D, Style, FXAA } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "../../reference/ShapePreview.tsx";
import PostRuntime from "../Runtime.ts";

/** @param options Preview hosts and mode. @example mountScene(options); @returns Cleanup for route changes. */
export const mountScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new PostRuntime(options, 350);
    const { scene, post } = runtime;
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#409dff");

    const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
    mesh.rotation = 0.32;
    scene.add(mesh);
    const pass = new FXAA();
    post.add("fxaa", pass);
    let gui: GUI | null = null;
    // Keep the simple preview free of controls; the full preview exposes the public API.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "FXAA", width: 200 });
        gui.add(pass, "enabled").name("FXAA enabled");
        gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
        // Toggle pass.enabled to compare the same diagonal edge before and after FXAA.
        gui.onChange(runtime.invalidate);
    }
    void runtime.start();
    /** @example dispose(); @returns No value; release this preview's resources. */
    const dispose = (): void => {
        gui?.destroy();
        runtime.destroy();
    };
    return dispose;
};
