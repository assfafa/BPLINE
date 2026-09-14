
import Group from "../Group";
import Style from "../Style";
import { STYLE_STRIDE, WriteStyleData } from "../Style/WriteStyleData";
import type { Geometry2d, Material2d } from "../global-types.ts";
import type { GroupLike } from "../Group";
import type { GeoData, GeometrySubscriber } from "../Geometry/Geo";
import type { MaterialChange, MaterialSubscriber } from "../Material/Material";
import type { TextureResource } from "../Texture/Layers";
import type { VersionedMath } from "bpmatrixjs/Math";


interface MeshLike extends GroupLike, GeometrySubscriber, MaterialSubscriber {
    data: Geometry2d | undefined;
    material: Material2d | undefined;
    order: number;
    style: Style | undefined;
    readonly count: number;
    readonly capacity: number;
    readonly textures: readonly (TextureResource | undefined)[];
    readonly matrixData: Float32Array<ArrayBuffer>;
    readonly styleData: Float32Array<ArrayBuffer>;
    readonly matrixVersion: number;
    readonly styleVersion: number;
    readonly geometryPending: boolean;
    readonly materialPending: boolean;
    updateInstanceData(): void;
    dispose(): void;
    init(data: Geometry2d, material: Material2d): this;
}

/**
 * 网格对象
 * 在组对象基础上增加几何数据和材质数据
 * @class
 */
class Mesh extends Group implements MeshLike {
    /**
     * 对象类型
     */
    public readonly type: string = "Mesh";
    /**
     * 几何数据
     */
    private _data: Geometry2d | undefined;

    /**
     * 材质数据
     */
    private _material: Material2d | undefined;
    private _style: Style | undefined;
    protected _matrixVersion: number = 0;
    protected _styleVersion: number = 0;
    protected _stylePending: boolean = true;
    protected _geometryPending: boolean = true;
    protected _materialPending: boolean = true;
    protected _disposed: boolean = false;
    protected _matrixPending: boolean = true;

    /** 普通 Mesh 只有一个实例，后续 IMesh 扩展时仍按实际数量绘制。 */
    protected _count: number = 1;
    /** 当前有效绘制条数。 */
    public get count(): number { return this._count; }
    /** 当前实例容量，普通 Mesh 不提前分配大量空槽。 */
    protected _capacity: number = 1;
    /** 已分配槽数，不是扩容倍率。 */
    public get capacity(): number { return this._capacity; }
    /** 连续实例矩阵，每实例 12 个 float（含 Mat3 对齐补位），由 updateInstanceData 写入。 */
    protected _matrixData: Float32Array<ArrayBuffer> = new Float32Array(12);
    /** 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。 */
    public get matrixData(): Float32Array<ArrayBuffer> { return this._matrixData; }
    /** 连续实例样式，每实例 44 个 float，由 updateInstanceData 写入，不直接修改。 */
    protected _styleData: Float32Array<ArrayBuffer> = new Float32Array(STYLE_STRIDE);
    /** 连续样式数组，最后四个 float 保存三种贴图层号与补位。 */
    public get styleData(): Float32Array<ArrayBuffer> { return this._styleData; }
    /** 普通 Mesh 每个分区只绑定一张图片，Shader 层号始终为 0。 */
    public get textures(): readonly (TextureResource | undefined)[] {
        const style = this.material?.style;
        return [style?.solid.texture, style?.edge.texture, style?.points.texture];
    }

    /** Mesh 管理的样式；undefined 表示不接管 Geometry / Material 的样式。 */
    public get style(): Style | undefined { return this._style; }

    /**
     * 更换 Mesh 样式，并同步到当前几何和材质。
     * undefined 仅停止接管，不清除它们已有的样式，也不销毁共享 Style。
     * @param value 新样式引用
     */
    public set style(value: Style | undefined) {
        if (this._disposed) throw new Error("Disposed mesh cannot be reused.");
        if (this._style === value && (value === undefined
            || ((this._data === undefined || this._data.style === value)
                && (this._material === undefined || this._material.style === value)))) return;
        this._style = value;
        this.syncStyle();
        this.updateResources();
    }

    /** 连续矩阵数据版本，各 Render 独立记录上传快照。 */
    public get matrixVersion(): number { return this._matrixVersion; }
    /** 连续样式数据版本，各 Render 独立记录上传快照。 */
    public get styleVersion(): number { return this._styleVersion; }
    /** 几何通知待处理；生成和 GPU 上传仍归 geometryList，不在 Mesh 回调里执行。 */
    public get geometryPending(): boolean { return this._geometryPending; }
    /** 材质通知待处理，用于下帧校验和更新 Mesh 自己的样式数组。 */
    public get materialPending(): boolean { return this._materialPending; }

    /**
     * 几何发生变化，只标记本 Mesh 的绑定需要检查。
     * @param geometry 通知来源；旧几何解绑后不再影响本 Mesh
     */
    public onGeometryChange(geometry: GeoData): void {
        if (!this._disposed && geometry === this._data) this._geometryPending = true;
    }

    /**
     * 材质变化只安排下帧工作，不在通知链内上传 GPU 或递归改写 Style。
     * @param change 样式数据和资源引用的影响范围
     */
    public onMaterialChange(change: MaterialChange): void {
        if (this._disposed || change.source !== this._material) return;
        this._materialPending = true;
        this._stylePending ||= change.style;
        if (change.resources) this.getScene(this)?.updateVersion();
    }

    /** 最终停用 Mesh 时解绑资源；从 Scene 移除不会自动调用，也不销毁共享资源。 */
    public dispose(): void {
        super.dispose();
        this._data?.delete(this);
        this._material?.delete(this);
        this._disposed = true;
    }

    /** 将 Mesh 主动指定的样式同步给新绑定的几何及材质。 */
    private syncStyle(): void {
        if (this._style === undefined) return;
        if (this._data !== undefined) this._data.style = this._style;
        if (this._material !== undefined) this._material.style = this._style;
    }

    /**
     * 世界矩阵计算完成后，将单实例数据打包到预分配数组。
     * 数组不每帧分配；矩阵与样式分别更新版本，静止或只移动时不重复上传样式。
     */
    public updateInstanceData(): void {
        if (this._disposed) throw new Error("Disposed mesh cannot be rendered.");
        if (this._geometryPending && this._data !== undefined) {
            this._material?.addGeometryType(this._data.type);
        }
        const matrix = this.worldMatrix.GPUData;
        if (this._matrixPending) {
            this.matrixData.set(matrix, 0);
            this._matrixVersion++;
            this._matrixPending = false;
        }
        // 材质通过 add 通知所有 Mesh；不再每帧探测 Style 引用及版本。
        if (this._stylePending) {
            const style = this._material?.style;
            if (style === undefined) this.styleData.fill(0);
            else WriteStyleData(style, this.styleData, 0);
            this._styleVersion++;
            this._stylePending = false;
        }
        this._geometryPending = false;
        this._materialPending = false;
    }

    /**
     * 世界矩阵完成修改后标记连续数组需要重打包，不再逐帧比较 12 个 float。
     * @param source 数学对象
     * @param field 关联字段
     */
    public override onMathChange(source: VersionedMath, field: string): void {
        super.onMathChange(source, field);
        if (!this._nodeDisposed && field === "worldMatrix" && source === this.worldMatrix) {
            this._matrixPending = true;
        }
    }


    /**
     * 获取当前几何体。
     * @returns Geometry，未设置时为 undefined
     */
    public get data(): Geometry2d | undefined {
        return this._data;
    }

    /**
     * 替换几何体，追加材质类型标记并刷新所在场景的资源引用。
     * @param data 新几何体，undefined 表示暂不绘制
     */
    public set data(data: Geometry2d | undefined) {
        if (this._disposed) throw new Error("Disposed mesh cannot be reused.");
        if (this._data === data) {
            return;
        }
        data?.add(this);
        this._data?.delete(this);
        this._data = data;
        this._geometryPending = true;
        this.syncStyle();
        this.updateResources();
    }

    /**
     * 获取当前材质。
     * @returns Material，未设置时为 undefined
     */
    public get material(): Material2d | undefined {
        return this._material;
    }

    /**
     * 替换材质，追加当前几何类型标记并刷新场景引用。
     * @param material 新材质，undefined 表示暂不绘制
     */
    public set material(material: Material2d | undefined) {
        if (this._disposed) throw new Error("Disposed mesh cannot be reused.");
        if (this._material === material) {
            return;
        }
        material?.add(this);
        this._material?.delete(this);
        this._material = material;
        this._materialPending = true;
        this._stylePending = true;
        this.syncStyle();
        this.updateResources();
    }

    /**
     * 同步材质几何类型与场景引用，不修改共享材质的着色器选择。
     * @returns 无返回值
     */
    private updateResources(): void {
        if (this._data !== undefined) {
            this._material?.addGeometryType(this._data.type);
        }
        const scene = this.getScene(this);
        if (scene !== undefined) {
            scene.updateLists();
            scene.updateVersion();
        }
    }

    /**
     * 创建网格对象
     * @param data 几何数据
     * @param material 材质数据
     * @param style true 创建全新 Style；false 保留资源各自样式；Style 指定共享样式
     */
    public constructor(data: Geometry2d, material: Material2d, style: Style | boolean = true) {
        super(0, 0);
        this._style = style === true ? new Style() : style === false ? undefined : style;
        this.init(data, material);
    }

    /**
     * 设置当前 Mesh 使用的 Geometry 与 Material。
     * Mesh 已加入 Scene 时会标记场景结构变化，下次初始化将重建四个资源列表。
     * @param data 几何数据
     * @param material 材质数据
     * @returns 当前 Mesh
     */
    public init(data: Geometry2d, material: Material2d): this {
        if (this._disposed) throw new Error("Disposed mesh cannot be reused.");
        if (data !== this._data) {
            data.add(this);
            this._data?.delete(this);
        }
        if (material !== this._material) {
            material.add(this);
            this._material?.delete(this);
        }
        this._data = data;
        this._material = material;
        this._geometryPending = true;
        this._materialPending = true;
        this._stylePending = true;
        this.syncStyle();
        this.updateResources();

        return this;
    }
}
export default Mesh;
export type { MeshLike };
