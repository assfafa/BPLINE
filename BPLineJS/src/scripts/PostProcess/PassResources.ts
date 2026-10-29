import { Vec2 } from "bpmatrixjs/Math";
import Camera from "../Camera";
import Base2D from "../Geometry/Base2D";
import WGSLMaterial from "../Material/WGSLMaterial";
import Mesh from "../Mesh";
import type Render from "../Render";
import type RenderTarget from "../RenderTarget";
import Scene from "../Scene";
import Style from "../Style";
import type WgslPass from "./WgslPass";
import vertexShader from "./wgsls/vertex.wgsl?raw";
import fragmentHeader from "./wgsls/fragment.wgsl?raw";

/** 单个通道的私有全屏三角形，复用现有材质传值、绑定缓存和资源回收路径。 */
class PassResources {
    public readonly scene = new Scene();
    public readonly camera = new Camera(1, 1);
    private readonly _style = new Style();
    private readonly _resolution = new Vec2(1, 1);
    private readonly _material = new WGSLMaterial(this._style);
    private readonly _geometry: Base2D;
    private readonly _mesh: Mesh;
    private _valuesVersion: number = -1;
    private _fragment: string | null = null;

    /** @example const resources = new PassResources(); @returns 独立的 CPU 全屏绘制资源。 */
    public constructor() {
        this._style.solid.enabled = true;
        this._style.solid.addressModeU = "clamp-to-edge";
        this._style.solid.addressModeV = "clamp-to-edge";
        this._material.cullMode = "none";
        this._material.raw.vertexShader = vertexShader;
        this._geometry = new Base2D({ vertices: new Float32Array([-1, -1, 3, -1, -1, 3]), style: this._style });
        this._mesh = new Mesh(this._geometry, this._material, this._style);
        this._mesh.culling = false;
        this._mesh.noSelect = true;
        this.scene.add(this._mesh);
    }

    /** @param pass 用户通道，null 为复制步骤 @param input 上一步的离屏画面 @param width 输出物理宽度 @param height 输出物理高度 @param premultiply Canvas 是否需要预乘输出 @example resources.prepare(pass, input, 512, 512); @returns 无返回值，仅同步 CPU 状态。 */
    public prepare(pass: WgslPass | null, input: RenderTarget, width: number, height: number, premultiply: boolean = false): void {
        this.camera.setViewport(width, height);
        this._resolution.set(width, height);
        this._style.solid.texture = input;
        let fragment = COPY_FRAGMENT;
        // 自定义通道以非预乘颜色运行，最终 Canvas 呈现单独转换 Alpha。
        if (pass !== null) {
            const values = pass.raw.values;
            // 保留字段独立维护，禁止静默覆盖用户传值。
            if (Object.hasOwn(values.value, "postResolution")) {
                throw new TypeError("WgslPass value name postResolution is reserved.");
            }
            // 数字、数组和资源替换才重建值记录；数学对象原地修改由已有版本机制处理。
            if (this._valuesVersion !== values.version) {
                this._material.raw.value = { ...values.value, postResolution: this._resolution };
                this._valuesVersion = values.version;
            }
            // 空源码是透传步骤，不产生全白画面。
            if (pass.raw.fragmentShader !== "") {
                fragment = pass.raw.fragmentShader;
            }
        } else {
            // 复制步骤没有用户值，只需保持分辨率 uniform。
            this._material.raw.value.postResolution = this._resolution;
            // Canvas 使用非预乘模式时无需额外转换。
            if (premultiply) {
                fragment = PRESENT_FRAGMENT;
            }
        }
        // shader 长字符串只在真正改变时组装，稳定帧保留原来的 Pipeline key。
        if (fragment !== this._fragment) {
            this._fragment = fragment;
            this._material.raw.fragmentShader = fragmentHeader + "\n" + fragment;
        }
    }

    /** @param render 所属渲染器 @example resources.destroy(render); @returns 无返回值，清除私有缓存与订阅，不销毁用户输入。 */
    public destroy(render: Render): void {
        this.scene.removeChild(this._mesh);
        this._style.solid.texture = undefined;
        this._material.raw.value = {};
        // 传 ID 只销毁私有缓冲，不能递归释放用户共享纹理。
        render.destroyMesh(this._mesh.id);
        render.destroyGeometry(this._geometry.id);
        render.destroyMaterial(this._material.id);
        render.trim(this.scene);
        this._mesh.dispose();
        this._geometry.dispose();
        this._material.dispose();
        this.camera.dispose();
    }
}

const COPY_FRAGMENT = "@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f { return sampleInput(uv); }";
const PRESENT_FRAGMENT = `@fragment fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let color = sampleInput(uv);
    return vec4f(color.rgb * color.a, color.a);
}`;

export default PassResources;
