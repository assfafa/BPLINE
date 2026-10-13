import Poly2D from "../../Geometry/Poly2D";
import BaseMaterial from "../../Material/baseMaterial";
import Mesh from "../../Mesh";
import Style from "../../Style";
import type { RectEditStyleData } from "../RectEditTool/data";
import { ApplyRectStyle, CaptureRectStyle } from "../RectEditTool/data";

/** 单个多边形的可序列化编辑记录。 */
interface PolyEditRecord {
    id: number;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    matrix: [number, number, number, number, number, number, number, number, number];
    points: number[];
    closed: boolean;
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

/** `save()` 返回的纯 JSON 数据；加载时运行期 ID 重新分配。 */
interface PolyEditDocument {
    version: 1;
    meshes: PolyEditRecord[];
}

/**
 * 把多边形 Mesh 保存为无订阅器的纯数据。
 * @param mesh 来源 Mesh
 * @param originalStyle 选中前的用户样式
 * @example
 * const record = CapturePoly(mesh, style);
 * @returns 当前几何、变换、样式及材质设置
 */
const CapturePoly = (mesh: Mesh, originalStyle?: Style): PolyEditRecord => {
    const geometry = mesh.data;
    const material = mesh.material;
    // 编辑器只记录带材质的普通多边形。
    if (geometry instanceof Poly2D && material !== undefined) {
        const style = originalStyle ?? mesh.style ?? geometry.style;
        return {
            id: mesh.id,
            position: { x: mesh.position.x, y: mesh.position.y },
            rotation: mesh.rotation,
            scale: { x: mesh.scale.x, y: mesh.scale.y },
            matrix: Array.from(mesh.ensureMatrix().data) as PolyEditRecord["matrix"],
            points: Array.from(geometry.points),
            closed: geometry.closed,
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
        throw new TypeError("PolyEditTool can only capture a Poly2D Mesh with material.");
    }
};

/**
 * 在保留运行期 Mesh 身份的同时恢复多边形快照。
 * @param mesh 目标 Mesh
 * @param record 来源记录
 * @example
 * ApplyPoly(mesh, record);
 * @returns 无返回值
 */
const ApplyPoly = (mesh: Mesh, record: PolyEditRecord): void => {
    const geometry = mesh.data;
    const material = mesh.material;
    // 自定义材质对象仍由调用方管理，只恢复标准可序列化参数。
    if (geometry instanceof Poly2D && material !== undefined) {
        let style = mesh.style;
        // 回显到未单独指定样式的 Mesh 时，先建立其私有样式副本。
        if (style === undefined) {
            style = geometry.style.clone();
            mesh.style = style;
        }
        ApplyRectStyle(style, record.style);
        geometry.points = new Float32Array(record.points);
        geometry.closed = record.closed;
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
 * 从纯 JSON 新建多边形 Mesh，使用新的运行期 ID。
 * @param record 可序列化记录
 * @example
 * const mesh = CreatePoly(record);
 * @returns 独立 Mesh
 */
const CreatePoly = (record: PolyEditRecord): Mesh => {
    const style = new Style();
    ApplyRectStyle(style, record.style);
    const geometry = new Poly2D(new Float32Array(record.points), style, { closed: record.closed });
    const mesh = new Mesh(geometry, new BaseMaterial(style), style);
    ApplyPoly(mesh, record);
    return mesh;
};

export { ApplyPoly, CapturePoly, CreatePoly };
export type { PolyEditDocument, PolyEditRecord };
