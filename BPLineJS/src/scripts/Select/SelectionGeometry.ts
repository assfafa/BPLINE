import { CreateRectLineGeometry } from "bpmatrixjs/Geometry/Rect";
import { Vec2 } from "bpmatrixjs/Math";
import type { Mat3 } from "bpmatrixjs/Math";
import type Camera from "../Camera";
import NGon2D from "../Geometry/NGon2D";
import Poly2D from "../Geometry/Poly2D";
import Rect2D from "../Geometry/Rect2D";
import type Mesh from "../Mesh";
import type Render from "../Render";
import type { SelectPoint } from "./RectSelectTool/RectSelectGeometry";

interface SelectableVertex {
    index: number;
    contourIndex: number;
    position: SelectPoint;
}

interface SelectableEdge {
    index: number;
    contourIndex: number;
    start: SelectPoint;
    end: SelectPoint;
}

interface SelectableContour {
    vertices: SelectableVertex[];
    closed: boolean;
}

type SelectTriangle = [SelectPoint, SelectPoint, SelectPoint];

/**
 * 检查指针是否落在当前渲染画布内，避免侧栏事件选中场景。
 * @param event 浏览器指针事件。
 * @param render 当前渲染器。
 * @example
 * const inside = IsCanvasEvent(event, render);
 * @returns 指针是否位于画布 CSS 区域。
 */
const IsCanvasEvent = (event: MouseEvent, render: Render): boolean => {
    const bounds = render.canvas.getBoundingClientRect();
    return bounds.width > 0 && bounds.height > 0 &&
        event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;
};

/**
 * 变换局部坐标，供轮廓、顶点和三角面使用同一矩阵约定。
 * @param matrix 已更新的 Mesh 世界矩阵。
 * @param x 局部 X。
 * @param y 局部 Y。
 * @example
 * const point = TransformPoint(matrix, x, y);
 * @returns 世界坐标点。
 */
const TransformPoint = (matrix: Mat3, x: number, y: number): SelectPoint => {
    const values = matrix.data;
    return {
        x: values[0] * x + values[3] * y + values[6],
        y: values[1] * x + values[4] * y + values[7],
    };
};

/**
 * 将世界点投影到浏览器视口 CSS 像素，误差半径不随相机缩放变化。
 * @param point 世界坐标点。
 * @param camera 当前相机。
 * @param render 当前渲染器。
 * @example
 * const pixel = ProjectPoint(point, camera, render);
 * @returns 浏览器 clientX/clientY 坐标。
 */
const ProjectPoint = (point: SelectPoint, camera: Camera, render: Render): SelectPoint => {
    const windowPoint = camera.worldToWindow(new Vec2(point.x, point.y), render);
    return { x: windowPoint.x, y: windowPoint.y };
};

/**
 * 从已生成的实体面三角形取得世界坐标，用于精确面积选择。
 * @param mesh 待查询的普通 Mesh。
 * @example
 * const triangles = CreateFillTriangles(mesh);
 * @returns 有面积的实体三角形列表。
 */
const CreateFillTriangles = (mesh: Mesh): SelectTriangle[] => {
    const geometry = mesh.data;
    const triangles: SelectTriangle[] = [];
    // 没有几何的 Mesh 无法提供填充区域。
    if (geometry !== undefined) {
        geometry.ensureGeometry();
        const vertices = geometry.geometry;
        const indices = geometry.index;
        const vertexTypes = geometry.vertexType;
        const matrix = mesh.ensureWorldMatrix();
        // 索引和顶点同时存在时才能组成明确的三角面。
        if (vertices !== undefined && indices !== undefined) {
            // 合并缓冲还含边框及关键点，只保留实体面的三角形。
            for (let offset = 0; offset + 2 < indices.length; offset += 3) {
                const firstIndex = indices[offset];
                const secondIndex = indices[offset + 1];
                const thirdIndex = indices[offset + 2];
                const fillTriangle = vertexTypes === undefined ||
                    (vertexTypes[firstIndex] === 0 && vertexTypes[secondIndex] === 0 && vertexTypes[thirdIndex] === 0);
                // 某些基础几何显式提供其他顶点用途，不能当填充区域。
                if (fillTriangle) {
                    const first = TransformPoint(matrix, vertices[firstIndex * 2], vertices[firstIndex * 2 + 1]);
                    const second = TransformPoint(matrix, vertices[secondIndex * 2], vertices[secondIndex * 2 + 1]);
                    const third = TransformPoint(matrix, vertices[thirdIndex * 2], vertices[thirdIndex * 2 + 1]);
                    const area = (second.x - first.x) * (third.y - first.y) -
                        (second.y - first.y) * (third.x - first.x);
                    // 退化或非法三角形不能构成可选择的二维区域。
                    if (Number.isFinite(area) && Math.abs(area) > Number.EPSILON) {
                        triangles.push([first, second, third]);
                    }
                }
            }
        }
    }
    return triangles;
};

/**
 * 生成保留轮廓顶点编号的世界坐标路径。
 * @param mesh 待查询的普通 Mesh。
 * @example
 * const contours = CreateContours(mesh);
 * @returns 世界坐标轮廓；不含三角剖分的内部边。
 */
const CreateContours = (mesh: Mesh): SelectableContour[] => {
    const geometry = mesh.data;
    const contours: SelectableContour[] = [];
    // 各几何类型的轮廓来源不同，矩形直接复用其生成的 line-list 路径。
    if (geometry instanceof Rect2D) {
        const line = CreateRectLineGeometry(geometry.width, geometry.height, geometry.radius);
        const vertexCount = line.index.length / 2;
        // line-list 的最后一个坐标是闭合接缝，不能重复报告首点。
        if (vertexCount > 0) {
            const matrix = mesh.ensureWorldMatrix();
            const vertices: SelectableVertex[] = [];
            // 顶点和边都沿用实际几何的分段数及顺序。
            for (let index = 0; index < vertexCount; index += 1) {
                const offset = index * 2;
                const position = TransformPoint(matrix, line.geometry[offset], line.geometry[offset + 1]);
                vertices.push({ index, contourIndex: 0, position });
            }
            contours.push({ vertices, closed: true });
        }
    } else if (geometry instanceof NGon2D) {
        // NGon 有独立的外轮廓和可选内孔，不能把两者连成一条路径。
        const matrix = mesh.ensureWorldMatrix();
        const rings = [geometry.outer];
        // 内半径为零时只有外轮廓，正值时增加内孔轮廓。
        if (geometry.inner > 0) {
            rings.push(geometry.inner);
        }
        // 两个环保持独立，避免错误连接内外轮廓。
        for (let ring = 0; ring < rings.length; ring += 1) {
            const vertices: SelectableVertex[] = [];
            // 正多边形顶点编号与外轮廓起始角保持一致。
            for (let index = 0; index < geometry.sides; index += 1) {
                const angle = geometry.startAngle + index * Math.PI * 2 / geometry.sides;
                const x = Math.cos(angle) * rings[ring];
                const y = Math.sin(angle) * rings[ring];
                vertices.push({
                    index: ring * geometry.sides + index,
                    contourIndex: ring,
                    position: TransformPoint(matrix, x, y),
                });
            }
            contours.push({ vertices, closed: geometry.sides > 2 });
        }
    } else if (geometry instanceof Poly2D) {
        // Poly 保留用户输入的原始节点顺序和开放路径设置。
        const matrix = mesh.ensureWorldMatrix();
        const vertices: SelectableVertex[] = [];
        // Poly2D 的输入点正是编辑器关键点，保留原始数组下标。
        for (let offset = 0; offset + 1 < geometry.points.length; offset += 2) {
            vertices.push({
                index: offset / 2,
                contourIndex: 0,
                position: TransformPoint(matrix, geometry.points[offset], geometry.points[offset + 1]),
            });
        }
        contours.push({ vertices, closed: geometry.closed });
    } else if (geometry !== undefined) {
        // 其余几何按实体三角索引构建可识别的边和顶点。
        geometry.ensureGeometry();
        const vertices = geometry.geometry;
        const indices = geometry.index;
        const vertexTypes = geometry.vertexType;
        const matrix = mesh.ensureWorldMatrix();
        // Base2D 和文字使用实体三角面索引；边框和关键点分区不是编辑轮廓。
        if (vertices !== undefined && indices !== undefined) {
            // 每组三个索引构成一块独立三角面。
            for (let offset = 0; offset + 2 < indices.length; offset += 3) {
                const firstIndex = indices[offset];
                const secondIndex = indices[offset + 1];
                const thirdIndex = indices[offset + 2];
                const fillTriangle = vertexTypes === undefined ||
                    (vertexTypes[firstIndex] === 0 && vertexTypes[secondIndex] === 0 && vertexTypes[thirdIndex] === 0);
                // 生成的宽边框三角形不能被误报为 Base2D 或文字自身的边和点。
                if (fillTriangle) {
                    const triangleVertices: SelectableVertex[] = [];
                    // 保留实体顶点原始编号，供去重和编辑器定位。
                    for (let corner = 0; corner < 3; corner += 1) {
                        const index = indices[offset + corner];
                        triangleVertices.push({
                            index,
                            contourIndex: 0,
                            position: TransformPoint(matrix, vertices[index * 2], vertices[index * 2 + 1]),
                        });
                    }
                    contours.push({ vertices: triangleVertices, closed: true });
                }
            }
        }
    }
    return contours;
};

/**
 * 提取轮廓顶点，重复索引只返回一次。
 * @param mesh 待查询的普通 Mesh。
 * @example
 * const vertices = CreateSelectableVertices(mesh);
 * @returns 带顶点编号和世界坐标的列表。
 */
const CreateSelectableVertices = (mesh: Mesh): SelectableVertex[] => {
    const vertices: SelectableVertex[] = [];
    const seen = new Set<number>();
    // 多个三角形共享的顶点按原始编号只报告一次。
    for (const contour of CreateContours(mesh)) {
        // 单个轮廓的顶点保留它在原始几何中的身份。
        for (const vertex of contour.vertices) {
            if (seen.has(vertex.index)) {
                // 已经报告过的索引保持第一次出现的轮廓编号。
            } else {
                seen.add(vertex.index);
                vertices.push(vertex);
            }
        }
    }
    return vertices;
};

/**
 * 提取轮廓边，重复三角形边按无向顶点编号去重。
 * @param mesh 待查询的普通 Mesh。
 * @example
 * const edges = CreateSelectableEdges(mesh);
 * @returns 带边编号和世界端点的列表。
 */
const CreateSelectableEdges = (mesh: Mesh): SelectableEdge[] => {
    const edges: SelectableEdge[] = [];
    const candidates: { key: string; contourIndex: number; start: SelectPoint; end: SelectPoint }[] = [];
    const edgeCounts = new Map<string, number>();
    const geometry = mesh.data;
    const triangleGeometry = geometry !== undefined &&
        !(geometry instanceof Rect2D) && !(geometry instanceof NGon2D) && !(geometry instanceof Poly2D);
    // 各轮廓内部逐段连接，开放路径不补末端到首端的边。
    for (const contour of CreateContours(mesh)) {
        const count = contour.vertices.length;
        let segmentCount = count - 1;
        // 闭合轮廓额外连接最后一点和第一点。
        if (contour.closed && count > 2) {
            segmentCount = count;
        }
        // 每条边关联相邻两个原始顶点。
        for (let segment = 0; segment < segmentCount; segment += 1) {
            const first = contour.vertices[segment];
            const second = contour.vertices[(segment + 1) % count];
            // 重合顶点不能构成可拾取的边，避免退化线段占用半径。
            if (first.position.x !== second.position.x || first.position.y !== second.position.y) {
                const low = Math.min(first.index, second.index);
                const high = Math.max(first.index, second.index);
                const key = `${String(low)}:${String(high)}`;
                const previousCount = edgeCounts.get(key) ?? 0;
                edgeCounts.set(key, previousCount + 1);
                // 首次出现时保留端点；重复出现的三角面边稍后按共享次数过滤。
                if (previousCount === 0) {
                    candidates.push({ key, contourIndex: first.contourIndex, start: first.position, end: second.position });
                }
            }
        }
    }
    // Base2D 与文字的共享三角面边属于内部剖分，不是可编辑轮廓。
    for (const candidate of candidates) {
        // 明确轮廓直接保留；三角索引只保留出现一次的外边。
        if (!triangleGeometry || edgeCounts.get(candidate.key) === 1) {
            edges.push({
                index: edges.length,
                contourIndex: candidate.contourIndex,
                start: candidate.start,
                end: candidate.end,
            });
        }
    }
    return edges;
};

export {
    CreateFillTriangles,
    CreateSelectableEdges,
    CreateSelectableVertices,
    IsCanvasEvent,
    ProjectPoint,
};
export type { SelectableEdge, SelectableVertex, SelectTriangle };
