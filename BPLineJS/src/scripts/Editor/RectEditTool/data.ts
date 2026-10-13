import Rect2D from "../../Geometry/Rect2D";
import BaseMaterial from "../../Material/baseMaterial";
import Mesh from "../../Mesh";
import Style from "../../Style";

/** 可直接传给前端状态管理器的颜色、启用状态和不透明度。 */
interface RectEditPartData {
    enabled: boolean;
    color: string;
    opacity: number;
}

/** 矩形编辑器支持的可序列化显示参数。 */
interface RectEditStyleData {
    solid: RectEditPartData & { borderColor: string; borderWidth: number; borderAlign: "inset" | "normal" | "outset"; pixelAligned: "px" | "zoom" };
    wireframe: RectEditPartData;
    edge: RectEditPartData & { width: number; borderAlign: "inset" | "normal" | "outset"; pixelAligned: "px" | "zoom"; uvRepeat: number };
    points: RectEditPartData & { vertices: boolean; midpoints: boolean; radius: number; segments: number; pixelAligned: "px" | "zoom"; minPointsLength: number; minEdgePointsLength: number };
    join: { type: "miter" | "round" | "bevel"; seg: number };
}

/** 单个矩形的纯数据快照，matrix 保存组变换后的局部仿射结果。 */
interface RectEditRecord {
    id: number;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    matrix: [number, number, number, number, number, number, number, number, number];
    width: number;
    height: number;
    radius: number;
    order: number;
    bounding: boolean;
    /** 用户基准精度，临时自动细分不写入文档。 */
    precision?: number;
    autoPrecision?: boolean;
    precisionMax?: number;
    culling?: boolean;
    /** 是否抵消相机 zoom；省略时按普通世界尺寸回显。 */
    ignoreZoom?: boolean;
    style: RectEditStyleData;
    material: { transparent: boolean; depthTest: boolean; depthWrite: boolean; cullMode: GPUCullMode };
}

/** `save()` 生成的版本化矩形编辑数据。 */
interface RectEditDocument {
    version: 1;
    meshes: RectEditRecord[];
}

/**
 * 抽取样式的可序列化参数；纹理资源仍由应用单独管理。
 * @param style 来源样式
 * @example
 * const data = CaptureRectStyle(mesh.style);
 * @returns 没有 getter、订阅器或 GPU 对象的纯数据。
 */
const CaptureRectStyle = (style: Style): RectEditStyleData => {
    return {
        solid: {
            enabled: style.solid.enabled,
            color: style.solid.color.toHex(true),
            opacity: style.solid.opacity,
            borderColor: style.solid.borderColor.toHex(true),
            borderWidth: style.solid.borderWidth,
            borderAlign: style.solid.borderAlign,
            pixelAligned: style.solid.pixelAligned,
        },
        wireframe: {
            enabled: style.wireframe.enabled,
            color: style.wireframe.color.toHex(true),
            opacity: style.wireframe.opacity,
        },
        edge: {
            enabled: style.edge.enabled,
            color: style.edge.color.toHex(true),
            opacity: style.edge.opacity,
            width: style.edge.width,
            borderAlign: style.edge.borderAlign,
            pixelAligned: style.edge.pixelAligned,
            uvRepeat: style.edge.uvRepeat,
        },
        points: {
            enabled: style.points.enabled,
            color: style.points.color.toHex(true),
            opacity: style.points.opacity,
            vertices: style.points.vertices,
            midpoints: style.points.midpoints,
            radius: style.points.radius,
            segments: style.points.segments,
            pixelAligned: style.points.pixelAligned,
            minPointsLength: style.points.minPointsLength,
            minEdgePointsLength: style.points.minEdgePointsLength,
        },
        join: { type: style.join.type, seg: style.join.seg },
    };
};

/**
 * 将纯数据写回独立样式，不更换 Color 对象引用。
 * @param style 要更新的样式
 * @param data 可序列化样式记录
 * @example
 * ApplyRectStyle(style, record.style);
 * @returns 无返回值。
 */
const ApplyRectStyle = (style: Style, data: RectEditStyleData): void => {
    style.solid.enabled = data.solid.enabled;
    style.solid.color.setHex(data.solid.color);
    style.solid.opacity = data.solid.opacity;
    style.solid.borderColor.setHex(data.solid.borderColor);
    style.solid.borderWidth = data.solid.borderWidth;
    style.solid.borderAlign = data.solid.borderAlign;
    style.solid.pixelAligned = data.solid.pixelAligned;
    style.wireframe.enabled = data.wireframe.enabled;
    style.wireframe.color.setHex(data.wireframe.color);
    style.wireframe.opacity = data.wireframe.opacity;
    style.edge.enabled = data.edge.enabled;
    style.edge.color.setHex(data.edge.color);
    style.edge.opacity = data.edge.opacity;
    style.edge.width = data.edge.width;
    style.edge.borderAlign = data.edge.borderAlign;
    style.edge.pixelAligned = data.edge.pixelAligned;
    style.edge.uvRepeat = data.edge.uvRepeat;
    style.points.enabled = data.points.enabled;
    style.points.color.setHex(data.points.color);
    style.points.opacity = data.points.opacity;
    style.points.vertices = data.points.vertices;
    style.points.midpoints = data.points.midpoints;
    style.points.radius = data.points.radius;
    style.points.segments = data.points.segments;
    style.points.pixelAligned = data.points.pixelAligned;
    style.points.minPointsLength = data.points.minPointsLength;
    style.points.minEdgePointsLength = data.points.minEdgePointsLength;
    style.join.type = data.join.type;
    style.join.seg = data.join.seg;
};

/**
 * 把 Mesh 的编辑信息读成纯对象，选中边框使用保存的原始 Style。
 * @param mesh 来源矩形
 * @param originalStyle 选中时保存的用户样式，可省略
 * @example
 * const record = CaptureRect(mesh, originalStyle);
 * @returns 当前矩形数据。
 */
const CaptureRect = (mesh: Mesh, originalStyle?: Style): RectEditRecord => {
    const geometry = mesh.data;
    const material = mesh.material;
    // 编辑器只管理有绘制材质的普通矩形。
    if (geometry instanceof Rect2D && material !== undefined) {
        const style = originalStyle ?? mesh.style ?? geometry.style;
        return {
            id: mesh.id,
            position: { x: mesh.position.x, y: mesh.position.y },
            rotation: mesh.rotation,
            scale: { x: mesh.scale.x, y: mesh.scale.y },
            matrix: Array.from(mesh.ensureMatrix().data) as RectEditRecord["matrix"],
            width: geometry.width,
            height: geometry.height,
            radius: geometry.radius,
            order: mesh.order,
            bounding: mesh.bounding,
            precision: geometry.originPrecision,
            autoPrecision: mesh.autoPrecision,
            precisionMax: mesh.precisionMax,
            culling: mesh.culling,
            ignoreZoom: mesh.ignoreZoom,
            style: CaptureRectStyle(style),
            material: {
                transparent: material.transparent,
                depthTest: material.depthTest,
                depthWrite: material.depthWrite,
                cullMode: material.cullMode,
            },
        };
    } else {
        throw new TypeError("RectEditTool can only capture a Rect2D Mesh with material.");
    }
};

/**
 * 用记录恢复已存在的矩形，不改变它的 ID 与场景父级。
 * @param mesh 目标 Mesh
 * @param record 来源记录
 * @example
 * ApplyRect(mesh, record);
 * @returns 无返回值。
 */
const ApplyRect = (mesh: Mesh, record: RectEditRecord): void => {
    const geometry = mesh.data;
    const material = mesh.material;
    // 回放对象保留原材质类型和用户资源，仅恢复可序列化外观。
    if (geometry instanceof Rect2D && material !== undefined) {
        let style = mesh.style;
        // 无 Mesh 级样式时为该对象建立独立样式，避免修改别的对象。
        if (style === undefined) {
            style = geometry.style.clone();
            mesh.style = style;
        }
        ApplyRectStyle(style, record.style);
        geometry.width = record.width;
        geometry.height = record.height;
        geometry.radius = record.radius;
        material.transparent = record.material.transparent;
        material.depthTest = record.material.depthTest;
        material.depthWrite = record.material.depthWrite;
        material.cullMode = record.material.cullMode;
        mesh.position.set(record.position.x, record.position.y);
        mesh.rotation = record.rotation;
        mesh.scale.set(record.scale.x, record.scale.y);
        mesh.matrix.set(record.matrix);
        mesh.order = record.order;
        mesh.bounding = record.bounding;
        mesh.ignoreZoom = record.ignoreZoom ?? false;
        mesh.autoPrecision = record.autoPrecision ?? false;
        mesh.precisionMax = record.precisionMax ?? 100;
        mesh.culling = record.culling ?? true;
        geometry.precision = record.precision ?? geometry.originPrecision;
    }
};

/**
 * 从 JSON 记录重建普通矩形，运行期 ID 由 Mesh 自行分配。
 * @param record 纯数据矩形
 * @example
 * const mesh = CreateRect(record);
 * @returns 可加入场景的 Mesh。
 */
const CreateRect = (record: RectEditRecord): Mesh => {
    const style = new Style();
    ApplyRectStyle(style, record.style);
    const geometry = new Rect2D({ width: record.width, height: record.height, radius: record.radius, style });
    const material = new BaseMaterial(style);
    const mesh = new Mesh(geometry, material, style);
    ApplyRect(mesh, record);
    return mesh;
};

export { ApplyRect, ApplyRectStyle, CaptureRect, CaptureRectStyle, CreateRect };
export type { RectEditDocument, RectEditRecord, RectEditStyleData };
