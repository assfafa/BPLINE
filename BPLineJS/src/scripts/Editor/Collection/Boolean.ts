import { Bool } from "bpmatrixjs/Utils/Bool";
import type { BoolGeometry, BoolInput, BoolResult } from "bpmatrixjs/Utils/Bool";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import type { GeoPartDataLike } from "../../Geometry/Geo";
import NGon2D from "../../Geometry/NGon2D";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import Group from "../../Group";
import IMesh from "../../IMesh";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import Text from "../../Text";
import type { Geometry2d } from "../../global-types";
import type Editor from "../index";
import { Reparent } from "./Hierarchy";

/** 在修改场景前准备完整布尔结果，连续轮廓和三角网分别传入数学库。 */
class BooleanChange {
    /** 数学库返回的来源、分片及删除记录。 */
    public readonly result: BoolResult;
    /** 运算后应选中的对象，包括减法中完全未变化的原对象。 */
    public readonly meshes: Mesh[] = [];
    /** 即将摘除的实体；减法永远不包含工具 B。 */
    public readonly removed: Mesh[] = [];
    private readonly _parents = new Map<Mesh, Group>();
    private readonly _added: Mesh[] = [];
    private readonly _owner: Editor;

    /**
     * 同步计算并准备资源，失败时原场景和选择保持不变；调用前 await Bool.ready()。
     * @param owner 提供原始样式、层级和相机的集合编辑器
     * @param subjects 已选中的 A，不能包含 target
     * @param target 本次点击的 B
     * @param operation 并集或 A-B
     * @example const change = new BooleanChange(editor, selected, target, "difference");
     * @returns 可纳入一笔历史的变更。
     */
    public constructor(owner: Editor, subjects: readonly Mesh[], target: Mesh, operation: BooleanOperation) {
        this._owner = owner;
        const sources = new Map<number, Mesh>();
        const inputs: BoolInput[] = [];
        // 轮廓类型直接读取参数；文字和 Base 只读取实体三角网。
        for (const mesh of subjects) {
            sources.set(mesh.id, mesh);
            inputs.push(CreateBooleanInput(mesh, owner.camera));
        }
        sources.set(target.id, target);
        const clip = CreateBooleanInput(target, owner.camera);
        // 并集包含双方；减法只修改 A，B 仍是场景中的独立对象。
        if (operation === "union") {
            this.result = Bool.Union([...inputs, clip]);
            this.removed.push(...subjects, target);
        } else {
            this.result = Bool.Difference(inputs, [clip]);
            // 无相交区域时保留原参数几何、ID、材质和层级。
            for (const change of this.result.changes) {
                const source = sources.get(Number(change.id));
                // B 的 operand 记录不产生场景改动。
                if (change.side === "a" && source !== undefined && change.status !== "unchanged") {
                    this.removed.push(source);
                }
            }
        }
        const removed = new Set(this.removed);
        // 所有输出都准备完成后才允许调用 apply，避免中途失败删掉来源。
        for (const item of this.result.items) {
            const source = sources.get(Number(item.sourceId));
            // 结果必须能追溯到本次输入，才能继承正确的材质和父容器。
            if (source !== undefined) {
                // 未改变的 A 不必降级为多边形，也不重新生成材质。
                if (removed.has(source)) {
                    const mesh = CreateResultMesh(owner, source, item);
                    const parent = SurvivingParent(source, removed, owner.scene);
                    ValidateParent(parent);
                    this._parents.set(mesh, parent);
                    this._added.push(mesh);
                    this.meshes.push(mesh);
                } else {
                    this.meshes.push(source);
                }
            } else {
                throw new Error("Boolean result has no source Mesh.");
            }
        }
        // 被裁空的父实体也可能有未参与计算的子对象，预先验证迁移目标。
        for (const mesh of this.removed) {
            ValidateParent(SurvivingParent(mesh, removed, owner.scene));
        }
    }

    /** @example change.apply(); @returns 无返回值；调用方在历史批次中先清除选择装饰。 */
    public apply(): void {
        const removed = new Set(this.removed);
        // 父实体被替换不代表删除其后代；未参与运算的节点保持世界姿态。
        for (const mesh of this.removed) {
            const parent = SurvivingParent(mesh, removed, this._owner.scene);
            // 使用副本遍历，Reparent 会改变原 children 数组。
            for (const child of [...mesh.children]) {
                // Group 不参与面积计算，但仍需保留它和它的子树。
                if (child instanceof Group && !(child instanceof Mesh && removed.has(child))) {
                    Reparent(child, parent);
                }
            }
        }
        // 先保留后代，再摘除来源，防止连带删除未参与运算的对象。
        for (const mesh of this.removed) {
            mesh.removeSelf();
        }
        // 新网格当前使用世界姿态，换父级时显式抵消父变换。
        for (const mesh of this._added) {
            const parent = this._parents.get(mesh);
            // 父目标由构造时验证并完整记录。
            if (parent !== undefined) {
                Reparent(mesh, parent);
            }
        }
    }

    /** @param node 候选节点 @example BooleanChange.accepts(mesh); @returns 是否是可参与面积运算的普通实体。 */
    public static accepts(node: Group): node is Mesh {
        // Group、实例批次及辅助框都不展开为操作数。
        if (node instanceof Mesh && !(node instanceof IMesh) && !node.noSelect) {
            const geometry = node.data;
            return geometry instanceof Rect2D || geometry instanceof NGon2D || geometry instanceof Base2D ||
                geometry instanceof Text || (geometry instanceof Poly2D && geometry.closed);
        } else {
            return false;
        }
    }
}

type BooleanOperation = "union" | "difference";

interface BooleanEvent {
    operation: BooleanOperation;
    subjects: readonly Mesh[];
    target: Mesh;
    meshes: readonly Mesh[];
    /** items 顺序对应 meshes，可追踪结果来源；未改变的 A 保留原 Mesh。 */
    result: BoolResult;
}

/** @param mesh 实体 @param camera 当前相机 @example CreateBooleanInput(mesh, camera); @returns 包含显示矩阵且不修改原对象的数学库输入。 */
const CreateBooleanInput = (mesh: Mesh, camera: Camera): BoolInput => {
    const geometry = mesh.data;
    const matrix = Array.from(mesh.getRenderMatrix(camera).data);
    const id = mesh.id;
    // 连续轮廓直接进入原生布尔，不为矩形或正多边形生成实体三角面。
    if (geometry instanceof Rect2D) {
        return { id, matrix, type: "rect", data: geometry };
    } else if (geometry instanceof NGon2D) {
        // 数学库使用 inter/hole，渲染层使用 inner。
        return { id, matrix, type: "ngon", data: {
            sides: geometry.sides, outer: geometry.outer, inter: geometry.inner,
            hole: geometry.inner > 0, startAngle: geometry.startAngle,
        } };
    } else if (geometry instanceof Poly2D && geometry.closed) {
        // 只接受闭合区域，开放折线不隐式补边参与布尔。
        const points: [number, number][] = [];
        // Poly2D 的扁平坐标转为数学库的有序点格式，不改变原点序。
        for (let offset = 0; offset < geometry.points.length; offset += 2) {
            points.push([geometry.points[offset], geometry.points[offset + 1]]);
        }
        return { id, matrix, type: "poly", data: { points, closed: true } };
    } else if (geometry instanceof Base2D) {
        // 原输入不包含选择框自动生成的边和点；旧烘焙数据仍由 vertexType 筛选。
        const input = geometry.getData();
        return { id, matrix, type: "base", data: {
            geometry: input.vertices, index: input.index, vertexType: input.vertexType,
        } };
    } else if (geometry instanceof Text) {
        // 副本只用于提取实体，避免临时调整字体对象的可见样式。
        const copy = geometry.clone();
        try {
            // 只有边框的文字也按字形实体运算，不把选中黄色描边算入结果。
            copy.style.solid.enabled = true;
            copy.style.edge.enabled = false;
            copy.style.points.enabled = false;
            copy.style.wireframe.enabled = false;
            copy.ensureGeometry();
            return { id, matrix, type: "text", data: {
                geometry: copy.geometry ?? new Float32Array(), index: copy.index,
                vertexType: copy.vertexType,
            } };
        } finally {
            copy.dispose();
        }
    } else {
        throw new TypeError("Boolean operands must be closed Rect, NGon, Poly, Base or Text meshes.");
    }
};

/** @param owner 集合编辑器 @param source 材质归属对象 @param item 数学库输出 @example CreateResultMesh(editor, rect, item); @returns 具有世界姿态的独立实体。 */
const CreateResultMesh = (owner: Editor, source: Mesh, item: BoolGeometry): Mesh => {
    const style = owner.sourceStyle(source).clone();
    const material = owner.sourceMaterial(source);
    let geometry: Geometry2d;
    let mesh: Mesh;
    // 无孔单轮廓交给 Poly 编辑；孔及多个连通分量保留为 Base 轮廓。
    if (item.type === "poly") {
        geometry = new Poly2D(new Float32Array(item.data.contours[0]), style);
    } else {
        /** @param ring 局部轮廓 @example CopyRing(ring); @returns GPU 可用的轮廓副本。 */
        const CopyRing = (ring: Float64Array): Float32Array => new Float32Array(ring);
        geometry = new Base2D({
            vertices: item.data.geometry, index: item.data.index, uv: item.data.uv,
            contours: item.data.contours.map(CopyRing), linePoints: ContourLines(item), style,
        });
    }
    // 缺失材质不能安全继承管线；准备阶段报错，不动场景。
    if (material !== undefined) {
        mesh = new Mesh(geometry, CloneMaterial(material, style), style);
        mesh.position.set(item.matrix[6], item.matrix[7]);
        mesh.order = owner.sourceOrder(source);
        mesh.ignoreZoom = source.ignoreZoom;
        mesh.bounding = source.bounding;
        mesh.culling = source.culling;
        mesh.autoPrecision = source.autoPrecision;
        mesh.precisionMax = source.precisionMax;
        // 布尔在显示空间计算，固定屏幕大小的结果补回逻辑倍率，避免二次缩小。
        if (mesh.ignoreZoom) {
            mesh.scale.set(owner.camera.zoom, owner.camera.zoom);
        }
    } else {
        throw new Error("Boolean source Mesh has no material.");
    }
    return mesh;
};

/** @param node 即将替换的实体 @param removed 本次摘除集合 @param root 兜底场景 @example SurvivingParent(mesh, removed, scene); @returns 最近的保留父级。 */
const SurvivingParent = (node: Mesh, removed: ReadonlySet<Mesh>, root: Group): Group => {
    let parent = node.parent;
    // 只跳过本次真的删除的实体，普通 Group 始终保留。
    while (parent instanceof Mesh && removed.has(parent)) {
        parent = parent.parent;
    }
    // 场景中的合法父节点均为 Group，脱离场景则回到根容器。
    if (parent instanceof Group) {
        return parent;
    } else {
        return root;
    }
};

/** @param parent 输出的父节点 @example ValidateParent(group); @returns 无返回值；不可逆的父变换无法保持世界位置。 */
const ValidateParent = (parent: Group): void => {
    const matrix = parent.ensureWorldMatrix().data;
    const determinant = matrix[0] * matrix[4] - matrix[1] * matrix[3];
    // 极小但非零的倍率仍可逆，不能把用户的微小坐标场景当作奇异变换。
    if (Number.isFinite(determinant) && determinant !== 0) {
        // 验证成功，不修改父节点。
    } else {
        throw new Error("Boolean output requires an invertible parent transform.");
    }
};

/** @param item 原生输出 @example ContourLines(item); @returns 所有内外环的独立线段，保留 wireframe 切换能力。 */
const ContourLines = (item: BoolGeometry): GeoPartDataLike => {
    const coordinates: number[] = [];
    // 每条环单独闭合，不把不同字形或孔连接在一起。
    for (const ring of item.data.contours) {
        // 相邻节点构成一条原生线段，末点回到起点。
        for (let offset = 0; offset < ring.length; offset += 2) {
            const next = (offset + 2) % ring.length;
            coordinates.push(ring[offset], ring[offset + 1], ring[next], ring[next + 1]);
        }
    }
    const geometry = new Float32Array(coordinates);
    const index = new Uint32Array(geometry.length / 2);
    // line-list 顺序索引，不使用三角面中包含的内部剖分边。
    for (let vertex = 0; vertex < index.length; vertex++) {
        index[vertex] = vertex;
    }
    return { geometry, index, normal: new Float32Array(geometry.length), uv: new Float32Array(geometry.length) };
};

export default BooleanChange;
export type { BooleanEvent, BooleanOperation };
