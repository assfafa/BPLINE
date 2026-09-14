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
    private _cameraSnapshot: {
        camera: Camera;
        view: Mat3;
        viewVersion: number;
        projection: Mat3;
        projectionVersion: number;
        zoom: number;
        dpr: number;
    } | undefined;
    private readonly _validatedMaterials = new WeakMap<Material2d, number>();

    /**
     * 创建缓冲管理器。
     * @param pipeline 当前 Render 的共享管线资源
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
     * @returns 无返回值
     */
    public draw(
        scene: Scene,
        camera: Camera,
        dpr: number,
        renderMode: RenderMode,
    ): void {
        const device: GPUDevice | undefined = this.pipeline.device;

        if (device === undefined) {
            return;
        }

        if (renderMode === "development") {
            this.developmentValidator.validateCamera(camera);
        }

        this.drawCameraBuffers(device, camera, dpr);
        this.drawGeometryBuffers(device, scene, renderMode);
        this.prepareMaterials(scene, renderMode);
        this.drawMeshBuffers(device, scene, renderMode);
        this.depthManager.prepare(scene);
    }

    /**
     * 按 materialList 检查材质，共享材质每个版本只检查一次。
     * 材质显示数值的 GPU 存储属于 Mesh 实例数组，不在这里重复创建一份缓冲。
     * @param scene 场景对象
     * @param renderMode production 跳过开发检查
     */
    private prepareMaterials(scene: Scene, renderMode: RenderMode): void {
        if (renderMode !== "development") return;
        for (const material of scene.materialList) {
            if (this._validatedMaterials.get(material) === material.version) continue;
            this.developmentValidator.validateMaterial(material);
            this._validatedMaterials.set(material, material.version);
        }
    }

    /**
     * 创建并写入基础 GPUBuffer。
     * @param device 当前 Render 对应的 WebGPU 设备
     * @param label GPU 调试标签
     * @param data 首次写入的缓冲数据
     * @param usage 缓冲用途标记
     * @returns 已写入数据的 GPUBuffer
     */
    private createBuffer(device: GPUDevice, label: string, data: GPUAllowSharedBufferSource, usage: GPUBufferUsageFlags): GPUBuffer {
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
     */
    private drawCameraBuffers(device: GPUDevice, camera: Camera, dpr: number): void {
        camera.ensureCameraMatrix();
        const buffers: GPUBuffer[] = this.pipeline.buffers.cameraUniform;
        const previous = this._cameraSnapshot;
        const cameraChanged: boolean = previous?.camera !== camera;
        const viewChanged: boolean = cameraChanged || previous?.view !== camera.viewMatrix
            || previous.viewVersion !== camera.viewMatrix.version;
        const projectionChanged: boolean = cameraChanged || previous?.projection !== camera.orthogonalMatrix
            || previous.projectionVersion !== camera.orthogonalMatrix.version;
        const parametersChanged: boolean = cameraChanged || previous?.zoom !== camera.zoom || previous.dpr !== dpr;
        const created: boolean = buffers.length === 0;
        if (created) {
            buffers.push(
                this.createBuffer(device, "Camera View Matrix Buffer", camera.viewMatrix.GPUData, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
                this.createBuffer(device, "Camera Orthogonal Matrix Buffer", camera.orthogonalMatrix.GPUData, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
                this.createBuffer(device, "Render Camera Parameters Buffer", new Float32Array([camera.zoom, dpr, 0, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            );
        } else {
            if (viewChanged) device.queue.writeBuffer(buffers[0], 0, camera.viewMatrix.GPUData);
            if (projectionChanged) device.queue.writeBuffer(buffers[1], 0, camera.orthogonalMatrix.GPUData);
            if (parametersChanged) device.queue.writeBuffer(buffers[2], 0, new Float32Array([camera.zoom, dpr, 0, 0]));
        }
        if (created || viewChanged || projectionChanged || parametersChanged) {
            this._cameraSnapshot = {
                camera, view: camera.viewMatrix, viewVersion: camera.viewMatrix.version,
                projection: camera.orthogonalMatrix, projectionVersion: camera.orthogonalMatrix.version,
                zoom: camera.zoom, dpr,
            };
        }
    }

    /**
     * 创建或更新每个 Mesh 的连续矩阵与样式 Storage 数组，分别对比版本。
     * @param device 当前 WebGPU 设备
     * @param scene 场景对象
     * @param renderMode 当前 Render 运行模式
     * @returns 无返回值
     */
    private drawMeshBuffers(device: GPUDevice, scene: Scene, renderMode: RenderMode): void {
        for (const mesh of scene.drawList) {
            if (renderMode === "development" && (mesh.geometryPending || mesh.materialPending
                || !this.pipeline.buffers.meshStyle.has(mesh.id))) {
                this.developmentValidator.validateMesh(mesh);
            }

            const material = mesh.material;
            if (material === undefined) continue;
            mesh.updateInstanceData();
            if (mesh.count === 0) continue;
            const limit: number = Math.min(device.limits.maxBufferSize, device.limits.maxStorageBufferBindingSize);
            if (mesh.matrixData.byteLength > limit || mesh.styleData.byteLength > limit) {
                throw new RangeError("Mesh " + String(mesh.id) + " capacity exceeds this GPUDevice storage buffer limit: " + String(limit) + " bytes.");
            }
            const matrixBuffers = this.pipeline.buffers.meshMatrix;
            let matrixBuffer = matrixBuffers.get(mesh.id);
            if (matrixBuffer !== undefined && matrixBuffer.capacity !== mesh.capacity) {
                matrixBuffer.buffer.destroy();
                matrixBuffers.delete(mesh.id);
                matrixBuffer = undefined;
            }
            if (matrixBuffer === undefined) {
                matrixBuffer = {
                    meshId: mesh.id, capacity: mesh.capacity, version: mesh.matrixVersion,
                    buffer: this.createBuffer(device, "Mesh " + String(mesh.id) + " Instance Matrices",
                        mesh.matrixData, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
                };
                matrixBuffers.set(mesh.id, matrixBuffer);
            } else if (matrixBuffer.version !== mesh.matrixVersion) {
                device.queue.writeBuffer(matrixBuffer.buffer, 0, mesh.matrixData, 0, mesh.count * 12);
                matrixBuffer.version = mesh.matrixVersion;
            }

            let styleBuffer = this.pipeline.buffers.meshStyle.get(mesh.id);
            if (styleBuffer !== undefined && styleBuffer.capacity !== mesh.capacity) {
                styleBuffer.buffer.destroy();
                this.pipeline.buffers.meshStyle.delete(mesh.id);
                styleBuffer = undefined;
            }
            if (styleBuffer === undefined) {
                this.pipeline.buffers.meshStyle.set(mesh.id, {
                    meshId: mesh.id, materialId: material.id,
                    capacity: mesh.capacity, version: mesh.styleVersion,
                    buffer: this.createBuffer(device, "Mesh " + String(mesh.id) + " Instance Styles",
                        mesh.styleData, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
                });
            } else {
                // 即使样式内容相同，更换材质后也要维护销毁时使用的关联 ID。
                styleBuffer.materialId = material.id;
                if (styleBuffer.version !== mesh.styleVersion) {
                    device.queue.writeBuffer(styleBuffer.buffer, 0, mesh.styleData, 0, mesh.count * STYLE_STRIDE);
                    styleBuffer.version = mesh.styleVersion;
                }
            }
        }
    }

    /**
     * 为去重后的 Geometry 创建顶点、二维轮廓法线、UV、索引和参数缓冲。
     * @param device 当前 WebGPU 设备
     * @param scene 场景对象
     * @param renderMode 当前 Render 运行模式
     * @returns 无返回值
     */
    private drawGeometryBuffers(device: GPUDevice, scene: Scene, renderMode: RenderMode): void {
        for (const geometry of scene.geometryList) {
            geometry.ensureGeometry();

            const cachedGeometry: GeometryBufferLike | undefined = this.pipeline.buffers.geometry.get(geometry.id);

            if (cachedGeometry?.version === geometry.version) {
                continue;
            }

            if (renderMode === "development") {
                this.developmentValidator.validateGeometry(geometry);
            }

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
            const triangleBuffer = geometryData !== undefined
                && normalData !== undefined && uvData !== undefined && indexData !== undefined
                && vertexType !== undefined && position !== undefined && miterScale !== undefined
                && indexData.length > 0
                ? this.createGeometryBufferPart(
                    device, "Geometry " + String(geometry.id) + " Merged",
                    { geometry: geometryData, normal: normalData, uv: uvData, index: indexData, vertexType, position, miterScale },
                )
                : undefined;
            const linePointsBuffer = geometry.linePoints !== undefined && geometry.linePoints.index.length > 0
                ? this.createGeometryBufferPart(device, "Geometry " + String(geometry.id) + " Line Points", geometry.linePoints)
                : undefined;
            if (triangleBuffer === undefined && linePointsBuffer === undefined) {
                continue;
            }
            const uniformBuffer: GPUBuffer = this.createBuffer(device, "Geometry " + String(geometry.id) + " Parameters Buffer", geometry.uniformData, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

            this.pipeline.buffers.geometry.set(geometry.id, {
                geometryId: geometry.id,
                version: geometry.version,
                uniform: uniformBuffer,
                geometry: triangleBuffer,
                linePoints: linePointsBuffer,
            });
        }
    }

    /**
     * 创建单种几何绘制模式的顶点、二维轮廓法线、UV 和索引缓冲。
     * @param device 当前 WebGPU 设备
     * @param label GPU 调试标签前缀
     * @param data CPU 几何数据
     * @returns 已创建的几何缓冲分区
     */
    private createGeometryBufferPart(device: GPUDevice, label: string, data: GeoPartDataLike): GeometryBufferPartLike {
        const vertexData: Float32Array<ArrayBuffer> = new Float32Array(data.geometry);
        const normalData: Float32Array<ArrayBuffer> = new Float32Array(data.normal);
        const textureCoordinateData: Float32Array<ArrayBuffer> = new Float32Array(data.uv);
        const elementData: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer> = data.index instanceof Uint32Array
            ? new Uint32Array(data.index)
            : new Uint16Array(data.index);
        const positionData: Float32Array<ArrayBuffer> | undefined = data.position === undefined
            ? undefined
            : new Float32Array(data.position);
        const miterScaleData: Float32Array<ArrayBuffer> | undefined = data.miterScale === undefined
            ? undefined
            : new Float32Array(data.miterScale);
        const alignedIndexByteLength: number = Math.ceil(elementData.byteLength / 4) * 4;
        const alignedIndexData: Uint8Array<ArrayBuffer> = new Uint8Array(alignedIndexByteLength);

        // WebGPU 写入长度必须是 4 的倍数，末尾补位不参与 drawIndexed。
        alignedIndexData.set(new Uint8Array(elementData.buffer));

        return {
            vertex: this.createBuffer(device, label + " Vertex Buffer", vertexData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
            normal: this.createBuffer(device, label + " Normal Buffer", normalData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
            uv: this.createBuffer(device, label + " UV Buffer", textureCoordinateData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
            index: this.createBuffer(device, label + " Index Buffer", alignedIndexData, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST),
            vertexType: data.vertexType === undefined
                ? undefined
                : this.createBuffer(device, label + " Vertex Type Buffer", new Float32Array(data.vertexType), GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
            pointsFirstIndex: this.getPointsFirstIndex(data),
            indexFormat: data.index instanceof Uint32Array ? "uint32" : "uint16",
            position: positionData === undefined
                ? undefined
                : this.createBuffer(device, label + " Point Centers Buffer", positionData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
            miterScale: miterScaleData === undefined
                ? undefined
                : this.createBuffer(device, label + " Miter Scale Buffer", miterScaleData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
        };
    }

    /**
     * 获取关键点索引段起点，缓存后绘制时无需重复遍历。
     * 原生 line-list 需要插在实体面与关键点之间时，复用同一个合并缓冲分段绘制。
     * @param data 已按面、边框、关键点顺序合并的数据
     * @returns 关键点索引段起点；没有关键点时等于总索引数
     */
    private getPointsFirstIndex(data: GeoPartDataLike): number {
        if (data.vertexType !== undefined) {
            for (let index: number = 0; index < data.index.length; index += 1) {
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
     * @returns 无返回值
     */
    private destroyGeometryBuffer(geometryBuffer: GeometryBufferLike): void {
        for (const entry of this.pipeline.buffers.meshMatrix.values()) {
            if (entry.bindGroup?.geometry === geometryBuffer.uniform) entry.bindGroup = undefined;
        }
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
