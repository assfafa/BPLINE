import { Mesh, Rect2D, Style, WGSLMaterial } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";
import SceneRuntime from "@/pages/example/reference/SceneRuntime.ts";
import { fragmentShader, vertexShader } from "./shaders.ts";

/** @param options Preview hosts and controls @example mountWgslScene(options); @returns GPU and GUI cleanup. */
export const mountWgslScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new SceneRuntime(options);
    const style = new Style();
    style.solid.enabled = true;
    const material = new WGSLMaterial(style);
    const viewport = new Vec2(1, 1);
    const parameters = { strength: 1, speed: 1, animate: true };
    material.raw.value = { time: 0, viewport, strength: parameters.strength };
    material.raw.fragmentShader = fragmentShader;
    // The simple example keeps the built-in vertex stage; the full one replaces both stages.
    if (options.advanced) {
        material.raw.vertexShader = vertexShader;
    }
    const mesh = new Mesh(new Rect2D({ width: 220, height: 150 }), material, style);
    // A shader that moves vertices outside CPU bounds must opt out of spatial culling.
    mesh.culling = false;
    runtime.scene.add(mesh);
    let gui: GUI | null = null;
    let time = 0;
    let previous = performance.now();
    // GUI changes update named values without rebuilding the shader layout.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "WGSLMaterial", width: 200 });
        gui.add(parameters, "strength", 0, 2, 0.05);
        gui.add(parameters, "speed", 0, 3, 0.1);
        gui.add(parameters, "animate");
    }
    /** @example update(); @returns No value; only upload changed values. */
    const update = (): void => {
        const now = performance.now();
        // Pausing the animation retains the current phase.
        if (parameters.animate) {
            time += (now - previous) / 1000 * parameters.speed;
        }
        previous = now;
        viewport.set(runtime.render.canvas.width / runtime.render.dpr, runtime.render.canvas.height / runtime.render.dpr);
        material.raw.value.time = time;
        material.raw.value.strength = parameters.strength;
    };
    runtime.update = update;
    void runtime.start();
    /** @example dispose(); @returns No value; release listeners and GPU resources. */
    const dispose = (): void => {
        gui?.destroy();
        runtime.destroy();
    };
    return dispose;
};
