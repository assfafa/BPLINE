import { BaseMaterial, Camera, CameraControl, IMesh, Rect2D, Render, Scene, Style } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface InstanceControls {
    count: number;
    spacing: number;
    size: number;
    rotation: number;
    zoom: number;
    palette: "checker" | "stripes" | "gradient";
    primary: string;
    secondary: string;
}

/**
 * Mount a shared-geometry IMesh with independently styled instances.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountInstanceScene(options);
 * @returns Cleanup for the renderer, animation, observer, and GUI.
 */
export const mountInstanceScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: InstanceControls = {
        count: 50000,
        spacing: 13,
        size: 12,
        rotation: 0,
        zoom: 0.1,
        palette: "checker",
        primary: "#9377ed",
        secondary: "#54c8db",
    };
    // Geometry enables the solid partition once; each instance supplies its own color.
    const geometryStyle = new Style();
    geometryStyle.solid.enabled = true;
    const geometry = new Rect2D({ width: parameters.size, height: parameters.size, radius: 1, style: geometryStyle });
    const mesh = new IMesh(geometry, new BaseMaterial(), { raw: false, capacity: 50000 });
    const scene = new Scene();
    const camera = new Camera();
    const control = new CameraControl(camera, render);
    control.is = true;
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Pack 50,000 or 100,000 frozen instances into one shared mesh.
     * @example
     * gui.add(parameters, "count").onChange(rebuildAndFit);
     * @returns No value.
     */
    const rebuildInstances = (): void => {
        mesh.clear();
        const columns = Math.ceil(Math.sqrt(parameters.count));
        const rows = Math.ceil(parameters.count / columns);
        const primaryStyle = new Style();
        primaryStyle.solid.enabled = true;
        primaryStyle.solid.color.setHex(parameters.primary);
        const secondaryStyle = new Style();
        secondaryStyle.solid.enabled = true;
        secondaryStyle.solid.color.setHex(parameters.secondary);
        // Frozen records copy the position and style immediately, so these inputs are reused.
        const position = new Vec2();
        const scale = new Vec2(1, 1);
        const instance = { position, scale, rotation: parameters.rotation * Math.PI / 180, style: primaryStyle };
        for (let index = 0; index < parameters.count; index++) {
            // Center the complete grid, including its shorter final row.
            const column = index % columns;
            const row = Math.floor(index / columns);
            position.set((column - (columns - 1) / 2) * parameters.spacing, (row - (rows - 1) / 2) * parameters.spacing);
            let usePrimary = (Math.floor(row / 16) + Math.floor(column / 16)) % 2 === 0;
            // Larger color blocks stay legible when the complete grid is fitted to the preview.
            if (parameters.palette === "stripes") {
                usePrimary = Math.floor(column / 16) % 2 === 0;
            } else if (parameters.palette === "gradient") {
                // The gradient palette divides the field across rows.
                usePrimary = row < rows / 2;
            }
            // Both styles are shared because raw=false snapshots their values at push time.
            if (usePrimary) {
                instance.style = primaryStyle;
            } else {
                instance.style = secondaryStyle;
            }
            mesh.push(instance);
        }
    };
    rebuildInstances();
    scene.add(mesh);

    /**
     * Fit the entire instance field inside its current canvas cell.
     * @example
     * fitInstances();
     * @returns No value.
     */
    const fitInstances = (): void => {
        const bounds = options.container.getBoundingClientRect();
        const columns = Math.ceil(Math.sqrt(parameters.count));
        const rows = Math.ceil(parameters.count / columns);
        const width = columns * parameters.spacing;
        const height = rows * parameters.spacing;
        parameters.zoom = Number((Math.min(bounds.width * render.dpr / width, bounds.height * render.dpr / height) * 0.6).toFixed(2));
        camera.position.set(0, 0);
        camera.zoom = parameters.zoom;
    };

    /**
     * Update rectangle geometry without repacking existing instance transforms.
     * @example
     * gui.add(parameters, "size").onChange(updateGeometry);
     * @returns No value.
     */
    const updateGeometry = (): void => {
        geometry.width = parameters.size;
        geometry.height = parameters.size;
    };

    /**
     * Apply a zoom slider change without rebuilding instance buffers.
     * @example
     * gui.add(parameters, "zoom").onChange(updateZoom);
     * @returns No value.
     */
    const updateZoom = (): void => {
        camera.zoom = parameters.zoom;
    };

    /**
     * Repack the grid and refit it after count or spacing changes.
     * @example
     * gui.add(parameters, "count").onFinishChange(rebuildAndFit);
     * @returns No value.
     */
    const rebuildAndFit = (): void => {
        rebuildInstances();
        fitInstances();
    };

    // Repack only after a control is released; each repack writes tens of thousands of instances.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Instanced mesh", width: 200 });
        gui.add(parameters, "count", { "50,000": 50000, "100,000": 100000 }).onChange(rebuildAndFit);
        gui.add(parameters, "spacing", 8, 20, 1).onFinishChange(rebuildAndFit);
        gui.add(parameters, "size", 4, 16, 1).onChange(updateGeometry);
        gui.add(parameters, "rotation", -90, 90, 1).onFinishChange(rebuildInstances);
        gui.add(parameters, "zoom", 0.05, 2, 0.01).listen().onChange(updateZoom);
        gui.add(parameters, "palette", ["checker", "stripes", "gradient"]).onChange(rebuildInstances);
        gui.addColor(parameters, "primary").onFinishChange(rebuildInstances);
        gui.addColor(parameters, "secondary").onFinishChange(rebuildInstances);
        gui.add({ fit: fitInstances }, "fit").name("fit all");
    }

    /**
     * Match the camera viewport to the actual WebGPU drawing surface.
     * @example
     * resizeObserver.observe(options.container);
     * @returns No value.
     */
    const updateViewport = (): void => {
        const bounds = options.container.getBoundingClientRect();
        render.resize();
        camera.setViewport(Math.max(1, bounds.width * render.dpr), Math.max(1, bounds.height * render.dpr));
    };
    const resizeObserver = new ResizeObserver(updateViewport);

    /**
     * Draw the current instance data until this preview unmounts.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // Frames scheduled before unmount must not access a destroyed renderer.
        if (mounted) {
            control.update();
            // Reflect wheel and pinch zoom in the GUI without showing a long fractional value.
            parameters.zoom = Number(camera.zoom.toFixed(2));
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start the preview when GPU initialization finishes.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // GPU readiness may arrive after React has already removed this preview.
        if (mounted) {
            updateViewport();
            fitInstances();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Show GPU failures in the preview cell.
     * @param error Initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // A stale asynchronous failure should not update an unmounted preview.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release this scene when the route or preview mode changes.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // Simple previews never create a GUI, so only destroy an existing panel.
        if (gui) {
            gui.destroy();
        }
        control.dispose();
        render.destroy();
    };
    return dispose;
};
