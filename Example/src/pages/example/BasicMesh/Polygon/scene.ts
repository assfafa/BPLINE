import { BaseMaterial, Camera, Mesh, Poly2D, Render, Scene, Style } from "bplinejs";
import type { JoinType } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

interface PolygonControls {
    width: number;
    height: number;
    notch: number;
    closed: boolean;
    rotation: number;
    fill: string;
    edgeEnabled: boolean;
    edgeWidth: number;
    edgeColor: string;
    join: JoinType;
    joinSegments: number;
    pointsEnabled: boolean;
    pointsVertices: boolean;
    pointsMidpoints: boolean;
    pointsRadius: number;
    pointsMinLength: number;
    pointsMinEdgeLength: number;
    pointsColor: string;
}

/**
 * Build a concave five-point outline from editable dimensions.
 * @param width Overall polygon width.
 * @param height Overall polygon height.
 * @param notch Depth of the upper inward corner.
 * @example
 * createPolygonPoints(210, 150, 45);
 * @returns Flat x/y coordinates for Poly2D.
 */
const createPolygonPoints = (width: number, height: number, notch: number): Float32Array => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return new Float32Array([
        -halfWidth, -halfHeight,
        halfWidth, -halfHeight,
        halfWidth, halfHeight,
        0, halfHeight - notch,
        -halfWidth, halfHeight,
    ]);
};

/**
 * Mount an editable Poly2D scene with edge, join, and point styling.
 * @param options Canvas and GUI hosts, preview mode, and error callback.
 * @example
 * const dispose = mountPolygonScene(options);
 * @returns Cleanup for WebGPU, animation, resize observer, and GUI.
 */
export const mountPolygonScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const parameters: PolygonControls = {
        width: 210,
        height: 150,
        notch: 45,
        closed: true,
        rotation: 0,
        fill: "#5b8def",
        edgeEnabled: true,
        edgeWidth: 7,
        edgeColor: "#92e6cc",
        join: "round",
        joinSegments: 10,
        pointsEnabled: true,
        pointsVertices: true,
        pointsMidpoints: true,
        pointsRadius: 6,
        pointsMinLength: 22,
        pointsMinEdgeLength: 30,
        pointsColor: "#ffcb77",
    };
    const style = new Style();
    style.solid.enabled = true;
    style.solid.color.setHex(parameters.fill);

    // The advanced cell demonstrates extra public Style sections.
    if (options.advanced) {
        style.edge.enabled = true;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.join.type = parameters.join;
        style.join.seg = parameters.joinSegments;
        style.points.enabled = true;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    }

    const geometry = new Poly2D(createPolygonPoints(parameters.width, parameters.height, parameters.notch));
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
     * Apply GUI values through the public Poly2D, Mesh, and Style APIs.
     * @example
     * gui.add(parameters, "notch").onChange(updatePolygon);
     * @returns No value.
     */
    const updatePolygon = (): void => {
        // Disable fill before opening the path; Poly2D disallows solid open paths.
        if (parameters.closed) {
            geometry.closed = true;
            style.solid.enabled = true;
        } else {
            style.solid.enabled = false;
            geometry.closed = false;
        }
        geometry.points = createPolygonPoints(parameters.width, parameters.height, parameters.notch);
        mesh.rotation = parameters.rotation * Math.PI / 180;
        style.solid.color.setHex(parameters.fill);
        style.edge.enabled = parameters.edgeEnabled;
        style.edge.width = parameters.edgeWidth;
        style.edge.color.setHex(parameters.edgeColor);
        style.join.type = parameters.join;
        style.join.seg = parameters.joinSegments;
        style.points.enabled = parameters.pointsEnabled;
        style.points.vertices = parameters.pointsVertices;
        style.points.midpoints = parameters.pointsMidpoints;
        style.points.radius = parameters.pointsRadius;
        style.points.minPointsLength = parameters.pointsMinLength;
        style.points.minEdgePointsLength = parameters.pointsMinEdgeLength;
        style.points.color.setHex(parameters.pointsColor);
    };

    // The GUI floats over the advanced preview and leaves the simple cell unchanged.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Polygon", width: 200 });
        gui.add(parameters, "width", 100, 300, 1).onChange(updatePolygon);
        gui.add(parameters, "height", 80, 220, 1).onChange(updatePolygon);
        gui.add(parameters, "notch", 0, 80, 1).onChange(updatePolygon);
        gui.add(parameters, "closed").onChange(updatePolygon);
        gui.add(parameters, "rotation", -180, 180, 1).onChange(updatePolygon);
        gui.addColor(parameters, "fill").onChange(updatePolygon);
        gui.add(parameters, "edgeEnabled").onChange(updatePolygon);
        gui.add(parameters, "edgeWidth", 0, 24, 1).onChange(updatePolygon);
        gui.addColor(parameters, "edgeColor").onChange(updatePolygon);
        gui.add(parameters, "join", ["miter", "round", "bevel"]).onChange(updatePolygon);
        gui.add(parameters, "joinSegments", 1, 24, 1).onChange(updatePolygon);
        gui.add(parameters, "pointsEnabled").onChange(updatePolygon);
        gui.add(parameters, "pointsVertices").onChange(updatePolygon);
        gui.add(parameters, "pointsMidpoints").onChange(updatePolygon);
        gui.add(parameters, "pointsRadius", 1, 16, 1).onChange(updatePolygon);
        gui.add(parameters, "pointsMinLength", 0, 120, 1).name("vertex threshold").onChange(updatePolygon);
        gui.add(parameters, "pointsMinEdgeLength", 0, 120, 1).name("edge threshold").onChange(updatePolygon);
        gui.addColor(parameters, "pointsColor").onChange(updatePolygon);
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
