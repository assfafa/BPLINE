import { Mat3 } from "bpmatrixjs/Math";
import type Camera from "../Camera";
import type Mesh from "../Mesh";
import type { MeshBoundingBox } from "../Mesh";
import type { SelectPoint } from "./RectSelectTool/RectSelectGeometry";

/**
 * 使用镜头附近且按 zoom 归一的坐标做面积判断，避免固定像素对象变成极小世界三角面。
 * @param mesh 待查询的普通 Mesh
 * @param camera 当前选择器相机
 * @example const matrix = CreateSelectionMatrix(mesh, camera);
 * @returns 局部几何到选择空间的矩阵，不能作为 Mesh 世界矩阵写回。
 */
const CreateSelectionMatrix = (mesh: Mesh, camera: Camera): Mat3 => {
    const world = mesh.getRenderMatrix(camera).data;
    const origin = camera.ensureWorldMatrix().data;
    const zoom = SelectionZoom(camera);
    return new Mat3().set([
        world[0] * zoom, world[1] * zoom, world[2],
        world[3] * zoom, world[4] * zoom, world[5],
        (world[6] - origin[6]) * zoom, (world[7] - origin[7]) * zoom, world[8],
    ]);
};

/**
 * 将鼠标世界点转换到与几何相同的选择空间。
 * @param point 鼠标对应的世界点
 * @param camera 当前选择器相机
 * @example const point = CreateSelectionPoint(world, camera);
 * @returns 以相机位置为原点、按 zoom 归一的坐标。
 */
const CreateSelectionPoint = (point: SelectPoint, camera: Camera): SelectPoint => {
    const origin = camera.ensureWorldMatrix().data;
    const zoom = SelectionZoom(camera);
    return { x: (point.x - origin[6]) * zoom, y: (point.y - origin[7]) * zoom };
};

/**
 * 把已有局部包围盒变换到选择空间，不经过易丢精度的世界包围盒角点。
 * @param mesh 已开启 bounding 的候选 Mesh
 * @param camera 当前选择器相机
 * @example const bounds = CreateSelectionBounds(mesh, camera);
 * @returns 用于粗筛的选择空间范围；bounding 关闭或没有顶点时为 null。
 */
const CreateSelectionBounds = (mesh: Mesh, camera: Camera): MeshBoundingBox | null => {
    const bounds = mesh.boundingBox;
    // 没有局部边界就无法推导稳定的显示范围。
    if (bounds) {
        const local = bounds.local;
        const matrix = CreateSelectionMatrix(mesh, camera).data;
        const corners = [
            { x: local.x, y: local.y },
            { x: local.x + local.width, y: local.y },
            { x: local.x + local.width, y: local.y + local.height },
            { x: local.x, y: local.y + local.height },
        ];
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        // 仿射变换的局部矩形由四角决定完整轴向范围。
        for (const corner of corners) {
            const x = matrix[0] * corner.x + matrix[3] * corner.y + matrix[6];
            const y = matrix[1] * corner.x + matrix[4] * corner.y + matrix[7];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        return {
            local,
            world: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        };
    } else {
        return null;
    }
};

/**
 * 非法相机输入不参与无限倍率计算，开发诊断仍由 Render 负责。
 * @param camera 当前选择器相机
 * @example const zoom = SelectionZoom(camera);
 * @returns 有效正倍率，无效输入时为 1。
 */
const SelectionZoom = (camera: Camera): number => {
    // 使用与显示矩阵一致的有效倍率条件。
    if (Number.isFinite(camera.zoom) && camera.zoom > 0) {
        return camera.zoom;
    } else {
        return 1;
    }
};

export { CreateSelectionBounds, CreateSelectionMatrix, CreateSelectionPoint };
