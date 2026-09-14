import { Mat3 } from "bpmatrixjs/Math/Mat3";
import type { AddObject } from "../global-types";
import ObjectNode from "../Object";
import type { ObjectNodeLike } from "../Object";
import type { SceneLike } from "../Scene";

interface GroupLike extends ObjectNodeLike {
    children: AddObject[];
    add(child: AddObject): void;
    removeSelf(): boolean;
    removeChild(child: AddObject): boolean;
    removeAll(): void;
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
     */
    public constructor(x: number, y: number) {
        super(x, y);
    }

    /**
     * 添加子节点
     * @param child 子节点对象
     * @returns 无返回值
     */
    public add(child: AddObject): void {
        if (child === this) {
            throw new Error("Cannot add a group to itself or one of its descendants.");
        }

        let current: AddObject | null = this.parent;

        // 禁止把自身或祖先作为子节点，否则 parent 链会形成死循环。
        while (current !== null) {
            if (current === child) {
                throw new Error("Cannot add a group to itself or one of its descendants.");
            }

            current = current.parent;
        }

        if (child.parent === this && this.children.includes(child)) {
            return;
        }

        // 节点只能有一个父级，换父级前先从旧父级的 children 中移除。
        if (child.parent !== null && "removeChild" in child.parent) {
            (child.parent as GroupLike).removeChild(child);
        }

        child.parent = this;
        this.children.push(child);
        const scene: SceneLike | undefined = this.getScene(child);

        if (scene !== undefined) {
            scene.addToLists(child);
            scene.updateVersion();
        }
    }

    /**
     * 从父组中删除当前节点。
     * 当前节点没有父组时不进行处理。
     * @returns 是否成功从父组中删除
     */
    public removeSelf(): boolean {
        const parent: AddObject | null = this.parent;

        if (parent === null || !("removeChild" in parent)) {
            return false;
        }

        const parentGroup: GroupLike = parent as GroupLike;
        return parentGroup.removeChild(this);
    }

    /**
     * 删除当前组中的一个直接子节点。
     * @param child 需要删除的直接子节点
     * @returns 是否找到并删除了该子节点
     */
    public removeChild(child: AddObject): boolean {
        const childIndex: number = this.children.indexOf(child);

        if (childIndex === -1) {
            return false;
        }

        const scene: SceneLike | undefined = this.getScene(this);

        this.children.splice(childIndex, 1);
        child.parent = null;

        if (scene !== undefined) {
            scene.removeFromLists(child);
        }

        return true;
    }

    /**
     * 删除当前组中的全部直接子节点。
     * @returns 无返回值
     */
    public removeAll(): void {
        if (this.children.length === 0) {
            return;
        }

        const scene: SceneLike | undefined = this.getScene(this);

        for (const child of this.children) {
            scene?.removeFromLists(child);
            child.parent = null;
        }

        this.children.length = 0;
    }

    /**
     * 强制更新当前节点及子节点世界矩阵
     * @returns Mat3
     */
    public updateWorldMatrix(): Mat3 {
        super.updateWorldMatrix();

        for (const child of this.children) {
            child.updateWorldMatrix();
        }
        return this.worldMatrix;
    }

    /**
     * 从当前节点沿父级查找所属场景。
     * @param node 起始节点
     * @returns 所属场景，未加入场景时返回 undefined
     */
    protected getScene(node: AddObject): SceneLike | undefined {
        let current: AddObject | null = node;

        while (current !== null) {
            if (current.type === "Scene") {
                return current as SceneLike;
            }

            current = current.parent;
        }

        return undefined;
    }
}

export default Group;
export type { GroupLike };
