import Material from "./Material";
import type { MaterialLike } from "./Material";
import type Style from "../Style";
import rectVertexShader from "./shaders/base/rect/vertex.shader?raw";
import rectFragmentShader from "./shaders/base/rect/fragment.shader?raw";
import polyVertexShader from "./shaders/base/poly/vertex.shader?raw";
import polyFragmentShader from "./shaders/base/poly/fragment.shader?raw";

interface BaseMaterialLike extends MaterialLike {
    readonly type: "BaseMaterial";
}

/** 矩形与多边形材质；按几何类型选择 Shader，四套显示参数均从 Style 获取。 */
class BaseMaterial extends Material implements BaseMaterialLike {
    /** 对象类型。 */
    public readonly type = "BaseMaterial" as const;
    /** @param style 共享样式，通常与对应 Geometry 使用同一对象 */
    public constructor(style?: Style) {
        super(style);
        this.rectVertexShader = rectVertexShader;
        this.rectFragmentShader = rectFragmentShader;
        this.polyVertexShader = polyVertexShader;
        this.polyFragmentShader = polyFragmentShader;
        this.updateKey();
    }
}
export default BaseMaterial;
export type { BaseMaterialLike };
