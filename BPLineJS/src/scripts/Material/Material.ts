/// <reference types="@webgpu/types" preserve="true" />
import { GETID } from "../ID";
import Style from "../Style";
import type { StyleChange, StyleSubscriber, BorderAlign, PixelAligned } from "../Style";

interface MaterialBuffersLike {
    uniform?: number;
    texture?: number;
    sampler?: number;
}
interface ShadersLike {
    polyVertexShader?: string;
    polyFragmentShader?: string;
    rectVertexShader?: string;
    rectFragmentShader?: string;
}
/** 通知类别不是独立版本；材质仍只有一个 version。 */
type MaterialChangeKind = "all" | "style" | "pipeline" | "texture" | "textureData" | "sampler";
/** 材质变化影响：样式数组、场景资源引用分别处理。 */
interface MaterialChange {
    readonly source: MaterialLike;
    readonly style: boolean;
    readonly resources: boolean;
}
/** 材质消费者，回调只安排下一帧工作。 */
interface MaterialSubscriber {
    onMaterialChange(change: MaterialChange): void;
}
interface MaterialLike extends StyleSubscriber {
    readonly id: number;
    readonly type: string;
    readonly key: string;
    readonly version: number;
    style: Style;
    transparent: boolean;
    depthTest: boolean;
    depthWrite: boolean;
    cullMode: GPUCullMode;
    addGeometryType(type: string): void;
    getPipelineKey(type: string): string;
    rectVertexShader: string | undefined;
    rectFragmentShader: string | undefined;
    polyVertexShader: string | undefined;
    polyFragmentShader: string | undefined;
    updateKey(): void;
    updateVersion(kind?: MaterialChangeKind): void;
    add(subscriber: MaterialSubscriber): void;
    delete(subscriber: MaterialSubscriber): void;
    dispose(): void;
}
/** 材质只持有 Shader、固定管线状态及 Style 引用，不重复保存显示参数。 */
abstract class Material implements MaterialLike {
    /** 全局材质 ID。 */
    public readonly id: number = GETID();
    /** 材质类型。 */
    public abstract readonly type: string;
    private _version: number = 0;
    private _key: string = "";
    /** 缓存完整几何管线键，避免每个 Mesh 每帧拼接和散列 Shader 长字符串。 */
    private readonly _pipelineKeys = new Map<string, string>();
    private _style: Style;
    private _disposed: boolean = false;
    private readonly _subscribers = new Set<MaterialSubscriber>();
    private _transparent: boolean = false;
    private _depthTest: boolean = false;
    private _depthWrite: boolean = false;
    private _cullMode: GPUCullMode = "back";
    private readonly _geometryTypes = new Set<string>();
    private readonly _shaders: ShadersLike = {};

    /** @param style 共享样式，默认各分区关闭 */
    protected constructor(style: Style = new Style()) {
        this._style = style;
        style.add(this);
    }
    /** 当前共享样式。 */
    public get style(): Style { return this._style; }
    /** @param value 新样式；解绑旧引用，并更新材质版本及 Pipeline key */
    public set style(value: Style) {
        if (this._disposed) throw new Error("Disposed material cannot be reused.");
        if (this._style === value) return;
        this._style.delete(this);
        this._style = value;
        value.add(this);
        this.updateVersion();
    }
    /** @param change 样式变化；区分数值、贴图引用和贴图内容，避免无关缓冲重复上传 */
    public onStyleChange(change: StyleChange): void {
        if (this._disposed || change.source !== this._style) return;
        const kind: MaterialChangeKind = change.field === "texture" ? "texture"
            : change.field === "textureData" ? "textureData"
                : change.field === "addressModeU" || change.field === "addressModeV" ? "sampler" : "style";
        this.updateVersion(kind);
    }
    /** 最终停止使用时解绑 Style，不销毁共享贴图或 GPU 缓存。 */
    public dispose(): void {
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }
    /**
     * 关联使用当前材质的消费者，Set 自动去重。
     * @param subscriber Mesh 或其他材质消费者
     */
    public add(subscriber: MaterialSubscriber): void {
        if (this._disposed) throw new Error("Disposed material cannot be reused.");
        this._subscribers.add(subscriber);
    }
    /**
     * 解绑消费者，不销毁共享 Style、Texture 或 GPU 缓存。
     * @param subscriber 需要解绑的消费者
     */
    public delete(subscriber: MaterialSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /** 单一材质版本。 */
    public get version(): number { return this._version; }
    /** 固定管线状态与 Shader 对应的缓存键。 */
    public get key(): string { return this._key; }
    /**
     * 递增单一版本并通知消费者，颜色变化不会改变 key。
     * @param kind 影响范围，手动调用默认全部失效
     */
    public updateVersion(kind: MaterialChangeKind = "all"): void {
        const previousKey: string = this._key;
        this._version++;
        this.updateKey();
        const change: MaterialChange = Object.freeze({
            source: this,
            style: kind === "all" || kind === "style",
            resources: kind === "all" || kind === "texture" || previousKey !== this._key,
        });
        for (const subscriber of [...this._subscribers]) subscriber.onMaterialChange(change);
    }
    /** 所有分区共用的透明混合状态。 */
    public get transparent(): boolean { return this._transparent; }
    /** @param value 是否开启透明混合 */
    public set transparent(value: boolean) {
        if (this._transparent === value) return;
        this._transparent = value;
        this.updateVersion("pipeline");
    }
    /** 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。 */
    public get depthTest(): boolean { return this._depthTest; }
    /** @param value 是否执行深度比较，不自动改变 depthWrite / transparent */
    public set depthTest(value: boolean) {
        if (this._depthTest === value) return;
        this._depthTest = value;
        this.updateVersion("pipeline");
    }
    /** 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。 */
    public get depthWrite(): boolean { return this._depthWrite; }
    /** @param value 是否写入深度，不自动改变 depthTest / transparent */
    public set depthWrite(value: boolean) {
        if (this._depthWrite === value) return;
        this._depthWrite = value;
        this.updateVersion("pipeline");
    }
    /** 所有三角面共用的剔除状态。 */
    public get cullMode(): GPUCullMode { return this._cullMode; }
    /** @param value 要剔除的面 */
    public set cullMode(value: GPUCullMode) {
        if (this._cullMode === value) return;
        this._cullMode = value;
        this.updateVersion("pipeline");
    }
    /**
     * 追加已使用的几何类型标记；Rect2d 对应 rect，重复绑定不递增版本。
     * @param type Geometry.type
     * @returns 无返回值
     */
    public addGeometryType(type: string): void {
        const tag: string = type === "Rect2d" ? "rect" : type === "Poly2D" ? "poly" : type;
        if (this._geometryTypes.has(tag)) {
            return;
        }
        this._geometryTypes.add(tag);
        this.updateVersion("pipeline");
    }

    /**
     * 获取指定几何类型的管线缓存键。
     * 材质 key 描述共享状态，类型后缀区分同一材质的不同几何模板。
     * @param type Geometry.type
     * @returns 当前几何对应的管线键
     */
    public getPipelineKey(type: string): string {
        let key: string | undefined = this._pipelineKeys.get(type);
        if (key === undefined) {
            key = this.key + "_" + (type === "Rect2d" ? "rect" : type === "Poly2D" ? "poly" : type);
            this._pipelineKeys.set(type, key);
        }
        return key;
    }

    /**
     * 设置矩形合并三角面顶点着色器源码。
     * @param vertexShader 顶点着色器源码
     */
    public set rectVertexShader(vertexShader: string | undefined) {
        if (this._shaders.rectVertexShader === vertexShader) {
            return;
        }

        this._shaders.rectVertexShader = vertexShader;
        this.updateVersion("pipeline");
    }

    /**
     * 获取矩形合并三角面顶点着色器源码。
     * @returns 顶点着色器源码
     */
    public get rectVertexShader(): string | undefined {
        return this._shaders.rectVertexShader;
    }

    /**
     * 设置矩形合并三角面片元着色器源码。
     * @param fragmentShader 片元着色器源码
     */
    public set rectFragmentShader(fragmentShader: string | undefined) {
        if (this._shaders.rectFragmentShader === fragmentShader) {
            return;
        }

        this._shaders.rectFragmentShader = fragmentShader;
        this.updateVersion("pipeline");
    }

    /**
     * 获取矩形合并三角面片元着色器源码。
     * @returns 片元着色器源码
     */
    public get rectFragmentShader(): string | undefined {
        return this._shaders.rectFragmentShader;
    }

    /** 多边形合并三角面顶点 Shader。 */
    public get polyVertexShader(): string | undefined { return this._shaders.polyVertexShader; }
    /** @param value 多边形顶点 Shader 源码，修改后重建管线 */
    public set polyVertexShader(value: string | undefined) {
        if (this._shaders.polyVertexShader === value) return;
        this._shaders.polyVertexShader = value;
        this.updateVersion("pipeline");
    }
    /** 多边形填充、边框和点型片段 Shader。 */
    public get polyFragmentShader(): string | undefined { return this._shaders.polyFragmentShader; }
    /** @param value 多边形片段 Shader 源码，修改后重建管线 */
    public set polyFragmentShader(value: string | undefined) {
        if (this._shaders.polyFragmentShader === value) return;
        this._shaders.polyFragmentShader = value;
        this.updateVersion("pipeline");
    }


    /** 原生线开关决定是否需要附加 line-list 管线，其余分区通过 Uniform 控制。 */
    public updateKey(): void {
        const key: string = JSON.stringify([
            this.type, this._transparent, this._cullMode, this._depthTest, this._depthWrite,
            this._style.wireframe.enabled,
            this._shaders.rectVertexShader, this._shaders.rectFragmentShader,
            this._shaders.polyVertexShader, this._shaders.polyFragmentShader,
        ]) + [...this._geometryTypes].sort().map((tag: string): string => "_" + tag).join("");
        if (key !== this._key) {
            this._key = key;
            this._pipelineKeys.clear();
        }
    }
}
export default Material;
export type { BorderAlign, MaterialBuffersLike, MaterialChange, MaterialChangeKind, MaterialLike, MaterialSubscriber, PixelAligned, ShadersLike };
