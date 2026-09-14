import IMesh from "../IMesh";
import type Camera from "../Camera";
import type { GeoData, GeoPartDataLike } from "../Geometry";
import type { Material2d } from "../global-types";
import type { MeshLike } from "../Mesh";

interface DevelopmentValidatorLike {
    validateCamera(camera: Camera): void;
    validateMaterial(material: Material2d): void;
    validateGeometry(geometry: GeoData): void;
    validateMesh(mesh: MeshLike): void;
}

/**
 * 开发模式 GPUBuffer 数据与渲染配置校验器。
 * 只报告 TypeScript 无法约束的运行时数据问题，并按对象和问题类型去重。
 * @class
 */
class DevelopmentValidator implements DevelopmentValidatorLike {
    private readonly reported: Set<string> = new Set<string>();

    /**
     * 检查 Camera 是否能生成有效矩阵与 Uniform。
     * @param camera 当前 Camera
     * @returns 无返回值
     */
    public validateCamera(camera: Camera): void {
        if (!Number.isFinite(camera.width) || camera.width <= 0) {
            this.error("CAMERA_WIDTH", camera.id, "Camera width 必须是大于 0 的有限数。", camera);
        }
        if (!Number.isFinite(camera.height) || camera.height <= 0) {
            this.error("CAMERA_HEIGHT", camera.id, "Camera height 必须是大于 0 的有限数。", camera);
        }
        if (!Number.isFinite(camera.zoom) || camera.zoom <= 0) {
            this.error("CAMERA_ZOOM", camera.id, "Camera zoom 必须是大于 0 的有限数。", camera);
        }
    }

    /**
     * 检查材质样式数据和分区配置。
     * @param material 当前材质
     * @returns 无返回值
     */
    public validateMaterial(material: Material2d): void {
        if (material.transparent && material.depthWrite) {
            this.warn("TRANSPARENT_DEPTH_WRITE", material.id, "透明混合同时写入深度可能挡住后方透明片元；通常使用 depthTest=true、depthWrite=false。", material);
        }
        if (!material.depthTest && material.depthWrite) {
            this.warn("DEPTH_WRITE_WITHOUT_TEST", material.id, "已关闭深度测试但仍写深度；它不会检查场景遮挡，通常 UI 两项都关闭。", material);
        }
        const { solid, wireframe, edge, points } = material.style;
        for (const part of [solid, wireframe, edge, points]) {
            if (!Number.isFinite(part.opacity) || part.opacity < 0 || part.opacity > 1) {
                this.error("STYLE_OPACITY_" + part.area, material.id, "分区透明度必须位于 0 到 1。", material);
            }
        }
        for (const part of [solid, edge, points]) {
            if (part.texture !== undefined && !part.enabled) {
                this.warn("UNUSED_TEXTURE_" + part.area, material.id, "分区已设置贴图，但 enabled 尚未开启。", material);
            }
        }
        if (points.enabled && !points.vertices && !points.midpoints) {
            this.warn("EMPTY_POINT_SELECTION", material.id, "关键点已开启，但未选择顶点或边中点；不会生成点型。", material);
        }
    }

    /**
     * 检查 Geometry 各缓冲分区的长度、有限值和索引范围。
     * @param geometry 当前 Geometry
     * @returns 无返回值
     */
    public validateGeometry(geometry: GeoData): void {
        if (geometry.geometry !== undefined) {
            if (geometry.normal === undefined || geometry.uv === undefined || geometry.index === undefined
                || geometry.vertexType === undefined || geometry.position === undefined || geometry.miterScale === undefined) {
                this.error("GEOMETRY_MISSING", geometry.id, "合并三角面缺少 normal、uv、index、vertexType、position 或 miterScale。", geometry);
            } else {
                const vertexCount: number = geometry.geometry.length / 2;
                this.validatePart(geometry.id, "geometry", {
                    geometry: geometry.geometry, normal: geometry.normal, uv: geometry.uv,
                    index: geometry.index, miterScale: geometry.miterScale,
                }, 3, true, geometry);
                if (geometry.vertexType.length !== vertexCount
                    || geometry.vertexType.some((value: number): boolean => value !== 0 && value !== 0.5 && value !== 1)) {
                    this.error("VERTEX_TYPE", geometry.id, "vertexType 必须逐顶点对应，且只能为 0、0.5、1。", geometry);
                }
                if (geometry.position.length !== geometry.geometry.length || GetInvalidNumberIndex(geometry.position) !== -1) {
                    this.error("GEOMETRY_POSITION", geometry.id, "position 必须与 geometry 等长且全部为有限数。", geometry);
                }
                for (let offset: number = 0; offset < geometry.index.length; offset += 3) {
                    const type: number = geometry.vertexType[geometry.index[offset]];
                    if (geometry.vertexType[geometry.index[offset + 1]] !== type || geometry.vertexType[geometry.index[offset + 2]] !== type) {
                        this.error("TRIANGLE_VERTEX_TYPE", geometry.id, "一个三角面的三个顶点必须属于同一 vertexType。", geometry);
                        break;
                    }
                }
            }
        }
        if (geometry.linePoints !== undefined) {
            this.validatePart(geometry.id, "linePoints", geometry.linePoints, 2, false, geometry);
        }
        if (geometry.style.wireframe.enabled && geometry.linePoints === undefined) {
            this.error("WIREFRAME_DATA", geometry.id, "Geometry wireframe 已开启，但没有生成 linePoints。", geometry);
        }
        if (geometry.style.edge.uvRepeat !== 1 && !geometry.style.wireframe.enabled && !geometry.style.edge.enabled) {
            this.warn("UNUSED_UV_REPEAT", geometry.id, "uvRepeat 只作用于边框，当前值不会被使用。", geometry);
        }
        if (geometry.uniformData.length !== 4 || GetInvalidNumberIndex(geometry.uniformData) !== -1) {
            this.error("GEOMETRY_UNIFORM", geometry.id, "Geometry uniformData 必须包含 4 个有限数。", geometry);
        }
    }

    /**
     * 检查 Mesh 的 Geometry 与 Material 是否能组成目标边框绘制模式。
     * @param mesh 当前 Mesh
     * @returns 无返回值
     */
    public validateMesh(mesh: MeshLike): void {
        const geometry = mesh.data;
        const material = mesh.material;

        if (geometry === undefined || material === undefined) {
            this.error("MESH_RESOURCE", mesh.id, "Mesh 缺少 Geometry 或 Material。", mesh);
            return;
        }

        if (geometry.style.solid.enabled && geometry.type !== "Rect2d" && geometry.type !== "Poly2D") {
            this.error("UNSUPPORTED_SOLID_TYPE", mesh.id, "未提供该类型的实体面 Shader。", mesh);
        }
        if (mesh instanceof IMesh) {
            if (geometry.style.wireframe.enabled && mesh.count > 1) {
                this.warn("IMESH_NATIVE_LINES", mesh.id, "原生 line-list 使用逐实例顺序回退；只用三角面时才合并为一次绘制。", mesh);
            }
            for (const raw of mesh.raws.map.values()) {
                if (geometry.type === "Poly2D" && raw.style.solid.borderWidth > 0) {
                    this.warn("POLY_SDF_BORDER", mesh.id, "Poly2D 不使用矩形 SDF 边框，请启用 edge 分区。", mesh);
                }
                if (geometry.type === "Poly2D" && (raw.style.join.type !== geometry.style.join.type || raw.style.join.seg !== geometry.style.join.seg)) {
                    this.warn("IMESH_JOIN_TEMPLATE", mesh.id, "连接类型和精度由 Geometry.style.join 决定，Raw 不生成独立拓扑。", mesh);
                }
                for (const area of ["solid", "wireframe", "edge", "points"] as const) {
                    if (raw.style[area].enabled && !geometry.style[area].enabled) {
                        this.warn("IMESH_MISSING_" + area, mesh.id, "实例启用了模板未生成的 " + area + " 分区；请先配置 Geometry.style。", mesh);
                    }
                }
                for (const area of ["solid", "edge", "points"] as const) {
                    if (raw.style[area].addressModeU !== material.style[area].addressModeU
                        || raw.style[area].addressModeV !== material.style[area].addressModeV) {
                        this.warn("IMESH_SAMPLER_" + area, mesh.id, "一次绘制共用 Material.style 的采样器，Raw.style 的寻址方式不单独生效。", mesh);
                    }
                }
                if (raw.style.edge.enabled && (raw.style.edge.width !== geometry.style.edge.width
                    || raw.style.edge.uvRepeat !== geometry.style.edge.uvRepeat)) {
                    this.warn("IMESH_EDGE_TEMPLATE", mesh.id, "实例实体边框宽度和 UV Repeat 由共用 Geometry.style 生成，Raw 不重建独立几何。", mesh);
                }
                if (raw.style.points.enabled && (raw.style.points.radius !== geometry.style.points.radius
                    || raw.style.points.segments !== geometry.style.points.segments
                    || raw.style.points.vertices !== geometry.style.points.vertices
                    || raw.style.points.midpoints !== geometry.style.points.midpoints
                    || raw.style.points.minPointsLength !== geometry.style.points.minPointsLength
                    || raw.style.points.minEdgePointsLength !== geometry.style.points.minEdgePointsLength)) {
                    this.warn("IMESH_POINTS_TEMPLATE", mesh.id, "关键点半径、段数、选择规则由共用 Geometry.style 决定。", mesh);
                }
            }
            return;
        }
        if (geometry.type === "Poly2D" && material.style.solid.borderWidth > 0) {
            this.warn("POLY_SDF_BORDER", mesh.id, "Poly2D 不使用矩形 SDF 边框，请启用 edge 分区。", mesh);
        }
        if (geometry.type === "Poly2D" && (geometry.style.join.type !== material.style.join.type || geometry.style.join.seg !== material.style.join.seg)) {
            this.warn("POLY_JOIN_STYLE", mesh.id, "连接拓扑由 Geometry.style.join 生成，建议几何与材质共享 Style。", mesh);
        }
        for (const area of ["solid", "wireframe", "edge", "points"] as const) {
            if (geometry.style[area].enabled !== material.style[area].enabled) {
                this.warn("STYLE_ENABLED_" + area, mesh.id, "几何与材质的分区开关不同；建议引用同一个 Style。", mesh);
            }
        }
        if (geometry.style !== material.style && geometry.style.edge.enabled
            && (geometry.style.edge.width !== material.style.edge.width
                || geometry.style.edge.borderAlign !== material.style.edge.borderAlign)) {
            this.warn("STYLE_EDGE_PARAMETERS", mesh.id, "几何与材质的实体边框参数不同；几何宽度参与生成，建议共享 Style。", mesh);
        }
    }

    /**
     * 检查单个几何缓冲分区。
     * @param geometryId Geometry ID
     * @param name 缓冲分区名
     * @param data CPU 几何数据
     * @param primitiveSize 每个图元使用的索引数
     * @param requireMiterScale 是否要求 miterScale
     * @param source 日志附带对象
     * @returns 无返回值
     */
    private validatePart(
        geometryId: number,
        name: string,
        data: GeoPartDataLike,
        primitiveSize: 2 | 3,
        requireMiterScale: boolean,
        source: object,
    ): void {
        const vertexCount: number = data.geometry.length / 2;

        if (data.geometry.length % 2 !== 0) {
            this.error("GEOMETRY_VERTEX_" + name, geometryId, name + " 顶点数组长度必须是 2 的倍数。", source);
        }
        if (data.normal.length !== data.geometry.length) {
            this.error("GEOMETRY_NORMAL_" + name, geometryId, name + " 法线数量必须与顶点数量一致。", source);
        }
        if (data.uv.length !== data.geometry.length) {
            this.error("GEOMETRY_UV_" + name, geometryId, name + " UV 数量必须与顶点数量一致。", source);
        }
        if (data.index.length % primitiveSize !== 0) {
            this.error("GEOMETRY_INDEX_COUNT_" + name, geometryId, name + " 索引数量与图元类型不匹配。", source);
        }
        if (data.geometry.length === 0 || data.index.length === 0) {
            this.warn("EMPTY_GEOMETRY_" + name, geometryId, name + " 不包含可绘制图元。", source);
        }
        if (
            GetInvalidNumberIndex(data.geometry) !== -1
            || GetInvalidNumberIndex(data.normal) !== -1
            || GetInvalidNumberIndex(data.uv) !== -1
        ) {
            this.error("GEOMETRY_NUMBER_" + name, geometryId, name + " 包含 NaN 或 Infinity。", source);
        }

        for (const index of data.index) {
            if (index >= vertexCount) {
                this.error("GEOMETRY_INDEX_RANGE_" + name, geometryId, name + " 存在越界索引 " + String(index) + "。", source);
                break;
            }
        }

        if (requireMiterScale && data.miterScale === undefined) {
            this.error("GEOMETRY_MITER_MISSING_" + name, geometryId, name + " 缺少 miterScale。", source);
        } else if (data.miterScale !== undefined) {
            if (data.miterScale.length !== vertexCount) {
                this.error("GEOMETRY_MITER_COUNT_" + name, geometryId, name + " miterScale 数量必须与顶点数量一致。", source);
            }
            if (GetInvalidNumberIndex(data.miterScale) !== -1) {
                this.error("GEOMETRY_MITER_NUMBER_" + name, geometryId, name + " miterScale 包含 NaN 或 Infinity。", source);
            }
        }
    }

    /**
     * 输出一次开发模式警告。
     * @param code 问题代码
     * @param objectId 对象 ID
     * @param message 问题说明
     * @param source 关联对象
     * @returns 无返回值
     */
    private warn(code: string, objectId: number, message: string, source: object): void {
        const key: string = "warn_" + code + "_" + String(objectId);

        if (this.reported.has(key)) {
            return;
        }

        this.reported.add(key);
        console.warn("[BPLineJS:" + code + "] " + message, source);
    }

    /**
     * 输出一次开发模式错误。
     * @param code 问题代码
     * @param objectId 对象 ID
     * @param message 问题说明
     * @param source 关联对象
     * @returns 无返回值
     */
    private error(code: string, objectId: number, message: string, source: object): void {
        const key: string = "error_" + code + "_" + String(objectId);

        if (this.reported.has(key)) {
            return;
        }

        this.reported.add(key);
        console.error("[BPLineJS:" + code + "] " + message, source);
    }
}

/**
 * 获取数组中首个非有限数索引。
 * @param data 待检查数值数组
 * @returns 非有限数索引，全部有效时返回 -1
 */
const GetInvalidNumberIndex = (data: ArrayLike<number>): number => {
    for (let index = 0; index < data.length; index += 1) {
        if (!Number.isFinite(data[index])) {
            return index;
        }
    }

    return -1;
};

export default DevelopmentValidator;
export type { DevelopmentValidatorLike };
