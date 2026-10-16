# 文字原生计算 Text WASM

目录：`bpmatrixjs/src/scripts/Geometry/Wasm`

## 1. 文件结构与作用

C++ 字体解码、HarfBuzz 排版、曲线采样、nonzero 三角化与有界缓存。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `Cache.ts` | Bounded LRU storage with conservative retained-memory accounting. |
| `index.ts` | Shared lazy runtime; importing Geometry alone does not initialize WebAssembly. |
| `LICENSE` | 对应代码或资源的许可说明，打包时保持要求的声明。 |
| `src/` | C++ 字体解码、HarfBuzz 排版、曲线采样、nonzero 三角化与有界缓存。 详见该目录的 agent.md。 |

## 2. index 入口、案例与类接口

### TextWasm

Shared lazy runtime; importing Geometry alone does not initialize WebAssembly.

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_pending`（内部） | `Promise<TextWasmModule> \| undefined`；`由构造参数或初始化过程赋值` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `static ready(): Promise<TextWasmModule>`  | 共享的 WASM 实例，失败后允许重试。 |
| `static async load(): Promise<TextWasmModule>` （内部） | 浏览器、Worker 或 Node 中加载的原生模块。 |
| `static reset(error: unknown): never` （内部） | 释放失败的 Promise 并重新抛错。 |

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `ReadResult` | 脱离 WASM 内存的双精度副本。 |
| `WithText` | 临时复制 UTF-16，保留与 JavaScript 光标相同的码元索引。 |

```ts
ReadResult(module, module._text_stats(id));
```

### 导出关系

```ts
export { ReadResult, TextWasm, WithText };
export type { TextWasmModule };
```

## 3. 其他源码文件

### 文件：Cache.ts

### TextCache

Bounded LRU storage with conservative retained-memory accounting.

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `_entries`（内部） | `按初始化值推断`；`new Map<string, { value: T; bytes: number }>()` | 状态由 `get`、`set`、`clear` 读取或维护；完整处理见对应函数。 |
| `_bytes`（内部） | `按初始化值推断`；`0` | 当前估算字节数。（bytes 的内部状态）。 |
| `hits`（公开） | `按初始化值推断`；`0` | 状态由 `get`、`clear` 读取或维护；完整处理见对应函数。 |
| `misses`（公开） | `按初始化值推断`；`0` | 状态由 `get`、`clear` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `get(key: string): T \| undefined`  | 缓存结果，并更新最近使用顺序。 |
| `set(key: string, value: T, bytes: number): void`  | 无返回值。 |
| `clear(): void`  | 释放缓存并重置统计。 |
| `get bytes(): number`  | 当前估算字节数。 |

### 导出关系

```ts
export { TextCache };
```

## 4. 注意事项

- build:wasm 在 build 生成加载器和 WASM；src 保存 C++。依赖与对象缓存位于根目录 .local/wasm-text。只使用 MIT 依赖，LICENSE 随包复制。注册必须 await，几何创建同步。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">文字 字体 原生 编译 缓存 孔洞</keywords>
<keywords language="en">text font wasm native build cache winding holes</keywords>
```
