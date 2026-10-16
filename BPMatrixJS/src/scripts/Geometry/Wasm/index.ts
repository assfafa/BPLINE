import CreateTextWasm from "./build/text/TextWasm.js";
import type { TextWasmModule } from "./build/text/TextWasm.js";

/** Shared lazy runtime; importing Geometry alone does not initialize WebAssembly. */
class TextWasm {
    private static _pending: Promise<TextWasmModule> | undefined;

    /** @example await TextWasm.ready(); @returns 共享的 WASM 实例，失败后允许重试。 */
    public static ready(): Promise<TextWasmModule> {
        // Concurrent registrations share initialization and the native handle table.
        TextWasm._pending ??= TextWasm.load().catch(TextWasm.reset.bind(TextWasm));
        return TextWasm._pending;
    }

    /** @example await TextWasm.load(); @returns 浏览器、Worker 或 Node 中加载的原生模块。 */
    private static async load(): Promise<TextWasmModule> {
        const url = new URL("./build/text/TextWasm.wasm", import.meta.url);
        let bytes: Uint8Array;
        // Node file URLs cannot be fetched; bundlers emit the browser URL as a WASM asset.
        if (url.protocol === "file:") {
            const fs = await import("node:fs/promises");
            bytes = await fs.readFile(url);
        } else {
            const response = await fetch(url);
            // Missing assets should report the actual deployment URL.
            if (response.ok) {
                bytes = new Uint8Array(await response.arrayBuffer());
            } else {
                throw new Error(`Text WASM download failed (${String(response.status)}): ${url.href}`);
            }
        }
        return CreateTextWasm({ wasmBinary: bytes });
    }

    /** @param error 加载失败原因 @example TextWasm.reset(error); @returns 释放失败的 Promise 并重新抛错。 */
    private static reset(error: unknown): never {
        TextWasm._pending = undefined;
        throw error;
    }
}

/** @param module 原生模块 @param success 操作状态 @example ReadResult(module, module._text_stats(id)); @returns 脱离 WASM 内存的双精度副本。 */
const ReadResult = (module: TextWasmModule, success: number): Float64Array => {
    // Copy before another native allocation can grow memory or overwrite the result.
    if (success === 1) {
        const start = module._text_result_data() / 8;
        return module.HEAPF64.slice(start, start + module._text_result_size());
    } else {
        const start = module._text_error();
        let end = start;
        // Native errors are null-terminated UTF-8 strings.
        while (end < module.HEAPU8.length && module.HEAPU8[end] !== 0) {
            end += 1;
        }
        throw new Error(new TextDecoder().decode(module.HEAPU8.subarray(start, end)));
    }
};

/**
 * 临时复制 UTF-16，保留与 JavaScript 光标相同的码元索引。
 * @param module 模块 @param text 原文 @param operation 同步原生调用
 * @example WithText(module, text, Shape);
 * @returns 操作结果，临时内存始终释放。
 */
const WithText = <T>(module: TextWasmModule, text: string, operation: (pointer: number, length: number) => T): T => {
    // Bound input allocations while accepting ordinary long documents.
    if (text.length <= 65536) {
        const pointer = module._malloc(Math.max(2, text.length * 2));
        // Allocation failure must never write through address zero.
        if (pointer > 0) {
            try {
                // Copy code units directly; UTF-8 encoding would change cluster indices.
                for (let index = 0; index < text.length; index += 1) {
                    module.HEAPU16[pointer / 2 + index] = text.charCodeAt(index);
                }
                return operation(pointer, text.length);
            } finally {
                module._free(pointer);
            }
        } else {
            throw new Error("Could not allocate Text WASM input.");
        }
    } else {
        throw new RangeError("Text exceeds the 65536 UTF-16 code-unit limit.");
    }
};

export { ReadResult, TextWasm, WithText };
export type { TextWasmModule };
