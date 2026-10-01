import { Mat3, Vec2 } from "bpmatrixjs/Math";
import {
    Base2D,
    Camera,
    CompositeMaterial,
    Mesh,
    Rect2D,
    Render,
    Scene,
    Style,
    Texture,
    WGSLMaterial,
} from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

/** A full vertex stage follows the existing Mesh matrix binding contract. */
const triangleVertexShader = `
@group(0) @binding(0) var<storage, read> modelMatrices: array<mat3x3<f32>>;
@group(0) @binding(1) var<uniform> viewMatrix: mat3x3<f32>;
@group(0) @binding(2) var<uniform> orthogonalMatrix: mat3x3<f32>;

struct VertexInput {
    @builtin(instance_index) instanceIndex: u32,
    @location(0) position: vec2f,
    @location(1) uv: vec2f,
};
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

@vertex fn main(input: VertexInput) -> VertexOutput {
    let local = vec3f(input.position + value_offset, 1.0);
    let clip = orthogonalMatrix * viewMatrix * modelMatrices[input.instanceIndex] * local;
    var output: VertexOutput;
    output.position = vec4f(clip.xy, 0.5, 1.0);
    output.uv = input.uv;
    return output;
}`;

/** The fragment stage reads a Mat3, Float32Array, and numeric value. */
const triangleFragmentShader = `
@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let mapped = value_transform * vec3f(uv, 1.0);
    return vec4f(mapped.x * value_weights[0], mapped.y, value_blue, 1.0);
}`;

/**
 * Create a tiny in-memory texture for the named bindings.
 * @param red Red channel.
 * @param green Green channel.
 * @param blue Blue channel.
 * @example
 * const texture = createColorTexture(255, 70, 100);
 * @returns Loaded Texture with four pixels.
 */
const createColorTexture = (red: number, green: number, blue: number): Texture => {
    const pixels = new Uint8ClampedArray([
        red, green, blue, 255,
        red, green, blue, 255,
        red, green, blue, 255,
        red, green, blue, 255,
    ]);
    return new Texture().setSource(new ImageData(pixels, 2, 2));
};

/**
 * Mount a simple section shader or the full multi-texture and direct-vertex scene.
 * @param options Canvas, GUI host, preview mode, and error reporter.
 * @example
 * const dispose = mountCustomMaterialScene(options);
 * @returns Cleanup for the renderer, observer, frame, and GUI.
 */
export const mountCustomMaterialScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0.08, g: 0.11, b: 0.19, a: 1 };
    const scene = new Scene();
    const camera = new Camera();
    const style = new Style();
    style.solid.enabled = true;
    const geometry = new Rect2D({ width: 104, height: 84, radius: 11, style });
    const material = new CompositeMaterial(style);
    material.raw.solidShader = "return vec4f(input.uv.x, 0.35, 0.9, 1.0);";
    const mesh = new Mesh(geometry, material, false);
    scene.add(mesh);

    let gui: GUI | undefined;
    // The full preview adds all three shader sections, two textures, and a direct-vertex mesh.
    if (options.advanced) {
        mesh.position.set(-72, 0);
        style.edge.enabled = true;
        style.edge.width = 6;
        style.points.enabled = true;
        style.points.radius = 5;
        const first = createColorTexture(255, 80, 95);
        const second = createColorTexture(70, 115, 255);
        const alternate = createColorTexture(250, 200, 65);
        const weights = new Float32Array([0.88]);
        material.raw.value = {
            first,
            second,
            blend: 0.55,
            tint: new Vec2(1, 1),
            transform: new Mat3(),
            weights,
        };
        material.raw.solidShader = `
    let mapped = value_transform * vec3f(input.uv, 1.0);
    let first = textureSampleLevel(value_first, valueSampler_first, mapped.xy, 0, 0.0);
    let second = textureSampleLevel(value_second, valueSampler_second, mapped.xy, 0, 0.0);
    return mix(first, second, value_blend) * vec4f(value_tint, value_weights[0], 1.0);`;
        material.raw.edgeShader = "return vec4f(0.15, 0.95, 0.85, 1.0);";
        material.raw.pointShader = "return vec4f(1.0, 0.78, 0.18, 1.0);";

        const triangleStyle = new Style();
        triangleStyle.solid.enabled = true;
        const triangleUv = new Float32Array([0, 0, 1, 0, 0.5, 1]);
        const triangle = new Base2D({
            vertices: new Float32Array([-48, -42, 48, -42, 0, 50]),
            uv: triangleUv,
            style: triangleStyle,
        });
        const triangleMaterial = new WGSLMaterial(triangleStyle);
        triangleMaterial.cullMode = "none";
        triangleMaterial.raw.value = {
            offset: new Vec2(0, 0),
            transform: new Mat3(),
            weights: new Float32Array([0.92]),
            blue: 0.82,
        };
        triangleMaterial.raw.vertexShader = triangleVertexShader;
        triangleMaterial.raw.fragmentShader = triangleFragmentShader;
        const triangleMesh = new Mesh(triangle, triangleMaterial, false);
        triangleMesh.position.set(72, 0);
        scene.add(triangleMesh);

        const parameters = {
            blend: 0.55,
            blue: 0.82,
            alternate: false,
            tipX: 0,
        };
        /**
         * Update numeric values, one texture binding, and same-size vertex data.
         * @example
         * gui.add(parameters, "blend").onChange(updateValues);
         * @returns No value.
         */
        const updateValues = (): void => {
            material.raw.value.blend = parameters.blend;
            triangleMaterial.raw.value.blue = parameters.blue;
            // The same field and type keeps the CompositeMaterial Pipeline key stable.
            if (parameters.alternate) {
                material.raw.value.second = alternate;
            } else {
                material.raw.value.second = second;
            }
            triangle.setData({
                vertices: new Float32Array([-48, -42, 48, -42, parameters.tipX, 50]),
                uv: triangleUv,
                style: triangleStyle,
            });
        };
        // Advanced controls are hosted by the preview cell's floating GUI slot.
        if (options.guiContainer) {
            gui = new GUI({
                autoPlace: false,
                container: options.guiContainer,
                title: "Custom shaders",
                width: 200,
            });
            gui.add(parameters, "blend", 0, 1, 0.01).onChange(updateValues);
            gui.add(parameters, "blue", 0, 1, 0.01).onChange(updateValues);
            gui.add(parameters, "alternate").onChange(updateValues);
            gui.add(parameters, "tipX", -40, 40, 1).onChange(updateValues);
        }
    }

    let animationFrame = 0;
    let mounted = true;
    /**
     * Keep the camera matched to the physical canvas size.
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
     * Draw the current GPU state until the preview unmounts.
     * @example
     * requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A removed route must not schedule work on a destroyed Render.
        if (mounted) {
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };
    /**
     * Start the scene after WebGPU initializes.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // StrictMode can dispose the first mount before the device resolves.
        if (mounted) {
            updateViewport();
            resizeObserver.observe(options.container);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };
    /**
     * Show a device failure inside the preview.
     * @param error WebGPU initialization failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // A late error is irrelevant after route cleanup.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release the scene, GUI, and browser callbacks.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        // Only the advanced cell creates a GUI.
        if (gui) {
            gui.destroy();
        }
        render.destroy();
    };
    return dispose;
};
