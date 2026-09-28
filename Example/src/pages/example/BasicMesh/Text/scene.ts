import { BaseMaterial, Camera, Font, Mesh, Render, Scene, Style, Text } from "bplinejs";
import type { Text2DOptions, TextWritingMode } from "bplinejs";
import GUI from "lil-gui";
import fontUrl from "@/assets/ttf/MiSans-Normal.woff2?url";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface TextControls {
    content: string;
    fontSize: number;
    lineSpacing: number;
    letterSpacing: number;
    textAlign: "left" | "center" | "right";
    baseline: "top" | "middle" | "bottom";
    writingMode: TextWritingMode;
    fill: string;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
    pointsEnabled: boolean;
    pointsRadius: number;
    pointsColor: string;
}

/**
 * Load MiSans and mount an editable multiline text scene.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountTextScene(options);
 * @returns Cleanup for font loading, WebGPU, animation, resizing, and GUI.
 */
export const mountTextScene = (options: SceneMountOptions): (() => void) => {
    const parameters: TextControls = {
        content: "你好世界\\n文字几何",
        fontSize: 52,
        lineSpacing: 12,
        letterSpacing: 2,
        textAlign: "center",
        baseline: "middle",
        writingMode: "horizontal-tb",
        fill: "#f4f7ff",
        edgeEnabled: true,
        edgeWidth: 3,
        edgeColor: "#67d8ff",
        pointsEnabled: false,
        pointsRadius: 2,
        pointsColor: "#ffc76d",
    };
    const lifecycle = { mounted: true };
    let animationFrame = 0;
    let render: Render | undefined;
    let gui: GUI | undefined;
    let resizeObserver: ResizeObserver | undefined;

    /**
     * Read mount state after asynchronous font or GPU initialization.
     * @example
     * isMounted();
     * @returns Whether this preview still owns its renderer.
     */
    const isMounted = (): boolean => lifecycle.mounted;

    /**
     * Create text only after the shared font registry has loaded its bytes.
     * @example
     * void initialize();
     * @returns Promise that settles after scene initialization.
     */
    const initialize = async (): Promise<void> => {
        try {
            await Font.register("MiSans", fontUrl);
            // React may unmount a preview while the font request is in flight.
            if (lifecycle.mounted) {
                const style = new Style();
                style.solid.enabled = true;
                style.solid.color.setHex(parameters.fill);
                // The advanced cell demonstrates border and key point geometry.
                if (options.advanced) {
                    style.edge.enabled = true;
                    style.edge.width = parameters.edgeWidth;
                    style.edge.color.setHex(parameters.edgeColor);
                    style.points.enabled = parameters.pointsEnabled;
                    style.points.vertices = true;
                    style.points.midpoints = false;
                    style.points.radius = parameters.pointsRadius;
                    style.points.minPointsLength = 18;
                    style.points.color.setHex(parameters.pointsColor);
                }

                const layout: Text2DOptions = {
                    lineSpacing: parameters.lineSpacing,
                    letterSpacing: parameters.letterSpacing,
                    textAlign: parameters.textAlign,
                    baseline: parameters.baseline,
                    writingMode: parameters.writingMode,
                };
                const geometry = new Text(parameters.content.replaceAll("\\n", "\n"), parameters.fontSize, "MiSans", layout);
                const mesh = new Mesh(geometry, new BaseMaterial(), false);
                mesh.style = style;
                const scene = new Scene();
                scene.add(mesh);
                const camera = new Camera();
                const renderer = new Render(options.container, "production");
                render = renderer;
                renderer.backgroundColor = { r: 0.06, g: 0.09, b: 0.15, a: 1 };

                /**
                 * Apply GUI edits through the public geometry and style setters.
                 * @example
                 * gui.add(parameters, "fontSize").onChange(updateText);
                 * @returns No value.
                 */
                const updateText = (): void => {
                    geometry.text = parameters.content.replaceAll("\\n", "\n");
                    geometry.fontSize = parameters.fontSize;
                    geometry.lineSpacing = parameters.lineSpacing;
                    geometry.letterSpacing = parameters.letterSpacing;
                    geometry.textAlign = parameters.textAlign;
                    geometry.baseline = parameters.baseline;
                    geometry.writingMode = parameters.writingMode;
                    style.solid.color.setHex(parameters.fill);
                    style.edge.enabled = parameters.edgeEnabled;
                    style.edge.width = parameters.edgeWidth;
                    style.edge.color.setHex(parameters.edgeColor);
                    style.points.enabled = parameters.pointsEnabled;
                    style.points.radius = parameters.pointsRadius;
                    style.points.color.setHex(parameters.pointsColor);
                };

                // Only the advanced preview owns editing controls.
                if (options.advanced && options.guiContainer) {
                    gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Text", width: 200 });
                    gui.add(parameters, "content").name("text (\\n = line)").onFinishChange(updateText);
                    gui.add(parameters, "fontSize", 16, 96, 1).onChange(updateText);
                    gui.add(parameters, "lineSpacing", 0, 40, 1).onChange(updateText);
                    gui.add(parameters, "letterSpacing", -10, 20, 1).onChange(updateText);
                    gui.add(parameters, "textAlign", ["left", "center", "right"]).onChange(updateText);
                    gui.add(parameters, "baseline", ["top", "middle", "bottom"]).onChange(updateText);
                    gui.add(parameters, "writingMode", ["horizontal-tb", "vertical-rl"]).onChange(updateText);
                    gui.addColor(parameters, "fill").onChange(updateText);
                    gui.add(parameters, "edgeEnabled").onChange(updateText);
                    gui.add(parameters, "edgeWidth", 0, 10, 1).onChange(updateText);
                    gui.addColor(parameters, "edgeColor").onChange(updateText);
                    gui.add(parameters, "pointsEnabled").onChange(updateText);
                    gui.add(parameters, "pointsRadius", 1, 8, 1).onChange(updateText);
                    gui.addColor(parameters, "pointsColor").onChange(updateText);
                }

                /**
                 * Match the camera to the actual preview canvas size.
                 * @example
                 * resizeObserver.observe(options.container);
                 * @returns No value.
                 */
                const updateViewport = (): void => {
                    const bounds = options.container.getBoundingClientRect();
                    renderer.resize();
                    camera.setViewport(Math.max(1, bounds.width * renderer.dpr), Math.max(1, bounds.height * renderer.dpr));
                };

                /**
                 * Draw the current geometry until this preview is removed.
                 * @example
                 * requestAnimationFrame(drawFrame);
                 * @returns No value.
                 */
                const drawFrame = (): void => {
                    // Route cleanup stops future frames before the renderer is destroyed.
                    if (isMounted()) {
                        renderer.render(scene, camera);
                        animationFrame = requestAnimationFrame(drawFrame);
                    }
                };

                await renderer.ready;
                // A second unmount can happen while the GPU device initializes.
                if (isMounted()) {
                    updateViewport();
                    resizeObserver = new ResizeObserver(updateViewport);
                    resizeObserver.observe(options.container);
                    animationFrame = requestAnimationFrame(drawFrame);
                }
            }
        } catch (error) {
            // Errors belong to the preview that is still mounted.
            if (lifecycle.mounted) {
                options.onError(error);
            }
        }
    };
    void initialize();

    /**
     * Release the preview even when the font request is still pending.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        lifecycle.mounted = false;
        cancelAnimationFrame(animationFrame);
        // An in-flight font request may finish before an observer exists.
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        // GUI listeners belong to this preview instance.
        if (gui) {
            gui.destroy();
        }
        // The renderer exists only after the font finishes loading.
        if (render) {
            render.destroy();
        }
    };
    return dispose;
};
