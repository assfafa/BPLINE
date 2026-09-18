import IMesh from "../IMesh";
import type Camera from "../Camera";
import type { GeoData, GeoPartDataLike } from "../Geometry";
import type { Material2d } from "../global-types";
import type { MeshLike } from "../Mesh";
interface DevelopmentValidatorLike {
    /**
     * 检查 Camera 是否能生成有效矩阵与 Uniform。
     * @param camera 当前 Camera
     * @example
     * developmentValidator.validateCamera(camera);
     * @returns 无返回值
     */
    validateCamera(camera: Camera): void;
    /**
     * 检查材质样式数据和分区配置。
     * @param material 当前材质
     * @example
     * developmentValidator.validateMaterial(material);
     * @returns 无返回值
     */
    validateMaterial(material: Material2d): void;
    /**
     * 检查 Geometry 各缓冲分区的长度、有限值和索引范围。
     * @param geometry 当前 Geometry
     * @example
     * developmentValidator.validateGeometry(geometry);
     * @returns 无返回值
     */
    validateGeometry(geometry: GeoData): void;
    /**
     * 检查 Mesh 的 Geometry 与 Material 是否能组成目标边框绘制模式。
     * @param mesh 当前 Mesh
     * @example
     * developmentValidator.validateMesh(mesh);
     * @returns 无返回值
     */
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
     * @example
     * developmentValidator.validateCamera(camera);
     * @returns 无返回值
     */
    public validateCamera(camera: Camera): void {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(camera.width) || camera.width <= 0) {
            this.error("CAMERA_WIDTH", camera.id, "Camera width 必须是大于 0 的有限数。", camera);
        }
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(camera.height) || camera.height <= 0) {
            this.error("CAMERA_HEIGHT", camera.id, "Camera height 必须是大于 0 的有限数。", camera);
        }
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(camera.zoom) || camera.zoom <= 0) {
            this.error("CAMERA_ZOOM", camera.id, "Camera zoom 必须是大于 0 的有限数。", camera);
        }
    }
    /**
     * 检查材质样式数据和分区配置。
     * @param material 当前材质
     * @example
     * developmentValidator.validateMaterial(material);
     * @returns 无返回值
     */
    public validateMaterial(material: Material2d): void {
        // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
        if (material.transparent && material.depthWrite) {
            this.warn(
                "TRANSPARENT_DEPTH_WRITE",
                material.id,
                "透明混合同时写入深度可能挡住后方透明片元；通常使用 depthTest=true、depthWrite=false。",
                material,
            );
        }
        // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
        if (!material.depthTest && material.depthWrite) {
            this.warn(
                "DEPTH_WRITE_WITHOUT_TEST",
                material.id,
                "已关闭深度测试但仍写深度；它不会检查场景遮挡，通常 UI 两项都关闭。",
                material,
            );
        }
        const { solid, wireframe, edge, points } = material.style;
        // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
        for (const part of [solid, wireframe, edge, points]) {
            // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
            if (!Number.isFinite(part.opacity) || part.opacity < 0 || part.opacity > 1) {
                this.error(
                    "STYLE_OPACITY_" + part.area,
                    material.id,
                    "分区透明度必须位于 0 到 1。",
                    material,
                );
            }
        }
        // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
        for (const part of [solid, edge, points]) {
            // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
            if (part.texture !== undefined && !part.enabled) {
                this.warn(
                    "UNUSED_TEXTURE_" + part.area,
                    material.id,
                    "分区已设置贴图，但 enabled 尚未开启。",
                    material,
                );
            }
        }
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (points.enabled && !points.vertices && !points.midpoints) {
            this.warn(
                "EMPTY_POINT_SELECTION",
                material.id,
                "关键点已开启，但未选择顶点或边中点；不会生成点型。",
                material,
            );
        }
    }
    /**
     * 检查 Geometry 各缓冲分区的长度、有限值和索引范围。
     * @param geometry 当前 Geometry
     * @example
     * developmentValidator.validateGeometry(geometry);
     * @returns 无返回值
     */
    public validateGeometry(geometry: GeoData): void {
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometry.geometry !== undefined) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (
                geometry.normal === undefined ||
                geometry.uv === undefined ||
                geometry.index === undefined ||
                geometry.vertexType === undefined ||
                geometry.position === undefined ||
                geometry.miterScale === undefined
            ) {
                this.error(
                    "GEOMETRY_MISSING",
                    geometry.id,
                    "合并三角面缺少 normal、uv、index、vertexType、position 或 miterScale。",
                    geometry,
                );
            } else {
                const vertexCount: number = geometry.geometry.length / 2;
                this.validatePart(
                    geometry.id,
                    "geometry",
                    {
                        geometry: geometry.geometry,
                        normal: geometry.normal,
                        uv: geometry.uv,
                        index: geometry.index,
                        miterScale: geometry.miterScale,
                    },
                    3,
                    true,
                    geometry,
                );
                /**
                 * 检查合并几何中的顶点用途是否属于支持的三种类型。
                 * @param value 本次输入值
                 * @example
                 * HasInvalidVertexType(value);
                 * @returns 当前类型值是否不受支持。
                 */
                const HasInvalidVertexType = (value: number): boolean =>
                    value !== 0 && value !== 0.5 && value !== 1;
                // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
                if (
                    geometry.vertexType.length !== vertexCount ||
                    geometry.vertexType.some(HasInvalidVertexType)
                ) {
                    this.error(
                        "VERTEX_TYPE",
                        geometry.id,
                        "vertexType 必须逐顶点对应，且只能为 0、0.5、1。",
                        geometry,
                    );
                }
                // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
                if (
                    geometry.position.length !== geometry.geometry.length ||
                    GetInvalidNumberIndex(geometry.position) !== -1
                ) {
                    this.error(
                        "GEOMETRY_POSITION",
                        geometry.id,
                        "position 必须与 geometry 等长且全部为有限数。",
                        geometry,
                    );
                }
                // 按顶点顺序写入坐标及配套属性，保持各数组长度一致。
                for (let offset: number = 0; offset < geometry.index.length; offset += 3) {
                    const type: number = geometry.vertexType[geometry.index[offset]];
                    // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                    if (
                        geometry.vertexType[geometry.index[offset + 1]] !== type ||
                        geometry.vertexType[geometry.index[offset + 2]] !== type
                    ) {
                        this.error(
                            "TRIANGLE_VERTEX_TYPE",
                            geometry.id,
                            "一个三角面的三个顶点必须属于同一 vertexType。",
                            geometry,
                        );
                        break;
                    }
                }
            }
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometry.linePoints !== undefined) {
            this.validatePart(geometry.id, "linePoints", geometry.linePoints, 2, false, geometry);
        }
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (geometry.style.wireframe.enabled && geometry.linePoints === undefined) {
            this.error(
                "WIREFRAME_DATA",
                geometry.id,
                "Geometry wireframe 已开启，但没有生成 linePoints。",
                geometry,
            );
        }
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (
            geometry.style.edge.uvRepeat !== 1 &&
            !geometry.style.wireframe.enabled &&
            !geometry.style.edge.enabled
        ) {
            this.warn("UNUSED_UV_REPEAT", geometry.id, "uvRepeat 只作用于边框，当前值不会被使用。", geometry);
        }
        // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
        if (geometry.uniformData.length !== 4 || GetInvalidNumberIndex(geometry.uniformData) !== -1) {
            this.error(
                "GEOMETRY_UNIFORM",
                geometry.id,
                "Geometry uniformData 必须包含 4 个有限数。",
                geometry,
            );
        }
    }
    /**
     * 检查 Mesh 的 Geometry 与 Material 是否能组成目标边框绘制模式。
     * @param mesh 当前 Mesh
     * @example
     * developmentValidator.validateMesh(mesh);
     * @returns 无返回值
     */
    public validateMesh(mesh: MeshLike): void {
        const geometry = mesh.data;
        const material = mesh.material;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometry !== undefined && material !== undefined) {
            // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
            if (geometry.style.solid.enabled && !["Rect2D", "Poly2D", "NGon2D"].includes(geometry.type)) {
                this.error("UNSUPPORTED_SOLID_TYPE", mesh.id, "未提供该类型的实体面 Shader。", mesh);
            }
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (!(mesh instanceof IMesh)) {
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                if (["Poly2D", "NGon2D"].includes(geometry.type) && material.style.solid.borderWidth > 0) {
                    this.warn(
                        "UNSUPPORTED_SDF_BORDER",
                        mesh.id,
                        "Poly2D/NGon2D 不使用矩形 SDF 边框，请启用 edge 分区。",
                        mesh,
                    );
                }
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                if (
                    geometry.type === "Poly2D" &&
                    (geometry.style.join.type !== material.style.join.type ||
                        geometry.style.join.seg !== material.style.join.seg)
                ) {
                    this.warn(
                        "POLY_JOIN_STYLE",
                        mesh.id,
                        "连接拓扑由 Geometry.style.join 生成，建议几何与材质共享 Style。",
                        mesh,
                    );
                }
                // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
                for (const area of ["solid", "wireframe", "edge", "points"] as const) {
                    // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                    if (geometry.style[area].enabled !== material.style[area].enabled) {
                        this.warn(
                            "STYLE_ENABLED_" + area,
                            mesh.id,
                            "几何与材质的分区开关不同；建议引用同一个 Style。",
                            mesh,
                        );
                    }
                }
                // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                if (
                    geometry.style !== material.style &&
                    geometry.style.edge.enabled &&
                    (geometry.style.edge.width !== material.style.edge.width ||
                        geometry.style.edge.borderAlign !== material.style.edge.borderAlign)
                ) {
                    this.warn(
                        "STYLE_EDGE_PARAMETERS",
                        mesh.id,
                        "几何与材质的实体边框参数不同；几何宽度参与生成，建议共享 Style。",
                        mesh,
                    );
                }
            } else {
                // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                if (geometry.style.wireframe.enabled && mesh.count > 1) {
                    this.warn(
                        "IMESH_NATIVE_LINES",
                        mesh.id,
                        "原生 line-list 使用逐实例顺序回退；只用三角面时才合并为一次绘制。",
                        mesh,
                    );
                }
                // 遍历当前缓存条目，按实际引用关系处理资源。
                for (const raw of mesh.raws.map.values()) {
                    // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                    if (["Poly2D", "NGon2D"].includes(geometry.type) && raw.style.solid.borderWidth > 0) {
                        this.warn(
                            "UNSUPPORTED_SDF_BORDER",
                            mesh.id,
                            "Poly2D/NGon2D 不使用矩形 SDF 边框，请启用 edge 分区。",
                            mesh,
                        );
                    }
                    // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                    if (
                        geometry.type === "Poly2D" &&
                        (raw.style.join.type !== geometry.style.join.type ||
                            raw.style.join.seg !== geometry.style.join.seg)
                    ) {
                        this.warn(
                            "IMESH_JOIN_TEMPLATE",
                            mesh.id,
                            "连接类型和精度由 Geometry.style.join 决定，Raw 不生成独立拓扑。",
                            mesh,
                        );
                    }
                    // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
                    for (const area of ["solid", "wireframe", "edge", "points"] as const) {
                        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                        if (raw.style[area].enabled && !geometry.style[area].enabled) {
                            this.warn(
                                "IMESH_MISSING_" + area,
                                mesh.id,
                                "实例启用了模板未生成的 " + area + " 分区；请先配置 Geometry.style。",
                                mesh,
                            );
                        }
                    }
                    // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
                    for (const area of ["solid", "edge", "points"] as const) {
                        // 处理转向与退化边界，避免零面积三角面或不稳定法线。
                        if (
                            raw.style[area].addressModeU !== material.style[area].addressModeU ||
                            raw.style[area].addressModeV !== material.style[area].addressModeV
                        ) {
                            this.warn(
                                "IMESH_SAMPLER_" + area,
                                mesh.id,
                                "一次绘制共用 Material.style 的采样器，Raw.style 的寻址方式不单独生效。",
                                mesh,
                            );
                        }
                    }
                    // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                    if (
                        raw.style.edge.enabled &&
                        (raw.style.edge.width !== geometry.style.edge.width ||
                            raw.style.edge.uvRepeat !== geometry.style.edge.uvRepeat)
                    ) {
                        this.warn(
                            "IMESH_EDGE_TEMPLATE",
                            mesh.id,
                            "实例实体边框宽度和 UV Repeat 由共用 Geometry.style 生成，Raw 不重建独立几何。",
                            mesh,
                        );
                    }
                    // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
                    if (
                        raw.style.points.enabled &&
                        (raw.style.points.radius !== geometry.style.points.radius ||
                            raw.style.points.segments !== geometry.style.points.segments ||
                            raw.style.points.vertices !== geometry.style.points.vertices ||
                            raw.style.points.midpoints !== geometry.style.points.midpoints ||
                            raw.style.points.minPointsLength !== geometry.style.points.minPointsLength ||
                            raw.style.points.minEdgePointsLength !==
                                geometry.style.points.minEdgePointsLength)
                    ) {
                        this.warn(
                            "IMESH_POINTS_TEMPLATE",
                            mesh.id,
                            "关键点半径、段数、选择规则由共用 Geometry.style 决定。",
                            mesh,
                        );
                    }
                }
                return;
            }
        } else {
            this.error("MESH_RESOURCE", mesh.id, "Mesh 缺少 Geometry 或 Material。", mesh);
            return;
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
     * @example
     * this.validatePart(geometryId, name, data, primitiveSize, requireMiterScale, source);
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
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (data.geometry.length % 2 !== 0) {
            this.error(
                "GEOMETRY_VERTEX_" + name,
                geometryId,
                name + " 顶点数组长度必须是 2 的倍数。",
                source,
            );
        }
        // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
        if (data.normal.length !== data.geometry.length) {
            this.error("GEOMETRY_NORMAL_" + name, geometryId, name + " 法线数量必须与顶点数量一致。", source);
        }
        // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
        if (data.uv.length !== data.geometry.length) {
            this.error("GEOMETRY_UV_" + name, geometryId, name + " UV 数量必须与顶点数量一致。", source);
        }
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (data.index.length % primitiveSize !== 0) {
            this.error(
                "GEOMETRY_INDEX_COUNT_" + name,
                geometryId,
                name + " 索引数量与图元类型不匹配。",
                source,
            );
        }
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (data.geometry.length === 0 || data.index.length === 0) {
            this.warn("EMPTY_GEOMETRY_" + name, geometryId, name + " 不包含可绘制图元。", source);
        }
        // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
        if (
            GetInvalidNumberIndex(data.geometry) !== -1 ||
            GetInvalidNumberIndex(data.normal) !== -1 ||
            GetInvalidNumberIndex(data.uv) !== -1
        ) {
            this.error("GEOMETRY_NUMBER_" + name, geometryId, name + " 包含 NaN 或 Infinity。", source);
        }
        // 逐项处理 data.index，保持集合中的既定顺序。
        for (const index of data.index) {
            // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
            if (index >= vertexCount) {
                this.error(
                    "GEOMETRY_INDEX_RANGE_" + name,
                    geometryId,
                    name + " 存在越界索引 " + String(index) + "。",
                    source,
                );
                break;
            }
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (requireMiterScale && data.miterScale === undefined) {
            this.error("GEOMETRY_MITER_MISSING_" + name, geometryId, name + " 缺少 miterScale。", source);
        } else if (data.miterScale !== undefined) {
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
            if (data.miterScale.length !== vertexCount) {
                this.error(
                    "GEOMETRY_MITER_COUNT_" + name,
                    geometryId,
                    name + " miterScale 数量必须与顶点数量一致。",
                    source,
                );
            }
            // 检查顶点属性长度、数值和索引范围，提前报告不匹配的几何数据。
            if (GetInvalidNumberIndex(data.miterScale) !== -1) {
                this.error(
                    "GEOMETRY_MITER_NUMBER_" + name,
                    geometryId,
                    name + " miterScale 包含 NaN 或 Infinity。",
                    source,
                );
            }
        }
    }
    /**
     * 输出一次开发模式警告。
     * @param code 问题代码
     * @param objectId 对象 ID
     * @param message 问题说明
     * @param source 关联对象
     * @example
     * this.warn(code, objectId, message, source);
     * @returns 无返回值
     */
    private warn(code: string, objectId: number, message: string, source: object): void {
        const key: string = "warn_" + code + "_" + String(objectId);
        // 相同对象的同类诊断只报告一次，避免逐帧刷屏。
        if (!this.reported.has(key)) {
            this.reported.add(key);
            console.warn("[BPLineJS:" + code + "] " + message, source);
        } else {
            return;
        }
    }
    /**
     * 输出一次开发模式错误。
     * @param code 问题代码
     * @param objectId 对象 ID
     * @param message 问题说明
     * @param source 关联对象
     * @example
     * this.error(code, objectId, message, source);
     * @returns 无返回值
     */
    private error(code: string, objectId: number, message: string, source: object): void {
        const key: string = "error_" + code + "_" + String(objectId);
        // 相同对象的同类诊断只报告一次，避免逐帧刷屏。
        if (!this.reported.has(key)) {
            this.reported.add(key);
            console.error("[BPLineJS:" + code + "] " + message, source);
        } else {
            return;
        }
    }
}
/**
 * 获取数组中首个非有限数索引。
 * @param data 待检查数值数组
 * @example
 * GetInvalidNumberIndex(data);
 * @returns 非有限数索引，全部有效时返回 -1
 */
const GetInvalidNumberIndex = (data: ArrayLike<number>): number => {
    // 按索引顺序处理三角面，保持绕序及属性下标一致。
    for (let index = 0; index < data.length; index += 1) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (Number.isFinite(data[index]) === false) {
            return index;
        }
    }
    return -1;
};
export default DevelopmentValidator;
export type { DevelopmentValidatorLike };
