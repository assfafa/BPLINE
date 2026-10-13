import { Vec2 } from "bpmatrixjs/Math";
import type { Point2D } from "bpmatrixjs/Utils";
import { HasSeparatingAxis } from "bpmatrixjs/Utils";
import type Camera from "../Camera";
import type { Geometry2d } from "../global-types";
import type { MeshBoundingRect, MeshLike } from "../Mesh";
import { STYLE_STRIDE } from "../Style";
import type { QuadTreeEntry } from "./QuadTree";
import QuadTree from "./QuadTree";

/** 空间缓存只保存 CPU 引用，资源列表与深度排序仍由完整 drawList 管理。 */
class SceneSpatial {
    private readonly _entries = new Map<MeshLike, QuadTreeEntry>();
    private _tree: QuadTree | null = null;
    private _depth: number = -1;
    private _queryStamp: string = "";
    private _queryOrder: readonly MeshLike[] = [];
    private readonly _queryVersions = new Map<MeshLike, string>();

    /** @example spatial.tree; @returns 最近一次根据场景包围盒构建的树。 */
    public get tree(): QuadTree | null {
        return this._tree;
    }

    /** @param meshes 完整有序列表 @param camera 筛选相机 @param depth 分区深度 @param force 强制重建 @param useQuadTree 是否需要四叉树索引 @example spatial.update(list, camera, 2, false, true); @returns 是否需要刷新当前绘制子集。 */
    public update(meshes: readonly MeshLike[], camera: Camera, depth: number, force: boolean, useQuadTree: boolean): boolean {
        const present = new Set<MeshLike>();
        let changed = force || (useQuadTree && this._depth !== depth);
        camera.ensureCameraMatrix();
        const stamp = [camera.id, camera.version, camera.viewMatrix.version,
            camera.orthogonalMatrix.version, camera.zoomVersion].join("/");
        let queryChanged = force || this._queryStamp !== stamp || this._queryOrder.length !== meshes.length;
        let index = 0;
        // 包围盒自身按几何/矩阵版本缓存；扫描不重新遍历稳定物体的顶点。
        for (const mesh of meshes) {
            // 全屏与自定义变形 Shader 可跳过索引，但仍留在绘制列表。
            if (mesh.culling) {
                mesh.bounding = true;
                const bounds = mesh.getRenderBoundingBox(camera)?.world;
                // 无法计算的范围不裁掉，避免非标准 Shader 的实体意外消失。
                if (bounds !== undefined && IsFiniteBounds(bounds)) {
                    present.add(mesh);
                    const previous = this._entries.get(mesh);
                    // 只有世界范围变化才重新入树，平移相机不修改普通实体的索引。
                    if (previous === undefined || !SameBounds(previous.bounds, bounds)) {
                        this._entries.set(mesh, { mesh, bounds });
                        changed = true;
                    }
                }
            }
            mesh.updateInstanceData();
            const version = [mesh.version, mesh.matrixVersion, mesh.styleVersion, mesh.data?.version,
                mesh.material?.version, mesh.count, mesh.culling, mesh.ignoreZoom].join("/");
            // 颜色/外扩样式、对象顺序和几何缓存也能改变最终查询，不能只看世界范围。
            if (this._queryVersions.get(mesh) !== version || this._queryOrder[index] !== mesh) {
                queryChanged = true;
                this._queryVersions.set(mesh, version);
            }
            index++;
        }
        // 删除、资源清空或关闭裁剪后，旧索引不能继续留下物体引用。
        for (const mesh of this._entries.keys()) {
            // 已不属于有效实体集合的引用必须从空间缓存清除。
            if (!present.has(mesh)) {
                this._entries.delete(mesh);
                changed = true;
            }
        }
        // box 直接使用包围盒缓存，只在 quad 模式维护树。
        if (useQuadTree) {
            // 场景范围或分区深度改变时重建，稳定场景保留树身份。
            if (changed) {
                const entries = [...this._entries.values()];
                const root = UnionBounds(entries);
                this._tree = null;
                // 非空场景才有根区域，空场景不生成无效的无限包围盒。
                if (root !== null) {
                    this._tree = new QuadTree(root, depth);
                    // 每个实体插入一次，跨区物体由父节点保管。
                    for (const entry of entries) {
                        this._tree.insert(entry);
                    }
                }
                this._depth = depth;
            }
        } else {
            this._tree = null;
            this._depth = -1;
        }
        // 引用顺序只在变化时复制，稳定帧复用绘制数组和查询结果。
        if (queryChanged || changed) {
            this._queryOrder = [...meshes];
            this._queryStamp = stamp;
        }
        return queryChanged || changed;
    }

    /** @param meshes 完整有序列表 @param camera 筛选相机 @example spatial.boxList(list, camera); @returns 视口与包围盒相交的物体，顺序保持不变。 */
    public boxList(meshes: readonly MeshLike[], camera: Camera): MeshLike[] {
        const result: MeshLike[] = [];
        // 两组轴的 SAT 同时考虑倾斜相机及世界 AABB，不只用视口的轴向范围。
        for (const mesh of meshes) {
            const entry = this._entries.get(mesh);
            // 屏幕辅助面保持绘制，普通物体按包含外扩的范围测试。
            if (entry === undefined || Visible(entry.bounds, camera, MeshPadding(mesh, camera))) {
                result.push(mesh);
            }
        }
        return result;
    }

    /** @param meshes 完整有序列表 @param camera 筛选相机 @example spatial.quadList(list, camera); @returns 四叉树视口查询结果，跨区物体去重并保留绘制顺序。 */
    public quadList(meshes: readonly MeshLike[], camera: Camera): MeshLike[] {
        const viewport = ViewportBounds(camera);
        // 非有限视口无法安全查询，保守地保留全部实体供开发警报器诊断。
        if (IsFiniteBounds(viewport)) {
            let padding = 0;
            // 索引存储稳定的几何范围；像素边框只扩张查询范围，无需在每次 zoom 时重建普通物体。
            for (const mesh of meshes) {
                padding = Math.max(padding, MeshPadding(mesh, camera));
            }
            const candidates = new Set<MeshLike>();
            this._tree?.query(ExpandBounds(viewport, padding), candidates);
            const result: MeshLike[] = [];
            // 查询命中只改变子集，不能改变 Scene 的排序和深度前缀。
            for (const mesh of meshes) {
                // 不裁剪的自定义屏幕 Shader，以及暂时无法确定范围的物体保持可绘制。
                if (!this._entries.has(mesh) || candidates.has(mesh)) {
                    result.push(mesh);
                }
            }
            return result;
        } else {
            return [...meshes];
        }
    }

    /** @param ids 已删除节点的 ID @example spatial.remove(ids); @returns 无返回值，立即清理索引引用。 */
    public remove(ids: ReadonlySet<number>): void {
        // 节点删除要立即释放索引引用，而不是等待下一次相机变化。
        for (const mesh of this._entries.keys()) {
            // ID 与场景删除集合一致时移除空间记录。
            if (ids.has(mesh.id)) {
                this._entries.delete(mesh);
            }
        }
        // 全屏对象没有树记录，但也可能出现在版本和顺序缓存里。
        for (const mesh of this._queryVersions.keys()) {
            if (ids.has(mesh.id)) {
                // 删除全部 CPU 强引用，避免关闭裁剪的辅助对象留在缓存中。
                this._queryVersions.delete(mesh);
            }
        }
        const order: MeshLike[] = [];
        // 下一帧之前也不保留已删除的对象身份。
        for (const mesh of this._queryOrder) {
            if (!ids.has(mesh.id)) {
                // 未删除实体保留原相对顺序。
                order.push(mesh);
            }
        }
        this._queryOrder = order;
        // 下一次使用时根据剩余节点建立新根，旧树不再引用被删除对象。
        this._tree = null;
        this._depth = -1;
    }
}

interface MeshExtent {
    geometry: Geometry2d | undefined;
    geometryVersion: number | undefined;
    styleVersion: number;
    count: number;
    ignoreZoom: boolean;
    pixelMargin: number;
    viewMargin: number;
}

interface GeometryExtent {
    version: number;
    miter: number;
    pointRadius: number;
}

/** @param bounds 待检范围 @example IsFiniteBounds(bounds); @returns 是否能安全参与空间比较。 */
const IsFiniteBounds = (bounds: MeshBoundingRect): boolean => {
    return [bounds.x, bounds.y, bounds.width, bounds.height, bounds.x + bounds.width,
        bounds.y + bounds.height].every(Number.isFinite) && bounds.width >= 0 && bounds.height >= 0;
};

/** @param left 原范围 @param right 新范围 @example SameBounds(a, b); @returns 四个数值是否相同。 */
const SameBounds = (left: MeshBoundingRect, right: MeshBoundingRect): boolean => {
    return left.x === right.x && left.y === right.y && left.width === right.width && left.height === right.height;
};

/** @param entries 场景物体范围 @example UnionBounds(entries); @returns 整体包围盒，空场景为 null。 */
const UnionBounds = (entries: readonly QuadTreeEntry[]): MeshBoundingRect | null => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // 把所有实体的最小和最大边界累计到一个世界根区域。
    for (const entry of entries) {
        const bounds = entry.bounds;
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    // 至少存在一个有效范围时才构成场景整体包围盒。
    if (Number.isFinite(minX)) {
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    } else {
        return null;
    }
};

/** @param camera 查询相机 @example ViewportBounds(camera); @returns 旋转/父级变换之后的世界视口轴向范围。 */
const ViewportBounds = (camera: Camera): MeshBoundingRect => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    // 视口的四个角覆盖相机旋转及父级带来的完整世界范围。
    for (const x of [-1, 1]) {
        // 上下两角分别反投影，不能仅使用未旋转的宽高。
        for (const y of [-1, 1]) {
            const world = camera.ndcToWorld(new Vec2(x, y));
            minX = Math.min(minX, world.x);
            minY = Math.min(minY, world.y);
            maxX = Math.max(maxX, world.x);
            maxY = Math.max(maxY, world.y);
        }
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/** @param bounds 原范围 @param padding 世界空间扩展半径 @example ExpandBounds(bounds, 2); @returns 保守扩展的范围。 */
const ExpandBounds = (bounds: MeshBoundingRect, padding: number): MeshBoundingRect => {
    return { x: bounds.x - padding, y: bounds.y - padding,
        width: bounds.width + padding * 2, height: bounds.height + padding * 2 };
};

/** @param bounds 世界包围盒 @param camera 筛选相机 @param padding 显示边框扩展 @example Visible(bounds, camera, 2); @returns 是否接触当前视口。 */
const Visible = (bounds: MeshBoundingRect, camera: Camera, padding: number): boolean => {
    const expanded = ExpandBounds(bounds, padding);
    const worldCorners: Point2D[] = [{ x: expanded.x, y: expanded.y },
        { x: expanded.x + expanded.width, y: expanded.y },
        { x: expanded.x + expanded.width, y: expanded.y + expanded.height },
        { x: expanded.x, y: expanded.y + expanded.height }];
    const clip: Point2D[] = [];
    // 将世界轴向框投影成凸轮廓，再对相机视口做双向轴测试。
    for (const corner of worldCorners) {
        const point = camera.worldToNdc(new Vec2(corner.x, corner.y));
        clip.push({ x: point.x, y: point.y });
    }
    const viewport: Point2D[] = [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }];
    return !HasSeparatingAxis(clip, viewport) && !HasSeparatingAxis(viewport, clip);
};

/** @param mesh 物体或实例批次 @param camera 当前相机 @example MeshPadding(mesh, camera); @returns Shader 外扩边框和点型的保守世界半径。 */
const MeshPadding = (mesh: MeshLike, camera: Camera): number => {
    mesh.updateInstanceData();
    const margin = MeshMargin(mesh);
    const world = camera.viewMatrix.clone().invert().data;
    const inverseScale = Math.max(Math.abs(world[0]) + Math.abs(world[3]),
        Math.abs(world[1]) + Math.abs(world[4]));
    const zoom = Math.max(Math.abs(camera.zoom), 1e-30);
    return (margin.viewMargin + margin.pixelMargin / zoom) * inverseScale;
};

const meshExtents = new WeakMap<MeshLike, MeshExtent>();

/** @param mesh 当前物体或实例批次 @example MeshMargin(mesh); @returns 按几何与实例样式版本缓存的外扩尺寸。 */
const MeshMargin = (mesh: MeshLike): MeshExtent => {
    const geometry = mesh.data;
    const cached = meshExtents.get(mesh);
    // 相机变化不要求重新遍历 IMesh 的样式，只有数据和生成参数变化才重新累计。
    if (cached !== undefined && cached.geometry === geometry && cached.geometryVersion === geometry?.version &&
        cached.styleVersion === mesh.styleVersion && cached.count === mesh.count && cached.ignoreZoom === mesh.ignoreZoom) {
        return cached;
    } else {
        let pixelMargin = 1;
        let viewMargin = 0;
        let miter = 1;
        let pointRadius = 0;
        // 顶点外扩尺寸按版本缓存，稳定帧不扫描字体或高精度圆角的顶点。
        if (geometry !== undefined) {
            const margin = GeometryMargin(geometry);
            miter = margin.miter;
            pointRadius = margin.pointRadius;
        }
        // 实例样式可以覆盖线宽/对齐，仅累计一个全批次外扩量。
        for (let index = 0; index < mesh.count; index++) {
            const offset = index * STYLE_STRIDE;
            const style = mesh.styleData;
            let width = Math.abs(geometry?.uniformData[3] ?? 0) * miter;
            // 关闭实体边框的实例不需要扩大其绘制范围。
            if (style[offset + 38] === 0) {
                width = 0;
            }
            // 固定像素边框的世界尺寸按 zoom 抵消，其余使用视图单位。
            if (mesh.ignoreZoom || style[offset + 27] === 0) {
                pixelMargin = Math.max(pixelMargin, width);
            } else {
                viewMargin = Math.max(viewMargin, width);
            }
        }
        // 点型顶点在几何里已有尺寸，固定像素模式仍可能超出放大/缩小后的逻辑包围盒。
        pixelMargin = Math.max(pixelMargin, pointRadius);
        viewMargin = Math.max(viewMargin, pointRadius);
        const extent: MeshExtent = { geometry, geometryVersion: geometry?.version, styleVersion: mesh.styleVersion,
            count: mesh.count, ignoreZoom: mesh.ignoreZoom, pixelMargin, viewMargin };
        meshExtents.set(mesh, extent);
        return extent;
    }
};

const geometryExtents = new WeakMap<Geometry2d, GeometryExtent>();

/** @param geometry 当前生成的几何 @example GeometryMargin(geometry); @returns 外扩连接倍率及点型半径缓存。 */
const GeometryMargin = (geometry: Geometry2d): GeometryExtent => {
    let extent = geometryExtents.get(geometry);
    // 按同一几何版本复用，颜色和相机移动不引发顶点扫描。
    if (extent?.version !== geometry.version) {
        extent = { version: geometry.version, miter: 1, pointRadius: 0 };
        // 尖角的 miter 倍率可能比线宽大，保留其最大外扩量。
        for (const scale of geometry.miterScale ?? []) {
            extent.miter = Math.max(extent.miter, Math.abs(scale));
        }
        const positions = geometry.position;
        const vertices = geometry.geometry;
        // 只有独立点型同时具有顶点和中心，才能计算固定像素的显示半径。
        if (positions !== undefined && vertices !== undefined) {
            // x/y 成对存储，不读取不完整顶点。
            for (let offset = 0; offset + 1 < positions.length; offset += 2) {
                // 边框中心也占 position 数组，只统计点型分区。
                if (geometry.vertexType?.[offset / 2] === 1) {
                    extent.pointRadius = Math.max(extent.pointRadius,
                        Math.hypot(vertices[offset] - positions[offset], vertices[offset + 1] - positions[offset + 1]));
                }
            }
        }
        geometryExtents.set(geometry, extent);
    }
    return extent;
};

export default SceneSpatial;
