import { Camera, Render, Scene } from "bplinejs";
import type { HelperGrid } from "bplinejs";
import type { Theme } from "@/theme/context.ts";
import type { SceneMountOptions } from "./ShapePreview.tsx";

/** Own the GPU, animation and viewport lifecycle of a preview. */
export default class SceneRuntime {
    public readonly scene: Scene = new Scene();
    public readonly camera: Camera = new Camera();
    public readonly render: Render;
    public mounted: boolean = true;
    public update: () => void = EmptyUpdate;
    private readonly _options: SceneMountOptions;
    private _frame: number = 0;
    private _observer: ResizeObserver | null = null;
    public helper: HelperGrid | null = null;
    private _theme: Theme | null = null;
    private _fitted: boolean = false;

    /**
     * Attach the renderer to the preview host.
     * @param options Host and error reporting supplied by ShapePreview.
     * @example const runtime = new SceneRuntime(options);
     * @returns A preview lifecycle owner.
     */
    public constructor(options: SceneMountOptions) {
        this._options = options;
        this.render = new Render(options.container, "production");
    }

    /**
     * Start only after WebGPU has initialized.
     * @example await runtime.start();
     * @returns A promise settling after startup or error reporting.
     */
    public async start(): Promise<void> {
        try {
            await this.render.ready;
            // A route may disappear while WebGPU is requesting its device.
            if (this.mounted) {
                this.resize();
                this._observer = new ResizeObserver(this.resize);
                this._observer.observe(this._options.container);
                this._frame = requestAnimationFrame(this.draw);
            }
        } catch (error) {
            // Report initialization failures only to the owning mounted cell.
            if (this.mounted) {
                this._options.onError(error);
            }
        }
    }

    /**
     * Use physical pixels for both the renderer and camera.
     * @example runtime.resize();
     * @returns No value.
     */
    private resize = (): void => {
        const bounds = this._options.container.getBoundingClientRect();
        this.render.resize();
        this.camera.setViewport(Math.max(1, bounds.width * this.render.dpr), Math.max(1, bounds.height * this.render.dpr));
        // Fit once; subsequent resizes preserve the user's pan and zoom.
        if (this._fitted === false) {
            const physicalWidth = bounds.width * this.render.dpr;
            const physicalHeight = bounds.height * this.render.dpr;
            this.camera.zoom = Math.max(0.1, Math.min(this.render.dpr, physicalWidth / 350, physicalHeight / 280));
            this._fitted = true;
        }
    };

    /**
     * Update interaction before preparing the render lists.
     * @example requestAnimationFrame(runtime.draw);
     * @returns No value.
     */
    private draw = (): void => {
        // Disposal prevents another frame from touching a destroyed GPU device.
        if (this.mounted) {
            const theme = this._options.getTheme();
            // Apply only on theme changes so custom GUI palettes remain editable between changes.
            if (this.helper !== null && this._theme !== theme) {
                this.helper.mode = theme;
                this._theme = theme;
            }
            this.update();
            this.render.render(this.scene, this.camera);
            this._frame = requestAnimationFrame(this.draw);
        }
    };

    /**
     * Stop frames and release GPU resources.
     * @example runtime.destroy();
     * @returns No value.
     */
    public destroy(): void {
        this.mounted = false;
        cancelAnimationFrame(this._frame);
        this._observer?.disconnect();
        this.render.destroy();
    }
}

/**
 * Default frame hook before an editor or helper is ready.
 * @example EmptyUpdate();
 * @returns No value.
 */
const EmptyUpdate = (): void => {
    // The renderer can initialize before interaction resources are ready.
};
