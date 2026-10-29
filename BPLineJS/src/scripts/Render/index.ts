import { GetInner } from "bpmatrixjs/Utils";
import type RenderTarget from "../RenderTarget";
import RenderTargetManager from "./RenderTargetManager";
import type Camera from "../Camera";
import type { GeoData } from "../Geometry";
import type { Material2d } from "../global-types";
import { GETID } from "../ID";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import type { TextureResource } from "../Texture/Layers";
import BufferManager from "./BufferManager";
import BoxManager from "./BoxManager";
import CanvasOutput, { type HDRMode, type HDRState, type HDRChangeCallback } from "./CanvasOutput";
import DepthManager from "./DepthManager";
import DestroyManager from "./DestroyManager";
import DevelopmentValidator from "./DevelopmentValidator";
import DrawCallManager, { type DrawSelection } from "./DrawCallManager";
import PipelineManager from "./PipelineManager";
import PrecisionManager from "./PrecisionManager";
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
    public readonly id: number = GETID();
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
    public canvas: HTMLCanvasElement = document.createElement("canvas");
    /**
     * 每帧开始前用于清空画布的 RGBA 颜色。
     */
    public backgroundColor: GPUColorDict = { r: 0, g: 0, b: 0, a: 0 };
    /**
     * 当前 Render 的共享 WebGPU 资源。
     */
    public pipeline: PipelineLike = {
        pipelineTemplates: new Map<string, PipelineTemplateLike>(),
        renderTargets: new Map(),
        targetPipelineKeys: new Map(),
        textures: new Map<number, GPUTextureResourceLike>(),
        samplers: new Map<string, GPUSampler>(),
        sceneResources: new Map<number, SceneResourcesLike>(),
        customValues: new Map(),
        buffers: {
            meshMatrix: new Map(),
            meshDepth: new Map(),
            geometry: new Map<number, GeometryBufferLike>(),
            meshStyle: new Map<number, MeshStyleBufferLike>(),
            cameraUniform: [],
        },
    };
    /**
     * WebGPU 初始化完成状态。
     */
    public readonly ready: Promise<void>;
    private _alphaMode: GPUCanvasAlphaMode = "premultiplied";
    private readonly outputManager: CanvasOutput;
    private readonly _onHDR = new Map<string, HDRChangeCallback>();
    private _resizeTimer: number | null = null;
    private _destroyed: boolean = false;
    private _dpr: number = GetInner().dpr;
    private _renderMode: RenderMode;
    private _precisionDebounce: number = 100;
    private _boxDebounce: number = 100;
    private readonly boxManager: BoxManager = new BoxManager();
    private readonly precisionManager: PrecisionManager = new PrecisionManager();
    private _renderScene: Scene | null = null;
    private _renderCamera: Camera | null = null;
    private _renderTarget: RenderTarget | null = null;
    private readonly targetManager: RenderTargetManager = new RenderTargetManager(this.pipeline);
    private readonly bufferManager: BufferManager = new BufferManager(this.pipeline);
    private readonly destroyManager: DestroyManager = new DestroyManager(this.pipeline, this.targetManager);
    private readonly textureManager: TextureManager = new TextureManager(this.pipeline, this.targetManager);
    private readonly samplerManager: SamplerManager = new SamplerManager(this.pipeline);
    private readonly drawCallManager: DrawCallManager = new DrawCallManager(this.pipeline, this.samplerManager, this.targetManager, this.textureManager);
    private readonly pipelineManager: PipelineManager = new PipelineManager(this.pipeline, this.textureManager, this.samplerManager);
    /**
     * 创建渲染器并开始异步初始化 WebGPU。
     * @param div 容器节点或容器 ID
     * @param renderMode Render 运行模式
     * @example
     * const render = new Render(div, renderMode);
     * @returns 创建的 Render 对象。
     */
    public constructor(div: HTMLElement | string, renderMode: RenderMode = "development") {
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof div === "string") {
            const container: HTMLElement | null = document.getElementById(div);
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (container === null) {
                throw new Error(`Render container "${div}" was not found.`);
            }
            this.container = container;
        } else {
            this.container = div;
        }
        this.canvas.style.display = "block";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        // 首次挂载前给画布真实视口尺寸，避免浏览器默认 300×150 缓冲区闪现。
        const initialDpr = this._dpr;
        this.canvas.width = Math.max(1, Math.round(this.container.clientWidth * initialDpr));
        this.canvas.height = Math.max(1, Math.round(this.container.clientHeight * initialDpr));
        this.container.appendChild(this.canvas);
        this._renderMode = renderMode;
        this.outputManager = new CanvasOutput(this.pipeline, this.updateHDR.bind(this));
        this.ready = this.initWebGPU();
    }
    /** @example render.hdr; @returns HDR 请求模式，默认 auto：跟随浏览器当前显示状态。 */
    public get hdr(): HDRMode {
        return this.outputManager.mode;
    }
    /** @param value auto 自动检测，true 请求 HDR，false 使用 SDR @example render.hdr = true; @returns 同步输出配置；不支持 extended 时保留 SDR。 */
    public set hdr(value: HDRMode) {
        // 公开接口也验证 JavaScript 调用者，避免未知字符串默默关闭 HDR。
        if (value === "auto" || typeof value === "boolean") {
            // 同一模式重复设置不清空 Canvas 或触发重复通知。
            if (this._destroyed === false && this.outputManager.mode !== value) {
                this.outputManager.mode = value;
                this.updateHDR();
            }
        } else {
            throw new TypeError("hdr must be auto, true or false.");
        }
    }
    /** @example render.hdrAvailable; @returns 浏览器报告的当前 HDR 输出能力，不能验证屏幕实际亮度。 */
    public get hdrAvailable(): boolean {
        return this.outputManager.available;
    }
    /** @example render.hdrEnabled; @returns Canvas 已接受 HDR 配置；ready 前或回退 SDR 时为 false。 */
    public get hdrEnabled(): boolean {
        return this.outputManager.enabled;
    }
    /** @param key 订阅身份，同名替换 @param callback 配置或检测状态变化后的处理函数 @example render.onHDR("preview", Draw); @returns 注册监听，不立即调用；静态后处理页面可在此重新绘制整条链。 */
    public onHDR(key: string, callback: HDRChangeCallback): void {
        this._onHDR.set(key, callback);
    }
    /** @param key 订阅身份 @example render.deleteHDR("preview"); @returns 是否移除了监听。 */
    public deleteHDR(key: string): boolean {
        return this._onHDR.delete(key);
    }
    /** @example this.updateHDR(); @returns 重新配置输出并通知状态订阅者，不自行重绘来源或后处理链。 */
    private updateHDR(): void {
        this.outputManager.configure(this._alphaMode);
        const state: HDRState = Object.freeze({ mode: this.hdr, available: this.hdrAvailable, enabled: this.hdrEnabled,
            format: this.pipeline.format, toneMapping: this.pipeline.toneMapping?.mode ?? "standard" });
        // 使用快照允许回调注销自身；应用可选择重绘或仅更新状态文字。
        for (const callback of [...this._onHDR.values()]) {
            callback(state);
        }
    }
    /** @example render.boxDebounce; @returns 视口查询防抖毫秒，默认 100；等待期间保守绘制完整列表。 */
    public get boxDebounce(): number {
        return this._boxDebounce;
    }
    /** @param value 非负有限毫秒；0 关闭防抖 @example render.boxDebounce = 0; @returns 无返回值。 */
    public set boxDebounce(value: number) {
        // 拒绝非有限或负延迟，避免浏览器隐式截断成意外的零延迟。
        if (Number.isFinite(value) && value >= 0) {
            this._boxDebounce = value;
        } else {
            throw new RangeError("boxDebounce must be finite and nonnegative.");
        }
    }
    /** @example render.precisionDebounce; @returns 自动精度重建防抖毫秒，默认 100。 */
    public get precisionDebounce(): number {
        return this._precisionDebounce;
    }
    /** @param value 非负有限毫秒；0 立即处理 @example render.precisionDebounce = 0; @returns 无返回值。 */
    public set precisionDebounce(value: number) {
        // 非有限延迟会被浏览器截断，明确拒绝以免意外高频重建。
        if (Number.isFinite(value) && value >= 0) {
            this._precisionDebounce = value;
        } else {
            throw new RangeError("precisionDebounce must be finite and nonnegative.");
        }
    }
    /**
     * 创建当前画布对应的 WebGPU 设备与呈现上下文。
     * @example
     * render.initWebGPU();
     * @returns WebGPU 初始化完成状态
     */
    public async initWebGPU(): Promise<void> {
        const webGPU: GPU | undefined = (
            navigator as {
                gpu?: GPU;
            }
        ).gpu;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (webGPU === undefined) {
            throw new Error("WebGPU is not supported by this browser.");
        }
        const adapter: GPUAdapter | null = await webGPU.requestAdapter();
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (adapter === null) {
            throw new Error("No compatible WebGPU adapter was found.");
        }
        // 异步初始化或延迟回调完成时再次检查 Render 是否仍然有效。
        if (!this.isDestroyed()) {
            const device: GPUDevice = await adapter.requestDevice();
            // 异步初始化或延迟回调完成时再次检查 Render 是否仍然有效。
            if (!this.isDestroyed()) {
                const context: GPUCanvasContext | null = this.canvas.getContext("webgpu");
                // GPU 设备及上下文就绪后才能创建或提交渲染资源。
                if (context === null) {
                    throw new Error("WebGPU canvas context could not be created.");
                }
                this.pipeline.adapter = adapter;
                this.pipeline.device = device;
                this.pipeline.context = context;
                this.pipelineManager.initResources(device);
                this.updateHDR();
            } else {
                device.destroy();
                return;
            }
        } else {
            return;
        }
    }
    /**
     * 设置 Canvas 与下层 HTML 内容的 Alpha 合成方式。
     * @param alphaMode Alpha 合成方式
     * @example
     * render.alphaMode = alphaMode;
     * @returns 无返回值。
     */
    public set alphaMode(alphaMode: GPUCanvasAlphaMode) {
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (this._alphaMode !== alphaMode) {
            this._alphaMode = alphaMode;
            this.updateHDR();
        } else {
            return;
        }
    }
    /**
     * 获取 Canvas Alpha 合成方式。
     * @example
     * const value = render.alphaMode;
     * @returns Alpha 合成方式
     */
    public get alphaMode(): GPUCanvasAlphaMode {
        return this._alphaMode;
    }
    /**
     * 获取当前 Canvas 使用的设备像素比。
     * @example
     * const value = render.dpr;
     * @returns 设备像素比
     */
    public get dpr(): number {
        return this._dpr;
    }
    /**
     * 设置 Render 运行模式。
     * production 会跳过 GPUBuffer 创建前的全部开发检查。
     * @param renderMode Render 运行模式
     * @example
     * render.renderMode = renderMode;
     * @returns 无返回值。
     */
    public set renderMode(renderMode: RenderMode) {
        this._renderMode = renderMode;
    }
    /**
     * 获取 Render 运行模式。
     * @example
     * const value = render.renderMode;
     * @returns 当前 Render 运行模式
     */
    public get renderMode(): RenderMode {
        return this._renderMode;
    }
    /**
     * 预热场景所需缓存，但不提交 DrawCall。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.warmup(scene, camera);
     * @returns 无返回值
     */
    public warmup(scene: Scene, camera: Camera): void {
        this.prepare(scene, camera, false, null);
    }
    /**
     * 预热离屏场景及附件，不提交绘制或改变当前输出。
     * @param target 包含场景和相机的离屏目标
     * @example render.warmupPass(target);
     * @returns 无返回值。
     */
    public warmupPass(target: RenderTarget): void {
        this.prepare(target.scene, target.camera, false, target);
    }
    /**
     * @param scene 场景
     * @param camera 相机
     * @param redraw 精度更新后是否重绘当前画面
     * @param target 离屏目标；null 表示 Canvas
     * @example this.prepare(scene, camera, false, target);
     * @returns 无返回值，准备阶段不提交 DrawCall。
     */
    private prepare(scene: Scene, camera: Camera, redraw: boolean, target: RenderTarget | null): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._destroyed && this.pipeline.device !== undefined) {
            this.initScene(scene);
            // 离屏输入不能包含自己的输出，包括自定义传值和 IMesh 层表。
            if (target !== null) {
                this.targetManager.validateInputs(scene.textureList, target);
                this.targetManager.ensure(target);
            }
            this.matrixUpdate(scene);
            this.initCamera(camera);
            /** @param pendingScene 延迟处理的场景 @param pendingCamera 延迟处理的相机 @example RebuildPendingPrecision(scene, camera); @returns 无返回值，当前场景重绘到最近使用的输出，旧场景仅预热。 */
            const RebuildPendingPrecision = (pendingScene: Scene, pendingCamera: Camera): void => {
                // 切换页面/场景后，旧防抖任务不能覆盖当前画面；warmup 也始终不提交绘制。
                if (redraw && this._renderScene === pendingScene && this._renderCamera === pendingCamera && this._renderTarget?.destroyed !== true) {
                    this.redrawCurrent();
                } else if (target === null) {
                    // Canvas 的旧场景只预热，不影响当前显示内容。
                    this.warmup(pendingScene, pendingCamera);
                } else if (target.destroyed === false && target.scene === pendingScene && target.camera === pendingCamera) {
                    // 目标已更换场景或相机时，旧任务不能准备或覆盖新的目标配置。
                    this.warmupPass(target);
                }
            };
            this.precisionManager.update(scene, camera, this._precisionDebounce, RebuildPendingPrecision);
            // 精度隔离可能替换资源；空间范围必须在几何和世界变换同步后获取。
            this.initScene(scene);
            /** @param pendingScene 已完成查询的场景 @example RedrawBox(scene); @returns 无返回值，保持 warmup 与旧场景不提交绘制。 */
            const RedrawBox = (pendingScene: Scene): void => {
                // 只有当前画面的查询完成才触发重绘，避免旧场景覆盖新页面。
                if (redraw && this._renderScene === pendingScene && this._renderCamera === camera && this._renderTarget?.destroyed !== true) {
                    this.redrawCurrent();
                }
            };
            this.boxManager.update(scene, this._boxDebounce, RedrawBox);
            // 资源引用变化后才回收，空间筛选不会从资源归属列表删除物体。
            if (this.pipeline.sceneResources.get(scene.id)?.version !== scene.version) {
                this.trim(scene);
            }
            this.drawBuffers(scene, camera);
            this.drawTextures(scene);
            this.pipelineManager.draw(scene, target?.format ?? this.pipeline.format, target !== null && target.data === false);
            this.drawCallManager.prepare(this.canvas.width, this.canvas.height, target);
        } else {
            return;
        }
    }
    /**
     * 预热缓存并将当前场景绘制到 Canvas。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.render(scene, camera);
     * @returns 无返回值
     */
    public render(scene: Scene, camera: Camera): void {
        this.submit(scene, camera, null);
    }
    /** @internal @param target 遮罩附件 @param selection Mesh 与实例槽位集合 @param occlude 是否保留其他对象对本组的遮挡 @example render.renderMask(target, selection, true); @returns 透明背景绘制指定对象，可按原场景顺序擦除被遮挡部分；不接管延迟重绘。 */
    public renderMask(target: RenderTarget, selection: DrawSelection, occlude: boolean = false): void {
        this.prepare(target.scene, target.camera, false, target);
        // 额外变体保留原片元 Shader，只改变混合，不篡改共享材质或 Style。
        if (occlude) {
            this.pipelineManager.draw(target.scene, target.format, true, true);
        }
        this.drawCallManager.draw(target.scene, { r: 0, g: 0, b: 0, a: 0 }, "premultiplied", target, selection, occlude);
    }

    /** @param target 场景与相机组成的离屏目标 @example render.renderPass(target); @returns 无返回值，提交离屏画面。 */
    public renderPass(target: RenderTarget): void {
        this.submit(target.scene, target.camera, target);
    }
    /**
     * 统一准备和提交，两个公开入口各自确定输出位置。
     * @param scene 本次场景
     * @param camera 本次相机
     * @param target 离屏目标；null 表示 Canvas
     * @example this.submit(scene, camera, null);
     * @returns 无返回值。
     */
    private submit(scene: Scene, camera: Camera, target: RenderTarget | null): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._destroyed === false && this.pipeline.device !== undefined) {
            this._renderScene = scene;
            this._renderCamera = camera;
            this._renderTarget = target;
            this.prepare(scene, camera, true, target);
            this.drawCallManager.draw(scene, this.backgroundColor, this._alphaMode, target);
        }
    }
    /** @example this.redrawCurrent(); @returns 无返回值，延迟任务沿用最近输出且不绘制已更换配置的目标。 */
    private redrawCurrent(): void {
        const scene = this._renderScene;
        const camera = this._renderCamera;
        const target = this._renderTarget;
        // 只有已经执行过的当前画面可以被防抖任务重绘。
        if (scene !== null && camera !== null) {
            // Canvas 与离屏入口分离，且防止旧相机任务写入新场景。
            if (target === null) {
                this.render(scene, camera);
            } else if (target.destroyed === false && target.scene === scene && target.camera === camera) {
                // 目标配置与原任务仍一致，才使用公开离屏入口重绘。
                this.renderPass(target);
            }
        }
    }
    /**
     * 创建或更新当前场景的 GPUBuffer。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.drawBuffers(scene, camera);
     * @returns 无返回值
     */
    public drawBuffers(scene: Scene, camera: Camera): void {
        this.bufferManager.draw(scene, camera, this._dpr, this._renderMode);
    }
    /**
     * 创建或更新当前场景的 GPUTexture。
     * @param scene 场景对象
     * @example
     * render.drawTextures(scene);
     * @returns 无返回值
     */
    public drawTextures(scene: Scene): void {
        this.textureManager.draw(scene);
    }
    /**
     * 创建或更新当前场景的 Pipeline 模板。
     * @param scene 场景对象
     * @example
     * render.drawPipelines(scene);
     * @returns 无返回值
     */
    public drawPipelines(scene: Scene): void {
        this.pipelineManager.draw(scene);
    }
    /**
     * 编码并提交当前场景的绘制命令。
     * @param scene 场景对象
     * @example
     * render.drawCall(scene);
     * @returns 无返回值
     */
    public drawCall(scene: Scene): void {
        this.drawCallManager.draw(scene, this.backgroundColor, this._alphaMode);
    }
    /**
     * 销毁指定 Mesh 缓存。
     * @param mesh Mesh 对象或全局 ID
     * @example
     * render.destroyMesh(mesh);
     * @returns 是否销毁了任意资源
     */
    public destroyMesh(mesh: MeshLike | number): boolean {
        return this.destroyManager.destroyMesh(mesh);
    }
    /**
     * 销毁指定 Texture 缓存。
     * @param texture Texture 对象或全局 ID
     * @example
     * render.destroyTexture(texture);
     * @returns 是否销毁了对应资源
     */
    public destroyTexture(texture: TextureResource | number): boolean {
        return this.destroyManager.destroyTexture(texture);
    }
    /**
     * 销毁指定 Material 缓存。
     * @param material Material 对象或全局 ID
     * @example
     * render.destroyMaterial(material);
     * @returns 是否销毁了任意资源
     */
    public destroyMaterial(material: Material2d | number): boolean {
        return this.destroyManager.destroyMaterial(material);
    }
    /**
     * 销毁指定 Geometry 缓存。
     * @param geometry Geometry 对象或全局 ID
     * @example
     * render.destroyGeometry(geometry);
     * @returns 是否销毁了对应资源
     */
    public destroyGeometry(geometry: GeoData | number): boolean {
        return this.destroyManager.destroyGeometry(geometry);
    }
    /**
     * 回收所有场景均未引用的 GPU 缓存。
     * @param scene 需要同步资源使用记录的场景
     * @example
     * render.trim(scene);
     * @returns 无返回值
     */
    public trim(scene: Scene): void {
        this.destroyManager.trim(scene);
    }
    /**
     * 更新场景版本落后的节点矩阵。
     * @param scene 场景对象
     * @example
     * render.matrixUpdate(scene);
     * @returns 无返回值
     */
    public matrixUpdate(scene: Scene): void {
        MatrixUpdate(scene);
    }
    /**
     * 根据版本更新 Scene 列表。
     * @param scene 场景对象
     * @example
     * render.initScene(scene);
     * @returns 无返回值
     */
    public initScene(scene: Scene): void {
        InitScene(scene);
    }
    /**
     * 根据版本更新 Camera 矩阵。
     * @param camera 相机对象
     * @example
     * render.initCamera(camera);
     * @returns 无返回值
     */
    public initCamera(camera: Camera): void {
        InitCamera(camera);
    }
    /**
     * 销毁当前 Render 持有的全部资源并移除 Canvas。
     * @example
     * render.destroy();
     * @returns 无返回值
     */
    public destroy(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._destroyed) {
            this._destroyed = true;
            this.outputManager.destroy();
            this._onHDR.clear();
            this.precisionManager.destroy();
            this.boxManager.destroy();
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (this._resizeTimer !== null) {
                window.clearTimeout(this._resizeTimer);
                this._resizeTimer = null;
            }
            this.destroyManager.destroyAll();
            this.canvas.remove();
        } else {
            return;
        }
    }
    /**
     * 延迟更新 Canvas 实际像素尺寸。
     * 连续 100ms 没有新的调用时才执行。
     * @example
     * render.resize();
     * @returns 无返回值
     */
    public resize(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._destroyed) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (this._resizeTimer !== null) {
                window.clearTimeout(this._resizeTimer);
            }
            /**
 * 防抖等待结束后应用最近一次容器尺寸。

 * @example
 * ApplyPendingResize();
 * @returns 无返回值。
 */
            const ApplyPendingResize = (): void => {
                // canvas 的布局尺寸跟随容器内容区；不把容器 border/padding 或 CSS transform 算入。
                // DPR 与实际分配同时提交，比较值也必须使用物理像素，避免同尺寸重复重建。
                const dpr: number = GetInner().dpr;
                const limit: number = this.pipeline.device?.limits.maxTextureDimension2D ?? 8192;
                const width: number = Math.min(limit, Math.max(1, Math.round(this.canvas.clientWidth * dpr)));
                const height: number = Math.min(
                    limit,
                    Math.max(1, Math.round(this.canvas.clientHeight * dpr)),
                );
                // 物理尺寸真正变化时才重设画布，避免重复分配绘制缓冲。
                if (this.canvas.width !== width) {
                    this.canvas.width = width;
                }
                // 物理尺寸真正变化时才重设画布，避免重复分配绘制缓冲。
                if (this.canvas.height !== height) {
                    this.canvas.height = height;
                }
                this._dpr = dpr;
                this._resizeTimer = null;
            };
            this._resizeTimer = window.setTimeout(ApplyPendingResize, 100);
        } else {
            return;
        }
    }
    /**
     * 获取当前 Render 销毁状态。
     * @example
     * this.isDestroyed();
     * @returns 是否已经销毁
     */
    private isDestroyed(): boolean {
        return this._destroyed;
    }
}

export default Render;
export type { BufferManagerLike } from "./BufferManager";
export type { DestroyManagerLike } from "./DestroyManager";
export type { DevelopmentValidatorLike } from "./DevelopmentValidator";
export type { DrawCallManagerLike } from "./DrawCallManager";
export type { PipelineManagerLike } from "./PipelineManager";
export type { SamplerManagerLike } from "./SamplerManager";
export type { TextureManagerLike } from "./TextureManager";
export type { HDRMode, HDRState, HDRChangeCallback } from "./CanvasOutput";
export type {
    DepthTextureLike, GeometryBufferLike, GeometryBufferPartLike, GPUTextureResourceLike, MeshDepthBufferLike, MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
} from "./types";
export {
    BufferManager,
    DepthManager, DestroyManager, DevelopmentValidator, DrawCallManager,
    InitCamera,
    InitScene,
    MatrixUpdate,
    PipelineManager,
    SamplerManager,
    TextureManager,
};
