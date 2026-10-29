# 快速抗锯齿 FXAA

目录：`bplinejs/src/scripts/PostProcess/FXAA`

## 1. 文件结构与作用

单通道方向搜索与透明边缘友好的预乘混合。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `fragment.wgsl` | WGSL 阶段源码；由对应材质/Helper 以 ?raw 引入。 |
| `index.ts` | 单步骤快速近似抗锯齿，检测亮度与透明轮廓，沿边缘方向混合像素。 |

## 2. index 入口、案例与类接口

### FXAA

单步骤快速近似抗锯齿，检测亮度与透明轮廓，沿边缘方向混合像素。

#### 变量与默认值

| 字段 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `type`（公开） | `string`；`"FXAA"` | 类字段；默认值及类型见本行，使用者由外部接口或继承实现提供。 |

#### 构造与案例

```ts
constructor()
```

开箱即用的 FXAA 通道。

```ts
post.add("fxaa", new FXAA());
```

### 导出关系

```ts
export default FXAA;
```

## 3. 其他源码文件

## 4. 注意事项

- 通常放在效果链末尾，FXAA 和 SMAA 选择其中一个即可。平坦区域透传；透明边缘先预乘再插值，避免黑边。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">抗锯齿 快速 近似 边缘</keywords>
<keywords language="en">fxaa antialiasing approximate edge</keywords>
```
