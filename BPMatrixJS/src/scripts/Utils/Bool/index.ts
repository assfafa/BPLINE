import { Difference, Intersection, Union, Xor } from "./Operations.js";
import { Covers, FastCollision, GetBounds, Intersects, Overlaps } from "./Predicates.js";
import { BoolRuntime } from "./Runtime.js";

/**
 * WASM 二维区域布尔运算；第一次 await ready，之后运算同步且不改写输入。
 * @example
 * await Bool.ready();
 * const result = Bool.Difference([{ id: 1, type: "rect", data: rect }], masks);
 * // result.changes 记录 removed/split；result.items 保存局部几何、matrix 和 sourceId。
 */
class Bool {
    /** 合并全部区域，返回一个 poly/base；空结果 items=[]。 */
    public static readonly Union = Union;
    /** 每个 A 分别减去所有 B 的并集，保留分片与删除追踪。 */
    public static readonly Difference = Difference;
    /** 交集，第三参数 a/b/both 选择归属；默认 a。 */
    public static readonly Intersection = Intersection;
    /** 非相交区域，默认双方 XOR；a 或 b 只保留那一侧。 */
    public static readonly Xor = Xor;
    /** 精确接触/相交谓词，包含边界接触。 */
    public static readonly Intersects = Intersects;
    /** 精确面积相交谓词，不包含仅边界接触。 */
    public static readonly Overlaps = Overlaps;
    /** B 是否被 A 的并集完全覆盖。 */
    public static readonly Covers = Covers;
    /** 包围盒候选碰撞检测，无需初始化 WASM。 */
    public static readonly FastCollision = FastCollision;
    /** 获取可缓存的共同坐标包围盒，无需初始化 WASM。 */
    public static readonly GetBounds = GetBounds;

    /** @example await Bool.ready(); @returns 共享初始化 Promise；Node、浏览器和 Worker 使用同一个二进制。 */
    public static ready(): Promise<void> {
        return BoolRuntime.Ready();
    }
}

export { Bool, Covers, Difference, FastCollision, GetBounds, Intersection, Intersects, Overlaps, Union, Xor };
export type {
    BoolBounds, BoolChange, BoolContour, BoolFillRule, BoolGeometry, BoolGeometryData,
    BoolId, BoolInput, BoolKeep, BoolResult, BoolSide, BoolSource, BoolTriangles,
} from "./types.js";
