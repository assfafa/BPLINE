/// <reference types="@webgpu/types" preserve="true" />
import type Camera from "../Camera";
import type { GeoData } from "../Geometry";
import type { Material2d } from "../global-types";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";
import type { TextureResource } from "../Texture/Layers";
/**
 * Render 运行模式。
 * development 启用运行时资源检查，production 跳过全部开发检查。
 */
type RenderMode = "development" | "production";
/** group(0) 的资源身份快照；所属矩阵缓存被替换时一起释放。 */
interface MatrixBindGroupCache {
    group: GPUBindGroup;
    layout: GPUBindGroupLayout;
    view: GPUBuffer;
    projection: GPUBuffer;
    parameters: GPUBuffer;
    geometry: GPUBuffer;
    depth: GPUBuffer;
}
/** group(1) 的资源身份快照；样式数值更新不使绑定失效。 */
interface StyleBindGroupCache {
    group: GPUBindGroup;
    layout: GPUBindGroupLayout;
    baseView: GPUTextureView;
    edgeView: GPUTextureView;
    pointsView: GPUTextureView;
    baseSampler: GPUSampler;
    edgeSampler: GPUSampler;
    pointsSampler: GPUSampler;
}
/**
 * 单个 Mesh 的世界矩阵缓冲位。
 */
interface MeshMatrixBufferLike {
    /** 已创建的矩阵绑定组，只在绑定对象或布局变化后重建。 */
    bindGroup?: MatrixBindGroupCache;
    /**
     * 对应 Mesh 的全局 ID。
     */
    meshId: number;
    /**
     * 当前 Render 创建的 GPU 矩阵缓冲。
     */
    buffer: GPUBuffer;
    /** 当前数组容量，实例个数而非 float 个数。 */
    capacity: number;
    /** 已上传的 Mesh.matrixVersion。 */
    version: number;
}
/** 每个 Mesh 独立的连续实例样式缓冲。 */
interface MeshStyleBufferLike {
    /** 已创建的样式绑定组，随该 Mesh 样式缓存一起回收。 */
    bindGroup?: StyleBindGroupCache;
    meshId: number;
    /** 用于 destroyMaterial 清理当前绑定该材质的样式缓存。 */
    materialId: number;
    buffer: GPUBuffer;
    capacity: number;
    version: number;
}
/**
 * 单种 Geometry 绘制模式对应的顶点、二维轮廓法线、UV 和索引缓冲。
 */
interface GeometryBufferPartLike {
    vertex: GPUBuffer;
    normal: GPUBuffer;
    uv: GPUBuffer;
    index: GPUBuffer;
    miterScale?: GPUBuffer;
    /** 点型逐顶点中心坐标缓冲。 */
    position?: GPUBuffer;
    /** 连续逐顶点类型缓冲，0 / 0.5 / 1 对应面 / 宽边框 / 关键点。 */
    vertexType?: GPUBuffer;
    /** 关键点在合并索引中的起始位置，供原生线框插入时保持覆盖顺序。 */
    pointsFirstIndex: number;
    /** 上传时保留的索引位宽，不能把 Uint32Array 强转为 Uint16Array。 */
    indexFormat: GPUIndexFormat;
}
/**
 * 单个 Geometry 对应的 WebGPU 缓存集合。
 */
interface GeometryBufferLike {
    geometryId: number;
    version: number;
    uniform: GPUBuffer;
    geometry?: GeometryBufferPartLike;
    linePoints?: GeometryBufferPartLike;
}
/** 单个 Mesh 的层级起点和实例读取方向，静止帧不重复上传。 */
interface MeshDepthBufferLike {
    meshId: number;
    buffer: GPUBuffer;
    data: Uint32Array<ArrayBuffer>;
}
/** 与画布实际尺寸绑定的 Render 私有深度附件。 */
interface DepthTextureLike {
    texture: GPUTexture;
    view: GPUTextureView;
    width: number;
    height: number;
}
interface PipelineBuffersLike {
    meshDepth: Map<number, MeshDepthBufferLike>;
    /** CPU 按 Mesh ID 查询缓冲对象；buffer 内仍是连续矩阵数值。 */
    meshMatrix: Map<number, MeshMatrixBufferLike>;
    geometry: Map<number, GeometryBufferLike>;
    meshStyle: Map<number, MeshStyleBufferLike>;
    cameraUniform: GPUBuffer[];
}
/**
 * 单个 Scene 当前使用的 Render 缓存资源集合。
 */
interface SceneResourcesLike {
    /** 当前 Render 已处理的 Scene 版本。 */
    version: number;
    meshIds: Set<number>;
    geometryIds: Set<number>;
    materialIds: Set<number>;
    textureIds: Set<number>;
    pipelineKeys: Set<string>;
}
/**
 * 单个 Texture 对应的 WebGPU 贴图资源。
 */
interface GPUTextureResourceLike {
    textureId: number;
    /** 层内源图 ID，显式销毁图片时同时失效引用它的层组。 */
    sourceIds?: ReadonlySet<number>;
    /** 当前 Render 已上传的贴图版本，不随其他 Render 清理标记而变化。 */
    version: number;
    texture: GPUTexture;
    view: GPUTextureView;
}
/**
 * 相同材质 key 共享的 WebGPU 管线模板。
 */
interface PipelineTemplateLike {
    key: string;
    renderPipeline?: GPURenderPipeline;
    lineRenderPipeline?: GPURenderPipeline;
    defaultBindGroupLayout: GPUBindGroupLayout;
    materialBindGroupLayout: GPUBindGroupLayout;
}
interface PipelineLike {
    adapter?: GPUAdapter;
    device?: GPUDevice;
    context?: GPUCanvasContext;
    format?: GPUTextureFormat;
    pipelineTemplates: Map<string, PipelineTemplateLike>;
    defaultBindGroupLayout?: GPUBindGroupLayout;
    baseMaterialBindGroupLayout?: GPUBindGroupLayout;
    textures: Map<number, GPUTextureResourceLike>;
    samplers: Map<string, GPUSampler>;
    fallbackTexture?: GPUTextureResourceLike;
    depthTexture?: DepthTextureLike;
    sceneResources: Map<number, SceneResourcesLike>;
    buffers: PipelineBuffersLike;
}
interface RenderLike {
    readonly id: number;
    readonly type: string;
    readonly dpr: number;
    renderMode: RenderMode;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    backgroundColor: GPUColorDict;
    alphaMode: GPUCanvasAlphaMode;
    pipeline: PipelineLike;
    readonly ready: Promise<void>;
    /**
     * 创建当前画布对应的 WebGPU 设备与呈现上下文。
     * @example
     * render.initWebGPU();
     * @returns WebGPU 初始化完成状态
     */
    initWebGPU(): Promise<void>;
    /**
     * 销毁当前 Render 持有的全部资源并移除 Canvas。
     * @example
     * render.destroy();
     * @returns 无返回值
     */
    destroy(): void;
    /**
     * 预热场景所需缓存，但不提交 DrawCall。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.warmup(scene, camera);
     * @returns 无返回值
     */
    warmup(scene: Scene, camera: Camera): void;
    /**
     * 预热缓存并绘制当前场景。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.render(scene, camera);
     * @returns 无返回值
     */
    render(scene: Scene, camera: Camera): void;
    /**
     * 创建或更新当前场景的 GPUBuffer。
     * @param scene 场景对象
     * @param camera 相机对象
     * @example
     * render.drawBuffers(scene, camera);
     * @returns 无返回值
     */
    drawBuffers(scene: Scene, camera: Camera): void;
    /**
     * 创建或更新当前场景的 GPUTexture。
     * @param scene 场景对象
     * @example
     * render.drawTextures(scene);
     * @returns 无返回值
     */
    drawTextures(scene: Scene): void;
    /**
     * 创建或更新当前场景的 Pipeline 模板。
     * @param scene 场景对象
     * @example
     * render.drawPipelines(scene);
     * @returns 无返回值
     */
    drawPipelines(scene: Scene): void;
    /**
     * 编码并提交当前场景的绘制命令。
     * @param scene 场景对象
     * @example
     * render.drawCall(scene);
     * @returns 无返回值
     */
    drawCall(scene: Scene): void;
    /**
     * 销毁指定 Mesh 缓存。
     * @param mesh Mesh 对象或全局 ID
     * @example
     * render.destroyMesh(mesh);
     * @returns 是否销毁了任意资源
     */
    destroyMesh(mesh: MeshLike | number): boolean;
    /**
     * 销毁指定 Material 缓存。
     * @param material Material 对象或全局 ID
     * @example
     * render.destroyMaterial(material);
     * @returns 是否销毁了任意资源
     */
    destroyMaterial(material: Material2d | number): boolean;
    /**
     * 销毁指定 Geometry 缓存。
     * @param geometry Geometry 对象或全局 ID
     * @example
     * render.destroyGeometry(geometry);
     * @returns 是否销毁了对应资源
     */
    destroyGeometry(geometry: GeoData | number): boolean;
    /**
     * 销毁指定 Texture 缓存。
     * @param texture Texture 对象或全局 ID
     * @example
     * render.destroyTexture(texture);
     * @returns 是否销毁了对应资源
     */
    destroyTexture(texture: TextureResource | number): boolean;
    /**
     * 回收所有场景均未引用的 GPU 缓存。
     * @param scene 需要同步资源使用记录的场景
     * @example
     * render.trim(scene);
     * @returns 无返回值
     */
    trim(scene: Scene): void;
    /**
     * 更新场景版本落后的节点矩阵。
     * @param scene 场景对象
     * @example
     * render.matrixUpdate(scene);
     * @returns 无返回值
     */
    matrixUpdate(scene: Scene): void;
    /**
     * 根据版本更新 Scene 列表。
     * @param scene 场景对象
     * @example
     * render.initScene(scene);
     * @returns 无返回值
     */
    initScene(scene: Scene): void;
    /**
     * 根据版本更新 Camera 矩阵。
     * @param camera 相机对象
     * @example
     * render.initCamera(camera);
     * @returns 无返回值
     */
    initCamera(camera: Camera): void;
    /**
     * 延迟更新 Canvas 实际像素尺寸。
     * 连续 100ms 没有新的调用时才执行。
     * @example
     * render.resize();
     * @returns 无返回值
     */
    resize(): void;
}
export type {
    DepthTextureLike,
    MeshDepthBufferLike,
    GeometryBufferPartLike,
    GeometryBufferLike,
    GPUTextureResourceLike,
    MeshMatrixBufferLike,
    MeshStyleBufferLike,
    PipelineBuffersLike,
    PipelineLike,
    PipelineTemplateLike,
    RenderLike,
    RenderMode,
    SceneResourcesLike,
};
