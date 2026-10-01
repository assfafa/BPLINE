import type Style from "../Style";
import Material from "./Material";
import ShaderValues from "./ShaderValues";
import type { ShaderValueRecord } from "./ShaderValues";
import rectVertexShader from "./wgsls/base/rect/vertex.wgsl?raw";
import rectFragmentShader from "./wgsls/base/rect/fragment.wgsl?raw";
import polyVertexShader from "./wgsls/base/poly/vertex.wgsl?raw";
import polyFragmentShader from "./wgsls/base/poly/fragment.wgsl?raw";
import ngonVertexShader from "./wgsls/base/ngon/vertex.wgsl?raw";
import ngonFragmentShader from "./wgsls/base/ngon/fragment.wgsl?raw";

interface CompositeMaterialLike extends Material {
    readonly type: "CompositeMaterial";
    readonly raw: CompositeMaterialRaw;
}

/** 三个 Shader 字段均为函数体，返回颜色乘数；缺省时为 vec4f(1.0)。 */
class CompositeMaterialRaw {
    private _solidShader: string = "";
    private _edgeShader: string = "";
    private _pointShader: string = "";
    private readonly _values: ShaderValues;
    private readonly _onShaderChange: () => void;

    /**
     * 创建可修改的 Shader 与具名传值接口。
     * @param values 共用传值容器
     * @param onShaderChange 函数体变化通知
     * @example
     * const raw = new CompositeMaterialRaw(values, onShaderChange);
     * @returns 原始 Shader 接口。
     */
    public constructor(values: ShaderValues, onShaderChange: () => void) {
        this._values = values;
        this._onShaderChange = onShaderChange;
    }

    /**
     * 实体面函数体。
     * @example
     * const source = material.raw.solidShader;
     * @returns WGSL 函数体。
     */
    public get solidShader(): string {
        return this._solidShader;
    }
    /**
     * 实体面函数体。
     * @param source 新 WGSL 函数体
     * @example
     * material.raw.solidShader = "return vec4f(1.0);";
     * @returns 无返回值。
     */
    public set solidShader(source: string) {
        this.setShader("solid", source);
    }
    /**
     * 边框函数体。
     * @example
     * const source = material.raw.edgeShader;
     * @returns WGSL 函数体。
     */
    public get edgeShader(): string {
        return this._edgeShader;
    }
    /**
     * 边框函数体。
     * @param source 新 WGSL 函数体
     * @example
     * material.raw.edgeShader = "return vec4f(1.0);";
     * @returns 无返回值。
     */
    public set edgeShader(source: string) {
        this.setShader("edge", source);
    }
    /**
     * 关键点函数体。
     * @example
     * const source = material.raw.pointShader;
     * @returns WGSL 函数体。
     */
    public get pointShader(): string {
        return this._pointShader;
    }
    /**
     * 关键点函数体。
     * @param source 新 WGSL 函数体
     * @example
     * material.raw.pointShader = "return vec4f(1.0);";
     * @returns 无返回值。
     */
    public set pointShader(source: string) {
        this.setShader("point", source);
    }
    /**
     * 支持 number、Vec2、Mat3、Float32Array 和多个 Texture 的具名值。
     * @example
     * material.raw.value.diffuse = texture;
     * @returns 带通知的值对象。
     */
    public get value(): ShaderValueRecord {
        return this._values.value;
    }
    /**
     * 一次替换全部具名值。
     * @param value 新的字段集合
     * @example
     * material.raw.value = { diffuse: texture };
     * @returns 无返回值。
     */
    public set value(value: ShaderValueRecord) {
        this._values.value = value;
    }
    /**
     * 原地修改 Float32Array 后安排下一帧上传。
     * @param name 数组字段名
     * @example
     * material.raw.touchValue("weights");
     * @returns 无返回值。
     */
    public touchValue(name: string): void {
        this._values.touch(name);
    }

    /**
     * 保存一个函数体并使合成的片元源码失效。
     * @param area 三角面分区
     * @param source WGSL 函数体
     * @example
     * this.setShader("solid", source);
     * @returns 无返回值。
     */
    private setShader(area: "solid" | "edge" | "point", source: string): void {
        // 仅当对应分区源码实际变化时重建 Pipeline。
        if (area === "solid" && this._solidShader !== source) {
            this._solidShader = source;
            this._onShaderChange();
        }
        // 边框函数体只影响边框分支。
        if (area === "edge" && this._edgeShader !== source) {
            this._edgeShader = source;
            this._onShaderChange();
        }
        // 关键点函数体只影响关键点分支。
        if (area === "point" && this._pointShader !== source) {
            this._pointShader = source;
            this._onShaderChange();
        }
    }
}

/** 将三个颜色函数体合入形状的片元模板，顶点变换保持基础材质行为。 */
class CompositeMaterial extends Material implements CompositeMaterialLike {
    public readonly type = "CompositeMaterial" as const;
    public readonly raw: CompositeMaterialRaw;

    /**
     * 创建可逐分区定制片元颜色的材质。
     * @param style 共享样式
     * @example
     * const material = new CompositeMaterial(style);
     * @returns 材质对象。
     */
    public constructor(style?: Style) {
        super(style);
        /**
         * 值布局变化要重组 WGSL，资源替换只通知上传路径。
         * @param schemaChanged 字段名或类型是否变化
         * @param textureChanged 纹理资源引用是否变化
         * @example
         * OnValuesChange(true, false);
         * @returns 无返回值。
         */
        const OnValuesChange = (schemaChanged: boolean, textureChanged: boolean): void => {
            // 新字段需要同步片元声明及 Pipeline 布局。
            if (schemaChanged) {
                this.refreshShaders();
            }
            // 同名纹理仅更新绑定资源。
            if (textureChanged && !schemaChanged) {
                this.updateVersion("texture");
            }
        };
        /**
         * 三个分区任一源码变化时重新组装片元模块。
         * @example
         * OnShaderChange();
         * @returns 无返回值。
         */
        const OnShaderChange = (): void => {
            this.refreshShaders();
        };
        this._values = new ShaderValues(OnValuesChange);
        this.raw = new CompositeMaterialRaw(this._values, OnShaderChange);
        this.rectVertexShader = rectVertexShader;
        this.polyVertexShader = polyVertexShader;
        this.ngonVertexShader = ngonVertexShader;
        this.refreshShaders();
    }

    /**
     * 重新组装三个形状模板；数据变化不调用此方法。
     * @example
     * this.refreshShaders();
     * @returns 无返回值。
     */
    private refreshShaders(): void {
        const declarations = this._values?.declarations ?? "";
        this.rectFragmentShader = Compose(rectFragmentShader, declarations, this.raw.solidShader, this.raw.edgeShader, this.raw.pointShader);
        this.polyFragmentShader = Compose(polyFragmentShader, declarations, this.raw.solidShader, this.raw.edgeShader, this.raw.pointShader);
        this.ngonFragmentShader = Compose(ngonFragmentShader, declarations, this.raw.solidShader, this.raw.edgeShader, this.raw.pointShader);
    }
}

/**
 * 替换基础片元源码中的三个默认白色函数。
 * @param template 几何类型的片元模板
 * @param declarations 具名值绑定声明
 * @param solid 实体面函数体
 * @param edge 边框函数体
 * @param point 关键点函数体
 * @example
 * Compose(template, declarations, solid, edge, point);
 * @returns 完整 WGSL 片元源码。
 */
const Compose = (template: string, declarations: string, solid: string, edge: string, point: string): string => {
    let source = template;
    const parts = [
        ["SolidShader", solid],
        ["EdgeShader", edge],
        ["PointShader", point],
    ];
    // 按固定分区名称替换基础模板的白色默认函数。
    for (const [name, body] of parts) {
        const original = `fn ${name}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n    return vec4f(1.0);\n}`;
        const replacement = `fn ${name}(input: FragmentInput, materialUniform: MaterialUniform) -> vec4f {\n${body || "    return vec4f(1.0);"}\n}`;
        // 基础模板变化时直接报错，避免悄悄使用旧 Shader。
        if (!source.includes(original)) {
            throw new Error("Composite shader template is missing " + name + ".");
        }
        source = source.replace(original, replacement);
    }
    return declarations + "\n" + source;
};

export default CompositeMaterial;
export type { CompositeMaterialLike };
