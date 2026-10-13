import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type Camera from "../Camera";
import type { GeoData, GeoPartDataLike } from "../Geometry/Geo";
import IMesh from "../IMesh";
import ngonVertexShader from "../Material/wgsls/base/ngon/vertex.wgsl?raw";
import polyVertexShader from "../Material/wgsls/base/poly/vertex.wgsl?raw";
import rectVertexShader from "../Material/wgsls/base/rect/vertex.wgsl?raw";
import type Scene from "../Scene";
import { STYLE_STRIDE } from "../Style";
import type { Material2d } from "../global-types";
import DepthManager from "./DepthManager";
import DevelopmentValidator from "./DevelopmentValidator";
import type { GeometryBufferLike, GeometryBufferPartLike, PipelineLike, RenderMode } from "./types";

/**
 * 管理当前 Render 对应的 Camera、Material、Mesh 和 Geometry GPUBuffer。
 * @class
 */
class BufferManager implements BufferManagerLike {
    private readonly pipeline: PipelineLike;
    private readonly depthManager: DepthManager;
    private readonly developmentValidator: DevelopmentValidator = new DevelopmentValidator();
    private _cameraSnapshot:
        | {
            camera: Camera;
            view: Mat3;
            viewVersion: number;
            projection: Mat3;
            projectionVersion: number;
            zoom: number;
            dpr: number;
            relative: boolean;
        }
        | undefined;
    private readonly _validatedMaterials = new WeakMap<Material2d, number>();
    /**
     * 创建缓冲管理器。
     * @param pipeline 当前 Render 的共享管线资源
     * @example
     * const bufferManager = new BufferManager(pipeline);
     * @returns 创建的 BufferManager 对象。
     */
    public constructor(pipeline: PipelineLike) {
        this.pipeline = pipeline;
        this.depthManager = new DepthManager(pipeline);
    }
    /**
     * 创建或更新当前场景需要的 GPUBuffer。
     * @param scene 场景对象
     * @param camera 相机对象
     * @param dpr 当前设备像素比
     * @param renderMode 当前 Render 运行模式
     * @example
     * bufferManager.draw(scene, camera, dpr, renderMode);
     * @returns 无返回值
     */
    public draw(scene: Scene, camera: Camera, dpr: number, renderMode: RenderMode): void {
        const device: GPUDevice | undefined = this.pipeline.device;
        // GPU 设备及上下文就绪后才能创建或提交渲染资源。
        if (device !== undefined) {
            // 开发模式执行诊断，生产模式不承担检查和日志成本。
            if (renderMode === "development") {
                this.developmentValidator.validateCamera(camera);
            }
            this.drawCameraBuffers(device, camera, dpr);
            this.drawGeometryBuffers(device, scene, renderMode);
            this.prepareMaterials(scene, renderMode);
            this.drawCustomValueBuffers(device, scene);
            this.drawMeshBuffers(device, scene, camera, renderMode);
            this.depthManager.prepare(scene);
        } else {
            return;
        }
    }
    /**
     * 按 materialList 检查材质，共享材质每个版本只检查一次。
     * 材质显示数值的 GPU 存储属于 Mesh 实例数组，不在这里重复创建一份缓冲。
     * @param scene 场景对象
     * @param renderMode production 跳过开发检查
     * @example
     * this.prepareMaterials(scene, renderMode);
     * @returns 无返回值。
     */
    private prepareMaterials(scene: Scene, renderMode: RenderMode): void {
        // 开发模式执行诊断，生产模式不承担检查和日志成本。
        if (renderMode === "development") {
            // 按去重后的材质列表处理共享状态。
            for (const material of scene.materialList) {
                // 比较当前版本与处理快照，只同步尚未处理的变化。
                if (this._validatedMaterials.get(material) !== material.version) {
                    this.developmentValidator.validateMaterial(material);
                    this._validatedMaterials.set(material, material.version);
                } else {
                    continue;
                }
            }
        } else {
            return;
        }
    }
    /**
     * 上传材质具名数值；同尺寸字段只更新原有 GPUBuffer，不改变绑定。
     * @param device 当前设备
     * @param scene 当前场景
     * @example
     * this.drawCustomValueBuffers(device, scene);
     * @returns 无返回值。
     */
    private drawCustomValueBuffers(device: GPUDevice, scene: Scene): void {
        // 仅场景当前引用的材质需要持有具名值缓冲。
        for (const material of scene.materialList) {
            const values = material.values;
            // 普通材质没有 group(2) 的传值。
            if (values === undefined) {
                continue;
            }
            let resources = this.pipeline.customValues.get(material.id);
            // 每个材质持有独立数值缓冲，但同布局可以共享 Pipeline。
            if (resources === undefined) {
                resources = { buffers: new Map() };
                this.pipeline.customValues.set(material.id, resources);
            }
            const activeNames = new Set<string>();
            // 只上传数值字段；贴图由 TextureManager 准备。
            for (const entry of values.entries) {
                // 纹理字段无需 GPUBuffer。
                if (entry.kind === "texture") {
                    continue;
                }
                activeNames.add(entry.name);
                const existing = resources.buffers.get(entry.name);
                let objectVersion = 0;
                // 数学对象有自身版本，原地修改也能被观察到。
                if (entry.value instanceof Vec2 || entry.value instanceof Mat3) {
                    objectVersion = entry.value.version;
                }
                let byteLength = 4;
                // 先比较大小和版本，稳定帧避免创建临时数组。
                if (entry.value instanceof Vec2) {
                    byteLength = 8;
                }
                // Mat3 的 WGSL uniform 每列需要 16 字节。
                if (entry.value instanceof Mat3) {
                    byteLength = 48;
                }
                // Float32Array 使用自身的紧凑 storage 长度。
                if (entry.value instanceof Float32Array) {
                    byteLength = entry.value.byteLength;
                }
                // 长度变化需要新 GPUBuffer 和 BindGroup。
                // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- 显式检查使 else 分支保持 existing 的类型收窄。
                if (existing === undefined || existing.byteLength !== byteLength) {
                    existing?.buffer.destroy();
                    let usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
                    // 数组使用只读 storage 绑定。
                    if (entry.kind === "array<f32>") {
                        usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
                    }
                    const data = values.getBufferData(entry);
                    const buffer = this.createBuffer(
                        device,
                        "Material " + String(material.id) + " Value " + entry.name,
                        data,
                        usage,
                    );
                    resources.buffers.set(entry.name, {
                        buffer,
                        byteLength,
                        value: entry.value,
                        valueVersion: objectVersion,
                        storeVersion: values.version,
                    });
                    resources.bindGroup = undefined;
                } else {
                    // 同尺寸且值变化时只写入原缓冲，不更换绑定。
                    if (existing.value !== entry.value || existing.valueVersion !== objectVersion || existing.storeVersion !== values.version) {
                        const data = values.getBufferData(entry);
                        device.queue.writeBuffer(existing.buffer, 0, data);
                        existing.value = entry.value;
                        existing.valueVersion = objectVersion;
                        existing.storeVersion = values.version;
                    }
                }
            }
            // 移除已从 raw.value 中删除的字段缓冲。
            for (const [name, resource] of resources.buffers) {
                // 保留当前布局仍在使用的字段。
                if (!activeNames.has(name)) {
                    resource.buffer.destroy();
                    resources.buffers.delete(name);
                    resources.bindGroup = undefined;
                }
            }
        }
    }
    /**
     * 创建并写入基础 GPUBuffer。
     * @param device 当前 Render 对应的 WebGPU 设备
     * @param label GPU 调试标签
     * @param data 首次写入的缓冲数据
     * @param usage 缓冲用途标记
     * @example
     * this.createBuffer(device, label, data, usage);
     * @returns 已写入数据的 GPUBuffer
     */
    private createBuffer(
        device: GPUDevice,
        label: string,
        data: GPUAllowSharedBufferSource,
        usage: GPUBufferUsageFlags,
    ): GPUBuffer {
        const buffer: GPUBuffer = device.createBuffer({
            label,
            size: data.byteLength,
            usage,
        });
        device.queue.writeBuffer(buffer, 0, data);
        return buffer;
    }
    /**
     * 按当前 Render 自己的矩阵身份和版本快照上传相机数据。
     * @param device WebGPU 设备
     * @param camera 相机对象
     * @param dpr 设备像素比
     * @example
     * this.drawCameraBuffers(device, camera, dpr);
     * @returns 无返回值。
     */
    private drawCameraBuffers(device: GPUDevice, camera: Camera, dpr: number): void {
        camera.ensureCameraMatrix();
        const relative = this.useCameraRelativeMatrices(camera);
        let viewData = camera.viewMatrix.GPUData;
        // 高倍率时让 GPU 只处理镜头附近的小数值，避免两个巨大 f32 位移相减跳像素。
        if (relative) {
            viewData = new Float32Array(viewData);
            viewData[8] = 0;
            viewData[9] = 0;
        }
        const buffers: GPUBuffer[] = this.pipeline.buffers.cameraUniform;
        const previous = this._cameraSnapshot;
        const cameraChanged: boolean = previous?.camera !== camera;
        const viewChanged: boolean =
            cameraChanged ||
            previous?.view !== camera.viewMatrix ||
            previous.viewVersion !== camera.viewMatrix.version ||
            previous.relative !== relative;
        const projectionChanged: boolean =
            cameraChanged ||
            previous?.projection !== camera.orthogonalMatrix ||
            previous.projectionVersion !== camera.orthogonalMatrix.version;
        const parametersChanged: boolean =
            cameraChanged || previous?.zoom !== camera.zoom || previous.dpr !== dpr;
        const created: boolean = buffers.length === 0;
        // 第一次使用时分配相机缓冲，后续帧只更新变化内容。
        if (created) {
            buffers.push(
                this.createBuffer(
                    device,
                    "Camera View Matrix Buffer",
                    viewData,
                    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                ),
                this.createBuffer(
                    device,
                    "Camera Orthogonal Matrix Buffer",
                    camera.orthogonalMatrix.GPUData,
                    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                ),
                this.createBuffer(
                    device,
                    "Render Camera Parameters Buffer",
                    new Float32Array([camera.zoom, dpr, 0, 0]),
                    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                ),
            );
        } else {
            // 相机视图改变时上传视图矩阵，不重复创建 GPUBuffer。
            if (viewChanged) {
                device.queue.writeBuffer(buffers[0], 0, viewData);
            }
            // 视口或缩放改变投影后，只更新投影矩阵缓冲。
            if (projectionChanged) {
                device.queue.writeBuffer(buffers[1], 0, camera.orthogonalMatrix.GPUData);
            }
            // zoom 或 DPR 改变时同步着色器使用的相机参数。
            if (parametersChanged) {
                device.queue.writeBuffer(buffers[2], 0, new Float32Array([camera.zoom, dpr, 0, 0]));
            }
        }
        // 上传完成后记录本 Render 的处理快照，不清除共享相机版本。
        if (created || viewChanged || projectionChanged || parametersChanged) {
            this._cameraSnapshot = {
                camera,
                view: camera.viewMatrix,
                viewVersion: camera.viewMatrix.version,
                projection: camera.orthogonalMatrix,
                projectionVersion: camera.orthogonalMatrix.version,
                zoom: camera.zoom,
                dpr,
                relative,
            };
        }
    }
    /**
     * 创建或更新每个 Mesh 的连续矩阵与样式 Storage 数组，分别对比版本。
     * @param device 当前 WebGPU 设备
     * @param scene 场景对象
     * @param camera 当前相机，决定高倍率下的相对坐标原点
     * @param renderMode 当前 Render 运行模式
     * @example
     * this.drawMeshBuffers(device, scene, camera, renderMode);
     * @returns 无返回值
     */
    private drawMeshBuffers(device: GPUDevice, scene: Scene, camera: Camera, renderMode: RenderMode): void {
        const relative = this.useCameraRelativeMatrices(camera);
        const cameraWorld = camera.ensureWorldMatrix().data;
        const originX = cameraWorld[6];
        const originY = cameraWorld[7];
        // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
        for (const mesh of scene.drawList) {
            // 开发模式执行诊断，生产模式不承担检查和日志成本。
            if (
                renderMode === "development" &&
                (mesh.geometryPending ||
                    mesh.materialPending ||
                    !this.pipeline.buffers.meshStyle.has(mesh.id))
            ) {
                this.developmentValidator.validateMesh(mesh);
            }
            const material = mesh.material;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (material !== undefined) {
                mesh.updateInstanceData();
                let zoomScale = 1;
                // 固定尺寸只缩放每件实体的局部轴，不移动 Mesh 或实例的世界原点。
                if (mesh.ignoreZoom && Number.isFinite(camera.zoom) && camera.zoom > 0) {
                    zoomScale = 1 / camera.zoom;
                }
                // 区分空数据和有效内容，空集合不创建可绘制资源。
                if (mesh.count !== 0) {
                    const limit: number = Math.min(
                        device.limits.maxBufferSize,
                        device.limits.maxStorageBufferBindingSize,
                    );
                    // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
                    if (mesh.matrixData.byteLength > limit || mesh.styleData.byteLength > limit) {
                        throw new RangeError(
                            "Mesh " +
                                String(mesh.id) +
                                " capacity exceeds this GPUDevice storage buffer limit: " +
                                String(limit) +
                                " bytes.",
                        );
                    }
                    const matrixBuffers = this.pipeline.buffers.meshMatrix;
                    let matrixBuffer = matrixBuffers.get(mesh.id);
                    // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
                    if (matrixBuffer !== undefined && matrixBuffer.capacity !== mesh.capacity) {
                        matrixBuffer.buffer.destroy();
                        matrixBuffers.delete(mesh.id);
                        matrixBuffer = undefined;
                    }
                    // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                    if (matrixBuffer === undefined) {
                        let matrixData = mesh.matrixData;
                        // 每个 Render 独立上传相机相对矩阵，不修改 Mesh 的原始实例数据。
                        if (relative || zoomScale !== 1) {
                            matrixData = this.renderMatrices(mesh, camera, relative, originX, originY, zoomScale);
                        }
                        matrixBuffer = {
                            meshId: mesh.id,
                            capacity: mesh.capacity,
                            version: mesh.matrixVersion,
                            relative,
                            originX,
                            originY,
                            zoomScale,
                            buffer: this.createBuffer(
                                device,
                                "Mesh " + String(mesh.id) + " Instance Matrices",
                                matrixData,
                                GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                            ),
                        };
                        matrixBuffers.set(mesh.id, matrixBuffer);
                    } else if (matrixBuffer.version !== mesh.matrixVersion ||
                        matrixBuffer.zoomScale !== zoomScale ||
                        matrixBuffer.relative !== relative ||
                        (relative && (matrixBuffer.originX !== originX || matrixBuffer.originY !== originY))) {
                        // 比较当前版本与处理快照，只同步尚未处理的变化。
                        let matrixData = mesh.matrixData;
                        // 高倍率需要与当前镜头同源的相对矩阵。
                        if (relative || zoomScale !== 1) {
                            matrixData = this.renderMatrices(mesh, camera, relative, originX, originY, zoomScale);
                        }
                        device.queue.writeBuffer(matrixBuffer.buffer, 0, matrixData, 0, mesh.count * 12);
                        matrixBuffer.version = mesh.matrixVersion;
                        matrixBuffer.relative = relative;
                        matrixBuffer.originX = originX;
                        matrixBuffer.originY = originY;
                        matrixBuffer.zoomScale = zoomScale;
                    }
                    let styleBuffer = this.pipeline.buffers.meshStyle.get(mesh.id);
                    // 检查容量与设备限制，避免向尺寸不足的缓冲写入数据。
                    if (styleBuffer !== undefined && styleBuffer.capacity !== mesh.capacity) {
                        styleBuffer.buffer.destroy();
                        this.pipeline.buffers.meshStyle.delete(mesh.id);
                        styleBuffer = undefined;
                    }
                    // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                    if (styleBuffer === undefined) {
                        this.pipeline.buffers.meshStyle.set(mesh.id, {
                            meshId: mesh.id,
                            materialId: material.id,
                            capacity: mesh.capacity,
                            version: mesh.styleVersion,
                            buffer: this.createBuffer(
                                device,
                                "Mesh " + String(mesh.id) + " Instance Styles",
                                mesh.styleData,
                                GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                            ),
                        });
                    } else {
                        // 即使样式内容相同，更换材质后也要维护销毁时使用的关联 ID。
                        styleBuffer.materialId = material.id;
                        // 比较当前版本与处理快照，只同步尚未处理的变化。
                        if (styleBuffer.version !== mesh.styleVersion) {
                            device.queue.writeBuffer(
                                styleBuffer.buffer,
                                0,
                                mesh.styleData,
                                0,
                                mesh.count * STYLE_STRIDE,
                            );
                            styleBuffer.version = mesh.styleVersion;
                        }
                    }
                } else {
                    continue;
                }
            } else {
                continue;
            }
        }
    }

    /** @param camera 当前相机 @example this.useCameraRelativeMatrices(camera); @returns f32 位移误差可能达到可见像素时是否启用相对矩阵。 */
    private useCameraRelativeMatrices(camera: Camera): boolean {
        const world = camera.ensureWorldMatrix().data;
        const distance = Math.max(Math.abs(world[6]), Math.abs(world[7]));
        const pixelError = distance * camera.zoom * 2 ** -23;
        // 高倍率或远离世界原点时，分别量化相机与对象位移会造成可见跳动。
        return camera.zoom >= 4096 || pixelError >= 0.1;
    }

    /**
     * 为当前 Render 生成固定尺寸及相机相对矩阵，不改动 Mesh 的原始实例数据。
     * @param mesh 待上传对象
     * @param camera 当前相机
     * @param relative 是否消去相机世界原点
     * @param originX 相机世界 X
     * @param originY 相机世界 Y
     * @param zoomScale 局部尺寸补偿倍率
     * @example this.renderMatrices(mesh, camera, true, 10, 20, 1);
     * @returns 本次上传使用的矩阵副本。
     */
    private renderMatrices(mesh: Scene["drawList"][number], camera: Camera, relative: boolean,
        originX: number, originY: number, zoomScale: number): Float32Array<ArrayBuffer> {
        const data = new Float32Array(mesh.matrixData);
        const world = mesh.getRenderMatrix(camera).data;
        const anchoredVertex = this.usesBuiltInVertex(mesh);
        const deltaX = originX - world[6];
        const deltaY = originY - world[7];
        const determinant = world[0] * world[4] - world[1] * world[3];
        // 普通 Mesh 用双精度世界位移相减；IMesh 实例槽位保留各自的独立位移。
        for (let index = 0; index < mesh.count; index++) {
            const offset = index * 12;
            data[offset + 3] = 0;
            data[offset + 7] = 0;
            // 每个实例围绕自己的局部原点固定尺寸，实例间距继续使用原始世界坐标。
            if (mesh instanceof IMesh) {
                // 实例原始世界矩阵已经打包，只缩放两个局部列，保留各自的位移列。
                for (let column = 0; column < 2; column++) {
                    // Mat3 每列有三个有效值，第四个 float 是对齐补位。
                    for (let row = 0; row < 3; row++) {
                        const slot = offset + column * 4 + row;
                        data[slot] *= zoomScale;
                    }
                }
            } else {
                // 普通 Mesh 保留双精度补偿结果，避免先量化再缩放。
                for (let column = 0; column < 2; column++) {
                    // 只重写局部轴，世界原点和齐次坐标仍来自原始矩阵。
                    for (let row = 0; row < 3; row++) {
                        data[offset + column * 4 + row] = world[column * 3 + row];
                    }
                }
            }
            // 普通 Mesh 读取双精度世界位移，实例网格保留每个槽位自己的矩阵。
            if (relative && mesh instanceof IMesh) {
                // 实例槽位已量化为 f32，用同样量化的镜头原点消去公共量，避免混用精度产生偏移。
                data[offset + 8] = mesh.matrixData[offset + 8] - Math.fround(originX);
                data[offset + 9] = mesh.matrixData[offset + 9] - Math.fround(originY);
            } else if (relative && anchoredVertex && Number.isFinite(determinant) && determinant !== 0) {
                // 以镜头位置对应的局部点为锚；局部顶点与锚在 GPU 上先相减，再加小位移。
                const localX = Math.fround((world[4] * deltaX - world[3] * deltaY) / determinant);
                const localY = Math.fround((world[0] * deltaY - world[1] * deltaX) / determinant);
                // 只有可表示为 f32 的局部锚点才能交给顶点着色器做减法。
                if (Number.isFinite(localX) && Number.isFinite(localY)) {
                    data[offset + 3] = localX;
                    data[offset + 7] = localY;
                    data[offset + 8] = world[0] * localX + world[3] * localY - deltaX;
                    data[offset + 9] = world[1] * localX + world[4] * localY - deltaY;
                } else {
                    // 奇异或过大变换沿用世界位移，避免上传非有限矩阵。
                    data[offset + 8] = -deltaX;
                    data[offset + 9] = -deltaY;
                }
            } else if (relative) {
                // 自定义顶点着色器仍按原有 Mat3 解释缓冲，不读取局部锚点。
                data[offset + 8] = -deltaX;
                data[offset + 9] = -deltaY;
            }
        }
        return data;
    }

    /** @param mesh 当前绘制对象 @example this.usesBuiltInVertex(mesh); @returns 顶点着色器是否支持局部锚点。 */
    private usesBuiltInVertex(mesh: Scene["drawList"][number]): boolean {
        const geometry = mesh.data;
        const material = mesh.material;
        // 没有完整绘制资源的对象不能确定其顶点模板，保留旧矩阵布局。
        if (geometry !== undefined && material !== undefined) {
            const vertex = material.getShaderSource(geometry.type).vertex;
            // 仅内置顶点模板读取矩阵补位；用户 WGSL 继续使用旧的零补位布局。
            if (geometry.type === "Rect2D") {
                return vertex === rectVertexShader;
            } else if (geometry.type === "NGon2D") {
                // 正多边形顶点模板与普通多边形分开匹配，避免给自定义源码写入锚点。
                return vertex === ngonVertexShader;
            } else {
                return vertex === polyVertexShader;
            }
        } else {
            return false;
        }
    }
    /**
     * 为去重后的 Geometry 创建顶点、二维轮廓法线、UV、索引和参数缓冲。
     * @param device 当前 WebGPU 设备
     * @param scene 场景对象
     * @param renderMode 当前 Render 运行模式
     * @example
     * this.drawGeometryBuffers(device, scene, renderMode);
     * @returns 无返回值
     */
    private drawGeometryBuffers(device: GPUDevice, scene: Scene, renderMode: RenderMode): void {
        // 每个共享几何只处理一次，避免多个 Mesh 重复创建同一资源。
        for (const geometry of scene.geometryList) {
            geometry.ensureGeometry();
            const cachedGeometry: GeometryBufferLike | undefined = this.pipeline.buffers.geometry.get(
                geometry.id,
            );
            // 比较当前版本与处理快照，只同步尚未处理的变化。
            if (cachedGeometry?.version !== geometry.version) {
                // 开发模式执行诊断，生产模式不承担检查和日志成本。
                if (renderMode === "development") {
                    this.developmentValidator.validateGeometry(geometry);
                }
                // 动态裸顶点保持容量时只写入已有 Buffer，骨骼动画无需逐帧重新分配。
                if (geometry.type === "Base2D" && cachedGeometry !== undefined &&
                    this.updateBase2DBuffers(device, geometry, cachedGeometry)) {
                    continue;
                }
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (cachedGeometry !== undefined) {
                    this.destroyGeometryBuffer(cachedGeometry);
                    this.pipeline.buffers.geometry.delete(geometry.id);
                }
                const geometryData = geometry.geometry;
                const normalData = geometry.normal;
                const uvData = geometry.uv;
                const indexData = geometry.index;
                const vertexType = geometry.vertexType;
                const position = geometry.position;
                const miterScale = geometry.miterScale;
                let triangleBuffer;
                // 区分空数据和有效内容，空集合不创建可绘制资源。
                if (
                    geometryData !== undefined &&
                    normalData !== undefined &&
                    uvData !== undefined &&
                    indexData !== undefined &&
                    vertexType !== undefined &&
                    position !== undefined &&
                    miterScale !== undefined &&
                    indexData.length > 0
                ) {
                    triangleBuffer = this.createGeometryBufferPart(
                        device,
                        "Geometry " + String(geometry.id) + " Merged",
                        {
                            geometry: geometryData,
                            normal: normalData,
                            uv: uvData,
                            index: indexData,
                            vertexType,
                            position,
                            miterScale,
                        },
                    );
                } else {
                    triangleBuffer = undefined;
                }
                let linePointsBuffer;
                // 区分空数据和有效内容，空集合不创建可绘制资源。
                if (geometry.linePoints !== undefined && geometry.linePoints.index.length > 0) {
                    linePointsBuffer = this.createGeometryBufferPart(
                        device,
                        "Geometry " + String(geometry.id) + " Line Points",
                        geometry.linePoints,
                    );
                } else {
                    linePointsBuffer = undefined;
                }
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (triangleBuffer !== undefined || linePointsBuffer !== undefined) {
                    const uniformBuffer: GPUBuffer = this.createBuffer(
                        device,
                        "Geometry " + String(geometry.id) + " Parameters Buffer",
                        geometry.uniformData,
                        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    );
                    this.pipeline.buffers.geometry.set(geometry.id, {
                        geometryId: geometry.id,
                        version: geometry.version,
                        uniform: uniformBuffer,
                        geometry: triangleBuffer,
                        linePoints: linePointsBuffer,
                    });
                } else {
                    continue;
                }
            } else {
                continue;
            }
        }
    }
    /**
     * 同尺寸更新 Base2D 的全部顶点属性及几何参数。
     * @param device 当前 WebGPU 设备
     * @param geometry 裸顶点几何
     * @param cached 已分配的 GPU 缓冲
     * @example
     * this.updateBase2DBuffers(device, geometry, cached);
     * @returns 是否成功复用了已有缓冲。
     */
    private updateBase2DBuffers(device: GPUDevice, geometry: GeoData, cached: GeometryBufferLike): boolean {
        const part = cached.geometry;
        const vertices = geometry.geometry;
        const normal = geometry.normal;
        const uv = geometry.uv;
        const index = geometry.index;
        const vertexType = geometry.vertexType;
        const position = geometry.position;
        const miterScale = geometry.miterScale;
        // 裸顶点几何当前只复用单组三角面缓冲。
        if (part === undefined || geometry.linePoints !== undefined || cached.linePoints !== undefined ||
            vertices === undefined || normal === undefined || uv === undefined || index === undefined ||
            vertexType === undefined || position === undefined || miterScale === undefined ||
            part.vertexType === undefined || part.position === undefined || part.miterScale === undefined) {
            return false;
        }
        let indexFormat: GPUIndexFormat = "uint16";
        // 用户可能切换到 32 位索引，其绑定格式必须对应更新。
        if (index instanceof Uint32Array) {
            indexFormat = "uint32";
        }
        const indexBytes = Math.ceil(index.byteLength / 4) * 4;
        // 任一属性尺寸变化都需要重新分配完整的一组缓冲。
        if (part.vertex.size !== vertices.byteLength || part.normal.size !== normal.byteLength ||
            part.uv.size !== uv.byteLength || part.index.size !== indexBytes ||
            part.vertexType.size !== vertexType.byteLength || part.position.size !== position.byteLength ||
            part.miterScale.size !== miterScale.byteLength || part.indexFormat !== indexFormat) {
            return false;
        }
        const alignedIndex = new Uint8Array(indexBytes);
        alignedIndex.set(new Uint8Array(index.buffer, index.byteOffset, index.byteLength));
        device.queue.writeBuffer(part.vertex, 0, new Float32Array(vertices));
        device.queue.writeBuffer(part.normal, 0, new Float32Array(normal));
        device.queue.writeBuffer(part.uv, 0, new Float32Array(uv));
        device.queue.writeBuffer(part.index, 0, alignedIndex);
        device.queue.writeBuffer(part.vertexType, 0, new Float32Array(vertexType));
        device.queue.writeBuffer(part.position, 0, new Float32Array(position));
        device.queue.writeBuffer(part.miterScale, 0, new Float32Array(miterScale));
        device.queue.writeBuffer(cached.uniform, 0, new Float32Array(geometry.uniformData));
        part.pointsFirstIndex = this.getPointsFirstIndex({
            geometry: vertices,
            normal,
            uv,
            index,
            vertexType,
            position,
            miterScale,
        });
        cached.version = geometry.version;
        return true;
    }
    /**
     * 创建单种几何绘制模式的顶点、二维轮廓法线、UV 和索引缓冲。
     * @param device 当前 WebGPU 设备
     * @param label GPU 调试标签前缀
     * @param data CPU 几何数据
     * @example
     * this.createGeometryBufferPart(device, label, data);
     * @returns 已创建的几何缓冲分区
     */
    private createGeometryBufferPart(
        device: GPUDevice,
        label: string,
        data: GeoPartDataLike,
    ): GeometryBufferPartLike {
        const vertexData: Float32Array<ArrayBuffer> = new Float32Array(data.geometry);
        const normalData: Float32Array<ArrayBuffer> = new Float32Array(data.normal);
        const textureCoordinateData: Float32Array<ArrayBuffer> = new Float32Array(data.uv);
        let elementData: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (data.index instanceof Uint32Array) {
            elementData = new Uint32Array(data.index);
        } else {
            elementData = new Uint16Array(data.index);
        }
        let positionData: Float32Array<ArrayBuffer> | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (data.position === undefined) {
            positionData = undefined;
        } else {
            positionData = new Float32Array(data.position);
        }
        let miterScaleData: Float32Array<ArrayBuffer> | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (data.miterScale === undefined) {
            miterScaleData = undefined;
        } else {
            miterScaleData = new Float32Array(data.miterScale);
        }
        const alignedIndexByteLength: number = Math.ceil(elementData.byteLength / 4) * 4;
        const alignedIndexData: Uint8Array<ArrayBuffer> = new Uint8Array(alignedIndexByteLength);
        // WebGPU 写入长度必须是 4 的倍数，末尾补位不参与 drawIndexed。
        alignedIndexData.set(new Uint8Array(elementData.buffer));
        let vertexTypeBuffer: GPUBuffer | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (data.vertexType !== undefined) {
            vertexTypeBuffer = this.createBuffer(
                device,
                label + " Vertex Type Buffer",
                new Float32Array(data.vertexType),
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            );
        }
        let indexFormat: GPUIndexFormat = "uint16";
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (data.index instanceof Uint32Array) {
            indexFormat = "uint32";
        }
        let positionBuffer: GPUBuffer | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (positionData !== undefined) {
            positionBuffer = this.createBuffer(
                device,
                label + " Point Centers Buffer",
                positionData,
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            );
        }
        let miterScaleBuffer: GPUBuffer | undefined;
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (miterScaleData !== undefined) {
            miterScaleBuffer = this.createBuffer(
                device,
                label + " Miter Scale Buffer",
                miterScaleData,
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            );
        }
        return {
            vertex: this.createBuffer(
                device,
                label + " Vertex Buffer",
                vertexData,
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            ),
            normal: this.createBuffer(
                device,
                label + " Normal Buffer",
                normalData,
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            ),
            uv: this.createBuffer(
                device,
                label + " UV Buffer",
                textureCoordinateData,
                GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            ),
            index: this.createBuffer(
                device,
                label + " Index Buffer",
                alignedIndexData,
                GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            ),
            vertexType: vertexTypeBuffer,
            pointsFirstIndex: this.getPointsFirstIndex(data),
            indexFormat,
            position: positionBuffer,
            miterScale: miterScaleBuffer,
        };
    }
    /**
     * 获取关键点索引段起点，缓存后绘制时无需重复遍历。
     * 原生 line-list 需要插在实体面与关键点之间时，复用同一个合并缓冲分段绘制。
     * @param data 已按面、边框、关键点顺序合并的数据
     * @example
     * this.getPointsFirstIndex(data);
     * @returns 关键点索引段起点；没有关键点时等于总索引数
     */
    private getPointsFirstIndex(data: GeoPartDataLike): number {
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (data.vertexType !== undefined) {
            // 按索引顺序处理三角面，保持绕序及属性下标一致。
            for (let index: number = 0; index < data.index.length; index += 1) {
                // 命中关键点索引段的第一个顶点，缓存其起点供分段绘制。
                if (data.vertexType[data.index[index]] === 1) {
                    return index;
                }
            }
        }
        return data.index.length;
    }
    /**
     * 销毁一个 Geometry 缓存集合中的全部已创建缓冲。
     * @param geometryBuffer Geometry GPU 缓存集合
     * @example
     * this.destroyGeometryBuffer(geometryBuffer);
     * @returns 无返回值
     */
    private destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void {
        // 遍历当前缓存条目，按实际引用关系处理资源。
        for (const entry of this.pipeline.buffers.meshMatrix.values()) {
            // 几何 uniform 被销毁时同步清除引用它的 BindGroup 缓存。
            if (entry.bindGroup?.geometry === geometryBuffer.uniform) {
                entry.bindGroup = undefined;
            }
        }
        /**
         * 释放当前几何分区已经创建的 GPU 缓冲。
         * @param part 当前几何分区
         * @example
         * DestroyPart(part);
         * @returns 无返回值。
         */
        const DestroyPart = (part: GeometryBufferPartLike | undefined): void => {
            part?.vertex.destroy();
            part?.normal.destroy();
            part?.uv.destroy();
            part?.index.destroy();
            part?.miterScale?.destroy();
            part?.position?.destroy();
            part?.vertexType?.destroy();
        };
        DestroyPart(geometryBuffer.geometry);
        DestroyPart(geometryBuffer.linePoints);
        geometryBuffer.uniform.destroy();
    }
}

interface BufferManagerLike {
    /**
     * 创建或更新当前场景需要的 GPUBuffer。
     * @param scene 场景对象
     * @param camera 相机对象
     * @param dpr 当前设备像素比
     * @param renderMode 当前 Render 运行模式
     * @example
     * bufferManager.draw(scene, camera, dpr, renderMode);
     * @returns 无返回值
     */
    draw(scene: Scene, camera: Camera, dpr: number, renderMode: RenderMode): void;
}

export default BufferManager;
export type { BufferManagerLike };
