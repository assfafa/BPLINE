import { Mat3 } from "bpmatrixjs/Math/Mat3";
import type { AddObject } from "../global-types";
import ObjectNode from "../Object";
import type { ObjectNodeLike } from "../Object";
import type { SceneLike } from "../Scene";
interface GroupLike extends ObjectNodeLike {
    children: AddObject[];
    /**
     * 添加子节点
     * @param child 子节点对象
     * @example
     * group.add(child);
     * @returns 无返回值
     */
    add(child: AddObject): void;
    /**
     * 从父组中删除当前节点。
     * 当前节点没有父组时不进行处理。
     * @example
     * group.removeSelf();
     * @returns 是否成功从父组中删除
     */
    removeSelf(): boolean;
    /**
     * 删除当前组中的一个直接子节点。
     * @param child 需要删除的直接子节点
     * @example
     * group.removeChild(child);
     * @returns 是否找到并删除了该子节点
     */
    removeChild(child: AddObject): boolean;
    /**
     * 删除当前组中的全部直接子节点。
     * @example
     * group.removeAll();
     * @returns 无返回值
     */
    removeAll(): void;
    /**
     * 强制更新当前节点及子节点世界矩阵
     * @example
     * group.updateWorldMatrix();
     * @returns Mat3
     */
    updateWorldMatrix(): Mat3;
}
/**
 * 组对象
 * 用于组织子节点和维护基础变换信息
 * @class
 */
class Group extends ObjectNode implements GroupLike {
    /**
     * 对象类型
     */
    public readonly type: string = "Group";
    /**
     * 子节点列表
     */
    public children: AddObject[] = [];
    /**
     * 创建组对象
     * @param x 初始位置 X
     * @param y 初始位置 Y
     * @example
     * const group = new Group(x, y);
     * @returns 创建的 Group 对象。
     */
    public constructor(x: number, y: number) {
        super(x, y);
    }
    /**
     * 添加子节点
     * @param child 子节点对象
     * @example
     * group.add(child);
     * @returns 无返回值
     */
    public add(child: AddObject): void {
        // 禁止节点添加自身，避免场景树形成直接环。
        if (child === this) {
            throw new Error("Cannot add a group to itself or one of its descendants.");
        }
        let current: AddObject | null = this.parent;
        // 禁止把自身或祖先作为子节点，否则 parent 链会形成死循环。
        while (current !== null) {
            // 禁止将祖先作为子节点加入，避免递归遍历形成循环。
            if (current === child) {
                throw new Error("Cannot add a group to itself or one of its descendants.");
            }
            current = current.parent;
        }
        // 只处理尚未完整归属当前父节点的对象，重复 add 不重复插入。
        if (child.parent !== this || !this.children.includes(child)) {
            // 节点只能有一个父级，换父级前先从旧父级的 children 中移除。
            if (child.parent !== null && "removeChild" in child.parent) {
                (child.parent as GroupLike).removeChild(child);
            }
            child.parent = this;
            this.children.push(child);
            const scene: SceneLike | undefined = this.getScene(child);
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (scene !== undefined) {
                scene.addToLists(child);
                scene.updateVersion();
            }
        } else {
            return;
        }
    }
    /**
     * 从父组中删除当前节点。
     * 当前节点没有父组时不进行处理。
     * @example
     * group.removeSelf();
     * @returns 是否成功从父组中删除
     */
    public removeSelf(): boolean {
        const parent: AddObject | null = this.parent;
        // 有父节点时先处理父级变换，避免把世界坐标当作局部坐标。
        if (parent !== null && "removeChild" in parent) {
            const parentGroup: GroupLike = parent as GroupLike;
            return parentGroup.removeChild(this);
        } else {
            return false;
        }
    }
    /**
     * 删除当前组中的一个直接子节点。
     * @param child 需要删除的直接子节点
     * @example
     * group.removeChild(child);
     * @returns 是否找到并删除了该子节点
     */
    public removeChild(child: AddObject): boolean {
        const childIndex: number = this.children.indexOf(child);
        // 传入对象不是当前子节点时不修改任何父子关系。
        if (childIndex === -1) {
            return false;
        } else {
            const scene: SceneLike | undefined = this.getScene(this);
            this.children.splice(childIndex, 1);
            child.parent = null;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (scene !== undefined) {
                scene.removeFromLists(child);
            }
            return true;
        }
    }
    /**
     * 删除当前组中的全部直接子节点。
     * @example
     * group.removeAll();
     * @returns 无返回值
     */
    public removeAll(): void {
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (this.children.length !== 0) {
            const scene: SceneLike | undefined = this.getScene(this);
            // 沿父子关系处理节点，保持场景列表与节点树一致。
            for (const child of this.children) {
                scene?.removeFromLists(child);
                child.parent = null;
            }
            this.children.length = 0;
        } else {
            return;
        }
    }
    /**
     * 强制更新当前节点及子节点世界矩阵
     * @example
     * group.updateWorldMatrix();
     * @returns Mat3
     */
    public updateWorldMatrix(): Mat3 {
        super.updateWorldMatrix();
        // 沿父子关系处理节点，保持场景列表与节点树一致。
        for (const child of this.children) {
            child.updateWorldMatrix();
        }
        return this.worldMatrix;
    }
    /**
     * 从当前节点沿父级查找所属场景。
     * @param node 起始节点
     * @example
     * this.getScene(node);
     * @returns 所属场景，未加入场景时返回 undefined
     */
    protected getScene(node: AddObject): SceneLike | undefined {
        let current: AddObject | null = node;
        // 沿父引用向上查找，直到命中目标或到达根节点。
        while (current !== null) {
            // 按几何或图元类型选择对应实现，不混用不同模板的规则。
            if (current.type === "Scene") {
                return current as SceneLike;
            } else {
                current = current.parent;
            }
        }
        return undefined;
    }
}
export default Group;
export type { GroupLike };
