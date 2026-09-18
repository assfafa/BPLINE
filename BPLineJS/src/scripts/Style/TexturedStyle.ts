/// <reference types="@webgpu/types" preserve="true" />
import PartStyle from "./PartStyle";
import type { TextureLike, TextureSubscriber } from "../Texture";
/** 面、实体边框和关键点使用的贴图参数，各分区独立持有。 */
class TexturedStyle extends PartStyle implements TextureSubscriber {
    private _texture: TextureLike | undefined;
    private _addressModeU: GPUAddressMode = "repeat";
    private _addressModeV: GPUAddressMode = "repeat";
    /**
     * 当前贴图，undefined 使用白色后备贴图。
     * @example
     * const value = texturedStyle.texture;
     * @returns 当前贴图，undefined 使用白色后备贴图。
     */
    public get texture(): TextureLike | undefined {
        return this._texture;
    }
    /**
     * 当前贴图，undefined 使用白色后备贴图。
     * @param value 新贴图引用；纹理内部加载状态仍由 Texture 管理
     * @example
     * texturedStyle.texture = value;
     * @returns 无返回值。
     */
    public set texture(value: TextureLike | undefined) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._texture !== value) {
            this._texture?.delete(this);
            this._texture = value;
            value?.add(this);
            this.notify("texture");
        } else {
            return;
        }
    }
    /**
     * 图片内容变化向上通知，但不把它当作替换贴图引用。
     * @param texture 发出变化的贴图
     * @example
     * texturedStyle.onTextureChange(texture);
     * @returns 无返回值。
     */
    public onTextureChange(texture: TextureLike): void {
        // 只转发当前贴图的变化通知，忽略已经替换的旧来源。
        if (texture === this._texture) {
            this.notify("textureData");
        }
    }
    /**
     * 最终停用时解绑贴图和颜色，不销毁共享资源。
     * @example
     * texturedStyle.dispose();
     * @returns 无返回值。
     */
    public override dispose(): void {
        this._texture?.delete(this);
        super.dispose();
    }
    /**
     * U 方向贴图寻址方式。
     * @example
     * const value = texturedStyle.addressModeU;
     * @returns U 方向贴图寻址方式。
     */
    public get addressModeU(): GPUAddressMode {
        return this._addressModeU;
    }
    /**
     * U 方向贴图寻址方式。
     * @param value WebGPU 寻址方式
     * @example
     * texturedStyle.addressModeU = value;
     * @returns 无返回值。
     */
    public set addressModeU(value: GPUAddressMode) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["repeat", "mirror-repeat", "clamp-to-edge"].includes(value)) {
            throw new TypeError("Invalid address mode.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._addressModeU !== value) {
            this._addressModeU = value;
            this.notify("addressModeU");
        } else {
            return;
        }
    }
    /**
     * V 方向贴图寻址方式。
     * @example
     * const value = texturedStyle.addressModeV;
     * @returns V 方向贴图寻址方式。
     */
    public get addressModeV(): GPUAddressMode {
        return this._addressModeV;
    }
    /**
     * V 方向贴图寻址方式。
     * @param value WebGPU 寻址方式
     * @example
     * texturedStyle.addressModeV = value;
     * @returns 无返回值。
     */
    public set addressModeV(value: GPUAddressMode) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["repeat", "mirror-repeat", "clamp-to-edge"].includes(value)) {
            throw new TypeError("Invalid address mode.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._addressModeV !== value) {
            this._addressModeV = value;
            this.notify("addressModeV");
        } else {
            return;
        }
    }
}
export default TexturedStyle;
