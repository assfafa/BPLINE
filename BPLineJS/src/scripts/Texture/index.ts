import { GETID } from "../ID";

type TextureSource = HTMLImageElement | ImageBitmap | ImageData;

/** 贴图消费者，通常由 Style 的贴图分区实现。 */
interface TextureSubscriber {
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
    add(subscriber: TextureSubscriber): void;
    delete(subscriber: TextureSubscriber): void;
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
     */
    public constructor() {
        this.id = GETID();
    }

    /** 单一贴图版本，每个 Render 独立记录已上传版本。 */
    public get version(): number { return this._version; }
    /** 贴图来源地址；修改地址本身不会自动下载。 */
    public get url(): string | null { return this._url; }
    /** @param value 来源地址，下载使用 load */
    public set url(value: string | null) {
        if (this._url === value) return;
        this._url = value;
        this.updateVersion();
    }
    /** 当前浏览器图片源。 */
    public get source(): TextureSource | null { return this._source; }
    /** @param value 新图片源；同步更新宽高和 loaded，null 清空 */
    public set source(value: TextureSource | null) {
        if (this._source === value) return;
        if (value === null) this.clearSource();
        else this.setSource(value, this._url);
    }
    /** 当前图片是否可上传。 */
    public get loaded(): boolean { return this._loaded; }
    /** @param value 是否已加载；正常情况由 setSource / clearSource 自动维护 */
    public set loaded(value: boolean) {
        if (this._loaded === value) return;
        this._loaded = value;
        this.updateVersion();
    }
    /** 图片宽度，单位为源像素。 */
    public get width(): number { return this._width; }
    /** @param value 源像素宽度，必须为非负整数 */
    public set width(value: number) {
        if (!Number.isInteger(value) || value < 0) throw new RangeError("Texture width must be a non-negative integer.");
        if (this._width === value) return;
        this._width = value;
        this.updateVersion();
    }
    /** 图片高度，单位为源像素。 */
    public get height(): number { return this._height; }
    /** @param value 源像素高度，必须为非负整数 */
    public set height(value: number) {
        if (!Number.isInteger(value) || value < 0) throw new RangeError("Texture height must be a non-negative integer.");
        if (this._height === value) return;
        this._height = value;
        this.updateVersion();
    }

    /**
     * 关联贴图消费者；多个分区可以共享同一 Texture。
     * @param subscriber 消费者，重复 add 不会重复通知
     */
    public add(subscriber: TextureSubscriber): void {
        this._subscribers.add(subscriber);
    }
    /**
     * 解绑贴图消费者，不销毁图片源和任何 Render 的缓存。
     * @param subscriber 需要解绑的消费者
     */
    public delete(subscriber: TextureSubscriber): void {
        this._subscribers.delete(subscriber);
    }

    /** 原地修改图片像素后手动递增版本并通知；各 Render 独立消费，不存在清除版本操作。 */
    public updateVersion(): void {
        this._version++;
        for (const subscriber of [...this._subscribers]) subscriber.onTextureChange(this);
    }

    /**
     * 设置贴图源数据
     * @param source 贴图源数据
     * @param url 贴图来源地址
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
 * @returns 图片元素
 */
const LoadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.onerror = () => {
            reject(new Error(`Texture load failed: ${url}`));
        };

        image.src = url;
    });
};

/**
 * 获取贴图宽度
 * @param source 贴图源数据
 * @returns 贴图宽度
 */
const GetTextureWidth = (source: TextureSource): number => {
    if ("naturalWidth" in source) {
        return source.naturalWidth;
    }

    return source.width;
};

/**
 * 获取贴图高度
 * @param source 贴图源数据
 * @returns 贴图高度
 */
const GetTextureHeight = (source: TextureSource): number => {
    if ("naturalHeight" in source) {
        return source.naturalHeight;
    }

    return source.height;
};

export default Texture;
export type { TextureLike, TextureSource, TextureSubscriber };
export { default as TextureLayers } from "./Layers";
export type { TextureResource } from "./Layers";
