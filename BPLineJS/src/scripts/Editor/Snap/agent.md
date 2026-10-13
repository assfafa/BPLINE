# 吸附 Snap

目录：`bplinejs/src/scripts/Editor/Snap`

## 1. 文件结构与作用

顶点、边线、交点、细格及旋转候选的屏幕距离比较。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `index.ts` | 四项全部开启的独立吸附配置。；将几何局部点投影到 Mesh 的世界坐标。；判断目标世界点是否落在鼠标的屏幕容差内。 |
| `RotationHandle.ts` | 建立连接线与环形箭头图标；局部单位是屏幕 CSS 像素。 |
| `RotationSnap.ts` | 旋转只改变顶点方向：找出能让源顶点和目标顶点同向的角度。 |
| `UniformScaleSnap.ts` | 沿缩放中心到源顶点的射线，寻找能精确贴合目标顶点的倍率。 |

## 2. index 入口、案例与类接口


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateSnapOptions` | 四项全部开启的独立吸附配置。 |
| `TransformSnapPoint` | 将几何局部点投影到 Mesh 的世界坐标。 |
| `IsNearSnapPoint` | 判断目标世界点是否落在鼠标的屏幕容差内。 |
| `ReadSnapOutline` | 把轮廓节点变换成世界坐标；不读取填充三角化生成的内部顶点。 |
| `CollectSnapGeometry` | 收集可吸附的对象轮廓，一次手势可缓存，避免每帧重建场景拓扑。 |
| `SegmentIntersection` | 两条非平行线段的内部交点；共享端点由顶点开关负责。 |
| `NearbySnapPoints` | 取原始位置附近的顶点、边投影、交点和细格点，统一用屏幕半径筛选。 |
| `FindPointSnap` | 在四类目标中返回离原始指针最近的一项。 |
| `RotationSnapTargets` | 为旋转中的每个源点生成边、交点和网格候选，并保留全部目标顶点射线。 |
| `UniformScaleSnapTargets` | 为等比缩放中的每个源点生成边、交点和网格候选。 |

```ts
const options = CreateSnapOptions();
```

### 类型索引

`SnapOptions`、`SnapSegment`、`SnapGeometry`

### 导出关系

```ts
export {
    CollectSnapGeometry, CreateSnapOptions, FindPointSnap, NearbySnapPoints,
    ReadSnapOutline, RotationSnapTargets, UniformScaleSnapTargets,
};
export type { SnapGeometry, SnapOptions, SnapSegment };
```

## 3. 其他源码文件

### 文件：RotationHandle.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `CreateRotationHandle` | 建立连接线与环形箭头图标；局部单位是屏幕 CSS 像素。 |

```ts
const handle = CreateRotationHandle();
```

### 导出关系

```ts
export { CreateRotationHandle };
```

### 文件：RotationSnap.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `FindRotationSnap` | 旋转只改变顶点方向：找出能让源顶点和目标顶点同向的角度。 |

```ts
const angle = FindRotationSnap({ pivot, sources, targets, rawAngle, stepAngle, cursor, radius, camera, render });
```

### 类型索引

`RotationSnapOptions`

### 导出关系

```ts
export { FindRotationSnap };
export type { RotationSnapOptions };
```

### 文件：UniformScaleSnap.ts


### 顶层函数

| 名称 | 用途 |
| --- | --- |
| `FindUniformScaleSnap` | 沿缩放中心到源顶点的射线，寻找能精确贴合目标顶点的倍率。 |

```ts
const factor = FindUniformScaleSnap(options);
```

### 类型索引

`UniformScaleSnapOptions`

### 导出关系

```ts
export { FindUniformScaleSnap };
export type { UniformScaleSnapOptions };
```

## 4. 注意事项

- 总开关默认关闭，四个分项默认开启；距离以 CSS 屏幕像素比较，步进与吸附按更近的候选决定。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">吸附 顶点 边线 交点 网格 旋转 步进</keywords>
<keywords language="en">snap vertex edge intersection grid rotation step</keywords>
```
