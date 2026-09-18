import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type { VersionedMath } from "bpmatrixjs/Math";
import Mesh from "../Mesh";
import type { Geometry2d, Material2d } from "../global-types";
import { GETID } from "../ID";
import Raws, { Raw } from "../Raws";
import type { RawChange, RawOptions, RawSubscriber } from "../Raws";
import Style, { STYLE_STRIDE, WriteStyleData } from "../Style";
import TextureLayers from "../Texture/Layers";
import type { TextureLike } from "../Texture";
/** 实例管理设置；raw 为构建时选择，避免丢失的原始值被误认为可以恢复。 */
export interface IMeshOptions {
    /** 保留原始值和订阅，默认 true，构建后不可切换。 */
    raw?: boolean;
    /** 初始槽数，默认 2，必须是正整数。 */
    capacity?: number;
    /** 扩容倍率，默认 2，必须是不小于 2 的整数。 */
    growthFactor?: number;
}
/** 共用 Geometry / Material 的实例网格，每个槽位独立储存世界矩阵和样式。 */
class IMesh extends Mesh implements RawSubscriber {
    /** 对象类型；Scene 仍通过 Mesh 基类识别。 */
    public override readonly type: string = "IMesh";
    private readonly _raw: boolean;
    private readonly _raws: Raws = new Raws();
    private _growthFactor: number = 2;
    private readonly _ids: number[] = [];
    private readonly _pendingMatrices = new Set<number>();
    private readonly _pendingStyles = new Set<number>();
    private readonly _local: Mat3 = new Mat3();
    private readonly _world: Mat3 = new Mat3();
    // 不代理时也保留图片资源身份，但不保留 Vec2 / Style 或它们的订阅。
    private readonly _sources: (TextureLike | undefined)[][] = [];
    private readonly _textures: readonly TextureLayers[] = [
        new TextureLayers(),
        new TextureLayers(),
        new TextureLayers(),
    ];
    private readonly _layerIndices: Map<TextureLike | undefined, number>[] = [
        new Map<TextureLike | undefined, number>(),
        new Map<TextureLike | undefined, number>(),
        new Map<TextureLike | undefined, number>(),
    ];
    private _layersPending: boolean = false;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param data 共用几何模板，提前启用需要生成的分区
     * @param material 共用管线和采样器设置，不接管其 Style
     * @param options 默认管理原始值，容量 2，按 2 倍扩容
     * @example
     * const iMesh = new IMesh(data, material, options);
     * @returns 创建的 IMesh 对象。
     */
    public constructor(data: Geometry2d, material: Material2d, options: IMeshOptions = {}) {
        // 在 Mesh 订阅共享资源之前检查参数，失败时不留下无法取得的订阅对象。
        ValidateOptions(options);
        super(data, material, false);
        this._raw = options.raw ?? true;
        this._count = 0;
        this._capacity = 0;
        this.growthFactor = options.growthFactor ?? 2;
        try {
            this.capacity = options.capacity ?? 2;
        } catch (error) {
            super.dispose();
            throw error;
        }
    }
    /**
     * 是否保留并订阅原始值，只读。
     * @example
     * const value = iMesh.raw;
     * @returns 是否保留并订阅原始值，只读。
     */
    public get raw(): boolean {
        return this._raw;
    }
    /**
     * 原始记录按稳定 ID 查询；raw=false 时 Map 为空。
     * @example
     * const value = iMesh.raws;
     * @returns 原始记录按稳定 ID 查询；raw=false 时 Map 为空。
     */
    public get raws(): Raws {
        return this._raws;
    }
    /**
     * 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。
     * @example
     * const value = iMesh.growthFactor;
     * @returns 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。
     */
    public get growthFactor(): number {
        return this._growthFactor;
    }
    /**
     * 扩容倍率，默认 2；达到 100000 槽后每批追加 100000。
     * @param value 不小于 2 的整数倍率，不改变已有记录
     * @example
     * iMesh.growthFactor = value;
     * @returns 无返回值。
     */
    public set growthFactor(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isSafeInteger(value) || value < 2) {
            throw new RangeError("growthFactor must be an integer >= 2.");
        }
        this._growthFactor = value;
    }
    /**
     * 已分配的槽数，不等于有效条数 count。
     * @example
     * const value = iMesh.capacity;
     * @returns 已分配的槽数，不等于有效条数 count。
     */
    public override get capacity(): number {
        return this._capacity;
    }
    /**
     * 显式预留容量；不缩容、不丢弃记录。GPU 限制在 Render 上传前校验。
     * @param value 不小于 count 的正整数
     * @example
     * iMesh.capacity = value;
     * @returns 无返回值。
     */
    public set capacity(value: number) {
        this.assertActive();
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isSafeInteger(value) || value < 1 || value < this._count) {
            throw new RangeError("Invalid capacity.");
        }
        // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
        if (!(value <= this._capacity)) {
            // 限制实例槽数，避免连续样式数组的字节长度溢出。
            if (value > Math.floor(0xffffffff / (STYLE_STRIDE * 4))) {
                throw new RangeError("CPU array capacity exceeds 4 GiB.");
            }
            const matrices: Float32Array<ArrayBuffer> = new Float32Array(value * 12);
            const styles: Float32Array<ArrayBuffer> = new Float32Array(value * STYLE_STRIDE);
            matrices.set(this._matrixData.subarray(0, this._count * 12));
            styles.set(this._styleData.subarray(0, this._count * STYLE_STRIDE));
            this._matrixData = matrices;
            this._styleData = styles;
            this._capacity = value;
            this._matrixVersion++;
            this._styleVersion++;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 三套独立图片层表；普通 Mesh 在相同绑定位置只使用一层。
     * @example
     * const value = iMesh.textures;
     * @returns 三套独立图片层表；普通 Mesh 在相同绑定位置只使用一层。
     */
    public override get textures(): readonly TextureLayers[] {
        this.updateTextureLayers();
        return this._textures;
    }
    /**
     * 按 push 顺序绘制，返回 ID 而非槽位。raw=false 冻结本次调用时的世界矩阵。
     * @param options 原始值；省略 style 使用当前材质样式
     * @example
     * iMesh.push(options);
     * @returns 稳定 ID，通过 raws.map.get(id) 获取受管记录
     */
    public push(options: RawOptions = {}): number {
        this.assertActive();
        const values = this.resolve(options);
        this.ensureCapacity(this._count + 1);
        this.ensureWorldMatrix();
        const index: number = this._count;
        let record: Raw | undefined;
        // 启用原始值管理时建立可订阅记录；关闭时只保留打包快照。
        if (this._raw) {
            record = new Raw(index, values);
        } else {
            record = undefined;
        }
        const id: number = record?.id ?? GETID();
        this._count++;
        this._ids.push(id);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (record !== undefined) {
            this._raws.add(record);
            record.add(this);
        }
        this.writeMatrix(index, values);
        this.writeStyle(index, values.style, values.enabled);
        this.setSources(index, values.style);
        this._matrixVersion++;
        this._styleVersion++;
        this.updateVersion();
        return id;
    }
    /**
     * 手动完整覆盖一个槽位，省略值使用默认值，不是局部 patch。
     * raw=false 不建立订阅，按当前 IMesh 世界矩阵重新计算这个槽位。
     * @param index 连续数组下标
     * @param options 新的完整原始值
     * @example
     * iMesh.updateAt(index, options);
     * @returns 无返回值。
     */
    public updateAt(index: number, options: RawOptions): void {
        this.assertActive();
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isSafeInteger(index) || index < 0 || index >= this._count) {
            throw new RangeError("Invalid slot index.");
        }
        const values = this.resolve(options);
        const record = this._raws.map.get(this._ids[index]);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (record !== undefined) {
            record.position = values.position;
            record.rotation = values.rotation;
            record.scale = values.scale;
            record.style = values.style;
            record.enabled = values.enabled;
        }
        this.ensureWorldMatrix();
        this.writeMatrix(index, values);
        this.writeStyle(index, values.style, values.enabled);
        this.setSources(index, values.style);
        this._pendingMatrices.delete(index);
        this._pendingStyles.delete(index);
        this._matrixVersion++;
        this._styleVersion++;
        this.updateVersion();
    }
    /**
     * 变化只登记槽位；共享 Style 可以通知多个记录，不同步上传 GPU。
     * @param record 来源记录
     * @param change 变化区域
     * @example
     * iMesh.onRawChange(record, change);
     * @returns 无返回值。
     */
    public onRawChange(record: Raw, change: RawChange): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed && this._raws.map.get(record.id) === record) {
            // 位姿变化只更新矩阵槽，不重写独立的样式数据。
            if (change === "matrix") {
                this._pendingMatrices.add(record.index);
            } else if (change !== "textureData" && change !== "sampler") {
                // 图片像素和采样器变化不改变实例样式数值，避免多余打包。
                this._pendingStyles.add(record.index);
            }
            // 贴图引用改变后重建层表，保持实例中的层号有效。
            if (change === "texture") {
                this.setSources(record.index, record.style);
            }
            this._materialPending = true;
        } else {
            return;
        }
    }
    /**
     * 只在受管模式下由父级世界矩阵变化安排全体矩阵重算。
     * @param source 数学对象
     * @param field 关联字段
     * @example
     * iMesh.onMathChange(source, field);
     * @returns 无返回值。
     */
    public override onMathChange(source: VersionedMath, field: string): void {
        super.onMathChange(source, field);
        // 根据变化字段选择更新范围，避免无关属性触发资源重建。
        if (!this._raw && field === "worldMatrix") {
            this._matrixPending = false;
        }
    }
    /**
     * 按待处理槽位打包，静止帧不重新分配数组；世界矩阵仅储存一份。
     * @example
     * iMesh.updateInstanceData();
     * @returns 无返回值。
     */
    public override updateInstanceData(): void {
        this.assertActive();
        this.ensureWorldMatrix();
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (this._geometryPending && this.data !== undefined) {
            this.material?.addGeometryType(this.data.type);
        }
        let matricesChanged: boolean = false;
        let stylesChanged: boolean = false;
        // 只有受管理的原始记录才随父级矩阵自动更新世界变换。
        if (this._raw && this._matrixPending) {
            // 遍历当前缓存条目，按实际引用关系处理资源。
            for (const record of this._raws.map.values()) {
                this.writeMatrix(record.index, record);
            }
            matricesChanged = this._count > 0;
        } else {
            // 逐项处理 this._pendingMatrices，保持集合中的既定顺序。
            for (const index of this._pendingMatrices) {
                const record = this._raws.map.get(this._ids[index]);
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (record !== undefined) {
                    this.writeMatrix(index, record);
                    matricesChanged = true;
                }
            }
        }
        this.updateTextureLayers();
        // 逐项处理 this._pendingStyles，保持集合中的既定顺序。
        for (const index of this._pendingStyles) {
            const record = this._raws.map.get(this._ids[index]);
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (record !== undefined) {
                this.writeStyle(index, record.style, record.enabled);
                stylesChanged = true;
            }
        }
        // 实际写入矩阵后提交一次版本，供各 Render 独立识别。
        if (matricesChanged) {
            this._matrixVersion++;
        }
        // 实际写入样式后提交一次版本，避免每条记录重复通知。
        if (stylesChanged) {
            this._styleVersion++;
        }
        this._pendingMatrices.clear();
        this._pendingStyles.clear();
        this._matrixPending = false;
        this._stylePending = false;
        this._geometryPending = false;
        this._materialPending = false;
    }
    /**
     * 清空记录并解绑，保留已分配 CPU 容量供后续 push 使用。
     * @example
     * iMesh.clear();
     * @returns 无返回值。
     */
    public clear(): void {
        this.assertActive();
        this._raws.clear();
        this._count = 0;
        this._ids.length = 0;
        this._sources.length = 0;
        this._pendingMatrices.clear();
        this._pendingStyles.clear();
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const texture of this._textures) {
            texture.set([]);
        }
        // 逐项处理 this._layerIndices，保持集合中的既定顺序。
        for (const indices of this._layerIndices) {
            indices.clear();
        }
        this._layersPending = false;
        this._matrixVersion++;
        this._styleVersion++;
        this.updateVersion();
        this.getScene(this)?.updateVersion();
    }
    /**
     * 解除原始记录、贴图层表和资源订阅，不销毁共享几何、材质或图片。
     * @example
     * iMesh.dispose();
     * @returns 无返回值。
     */
    public override dispose(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed) {
            this.clear();
            // 遍历当前缓存条目，按实际引用关系处理资源。
            for (const texture of this._textures) {
                texture.dispose();
            }
            super.dispose();
        } else {
            return;
        }
    }
    /**
     * 容量不足时扩展实例连续数组，保留已有记录及其下标。
     * @param count 即将使用的条数
     * @example
     * this.ensureCapacity(count);
     * @returns 无返回值。
     */
    private ensureCapacity(count: number): void {
        let capacity: number = this._capacity;
        // 逐级扩容直到能容纳有效记录，避免每次追加都重新分配。
        while (capacity < count) {
            // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
            if (capacity < 100000) {
                capacity = Math.min(capacity * this._growthFactor, 100000);
            } else {
                capacity = Math.ceil(count / 100000) * 100000;
            }
        }
        // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
        if (capacity !== this._capacity) {
            this.capacity = capacity;
        }
    }
    /**
     * 将输入参数转换为本次实例记录使用的完整值。
     * @param options 完整输入
     * @example
     * this.resolve(options);
     * @returns 校验后的值，不保留临时默认对象
     */
    private resolve(options: RawOptions): Required<RawOptions> {
        const values = {
            position: options.position ?? new Vec2(),
            rotation: options.rotation ?? 0,
            scale: options.scale ?? new Vec2(1, 1),
            style: options.style ?? this.material?.style ?? new Style(),
            enabled: options.enabled ?? true,
        };
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (
            ![values.position.x, values.position.y, values.scale.x, values.scale.y, values.rotation].every(
                Number.isFinite,
            )
        ) {
            throw new RangeError("Transform components must be finite.");
        }
        return values;
    }
    /**
     * 计算指定实例的世界矩阵并写入连续矩阵数组。
     * @param index 槽位
     * @param values 局部变换，输出只保存 world * local
     * @example
     * this.writeMatrix(index, values);
     * @returns 无返回值。
     */
    private writeMatrix(index: number, values: Required<RawOptions> | Raw): void {
        const c: number = Math.cos(values.rotation);
        const s: number = Math.sin(values.rotation);
        this._local.set([
            c * values.scale.x,
            s * values.scale.x,
            0,
            -s * values.scale.y,
            c * values.scale.y,
            0,
            values.position.x,
            values.position.y,
            1,
        ]);
        this._world.mul(this.worldMatrix, this._local);
        this._matrixData.set(this._world.GPUData, index * 12);
    }
    /**
     * 将指定实例的样式打包到连续样式数组。
     * @param index 槽位
     * @param style 样式
     * @param enabled 整条记录开关
     * @example
     * this.writeStyle(index, style, enabled);
     * @returns 无返回值。
     */
    private writeStyle(index: number, style: Style, enabled: boolean): void {
        const offset: number = index * STYLE_STRIDE;
        WriteStyleData(style, this._styleData, offset);
        // 禁用实例时清空显示开关槽，保留矩阵和其他原始数据。
        if (!enabled) {
            this._styleData.fill(0, offset + 36, offset + 40);
        }
        this.writeLayers(index);
    }
    /**
     * 记录实例的贴图来源，供图层表建立和更新使用。
     * @param index 槽位
     * @param style 只截取图片引用，不保留整个 Style
     * @example
     * this.setSources(index, style);
     * @returns 无返回值。
     */
    private setSources(index: number, style: Style): void {
        const previous = this._sources.at(index);
        const next = [style.solid.texture, style.edge.texture, style.points.texture];
        /**
         * 比较实例三个分区的图片引用，判断是否需要重建层表。
         * @param texture 贴图对象
         * @param part 当前几何分区
         * @example
         * HasSameTextureSource(texture, part);
         * @returns 当前分区的贴图引用是否未改变。
         */
        const HasSameTextureSource = (texture: TextureLike | undefined, part: number): boolean =>
            texture === previous?.[part];
        // 处理转向与退化边界，避免零面积三角面或不稳定法线。
        if (previous === undefined || !next.every(HasSameTextureSource)) {
            this._sources[index] = next;
            this._layersPending = true;
            this.getScene(this)?.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 图片引用变化时才重建去重层表，避免反复换图后无限积累废弃层。
     * @example
     * this.updateTextureLayers();
     * @returns 无返回值。
     */
    private updateTextureLayers(): void {
        // 贴图引用表改变后才重新分配层号。
        if (this._layersPending) {
            // 按索引顺序处理三角面，保持绕序及属性下标一致。
            for (let part = 0; part < 3; part++) {
                const indices = this._layerIndices[part];
                const layers: (TextureLike | undefined)[] = [];
                indices.clear();
                // 逐项处理 this._sources，保持集合中的既定顺序。
                for (const sources of this._sources) {
                    const texture = sources[part];
                    // 检查集合中的关联关系，避免重复处理或遗漏引用。
                    if (!indices.has(texture)) {
                        indices.set(texture, layers.length);
                        layers.push(texture);
                    }
                }
                this._textures[part].set(layers);
            }
            // 按当前范围逐项处理，确保下标不越过有效数据。
            for (let index = 0; index < this._count; index++) {
                this.writeLayers(index);
            }
            this._styleVersion++;
            this._layersPending = false;
        } else {
            return;
        }
    }
    /**
     * 将贴图层号写入对应实例的样式记录。
     * @param index 将三套纹理层号写到样式最后一个 vec4
     * @example
     * this.writeLayers(index);
     * @returns 无返回值。
     */
    private writeLayers(index: number): void {
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let part = 0; part < 3; part++) {
            this._styleData[index * STYLE_STRIDE + 40 + part] =
                this._layerIndices[part].get(this._sources[index]?.[part]) ?? 0;
        }
    }
    /**
     * 拦截销毁后复用。
     * @example
     * this.assertActive();
     * @returns 无返回值。
     */
    private assertActive(): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed IMesh cannot be reused.");
        }
    }
}
export default IMesh;
export type { RawOptions } from "../Raws";
/**
 * 检查实例化配置，避免无效容量参数进入分配流程。
 * @param options 构建选项；不创建任何订阅或分配大数组
 * @example
 * ValidateOptions(options);
 * @returns 无返回值。
 */
const ValidateOptions = (options: IMeshOptions): void => {
    const capacity: number = options.capacity ?? 2;
    const factor: number = options.growthFactor ?? 2;
    // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
    if (
        !Number.isSafeInteger(capacity) ||
        capacity < 1 ||
        capacity > Math.floor(0xffffffff / (STYLE_STRIDE * 4))
    ) {
        throw new RangeError("Invalid initial capacity.");
    }
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isSafeInteger(factor) || factor < 2) {
        throw new RangeError("growthFactor must be an integer >= 2.");
    }
};
