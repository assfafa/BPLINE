import { BoundsOverlap, Prepare } from "./Input.js";
import { Contributors, CreateOutput } from "./Output.js";
import { BoolRuntime } from "./Runtime.js";
import type { BoolChange, BoolInput, BoolKeep, BoolResult, BoolShape, PreparedInput } from "./types.js";

/** @param inputs 待合并对象 @example Union([rect, text]); @returns 最多一个结果；不连通或有孔时为 base，空集 items 为空。 */
const Union = (inputs: readonly BoolInput[]): BoolResult => {
    const prepared = Prepare(inputs, "a");
    const shapes = Merge(prepared);
    const result: BoolResult = { items: [], changes: [] };
    const owners = prepared.filter(HasArea);
    // 合并没有面积的输入也要报告 removed，方便调用方清理记录。
    if (shapes.length > 0 && owners.length > 0) {
        const sources = owners.map(Source);
        result.items.push(CreateOutput(shapes, owners[0], 0, sources));
    }
    // 合并只返回一个实体；每个来源都映射到这个结果，不丢失多对一关系。
    for (const input of prepared) {
        let status: BoolChange["status"] = "removed";
        const outputs: number[] = [];
        // 空对象不被标为合并贡献者。
        if (input.shapes.length > 0) {
            outputs.push(0);
            status = "merged";
            // 单一有效输入仅改变结果表示，实体区域没有变化。
            if (owners.length === 1) {
                status = "unchanged";
            }
        }
        result.changes.push({ id: input.input.id, side: "a", status, outputs });
    }
    return result;
};

/** @param a 被剪裁对象 @param b 所有剪裁区域 @example Difference([rect], [circle]); @returns 每个 A 减去 B 并集后的分片及 removed/split 追踪。 */
const Difference = (a: readonly BoolInput[], b: readonly BoolInput[]): BoolResult => {
    const subjects = Prepare(a, "a");
    const clips = Prepare(b, "b");
    const result: BoolResult = { items: [], changes: [] };
    AppendSide(result, subjects, clips, 1);
    AppendOperands(result, clips);
    return result;
};

/** @param a 第一组区域 @param b 第二组区域 @param keep 保留来源侧，默认 a；both 合并交集并追踪双方 @example Intersection(a, b, "b"); @returns 相交实体区域，只有边界接触时为空。 */
const Intersection = (a: readonly BoolInput[], b: readonly BoolInput[], keep: BoolKeep = "a"): BoolResult => {
    return Binary(a, b, keep, 2);
};

/** @param a 第一组区域 @param b 第二组区域 @param keep 默认双方；a 为 A-B，b 为 B-A @example Xor(a, b, "both"); @returns 不相交区域；双方模式输出不重叠的集合分量。 */
const Xor = (a: readonly BoolInput[], b: readonly BoolInput[], keep: BoolKeep = "both"): BoolResult => {
    return Binary(a, b, keep, 3);
};

/** @param a 第一组 @param b 第二组 @param keepValue 来源侧 @param operation 原生操作 @example Binary(a, b, "a", 2); @returns 带来源追踪的集合结果。 */
const Binary = (a: readonly BoolInput[], b: readonly BoolInput[], keepValue: string, operation: number): BoolResult => {
    const subjects = Prepare(a, "a");
    const clips = Prepare(b, "b");
    const result: BoolResult = { items: [], changes: [] };
    // 单侧模式按来源逐个计算，保留该侧对象的材质和业务元数据。
    if (keepValue === "a" || keepValue === "b") {
        let owners = subjects;
        let masks = clips;
        // B 保留模式交换主体，XOR 单侧就等同该侧的减法。
        if (keepValue === "b") {
            owners = clips;
            masks = subjects;
        }
        let rule = 2;
        // 不相交部分只从选择的一侧保留。
        if (operation === 3) {
            rule = 1;
        }
        AppendSide(result, owners, masks, rule);
        AppendOperands(result, masks);
    } else if (keepValue === "both") {
        // 双方保留以真正集合运算去重，避免对称交集双份输出。
        const left = Merge(subjects).flat();
        const right = Merge(clips).flat();
        const shapes = BoolRuntime.Shapes(operation, left, right);
        const all = [...subjects, ...clips];
        const parts = new Map<PreparedInput, number>();
        // 双方模式每个空间分量只输出一次，避免交集生成两份重合几何。
        for (const shape of shapes) {
            const sources = Contributors([shape], all);
            const owner = FindOwner(all, sources[0]);
            // 只生成可归属到输入面积的分量。
            if (owner !== undefined) {
                const part = parts.get(owner) ?? 0;
                result.items.push(CreateOutput([shape], owner, part, sources));
                parts.set(owner, part + 1);
            } else {
                throw new Error("Boolean result has no contributing source.");
            }
        }
        // 每个来源可以映射到零个、一个或多个输出。
        for (const input of all) {
            const outputs: number[] = [];
            // 只比较 id+side，两个操作数组允许使用同一 id。
            for (let index = 0; index < result.items.length; index += 1) {
                // 来源列表已经通过原生面积谓词验证。
                if (HasSource(input, result.items[index].sources)) {
                    outputs.push(index);
                }
            }
            let status: BoolChange["status"] = "modified";
            // 无结果意味着该侧实体区域被运算全部排除。
            if (outputs.length === 0) {
                status = "removed";
            } else if (outputs.length > 1) {
                // 一个来源映射到多个独立分量，需由调用方新增多个实体。
                status = "split";
            } else if (BoolRuntime.Shapes(3, input.paths, shapes[outputs[0]]).length === 0) {
                // 恰好一个相同的区域表示内容未变化。
                status = "unchanged";
            }
            result.changes.push({ id: input.input.id, side: input.source.side, status, outputs });
        }
    } else {
        throw new TypeError("Boolean keep must be a, b or both.");
    }
    return result;
};

/** @param result 累加结果 @param owners 主体 @param masks 剪裁对象 @param operation 减法或交集 @example AppendSide(result, a, b, 1); @returns 无返回值。 */
const AppendSide = (result: BoolResult, owners: PreparedInput[], masks: PreparedInput[], operation: number): void => {
    const clipCache = new Map<string, Float64Array[]>();
    // 相同候选集合只求并集一次；远处 B 不参与局部坐标映射精度选择。
    for (const owner of owners) {
        let shapes: BoolShape[] = [];
        const candidates: PreparedInput[] = [];
        const candidateIds: number[] = [];
        // 宽相位只影响是否需要精确求交，不改变保留来源。
        for (let index = 0; index < masks.length; index += 1) {
            const mask = masks[index];
            // 不相邻的遮罩不参与该对象的贡献分析。
            if (BoundsOverlap(owner.bounds, mask.bounds)) {
                candidates.push(mask);
                candidateIds.push(index);
            }
        }
        // 无候选时减法直接保留，交集则为空。
        if (candidates.length > 0) {
            const key = candidateIds.join(",");
            let clip = clipCache.get(key);
            // 多个 A 使用同一组 B 时复用规范化并集，不重复合并三角网。
            if (clip === undefined) {
                clip = Merge(candidates).flat();
                clipCache.set(key, clip);
            }
            shapes = BoolRuntime.Shapes(operation, owner.paths, clip);
        } else if (operation === 1) {
            // 没有碰撞候选时，减法保留原始区域。
            shapes = owner.shapes;
        }
        const outputs: number[] = [];
        // 剪断后每个连通分量独立返回，有孔的分量仍保留为 base。
        for (let part = 0; part < shapes.length; part += 1) {
            const shape = shapes[part];
            let sources = [{ ...owner.source }];
            // 交集结果保留另一侧的贡献标识；减法中的 B 没有面积贡献。
            if (operation === 2) {
                sources = sources.concat(Contributors([shape], candidates));
            }
            outputs.push(result.items.length);
            result.items.push(CreateOutput([shape], owner, part, sources));
        }
        let status: BoolChange["status"] = "modified";
        // 被减空必须有 change 项，否则调用方无法区分删除和未参与。
        if (outputs.length === 0) {
            status = "removed";
        } else if (outputs.length > 1) {
            // 输出多份意味着一个来源需要生成多个独立实体。
            status = "split";
        } else if (BoolRuntime.Shapes(3, owner.paths, shapes.flat()).length === 0) {
            // 仅表示形式改变时仍记录为 unchanged。
            status = "unchanged";
        }
        result.changes.push({ id: owner.input.id, side: owner.source.side, status, outputs });
    }
};

/** @param inputs 已规范化对象 @example Merge(inputs); @returns 统一绕向下的并集连通分量。 */
const Merge = (inputs: readonly PreparedInput[]): BoolShape[] => {
    const paths: Float64Array[] = [];
    // 每个输入先独立规范化，镜像或反向输入不会在跨对象并集时抵消。
    for (const input of inputs) {
        // 按轮廓追加，避免大集合 spread 调用栈限制。
        for (const path of input.paths) {
            paths.push(path);
        }
    }
    return BoolRuntime.Shapes(4, paths);
};

/** @param result 累加结果 @param inputs 仅作为运算对象的输入 @example AppendOperands(result, masks); @returns 无返回值。 */
const AppendOperands = (result: BoolResult, inputs: readonly PreparedInput[]): void => {
    // 剪裁侧没有被请求替换，不能误报 removed。
    for (const input of inputs) {
        result.changes.push({ id: input.input.id, side: input.source.side, status: "operand", outputs: [] });
    }
};

/** @param input 规范化对象 @example HasArea(input); @returns 是否有实体区域。 */
const HasArea = (input: PreparedInput): boolean => input.shapes.length > 0;
/** @param input 规范化对象 @example Source(input); @returns 来源副本。 */
const Source = (input: PreparedInput) => ({ ...input.source });
/** @param input 匹配目标 @param sources 贡献来源 @example HasSource(input, sources); @returns 是否包含目标 id+side。 */
const HasSource = (input: PreparedInput, sources: PreparedInput["source"][]): boolean => {
    // 来源侧必须一致，同 id 的 A 和 B 是独立操作对象。
    for (const source of sources) {
        // 每个输入只出现一次，找到即可返回。
        if (source.id === input.input.id && source.side === input.source.side) {
            return true;
        }
    }
    return false;
};
/** @param inputs 候选对象 @param source 待定位来源 @example FindOwner(inputs, source); @returns 对应对象或 undefined。 */
const FindOwner = (inputs: readonly PreparedInput[], source: PreparedInput["source"] | undefined): PreparedInput | undefined => {
    // 空贡献集合由调用方作为错误处理。
    if (source !== undefined) {
        // 避免只按 id 匹配到另一侧同名对象。
        for (const input of inputs) {
            // 每一侧 id 唯一，命中即可返回。
            if (input.source.id === source.id && input.source.side === source.side) {
                return input;
            }
        }
    }
    return undefined;
};

export { Difference, Intersection, Merge, Union, Xor };
