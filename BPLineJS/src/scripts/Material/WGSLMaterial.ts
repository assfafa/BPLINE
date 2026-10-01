import type Style from "../Style";
import Material from "./Material";
import ShaderValues from "./ShaderValues";
import type { ShaderValueRecord } from "./ShaderValues";
import rectVertexShader from "./wgsls/base/rect/vertex.wgsl?raw";
import polyVertexShader from "./wgsls/base/poly/vertex.wgsl?raw";
import ngonVertexShader from "./wgsls/base/ngon/vertex.wgsl?raw";

const WHITE_FRAGMENT = "@fragment fn main() -> @location(0) vec4f { return vec4f(1.0); }";

interface WGSLMaterialLike extends Material {
    readonly type: "WGSLMaterial";
    readonly raw: WGSLMaterialRaw;
}

/** 完整 WGSL 阶段源码和具名传值接口。 */
class WGSLMaterialRaw {
    private _vertexShader: string = "";
    private _fragmentShader: string = "";
    private readonly _values: ShaderValues;
    private readonly _onShaderChange: () => void;

    /**
     * 创建原始 WGSL 接口。
     * @param values 具名传值容器
     * @param onShaderChange 阶段源码变化通知
     * @example
     * const raw = new WGSLMaterialRaw(values, onShaderChange);
     * @returns 原始 WGSL 接口。
     */
    public constructor(values: ShaderValues, onShaderChange: () => void) {
        this._values = values;
        this._onShaderChange = onShaderChange;
    }
    /**
     * 完整顶点 WGSL，空字符串使用当前几何类型的基础顶点变换。
     * @example
     * const source = material.raw.vertexShader;
     * @returns 顶点源码。
     */
    public get vertexShader(): string {
        return this._vertexShader;
    }
    /**
     * 完整顶点 WGSL。
     * @param source 包含 @vertex main 的 WGSL
     * @example
     * material.raw.vertexShader = source;
     * @returns 无返回值。
     */
    public set vertexShader(source: string) {
        // 仅在源码变化时使 Pipeline 缓存失效。
        if (this._vertexShader !== source) {
            this._vertexShader = source;
            this._onShaderChange();
        }
    }
    /**
     * 完整片元 WGSL，空字符串返回白色。
     * @example
     * const source = material.raw.fragmentShader;
     * @returns 片元源码。
     */
    public get fragmentShader(): string {
        return this._fragmentShader;
    }
    /**
     * 完整片元 WGSL。
     * @param source 包含 @fragment main 的 WGSL
     * @example
     * material.raw.fragmentShader = source;
     * @returns 无返回值。
     */
    public set fragmentShader(source: string) {
        // 片元源码变化才需要创建新的 Pipeline。
        if (this._fragmentShader !== source) {
            this._fragmentShader = source;
            this._onShaderChange();
        }
    }
    /**
     * 可直接按名称更新的 GPU 传值。
     * @example
     * material.raw.value.mask = texture;
     * @returns 具名传值对象。
     */
    public get value(): ShaderValueRecord {
        return this._values.value;
    }
    /**
     * 整体替换具名传值。
     * @param value 新值集合
     * @example
     * material.raw.value = { mask: texture };
     * @returns 无返回值。
     */
    public set value(value: ShaderValueRecord) {
        this._values.value = value;
    }
    /**
     * 原地修改数组后标记其 GPU 数据需要更新。
     * @param name 数组字段名
     * @example
     * material.raw.touchValue("weights");
     * @returns 无返回值。
     */
    public touchValue(name: string): void {
        this._values.touch(name);
    }
}

/** 允许完整替换顶点和片元阶段，同时沿用现有 Mesh、几何和资源绑定约定。 */
class WGSLMaterial extends Material implements WGSLMaterialLike {
    public readonly type = "WGSLMaterial" as const;
    public readonly raw: WGSLMaterialRaw;

    /**
     * 创建完整 WGSL 材质。
     * @param style 共享样式
     * @example
     * const material = new WGSLMaterial(style);
     * @returns 材质对象。
     */
    public constructor(style?: Style) {
        super(style);
        /**
         * 区分传值布局变化和同名纹理替换。
         * @param schemaChanged 字段名或类型是否变化
         * @param textureChanged 纹理引用是否变化
         * @example
         * OnValuesChange(true, false);
         * @returns 无返回值。
         */
        const OnValuesChange = (schemaChanged: boolean, textureChanged: boolean): void => {
            // 字段布局改变会影响 WGSL 模块及 BindGroupLayout。
            if (schemaChanged) {
                this.updateVersion("pipeline");
            }
            // 同名纹理替换保持 Pipeline。
            if (textureChanged && !schemaChanged) {
                this.updateVersion("texture");
            }
        };
        /**
         * 缓存完整阶段源码的身份。
         * @example
         * OnShaderChange();
         * @returns 无返回值。
         */
        const OnShaderChange = (): void => {
            const key = JSON.stringify([this.raw.vertexShader, this.raw.fragmentShader]);
            this.setCustomShaderKey(key);
        };
        this._values = new ShaderValues(OnValuesChange);
        this.raw = new WGSLMaterialRaw(this._values, OnShaderChange);
        this.rectVertexShader = rectVertexShader;
        this.polyVertexShader = polyVertexShader;
        this.ngonVertexShader = ngonVertexShader;
        this.setCustomShaderKey(JSON.stringify(["", ""]));
    }

    /**
     * 为一个几何类型挑选自定义阶段或有效的默认阶段。
     * @param geometryType 几何类型
     * @example
     * material.getShaderSource("Base2D");
     * @returns 两个完整 WGSL 模块。
     */
    public override getShaderSource(geometryType: string): { vertex: string | undefined; fragment: string | undefined } {
        const base = super.getShaderSource(geometryType);
        const declarations = this._values?.declarations ?? "";
        let vertex = base.vertex;
        // 空顶点源码沿用几何类型的默认变换。
        if (this.raw.vertexShader !== "") {
            vertex = declarations + "\n" + this.raw.vertexShader;
        }
        let fragment = WHITE_FRAGMENT;
        // 空片元源码安全输出白色。
        if (this.raw.fragmentShader !== "") {
            fragment = this.raw.fragmentShader;
        }
        return { vertex, fragment: declarations + "\n" + fragment };
    }
}

export default WGSLMaterial;
export type { WGSLMaterialLike };
