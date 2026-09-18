import { STYLE_STRIDE } from "../Style";
import type Camera from "../Camera";
import type { Mat3 } from "bpmatrixjs/Math";
import type { GeoPartDataLike } from "../Geometry/Geo";
import type Scene from "../Scene";
import type { Material2d } from "../global-types";
import DepthManager from "./DepthManager";
import DevelopmentValidator from "./DevelopmentValidator";
import type { GeometryBufferLike, GeometryBufferPartLike, PipelineLike, RenderMode } from "./types";
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
/**
 * 管理当前 Render 对应的 Camera、Material、Mesh 和 Geometry GPUBuffer。
 * @class
 */
class BufferManager implements BufferManagerLike {
    private readonly pipeline: PipelineLike;
    private readonly depthManager: DepthManager;
    private readonly developmentValidator: DevelopmentValidator;
    private _cameraSnapshot:
        | {
            camera: Camera;
            view: Mat3;
            viewVersion: number;
            projection: Mat3;
            projectionVersion: number;
            zoom: number;
            dpr: number;
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
        this.developmentValidator = new DevelopmentValidator();
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
            this.drawMeshBuffers(device, scene, renderMode);
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
        const buffers: GPUBuffer[] = this.pipeline.buffers.cameraUniform;
        const previous = this._cameraSnapshot;
        const cameraChanged: boolean = previous?.camera !== camera;
        const viewChanged: boolean =
            cameraChanged ||
            previous?.view !== camera.viewMatrix ||
            previous.viewVersion !== camera.viewMatrix.version;
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
                    camera.viewMatrix.GPUData,
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
                device.queue.writeBuffer(buffers[0], 0, camera.viewMatrix.GPUData);
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
            };
        }
    }
    /**
     * 创建或更新每个 Mesh 的连续矩阵与样式 Storage 数组，分别对比版本。
     * @param device 当前 WebGPU 设备
     * @param scene 场景对象
     * @param renderMode 当前 Render 运行模式
     * @example
     * this.drawMeshBuffers(device, scene, renderMode);
     * @returns 无返回值
     */
    private drawMeshBuffers(device: GPUDevice, scene: Scene, renderMode: RenderMode): void {
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
                        matrixBuffer = {
                            meshId: mesh.id,
                            capacity: mesh.capacity,
                            version: mesh.matrixVersion,
                            buffer: this.createBuffer(
                                device,
                                "Mesh " + String(mesh.id) + " Instance Matrices",
                                mesh.matrixData,
                                GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                            ),
                        };
                        matrixBuffers.set(mesh.id, matrixBuffer);
                    } else if (matrixBuffer.version !== mesh.matrixVersion) {
                        // 比较当前版本与处理快照，只同步尚未处理的变化。
                        device.queue.writeBuffer(matrixBuffer.buffer, 0, mesh.matrixData, 0, mesh.count * 12);
                        matrixBuffer.version = mesh.matrixVersion;
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
export default BufferManager;
export type { BufferManagerLike };
