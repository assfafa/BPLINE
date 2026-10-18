import { BoolWasmVersion } from "./build/Version.js";
import type { BoolContour, BoolFillRule, BoolShape } from "./types.js";

/** 惰性共享实例；只有首次 ready 异步，后续全部运算同步。 */
class BoolRuntime {
    private static _pending: Promise<void> | undefined;
    private static _module: BoolModule | undefined;

    /** @example await BoolRuntime.Ready(); @returns 加载成功后完成的 Promise，失败可重试。 */
    public static Ready(): Promise<void> {
        BoolRuntime._pending ??= BoolRuntime.Load().catch(BoolRuntime.Reset.bind(BoolRuntime));
        return BoolRuntime._pending;
    }

    /** @example await BoolRuntime.Load(); @returns 初始化共享模块，无返回值。 */
    private static async Load(): Promise<void> {
        const url = new URL("./build/BoolWasm.wasm", import.meta.url);
        let bytes: Uint8Array<ArrayBuffer>;
        // Node file URL 直接读取；浏览器和 Worker 通过构建器输出的资源地址加载。
        if (url.protocol === "file:") {
            const fs = await import("node:fs/promises");
            bytes = new Uint8Array(await fs.readFile(url));
        } else {
            url.searchParams.set("v", BoolWasmVersion);
            const response = await fetch(url);
            // 避免把 404 HTML 当成二进制，报告可定位的资源地址。
            if (response.ok) {
                bytes = new Uint8Array(await response.arrayBuffer());
            } else {
                throw new Error(`Boolean WASM download failed (${String(response.status)}): ${url.href}`);
            }
        }
        const loaded = await WebAssembly.instantiate(bytes, {});
        BoolRuntime._module = loaded.instance.exports as unknown as BoolModule;
    }

    /** @param error 失败原因 @example BoolRuntime.Reset(error); @returns 重新抛出错误，允许再次 ready。 */
    private static Reset(error: unknown): never {
        BoolRuntime._pending = undefined;
        BoolRuntime._module = undefined;
        throw error;
    }

    /** @param operation 原生操作编号 @param a 主轮廓 @param b 剪裁轮廓 @param fill 填充规则 @example BoolRuntime.Run(0, a, b); @returns 独立结果数组，不引用 WASM 内存。 */
    public static Run(operation: number, a: readonly BoolContour[], b: readonly BoolContour[] = [], fill: BoolFillRule = "nonzero"): Float64Array {
        const module = BoolRuntime._module;
        // 初始化状态必须明确，禁止静默返回空几何。
        if (module !== undefined) {
            const input = Pack(a, b);
            const pointer = module.bool_input(input.length);
            // 原生内存增长后重新取得 buffer，防止使用失效的 typed array。
            if (pointer > 0) {
                new Float64Array(module.memory.buffer, pointer, input.length).set(input);
                let rule = 0;
                // evenodd 仅用于显式输入轮廓，三角网始终使用非零填充。
                if (fill === "evenodd") {
                    rule = 1;
                }
                let success: number;
                try {
                    success = module.bool_run(operation, rule);
                } catch (error) {
                    // 原生 panic/trap 后丢弃实例，下一次 ready 可重新初始化。
                    return BoolRuntime.Reset(error);
                }
                // 所有结果先复制，再允许下一次原生计算覆盖工作区。
                if (success === 1) {
                    return new Float64Array(module.memory.buffer, module.bool_output(), module.bool_output_len()).slice();
                } else {
                    const message = new Uint8Array(module.memory.buffer, module.bool_error(), module.bool_error_len());
                    throw new Error(new TextDecoder().decode(message));
                }
            } else {
                throw new RangeError("Boolean input exceeds the native buffer limit.");
            }
        } else {
            throw new Error("Call await Bool.ready() before Boolean operations.");
        }
    }

    /** @param operation 运算编号 @param a 主轮廓 @param b 剪裁轮廓 @param fill 填充规则 @example BoolRuntime.Shapes(1, a, b); @returns 外圈和孔分组的连通分量。 */
    public static Shapes(operation: number, a: readonly BoolContour[], b: readonly BoolContour[] = [], fill: BoolFillRule = "nonzero"): BoolShape[] {
        const values = BoolRuntime.Run(operation, a, b, fill);
        const shapes: BoolShape[] = [];
        let cursor = 1;
        // 原生结果按 shape -> contour -> xy 保存，不能把孔当成独立实体。
        for (let shape = 0; shape < values[0]; shape += 1) {
            const count = values[cursor++];
            const contours: BoolShape = [];
            // 每个 shape 的第一条轮廓为外边界，其余均为孔。
            for (let contour = 0; contour < count; contour += 1) {
                const length = values[cursor++] * 2;
                contours.push(values.slice(cursor, cursor + length));
                cursor += length;
            }
            shapes.push(contours);
        }
        return shapes;
    }
}

interface BoolModule {
    memory: WebAssembly.Memory;
    /** @param length f64 数量 @example module.bool_input(8); @returns 输入地址。 */
    bool_input(length: number): number;
    /** @param operation 操作编号 @param fill 填充规则编号 @example module.bool_run(0, 0); @returns 1 成功。 */
    bool_run(operation: number, fill: number): number;
    /** @example module.bool_output(); @returns 结果地址。 */
    bool_output(): number;
    /** @example module.bool_output_len(); @returns f64 数量。 */
    bool_output_len(): number;
    /** @example module.bool_error(); @returns UTF-8 错误地址。 */
    bool_error(): number;
    /** @example module.bool_error_len(); @returns 错误字节数。 */
    bool_error_len(): number;
}

/** @param a 主轮廓 @param b 剪裁轮廓 @example Pack(a, b); @returns 可直接复制到原生堆的协议数据。 */
const Pack = (a: readonly BoolContour[], b: readonly BoolContour[]): Float64Array => {
    let length = 2 + a.length + b.length;
    // 先计算大小，避免大文本三角网反复扩容或使用展开运算溢出参数栈。
    for (const paths of [a, b]) {
        // 每条路径以点数开头，随后是成对 xy。
        for (const path of paths) {
            length += path.length;
        }
    }
    // 与原生限制一致，在 JS 分配前拒绝超大输入。
    if (length <= 8000000) {
        const values = new Float64Array(length);
        let cursor = 0;
        // 两组轮廓独立编码，原生侧保持 subject/clip 角色。
        for (const paths of [a, b]) {
            values[cursor++] = paths.length;
            // set 接受 ArrayLike，不需要三角网逐点包装成对象。
            for (const path of paths) {
                values[cursor++] = path.length / 2;
                values.set(path, cursor);
                cursor += path.length;
            }
        }
        return values;
    } else {
        throw new RangeError("Boolean input exceeds 8000000 numeric values.");
    }
};

export { BoolRuntime };
