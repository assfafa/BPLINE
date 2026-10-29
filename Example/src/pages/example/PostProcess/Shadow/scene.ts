import { BaseMaterial, Mesh, Rect2D, Style, Shadow } from "bplinejs";
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
    style.shadow.enabled = true;
    style.shadow.color.setHex("#000000");
    style.shadow.opacity = 0.6;
    style.shadow.blur = 18;
    style.shadow.spread = 2;
    style.shadow.offsetX = 12;
    style.shadow.offsetY = -12;
    style.shadow.inner = false;
    style.shadow.outer = true;
    const mesh = new Mesh(new Rect2D({ width: 180, height: 120, style }), new BaseMaterial(style), style);
    mesh.rotation = 0.32;
    scene.add(mesh);
    const pass = new Shadow();
    post.add("shadow", pass);
    let gui: GUI | null = null;
    // Keep the simple preview free of controls; the full preview exposes the public API.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Shadow", width: 200 });
        gui.add(pass, "enabled").name("Shadow enabled");
        gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
        gui.add(style.shadow, "enabled").name("style.shadow.enabled");
        gui.add(style.shadow, "blur", 0, 50, 1);
        gui.add(style.shadow, "spread", 0, 20, 1);
        gui.add(style.shadow, "offsetX", -40, 40, 1);
        gui.add(style.shadow, "offsetY", -40, 40, 1);
        gui.add(style.shadow, "opacity", 0, 1, 0.05);
        gui.add(style.shadow, "inner");
        gui.add(style.shadow, "outer");
        const colors = { color: "#000000" };
        /** @param value CSS hex color. @example setColor("#45baff"); @returns No value; update the effect color. */
        const setColor = (value: string): void => {
            style.shadow.color.setHex(value);
        };
        gui.addColor(colors, "color").onChange(setColor);
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
