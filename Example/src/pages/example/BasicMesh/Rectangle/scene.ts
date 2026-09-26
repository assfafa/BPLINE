import {
    BaseMaterial,
    Camera,
    Mesh,
    Rect2D,
    Render,
    Scene,
    Style,
} from "bplinejs";
import GUI from "lil-gui";

export interface RectangleMountOptions {
    container: HTMLDivElement;
    guiContainer: HTMLDivElement | null;
    advanced: boolean;
    onError: (error: unknown) => void;
}

/**
 * Mount the same BPLineJS rectangle scene used by the code examples.
 * @param options Canvas host, optional GUI host, mode, and error reporter.
 * @example
 * const dispose = mountRectangleScene(options);
 * @returns Cleanup for the renderer, observer, animation, and GUI.
 */
export const mountRectangleScene = (options: RectangleMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };

    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex("#5577ee");

    // The advanced preview adds a geometry edge and point markers.
    if (options.advanced) {
        style.edge.enabled = true;
        style.edge.width = 6;
        style.edge.color.setHex("#8bd5ff");
        style.points.enabled = true;
        style.points.vertices = false;
        style.points.midpoints = true;
        style.points.radius = 7;
        style.points.minPointsLength = 32;
        style.points.minEdgePointsLength = 32;
        style.points.color.setHex("#ffbf69");
    }

    const geometry = new Rect2D({ width: 180, height: 110, radius: 18 });
    const material = new BaseMaterial();
    const mesh = new Mesh(geometry, material);
    mesh.style = style;
    const scene = new Scene();
    scene.add(mesh);
    const camera = new Camera();
    const parameters = {
        width: 180,
        height: 110,
        radius: 18,
        rotation: 0,
        fill: "#5577ee",
        edgeEnabled: true,
        edgeWidth: 6,
        edgeColor: "#8bd5ff",
        pointsEnabled: true,
        pointsVertices: false,
        pointsMidpoints: true,
        pointsRadius: 7,
        pointsMinLength: 32,
        pointsMinEdgeLength: 32,
        pointsColor: "#ffbf69",
    };
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Copy GUI values through the public geometry, transform, and style APIs.
     * @example
     * gui.add(parameters, "width").onChange(updateRectangle);
     * @returns No value.
     */
    const updateRectangle = (): void => {
        geometry.width = parameters.width;
        geometry.height = parameters.height;
        geometry.radius = parameters.radius;
        mesh.rotation = parameters.rotation * Math.PI / 180;
        style.solid.color.setHex(parameters.fill);
        style.edge.enabled = parameters.edgeEnabled;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.points.enabled = parameters.pointsEnabled;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    };

    // The advanced preview anchors its floating controls inside the canvas cell.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({
            autoPlace: false,
            container: options.guiContainer,
            title: "Rectangle",
            width: 200,
        });
        gui.add(parameters, "width", 60, 320, 1).onChange(updateRectangle);
        gui.add(parameters, "height", 40, 240, 1).onChange(updateRectangle);
        gui.add(parameters, "radius", 0, 80, 1).onChange(updateRectangle);
        gui.add(parameters, "rotation", -180, 180, 1).onChange(updateRectangle);
        gui.addColor(parameters, "fill").onChange(updateRectangle);
        gui.add(parameters, "edgeEnabled").onChange(updateRectangle);
        gui.add(parameters, "edgeWidth", 0, 24, 1).onChange(updateRectangle);
        gui.addColor(parameters, "edgeColor").onChange(updateRectangle);
        gui.add(parameters, "pointsEnabled").onChange(updateRectangle);
        gui.add(parameters, "pointsVertices").onChange(updateRectangle);
        gui.add(parameters, "pointsMidpoints").onChange(updateRectangle);
        gui.add(parameters, "pointsRadius", 1, 20, 1).onChange(updateRectangle);
        gui.add(parameters, "pointsMinLength", 0, 100, 1).name("vertex threshold").onChange(updateRectangle);
        gui.add(parameters, "pointsMinEdgeLength", 0, 100, 1).name("edge threshold").onChange(updateRectangle);
        gui.addColor(parameters, "pointsColor").onChange(updateRectangle);
    }

    /**
     * Keep the camera in physical pixels when the preview cell changes size.
     * @example
     * resizeObserver.observe(options.container);
     * @returns No value.
     */
    const updateViewport = (): void => {
        const bounds = options.container.getBoundingClientRect();
        render.resize();
        camera.setViewport(
            Math.max(1, bounds.width * render.dpr),
            Math.max(1, bounds.height * render.dpr),
        );
    };
    const resizeObserver = new ResizeObserver(updateViewport);

    /**
     * Draw after WebGPU is ready and after delayed canvas resizes.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // The cleanup stops scheduling frames before the renderer is destroyed.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Begin observing and drawing after WebGPU device creation.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // StrictMode may have already disposed the first mount.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Report unavailable WebGPU without leaving a blank unexplained preview.
     * @param error Device initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // Ignore a late device failure after route cleanup.
        if (mounted) {
            options.onError(error);
        }
    };

    void render.ready.then(handleReady, handleError);

    /**
     * Release every browser and GPU resource owned by this preview.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // The controller owns DOM listeners that must leave with its canvas.
        if (gui) {
            gui.destroy();
        }
        render.destroy();
    };

    return dispose;
};
