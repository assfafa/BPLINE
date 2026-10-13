# 回归测试 Tests

目录：`bpmatrixjs/tests`

## 1. 文件结构与作用

数学、几何、字体与边界行为的 Node 检查。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `fixtures/` | 数学、几何、字体与边界行为的 Node 检查。 详见该目录的 agent.md。 |
| `math-versions.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `NGon.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `PlanarGeometry.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `PointGeometry.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `PolyWinding.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `readability.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `RectPoints.test.mjs` | 本目录维护的配置、资源或验证文件。 |
| `Text.test.mjs` | 本目录维护的配置、资源或验证文件。 |

## 2. index 入口、案例与类接口

本目录没有 index.ts；由上级入口或对应调用模块引入，不为目录说明额外创建空桶文件。

## 3. 其他源码文件

### 文件：math-versions.test.mjs



### 文件：NGon.test.mjs


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Cross` |  |
| `Validate` |  |

### 文件：PlanarGeometry.test.mjs



### 文件：PointGeometry.test.mjs



### 文件：PolyWinding.test.mjs


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `triangleContains` | 检查采样点是否被顺时针三角面覆盖。 |
| `meshContains` | 查询输出三角网是否覆盖采样点。 |
| `windingAt` | 用独立的水平射线环绕数作为填充真值。 |
| `distanceToSegment` | 排除轮廓边界附近受浮点舍入影响的采样点。 |
| `verifyFill` | 对整个包围盒采样，比较剖分结果与非零环绕规则。 |

```ts
triangleContains(a, b, c, x, y);
```

### 文件：readability.test.mjs


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `Verify` | 诊断列表，仅测试本仓库的可读性规则。 |
| `CheckAbstractFields` | 无返回值，抽象属性和箭头字段都应位于字段区。 |
| `CheckMisplacedFields` | 无返回值，后置字段和后置主类分别报告。 |
| `CheckConstructorDefaults` | 无返回值，直接常量需要迁到字段，参数赋值和绑定操作保留。 |
| `CheckHookDocumentation` | 无返回值，hooks 的 getter 注释应附着到对象成员而非函数内部。 |

```ts
Verify("class A {}", { "class-layout": "error" });
```

### 文件：RectPoints.test.mjs



### 文件：Text.test.mjs


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `TriangleCross` | 计算一个三角面的有向两倍面积。 |
| `ContainsOrigin` | 判断局部原点是否落在任意填充三角面内。 |

```ts
TriangleCross(data, 0);
```

## 4. 注意事项

- 测试以生成数组、拓扑、面积和订阅行为为依据；fixtures 保持确定输入。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">测试 回归 验证 夹具</keywords>
<keywords language="en">test regression validation fixture</keywords>
```
