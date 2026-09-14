import { GETID } from "../ID";
import type { TextureLike, TextureSubscriber } from "./index";

/** 可上传贴图资源：单图也以一层的 2d-array 视图绑定。 */
export type TextureResource = TextureLike | TextureLayers;

/** 多层纹理的 CPU 引用集合，GPUTexture 仍只属于 Render。 */
class TextureLayers implements TextureSubscriber {
    /** 数组资源 ID，与层内图片 ID 独立。 */
    public readonly id: number = GETID();
    /** 对象类型。 */
    public readonly type: string = "TextureLayers";
    private _version: number = 0;
    private _layers: readonly (TextureLike | undefined)[] = [];
    /** 任一源图或层表变化时递增。 */
    public get version(): number { return this._version; }
    /** 有序层表；undefined 对应白色，不改变其他层的编号。 */
    public get layers(): readonly (TextureLike | undefined)[] { return this._layers; }
    /**
     * 原子替换层表；相同引用序列不更新，不保留废弃源的订阅。
     * @param layers 有序图片列表，由 IMesh 统一维护
     */
    public set(layers: readonly (TextureLike | undefined)[]): void {
        if (layers.length === this._layers.length && layers.every((item, index): boolean => item === this._layers[index])) return;
        for (const texture of this._layers) texture?.delete(this);
        this._layers = Object.freeze([...layers]);
        for (const texture of this._layers) texture?.add(this);
        this._version++;
    }
    /** @param texture 已订阅图片，更新像素不需要重打包实例样式 */
    public onTextureChange(texture: TextureLike): void {
        if (this._layers.includes(texture)) this._version++;
    }
    /** 解除图片订阅，不销毁共享图片或 GPU 缓存。 */
    public dispose(): void { this.set([]); }
}

export default TextureLayers;
