/// <reference types="@webgpu/types" preserve="true" />
import PartStyle from "./PartStyle";
import type { TextureLike, TextureSubscriber } from "../Texture";

/** 面、实体边框和关键点使用的贴图参数，各分区独立持有。 */
class TexturedStyle extends PartStyle implements TextureSubscriber {
    private _texture: TextureLike | undefined;
    private _addressModeU: GPUAddressMode = "repeat";
    private _addressModeV: GPUAddressMode = "repeat";
    /** 当前贴图，undefined 使用白色后备贴图。 */
    public get texture(): TextureLike | undefined { return this._texture; }
    /** @param value 新贴图引用；纹理内部加载状态仍由 Texture 管理 */
    public set texture(value: TextureLike | undefined) {
        if (this._texture === value) return;
        this._texture?.delete(this);
        this._texture = value;
        value?.add(this);
        this.notify("texture");
    }

    /**
     * 图片内容变化向上通知，但不把它当作替换贴图引用。
     * @param texture 发出变化的贴图
     */
    public onTextureChange(texture: TextureLike): void {
        if (texture === this._texture) this.notify("textureData");
    }

    /** 最终停用时解绑贴图和颜色，不销毁共享资源。 */
    public override dispose(): void {
        this._texture?.delete(this);
        super.dispose();
    }

    /** U 方向贴图寻址方式。 */
    public get addressModeU(): GPUAddressMode { return this._addressModeU; }
    /** @param value WebGPU 寻址方式 */
    public set addressModeU(value: GPUAddressMode) {
        if (!["repeat", "mirror-repeat", "clamp-to-edge"].includes(value)) throw new TypeError("Invalid address mode.");
        if (this._addressModeU === value) return;
        this._addressModeU = value;
        this.notify("addressModeU");
    }

    /** V 方向贴图寻址方式。 */
    public get addressModeV(): GPUAddressMode { return this._addressModeV; }
    /** @param value WebGPU 寻址方式 */
    public set addressModeV(value: GPUAddressMode) {
        if (!["repeat", "mirror-repeat", "clamp-to-edge"].includes(value)) throw new TypeError("Invalid address mode.");
        if (this._addressModeV === value) return;
        this._addressModeV = value;
        this.notify("addressModeV");
    }
}
export default TexturedStyle;
