import type { Base2DOptions } from "../../Geometry/Base2D";
import Base2D from "../../Geometry/Base2D";
import NGon2D from "../../Geometry/NGon2D";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import type { Geometry2d, Material2d } from "../../global-types";
import Group from "../../Group";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Scene from "../../Scene";
import type Style from "../../Style";
import Text, { Font } from "../../Text";
import type { TextureInput } from "../../Texture";
import type { NGonEditRecord } from "../NGonEditTool/data";
import type { TextEditRecord } from "../TextEditTool/data";
import EditorGroup from "./EditorGroup";
import type { EditorMaterialData, EditorStyleData, EditorTextureData } from "./resources";
import DocumentResources from "./resources";

/** 集合场景的文档转换；构建完成后才替换用户节点。 */
class EditorDocumentStore {
    private readonly _owner: DocumentOwner;
    private readonly _resources: DocumentResources = new DocumentResources();
    private _loadedNodes = new Map<number, Group>();

    /** @param owner 提供原样式及辅助节点过滤的编辑器 @example const store = new EditorDocumentStore(owner); @returns 文档转换器。 */
    public constructor(owner: DocumentOwner) {
        this._owner = owner;
    }

    /** @example const mesh = store.loadedNodes.get(savedId); @returns 上一次成功加载的原编号到新节点映射。 */
    public get loadedNodes(): ReadonlyMap<number, Group> {
        return this._loadedNodes;
    }

    /** @param strict 是否拒绝文档不支持的实例对象 @example const nodes = store.nodes(); @returns 用户实体及层级组，排除辅助层与内部容器。 */
    public nodes(strict: boolean = false): Group[] {
        const entries = this.entries(strict);
        const nodes: Group[] = [];
        // 文档与历史使用同一范围，避免加载后撤销遗漏空 Group。
        for (const entry of entries) {
            nodes.push(entry.node);
        }
        return nodes;
    }

    /** @example const document = store.capture(); @returns 不包含临时选择颜色和 GPU 对象的完整 JSON 数据。 */
    public capture(): EditorDocument {
        this._resources.beginCapture();
        const nodes: EditorNodeData[] = [];
        // entries 已经保持父节点在前以及 children 的顺序。
        for (const entry of this.entries(true)) {
            const node = entry.node;
            const transform = CaptureTransform(node, entry.parent, this._owner.scene, this._owner.sourceOrder(node));
            // 参数化图形保存输入，Base 保存原始三角网，不保存动态生成的点型。
            if (node instanceof Mesh) {
                const material = this._owner.sourceMaterial(node);
                // 不能把缺失材质的实体静默写成不可回显的数据。
                if (node.data !== undefined && material !== undefined) {
                    nodes.push({ ...transform, type: "Mesh", geometry: CaptureGeometry(node.data),
                        style: this._resources.captureStyle(this._owner.sourceStyle(node)),
                        material: this._resources.captureMaterial(material), bounding: node.bounding,
                        ignoreZoom: node.ignoreZoom, noSelect: node.noSelect,
                        autoPrecision: node.autoPrecision, precisionMax: node.precisionMax, culling: node.culling });
                } else {
                    throw new TypeError(`Mesh ${String(node.id)} requires geometry and material to save.`);
                }
            } else if (node instanceof EditorGroup) {
                // 虚线范围由 EditorGroup 重建，屏幕网格与旋转图标不进入文档。
                nodes.push({ ...transform, type: "EditorGroup", width: node.width, height: node.height,
                    ignoreZoom: node.ignoreZoom });
            } else {
                nodes.push({ ...transform, type: "Group" });
            }
        }
        const selected: number[] = [];
        // 选择使用文档编号，回显时通过新分配的运行期 ID 映射。
        for (const mesh of this._owner.actives) {
            selected.push(mesh.id);
        }
        const document: EditorDocument = { version: 1, type: "BPLineEditor", nodes,
            textures: this._resources.records, selection: selected,
            activeGroup: this._owner.selectedGroup()?.id ?? null };
        ValidateDocument(document);
        return document;
    }

    /**
     * 解析和构建全部数据，尚不修改当前场景、选择或输入会话。
     * @param data JSON 对象或字符串
     * @param options 外部资源映射
     * @example const prepared = store.prepare(json, options);
     * @returns 可提交到场景的独立节点。
     */
    public prepare(data: EditorDocument | string, options: EditorLoadOptions): PreparedDocument {
        let parsed: unknown = data;
        // 接受 save 的返回值以及其 JSON.stringify 结果。
        if (typeof data === "string") {
            parsed = JSON.parse(data) as unknown;
        }
        const ordered = ValidateDocument(parsed);
        const document = parsed as EditorDocument;
        const textures = this._resources.resolveTextures(document.textures, options.textures);
        const nodes = new Map<number, Group>();
        const records = [...document.nodes].sort(CompareNodeIds);
        // 按原运行期编号创建，保留 order 相同时的原始绘制先后关系。
        for (const record of records) {
            let node: Group;
            // 原类型回显，Rect/NGon/Text 不应因序列化统一变成 Base。
            if (record.type === "Mesh") {
                const style = this._resources.createStyle(record.style, textures);
                const material = this._resources.createMaterial(record.material, style, textures);
                node = new Mesh(CreateGeometry(record.geometry, style), material, style);
                const mesh = node as Mesh;
                mesh.style = style;
                mesh.bounding = record.bounding;
                mesh.ignoreZoom = record.ignoreZoom;
                mesh.noSelect = record.noSelect;
                mesh.autoPrecision = record.autoPrecision ?? this._owner.autoPrecision;
                mesh.precisionMax = record.precisionMax ?? 100;
                mesh.culling = record.culling ?? true;
            } else if (record.type === "EditorGroup") {
                // 尺寸已通过预校验，空组也保留独立范围。
                const group = new EditorGroup(0, 0, record.width ?? 0, record.height ?? 0);
                group.ignoreZoom = record.ignoreZoom ?? false;
                node = group;
            } else {
                node = new Group(0, 0);
            }
            ApplyTransform(node, record);
            nodes.set(record.id, node);
        }
        return { document, ordered, nodes };
    }

    /**
     * 提交已经验证的文档；辅助层保持在原场景中。
     * @param prepared 预构建的节点和拓扑
     * @example const meshes = store.apply(prepared);
     * @returns 文档中所有新建 Mesh，包含嵌套成员。
     */
    public apply(prepared: PreparedDocument): Mesh[] {
        const previous = this.nodes(true);
        // 先把旧文档节点逐一摘除；不 dispose，历史仍可恢复这些对象身份。
        for (const node of previous) {
            node.removeSelf();
        }
        const meshes: Mesh[] = [];
        // 预校验已经排序，确保父节点加入场景后才挂接子节点。
        for (const record of prepared.ordered) {
            const node = prepared.nodes.get(record.id);
            let parent: Group = this._owner.scene;
            // null 表示场景根节点，其余只引用本次文档里的节点。
            if (record.parentId !== null) {
                parent = prepared.nodes.get(record.parentId) ?? this._owner.scene;
            }
            // 映射由 prepare 一次建立，验证后的记录必有节点。
            if (node !== undefined) {
                parent.add(node);
                // 返回 Mesh 列表与各独立编辑器的 load 接口一致。
                if (node instanceof Mesh) {
                    meshes.push(node);
                }
            }
        }
        this._loadedNodes = prepared.nodes;
        return meshes;
    }

    /** @param strict 是否拒绝不支持的实例对象 @example const entries = this.entries(true); @returns 带最近文档父级的场景节点。 */
    private entries(strict: boolean): DocumentEntry[] {
        const filters = this._owner.documentFilters();
        const entries: DocumentEntry[] = [];
        const pending: DocumentEntry[] = [];
        // 显式栈保留 children 顺序，也避免深层嵌套使递归栈溢出。
        for (const child of [...this._owner.scene.children].reverse()) {
            // 当前 renderer 的标准节点都继承 Group，未知自定义节点不能静默丢失。
            if (child instanceof Group) {
                pending.push({ node: child, parent: null });
            } else {
                throw new TypeError("Editor documents require Group/Mesh scene nodes.");
            }
        }
        // 辅助组的整个子树跳过；内部实体容器只跳过自身。
        while (pending.length > 0) {
            const entry = pending.pop();
            // 空栈不会进入循环，仍显式处理类型检查后的可用条目。
            if (entry !== undefined && filters.excluded.has(entry.node) === false) {
                const node = entry.node;
                let parent = entry.parent;
                // 实例记录的编辑与持久化尚不属于集合编辑器的普通实体接口。
                if (node instanceof IMesh && strict) {
                    throw new TypeError("Editor documents do not support IMesh records.");
                }
                // 编辑器内部 Group 不构成用户文档层级。
                if (filters.containers.has(node) === false && node instanceof IMesh === false) {
                    entries.push(entry);
                    parent = node;
                }
                // 倒序入栈，使遍历顺序与实际 children 完全一致。
                for (const child of [...node.children].reverse()) {
                    // EditorGroup 的虚线 frame 可按尺寸重新创建。
                    if (node instanceof EditorGroup && child === node.frame) {
                        // 这个辅助 Mesh 没有用户数据，不继续处理其子树。
                    } else if (child instanceof Group) {
                        // 子实体可以嵌套在任意普通 Group/Mesh 下。
                        pending.push({ node: child, parent });
                    } else {
                        throw new TypeError("Editor documents require Group/Mesh child nodes.");
                    }
                }
            }
        }
        return entries;
    }
}

/** 所有保存节点均使用局部矩阵，parentId 指向同一文档中的节点。 */
interface EditorNodeTransform {
    id: number;
    parentId: number | null;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    matrix: MatrixValues;
    order: number;
}

type EditorGeometryData = { precision?: number } & ({ type: "Rect2D"; width: number; height: number; radius: number } |
    ({ type: "NGon2D" } & Pick<NGonEditRecord, "outer" | "inner" | "sides" | "uvMode" | "startAngle">) |
    { type: "Poly2D"; points: number[]; closed: boolean } |
    ({ type: "Text" } & Pick<TextEditRecord, "text" | "fontFamily" | "fontSize" | "lineSpacing" |
        "letterSpacing" | "textAlign" | "baseline" | "writingMode">) |
    ({ type: "Base2D"; contours: number[][]; linePoints?: EditorPartData } & EditorVertexData));

interface EditorMeshData extends EditorNodeTransform {
    type: "Mesh";
    geometry: EditorGeometryData;
    style: EditorStyleData;
    material: EditorMaterialData;
    bounding: boolean;
    ignoreZoom: boolean;
    noSelect: boolean;
    autoPrecision?: boolean;
    precisionMax?: number;
    culling?: boolean;
}

interface EditorGroupData extends EditorNodeTransform {
    type: "Group" | "EditorGroup";
    width?: number;
    height?: number;
    ignoreZoom?: boolean;
}

type EditorNodeData = EditorMeshData | EditorGroupData;

/** 可 JSON.stringify 的完整集合文档；字体名称由 Font 注册表解析。 */
interface EditorDocument {
    version: 1;
    type: "BPLineEditor";
    nodes: EditorNodeData[];
    textures: EditorTextureData[];
    selection: number[];
    activeGroup: number | null;
}

/** 跨会话加载无 URL 纹理时，按保存编号提供 DOM/视频等外部资源。 */
interface EditorLoadOptions {
    textures?: ReadonlyMap<number, TextureInput>;
}

interface DocumentOwner {
    scene: Scene;
    actives: Mesh[];
    /** 旧文档未记录自动精度时采用编辑器模板。 */
    readonly autoPrecision: boolean;
    /** @param mesh 用户实体 @example owner.sourceStyle(mesh); @returns 原始样式。 */
    sourceStyle(mesh: Mesh): Style;
    /** @param node 用户节点 @example owner.sourceOrder(mesh); @returns 不包含临时选中提升的原始层级。 */
    sourceOrder(node: Group): number;
    /** @param mesh 用户实体 @example owner.sourceMaterial(mesh); @returns 原始材质。 */
    sourceMaterial(mesh: Mesh): Material2d | undefined;
    /** @example owner.selectedGroup(); @returns 当前层级组选择。 */
    selectedGroup(): EditorGroup | null;
    /** @example owner.documentFilters(); @returns 内部容器和必须忽略的辅助子树。 */
    documentFilters(): { containers: ReadonlySet<Group>; excluded: ReadonlySet<Group> };
}

interface DocumentEntry { node: Group; parent: Group | null }

interface PreparedDocument { document: EditorDocument; ordered: EditorNodeData[]; nodes: Map<number, Group> }

type MatrixValues = [number, number, number, number, number, number, number, number, number];

interface EditorVertexData {
    vertices: number[];
    normal?: number[];
    uv?: number[];
    index?: number[];
    indexType?: 16 | 32;
    vertexType?: number[];
    position?: number[];
    miterScale?: number[];
}

interface EditorPartData extends EditorVertexData { index: number[]; normal: number[]; uv: number[] }

/** @param node 用户节点 @param parent 最近文档父节点 @param scene 原场景 @param order 去掉选中提升的原始层级 @example CaptureTransform(mesh, parent, scene, order); @returns 除去内部容器后的局部变换。 */
const CaptureTransform = (node: Group, parent: Group | null, scene: Scene, order: number): EditorNodeTransform => {
    const original = node.ensureMatrix().data;
    let matrix = [...original];
    const target = parent ?? scene;
    let ancestor = node.parent;
    // 直接乘过被忽略的内部容器，不求逆，所以零倍率父组也能保存。
    while (ancestor !== null && ancestor !== target) {
        matrix = Multiply(ancestor.ensureMatrix().data, matrix);
        ancestor = ancestor.parent;
    }
    /** @param value 一个矩阵分量 @param index 分量位置 @example IsOriginal(value, index); @returns 是否与原局部矩阵一致。 */
    const IsOriginal = (value: number, index: number): boolean => value === original[index];
    const unchanged = matrix.every(IsOriginal);
    let x = node.position.x;
    let y = node.position.y;
    let rotation = node.rotation;
    let scaleX = node.scale.x;
    let scaleY = node.scale.y;
    // 非单位内部容器需要同步 TRS 元数据；原始仿射矩阵始终作为最终变换。
    if (unchanged === false) {
        x = matrix[6];
        y = matrix[7];
        rotation = Math.atan2(matrix[1], matrix[0]);
        scaleX = Math.hypot(matrix[0], matrix[1]);
        // 退化第一轴时沿第二轴读取长度，不写 Infinity。
        if (scaleX > 0) {
            scaleY = (matrix[0] * matrix[4] - matrix[1] * matrix[3]) / scaleX;
        } else {
            scaleY = Math.hypot(matrix[3], matrix[4]);
        }
    }
    return { id: node.id, parentId: parent?.id ?? null, position: { x, y },
        rotation, scale: { x: scaleX, y: scaleY }, matrix: matrix as MatrixValues, order };
};

/** @param node 新节点 @param record 变换记录 @example ApplyTransform(mesh, record); @returns 无返回值。 */
const ApplyTransform = (node: Group, record: EditorNodeTransform): void => {
    node.position.set(record.position.x, record.position.y);
    node.rotation = record.rotation;
    node.scale.set(record.scale.x, record.scale.y);
    node.matrix.set(record.matrix);
    node.order = record.order;
};

/** @param left 左矩阵 @param right 右矩阵 @example Multiply(parent, local); @returns 列主序三阶乘积。 */
const Multiply = (left: ArrayLike<number>, right: ArrayLike<number>): number[] => {
    const output = new Array<number>(9);
    // 仿射链使用双精度 CPU 数值，GPU 打包留给 Render。
    for (let column = 0; column < 3; column++) {
        // 列主序中每个输出列分别乘过父级矩阵。
        for (let row = 0; row < 3; row++) {
            output[column * 3 + row] = left[row] * right[column * 3] +
                left[3 + row] * right[column * 3 + 1] + left[6 + row] * right[column * 3 + 2];
        }
    }
    return output;
};

/** @param first 第一条节点 @param second 第二条节点 @example CompareNodeIds(a, b); @returns 原运行期编号顺序。 */
const CompareNodeIds = (first: EditorNodeData, second: EditorNodeData): number => first.id - second.id;

/** @param geometry 来源几何 @example CaptureGeometry(mesh.data); @returns 原始参数或三角网的纯数据。 */
const CaptureGeometryContent = (geometry: Geometry2d): EditorGeometryData => {
    // 各参数化类型独立保存，避免以三角缓存取代可编辑参数。
    if (geometry instanceof Rect2D) {
        return { type: "Rect2D", width: geometry.width, height: geometry.height, radius: geometry.radius };
    } else if (geometry instanceof NGon2D) {
        // 内圈、角度和两种 UV 模式都属于几何输入。
        return { type: "NGon2D", outer: geometry.outer, inner: geometry.inner, sides: geometry.sides,
            uvMode: geometry.uvMode, startAngle: geometry.startAngle };
    } else if (geometry instanceof Poly2D) {
        // 开放折线仍保留原节点顺序。
        return { type: "Poly2D", points: Array.from(geometry.points), closed: geometry.closed };
    } else if (geometry instanceof Text) {
        // 字形三角化由字体注册表重建，只保存原文和排版。
        return { type: "Text", text: geometry.text, fontFamily: geometry.fontFamily, fontSize: geometry.fontSize,
            lineSpacing: geometry.lineSpacing, letterSpacing: geometry.letterSpacing, textAlign: geometry.textAlign,
            baseline: geometry.baseline, writingMode: geometry.writingMode };
    } else if (geometry instanceof Base2D) {
        // 使用原始输入，避免把选中的黄色边框和关键点烘焙进文档。
        const input = geometry.getData();
        const record: EditorGeometryData = { type: "Base2D", ...CaptureVertices(input),
            contours: (input.contours ?? []).map(CaptureContour) };
        // 原生线框也属于 Base 输入，需要随拓扑一起回显。
        if (input.linePoints !== undefined) {
            const line = input.linePoints;
            record.linePoints = { ...CaptureVertices({ ...line, vertices: line.geometry }),
                index: Array.from(line.index), normal: Array.from(line.normal), uv: Array.from(line.uv) };
        }
        return record;
    } else {
        throw new TypeError(`Unsupported editor geometry: ${geometry.type}.`);
    }
};

/** @param geometry 实体几何 @example CaptureGeometry(geometry); @returns 含基准精度的 JSON，忽略自动调整的显示精度。 */
const CaptureGeometry = (geometry: Geometry2d): EditorGeometryData => {
    return { ...CaptureGeometryContent(geometry), precision: geometry.originPrecision };
};

/** @param data 几何记录 @param style 原始样式 @example CreateGeometry(data, style); @returns 使用保存精度创建的几何。 */
const CreateGeometry = (data: EditorGeometryData, style: Style): Geometry2d => {
    const geometry = BuildGeometry(data, style);
    // 旧文档没有精度字段时保留各形状的原默认值。
    if (data.precision !== undefined) {
        geometry.precision = data.precision;
    }
    return geometry;
};

/** @param contour 原始轮廓 @example CaptureContour(contour); @returns JSON 坐标数组。 */
const CaptureContour = (contour: Float32Array): number[] => Array.from(contour);

/** @param input Base 原始属性 @example CaptureVertices(input); @returns 独立的 JSON 数值数组。 */
const CaptureVertices = (input: Base2DOptions): EditorVertexData => {
    const data: EditorVertexData = { vertices: Array.from(input.vertices) };
    // 只保存调用方提供的属性，不填入随样式变化的生成缓存。
    for (const field of VertexFields) {
        const values = input[field];
        // 缺省属性在 Base2D 构造时按现有规则补齐。
        if (values !== undefined) {
            data[field] = Array.from(values);
        }
    }
    // 索引类型保留，避免 16 位索引被错误解释成其他数据。
    if (input.index !== undefined) {
        data.index = Array.from(input.index);
        // 大模型的 Uint32 编号不能压缩到 Uint16。
        if (input.index instanceof Uint32Array) {
            data.indexType = 32;
        } else {
            data.indexType = 16;
        }
    }
    return data;
};

const VertexFields = ["normal", "uv", "vertexType", "position", "miterScale"] as const;

/** @param data 几何 JSON @param style 原始样式 @example CreateGeometry(data, style); @returns 可编辑几何，字体需先注册。 */
const BuildGeometry = (data: EditorGeometryData, style: Style): Geometry2d => {
    // 使用对应构造函数恢复参数，不读取保存时的 GPU 缓存。
    if (data.type === "Rect2D") {
        return new Rect2D({ width: data.width, height: data.height, radius: data.radius, style });
    } else if (data.type === "NGon2D") {
        // 两圈及填充 UV 模式必须一起恢复。
        return new NGon2D({ outer: data.outer, inner: data.inner, sides: data.sides,
            startAngle: data.startAngle, uvMode: data.uvMode, style });
    } else if (data.type === "Poly2D") {
        // 沿用原始 closed，开放路径不自动补首尾线。
        return new Poly2D(new Float32Array(data.points), style, { closed: data.closed });
    } else if (data.type === "Text") {
        // 字体加载由应用统一管理，失败要在替换旧场景前抛出。
        if (Font.map.has(data.fontFamily)) {
            return new Text(data.text, data.fontSize, data.fontFamily, { letterSpacing: data.letterSpacing,
                lineSpacing: data.lineSpacing, textAlign: data.textAlign, baseline: data.baseline,
                writingMode: data.writingMode });
        } else {
            throw new TypeError(`Register font ${data.fontFamily} before loading the editor document.`);
        }
    } else {
        const input = RestoreVertices(data);
        input.style = style;
        input.contours = data.contours.map(RestoreContour);
        // 原生线段数据不混入实体三角索引。
        if (data.linePoints !== undefined) {
            const line = RestoreVertices(data.linePoints);
            input.linePoints = { geometry: line.vertices, normal: line.normal ?? new Float32Array(),
                uv: line.uv ?? new Float32Array(), index: line.index ?? new Uint32Array(),
                position: line.position, vertexType: line.vertexType, miterScale: line.miterScale };
        }
        return new Base2D(input);
    }
};

/** @param coordinates JSON 轮廓 @example RestoreContour(points); @returns 独立的原始坐标。 */
const RestoreContour = (coordinates: number[]): Float32Array => new Float32Array(coordinates);

/** @param data Base 属性 JSON @example RestoreVertices(data); @returns 用于构造 Base2D 的独立数组。 */
const RestoreVertices = (data: EditorVertexData): Base2DOptions => {
    const input: Base2DOptions = { vertices: new Float32Array(data.vertices) };
    // 数值属性全部重建，不共用传入文档的数组。
    for (const field of VertexFields) {
        const values = data[field];
        // 缺省属性继续由 Base 生成。
        if (values !== undefined) {
            input[field] = new Float32Array(values);
        }
    }
    // 显式索引保留类型与编号。
    if (data.index !== undefined) {
        // 16 位类型已通过范围校验，禁止转换时截断大编号。
        if (data.indexType === 16) {
            input.index = new Uint16Array(data.index);
        } else {
            input.index = new Uint32Array(data.index);
        }
    }
    return input;
};

/** @param value 待解析的对象 @example IsRecord(value); @returns 是否为普通记录对象。 */
const IsRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && Array.isArray(value) === false;

/** @param value 待验证值 @param allowed 可用字面值 @example IsOneOf(value, ["Group"]); @returns 是否属于支持的枚举。 */
const IsOneOf = (value: unknown, allowed: readonly unknown[]): boolean => allowed.includes(value);

/** @param value 待验证数组 @param length 必須长度 @example IsNumericArray(matrix, 9); @returns 是否为指定长度的有限数值数组。 */
const IsNumericArray = (value: unknown, length: number): boolean =>
    Array.isArray(value) && value.length === length && value.every(IsFiniteNumber);

/** @param condition 必须成立的文档条件 @param message 错误说明 @example Require(valid, "Invalid node"); @returns 无返回值，失败抛出 TypeError。 */
const Require = (condition: boolean, message: string): void => {
    // 加载期间的错误必须发生在摘除旧节点之前。
    if (condition === false) {
        throw new TypeError(`Invalid editor document: ${message}.`);
    }
};

/** @param value 待验证 JSON @example ValidateDocument(json); @returns 父节点在前的记录序列。 */
const ValidateDocument = (value: unknown): EditorNodeData[] => {
    Require(IsRecord(value), "expected an object");
    const document = value as EditorDocument;
    Require(IsOneOf(document.version, [1]) && IsOneOf(document.type, ["BPLineEditor"]), "unsupported format/version");
    Require(Array.isArray(document.nodes) && Array.isArray(document.textures) && Array.isArray(document.selection), "missing node/resource/selection arrays");
    ValidateFiniteNumbers(document);
    const byId = new Map<number, EditorNodeData>();
    const children = new Map<number, EditorNodeData[]>();
    const queue: EditorNodeData[] = [];
    // 编号和变换先验证，建立拓扑时不修改场景。
    for (const node of document.nodes) {
        Require(IsRecord(node) && Number.isSafeInteger(node.id) && node.id > 0 && byId.has(node.id) === false, "duplicate or invalid node ID");
        Require(IsRecord(node.position) && IsRecord(node.scale) && IsNumericArray(node.matrix, 9), "invalid transform");
        Require([node.position.x, node.position.y, node.scale.x, node.scale.y, node.rotation, node.order].every(IsFiniteNumber), "non-numeric transform");
        Require(node.matrix.every(IsFiniteNumber) && node.matrix[2] === 0 && node.matrix[5] === 0 && node.matrix[8] === 1, "expected affine mat3");
        Require(node.parentId === null || Number.isSafeInteger(node.parentId), "invalid parent ID");
        // 类型决定哪些构造字段必须存在。
        if (node.type === "Mesh") {
            Require(IsRecord(node.style) && IsRecord(node.material) && IsRecord(node.geometry), "missing Mesh data");
            Require(typeof node.bounding === "boolean" && typeof node.ignoreZoom === "boolean" && typeof node.noSelect === "boolean", "invalid Mesh switches");
            Require(node.autoPrecision === undefined || typeof node.autoPrecision === "boolean", "invalid autoPrecision switch");
            Require(node.precisionMax === undefined || (typeof node.precisionMax === "number" &&
                Number.isInteger(node.precisionMax) && node.precisionMax >= 3 && node.precisionMax <= 4095), "invalid precisionMax");
            Require(node.culling === undefined || typeof node.culling === "boolean", "invalid culling switch");
            ValidateGeometry(node.geometry);
        } else if (node.type === "EditorGroup") {
            // 空组必须保留可交互的非零范围。
            Require(IsFiniteNumber(node.width) && IsFiniteNumber(node.height) && (node.width ?? 0) > 0 && (node.height ?? 0) > 0,
                "invalid EditorGroup size");
            Require(typeof node.ignoreZoom === "boolean", "invalid EditorGroup zoom switch");
        } else {
            Require(IsOneOf(node.type, ["Group"]), "unknown node type");
        }
        byId.set(node.id, node);
    }
    // 子节点允许放在数组中的任意位置，parentId 始终只在本文档内解析。
    for (const node of document.nodes) {
        // 根节点进入队列，其他按父编号建立邻接表。
        if (node.parentId === null) {
            queue.push(node);
        } else {
            Require(byId.has(node.parentId) && node.parentId !== node.id, "missing or self parent");
            const siblings = children.get(node.parentId) ?? [];
            siblings.push(node);
            children.set(node.parentId, siblings);
        }
    }
    const ordered: EditorNodeData[] = [];
    // 拓扑遍历同时验证循环，不使用不受控的递归。
    for (const node of queue) {
        ordered.push(node);
        queue.push(...children.get(node.id) ?? []);
    }
    Require(ordered.length === document.nodes.length, "cyclic hierarchy");
    Require(document.selection.every(IsValidID), "invalid selection IDs");
    // 选择只能引用可编辑实体，空组选择单独记录。
    for (const id of document.selection) {
        Require(byId.get(id)?.type === "Mesh", "selection references a missing Mesh");
    }
    Require(document.activeGroup === null || byId.get(document.activeGroup)?.type === "EditorGroup", "invalid active Group");
    const textureIds = new Set<number>();
    // 外部资源编号不可重复，URL 类型必须明确。
    for (const texture of document.textures) {
        Require(IsRecord(texture) && IsValidID(texture.id) && textureIds.has(texture.id) === false &&
            (texture.url === null || typeof texture.url === "string"), "invalid texture record");
        textureIds.add(texture.id);
    }
    return ordered;
};

/** @param value 任意标量 @example IsFiniteNumber(value); @returns 是否为有限数字。 */
const IsFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** @param id 任意编号 @example IsValidID(id); @returns 是否为有效正整数编号。 */
const IsValidID = (id: unknown): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0;

/** @param value JSON 数据 @example ValidateFiniteNumbers(document); @returns 无返回值，拒绝 JSON 会丢失的非有限数字。 */
const ValidateFiniteNumbers = (value: unknown): void => {
    const pending: { value: unknown; exit: boolean }[] = [{ value, exit: false }];
    const active = new Set<object>();
    // 显式栈也处理对象输入中的引用环，保证最终可 JSON.stringify。
    while (pending.length > 0) {
        const frame = pending.pop();
        const item = frame?.value;
        // 订阅器、函数和其他运行期值不能进入纯数据文档。
        if (frame?.exit === true && typeof item === "object" && item !== null) {
            active.delete(item);
        } else if (typeof item === "number") {
            // JSON.stringify 会把 Infinity/NaN 转成 null，不能接受这种损失。
            Require(Number.isFinite(item), "non-finite number");
        } else if (typeof item === "object" && item !== null) {
            // 仅当前祖先链中的重复对象属于循环，共享的无环样式对象仍允许。
            Require(active.has(item) === false, "cyclic JSON object");
            const prototype: unknown = Object.getPrototypeOf(item);
            Require(Array.isArray(item) || prototype === Object.prototype || prototype === null, "non-JSON object");
            active.add(item);
            pending.push({ value: item, exit: true });
            // 数组和普通记录中的每个元素都检查，避免隐藏非有限数字。
            for (const child of Object.values(item as Record<string, unknown>)) {
                pending.push({ value: child, exit: false });
            }
        } else {
            Require(item === null || typeof item === "string" || typeof item === "boolean" || item === undefined,
                "non-JSON value");
        }
    }
};

/** @param data 几何记录 @example ValidateGeometry(data); @returns 无返回值，验证构造输入。 */
const ValidateGeometry = (data: EditorGeometryData): void => {
    // 可选精度保持旧文档可读，明确拒绝无效细分值。
    if (data.precision !== undefined) {
        Require(typeof data.precision === "number" && Number.isInteger(data.precision) &&
            data.precision >= 1 && data.precision <= 4095, "invalid geometry precision");
    }
    // 参数化类型的尺寸范围不允许在构造时悄悄被改成另一种数据。
    if (data.type === "Rect2D") {
        Require([data.width, data.height, data.radius].every(IsFiniteNumber) &&
            data.width >= 0 && data.height >= 0 && data.radius >= 0, "invalid rectangle");
    } else if (data.type === "NGon2D") {
        // 内圈不得超出外圈，边数至少形成原生线段。
        Require([data.outer, data.inner, data.sides, data.startAngle].every(IsFiniteNumber) &&
            data.outer >= 0 && data.inner >= 0 && data.inner <= data.outer && Number.isInteger(data.sides) && data.sides >= 2,
        "invalid NGon");
        Require(IsOneOf(data.uvMode, ["bounding", "polar"]), "invalid NGon UV mode");
    } else if (data.type === "Poly2D") {
        // 开放路径可以只保留一条边，空路径也能回显。
        ValidateCoordinates(data.points);
        Require(typeof data.closed === "boolean", "invalid polygon closed flag");
    } else if (data.type === "Text") {
        // 注册名和原文保持字符串，不把字体对象嵌进 JSON。
        Require(typeof data.text === "string" && typeof data.fontFamily === "string" &&
            [data.fontSize, data.letterSpacing, data.lineSpacing].every(IsFiniteNumber) && data.fontSize > 0,
        "invalid text parameters");
        Require(["left", "center", "right"].includes(data.textAlign), "invalid text alignment");
        Require(IsOneOf(data.baseline, ["top", "middle", "bottom"]), "invalid text baseline");
        Require(IsOneOf(data.writingMode, ["horizontal-tb", "vertical-rl"]), "invalid text writing mode");
    } else {
        Require(IsOneOf(data.type, ["Base2D"]), "unknown geometry type");
        ValidateVertices(data);
        Require(Array.isArray(data.contours), "missing Base contours");
        // 每条轮廓独立验证，保留孔和外圈的原顺序。
        for (const contour of data.contours) {
            ValidateCoordinates(contour);
        }
        // 原生线段使用同一属性协议。
        if (data.linePoints !== undefined) {
            ValidateVertices(data.linePoints);
        }
    }
};

/** @param values 二维坐标 @example ValidateCoordinates(points); @returns 无返回值，验证成对有限坐标。 */
const ValidateCoordinates = (values: number[]): void => {
    Require(Array.isArray(values) && values.length % 2 === 0 && values.every(IsFiniteNumber), "invalid coordinate array");
};

/** @param data Base 属性 @example ValidateVertices(data); @returns 无返回值，验证长度及索引范围。 */
const ValidateVertices = (data: EditorVertexData): void => {
    ValidateCoordinates(data.vertices);
    const count = data.vertices.length / 2;
    // 原始属性必须与顶点一一对应，防止恢复后索引越界。
    for (const field of VertexFields) {
        const values = data[field];
        // 缺省属性由构造器补齐，显式属性不能截断。
        if (values !== undefined) {
            let expected = data.vertices.length;
            // 顶点类别和 miter 比例每个顶点各有一个值。
            if (field === "vertexType" || field === "miterScale") {
                expected = count;
            }
            Require(Array.isArray(values) && values.length === expected && values.every(IsFiniteNumber), `invalid ${field} array`);
        }
    }
    // 索引必须指向当前顶点且适合所声明的整数宽度。
    if (data.index !== undefined) {
        Require(Array.isArray(data.index), "invalid index array");
        // 16 位和 32 位都允许，但不允许其他数字类型。
        Require(data.indexType === 16 || data.indexType === 32, "invalid index type");
        // 不在转换 TypedArray 时截断无效编号。
        for (const index of data.index) {
            Require(Number.isInteger(index) && index >= 0 && index < count &&
                (data.indexType !== 16 || index <= 65535), "index out of range");
        }
    }
};

export default EditorDocumentStore;
export type { EditorDocument, EditorGeometryData, EditorLoadOptions, EditorNodeData, PreparedDocument };
