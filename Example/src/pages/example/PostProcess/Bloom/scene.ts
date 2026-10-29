import { BaseMaterial, Mesh, Rect2D, Style, Bloom } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "../../reference/ShapePreview.tsx";
import PostRuntime from "../Runtime.ts";

/** @param options Preview hosts and mode. @example mountScene(options); @returns Cleanup for route changes. */
export const mountScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new PostRuntime(options, 350);
    const { scene, post, render } = runtime;
    const style = new Style();
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
    post.add("bloom", pass);
    let gui: GUI | null = null;
    let status: HTMLOutputElement | null = null;
    // Keep the simple preview free of controls; the full preview exposes the public API.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Bloom", width: 200 });
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
        status = document.createElement("output");
        status.style.cssText = "position:absolute;left:8px;bottom:8px;font:11px monospace;pointer-events:none;color:inherit";
        options.container.append(status);
        gui.onChange(runtime.invalidate);
    }
    /** @example update(); @returns No value; refresh pixel ratio or current HDR status. */
    const update = (): void => {
        // Only the complete example creates the HDR status label.
        if (status) {
            status.textContent = "HDR available: " + String(render.hdrAvailable) + " / enabled: " + String(render.hdrEnabled);
        }
    };
    runtime.update = update;
    void runtime.start();
    /** @example dispose(); @returns No value; release this preview's resources. */
    const dispose = (): void => {
        gui?.destroy();
        status?.remove();
        runtime.destroy();
    };
    return dispose;
};
