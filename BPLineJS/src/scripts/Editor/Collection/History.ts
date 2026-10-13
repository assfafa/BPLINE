import Base2D from "../../Geometry/Base2D";
import CloneGeometry from "../../Geometry/CloneGeometry";
import NGon2D from "../../Geometry/NGon2D";
import Poly2D from "../../Geometry/Poly2D";
import Rect2D from "../../Geometry/Rect2D";
import Group from "../../Group";
import IMesh from "../../IMesh";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import type Scene from "../../Scene";
import type Style from "../../Style";
import Text from "../../Text";
import type { Geometry2d, Material2d } from "../../global-types";
import { CaptureRectStyle } from "../RectEditTool/data";
import EditorGroup from "./EditorGroup";

/** 合并编辑器和文字工具共用的跨几何类型历史。 */
class EditHistory {
    private readonly _owner: HistoryOwner;
    private readonly _undoStack: HistoryEntry[] = [];
    private readonly _redoStack: HistoryEntry[] = [];
    private _start: HistoryState | null = null;
    private _replaying: boolean = false;
    private _batchDepth: number = 0;

    /** @param owner 提供实体和选择恢复的编辑器 @example const history = new EditHistory(editor); @returns 历史管理器。 */
    public constructor(owner: HistoryOwner) {
        this._owner = owner;
    }

    /** @example const count = history.undoCount; @returns 可撤销操作数量。 */
    public get undoCount(): number {
        return this._undoStack.length;
    }
    /** @example const count = history.redoCount; @returns 可重做操作数量。 */
    public get redoCount(): number {
        return this._redoStack.length;
    }

    /** @example history.begin(); @returns 无返回值。 */
    public begin(): void {
        // 一次多指针/多节点操作只有一个起始快照。
        if (this._start === null && !this._replaying) {
            this._start = this.capture();
        }
    }

    /**
     * 把导入、粘贴及其嵌套子工具操作合成一笔记录。
     * @param operation 同步执行的整批编辑操作
     * @example history.batch(() => editor.push(meshes));
     * @returns 操作结果；异常仍交给调用者处理。
     */
    public batch<T>(operation: () => T): T {
        const startedHere = this._start === null;
        this.begin();
        this._batchDepth += 1;
        try {
            return operation();
        } finally {
            this._batchDepth -= 1;
            // 嵌套导入不提前截断外层选择、输入或拖动的历史边界。
            if (startedHere) {
                this.commit();
            }
        }
    }

    /** @example history.commit(); @returns 无返回值。 */
    public commit(): void {
        // 批处理内子工具的提交留给最外层，保留同一次操作的所有对象。
        if (this._batchDepth === 0) {
            const before = this._start;
            this._start = null;
            // 纯选择不占撤销步数，只有内容或父节点变化才清空重做分支。
            if (before !== null && !this._replaying) {
                const after = this.capture();
                // 只把内容变化记为历史，单纯选择不增加撤销步数。
                if (before.signature !== after.signature) {
                    this._undoStack.push({ before, after });
                    this._redoStack.length = 0;
                }
            }
        }
    }

    /** @example history.cancel(); @returns 无返回值，放弃尚未提交的操作边界。 */
    public cancel(): void {
        this._start = null;
    }

    /** @example history.undo(); @returns 是否恢复了上一批内容和几何类型。 */
    public undo(): boolean {
        this.commit();
        const entry = this._undoStack.pop();
        let restored = false;
        // 回放完整几何对象，所以转成 Base 后也能找回原参数化类型。
        if (entry !== undefined) {
            this.restore(entry.before);
            this._redoStack.push(entry);
            restored = true;
        }
        return restored;
    }

    /** @example history.redo(); @returns 是否重做了下一批内容与类型变化。 */
    public redo(): boolean {
        const entry = this._redoStack.pop();
        let restored = false;
        // 新编辑已清空 redo，剩余记录始终属于当前历史分支。
        if (entry !== undefined) {
            this.restore(entry.after);
            this._undoStack.push(entry);
            restored = true;
        }
        return restored;
    }

    /** @example history.clear(); @returns 无返回值。 */
    public clear(): void {
        this._start = null;
        this._undoStack.length = 0;
        this._redoStack.length = 0;
    }

    /** @example const state = this.capture(); @returns 带对象身份的完整实体状态。 */
    private capture(): HistoryState {
        const items: HistoryItem[] = [];
        const signatures: unknown[] = [];
        // 集合文档提供空 Group；独立文字工具继续只记录普通实体。
        for (const candidate of this.nodes()) {
            const matrix = [...candidate.ensureMatrix().data];
            const order = this._owner.sourceOrder?.(candidate) ?? candidate.order;
            const item: HistoryItem = { node: candidate, parent: candidate.parent as Group | null,
                matrix, x: candidate.position.x, y: candidate.position.y, rotation: candidate.rotation,
                scaleX: candidate.scale.x, scaleY: candidate.scale.y, order };
            // Mesh 保存独立几何与原始材质，Group 保存自身变换和编辑框模式。
            if (candidate instanceof Mesh && candidate.data !== undefined) {
                const original = this._owner.sourceMaterial?.(candidate) ?? candidate.material;
                // 缺失材质的节点只保留层级和变换，不能假造资源。
                if (original !== undefined) {
                    const style = this._owner.sourceStyle(candidate).clone();
                    const geometry = CloneGeometry(candidate.data);
                    geometry.style = style;
                    item.geometry = geometry;
                    item.style = style;
                    item.material = CloneMaterial(original, style);
                    item.ignoreZoom = candidate.ignoreZoom;
                    item.bounding = candidate.bounding;
                    item.noSelect = candidate.noSelect;
                    item.autoPrecision = candidate.autoPrecision;
                    item.precisionMax = candidate.precisionMax;
                    item.culling = candidate.culling;
                    signatures.push([candidate.id, candidate.parent?.id, matrix, candidate.ignoreZoom,
                        order, candidate.noSelect, candidate.autoPrecision, candidate.precisionMax,
                        candidate.culling, GeometryRecord(geometry), CaptureRectStyle(style)]);
                }
            } else {
                // EditorGroup 的范围固定在节点上，缩放与旋转由同一局部矩阵记录。
                if (candidate instanceof EditorGroup) {
                    item.ignoreZoom = candidate.ignoreZoom;
                }
                signatures.push([candidate.id, candidate.parent?.id, matrix, order, item.ignoreZoom]);
            }
            items.push(item);
        }
        /** @param mesh 一个选中实体 @example ID(mesh); @returns 稳定运行期 ID。 */
        const ID = (mesh: Mesh): number => mesh.id;
        return { items, selected: this._owner.actives.map(ID), activeGroup: this._owner.selectedGroup?.() ?? null,
            signature: JSON.stringify(signatures) };
    }

    /** @example const nodes = this.nodes(); @returns 当前属于历史范围的实体和结构节点。 */
    private nodes(): readonly Group[] {
        // 集合与文档统一范围，避免导入后撤销留下新建空组。
        const readDocumentNodes = this._owner.documentNodes?.bind(this._owner);
        // 没有集合文档入口时使用独立工具的既有实体范围。
        if (readDocumentNodes === undefined) {
            const nodes: Group[] = [];
            // 独立编辑器仍保留原先的普通 Mesh 历史范围。
            for (const candidate of this._owner.scene.ensureLists()) {
                // 实例和辅助覆盖层不由独立编辑器回放。
                if (candidate instanceof Mesh && !(candidate instanceof IMesh) && !candidate.noSelect) {
                    nodes.push(candidate);
                }
            }
            return nodes;
        } else {
            return readDocumentNodes();
        }
    }

    /** @param state 待恢复的完整状态 @example this.restore(entry.before); @returns 无返回值。 */
    private restore(state: HistoryState): void {
        this._replaying = true;
        this._start = null;
        this._owner.select([]);
        this._owner.selectGroup?.(null);
        const wanted = new Set<Group>();
        // 先确定保留对象身份，再摘除当前快照以外的新对象。
        for (const item of state.items) {
            wanted.add(item.node);
        }
        // 新建或粘贴后撤销只摘除对象，保留引用以便原 ID 重做。
        for (const candidate of this.nodes()) {
            // 撤销新增只解除父引用，重做仍复用原 Mesh。
            if (wanted.has(candidate) === false) {
                candidate.removeSelf();
            }
        }
        // 当前层级可能与目标快照方向相反，先摘除保留节点避免重新挂接时形成环。
        for (const item of state.items) {
            item.node.removeSelf();
        }
        const selected: Mesh[] = [];
        // 几何类型、父节点和逻辑矩阵必须先恢复，之后才重新分派选择装饰。
        for (const item of state.items) {
            const parent = item.parent ?? this._owner.scene;
            const node = item.node;
            parent.add(node);
            // 空组不拥有几何或材质；实体回放保留之前的真实类型。
            if (node instanceof Mesh && item.geometry !== undefined && item.material !== undefined && item.style !== undefined) {
                node.data = CloneGeometry(item.geometry);
                node.material = CloneMaterial(item.material, item.style.clone());
                node.style = item.style.clone();
                node.ignoreZoom = item.ignoreZoom ?? false;
                node.bounding = item.bounding ?? false;
                node.noSelect = item.noSelect ?? false;
                node.autoPrecision = item.autoPrecision ?? false;
                node.precisionMax = item.precisionMax ?? 100;
                node.culling = item.culling ?? true;
            } else if (node instanceof EditorGroup) {
                // 动态虚线框由 hierarchy.update 重建显示参数。
                node.ignoreZoom = item.ignoreZoom ?? false;
            }
            node.position.set(item.x, item.y);
            node.rotation = item.rotation;
            node.scale.set(item.scaleX, item.scaleY);
            node.matrix.set(item.matrix as MatrixValues);
            node.order = item.order;
            // 变换和类型恢复完毕后再还原当时的选择集。
            if (node instanceof Mesh && state.selected.includes(node.id)) {
                selected.push(node);
            }
        }
        this._owner.select(selected);
        this._owner.selectGroup?.(state.activeGroup);
        this._replaying = false;
    }
}

/** 历史依赖实体身份与原始样式，不依赖当前归属的具体编辑器。 */
interface HistoryOwner {
    scene: Scene;
    actives: Mesh[];
    /** @param meshes 恢复的选择集合 @example owner.select([]); @returns 无返回值。 */
    select(meshes: readonly Mesh[]): void;
    /** @param mesh 待读取实体 @example owner.sourceStyle(mesh); @returns 未装饰的用户样式。 */
    sourceStyle(mesh: Mesh): Style;
    /** @param node 用户节点 @example owner.sourceOrder(mesh); @returns 去掉临时选择提升的原始层级。 */
    sourceOrder?(node: Group): number;
    /** @param mesh 待读取实体 @example owner.sourceMaterial(mesh); @returns 原始用户材质。 */
    sourceMaterial?(mesh: Mesh): Material2d | undefined;
    /** @example owner.documentNodes(); @returns 包含空组的文档节点，省略时仅记录普通实体。 */
    documentNodes?(): readonly Group[];
    /** @example owner.selectedGroup(); @returns 当前真实层级组选择。 */
    selectedGroup?(): EditorGroup | null;
    /** @param group 待恢复层级组 @example owner.selectGroup(group); @returns 无返回值。 */
    selectGroup?(group: EditorGroup | null): void;
}

type MatrixValues = [number, number, number, number, number, number, number, number, number];

interface HistoryItem {
    node: Group;
    parent: Group | null;
    geometry?: Geometry2d;
    style?: Style;
    material?: Material2d;
    matrix: number[];
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    order: number;
    ignoreZoom?: boolean;
    bounding?: boolean;
    noSelect?: boolean;
    autoPrecision?: boolean;
    precisionMax?: number;
    culling?: boolean;
}

interface HistoryState { items: HistoryItem[]; selected: number[]; activeGroup: EditorGroup | null; signature: string }

interface HistoryEntry { before: HistoryState; after: HistoryState }

/** @param geometry 任意编辑实体几何 @example GeometryRecord(text); @returns 与三角面缓存无关的比较数据。 */
const GeometryRecord = (geometry: Geometry2d): unknown => {
    // 参数化几何比较输入；Base 则比较可编辑三角网和轮廓。
    if (geometry instanceof Rect2D) {
        return [geometry.type, geometry.originPrecision, geometry.width, geometry.height, geometry.radius];
    } else if (geometry instanceof NGon2D) {
        // 正多边形比较半径、边数和 UV 输入，不比较生成缓存。
        return [geometry.type, geometry.originPrecision, geometry.outer, geometry.inner, geometry.sides, geometry.startAngle, geometry.uvMode];
    } else if (geometry instanceof Poly2D) {
        // 多边形比较原始轮廓和闭合状态。
        return [geometry.type, geometry.originPrecision, Array.from(geometry.points), geometry.closed];
    } else if (geometry instanceof Text) {
        // 文字历史保存原文及排版参数，支持从 Base 恢复。
        return [geometry.type, geometry.originPrecision, geometry.text, geometry.fontFamily, geometry.fontSize, geometry.lineSpacing,
            geometry.letterSpacing, geometry.textAlign, geometry.baseline, geometry.writingMode];
    } else if (geometry instanceof Base2D) {
        // Base 直接比较三角网及外内轮廓。
        geometry.ensureGeometry();
        return [geometry.type, geometry.originPrecision, Array.from(geometry.geometry ?? []), Array.from(geometry.index ?? []),
            geometry.contours];
    } else {
        return geometry.type;
    }
};

export default EditHistory;
