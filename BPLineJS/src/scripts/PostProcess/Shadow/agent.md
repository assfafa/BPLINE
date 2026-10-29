# 对象阴影 Shadow

目录：`bplinejs/src/scripts/PostProcess/Shadow`

## 1. 文件结构与作用

按 style.shadow 值分组，生成偏移、扩散、内阴影及外阴影。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `composite.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `index.ts` | 对象阴影；外阴影位于场景物体后方、背景前方，内阴影限定在本组轮廓内，参数来自 style.shadow。 |

## 2. index 入口、案例与类接口

### Shadow

对象阴影；外阴影位于场景物体后方、背景前方，内阴影限定在本组轮廓内，参数来自 style.shadow。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"Shadow"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

无显式构造函数，按字段默认值创建；父类如有构造逻辑会依语言规则执行。

#### 函数与访问器

| 签名 | 作用 |
| --- | --- |
| `override process(resources: PresetResources, input: RenderTarget, source: RenderTarget): RenderTarget`  | 合成内外阴影后的画面。 |

### 导出关系

```ts
export default Shadow;
```

## 3. 其他源码文件

## 4. 注意事项

- 参数来自 Style。外阴影合成在输入画面后面，内阴影限定组轮廓；同值对象按联合轮廓处理，正扩散向阴影方向延伸。偏移 X 向右、Y 向上，单位 CSS px。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">阴影 内阴影 外阴影 偏移 扩散</keywords>
<keywords language="en">shadow inner outer offset spread</keywords>
```
