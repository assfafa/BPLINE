import Base2D from "../../Geometry/Base2D";
import CloneGeometry from "../../Geometry/CloneGeometry";
import IMesh from "../../IMesh";
import type Mesh from "../../Mesh";
import type Style from "../../Style";
import type { Geometry2d } from "../../global-types";
import { BakeBase } from "./GroupTransform";

/** 主动降级的一批几何快照；只替换 data，保留 Mesh、层级、材质和局部变换。 */
class BaseChange {
    /** 本次实际转换的对象，已是 Base2D 的对象不在其中。 */
    public readonly meshes: Mesh[] = [];
    private readonly _items: BaseChangeItem[] = [];

    /**
     * 先准备全部几何，生成失败时不修改场景。
     * @param meshes 待降级的选中对象
     * @param sourceStyle 读取选中装饰之前的用户样式
     * @example const change = new BaseChange(tool.actives, tool.sourceStyle.bind(tool));
     * @returns 可撤销的几何转换。
     */
    public constructor(meshes: readonly Mesh[], sourceStyle: (mesh: Mesh) => Style) {
        // 去重后只转换普通参数化几何，避免重复生成或处理实例模板。
        for (const mesh of new Set(meshes)) {
            const geometry = mesh.data;
            // 已降级与缺失几何的对象保持原样，不产生重复事件或历史。
            if (geometry !== undefined && !(geometry instanceof Base2D) && !(mesh instanceof IMesh)) {
                const before = CloneGeometry(geometry);
                before.style = sourceStyle(mesh).clone();
                const after = BakeBase(before, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
                this._items.push({ mesh, before, after });
                this.meshes.push(mesh);
            }
        }
    }

    /** @example change.undo(); @returns 无返回值，恢复原几何类型与独立输入。 */
    public undo(): void {
        // 不复用快照对象，后续顶点编辑不能污染撤销记录。
        for (const item of this._items) {
            item.mesh.data = CloneGeometry(item.before);
        }
    }

    /** @example change.redo(); @returns 无返回值，安装独立的 Base2D 几何。 */
    public redo(): void {
        // 转换使用原局部坐标，不重置 TRS，也不改变父节点或 ignoreZoom。
        for (const item of this._items) {
            item.mesh.data = item.after.clone();
        }
    }
}

interface BaseChangeItem {
    mesh: Mesh;
    before: Geometry2d;
    after: Base2D;
}

/** 集合子工具把主动转换交由集合完成，保证选择、类型归属与历史只有一个拥有者。 */
type BaseDelegate = (meshes: readonly Mesh[]) => Mesh[];

export default BaseChange;
export type { BaseDelegate };
