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
    /**
     * 任一源图或层表变化时递增。
     * @example
     * const value = textureLayers.version;
     * @returns 任一源图或层表变化时递增。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 有序层表；undefined 对应白色，不改变其他层的编号。
     * @example
     * const value = textureLayers.layers;
     * @returns 有序层表；undefined 对应白色，不改变其他层的编号。
     */
    public get layers(): readonly (TextureLike | undefined)[] {
        return this._layers;
    }
    /**
     * 原子替换层表；相同引用序列不更新，不保留废弃源的订阅。
     * @param layers 有序图片列表，由 IMesh 统一维护
     * @example
     * textureLayers.set(layers);
     * @returns 无返回值。
     */
    public set(layers: readonly (TextureLike | undefined)[]): void {
        /**
         * 比较同一下标处的新旧贴图引用，避免重复建立订阅。
         * @param item 当前处理的元素
         * @param index 从零开始的记录或顶点下标
         * @example
         * HasSameLayer(item, index);
         * @returns 该层贴图引用是否未改变。
         */
        const HasSameLayer = (item: TextureLike | undefined, index: number): boolean =>
            item === this._layers[index];
        // 处理转向与退化边界，避免零面积三角面或不稳定法线。
        if (layers.length !== this._layers.length || !layers.every(HasSameLayer)) {
            // 逐项处理贴图来源，保留图层顺序与样式层号的对应关系。
            for (const texture of this._layers) {
                texture?.delete(this);
            }
            this._layers = Object.freeze([...layers]);
            // 逐项处理贴图来源，保留图层顺序与样式层号的对应关系。
            for (const texture of this._layers) {
                texture?.add(this);
            }
            this._version++;
        } else {
            return;
        }
    }
    /**
     * 接收贴图来源变化，通知依赖的样式或图层缓存。
     * @param texture 已订阅图片，更新像素不需要重打包实例样式
     * @example
     * textureLayers.onTextureChange(texture);
     * @returns 无返回值。
     */
    public onTextureChange(texture: TextureLike): void {
        // 仍被层表引用的图片变化才使层表版本失效。
        if (this._layers.includes(texture)) {
            this._version++;
        }
    }
    /**
     * 解除图片订阅，不销毁共享图片或 GPU 缓存。
     * @example
     * textureLayers.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this.set([]);
    }
}
export default TextureLayers;
