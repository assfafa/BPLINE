import Material from "./Material";
import type { MaterialLike } from "./Material";
import type Style from "../Style";
import rectVertexShader from "./wgsls/base/rect/vertex.wgsl?raw";
import rectFragmentShader from "./wgsls/base/rect/fragment.wgsl?raw";
import polyVertexShader from "./wgsls/base/poly/vertex.wgsl?raw";
import polyFragmentShader from "./wgsls/base/poly/fragment.wgsl?raw";
import ngonVertexShader from "./wgsls/base/ngon/vertex.wgsl?raw";
import ngonFragmentShader from "./wgsls/base/ngon/fragment.wgsl?raw";

interface BaseMaterialLike extends MaterialLike {
    readonly type: "BaseMaterial";
}

/** 矩形、多边形与正多边形/圆环材质；按几何类型选择 WGSL，显示参数来自 Style。 */
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
        this.ngonVertexShader = ngonVertexShader;
        this.ngonFragmentShader = ngonFragmentShader;
        this.updateKey();
    }
}
export default BaseMaterial;
export type { BaseMaterialLike };
