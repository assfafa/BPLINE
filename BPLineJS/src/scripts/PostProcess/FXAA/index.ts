import WgslPass from "../WgslPass";
import premultShader from "../wgsls/premult.wgsl?raw";
import shader from "./fragment.wgsl?raw";

/** 单步骤快速近似抗锯齿，检测亮度与透明轮廓，沿边缘方向混合像素。 */
class FXAA extends WgslPass {
    public override readonly type: string = "FXAA";
    /** @example post.add("fxaa", new FXAA()); @returns 开箱即用的 FXAA 通道。 */
    public constructor() {
        super(premultShader + "\n" + shader);
    }
}
export default FXAA;
