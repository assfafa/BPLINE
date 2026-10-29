import { Camera, PostProcess, Render, RenderTarget, Scene } from "bplinejs";
import type { SceneMountOptions } from "../reference/ShapePreview.tsx";

/** Own only the website preview lifecycle; displayed examples remain standalone. */
export default class PostRuntime {
    public readonly scene: Scene = new Scene();
    public readonly camera: Camera = new Camera();
    public readonly render: Render;
    public readonly target: RenderTarget;
    public readonly post: PostProcess;
    public update: () => void = EmptyUpdate;
    private readonly _options: SceneMountOptions;
    private readonly _extent: number;
    private _mounted: boolean = true;
    private _dirty: boolean = true;
    private _frame: number = 0;
    private _width: number = 0;
    private _height: number = 0;
    private _observer: ResizeObserver | null = null;

    /** @param options Preview hosts and error reporter. @param extent World-space area to fit. @example new PostRuntime(options, 350); @returns A preview with its own GPU resources. */
    public constructor(options: SceneMountOptions, extent: number = 350) {
        this._options = options;
        this._extent = extent;
        this.render = new Render(options.container, "production");
        this.camera.setViewport(1, 1);
        this.target = new RenderTarget(this.scene, this.camera);
        this.post = new PostProcess(this.render);
    }

    /** @example await runtime.start(); @returns Initialization and first frame scheduling. */
    public async start(): Promise<void> {
        try {
            await this.render.ready;
            // React can unmount the preview while the device is being requested.
            if (this._mounted) {
                this.render.onHDR("preview", this.invalidate);
                this._observer = new ResizeObserver(this.resize);
                this._observer.observe(this._options.container);
                this.resize();
                this._frame = requestAnimationFrame(this.draw);
            }
        } catch (error) {
            // An error belongs only to the currently mounted preview.
            if (this._mounted) {
                this._options.onError(error);
            }
        }
    }

    /** @example runtime.invalidate(); @returns No value; coalesce GUI changes into one frame. */
    public invalidate = (): void => {
        this._dirty = true;
    };

    /** @example runtime.resize(); @returns No value; the frame loop observes the eventual canvas size. */
    private resize = (): void => {
        this.render.resize();
        this.invalidate();
    };

    /** @example requestAnimationFrame(runtime.draw); @returns No value; redraw static effects only when needed. */
    private draw = (): void => {
        // Prevent late callbacks from accessing a destroyed device.
        if (this._mounted) {
            try {
                const width = this.render.canvas.width;
                const height = this.render.canvas.height;
                // Render.resize is debounced; use its actual physical dimensions after it settles.
                if (width !== this._width || height !== this._height) {
                    this._width = width;
                    this._height = height;
                    this.camera.setViewport(width, height);
                    this.camera.zoom = Math.min(this.render.dpr, width / this._extent, height / this._extent);
                    this._dirty = true;
                }
                // Avoid continuously evaluating a Gaussian shader for an unchanged rectangle.
                if (this._dirty) {
                    this._dirty = false;
                    this.update();
                    this.render.renderPass(this.target);
                    this.post.render(this.target);
                }
                this._frame = requestAnimationFrame(this.draw);
            } catch (error) {
                this._options.onError(error);
            }
        }
    };

    /** @example runtime.destroy(); @returns No value; release targets before the shared device. */
    public destroy(): void {
        this._mounted = false;
        cancelAnimationFrame(this._frame);
        this._observer?.disconnect();
        this.render.deleteHDR("preview");
        this.post.destroy();
        this.target.destroy();
        this.render.destroy();
    }
}

/** @example EmptyUpdate(); @returns No value; most static effects do not need frame uniforms. */
const EmptyUpdate = (): void => {
    // Custom passes may replace this hook to refresh DPR-dependent uniforms.
};
