import { BaseMaterial, Camera, Mesh, NGon2D, Render, Scene, Style } from "bplinejs";
import type { NGonUVMode } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface NGonControls {
    outer: number;
    inner: number;
    sides: number;
    startAngle: number;
    uvMode: NGonUVMode;
    rotation: number;
    fill: string;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
    pointsEnabled: boolean;
    pointsVertices: boolean;
    pointsMidpoints: boolean;
    pointsRadius: number;
    pointsMinLength: number;
    pointsMinEdgeLength: number;
    pointsColor: string;
}

/**
 * Mount an editable regular polygon or ring using NGon2D.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountNGonScene(options);
 * @returns Cleanup for WebGPU, animation, resize observer, and GUI.
 */
export const mountNGonScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: NGonControls = {
        outer: 85,
        inner: 0,
        sides: 7,
        startAngle: 90,
        uvMode: "bounding",
        rotation: 0,
        fill: "#9c7cf0",
        edgeEnabled: true,
        edgeWidth: 6,
        edgeColor: "#8bd5ff",
        pointsEnabled: true,
        pointsVertices: true,
        pointsMidpoints: false,
        pointsRadius: 6,
        pointsMinLength: 28,
        pointsMinEdgeLength: 28,
        pointsColor: "#ffca79",
    };
    // The advanced preview starts as a ring so the inner radius is visible.
    if (options.advanced) {
        parameters.inner = 32;
    }
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(parameters.fill);

    // Edges and filtered point markers make the advanced topology visible.
    if (options.advanced) {
        style.edge.enabled = true;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.points.enabled = true;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    }

    const geometry = new NGon2D({
        outer: parameters.outer,
        inner: parameters.inner,
        sides: parameters.sides,
        uvMode: parameters.uvMode,
        startAngle: parameters.startAngle * Math.PI / 180,
    });
    const material = new BaseMaterial();
    const mesh = new Mesh(geometry, material);
    mesh.style = style;
    const scene = new Scene();
    scene.add(mesh);
    const camera = new Camera();
    let gui: GUI | undefined;
    let animationFrame = 0;
    let mounted = true;

    /**
     * Apply controls through public NGon2D, Mesh, and Style properties.
     * @example
     * gui.add(parameters, "sides").onChange(updateNGon);
     * @returns No value.
     */
    const updateNGon = (): void => {
        geometry.outer = parameters.outer;
        geometry.inner = parameters.inner;
        geometry.sides = parameters.sides;
        geometry.startAngle = parameters.startAngle * Math.PI / 180;
        geometry.uvMode = parameters.uvMode;
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

    // The GUI is confined to the advanced canvas cell.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Regular polygon", width: 200 });
        gui.add(parameters, "outer", 30, 130, 1).onChange(updateNGon);
        gui.add(parameters, "inner", 0, 100, 1).onChange(updateNGon);
        gui.add(parameters, "sides", 3, 32, 1).onChange(updateNGon);
        gui.add(parameters, "startAngle", -180, 180, 1).onChange(updateNGon);
        gui.add(parameters, "uvMode", ["bounding", "polar"]).onChange(updateNGon);
        gui.add(parameters, "rotation", -180, 180, 1).onChange(updateNGon);
        gui.addColor(parameters, "fill").onChange(updateNGon);
        gui.add(parameters, "edgeEnabled").onChange(updateNGon);
        gui.add(parameters, "edgeWidth", 0, 24, 1).onChange(updateNGon);
        gui.addColor(parameters, "edgeColor").onChange(updateNGon);
        gui.add(parameters, "pointsEnabled").onChange(updateNGon);
        gui.add(parameters, "pointsVertices").onChange(updateNGon);
        gui.add(parameters, "pointsMidpoints").onChange(updateNGon);
        gui.add(parameters, "pointsRadius", 1, 16, 1).onChange(updateNGon);
        gui.add(parameters, "pointsMinLength", 0, 120, 1).name("vertex threshold").onChange(updateNGon);
        gui.add(parameters, "pointsMinEdgeLength", 0, 120, 1).name("edge threshold").onChange(updateNGon);
        gui.addColor(parameters, "pointsColor").onChange(updateNGon);
    }

    /**
     * Keep the camera in physical pixels when its preview cell is resized.
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
     * Draw until route cleanup stops the animation loop.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A disposed renderer must never receive another frame.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start resizing and drawing once the GPU device is ready.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // StrictMode can dispose a first mount before device initialization finishes.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Report WebGPU setup failures to the visible preview cell.
     * @param error Initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // Ignore failures arriving after this route has been left.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release resources owned by this preview on route changes.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // lil-gui registers DOM listeners only while the advanced cell is mounted.
        if (gui) {
            gui.destroy();
        }
        render.destroy();
    };

    return dispose;
};
