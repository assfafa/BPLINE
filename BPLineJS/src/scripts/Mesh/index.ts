import type { VersionedMath } from "bpmatrixjs/Math";
import { Mat3 } from "bpmatrixjs/Math/Mat3";
import type { CameraLike } from "../Camera";
import CloneGeometry from "../Geometry/CloneGeometry";
import type { GeoData, GeometrySubscriber } from "../Geometry/Geo";
import type { Geometry2d, Material2d } from "../global-types.ts";
import type { GroupLike } from "../Group";
import Group from "../Group";
import CloneMaterial from "../Material/CloneMaterial";
import type { MaterialChange, MaterialSubscriber } from "../Material/Material";
import Style from "../Style";
import { STYLE_STRIDE, WriteStyleData } from "../Style/WriteStyleData";
import type { TextureResource } from "../Texture/Layers";

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
    /** 编辑辅助 Mesh 等对象可显示在场景中，但不参与任何选择器拾取。 */
    public noSelect: boolean = false;
    private _ignoreZoom: boolean = false;
    private _culling: boolean = true;
    private _autoPrecision: boolean = false;
    private _precisionMax: number = 100;
    private _precisionGeometry: Geometry2d | undefined;
    private _renderMatrix: Mat3 | null = null;
    private _renderMatrixSource: Mat3 | null = null;
    private _renderMatrixSourceVersion: number = -1;
    private _renderMatrixZoom: number = Number.NaN;
    private _renderBounds: MeshBoundingBox | null = null;
    private _renderBoundsGeometry: Geometry2d | undefined;
    private _renderBoundsGeometryVersion: number = -1;
    private _renderBoundsMatrix: Mat3 | undefined;
    private _renderBoundsMatrixVersion: number = -1;
    /**
     * 几何数据
     */
    private _data: Geometry2d | undefined;
    /**
     * 材质数据
     */
    private _material: Material2d | undefined;
    private _style: Style | undefined;
    private _bounding: boolean = false;
    private _boundingBox: MeshBoundingBox | null = null;
    private _boundingGeometry: Geometry2d | undefined;
    private _boundingGeometryVersion: number = -1;
    private _boundingWorldMatrix: Mat3 | undefined;
    private _boundingWorldMatrixVersion: number = -1;
    protected _matrixVersion: number = 0;
    protected _styleVersion: number = 0;
    protected _stylePending: boolean = true;
    protected _geometryPending: boolean = true;
    protected _materialPending: boolean = true;
    protected _disposed: boolean = false;
    protected _matrixPending: boolean = true;
    /** 普通 Mesh 只有一个实例，后续 IMesh 扩展时仍按实际数量绘制。 */
    protected _count: number = 1;
    /** 当前实例容量，普通 Mesh 不提前分配大量空槽。 */
    protected _capacity: number = 1;
    /** 连续实例矩阵，每实例 12 个 float（含 Mat3 对齐补位），由 updateInstanceData 写入。 */
    protected _matrixData: Float32Array<ArrayBuffer> = new Float32Array(12);
    /** 连续实例样式，每实例 44 个 float，由 updateInstanceData 写入，不直接修改。 */
    protected _styleData: Float32Array<ArrayBuffer> = new Float32Array(STYLE_STRIDE);
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
    /** @example mesh.culling; @returns 是否参与视口筛选，默认 true；屏幕空间自定义 Shader 可关闭。 */
    public get culling(): boolean {
        return this._culling;
    }
    /** @param value 是否参与视口筛选 @example mesh.culling = false; @returns 无返回值。 */
    public set culling(value: boolean) {
        // 全屏辅助面与任意顶点 Shader 需要明确绕过 CPU 包围盒裁剪。
        if (this._culling !== value) {
            this._culling = value;
            this.updateVersion();
        }
    }
    /** @example mesh.autoPrecision; @returns 是否随相机 zoom 调整曲线精度，默认 false。 */
    public get autoPrecision(): boolean {
        return this._autoPrecision;
    }
    /** @param value 自动细分开关 @example mesh.autoPrecision = true; @returns 无返回值，关闭时恢复用户精度。 */
    public set autoPrecision(value: boolean) {
        // 关闭自动模式时恢复基准，防止把临时精度作为后续手动编辑的起点。
        if (this._autoPrecision !== value) {
            this._autoPrecision = value;
            // 还原用户基准，不把上一台相机的临时精度带入手动模式。
            if (value === false && this._data !== undefined) {
                this._data.setRenderPrecision(this._data.originPrecision);
            }
            this.updateVersion();
        }
    }
    /** @example const limit = mesh.precisionMax; @returns 自动细分上限，默认 100；不限制手动精度。 */
    public get precisionMax(): number {
        return this._precisionMax;
    }
    /** @param value 3 至 4095 的整数 @example mesh.precisionMax = 200; @returns 无返回值，下次渲染按新上限计算。 */
    public set precisionMax(value: number) {
        // 上限至少容纳三段曲线，并遵循圆角生成器的索引容量边界。
        if (Number.isInteger(value) && value >= 3 && value <= 4095) {
            // 重复配置不使渲染快照失效。
            if (this._precisionMax !== value) {
                this._precisionMax = value;
                this.updateVersion();
            }
        } else {
            throw new RangeError("precisionMax must be an integer in [3, 4095].");
        }
    }
    /** @example mesh.precision; @returns 当前几何的曲线精度。 */
    public get precision(): number {
        return this._data?.precision ?? 8;
    }
    /** @param value 用户基准精度 @example mesh.precision = 16; @returns 无返回值。 */
    public set precision(value: number) {
        const geometry = this._data;
        // 自动模式先隔离共享资源，避免此物体改变其他物体的精度。
        if (geometry !== undefined) {
            // 隔离完成后使用返回值，避免替换资源仍写到旧几何。
            if (this._autoPrecision) {
                const isolated = this.preparePrecisionGeometry();
                if (isolated !== undefined) {
                    // 几何身份已稳定，新的用户值成为自动模式的基准。
                    isolated.precision = value;
                }
            } else {
                geometry.precision = value;
            }
        }
    }
    /** @example mesh.originPrecision; @returns 几何最后手动设置的基准精度。 */
    public get originPrecision(): number {
        return this._data?.originPrecision ?? 8;
    }
    /** @example mesh.preparePrecisionGeometry(); @returns 自动模式独享的几何；IMesh 的所有实例仍共享一个模板。 */
    public preparePrecisionGeometry(): Geometry2d | undefined {
        const geometry = this._data;
        // 每次替换资源后只复制一次；静止帧不复制样式或顶点。
        if (this._autoPrecision && geometry !== undefined && this._precisionGeometry !== geometry) {
            const copy = CloneGeometry(geometry);
            // raw=false 的 IMesh 没有 Mesh.style，保留原来的共享生成样式。
            copy.style = geometry.style;
            this.data = copy;
            this._precisionGeometry = copy;
        }
        return this._data;
    }
    /**
     * 当前有效绘制条数。
     * @example
     * const value = mesh.count;
     * @returns 当前有效绘制条数。
     */
    public get count(): number {
        return this._count;
    }

    /**
     * 是否抵消相机 zoom，默认关闭。开启后以局部原点固定显示尺寸，位置仍使用世界坐标。
     * IMesh 继承此开关，分别固定每个实例的尺寸，不改变实例之间的位置。
     * @example const fixed = mesh.ignoreZoom;
     * @returns 是否固定显示尺寸。
     */
    public get ignoreZoom(): boolean {
        return this._ignoreZoom;
    }

    /**
     * 切换固定显示尺寸，并通知每个 Render 重新上传矩阵和分区缩放标记。
     * @param value 是否忽略相机 zoom
     * @example mesh.ignoreZoom = true;
     * @returns 无返回值。
     */
    public set ignoreZoom(value: boolean) {
        // 该显示属性不修改变换输入版本，避免覆盖用户设置的仿射矩阵。
        if (this._ignoreZoom !== value) {
            this._ignoreZoom = value;
            // 普通对象与实例槽位都拥有自己的样式标记，不修改共享 Style。
            for (let index = 0; index < this._count; index++) {
                this._styleData[index * STYLE_STRIDE + 30] = Number(value);
            }
            this._matrixVersion++;
            this._styleVersion++;
        }
    }

    /**
     * 获取相机专属的显示矩阵；返回值供读取，不能用于修改 Mesh 的位姿。
     * @param camera 本次渲染或选择使用的相机
     * @example const matrix = mesh.getRenderMatrix(camera);
     * @returns 正常世界矩阵或抵消 zoom 后的显示矩阵。
     */
    public getRenderMatrix(camera: CameraLike): Mat3 {
        const world = this.ensureWorldMatrix();
        // 非法 zoom 交由开发诊断处理，此处不把无穷或 NaN 写入显示矩阵。
        if (this._ignoreZoom && Number.isFinite(camera.zoom) && camera.zoom > 0) {
            // 仅在开启固定尺寸后分配补偿矩阵，普通 Mesh 不承担额外对象开销。
            this._renderMatrix ??= new Mat3();
            // 不同相机或 zoom 都有独立结果，世界变换未变时复用原始双精度数据。
            if (this._renderMatrixSource !== world || this._renderMatrixSourceVersion !== world.version ||
                this._renderMatrixZoom !== camera.zoom) {
                const values = world.data;
                const scale = 1 / camera.zoom;
                this._renderMatrix.set([
                    values[0] * scale, values[1] * scale, values[2] * scale,
                    values[3] * scale, values[4] * scale, values[5] * scale,
                    values[6], values[7], values[8],
                ]);
                this._renderMatrixSource = world;
                this._renderMatrixSourceVersion = world.version;
                this._renderMatrixZoom = camera.zoom;
            }
            return this._renderMatrix;
        } else {
            return world;
        }
    }

    /**
     * 查询显示包围盒；boundingBox 本身仍保留与相机无关的逻辑世界边界。
     * @param camera 本次渲染或选择使用的相机
     * @example const bounds = mesh.getRenderBoundingBox(camera);
     * @returns 当前相机下的显示边界，或 null。
     */
    public getRenderBoundingBox(camera: CameraLike): MeshBoundingBox | null {
        const bounds = this.boundingBox;
        const geometry = this._data;
        // 只有固定尺寸对象需要根据相机重新变换几何边界。
        if (bounds !== null && geometry !== undefined && this._ignoreZoom) {
            const matrix = this.getRenderMatrix(camera);
            // 固定尺寸物体的显示边界也按矩阵/几何版本缓存，不在静止帧扫描字体顶点。
            if (this._renderBoundsGeometry !== geometry || this._renderBoundsGeometryVersion !== geometry.version ||
                this._renderBoundsMatrix !== matrix || this._renderBoundsMatrixVersion !== matrix.version) {
                this._renderBounds = this.createBoundingBox(geometry, matrix);
                this._renderBoundsGeometry = geometry;
                this._renderBoundsGeometryVersion = geometry.version;
                this._renderBoundsMatrix = matrix;
                this._renderBoundsMatrixVersion = matrix.version;
            }
            return this._renderBounds;
        } else {
            return bounds;
        }
    }
    /**
     * 已分配槽数，不是扩容倍率。
     * @example
     * const value = mesh.capacity;
     * @returns 已分配槽数，不是扩容倍率。
     */
    public get capacity(): number {
        return this._capacity;
    }
    /**
     * 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。
     * @example
     * const value = mesh.matrixData;
     * @returns 连续世界矩阵数组，调用 updateInstanceData 后读取，不直接修改。
     */
    public get matrixData(): Float32Array<ArrayBuffer> {
        return this._matrixData;
    }
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
     * 是否启用自身几何的包围盒计算，默认关闭。
     * @example
     * const enabled = mesh.bounding;
     * @returns 是否启用包围盒计算。
     */
    public get bounding(): boolean {
        return this._bounding;
    }
    /**
     * 开启或关闭包围盒计算；变化时更新 Mesh 输入版本。
     * @param value 是否计算包围盒。
     * @example
     * mesh.bounding = true;
     * @returns 无返回值。
     */
    public set bounding(value: boolean) {
        // 开关变化才清除旧快照，避免重复赋值触发无意义的版本更新。
        if (this._bounding !== value) {
            this._bounding = value;
            this._boundingBox = null;
            this._boundingGeometry = undefined;
            this._boundingWorldMatrix = undefined;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 按需获取局部及世界坐标轴向包围盒；x/y 是最小坐标。
     * 关闭计算或几何没有顶点时返回 null，不包含子节点。
     * @example
     * const bounds = mesh.boundingBox;
     * @returns 当前几何的包围盒，或 null。
     */
    public get boundingBox(): MeshBoundingBox | null {
        // 关闭时不生成几何，也不更新世界矩阵。
        if (this._bounding) {
            const geometry = this._data;
            // Mesh 可能临时没有几何；此时不能沿用旧资源的边界。
            if (geometry !== undefined) {
                geometry.ensureGeometry();
                const worldMatrix = this.ensureWorldMatrix();
                // 几何或自身、父级变换变化后才重新遍历顶点。
                if (
                    this._boundingGeometry !== geometry ||
                    this._boundingGeometryVersion !== geometry.version ||
                    this._boundingWorldMatrix !== worldMatrix ||
                    this._boundingWorldMatrixVersion !== worldMatrix.version
                ) {
                    this._boundingBox = this.createBoundingBox(geometry, worldMatrix);
                    this._boundingGeometry = geometry;
                    this._boundingGeometryVersion = geometry.version;
                    this._boundingWorldMatrix = worldMatrix;
                    this._boundingWorldMatrixVersion = worldMatrix.version;
                }
            } else {
                this._boundingBox = null;
                this._boundingGeometry = undefined;
            }
        }
        return this._boundingBox;
    }
    /**
     * 从三角面和线框顶点同时计算两个坐标系的轴向范围。
     * @param geometry 当前 Mesh 的几何资源。
     * @param worldMatrix 已更新的世界矩阵。
     * @example
     * const bounds = this.createBoundingBox(geometry, worldMatrix);
     * @returns 几何边界；没有有效顶点时为 null。
     */
    protected createBoundingBox(geometry: Geometry2d, worldMatrix: Mat3): MeshBoundingBox | null {
        const matrix = worldMatrix.data;
        // 非有限变换无法形成有效的世界轴向边界。
        if (matrix.every(Number.isFinite)) {
            let localMinX = Number.POSITIVE_INFINITY;
            let localMinY = Number.POSITIVE_INFINITY;
            let localMaxX = Number.NEGATIVE_INFINITY;
            let localMaxY = Number.NEGATIVE_INFINITY;
            let worldMinX = Number.POSITIVE_INFINITY;
            let worldMinY = Number.POSITIVE_INFINITY;
            let worldMaxX = Number.NEGATIVE_INFINITY;
            let worldMaxY = Number.NEGATIVE_INFINITY;
            const vertexSources = [geometry.geometry, geometry.linePoints?.geometry];
            // 两种顶点来源共同决定 Mesh 自身的边界，不重复计算重合点也无碍。
            for (const vertices of vertexSources) {
                // 禁用的几何分区没有顶点，继续处理其他分区。
                if (vertices !== undefined) {
                    // 顶点数组按 x/y 成对存储，逐点更新局部和世界范围。
                    for (let offset = 0; offset + 1 < vertices.length; offset += 2) {
                        const x = vertices[offset];
                        const y = vertices[offset + 1];
                        const worldX = matrix[0] * x + matrix[3] * y + matrix[6];
                        const worldY = matrix[1] * x + matrix[4] * y + matrix[7];
                        // 非有限顶点或溢出的变换结果不能用于包围盒。
                        if (
                            Number.isFinite(x) &&
                            Number.isFinite(y) &&
                            Number.isFinite(worldX) &&
                            Number.isFinite(worldY)
                        ) {
                            localMinX = Math.min(localMinX, x);
                            localMinY = Math.min(localMinY, y);
                            localMaxX = Math.max(localMaxX, x);
                            localMaxY = Math.max(localMaxY, y);
                            worldMinX = Math.min(worldMinX, worldX);
                            worldMinY = Math.min(worldMinY, worldY);
                            worldMaxX = Math.max(worldMaxX, worldX);
                            worldMaxY = Math.max(worldMaxY, worldY);
                        }
                    }
                }
            }
            // 完全没有有效顶点的几何保持空边界。
            if (Number.isFinite(localMinX)) {
                return {
                    local: {
                        x: localMinX,
                        y: localMinY,
                        width: localMaxX - localMinX,
                        height: localMaxY - localMinY,
                    },
                    world: {
                        x: worldMinX,
                        y: worldMinY,
                        width: worldMaxX - worldMinX,
                        height: worldMaxY - worldMinY,
                    },
                };
            } else {
                return null;
            }
        } else {
            return null;
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
                WriteStyleData(style, this.styleData, 0, this.ignoreZoom);
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
     * 复制 Mesh 的几何、材质、样式和局部变换，不复制父子层级与 ID。
     * @param source 来源 Mesh
     * @example
     * target.copy(source);
     * @returns 当前 Mesh。
     */
    public copy(source: Mesh): this {
        const data = source.data;
        const material = source.material;
        // 没有完整绘制资源的来源不能生成可用的独立 Mesh。
        if (data !== undefined && material !== undefined) {
            const geometryCopy = CloneGeometry(data);
            const styleCopy = source.style?.clone();
            let materialStyle = material.style.clone();
            // 来源由 Mesh 统一管理样式时维持同样的共享关系。
            if (styleCopy !== undefined) {
                geometryCopy.style = styleCopy;
                materialStyle = styleCopy;
            }
            const materialCopy = CloneMaterial(material, materialStyle);
            this.init(geometryCopy, materialCopy);
            this.style = styleCopy;
            this.copyTransform(source);
            return this;
        } else {
            throw new Error("Cannot copy a Mesh without geometry and material.");
        }
    }

    /**
     * 创建独立 Mesh；图像和纹理资源可共享，参数及可变样式独立。
     * @example
     * const duplicate = mesh.clone();
     * @returns 新 Mesh，拥有新的 ID 且不属于任何父节点。
     */
    public clone(): Mesh {
        const data = this.data;
        const material = this.material;
        // 已释放或资源不完整的 Mesh 无法生成可绘制副本。
        if (data !== undefined && material !== undefined) {
            const geometryCopy = CloneGeometry(data);
            const styleCopy = this.style?.clone();
            let materialStyle = material.style.clone();
            // 统一样式模式下几何与材质共用同一份复制后的样式。
            if (styleCopy !== undefined) {
                geometryCopy.style = styleCopy;
                materialStyle = styleCopy;
            }
            const materialCopy = CloneMaterial(material, materialStyle);
            const duplicate = new Mesh(geometryCopy, materialCopy, styleCopy ?? false);
            duplicate.copyTransform(this);
            return duplicate;
        } else {
            throw new Error("Cannot clone a Mesh without geometry and material.");
        }
    }

    /**
     * 保留自定义仿射矩阵和公开 TRS 参数，来源父节点不随副本继承。
     * @param source 来源 Mesh
     * @example
     * this.copyTransform(source);
     * @returns 无返回值。
     */
    private copyTransform(source: Mesh): void {
        this.position.copy(source.position);
        this.rotation = source.rotation;
        this.scale.copy(source.scale);
        this.matrix.set(source.ensureMatrix().data);
        this.order = source.order;
        this.noSelect = source.noSelect;
        this.ignoreZoom = source.ignoreZoom;
        this.bounding = source.bounding;
        this.culling = source.culling;
        this._autoPrecision = source.autoPrecision;
        this._precisionMax = source.precisionMax;
        this._precisionGeometry = this._data;
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

/** 左下角坐标及轴向尺寸，局部和世界边界均使用此结构。 */
interface MeshBoundingRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** Mesh 自身几何在局部空间和世界空间中的轴向包围盒。 */
interface MeshBoundingBox {
    readonly local: MeshBoundingRect;
    readonly world: MeshBoundingRect;
}

interface MeshLike extends GroupLike, GeometrySubscriber, MaterialSubscriber {
    data: Geometry2d | undefined;
    material: Material2d | undefined;
    order: number;
    noSelect: boolean;
    ignoreZoom: boolean;
    culling: boolean;
    autoPrecision: boolean;
    precisionMax: number;
    precision: number;
    readonly originPrecision: number;
    style: Style | undefined;
    bounding: boolean;
    readonly boundingBox: MeshBoundingBox | null;
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
    /**
     * 获取当前相机下的显示世界矩阵，不修改对象本身的世界变换。
     * @param camera 本次渲染或选择使用的相机
     * @example const matrix = mesh.getRenderMatrix(camera);
     * @returns 包含 ignoreZoom 补偿的只读矩阵引用。
     */
    getRenderMatrix(camera: CameraLike): Mat3;
    /**
     * 获取当前相机下的显示包围盒，仍受 bounding 开关控制。
     * @param camera 本次渲染或选择使用的相机
     * @example const bounds = mesh.getRenderBoundingBox(camera);
     * @returns 当前显示边界，关闭包围盒或无顶点时为 null。
     */
    getRenderBoundingBox(camera: CameraLike): MeshBoundingBox | null;
    /** @example mesh.preparePrecisionGeometry(); @returns 当前 Mesh 独享的细分几何，或 undefined。 */
    preparePrecisionGeometry(): Geometry2d | undefined;
}

export default Mesh;
export type { MeshBoundingBox, MeshBoundingRect, MeshLike };
