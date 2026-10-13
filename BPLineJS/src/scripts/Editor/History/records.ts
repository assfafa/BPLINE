import type Mesh from "../../Mesh";

/** 编辑历史的最小对象身份，不依赖具体几何类型。 */
interface HistoryMeshReference {
    mesh: Mesh;
}

/** 带有纯数据快照的历史条目。 */
interface HistoryDataReference<T> extends HistoryMeshReference {
    data: T;
}

/** @param mesh 可编辑实体 @example meshes.map(MeshId); @returns 稳定运行期编号。 */
const MeshId = (mesh: Mesh): number => mesh.id;

/** @param mesh 来源实体 @example clipboard.map(CloneMesh); @returns 独立的实体副本，资源按 Mesh.clone 规则复制。 */
const CloneMesh = (mesh: Mesh): Mesh => mesh.clone();

/** @param item 历史或手势条目 @example snapshots.map(HistoryMesh); @returns 条目对应的真实实体。 */
const HistoryMesh = (item: HistoryMeshReference): Mesh => item.mesh;

/** @param item 带数据的历史条目 @example items.map(HistoryData); @returns 比较编辑前后变化时使用的纯数据。 */
const HistoryData = <T>(item: HistoryDataReference<T>): T => item.data;

/** @param items 待恢复条目 @param selectedIds 保存的选择编号 @example SelectedHistoryMeshes(items, selectedIds); @returns 按条目顺序恢复的选择集合。 */
const SelectedHistoryMeshes = (items: readonly HistoryMeshReference[], selectedIds: readonly number[]): Mesh[] => {
    const selected = new Set(selectedIds);
    const result: Mesh[] = [];
    // 选择身份与几何快照分开恢复，不用 filter/map 的中间数组。
    for (const item of items) {
        // 只还原保存时的选择，回显的新建对象不会自动被选中。
        if (selected.has(item.mesh.id)) {
            result.push(item.mesh);
        }
    }
    return result;
};

export { CloneMesh, HistoryData, HistoryMesh, MeshId, SelectedHistoryMeshes };
export type { HistoryDataReference, HistoryMeshReference };
