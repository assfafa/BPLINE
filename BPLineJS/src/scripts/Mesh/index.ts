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
    /**
     * 世界矩阵计算完成后，将单实例数据打包到预分配数组。
     * 数组不每帧分配；矩阵与样式分别更新版本，静止或只移动时不重复上传样式。
     * @example
     * mesh.updateInstanceData();
     * @returns 无返回值。
     */
    updateInstanceData(): void;
    /**
     * 最终停用 Mesh 时解绑资源；从 Scene 移除不会自动调用，也不销毁共享资源。
     * @example
     * mesh.dispose();
     * @returns 无返回值。
     */
    dispose(): void;
    /**
     * 设置当前 Mesh 使用的 Geometry 与 Material。
     * Mesh 已加入 Scene 时会标记场景结构变化，下次初始化将重建四个资源列表。
     * @param data 几何数据
     * @param material 材质数据
     * @example
     * mesh.init(data, material);
     * @returns 当前 Mesh
     */
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
    /**
     * 当前有效绘制条数。
     * @example
     * const value = mesh.count;
     * @returns 当前有效绘制条数。
     */
    public get count(): number {
        return this._count;
    }
    /** 当前实例容量，普通 Mesh 不提前分配大量空槽。 */
    protected _capacity: number = 1;
    /**
     * 已分配槽数，不是扩容倍率。
     * @example
     * const value = mesh.capacity;
     * @returns 已分配槽数，不是扩容倍率。
     */
    public get capacity(): number {
        return this._capacity;
    }
    /** 连续实例矩阵，每实例 12 个 float（含 Mat3 对齐补位），由 updateInstanceData 写入。 */
    protected _matrixData: Float32Array<ArrayBuffer> = new Float32Array(12);
    /**
     * 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。
     * @example
     * const value = mesh.matrixData;
     * @returns 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。
     */
    public get matrixData(): Float32Array<ArrayBuffer> {
        return this._matrixData;
    }
    /** 连续实例样式，每实例 44 个 float，由 updateInstanceData 写入，不直接修改。 */
    protected _styleData: Float32Array<ArrayBuffer> = new Float32Array(STYLE_STRIDE);
    /**
     * 连续样式数组，最后四个 float 保存三种贴图层号与补位。
     * @example
     * const value = mesh.styleData;
     * @returns 连续样式数组，最后四个 float 保存三种贴图层号与补位。
     */
    public get styleData(): Float32Array<ArrayBuffer> {
        return this._styleData;
    }
    /**
     * 普通 Mesh 每个分区只绑定一张图片，Shader 层号始终为 0。
     * @example
     * const value = mesh.textures;
     * @returns 普通 Mesh 每个分区只绑定一张图片，Shader 层号始终为 0。
     */
    public get textures(): readonly (TextureResource | undefined)[] {
        const style = this.material?.style;
        return [style?.solid.texture, style?.edge.texture, style?.points.texture];
    }
    /**
     * Mesh 管理的样式；undefined 表示不接管 Geometry / Material 的样式。
     * @example
     * const value = mesh.style;
     * @returns Mesh 管理的样式；undefined 表示不接管 Geometry / Material 的样式。
     */
    public get style(): Style | undefined {
        return this._style;
    }
    /**
     * 更换 Mesh 样式，并同步到当前几何和材质。
     * undefined 仅停止接管，不清除它们已有的样式，也不销毁共享 Style。
     * @param value 新样式引用
     * @example
     * mesh.style = value;
     * @returns 无返回值。
     */
    public set style(value: Style | undefined) {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed mesh cannot be reused.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (
            this._style !== value ||
            (value !== undefined &&
                ((this._data !== undefined && this._data.style !== value) ||
                    (this._material !== undefined && this._material.style !== value)))
        ) {
            this._style = value;
            this.syncStyle();
            this.updateResources();
        } else {
            return;
        }
    }
    /**
     * 连续矩阵数据版本，各 Render 独立记录上传快照。
     * @example
     * const value = mesh.matrixVersion;
     * @returns 连续矩阵数据版本，各 Render 独立记录上传快照。
     */
    public get matrixVersion(): number {
        return this._matrixVersion;
    }
    /**
     * 连续样式数据版本，各 Render 独立记录上传快照。
     * @example
     * const value = mesh.styleVersion;
     * @returns 连续样式数据版本，各 Render 独立记录上传快照。
     */
    public get styleVersion(): number {
        return this._styleVersion;
    }
    /**
     * 几何通知待处理；生成和 GPU 上传仍归 geometryList，不在 Mesh 回调里执行。
     * @example
     * const value = mesh.geometryPending;
     * @returns 几何通知待处理；生成和 GPU 上传仍归 geometryList，不在 Mesh 回调里执行。
     */
    public get geometryPending(): boolean {
        return this._geometryPending;
    }
    /**
     * 材质通知待处理，用于下帧校验和更新 Mesh 自己的样式数组。
     * @example
     * const value = mesh.materialPending;
     * @returns 材质通知待处理，用于下帧校验和更新 Mesh 自己的样式数组。
     */
    public get materialPending(): boolean {
        return this._materialPending;
    }
    /**
     * 几何发生变化，只标记本 Mesh 的绑定需要检查。
     * @param geometry 通知来源；旧几何解绑后不再影响本 Mesh
     * @example
     * mesh.onGeometryChange(geometry);
     * @returns 无返回值。
     */
    public onGeometryChange(geometry: GeoData): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed && geometry === this._data) {
            this._geometryPending = true;
        }
    }
    /**
     * 材质变化只安排下帧工作，不在通知链内上传 GPU 或递归改写 Style。
     * @param change 样式数据和资源引用的影响范围
     * @example
     * mesh.onMaterialChange(change);
     * @returns 无返回值。
     */
    public onMaterialChange(change: MaterialChange): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed && change.source === this._material) {
            this._materialPending = true;
            this._stylePending ||= change.style;
            // 资源引用变化需要刷新场景资源列表，纯样式数值变化不触发收集。
            if (change.resources) {
                this.getScene(this)?.updateVersion();
            }
        } else {
            return;
        }
    }
    /**
     * 最终停用 Mesh 时解绑资源；从 Scene 移除不会自动调用，也不销毁共享资源。
     * @example
     * mesh.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        super.dispose();
        this._data?.delete(this);
        this._material?.delete(this);
        this._disposed = true;
    }
    /**
     * 将 Mesh 主动指定的样式同步给新绑定的几何及材质。
     * @example
     * this.syncStyle();
     * @returns 无返回值。
     */
    private syncStyle(): void {
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (this._style !== undefined) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (this._data !== undefined) {
                this._data.style = this._style;
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (this._material !== undefined) {
                this._material.style = this._style;
            }
        } else {
            return;
        }
    }
    /**
     * 世界矩阵计算完成后，将单实例数据打包到预分配数组。
     * 数组不每帧分配；矩阵与样式分别更新版本，静止或只移动时不重复上传样式。
     * @example
     * mesh.updateInstanceData();
     * @returns 无返回值。
     */
    public updateInstanceData(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed mesh cannot be rendered.");
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (this._geometryPending && this._data !== undefined) {
            this._material?.addGeometryType(this._data.type);
        }
        const matrix = this.worldMatrix.GPUData;
        // 矩阵待更新时才重新打包，稳定帧直接复用连续数组。
        if (this._matrixPending) {
            this.matrixData.set(matrix, 0);
            this._matrixVersion++;
            this._matrixPending = false;
        }
        // 材质通过 add 通知所有 Mesh；不再每帧探测 Style 引用及版本。
        if (this._stylePending) {
            const style = this._material?.style;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (style === undefined) {
                this.styleData.fill(0);
            } else {
                WriteStyleData(style, this.styleData, 0);
            }
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
     * @example
     * mesh.onMathChange(source, field);
     * @returns 无返回值。
     */
    public override onMathChange(source: VersionedMath, field: string): void {
        super.onMathChange(source, field);
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._nodeDisposed && field === "worldMatrix" && source === this.worldMatrix) {
            this._matrixPending = true;
        }
    }
    /**
     * 获取当前几何体。
     * @example
     * const value = mesh.data;
     * @returns Geometry，未设置时为 undefined
     */
    public get data(): Geometry2d | undefined {
        return this._data;
    }
    /**
     * 替换几何体，追加材质类型标记并刷新所在场景的资源引用。
     * @param data 新几何体，undefined 表示暂不绘制
     * @example
     * mesh.data = data;
     * @returns Geometry，未设置时为 undefined
     */
    public set data(data: Geometry2d | undefined) {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed mesh cannot be reused.");
        }
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (this._data !== data) {
            data?.add(this);
            this._data?.delete(this);
            this._data = data;
            this._geometryPending = true;
            this.syncStyle();
            this.updateResources();
        } else {
            return;
        }
    }
    /**
     * 获取当前材质。
     * @example
     * const value = mesh.material;
     * @returns Material，未设置时为 undefined
     */
    public get material(): Material2d | undefined {
        return this._material;
    }
    /**
     * 替换材质，追加当前几何类型标记并刷新场景引用。
     * @param material 新材质，undefined 表示暂不绘制
     * @example
     * mesh.material = material;
     * @returns Material，未设置时为 undefined
     */
    public set material(material: Material2d | undefined) {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed mesh cannot be reused.");
        }
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (this._material !== material) {
            material?.add(this);
            this._material?.delete(this);
            this._material = material;
            this._materialPending = true;
            this._stylePending = true;
            this.syncStyle();
            this.updateResources();
        } else {
            return;
        }
    }
    /**
     * 同步材质几何类型与场景引用，不修改共享材质的着色器选择。
     * @example
     * this.updateResources();
     * @returns 无返回值
     */
    private updateResources(): void {
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (this._data !== undefined) {
            this._material?.addGeometryType(this._data.type);
        }
        const scene = this.getScene(this);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
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
     * @example
     * const mesh = new Mesh(data, material, style);
     * @returns 创建的 Mesh 对象。
     */
    public constructor(data: Geometry2d, material: Material2d, style: Style | boolean = true) {
        super(0, 0);
        // 默认模式为当前 Mesh 创建一份独立样式，再同步给几何和材质。
        if (style === true) {
            this._style = new Style();
        } else {
            // 关闭自动样式管理时保留几何、材质各自的样式。
            if (style === false) {
                this._style = undefined;
            } else {
                this._style = style;
            }
        }
        this.init(data, material);
    }
    /**
     * 设置当前 Mesh 使用的 Geometry 与 Material。
     * Mesh 已加入 Scene 时会标记场景结构变化，下次初始化将重建四个资源列表。
     * @param data 几何数据
     * @param material 材质数据
     * @example
     * mesh.init(data, material);
     * @returns 当前 Mesh
     */
    public init(data: Geometry2d, material: Material2d): this {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed mesh cannot be reused.");
        }
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (data !== this._data) {
            data.add(this);
            this._data?.delete(this);
        }
        // 仅处理新的属性或引用，保持现有关联与版本在重复赋值时不变。
        if (material !== this._material) {
            material.add(this);
            this._material?.delete(this);
        }
        this._data = data;
        this._material = material;
        this._geometryPending = true;
        this._materialPending = true;
        this._stylePending = true;
        // this.syncStyle();
        this.updateResources();
        return this;
    }
}
export default Mesh;
export type { MeshLike };
