import { Mat3, Vec2 } from "bpmatrixjs/Math";
import Texture from "../Texture";

type ShaderValue = number | Vec2 | Mat3 | Float32Array | Texture;
type ShaderValueKind = "f32" | "vec2f" | "mat3x3f" | "array<f32>" | "texture";
type ShaderValueRecord = Record<string, ShaderValue>;
interface ShaderValueEntry {
    name: string;
    value: ShaderValue;
    kind: ShaderValueKind;
    binding: number;
}

/** 为自定义材质维护稳定的 WGSL 绑定顺序和可替换的具名值。 */
class ShaderValues {
    private readonly _record: ShaderValueRecord = {};
    private readonly _proxy: ShaderValueRecord;
    private readonly _onChange: (schemaChanged: boolean, textureChanged: boolean) => void;
    private _version: number = 0;
    private _schemaKey: string = "[]";

    /**
     * 创建传值容器；属性赋值会通知材质，原地修改 Float32Array 后需调用 touch。
     * @param onChange 传值类型或资源引用变化通知
     * @example
     * const values = new ShaderValues(onChange);
     * @returns 传值容器。
     */
    public constructor(onChange: (schemaChanged: boolean, textureChanged: boolean) => void) {
        this._onChange = onChange;
        /**
         * 验证代理写入并通知材质。
         * @param _target 原始记录
         * @param name 字段名
         * @param value 新值
         * @example
         * values.value.offset = new Vec2(1, 2);
         * @returns 是否接受写入。
         */
        const SetValue = (_target: ShaderValueRecord, name: string | symbol, value: unknown): boolean => {
            // WGSL 绑定仅由字符串字段名生成。
            if (typeof name === "string") {
                this.set(name, value);
                return true;
            } else {
                return false;
            }
        };
        /**
         * 将代理删除操作映射到布局更新。
         * @param _target 原始记录
         * @param name 字段名
         * @example
         * delete values.value.offset;
         * @returns 是否接受删除。
         */
        const DeleteValue = (_target: ShaderValueRecord, name: string | symbol): boolean => {
            // 符号属性不参与 WGSL 绑定。
            if (typeof name === "string") {
                this.delete(name);
                return true;
            } else {
                return false;
            }
        };
        this._proxy = new Proxy(this._record, {
            set: SetValue,
            deleteProperty: DeleteValue,
        });
    }

    /**
     * 可直接按名字替换值的对象。
     * @example
     * values.value.diffuse = texture;
     * @returns 带变更通知的具名值对象。
     */
    public get value(): ShaderValueRecord {
        return this._proxy;
    }

    /**
     * 整体替换具名值，字段类型不变时保留 Pipeline 布局。
     * @param next 新值集合
     * @example
     * values.value = { offset: new Vec2(1, 2) };
     * @returns 无返回值。
     */
    public set value(next: ShaderValueRecord) {
        const previousSchema = this._schemaKey;
        const previousTextures = this.textures;
        const entries = Object.entries(next);
        // 先验证全部字段，再替换内部对象，避免部分更新后留下错误布局。
        for (const [name, item] of entries) {
            this.validate(name, item);
        }
        // Proxy 的 target 必须保留原身份，只清除其旧字段。
        for (const name of Object.keys(this._record)) {
            Reflect.deleteProperty(this._record, name);
        }
        // 已通过预校验的字段按名称重新写入。
        for (const [name, item] of entries) {
            this._record[name] = item;
        }
        this.commit(previousSchema, previousTextures);
    }

    /**
     * 当前数值修订号。
     * @example
     * const version = values.version;
     * @returns 数值修订号。
     */
    public get version(): number {
        return this._version;
    }

    /**
     * 字段名和类型组成的稳定布局键，不包含数值及 Texture 身份。
     * @example
     * const key = values.schemaKey;
     * @returns 绑定布局键。
     */
    public get schemaKey(): string {
        return this._schemaKey;
    }

    /**
     * 按字段名排序后的绑定列表。
     * @example
     * const entries = values.entries;
     * @returns 字段及对应的 group(2) binding。
     */
    public get entries(): ShaderValueEntry[] {
        let binding = 0;
        const entries: ShaderValueEntry[] = [];
        // 固定名称顺序，使对象赋值顺序不影响着色器缓存键。
        for (const name of Object.keys(this._record).sort()) {
            const value = this._record[name];
            const kind = this.getKind(value);
            entries.push({ name, value, kind, binding });
            // 纹理需要视图和采样器两个绑定槽位。
            if (kind === "texture") {
                binding += 2;
            } else {
                binding += 1;
            }
        }
        return entries;
    }

    /**
     * 自定义贴图列表，供 Scene 收集和按引用销毁。
     * @example
     * const textures = values.textures;
     * @returns 当前值中的所有 Texture。
     */
    public get textures(): Texture[] {
        const textures: Texture[] = [];
        // 场景上传与释放都使用全部已注册纹理。
        for (const value of Object.values(this._record)) {
            // 数值字段无需纹理生命周期管理。
            if (value instanceof Texture) {
                textures.push(value);
            }
        }
        return textures;
    }

    /**
     * 生成可以直接在 WGSL 中使用的 value_字段名声明。
     * @example
     * const source = values.declarations;
     * @returns group(2) 的 WGSL 声明。
     */
    public get declarations(): string {
        const lines: string[] = [];
        // WGSL 声明与 BindGroup 布局共用同一排序结果。
        for (const entry of this.entries) {
            const variable = "value_" + entry.name;
            const binding = String(entry.binding);
            // 贴图同时声明其采样器。
            if (entry.kind === "texture") {
                lines.push(`@group(2) @binding(${binding}) var ${variable}: texture_2d_array<f32>;`);
                lines.push(`@group(2) @binding(${String(entry.binding + 1)}) var valueSampler_${entry.name}: sampler;`);
            } else {
                // 动态数组以只读 storage 形式传入。
                if (entry.kind === "array<f32>") {
                    lines.push(`@group(2) @binding(${binding}) var<storage, read> ${variable}: array<f32>;`);
                } else {
                    lines.push(`@group(2) @binding(${binding}) var<uniform> ${variable}: ${entry.kind};`);
                }
            }
        }
        return lines.join("\n");
    }

    /**
     * 按名字替换一个值；同名同类型 Texture 只改变绑定引用。
     * @param name WGSL 字段名
     * @param value 新值
     * @example
     * values.set("diffuse", texture);
     * @returns 无返回值。
     */
    public set(name: string, value: unknown): void {
        this.validate(name, value);
        // 相同引用无须通知资源管理器。
        if (this._record[name] !== value) {
            const previousSchema = this._schemaKey;
            const previousTextures = this.textures;
            this._record[name] = value as ShaderValue;
            this.commit(previousSchema, previousTextures);
        }
    }

    /**
     * 删除字段并重建布局。
     * @param name 待删除的字段名
     * @example
     * values.delete("diffuse");
     * @returns 无返回值。
     */
    public delete(name: string): void {
        // 只有现有字段会改变布局。
        if (Object.hasOwn(this._record, name)) {
            const previousSchema = this._schemaKey;
            const previousTextures = this.textures;
            Reflect.deleteProperty(this._record, name);
            this.commit(previousSchema, previousTextures);
        }
    }

    /**
     * 原地修改 Float32Array 后通知上传；Vec2 和 Mat3 可直接使用自身版本。
     * @param name 已存在的字段名
     * @example
     * values.touch("weights");
     * @returns 无返回值。
     */
    public touch(name: string): void {
        // 原地修改仅对已注册字段有意义。
        if (Object.hasOwn(this._record, name)) {
            this._version++;
        } else {
            throw new RangeError("Unknown shader value: " + name);
        }
    }

    /**
     * 获取一个值对应的上传数组。
     * @param entry 已排序的值描述
     * @example
     * values.getBufferData(entry);
     * @returns 可直接上传的 f32 数组。
     */
    public getBufferData(entry: ShaderValueEntry): Float32Array<ArrayBuffer> {
        // 数值类型各自转换为 WebGPU 所需的连续 f32 数据。
        if (typeof entry.value === "number") {
            return new Float32Array([entry.value]);
        }
        // 二维向量占用两个 f32。
        if (entry.value instanceof Vec2) {
            return new Float32Array([entry.value.x, entry.value.y]);
        }
        // Mat3.GPUData 已补齐 WGSL 每列的对齐位。
        if (entry.value instanceof Mat3) {
            return entry.value.GPUData;
        }
        // 复制数组，防止上传过程中调用方更改缓冲。
        if (entry.value instanceof Float32Array) {
            return new Float32Array(entry.value);
        } else {
            throw new TypeError("Texture values do not have numeric GPUBuffer data.");
        }
    }

    /**
     * 计算字段类型，Texture 与数值使用不同绑定资源。
     * @param value 待检查值
     * @example
     * this.getKind(value);
     * @returns 对应的 WGSL 类型。
     */
    private getKind(value: ShaderValue): ShaderValueKind {
        // 该类型同时确定 WGSL 声明和 BindGroupLayout。
        if (typeof value === "number") {
            return "f32";
        }
        // Vec2 对应 uniform vec2f。
        if (value instanceof Vec2) {
            return "vec2f";
        }
        // Mat3 对应 uniform mat3x3f。
        if (value instanceof Mat3) {
            return "mat3x3f";
        }
        // 长度可变化的浮点数组对应 storage。
        if (value instanceof Float32Array) {
            return "array<f32>";
        } else {
            return "texture";
        }
    }

    /**
     * 校验字段名称与支持的数据类型。
     * @param name 字段名
     * @param value 值
     * @example
     * this.validate(name, value);
     * @returns 无返回值。
     */
    private validate(name: string, value: unknown): void {
        // 拒绝可能破坏 WGSL 变量声明的字段名。
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
            throw new TypeError("Shader value names must be WGSL-safe identifiers.");
        }
        // GPU 数值不得包含 NaN 或 Infinity。
        if (typeof value === "number") {
            // 标量以 f32 上传，检查其数值域。
            if (!Number.isFinite(value)) {
                throw new RangeError("Shader numbers must be finite.");
            }
        // 空 storage 数组无法形成有意义的绑定。
        } else if (value instanceof Float32Array) {
            // 至少上传一个元素。
            if (value.length === 0) {
                throw new RangeError("Shader arrays must contain at least one float.");
            }
        }
        // 其余对象只能是已支持的数学类型或贴图。
        if (!(value instanceof Vec2) && !(value instanceof Mat3) && !(value instanceof Texture) && typeof value !== "number" && !(value instanceof Float32Array)) {
            throw new TypeError("Shader values support number, Vec2, Mat3, Float32Array, and Texture.");
        }
    }

    /**
     * 提交布局与资源变化，保留同名同类型值的 Pipeline。
     * @param previousSchema 修改前的布局键
     * @param previousTextures 修改前的 Texture 引用
     * @example
     * this.commit(previousSchema, previousTextures);
     * @returns 无返回值。
     */
    private commit(previousSchema: string, previousTextures: Texture[]): void {
        /**
         * 缓存键只包含声明名和类型，不包含值或资源身份。
         * @param entry 已排序的值描述
         * @example
         * entries.map(ToSchemaPart);
         * @returns 单个字段的布局描述。
         */
        const ToSchemaPart = (entry: ShaderValueEntry): [string, ShaderValueKind] => [entry.name, entry.kind];
        this._schemaKey = JSON.stringify(this.entries.map(ToSchemaPart));
        this._version++;
        const nextTextures = this.textures;
        /**
         * 检测同名贴图是否替换为另一资源。
         * @param texture 修改前的贴图
         * @param index 旧贴图的排序位置
         * @example
         * previousTextures.some(TextureChanged);
         * @returns 对应位置的资源是否变化。
         */
        const TextureChanged = (texture: Texture, index: number): boolean => texture !== nextTextures[index];
        const textureChanged = previousTextures.length !== nextTextures.length ||
            previousTextures.some(TextureChanged);
        this._onChange(previousSchema !== this._schemaKey, textureChanged);
    }
}

export default ShaderValues;
export type { ShaderValue, ShaderValueEntry, ShaderValueKind, ShaderValueRecord };
