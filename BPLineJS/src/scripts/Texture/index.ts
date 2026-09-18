import { GETID } from "../ID";
type TextureSource = HTMLImageElement | ImageBitmap | ImageData;
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
     * 原地修改图片像素后手动递增版本并通知；各 Render 独立消费，不存在清除版本操作。
     * @example
     * texture.updateVersion();
     * @returns 无返回值。
     */
    updateVersion(): void;
}
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
    public readonly id: number;
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
    /**
     * 创建贴图对象
     * @example
     * const texture = new Texture();
     * @returns 创建的 Texture 对象。
     */
    public constructor() {
        this.id = GETID();
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
     * 当前浏览器图片源。
     * @example
     * const value = texture.source;
     * @returns 当前浏览器图片源。
     */
    public get source(): TextureSource | null {
        return this._source;
    }
    /**
     * 当前浏览器图片源。
     * @param value 新图片源；同步更新宽高和 loaded，null 清空
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
     * 当前图片是否可上传。
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
     * 图片宽度，单位为源像素。
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
     * 图片高度，单位为源像素。
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
     * 原地修改图片像素后手动递增版本并通知；各 Render 独立消费，不存在清除版本操作。
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
     * 设置贴图源数据
     * @param source 贴图源数据
     * @param url 贴图来源地址
     * @example
     * texture.setSource(source, url);
     * @returns 当前贴图对象
     */
    public setSource(source: TextureSource, url: string | null = null): this {
        // 原子提交：消费者不会看到“新图片配旧宽高”的中间状态，只通知一次。
        this._url = url;
        this._source = source;
        this._loaded = true;
        this._width = GetTextureWidth(source);
        this._height = GetTextureHeight(source);
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
        this._url = null;
        this._source = null;
        this._loaded = false;
        this._width = 0;
        this._height = 0;
        this.updateVersion();
        return this;
    }
    /**
     * 从地址加载贴图
     * @param url 贴图地址
     * @example
     * texture.load(url);
     * @returns 当前贴图对象
     */
    public async load(url: string): Promise<this> {
        const image = await LoadImage(url);
        return this.setSource(image, url);
    }
}
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
    // 图片元素读取解码后的自然宽度，Canvas 等来源读取自身尺寸。
    if ("naturalWidth" in source) {
        return source.naturalWidth;
    } else {
        return source.width;
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
    // 图片元素读取解码后的自然高度，Canvas 等来源读取自身尺寸。
    if ("naturalHeight" in source) {
        return source.naturalHeight;
    } else {
        return source.height;
    }
};
export default Texture;
export type { TextureLike, TextureSource, TextureSubscriber };
export { default as TextureLayers } from "./Layers";
export type { TextureResource } from "./Layers";
