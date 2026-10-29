import { GETID } from "../ID";
import type Camera from "../Camera";
import type Scene from "../Scene";
import type { TextureSubscriber } from "../Texture";

/** 离屏画面的描述和生命周期；颜色、采样及深度附件由所属 Render 维护。 */
class RenderTarget {
    /** 资源身份，可直接作为 Style.texture 或 raw.value 的值。 */
    public readonly id: number = GETID();
    public readonly type: string = "RenderTarget";
    /** 离屏绘制使用的场景；更换场景后调用 renderPass 更新画面。 */
    public scene: Scene;
    /** 数据附件只翻转采样方向，不预乘/还原 Alpha；用于抗锯齿权重等数值结果。 */
    public readonly data: boolean;
    /** 离屏绘制使用的相机，viewport 同时决定附件尺寸。 */
    public camera: Camera;
    private _width: number = 0;
    private _height: number = 0;
    private _format: RenderTargetFormat = "rgba8unorm";
    private _version: number = 0;
    private _destroyed: boolean = false;
    private _owner: object | null = null;
    private readonly _subscribers = new Set<TextureSubscriber>();

    /** @param scene 离屏场景 @param camera 相机，使用其 viewport 的物理像素宽高，不额外乘 DPR 或 zoom @param options 颜色格式选项 @example const target = new RenderTarget(scene, camera); @returns 离屏目标。 */
    public constructor(scene: Scene, camera: Camera, options: RenderTargetOptions = {}) {
        this.data = options.data ?? false;
        this.scene = scene;
        this.camera = camera;
        this.syncViewport();
        this.format = options.format ?? this._format;
    }

    /** @example target.width; @returns 相机 viewport 的物理像素宽度，小数向上取整；通过 camera.setViewport 修改。 */
    public get width(): number {
        return ViewportPixels(this.camera.width);
    }
    /** @example target.height; @returns 相机 viewport 的物理像素高度，小数向上取整；通过 camera.setViewport 修改。 */
    public get height(): number {
        return ViewportPixels(this.camera.height);
    }
    /** @example target.format; @returns 可采样的颜色附件格式。 */
    public get format(): RenderTargetFormat {
        return this._format;
    }
    /** @param value 支持的颜色格式 @example target.format = "rgba16float"; @returns 无返回值。 */
    public set format(value: RenderTargetFormat) {
        this.assertAlive();
        // 三种格式均支持单采样颜色附件和普通浮点采样。
        if (["rgba8unorm", "bgra8unorm", "rgba16float"].includes(value)) {
            // 只在配置变化时重新分配附件，渲染新一帧不递增这个版本。
            if (value !== this._format) {
                this._format = value;
                this.updateVersion();
            }
        } else {
            throw new TypeError("Unsupported RenderTarget format.");
        }
    }
    /** @example target.version; @returns 附件配置版本，不是帧序号。 */
    public get version(): number {
        return this._version;
    }
    /** @example target.destroyed; @returns 是否已经永久销毁。 */
    public get destroyed(): boolean {
        return this._destroyed;
    }

    /** @internal @example target.syncViewport(); @returns 无返回值；使用前同步两轴，仅尺寸变化通知订阅者重建附件。 */
    public syncViewport(): void {
        this.assertAlive();
        const width = this.width;
        const height = this.height;
        // 相机平移、旋转、缩放不改变附件大小；先保存两轴再通知，避免递归更新。
        if (width !== this._width || height !== this._height) {
            this._width = width;
            this._height = height;
            this.updateVersion();
        }
    }

    /** @param subscriber 样式、层表或 Render 资源管理器 @example target.add(style.solid); @returns 无返回值。 */
    public add(subscriber: TextureSubscriber): void {
        this._subscribers.add(subscriber);
    }
    /** @param subscriber 要解除的订阅者 @example target.delete(style.solid); @returns 无返回值。 */
    public delete(subscriber: TextureSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /** @example target.updateVersion(); @returns 无返回值，使附件在下次使用时重建。 */
    public updateVersion(): void {
        this._version++;
        // 使用快照允许销毁回调在通知中解除自己的订阅。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onTextureChange(this);
        }
    }
    /** @internal @param owner Render 的资源管理器 @example target.claim(manager); @returns 无返回值；禁止跨设备静默读取另一张空图。 */
    public claim(owner: object): void {
        this.assertAlive();
        // 纹理只在首次使用时归属 Render，必须先释放才能迁移。
        if (this._owner === null || this._owner === owner) {
            this._owner = owner;
        } else {
            throw new Error("RenderTarget belongs to another Render. Release it before reusing it.");
        }
    }
    /** @internal @param owner 当前资源管理器 @example target.release(manager); @returns 无返回值。 */
    public release(owner: object): void {
        // 其他 Render 不能解除当前目标的设备归属。
        if (this._owner === owner) {
            this._owner = null;
        }
    }
    /** @example target.destroy(); @returns 无返回值，释放全部附件并禁止后续使用。 */
    public destroy(): void {
        // 重复销毁不重复通知或清理资源。
        if (this._destroyed === false) {
            this._destroyed = true;
            this.updateVersion();
            this._subscribers.clear();
        }
    }
    /** @example this.assertAlive(); @returns 无返回值，销毁后抛出错误。 */
    private assertAlive(): void {
        // 销毁后的描述不能重新分配 GPU 资源。
        if (this._destroyed) {
            throw new Error("RenderTarget has been destroyed.");
        }
    }
}

type RenderTargetFormat = "rgba8unorm" | "bgra8unorm" | "rgba16float";
interface RenderTargetOptions {
    /** 默认 rgba8unorm。 */
    format?: RenderTargetFormat;
    /** 默认 false；数据通道应使用不透明全屏材质。 */
    data?: boolean;
}

/** @param size 相机 viewport 的一轴尺寸 @example ViewportPixels(camera.width); @returns 正整数物理像素；非法视口在分配前报错。 */
const ViewportPixels = (size: number): number => {
    const pixels = Math.ceil(size);
    // 允许布局产生的小数像素；零、负数、NaN 和无穷不能构成纹理附件。
    if (size > 0 && Number.isSafeInteger(pixels)) {
        return pixels;
    } else {
        throw new RangeError("RenderTarget camera viewport must have positive finite dimensions.");
    }
};

export default RenderTarget;
export type { RenderTargetOptions, RenderTargetFormat };
