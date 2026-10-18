import { Bounds, BoundsOverlap, Prepare, ReadPaths } from "./Input.js";
import { Merge } from "./Operations.js";
import { BoolRuntime } from "./Runtime.js";
import type { BoolBounds, BoolInput } from "./types.js";

/** @param a 第一组区域 @param b 第二组区域 @example Intersects([a], [b]); @returns 是否接触或相交，边界接触也为 true。 */
const Intersects = (a: readonly BoolInput[], b: readonly BoolInput[]): boolean => {
    return Predicate(a, b, 5);
};

/** @param a 第一组区域 @param b 第二组区域 @example Overlaps([a], [b]); @returns 是否有非零面积交集，仅边界接触为 false。 */
const Overlaps = (a: readonly BoolInput[], b: readonly BoolInput[]): boolean => {
    return Predicate(a, b, 7);
};

/** @param a 覆盖区域 @param b 被覆盖区域 @example Covers([a], [b]); @returns B 是否完全被 A 的并集覆盖；空 B 为 true，边界允许重合。 */
const Covers = (a: readonly BoolInput[], b: readonly BoolInput[]): boolean => {
    const subjects = Prepare(a, "a");
    const clips = Prepare(b, "b");
    // 分别覆盖每个 B 等价于覆盖 B 并集，同时避免远处实体降低局部数值精度。
    for (const clip of clips) {
        const candidates = [];
        // 多个 A 可共同覆盖一个 B，不要求单个 A 独立覆盖。
        for (const subject of subjects) {
            // 只有重叠包围盒会影响当前 B 的覆盖判断。
            if (BoundsOverlap(subject.bounds, clip.bounds)) {
                candidates.push(subject);
            }
        }
        const paths = Merge(candidates).flat();
        // 空 B 按集合定义被任意 A 覆盖；其他情况用 B-A 是否为空决定。
        if (BoolRuntime.Run(6, paths, clip.paths)[0] === 1) {
            // 此对象被完全覆盖，继续检查其他 B。
        } else {
            return false;
        }
    }
    return true;
};

/** @param input 原始几何及可选矩阵 @example GetBounds(input); @returns 共同坐标空间的包围盒；不初始化 WASM。 */
const GetBounds = (input: BoolInput): BoolBounds | null => Bounds(ReadPaths(input));

/**
 * 包围盒快速碰撞候选检查，true 可能是假阳性，需 Intersects 精筛；无需 ready。
 * @param a 第一个几何、已缓存包围盒或 null
 * @param b 第二个几何、已缓存包围盒或 null
 * @example FastCollision(GetBounds(a), GetBounds(b));
 * @returns false 可排除碰撞；true 只表示包围盒重叠或接触。
 */
const FastCollision = (a: BoolInput | BoolBounds | null, b: BoolInput | BoolBounds | null): boolean => {
    return BoundsOverlap(ResolveBounds(a), ResolveBounds(b));
};

/** @param input 几何或包围盒 @example ResolveBounds(input); @returns 可直接检查的包围盒。 */
const ResolveBounds = (input: BoolInput | BoolBounds | null): BoolBounds | null => {
    // 已计算的包围盒可复用，批量场景查询无需反复扫描轮廓。
    if (input === null || "minX" in input) {
        return input;
    } else {
        return GetBounds(input);
    }
};

/** @param a 第一组 @param b 第二组 @param operation 精确谓词编号 @example Predicate(a, b, 5); @returns 任意一对实体是否满足谓词。 */
const Predicate = (a: readonly BoolInput[], b: readonly BoolInput[], operation: number): boolean => {
    const subjects = Prepare(a, "a");
    const clips = Prepare(b, "b");
    // 带宽相位的逐对谓词可在首次命中时结束，不生成结果几何。
    for (const subject of subjects) {
        // 不同对象之间的填充区域按集合并集解释。
        for (const clip of clips) {
            // 只有候选对进入原生精确谓词。
            if (BoundsOverlap(subject.bounds, clip.bounds) && BoolRuntime.Run(operation, subject.paths, clip.paths)[0] === 1) {
                return true;
            }
        }
    }
    return false;
};

export { Covers, FastCollision, GetBounds, Intersects, Overlaps };
