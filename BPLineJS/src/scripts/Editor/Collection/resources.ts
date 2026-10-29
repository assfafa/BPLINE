import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type { Material2d } from "../../global-types";
import BaseMaterial from "../../Material/baseMaterial";
import CompositeMaterial from "../../Material/CompositeMaterial";
import type { ShaderValueRecord } from "../../Material/ShaderValues";
import WGSLMaterial from "../../Material/WGSLMaterial";
import Style from "../../Style";
import Effects from "../../Style/Effects";
import type { TextureInput } from "../../Texture";
import RenderTarget from "../../RenderTarget";
import Texture from "../../Texture";
import type { RectEditStyleData } from "../RectEditTool/data";
import { ApplyRectStyle, CaptureRectStyle } from "../RectEditTool/data";

/** 保存时去重纹理，加载时重建独立样式与材质。 */
class DocumentResources {
    private readonly _knownTextures = new Map<number, TextureInput>();
    private readonly _records = new Map<number, EditorTextureData>();
    private readonly _baseDefaults: BaseMaterial = new BaseMaterial();


    /** @example resources.beginCapture(); @returns 无返回值，清理本次导出的纹理表。 */
    public beginCapture(): void {
        this._records.clear();
    }

    /** @example const textures = resources.records; @returns 独立的纹理地址记录。 */
    public get records(): EditorTextureData[] {
        return [...this._records.values()];
    }

    /** @param style 原始用户样式 @example resources.captureStyle(style); @returns JSON 样式和纹理引用。 */
    public captureStyle(style: Style): EditorStyleData {
        const textures = {
            solid: this.captureTextureStyle(style.solid),
            edge: this.captureTextureStyle(style.edge),
            points: this.captureTextureStyle(style.points),
        };
        return { ...CaptureRectStyle(style), textures };
    }

    /** @param material 原始用户材质 @example resources.captureMaterial(material); @returns 保留材质类型和具名值的 JSON 数据。 */
    public captureMaterial(material: Material2d): EditorMaterialData {
        const data: EditorMaterialData = {
            type: "BaseMaterial", transparent: material.transparent, depthTest: material.depthTest,
            depthWrite: material.depthWrite, cullMode: material.cullMode, shaders: {},
        };
        // 复合和完整 WGSL 材质不能降级为普通白色材质。
        if (material instanceof CompositeMaterial) {
            data.type = "CompositeMaterial";
            data.raw = { solidShader: material.raw.solidShader, edgeShader: material.raw.edgeShader,
                pointShader: material.raw.pointShader, values: this.captureValues(material.raw.value) };
        } else if (material instanceof WGSLMaterial) {
            // 完整阶段源码与传值类型分别保存。
            data.type = "WGSLMaterial";
            data.raw = { vertexShader: material.raw.vertexShader, fragmentShader: material.raw.fragmentShader,
                values: this.captureValues(material.raw.value) };
        } else if (material instanceof BaseMaterial) {
            // 基础材质使用默认类型，仅写出被用户改过的阶段源码。
            data.type = "BaseMaterial";
        } else {
            throw new TypeError(`Unsupported editor material: ${material.type}.`);
        }
        // 自定义材质也允许直接覆盖形状阶段，保留这些公开字段。
        for (const field of ShaderFields) {
            // 基础模板无需逐个 Mesh 重复写入几万字符的 WGSL。
            if (data.type !== "BaseMaterial" || material[field] !== this._baseDefaults[field]) {
                data.shaders[field] = material[field] ?? null;
            }
        }
        return data;
    }

    /**
     * 解析纹理引用；同一文档引用保持同一资源，材质和样式仍独立创建。
     * @param records 文档纹理表
     * @param supplied 应用提供的外部资源，覆盖同会话缓存
     * @example const textures = resources.resolveTextures(doc.textures, options.textures);
     * @returns 文档编号到纹理对象的映射。
     */
    public resolveTextures(records: readonly EditorTextureData[], supplied?: ReadonlyMap<number, TextureInput>): Map<number, TextureInput> {
        const textures = new Map<number, TextureInput>();
        // 全部引用先解析，缺失 DOM 资源不能在清空旧场景后才报错。
        for (const record of records) {
            let texture = supplied?.get(record.id) ?? this._knownTextures.get(record.id);
            let sourceUrl: string | null = null;
            // 离屏资源没有 URL，只能按资源编号恢复引用。
            if (texture !== undefined && texture instanceof RenderTarget === false) {
                sourceUrl = texture.url;
            }
            // 缓存只在地址仍相同时复用；外部显式资源始终优先。
            if (texture !== undefined && supplied?.has(record.id) !== true && sourceUrl !== record.url) {
                texture = undefined;
            }
            // 地址资源按 Texture 的既有异步加载流程上传，几何可先回显。
            if (texture === undefined && record.url !== null) {
                const created = new Texture();
                created.url = record.url;
                void created.load(record.url).catch(console.error);
                texture = created;
            }
            // 无地址的视频、Canvas 或 ImageBitmap 由应用传入原始来源。
            if (texture !== undefined) {
                textures.set(record.id, texture);
                this._knownTextures.set(record.id, texture);
            } else {
                throw new TypeError(`Missing texture ${String(record.id)}; provide load options.textures.`);
            }
        }
        return textures;
    }

    /** @param data JSON 样式 @param textures 已解析的纹理 @example resources.createStyle(data, textures); @returns 独立 Style。 */
    public createStyle(data: EditorStyleData, textures: ReadonlyMap<number, TextureInput>): Style {
        ValidateStyle(data);
        const style = new Style();
        ApplyRectStyle(style, data);
        // 各分区有独立的寻址和绑定，不能共用一个分区对象。
        for (const area of ["solid", "edge", "points"] as const) {
            const saved = data.textures[area];
            style[area].addressModeU = saved.addressModeU;
            style[area].addressModeV = saved.addressModeV;
            // null 表示使用默认白色后备纹理。
            if (saved.texture !== null) {
                style[area].texture = RequiredTexture(saved.texture, textures);
            }
        }
        return style;
    }

    /** @param data JSON 材质 @param style 独立样式 @param textures 已解析的纹理 @example resources.createMaterial(data, style, textures); @returns 独立材质。 */
    public createMaterial(data: EditorMaterialData, style: Style, textures: ReadonlyMap<number, TextureInput>): Material2d {
        ValidateMaterial(data);
        let material: Material2d;
        // 对应类型先恢复 raw，再覆盖可选的显式形状阶段。
        if (data.type === "CompositeMaterial" && data.raw !== undefined) {
            const composite = new CompositeMaterial(style);
            composite.raw.solidShader = data.raw.solidShader ?? "";
            composite.raw.edgeShader = data.raw.edgeShader ?? "";
            composite.raw.pointShader = data.raw.pointShader ?? "";
            composite.raw.value = RestoreValues(data.raw.values, textures);
            material = composite;
        } else if (data.type === "WGSLMaterial" && data.raw !== undefined) {
            // 保留完整顶点/片元程序，空字符串继续沿用类的默认实现。
            const wgsl = new WGSLMaterial(style);
            wgsl.raw.vertexShader = data.raw.vertexShader ?? "";
            wgsl.raw.fragmentShader = data.raw.fragmentShader ?? "";
            wgsl.raw.value = RestoreValues(data.raw.values, textures);
            material = wgsl;
        } else if (data.type === "BaseMaterial") {
            // 每个 Mesh 都获得新的 BaseMaterial，避免共享可变材质。
            material = new BaseMaterial(style);
        } else {
            throw new TypeError("Invalid editor material record.");
        }
        material.transparent = data.transparent;
        material.depthTest = data.depthTest;
        material.depthWrite = data.depthWrite;
        material.cullMode = data.cullMode;
        // 只覆盖有记录的字段，其余继续使用类型默认阶段。
        for (const field of ShaderFields) {
            const source = data.shaders[field];
            // null 显式表示关闭该阶段，undefined 表示使用默认值。
            if (source !== undefined) {
                material[field] = source ?? undefined;
            }
        }
        return material;
    }

    /** @param part 一个贴图分区 @example this.captureTextureStyle(style.edge); @returns 分区的 JSON 绑定设置。 */
    private captureTextureStyle(part: Style["solid"] | Style["edge"] | Style["points"]): EditorTextureStyleData {
        return { texture: this.captureTexture(part.texture), addressModeU: part.addressModeU, addressModeV: part.addressModeV };
    }

    /** @param texture 可选纹理 @example this.captureTexture(style.solid.texture); @returns 文档资源编号或 null。 */
    private captureTexture(texture: TextureInput | undefined): number | null {
        let id: number | null = null;
        // 同一会话保留无 URL 的 DOM 引用，JSON 只包含可外部解析的编号。
        if (texture !== undefined) {
            this._knownTextures.set(texture.id, texture);
            let url: string | null = null;
            // 离屏内容需要调用方重绘；文档仅保存可外部解析的资源编号。
            if (texture instanceof RenderTarget === false) {
                url = texture.url;
            }
            this._records.set(texture.id, { id: texture.id, url });
            id = texture.id;
        }
        return id;
    }

    /** @param values 自定义 Shader 传值 @example this.captureValues(material.raw.value); @returns 有类型标记的纯数据。 */
    private captureValues(values: ShaderValueRecord): Record<string, EditorValueData> {
        const data = Object.create(null) as Record<string, EditorValueData>;
        // 字段名保留；Vec2/Mat3 与 Float32Array 不能因 JSON 数组相似而混淆。
        for (const [name, value] of Object.entries(values)) {
            // 标量和具名纹理有各自独立的表示。
            if (typeof value === "number") {
                data[name] = { kind: "number", value };
            } else if (value instanceof Vec2) {
                // 数学订阅器不进入文档，只保留分量。
                data[name] = { kind: "vec2", value: [value.x, value.y] };
            } else if (value instanceof Mat3) {
                // 三阶矩阵使用九个列主序值。
                data[name] = { kind: "mat3", value: [...value.data] };
            } else if (value instanceof Float32Array) {
                // 动态数组保留全部元素，回显时重建独立存储。
                data[name] = { kind: "array", value: Array.from(value) };
            } else {
                this.captureTexture(value);
                data[name] = { kind: "texture", value: value.id };
            }
        }
        return data;
    }
}

/** JSON 只保存纹理地址和资源编号；无地址的 DOM 来源由应用提供回显资源。 */
interface EditorTextureData {
    id: number;
    url: string | null;
}

interface EditorTextureStyleData {
    texture: number | null;
    addressModeU: GPUAddressMode;
    addressModeV: GPUAddressMode;
}

interface EditorStyleData extends RectEditStyleData {
    textures: {
        solid: EditorTextureStyleData;
        edge: EditorTextureStyleData;
        points: EditorTextureStyleData;
    };
}

type EditorValueData = { kind: "number"; value: number } |
    { kind: "vec2"; value: number[] } | { kind: "mat3"; value: number[] } | { kind: "array"; value: number[] } |
    { kind: "texture"; value: number };

/** 三类材质的 CPU 配置，不保存 GPUDevice、绑定或缓存。 */
interface EditorMaterialData {
    type: "BaseMaterial" | "CompositeMaterial" | "WGSLMaterial";
    transparent: boolean;
    depthTest: boolean;
    depthWrite: boolean;
    cullMode: GPUCullMode;
    shaders: Partial<Record<ShaderField, string | null>>;
    raw?: {
        solidShader?: string;
        edgeShader?: string;
        pointShader?: string;
        vertexShader?: string;
        fragmentShader?: string;
        values: Record<string, EditorValueData>;
    };
}

type ShaderField = "rectVertexShader" | "rectFragmentShader" | "polyVertexShader" |
    "polyFragmentShader" | "ngonVertexShader" | "ngonFragmentShader";

type MatrixValues = [number, number, number, number, number, number, number, number, number];

const ShaderFields: readonly ShaderField[] = ["rectVertexShader", "rectFragmentShader", "polyVertexShader",
    "polyFragmentShader", "ngonVertexShader", "ngonFragmentShader"];

/** @param id 文档纹理编号 @param textures 已解析资源 @example RequiredTexture(1, textures); @returns 必须存在的纹理。 */
const RequiredTexture = (id: number, textures: ReadonlyMap<number, TextureInput>): TextureInput => {
    const texture = textures.get(id);
    // 引用错误需要明确报出编号，不能静默回退白色纹理。
    if (texture === undefined) {
        throw new TypeError(`Unknown texture reference: ${String(id)}.`);
    } else {
        return texture;
    }
};

/** @param data JSON 具名值 @param textures 已解析资源 @example RestoreValues(data, textures); @returns 各类型独立的 Shader 值。 */
const RestoreValues = (data: Record<string, EditorValueData>, textures: ReadonlyMap<number, TextureInput>): ShaderValueRecord => {
    const values = Object.create(null) as ShaderValueRecord;
    // 恢复订阅对象和数组，而不是把 JSON 普通数组直接交给 ShaderValues。
    for (const [name, item] of Object.entries(data)) {
        // 不允许 JSON 字段修改 ShaderValues 内部普通对象的原型。
        if (["__proto__", "constructor", "prototype"].includes(name)) {
            throw new TypeError("Reserved shader value name.");
        }
        // 类型长度在构造数学对象之前验证，不能让缺少分量的数据进入 GPU。
        ValidateValue(item);
        // 与保存时的类型标记一一对应。
        if (item.kind === "number") {
            values[name] = item.value;
        } else if (item.kind === "vec2") {
            // 二维向量保持 Math 库的变更通知行为。
            values[name] = new Vec2(item.value[0], item.value[1]);
        } else if (item.kind === "mat3") {
            // Mat3 输入是九个列主序分量。
            const matrix = new Mat3();
            matrix.set(item.value as MatrixValues);
            values[name] = matrix;
        } else if (item.kind === "array") {
            // 不同材质的数值数组始终独立。
            values[name] = new Float32Array(item.value);
        } else {
            const texture = RequiredTexture(item.value, textures);
            // ShaderValues 当前只支持 Texture 类，结构化纹理仍可用于标准样式。
            if (texture instanceof Texture || texture instanceof RenderTarget) {
                values[name] = texture;
            } else {
                throw new TypeError("Shader texture values require a Texture instance.");
            }
        }
    }
    return values;
};

/** @param condition 资源数据必须满足的条件 @param message 错误说明 @example Check(valid, "Invalid material"); @returns 无返回值，失败抛出 TypeError。 */
const Check = (condition: boolean, message: string): void => {
    // 校验始终在创建或替换场景节点之前完成。
    if (condition === false) {
        throw new TypeError(`Invalid editor resource: ${message}.`);
    }
};

/** @param value 待验证值 @example IsObject(value); @returns 是否为记录对象。 */
const IsObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && Array.isArray(value) === false;

/** @param value 待验证枚举 @param supported 支持的枚举值 @example OneOf(value, ["BaseMaterial"]); @returns 是否受支持。 */
const OneOf = (value: unknown, supported: readonly unknown[]): boolean => supported.includes(value);

/** @param value 传值标量 @example Finite(value); @returns 是否为有限数字。 */
const Finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** @param data 待回显的样式 @example ValidateStyle(data); @returns 无返回值，验证样式分区和必要类型。 */
const ValidateStyle = (data: EditorStyleData): void => {
    Check(IsObject(data) && IsObject(data.textures), "missing style/texture settings");
    // 新文档的效果在清空当前编辑内容前完成校验；旧文档允许省略。
    if (data.effects !== undefined) {
        Effects.validate(data.effects);
    }
    // 所有分区均有启用状态、颜色和不透明度。
    for (const area of ["solid", "wireframe", "edge", "points"] as const) {
        const part = data[area];
        Check(IsObject(part) && typeof part.enabled === "boolean" && typeof part.color === "string" && Finite(part.opacity),
            `invalid ${area} style`);
    }
    Check(typeof data.solid.borderColor === "string" && Finite(data.solid.borderWidth) && data.solid.borderWidth >= 0,
        "invalid solid border");
    Check(Finite(data.edge.width) && data.edge.width >= 0 && Finite(data.edge.uvRepeat), "invalid edge style");
    // 边框对齐与像素尺寸模式只能使用引擎已支持的值。
    for (const area of ["solid", "edge"] as const) {
        Check(OneOf(data[area].borderAlign, ["inset", "normal", "outset"]) &&
            OneOf(data[area].pixelAligned, ["px", "zoom"]), "invalid border alignment/mode");
    }
    Check(typeof data.points.vertices === "boolean" && typeof data.points.midpoints === "boolean" &&
        [data.points.radius, data.points.segments, data.points.minPointsLength, data.points.minEdgePointsLength].every(Finite),
    "invalid point style");
    Check(OneOf(data.points.pixelAligned, ["px", "zoom"]), "invalid points pixel mode");
    Check(IsObject(data.join) && OneOf(data.join.type, ["miter", "round", "bevel"]) && Finite(data.join.seg), "invalid join style");
    // 每种图形分区的纹理寻址可独立配置。
    for (const area of ["solid", "edge", "points"] as const) {
        const binding = data.textures[area];
        Check(IsObject(binding) && OneOf(binding.addressModeU, ["repeat", "mirror-repeat", "clamp-to-edge"]) &&
            OneOf(binding.addressModeV, ["repeat", "mirror-repeat", "clamp-to-edge"]), "invalid texture addressing");
        Check(binding.texture === null || Number.isSafeInteger(binding.texture), "invalid texture reference");
    }
};

/** @param data 待回显材质 @example ValidateMaterial(data); @returns 无返回值，拒绝未知材质或非法阶段字段。 */
const ValidateMaterial = (data: EditorMaterialData): void => {
    Check(IsObject(data) && OneOf(data.type, ["BaseMaterial", "CompositeMaterial", "WGSLMaterial"]), "unknown material type");
    Check(typeof data.transparent === "boolean" && typeof data.depthTest === "boolean" && typeof data.depthWrite === "boolean" &&
        OneOf(data.cullMode, ["none", "front", "back"]), "invalid material state");
    Check(IsObject(data.shaders), "missing material shader settings");
    // 未记录的字段表示默认阶段，null 表示没有阶段。
    for (const source of Object.values(data.shaders)) {
        Check(source === null || typeof source === "string", "invalid shader source");
    }
    // 两类自定义材质都有具名传值，普通材质没有 raw。
    if (data.type !== "BaseMaterial") {
        Check(IsObject(data.raw) && IsObject(data.raw.values), "missing custom material values");
        // raw 字符串允许省略，省略时由对应材质使用默认白色阶段。
        for (const field of ["solidShader", "edgeShader", "pointShader", "vertexShader", "fragmentShader"] as const) {
            const source = data.raw?.[field];
            Check(source === undefined || typeof source === "string", "invalid raw shader source");
        }
    }
};

/** @param data 一项 Shader 传值 @example ValidateValue(data); @returns 无返回值，验证数值类型和固定维数。 */
const ValidateValue = (data: EditorValueData): void => {
    Check(IsObject(data), "invalid shader value");
    // 标量、资源编号和数组分别验证，不能把普通数组误读成数学对象。
    if (data.kind === "number") {
        Check(Finite(data.value), "invalid scalar value");
    } else if (data.kind === "texture") {
        // 资源编号始终为正整数。
        Check(Number.isSafeInteger(data.value) && data.value > 0, "invalid shader texture ID");
    } else {
        Check(OneOf(data.kind, ["vec2", "mat3", "array"]) && Array.isArray(data.value) && data.value.every(Finite),
            "invalid numeric shader array");
        // 向量必须包含两个分量，矩阵必须包含九个分量。
        if (data.kind === "vec2") {
            Check(data.value.length === 2, "invalid vec2 length");
        } else if (data.kind === "mat3") {
            // 只支持二维编辑器使用的三阶矩阵。
            Check(data.value.length === 9, "invalid mat3 length");
        }
    }
};

export default DocumentResources;
export type { EditorMaterialData, EditorStyleData, EditorTextureData, EditorValueData };
