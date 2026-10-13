import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type Render from "../../Render";
import horizontalCursorSource from "./horizontal.svg?raw";

/** 矩形框局部边角名称；方向由实际屏幕投影确定。 */
type ResizeHandle = "sw" | "se" | "ne" | "nw" | "s" | "e" | "n" | "w";

// 双向箭头每度复用一份 SVG，缓存最多 180 项，不随鼠标移动无限增长。
const resizeCursors = new Map<number, string>();

/**
 * 将屏幕法线转成以中心为热点的旋转箭头。
 * @param direction 屏幕方向，X 向右、Y 向下
 * @example const css = ResizeCursor(new Vec2(1, 1));
 * @returns CSS 光标；退化方向回退为水平箭头。
 */
const ResizeCursor = (direction: Vec2): string => {
    let angle = 0;
    const length = Math.hypot(direction.x, direction.y);
    // 只为有效方向计算角度，零长度边不会生成包含 NaN 的 SVG。
    if (Number.isFinite(length) && length > 0) {
        const degrees = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
        angle = ((Math.round(degrees) % 180) + 180) % 180;
    }
    const cached = resizeCursors.get(angle);
    // 同方向的所有编辑器复用光标字符串，避免重复编码 SVG。
    if (cached === undefined) {
        const source = horizontalCursorSource
            .replace("<path", `<g transform="rotate(${angle.toString()} 128 128)"><path`)
            .replace("</svg>", "</g></svg>");
        let fallback = "ew-resize";
        // 不支持自定义图像光标的平台使用最接近的原生方向。
        if (angle >= 23 && angle < 68) {
            fallback = "nwse-resize";
        } else if (angle >= 68 && angle < 113) {
            // 接近竖直方向时使用原生上下箭头。
            fallback = "ns-resize";
        } else if (angle >= 113 && angle < 158) {
            // 另一组对角方向使用反斜线箭头。
            fallback = "nesw-resize";
        }
        const url = `data:image/svg+xml,${encodeURIComponent(source)}`;
        const cursor = `url("${url}") 16 16, ${fallback}`;
        resizeCursors.set(angle, cursor);
        return cursor;
    } else {
        return cached;
    }
};

/**
 * 投影世界方向，仅计算矩阵线性部分，避免大坐标端点相减损失精度。
 * @param direction 世界方向
 * @param camera 当前相机
 * @param render 提供画布实际 CSS 尺寸的渲染器
 * @example const screen = ProjectCursorDirection(new Vec2(1, 0), camera, render);
 * @returns 屏幕方向，包含相机、投影及 CSS 宽高比例。
 */
const ProjectCursorDirection = (direction: Vec2, camera: Camera, render: Render): Vec2 => {
    camera.ensureCameraMatrix();
    const view = camera.viewMatrix.data;
    const projection = camera.orthogonalMatrix.data;
    const bounds = render.canvas.getBoundingClientRect();
    const viewX = view[0] * direction.x + view[3] * direction.y;
    const viewY = view[1] * direction.x + view[4] * direction.y;
    const ndcX = projection[0] * viewX + projection[3] * viewY;
    const ndcY = projection[1] * viewX + projection[4] * viewY;
    return new Vec2(ndcX * bounds.width * 0.5, -ndcY * bounds.height * 0.5);
};

/**
 * 根据矩形框的显示矩阵计算屏幕法线；四角使用相邻单位法线的角平分线。
 * @param matrix 框或实体的实际显示矩阵，包含父级变换及 ignoreZoom 抵消
 * @param handle 命中的局部边角；没有手柄时返回默认指针
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example const css = FrameResizeCursor(mesh.getRenderMatrix(camera).data, "e", camera, render);
 * @returns 与屏幕边垂直的 CSS 缩放光标。
 */
const FrameResizeCursor = (
    matrix: ArrayLike<number>, handle: ResizeHandle | null | undefined, camera: Camera, render: Render,
): string => {
    const axisX = ProjectCursorDirection(new Vec2(matrix[0], matrix[1]), camera, render);
    const axisY = ProjectCursorDirection(new Vec2(matrix[3], matrix[4]), camera, render);
    const normalX = UnitNormal(axisY);
    const normalY = UnitNormal(axisX);
    normalX.set(-normalX.x, -normalX.y);
    // 镜像后的局部正方向仍指向对应边外侧，角点法线不会错误抵消。
    if (axisX.x * axisY.y - axisX.y * axisY.x < 0) {
        normalX.set(-normalX.x, -normalX.y);
        normalY.set(-normalY.x, -normalY.y);
    }
    let direction: Vec2;
    // 边采用单条法线，角点组合两条相邻法线。
    switch (handle) {
        case "e":
        case "w":
            direction = normalX;
            break;
        case "n":
        case "s":
            direction = normalY;
            break;
        case "ne":
        case "sw":
            direction = new Vec2(normalX.x + normalY.x, normalX.y + normalY.y);
            break;
        case "nw":
        case "se":
            direction = new Vec2(normalY.x - normalX.x, normalY.y - normalX.y);
            break;
        default:
            return "default";
    }
    return ResizeCursor(direction);
};

/**
 * 在屏幕轮廓上寻找最近的顶点或边并生成缩放光标。
 * @param points 按轮廓顺序排列的屏幕顶点
 * @param client 鼠标窗口坐标，与 points 使用相同坐标原点
 * @param radius 顶点优先命中的 CSS 像素容差
 * @example const css = ContourResizeCursor(vertices, client, 10);
 * @returns 顶点夹角方向或最近边的屏幕法线光标。
 */
const ContourResizeCursor = (points: readonly Vec2[], client: Vec2, radius: number): string => {
    let closestVertex = 0;
    let vertexDistance = Infinity;
    let closestEdge = 0;
    let edgeDistance = Infinity;
    // 同时寻找边和角点，保持角点优先，避免边端点处的方向突然跳变。
    for (let index = 0; index < points.length; index++) {
        const start = points[index];
        const end = points[(index + 1) % points.length];
        const distance = Math.hypot(client.x - start.x, client.y - start.y);
        // 只保留离鼠标最近的顶点，重叠顶点也使用稳定顺序。
        if (distance < vertexDistance) {
            vertexDistance = distance;
            closestVertex = index;
        }
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        let factor = 0;
        // 零长度边按端点距离处理，避免投影除以零。
        if (lengthSquared > 0) {
            const projection = ((client.x - start.x) * dx + (client.y - start.y) * dy) / lengthSquared;
            factor = Math.max(0, Math.min(1, projection));
        }
        const distanceToEdge = Math.hypot(client.x - start.x - factor * dx, client.y - start.y - factor * dy);
        // 边命中时用该边的真实屏幕切线求法线。
        if (distanceToEdge < edgeDistance) {
            edgeDistance = distanceToEdge;
            closestEdge = index;
        }
    }
    // 有轮廓才读取相邻点；空轮廓使用稳定的水平光标兜底。
    if (points.length > 1) {
        // 四角或多边形顶点采用相邻边法线的平分线。
        if (vertexDistance <= radius) {
            const previous = points[(closestVertex + points.length - 1) % points.length];
            const current = points[closestVertex];
            const next = points[(closestVertex + 1) % points.length];
            const before = UnitNormal(new Vec2(current.x - previous.x, current.y - previous.y));
            const after = UnitNormal(new Vec2(next.x - current.x, next.y - current.y));
            return ResizeCursor(new Vec2(before.x + after.x, before.y + after.y));
        } else {
            const start = points[closestEdge];
            const end = points[(closestEdge + 1) % points.length];
            return ResizeCursor(UnitNormal(new Vec2(end.x - start.x, end.y - start.y)));
        }
    } else {
        return ResizeCursor(new Vec2(1, 0));
    }
};

/**
 * 将切线旋转 90 度并归一化。
 * @param tangent 屏幕切线
 * @example const normal = UnitNormal(new Vec2(0, 10));
 * @returns 单位法线；退化切线返回零向量。
 */
const UnitNormal = (tangent: Vec2): Vec2 => {
    const length = Math.hypot(tangent.x, tangent.y);
    // 退化边不参与角点的法线组合。
    if (Number.isFinite(length) && length > 0) {
        return new Vec2(-tangent.y / length, tangent.x / length);
    } else {
        return new Vec2(0, 0);
    }
};

export { ContourResizeCursor, FrameResizeCursor, ResizeCursor };
export type { ResizeHandle };
