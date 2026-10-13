import type Group from "../../Group";
import Mesh from "../../Mesh";

/** 集合专用层级管理：原始层级与选中展示层级分开维护。 */
class EditorOrder {
    private _max: number = 0;
    private readonly _raised = new Map<Mesh, RaisedOrder>();


    /** @example const max = orders.max; @returns 文档实体的最大原始 order；空文档为 0。 */
    public get max(): number {
        return this._max;
    }

    /**
     * 读取原始层级，并接收选中期间由调用方主动设置的层级。
     * @param node 用户节点
     * @example const order = orders.sourceOrder(mesh);
     * @returns 不含选中提升的 order。
     */
    public sourceOrder(node: Group): number {
        let order = node.order;
        // 只有实体参与选中提升，普通 Group 的层级按原值读取。
        if (node instanceof Mesh) {
            const saved = this._raised.get(node);
            // 选中期间外部改动 order，取消选择后应保留这个新原值。
            if (saved !== undefined) {
                // 展示层级与上次写入值不同时，说明调用方进行了主动调整。
                if (node.order !== saved.display) {
                    saved.source = node.order;
                }
                order = saved.source;
            }
        }
        return order;
    }

    /**
     * 同步当前文档和选择集合，不统计辅助框、网格等内部节点。
     * @param nodes 文档中的用户节点
     * @param selected 当前选择集合
     * @param enabled 是否临时提升已选实体
     * @example orders.sync(editor.documentNodes(), editor.actives, editor.raiseSelected);
     * @returns 无返回值。
     */
    public sync(nodes: readonly Group[], selected: readonly Mesh[], enabled: boolean): void {
        const present = new Set(nodes);
        const wanted = new Set<Mesh>();
        // 开关关闭时 wanted 保持为空，下面统一恢复全部临时层级。
        if (enabled) {
            // 移出文档的对象不能继续保留临时提升。
            for (const mesh of selected) {
                // 只提升仍属于当前文档的选择，辅助对象不会混入。
                if (present.has(mesh)) {
                    wanted.add(mesh);
                }
            }
        }
        // 先恢复取消选择或删除的对象，再统计真实最大值。
        for (const [mesh] of this._raised) {
            // 保留选择的成员不反复恢复和重写，避免每帧触发 Scene 排序。
            if (wanted.has(mesh) === false) {
                const source = this.sourceOrder(mesh);
                this._raised.delete(mesh);
                mesh.order = source;
            }
        }
        let maximum = -Infinity;
        let count = 0;
        // 使用原始 order 统计，已有选中提升不会让最大值无限递增。
        for (const node of nodes) {
            // Group 本身不绘制实体，范围框属于辅助节点，不占实体层级。
            if (node instanceof Mesh) {
                maximum = Math.max(maximum, this.sourceOrder(node));
                count += 1;
            }
        }
        // 实体层级全为负值时仍返回真实最大值，仅没有实体时回到 0。
        if (count > 0) {
            this._max = maximum;
        } else {
            this._max = 0;
        }
        const display = this._max + 1;
        // 同一选择集合共用最大值加一，新增更高层对象后同步更新。
        for (const mesh of wanted) {
            let saved = this._raised.get(mesh);
            // 首次提升前保存原值，后续刷新沿用同一份恢复记录。
            if (saved === undefined) {
                saved = { source: mesh.order, display };
                this._raised.set(mesh, saved);
            }
            saved.display = display;
            mesh.order = display;
        }
    }

    /** @example orders.restore(); @returns 无返回值，销毁编辑器前恢复所有原始层级。 */
    public restore(): void {
        // 被摘除的实体也可能由外部保留引用，同样恢复它们的原始 order。
        for (const [mesh] of this._raised) {
            mesh.order = this.sourceOrder(mesh);
        }
        this._raised.clear();
    }
}

/** 从编辑器读取实体原始层级，避免把临时选中层级写入数据和历史。 */
type OrderSource = (node: Group) => number;

interface RaisedOrder {
    source: number;
    display: number;
}

export default EditorOrder;
export type { OrderSource };
