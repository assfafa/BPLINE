import { GetInner } from "bpmatrixjs/Utils";
import type Camera from "../Camera";
import type { GeoData } from "../Geometry";
import type { Material2d } from "../global-types";
import { GETID } from "../ID";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import type { TextureResource } from "../Texture/Layers";
import BufferManager from "./BufferManager";
import DevelopmentValidator from "./DevelopmentValidator";
import DepthManager from "./DepthManager";
import DestroyManager from "./DestroyManager";
import DrawCallManager from "./DrawCallManager";
import PipelineManager from "./PipelineManager";
import SamplerManager from "./SamplerManager";
import { InitCamera, InitScene, MatrixUpdate } from "./SceneUpdate";
import TextureManager from "./TextureManager";
import type {
    GeometryBufferLike,
    GPUTextureResourceLike,
    MeshStyleBufferLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
} from "./types";

/**
 * WebGPU 2D 渲染器。
 * 负责生命周期和渲染流程调度，具体 GPU 资源由各管理器维护。
 * @class
 * @implements RenderLike
 */
class Render implements RenderLike {
    /**
     * 当前 Render 的全局唯一 ID。
     */
    public readonly id: number;

    /**
     * 对象类型。
     */
    public readonly type: string = "Render";

    /**
     * 画布容器。
     */
    public container: HTMLElement;

    /**
     * 渲染画布。
     */
    public canvas: HTMLCanvasElement;

    /**
     * 每帧开始前用于清空画布的 RGBA 颜色。
     */
    public backgroundColor: GPUColorDict = { r: 0, g: 0, b: 0, a: 0 };

    /**
     * 当前 Render 的共享 WebGPU 资源。
     */
    public pipeline: PipelineLike;

    /**
     * WebGPU 初始化完成状态。
     */
    public readonly ready: Promise<void>;

    private _alphaMode: GPUCanvasAlphaMode;
    private _resizeTimer: number | null;
    private _destroyed: boolean;
    private _dpr: number;
    private _renderMode: RenderMode;
    private readonly bufferManager: BufferManager;
    private readonly destroyManager: DestroyManager;
    private readonly drawCallManager: DrawCallManager;
    private readonly pipelineManager: PipelineManager;
    private readonly textureManager: TextureManager;

    /**
     * 创建渲染器并开始异步初始化 WebGPU。
     * @param div 容器节点或容器 ID
     * @param renderMode Render 运行模式
     */
    public constructor(div: HTMLElement | string, renderMode: RenderMode = "development") {
        this.id = GETID();

        if (typeof div === "string") {
            const container: HTMLElement | null = document.getElementById(div);

            if (container === null) {
                throw new Error(`Render container "${div}" was not found.`);
            }

            this.container = container;
        } else {
            this.container = div;
        }

        this.canvas = document.createElement("canvas");
        this.canvas.style.display = "block";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.container.appendChild(this.canvas);
        this._alphaMode = "premultiplied";
        this._resizeTimer = null;
        this._destroyed = false;
        this._dpr = GetInner().dpr;
        this._renderMode = renderMode;
        this.pipeline = {
            pipelineTemplates: new Map<string, PipelineTemplateLike>(),
            textures: new Map<number, GPUTextureResourceLike>(),
            samplers: new Map<string, GPUSampler>(),
            sceneResources: new Map<number, SceneResourcesLike>(),
            buffers: {
                meshMatrix: new Map(),
                meshDepth: new Map(),
                geometry: new Map<number, GeometryBufferLike>(),
                meshStyle: new Map<number, MeshStyleBufferLike>(),
                cameraUniform: [],
            },
        };

        this.destroyManager = new DestroyManager(this.pipeline);
        this.textureManager = new TextureManager(this.pipeline);
        const samplerManager = new SamplerManager(this.pipeline);

        this.pipelineManager = new PipelineManager(this.pipeline, this.textureManager, samplerManager);
        this.bufferManager = new BufferManager(this.pipeline);
        this.drawCallManager = new DrawCallManager(this.pipeline, samplerManager);
        this.ready = this.initWebGPU();
    }

    /**
     * 创建当前画布对应的 WebGPU 设备与呈现上下文。
     * @returns WebGPU 初始化完成状态
     */
    public async initWebGPU(): Promise<void> {
        const webGPU: GPU | undefined = (navigator as { gpu?: GPU }).gpu;

        if (webGPU === undefined) {
            throw new Error("WebGPU is not supported by this browser.");
        }

        const adapter: GPUAdapter | null = await webGPU.requestAdapter();

        if (adapter === null) {
            throw new Error("No compatible WebGPU adapter was found.");
        }

        if (this.isDestroyed()) {
            return;
        }

        const device: GPUDevice = await adapter.requestDevice();

        if (this.isDestroyed()) {
            device.destroy();
            return;
        }

        const context: GPUCanvasContext | null = this.canvas.getContext("webgpu");

        if (context === null) {
            throw new Error("WebGPU canvas context could not be created.");
        }

        const format: GPUTextureFormat = webGPU.getPreferredCanvasFormat();

        context.configure({
            device,
            format,
            alphaMode: this._alphaMode,
        });
        this.pipeline.adapter = adapter;
        this.pipeline.device = device;
        this.pipeline.context = context;
        this.pipeline.format = format;
        this.pipelineManager.initResources(device);
    }

    /**
     * 设置 Canvas 与下层 HTML 内容的 Alpha 合成方式。
     * @param alphaMode Alpha 合成方式
     */
    public set alphaMode(alphaMode: GPUCanvasAlphaMode) {
        if (this._alphaMode === alphaMode) {
            return;
        }

        this._alphaMode = alphaMode;

        const device: GPUDevice | undefined = this.pipeline.device;
        const context: GPUCanvasContext | undefined = this.pipeline.context;
        const format: GPUTextureFormat | undefined = this.pipeline.format;

        if (device !== undefined && context !== undefined && format !== undefined) {
            context.configure({ device, format, alphaMode });
        }
    }

    /**
     * 获取 Canvas Alpha 合成方式。
     * @returns Alpha 合成方式
     */
    public get alphaMode(): GPUCanvasAlphaMode {
        return this._alphaMode;
    }

    /**
     * 获取当前 Canvas 使用的设备像素比。
     * @returns 设备像素比
     */
    public get dpr(): number {
        return this._dpr;
    }

    /**
     * 设置 Render 运行模式。
     * production 会跳过 GPUBuffer 创建前的全部开发检查。
     * @param renderMode Render 运行模式
     */
    public set renderMode(renderMode: RenderMode) {
        this._renderMode = renderMode;
    }

    /**
     * 获取 Render 运行模式。
     * @returns 当前 Render 运行模式
     */
    public get renderMode(): RenderMode {
        return this._renderMode;
    }

    /**
     * 预热场景所需缓存，但不提交 DrawCall。
     * @param scene 场景对象
     * @param camera 相机对象
     * @returns 无返回值
     */
    public warmup(scene: Scene, camera: Camera): void {
        if (this._destroyed || this.pipeline.device === undefined) {
            return;
        }

        this.initScene(scene);
        if (this.pipeline.sceneResources.get(scene.id)?.version !== scene.version) {
            this.trim(scene);
        }

        this.matrixUpdate(scene);
        this.initCamera(camera);
        this.drawBuffers(scene, camera);
        this.drawTextures(scene);
        this.drawPipelines(scene);
        this.drawCallManager.prepare(this.canvas.width, this.canvas.height);
    }

    /**
     * 预热缓存并绘制当前场景。
     * @param scene 场景对象
     * @param camera 相机对象
     * @returns 无返回值
     */
    public render(scene: Scene, camera: Camera): void {
        if (this._destroyed || this.pipeline.device === undefined) {
            return;
        }

        this.warmup(scene, camera);
        this.drawCall(scene);
    }

    /**
     * 创建或更新当前场景的 GPUBuffer。
     * @param scene 场景对象
     * @param camera 相机对象
     * @returns 无返回值
     */
    public drawBuffers(scene: Scene, camera: Camera): void {
        this.bufferManager.draw(scene, camera, this._dpr, this._renderMode);
    }

    /**
     * 创建或更新当前场景的 GPUTexture。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public drawTextures(scene: Scene): void {
        this.textureManager.draw(scene);
    }

    /**
     * 创建或更新当前场景的 Pipeline 模板。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public drawPipelines(scene: Scene): void {
        this.pipelineManager.draw(scene);
    }

    /**
     * 编码并提交当前场景的绘制命令。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public drawCall(scene: Scene): void {
        this.drawCallManager.draw(scene, this.backgroundColor, this._alphaMode);
    }

    /**
     * 销毁指定 Mesh 缓存。
     * @param mesh Mesh 对象或全局 ID
     * @returns 是否销毁了任意资源
     */
    public destroyMesh(mesh: MeshLike | number): boolean {
        return this.destroyManager.destroyMesh(mesh);
    }

    /**
     * 销毁指定 Texture 缓存。
     * @param texture Texture 对象或全局 ID
     * @returns 是否销毁了对应资源
     */
    public destroyTexture(texture: TextureResource | number): boolean {
        return this.destroyManager.destroyTexture(texture);
    }

    /**
     * 销毁指定 Material 缓存。
     * @param material Material 对象或全局 ID
     * @returns 是否销毁了任意资源
     */
    public destroyMaterial(material: Material2d | number): boolean {
        return this.destroyManager.destroyMaterial(material);
    }

    /**
     * 销毁指定 Geometry 缓存。
     * @param geometry Geometry 对象或全局 ID
     * @returns 是否销毁了对应资源
     */
    public destroyGeometry(geometry: GeoData | number): boolean {
        return this.destroyManager.destroyGeometry(geometry);
    }

    /**
     * 回收所有场景均未引用的 GPU 缓存。
     * @param scene 需要同步资源使用记录的场景
     * @returns 无返回值
     */
    public trim(scene: Scene): void {
        this.destroyManager.trim(scene);
    }

    /**
     * 更新场景版本落后的节点矩阵。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public matrixUpdate(scene: Scene): void {
        MatrixUpdate(scene);
    }

    /**
     * 根据版本更新 Scene 列表。
     * @param scene 场景对象
     * @returns 无返回值
     */
    public initScene(scene: Scene): void {
        InitScene(scene);
    }

    /**
     * 根据版本更新 Camera 矩阵。
     * @param camera 相机对象
     * @returns 无返回值
     */
    public initCamera(camera: Camera): void {
        InitCamera(camera);
    }

    /**
     * 销毁当前 Render 持有的全部资源并移除 Canvas。
     * @returns 无返回值
     */
    public destroy(): void {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;

        if (this._resizeTimer !== null) {
            window.clearTimeout(this._resizeTimer);
            this._resizeTimer = null;
        }

        this.destroyManager.destroyAll();
        this.canvas.remove();
    }

    /**
     * 延迟更新 Canvas 实际像素尺寸。
     * 连续 100ms 没有新的调用时才执行。
     * @returns 无返回值
     */
    public resize(): void {
        if (this._destroyed) {
            return;
        }

        if (this._resizeTimer !== null) {
            window.clearTimeout(this._resizeTimer);
        }

        this._resizeTimer = window.setTimeout((): void => {
            // canvas 的布局尺寸跟随容器内容区；不把容器 border/padding 或 CSS transform 算入。
            // DPR 与实际分配同时提交，比较值也必须使用物理像素，避免同尺寸重复重建。
            const dpr: number = GetInner().dpr;
            const limit: number = this.pipeline.device?.limits.maxTextureDimension2D ?? 8192;
            const width: number = Math.min(limit, Math.max(1, Math.round(this.canvas.clientWidth * dpr)));
            const height: number = Math.min(limit, Math.max(1, Math.round(this.canvas.clientHeight * dpr)));
            if (this.canvas.width !== width) {
                this.canvas.width = width;
            }
            if (this.canvas.height !== height) {
                this.canvas.height = height;
            }
            this._dpr = dpr;
            this._resizeTimer = null;
        }, 100);
    }

    /**
     * 获取当前 Render 销毁状态。
     * @returns 是否已经销毁
     */
    private isDestroyed(): boolean {
        return this._destroyed;
    }
}

export default Render;
export {
    BufferManager,
    DepthManager,
    DevelopmentValidator,
    DestroyManager,
    DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
};
export type {
    DepthTextureLike,
    MeshDepthBufferLike,
    GeometryBufferPartLike,
    GeometryBufferLike,
    GPUTextureResourceLike,
    MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
} from "./types";
export type { BufferManagerLike } from "./BufferManager";
export type { DevelopmentValidatorLike } from "./DevelopmentValidator";
export type { DestroyManagerLike } from "./DestroyManager";
export type { DrawCallManagerLike } from "./DrawCallManager";
export type { PipelineManagerLike } from "./PipelineManager";
export type { SamplerManagerLike } from "./SamplerManager";
export type { TextureManagerLike } from "./TextureManager";
