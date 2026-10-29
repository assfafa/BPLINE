import { BaseMaterial, Mesh, Rect2D, Style, WgslPass } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "../../reference/ShapePreview.tsx";
import PostRuntime from "../Runtime.ts";
import { fragmentShader } from "./shader.ts";

/** @param options Preview hosts and mode. @example mountScene(options); @returns Cleanup for route changes. */
export const mountScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new PostRuntime(options, 760);
    const { scene, post, render } = runtime;
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#ff8a34");

    const mesh = new Mesh(new Rect2D({ width: 600, height: 600, style }), new BaseMaterial(style), style);
    mesh.rotation = 0;
    scene.add(mesh);
    const pass = new WgslPass();
    pass.raw.value = { radius: 20, pixelRatio: render.dpr };
    pass.raw.fragmentShader = fragmentShader;
    post.add("wgsl", pass);
    let gui: GUI | null = null;
    // Keep the simple preview free of controls; the full preview exposes the public API.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "WgslPass", width: 200 });
        gui.add(pass, "enabled").name("WgslPass enabled");
        gui.add(mesh, "rotation", -Math.PI, Math.PI, 0.01);
        const settings = { radius: 20 };
        /** @param value Gaussian radius in CSS pixels. @example setRadius(20); @returns No value; update the named shader uniform. */
        const setRadius = (value: number): void => {
            pass.raw.value.radius = value;
        };
        gui.add(settings, "radius", 0, 24, 1).onChange(setRadius);
        gui.add(pass, "resolutionScale", { Half: 0.5, Full: 1 });
        gui.onChange(runtime.invalidate);
    }
    /** @example update(); @returns No value; refresh pixel ratio or current HDR status. */
    const update = (): void => {
        pass.raw.value.pixelRatio = render.dpr;
    };
    runtime.update = update;
    void runtime.start();
    /** @example dispose(); @returns No value; release this preview's resources. */
    const dispose = (): void => {
        gui?.destroy();
        runtime.destroy();
    };
    return dispose;
};
