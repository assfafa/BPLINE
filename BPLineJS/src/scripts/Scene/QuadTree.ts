import type { MeshBoundingRect, MeshLike } from "../Mesh";

/** 场景整体范围作为根；跨分区物体留在父节点，不重复绘制。 */
class QuadTree {
    public readonly bounds: MeshBoundingRect;
    public readonly depth: number;
    private readonly _items: QuadTreeEntry[] = [];
    private readonly _children = new Map<number, QuadTree>();

    /** @param bounds 根区域 @param depth 可向下划分层数 @example new QuadTree(bounds, 2); @returns 四叉树。 */
    public constructor(bounds: MeshBoundingRect, depth: number) {
        this.bounds = bounds;
        this.depth = depth;
    }

    /** @param entry 物体范围 @example tree.insert(entry); @returns 无返回值，每个物体只存放一次。 */
    public insert(entry: QuadTreeEntry): void {
        const bounds = this.bounds;
        const halfWidth = bounds.width / 2;
        const halfHeight = bounds.height / 2;
        const middleX = bounds.x + halfWidth;
        const middleY = bounds.y + halfHeight;
        let horizontal = -1;
        let vertical = -1;
        // 零宽物体落在分界线上时统一归属左/下分区。
        if (entry.bounds.x + entry.bounds.width <= middleX) {
            horizontal = 0;
        } else if (entry.bounds.x >= middleX) {
            // 右侧区域只接收完全位于分界线右边的物体。
            horizontal = 1;
        }
        // 水平分界确定后，再确认物体是否能完全进入上下子区。
        if (entry.bounds.y + entry.bounds.height <= middleY) {
            vertical = 0;
        } else if (entry.bounds.y >= middleY) {
            // 上半区只接收完全位于分界线上方的物体。
            vertical = 1;
        }
        // 跨区物体留在当前层；仅创建实际有物体的子区，避免深层空树爆炸。
        if (this.depth > 0 && horizontal >= 0 && vertical >= 0 && halfWidth > 0 && halfHeight > 0) {
            const index = vertical * 2 + horizontal;
            let child = this._children.get(index);
            // 只有被占用的子区才分配节点，深度不产生空节点指数增长。
            if (child === undefined) {
                child = new QuadTree({ x: bounds.x + horizontal * halfWidth,
                    y: bounds.y + vertical * halfHeight, width: halfWidth, height: halfHeight }, this.depth - 1);
                this._children.set(index, child);
            }
            child.insert(entry);
        } else {
            this._items.push(entry);
        }
    }

    /** @param bounds 查询范围 @param result 复用的命中集合 @example tree.query(bounds, result); @returns 无返回值。 */
    public query(bounds: MeshBoundingRect, result: Set<MeshLike>): void {
        // 完全未进入此区域时连同其后代一起跳过。
        if (IntersectsBounds(this.bounds, bounds)) {
            for (const entry of this._items) {
                // 保留接触视口边界的细线与零尺寸范围。
                if (IntersectsBounds(entry.bounds, bounds)) {
                    result.add(entry.mesh);
                }
            }
            // 已经通过父区域检查，只继续访问实际存在的子区。
            for (const child of this._children.values()) {
                child.query(bounds, result);
            }
        }
    }
}

/** 一个 Mesh 或整个 IMesh 的空间索引记录。 */
interface QuadTreeEntry {
    readonly mesh: MeshLike;
    readonly bounds: MeshBoundingRect;
}

/** @param left 第一个范围 @param right 第二个范围 @example IntersectsBounds(a, b); @returns 是否相交或接触。 */
const IntersectsBounds = (left: MeshBoundingRect, right: MeshBoundingRect): boolean => {
    return left.x <= right.x + right.width && right.x <= left.x + left.width &&
        left.y <= right.y + right.height && right.y <= left.y + left.height;
};

export default QuadTree;
export { IntersectsBounds };
export type { QuadTreeEntry };
