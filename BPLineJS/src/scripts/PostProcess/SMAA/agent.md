# 形态抗锯齿 SMAA

目录：`bplinejs/src/scripts/PostProcess/SMAA`

## 1. 文件结构与作用

SMAA 1x Medium 的边缘、权重、邻域混合三步骤与官方 LUT。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `area.txt` | 本目录维护的配置、资源或验证文件。 |
| `blend.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `edges.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `index.ts` | SMAA 1x Medium：边缘检测、官方查找表权重、邻域混合；不使用时间历史或多重采样。 |
| `LICENSE` | 对应代码或资源的许可说明，打包时保持要求的声明。 |
| `Lookup.ts` | 官方 SMAA 1x Area/Search 表的同步 CPU 解码；详见本目录 LICENSE。 |
| `search.txt` | 本目录维护的配置、资源或验证文件。 |
| `weights.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |

## 2. index 入口、案例与类接口

### SMAA

SMAA 1x Medium：边缘检测、官方查找表权重、邻域混合；不使用时间历史或多重采样。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"SMAA"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |
| `_lookup`（内部） | `Lookup \| null`；`null` | 状态由 `process` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget`  | 三步骤抗锯齿画面，保持透明背景。 |

### 导出关系

```ts
export default SMAA;
```

## 3. 其他源码文件

### 文件：Lookup.ts

### Lookup

官方 SMAA 1x Area/Search 表的同步 CPU 解码；详见本目录 LICENSE。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `area`（公开） | `Texture`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |
| `search`（公开） | `Texture`；`由构造参数或初始化过程赋值` | 状态由 `constructor` 读取或维护；完整处理见对应函数。 |

#### 构造与案例

```ts
constructor()
```

可直接上传的查找纹理，无网络加载。

```ts
const lookup = new Lookup();
```

### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Decode` | RGBA 查找纹理，提前抵消普通图片上传的 Y 翻转。 |

```ts
Decode(bytes, 160, 80, 2);
```

### 导出关系

```ts
export default Lookup;
```

## 4. 注意事项

- 移植 iryoku/smaa MIT 实现，LICENSE 随 npm 发布。仅 1x Medium，不含时域历史、对角搜索或角落检测。权重是数据附件，不能进行 Alpha 颜色合成；Area 表保留首个 1x 子表。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
- 基于 https://github.com/iryoku/smaa 的 MIT 实现，许可保留在本目录 LICENSE 并随 npm 输出复制。Area 数据只保留 SMAA 1x 使用的第一个子表；表作为源码内嵌，不在运行时请求外部资源。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">抗锯齿 形态 边缘 查找表</keywords>
<keywords language="en">smaa antialiasing edge lookup weights</keywords>
```
