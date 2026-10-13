import { GETID } from "../ID";

/**
 * 贴图对象
 * 用于描述贴图资源本身
 * 不直接绑定具体渲染后端的 GPU 纹理对象
 * @class
 */
class Texture implements TextureLike {
    /**
     * 全局唯一贴图 ID
     */
    public readonly id: number = GETID();
    /**
     * 对象类型
     */
    public readonly type: string = "Texture";
    private _version: number = 0;
    private readonly _subscribers = new Set<TextureSubscriber>();
    /**
     * 贴图来源地址
     */
    private _url: string | null = null;
    /**
     * 贴图源数据
     */
    private _source: TextureSource | null = null;
    /**
     * 是否已加载完成
     */
    private _loaded: boolean = false;
    /**
     * 贴图宽度
     */
    private _width: number = 0;
    /**
     * 贴图高度
     */
    private _height: number = 0;
    /** 视频元数据或播放源变化时，原子同步贴图状态。 */
    private readonly _videoChange: () => void;
    /**
     * 创建贴图对象
     * @example
     * const texture = new Texture();
     * @returns 创建的 Texture 对象。
     */
    public constructor() {
        this._videoChange = this.syncVideoState.bind(this);
    }
    /**
     * 单一贴图版本，每个 Render 独立记录已上传版本。
     * @example
     * const value = texture.version;
     * @returns 单一贴图版本，每个 Render 独立记录已上传版本。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 贴图来源地址；修改地址本身不会自动下载。
     * @example
     * const value = texture.url;
     * @returns 贴图来源地址；修改地址本身不会自动下载。
     */
    public get url(): string | null {
        return this._url;
    }
    /**
     * 贴图来源地址；修改地址本身不会自动下载。
     * @param value 来源地址，下载使用 load
     * @example
     * texture.url = value;
     * @returns 无返回值。
     */
    public set url(value: string | null) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._url !== value) {
            this._url = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 当前浏览器图片或视频源；视频帧在每次 Render 渲染时上传。
     * @example
     * const value = texture.source;
     * @returns 当前图片或视频 DOM 来源；未设置时返回 null。
     */
    public get source(): TextureSource | null {
        return this._source;
    }
    /**
     * 当前浏览器图片或视频源；调用方负责播放视频并持续渲染。
     * @param value 新来源；同步更新宽高和 loaded，null 清空
     * @example
     * texture.source = value;
     * @returns 无返回值。
     */
    public set source(value: TextureSource | null) {
        // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
        if (this._source === value) {
            return;
        } else {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (value === null) {
                this.clearSource();
            } else {
                this.setSource(value, this._url);
            }
        }
    }
    /**
     * 当前图片或视频是否可上传。
     * @example
     * const value = texture.loaded;
     * @returns 当前图片是否可上传。
     */
    public get loaded(): boolean {
        return this._loaded;
    }
    /**
     * 当前图片是否可上传。
     * @param value 是否已加载；正常情况由 setSource / clearSource 自动维护
     * @example
     * texture.loaded = value;
     * @returns 无返回值。
     */
    public set loaded(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._loaded !== value) {
            this._loaded = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 图片或视频宽度，单位为源像素。
     * @example
     * const value = texture.width;
     * @returns 图片宽度，单位为源像素。
     */
    public get width(): number {
        return this._width;
    }
    /**
     * 图片宽度，单位为源像素。
     * @param value 源像素宽度，必须为非负整数
     * @example
     * texture.width = value;
     * @returns 无返回值。
     */
    public set width(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isInteger(value) || value < 0) {
            throw new RangeError("Texture width must be a non-negative integer.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._width !== value) {
            this._width = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 图片或视频高度，单位为源像素。
     * @example
     * const value = texture.height;
     * @returns 图片高度，单位为源像素。
     */
    public get height(): number {
        return this._height;
    }
    /**
     * 图片高度，单位为源像素。
     * @param value 源像素高度，必须为非负整数
     * @example
     * texture.height = value;
     * @returns 无返回值。
     */
    public set height(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isInteger(value) || value < 0) {
            throw new RangeError("Texture height must be a non-negative integer.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._height !== value) {
            this._height = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 关联贴图消费者；多个分区可以共享同一 Texture。
     * @param subscriber 消费者，重复 add 不会重复通知
     * @example
     * texture.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: TextureSubscriber): void {
        this._subscribers.add(subscriber);
    }
    /**
     * 解绑贴图消费者，不销毁图片源和任何 Render 的缓存。
     * @param subscriber 需要解绑的消费者
     * @example
     * texture.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: TextureSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 原地修改静态图片像素后手动递增版本并通知；视频帧由 Render 自动上传。
     * @example
     * texture.updateVersion();
     * @returns 无返回值。
     */
    public updateVersion(): void {
        this._version++;
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onTextureChange(this);
        }
    }
    /**
     * 设置图片或视频来源。
     * @param source 贴图源数据
     * @param url 贴图来源地址
     * @example
     * texture.setSource(source, url);
     * @returns 当前贴图对象
     */
    public setSource(source: TextureSource, url: string | null = null): this {
        // 原子提交：消费者不会看到“新图片配旧宽高”的中间状态，只通知一次。
        this.unbindVideoSource();
        this._url = url;
        this._source = source;
        this._width = GetTextureWidth(source);
        this._height = GetTextureHeight(source);
        if (IsVideoSource(source)) {
            // 视频的元数据和首帧可能晚于 setSource 到达。
            this._loaded = IsVideoReady(source);
            source.addEventListener("loadedmetadata", this._videoChange);
            source.addEventListener("loadeddata", this._videoChange);
            source.addEventListener("resize", this._videoChange);
            source.addEventListener("emptied", this._videoChange);
        } else {
            this._loaded = true;
        }
        this.updateVersion();
        return this;
    }
    /**
     * 清空贴图源数据
     * @example
     * texture.clearSource();
     * @returns 当前贴图对象
     */
    public clearSource(): this {
        this.unbindVideoSource();
        this._url = null;
        this._source = null;
        this._loaded = false;
        this._width = 0;
        this._height = 0;
        this.updateVersion();
        return this;
    }
    /**
     * 从旧视频解除监听，避免替换来源后继续接收旧视频事件。
     * @example
     * this.unbindVideoSource();
     * @returns 无返回值。
     */
    private unbindVideoSource(): void {
        const source = this._source;
        // 只解除当前视频的监听，静态图片没有媒体事件。
        if (source !== null && IsVideoSource(source)) {
            source.removeEventListener("loadedmetadata", this._videoChange);
            source.removeEventListener("loadeddata", this._videoChange);
            source.removeEventListener("resize", this._videoChange);
            source.removeEventListener("emptied", this._videoChange);
        }
    }
    /**
     * 同步当前视频的首帧状态和原始尺寸，仅在状态变化时通知消费者。
     * @example
     * this.syncVideoState();
     * @returns 无返回值。
     */
    private syncVideoState(): void {
        const source = this._source;
        // 旧视频被替换后触发的延迟事件不应改变当前贴图。
        if (source !== null && IsVideoSource(source)) {
            const loaded = IsVideoReady(source);
            const width = source.videoWidth;
            const height = source.videoHeight;
            // 播放帧本身不递增版本；只有就绪状态或尺寸变化需要重建资源。
            if (this._loaded !== loaded || this._width !== width || this._height !== height) {
                this._loaded = loaded;
                this._width = width;
                this._height = height;
                this.updateVersion();
            }
        }
    }
    /**
     * 从地址加载图片或视频。常见视频扩展名自动识别；无扩展名或 blob 地址可指定 video。
     * 加载视频只取得首帧，播放和持续渲染由调用方控制。
     * @param url 贴图地址
     * @param sourceType 来源类型，默认根据地址识别，无法识别时按图片加载
     * @example
     * await texture.load("/movie.mp4");
     * await texture.load(blobUrl, "video");
     * @returns 当前贴图对象
     */
    public async load(url: string, sourceType: "auto" | "image" | "video" = "auto"): Promise<this> {
        let videoSource: boolean = sourceType === "video";
        // 自动模式只依据明确的视频扩展名或 data URL 类型判断；其他地址可显式指定。
        if (sourceType === "auto") {
            videoSource = IsVideoUrl(url);
        }
        // 视频等待首帧，静态图片走现有图片加载路径。
        if (videoSource) {
            const video = await LoadVideo(url);
            // setSource 将视频 DOM 保存到 this._source；调用方从 texture.source 获取并控制播放。
            return this.setSource(video, url);
        } else {
            const image = await LoadImage(url);
            return this.setSource(image, url);
        }
    }
}

type TextureSource = HTMLImageElement | HTMLVideoElement | ImageBitmap | ImageData;

/** 贴图消费者，通常由 Style 的贴图分区实现。 */
interface TextureSubscriber {
    /**
     * 接收贴图来源变化，通知依赖的样式或图层缓存。
     * @param texture 贴图对象
     * @example
     * textureSubscriber.onTextureChange(texture);
     * @returns 无返回值。
     */
    onTextureChange(texture: TextureLike): void;
}

interface TextureLike {
    readonly id: number;
    readonly type: string;
    readonly version: number;
    url: string | null;
    /**
     * 当前图片或视频来源；视频来源就是 HTMLVideoElement，可由调用方控制播放、速度和跳转。
     * @example
     * if (texture.source instanceof HTMLVideoElement) {
     *     texture.source.playbackRate = 1.5;
     *     texture.source.currentTime = 10;
     *     await texture.source.play();
     * }
     */
    source: TextureSource | null;
    loaded: boolean;
    width: number;
    height: number;
    /**
     * 关联贴图消费者；多个分区可以共享同一 Texture。
     * @param subscriber 消费者，重复 add 不会重复通知
     * @example
     * texture.add(subscriber);
     * @returns 无返回值。
     */
    add(subscriber: TextureSubscriber): void;
    /**
     * 解绑贴图消费者，不销毁图片源和任何 Render 的缓存。
     * @param subscriber 需要解绑的消费者
     * @example
     * texture.delete(subscriber);
     * @returns 无返回值。
     */
    delete(subscriber: TextureSubscriber): void;
    /**
     * 原地修改静态图片像素后手动递增版本并通知；视频帧由 Render 自动上传。
     * @example
     * texture.updateVersion();
     * @returns 无返回值。
     */
    updateVersion(): void;
}

/**
 * 从 URL 的媒体类型或文件扩展名识别常见视频资源。
 * @param url 贴图地址
 * @example
 * IsVideoUrl("/movie.webm?version=1");
 * @returns 地址是否明确指向视频。
 */
const IsVideoUrl = (url: string): boolean => {
    const dataVideo = /^data:video\//i.test(url);
    const videoExtension = /\.(?:mp4|webm|ogg|ogv|mov|m4v|m3u8)(?:[?#]|$)/i.test(url);
    return dataVideo || videoExtension;
};

/**
 * 加载视频元素直至首帧可用于 GPU 上传，不负责开始播放。
 * @param url 视频地址
 * @example
 * const video = await LoadVideo("/movie.mp4");
 * @returns 已取得首帧的视频元素。
 */
const LoadVideo = (url: string): Promise<HTMLVideoElement> => {
    /**
     * 建立视频事件监听并启动加载。
     * @param resolve 首帧就绪时兑现 Promise 的回调
     * @param reject 加载失败时拒绝 Promise 的回调
     * @example
     * StartVideoLoad(resolve, reject);
     * @returns 无返回值。
     */
    const StartVideoLoad = (
        resolve: (value: HTMLVideoElement) => void,
        reject: (reason: Error) => void,
    ): void => {
        const video = document.createElement("video");
        video.preload = "auto";
        video.crossOrigin = "anonymous";
        /**
         * 清除加载阶段的监听；后续视频状态由 Texture.setSource 管理。
         * @example
         * RemoveLoadListeners();
         * @returns 无返回值。
         */
        const RemoveLoadListeners = (): void => {
            video.removeEventListener("loadeddata", HandleReady);
            video.removeEventListener("error", HandleError);
        };
        /**
         * 首帧就绪后交出视频元素。
         * @example
         * HandleReady();
         * @returns 无返回值。
         */
        const HandleReady = (): void => {
            RemoveLoadListeners();
            resolve(video);
        };
        /**
         * 将媒体加载错误传给调用方。
         * @example
         * HandleError();
         * @returns 无返回值。
         */
        const HandleError = (): void => {
            RemoveLoadListeners();
            reject(new Error(`Texture video load failed: ${url}`));
        };
        video.addEventListener("loadeddata", HandleReady);
        video.addEventListener("error", HandleError);
        video.src = url;
    };
    return new Promise(StartVideoLoad);
};

/**
 * 加载图片元素
 * @param url 图片地址
 * @example
 * LoadImage(url);
 * @returns 图片元素
 */
const LoadImage = (url: string): Promise<HTMLImageElement> => {
    /**
     * 注册图片加载回调并设置地址，由 Promise 接收异步结果。
     * @param resolve 图片加载成功时兑现 Promise 的回调
     * @param reject 图片加载失败时拒绝 Promise 的回调
     * @example
     * LoadImageSource(resolve, reject);
     * @returns 无返回值；通过 resolve 或 reject 完成 Promise。
     */
    const LoadImageSource = (
        resolve: (value: HTMLImageElement) => void,
        reject: (reason: Error) => void,
    ): void => {
        const image = new Image();
        /**
 * 图片或页面加载完成后，执行已经准备好的后续操作。

 * @example
 * HandleLoad();
 * @returns 无返回值。
 */
        const HandleLoad = () => {
            resolve(image);
        };
        image.onload = HandleLoad;
        /**
 * 将图片加载错误转交给 Promise，使调用者能够捕获失败。

 * @example
 * HandleImageError();
 * @returns 无返回值。
 */
        const HandleImageError = () => {
            reject(new Error(`Texture load failed: ${url}`));
        };
        image.onerror = HandleImageError;
        image.src = url;
    };
    return new Promise(LoadImageSource);
};

/**
 * 获取贴图宽度
 * @param source 贴图源数据
 * @example
 * GetTextureWidth(source);
 * @returns 贴图宽度
 */
const GetTextureWidth = (source: TextureSource): number => {
    // 视频使用源帧尺寸，图片元素使用解码后的自然尺寸。
    if ("videoWidth" in source) {
        return source.videoWidth;
    } else {
        // 静态图片优先使用解码后的尺寸，其他来源使用自身尺寸。
        if ("naturalWidth" in source) {
            return source.naturalWidth;
        } else {
            return source.width;
        }
    }
};

/**
 * 获取贴图高度
 * @param source 贴图源数据
 * @example
 * GetTextureHeight(source);
 * @returns 贴图高度
 */
const GetTextureHeight = (source: TextureSource): number => {
    // 视频使用源帧尺寸，图片元素使用解码后的自然尺寸。
    if ("videoHeight" in source) {
        return source.videoHeight;
    } else {
        // 静态图片优先使用解码后的尺寸，其他来源使用自身尺寸。
        if ("naturalHeight" in source) {
            return source.naturalHeight;
        } else {
            return source.height;
        }
    }
};

/**
 * 判断来源是否为浏览器视频元素。
 * @param source 候选贴图来源
 * @example
 * IsVideoSource(source);
 * @returns 来源是否为视频元素。
 */
const IsVideoSource = (source: TextureSource): source is HTMLVideoElement =>
    "videoWidth" in source;

/**
 * 判断视频是否已有可复制的首帧。
 * @param video 视频元素
 * @example
 * IsVideoReady(video);
 * @returns 视频是否已有有效源帧。
 */
const IsVideoReady = (video: HTMLVideoElement): boolean =>
    video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

export default Texture;
export { default as TextureLayers } from "./Layers";
export type { TextureResource } from "./Layers";
export type { TextureLike, TextureSource, TextureSubscriber };
