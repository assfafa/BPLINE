import { GETID } from "../../ID";
import ShaderValues, { type ShaderValueRecord } from "../../Material/ShaderValues";

/** 一个全屏后处理步骤；只保存 CPU 配置，GPU 资源由 PostProcess 使用的 Render 管理。 */
class WgslPass {
    /** 通道身份，用于编辑器或外部列表。 */
    public readonly id: number = GETID();
    public readonly type: string = "WgslPass";
    /** 关闭时跳过该步骤，直接传递上一步结果。 */
    public enabled: boolean = true;
    /** 完整片元 WGSL 和具名传值；默认片元原样传递输入。 */
    public readonly raw = new WgslPassRaw();
    private _resolutionScale: number = 1;

    /** @param fragmentShader 包含 @fragment main 的完整 WGSL；空串原样传递 @example const pass = new WgslPass(); @returns 后处理步骤。 */
    public constructor(fragmentShader: string = "") {
        this.raw.fragmentShader = fragmentShader;
    }

    /** @example pass.resolutionScale; @returns 相对于原始输入 viewport 的尺寸比例，默认 1。 */
    public get resolutionScale(): number {
        return this._resolutionScale;
    }
    /** @param value 正有限比例，可用 0.5 降采样 @example pass.resolutionScale = 0.5; @returns 无返回值。 */
    public set resolutionScale(value: number) {
        // 每个通道都相对原始输入缩放，避免连续降采样时尺寸意外累乘。
        if (Number.isFinite(value) && value > 0) {
            this._resolutionScale = value;
        } else {
            throw new RangeError("WgslPass resolutionScale must be positive and finite.");
        }
    }
}

/** 接口与材质 raw.value 一致；postResolution 为系统预留字段。 */
class WgslPassRaw {
    /** 完整 @fragment main；UV 原点在左下，颜色返回非预乘 RGBA。 */
    public fragmentShader: string = "";
    /** @internal 通道具名值容器，复用材质的校验、类型和版本规则。 */
    public readonly values = new ShaderValues(ValuesChanged);

    /** @example pass.raw.value; @returns 支持 number、Vec2、Mat3、Float32Array、Texture、RenderTarget 的代理对象。 */
    public get value(): ShaderValueRecord {
        return this.values.value;
    }
    /** @param value 用户字段；不要使用保留名称 postResolution @example pass.raw.value = { strength: 0.5 }; @returns 无返回值。 */
    public set value(value: ShaderValueRecord) {
        this.values.value = value;
    }
    /** @param name 已原地修改的数组字段 @example pass.raw.touchValue("weights"); @returns 无返回值。 */
    public touchValue(name: string): void {
        this.values.touch(name);
    }
}

/** @param schemaChanged 布局是否变化 @param textureChanged 纹理引用是否变化 @example ValuesChanged(false, false); @returns 无返回值；执行时读取 ShaderValues 的版本，不创建 GPU 资源。 */
const ValuesChanged = (schemaChanged: boolean, textureChanged: boolean): void => {
    void schemaChanged;
    void textureChanged;
};

export default WgslPass;
export { WgslPassRaw };
