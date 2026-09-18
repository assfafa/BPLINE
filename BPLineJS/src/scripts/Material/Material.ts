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
    ngonVertexShader?: string;
    ngonFragmentShader?: string;
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
    /**
     * 接收材质变化通知，区分样式数据与资源引用的更新。
     * @param change 变化来源、区域及字段信息
     * @example
     * materialSubscriber.onMaterialChange(change);
     * @returns 无返回值。
     */
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
    /**
     * 追加已使用的几何类型标记；Rect2D 对应 rect，重复绑定不递增版本。
     * @param type Geometry.type
     * @example
     * material.addGeometryType(type);
     * @returns 无返回值
     */
    addGeometryType(type: string): void;
    /**
     * 获取指定几何类型的管线缓存键。
     * 材质 key 描述共享状态，类型后缀区分同一材质的不同几何模板。
     * @param type Geometry.type
     * @example
     * material.getPipelineKey(type);
     * @returns 当前几何对应的管线键
     */
    getPipelineKey(type: string): string;
    rectVertexShader: string | undefined;
    rectFragmentShader: string | undefined;
    polyVertexShader: string | undefined;
    polyFragmentShader: string | undefined;
    ngonVertexShader: string | undefined;
    ngonFragmentShader: string | undefined;
    /**
     * 原生线开关决定是否需要附加 line-list 管线，其余分区通过 Uniform 控制。
     * @example
     * material.updateKey();
     * @returns 无返回值。
     */
    updateKey(): void;
    /**
     * 递增单一版本并通知消费者，颜色变化不会改变 key。
     * @param kind 影响范围，手动调用默认全部失效
     * @example
     * material.updateVersion(kind);
     * @returns 无返回值。
     */
    updateVersion(kind?: MaterialChangeKind): void;
    /**
     * 关联使用当前材质的消费者，Set 自动去重。
     * @param subscriber Mesh 或其他材质消费者
     * @example
     * material.add(subscriber);
     * @returns 无返回值。
     */
    add(subscriber: MaterialSubscriber): void;
    /**
     * 解绑消费者，不销毁共享 Style、Texture 或 GPU 缓存。
     * @param subscriber 需要解绑的消费者
     * @example
     * material.delete(subscriber);
     * @returns 无返回值。
     */
    delete(subscriber: MaterialSubscriber): void;
    /**
     * 最终停止使用时解绑 Style，不销毁共享贴图或 GPU 缓存。
     * @example
     * material.dispose();
     * @returns 无返回值。
     */
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
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param style 共享样式，默认各分区关闭
     * @example
     * const this = new Material(style);
     * @returns 创建的 Material 对象。
     */
    protected constructor(style: Style = new Style()) {
        this._style = style;
        style.add(this);
    }
    /**
     * 当前共享样式。
     * @example
     * const value = material.style;
     * @returns 当前共享样式。
     */
    public get style(): Style {
        return this._style;
    }
    /**
     * 当前共享样式。
     * @param value 新样式；解绑旧引用，并更新材质版本及 Pipeline key
     * @example
     * material.style = value;
     * @returns 无返回值。
     */
    public set style(value: Style) {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed material cannot be reused.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._style !== value) {
            this._style.delete(this);
            this._style = value;
            value.add(this);
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 接收共享样式的字段变化，通知当前对象的使用者。
     * @param change 样式变化；区分数值、贴图引用和贴图内容，避免无关缓冲重复上传
     * @example
     * material.onStyleChange(change);
     * @returns 无返回值。
     */
    public onStyleChange(change: StyleChange): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._disposed && change.source === this._style) {
            let kind: MaterialChangeKind;
            // 根据变化字段选择更新范围，避免无关属性触发资源重建。
            if (change.field === "texture") {
                kind = "texture";
            } else {
                // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                if (change.field === "textureData") {
                    kind = "textureData";
                } else {
                    // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                    if (change.field === "addressModeU" || change.field === "addressModeV") {
                        kind = "sampler";
                    } else {
                        kind = "style";
                    }
                }
            }
            this.updateVersion(kind);
        } else {
            return;
        }
    }
    /**
     * 最终停止使用时解绑 Style，不销毁共享贴图或 GPU 缓存。
     * @example
     * material.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._style.delete(this);
        this._subscribers.clear();
        this._disposed = true;
    }
    /**
     * 关联使用当前材质的消费者，Set 自动去重。
     * @param subscriber Mesh 或其他材质消费者
     * @example
     * material.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: MaterialSubscriber): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._disposed) {
            throw new Error("Disposed material cannot be reused.");
        }
        this._subscribers.add(subscriber);
    }
    /**
     * 解绑消费者，不销毁共享 Style、Texture 或 GPU 缓存。
     * @param subscriber 需要解绑的消费者
     * @example
     * material.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: MaterialSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 单一材质版本。
     * @example
     * const value = material.version;
     * @returns 单一材质版本。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 固定管线状态与 Shader 对应的缓存键。
     * @example
     * const value = material.key;
     * @returns 固定管线状态与 Shader 对应的缓存键。
     */
    public get key(): string {
        return this._key;
    }
    /**
     * 递增单一版本并通知消费者，颜色变化不会改变 key。
     * @param kind 影响范围，手动调用默认全部失效
     * @example
     * material.updateVersion(kind);
     * @returns 无返回值。
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
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onMaterialChange(change);
        }
    }
    /**
     * 所有分区共用的透明混合状态。
     * @example
     * const value = material.transparent;
     * @returns 所有分区共用的透明混合状态。
     */
    public get transparent(): boolean {
        return this._transparent;
    }
    /**
     * 所有分区共用的透明混合状态。
     * @param value 是否开启透明混合
     * @example
     * material.transparent = value;
     * @returns 无返回值。
     */
    public set transparent(value: boolean) {
        // 区分深度和透明状态，保持当前阶段的遮挡与混合约定。
        if (this._transparent !== value) {
            this._transparent = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。
     * @example
     * const value = material.depthTest;
     * @returns 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。
     */
    public get depthTest(): boolean {
        return this._depthTest;
    }
    /**
     * 是否比较深度，默认 false；关闭时作为最后绘制的覆盖层。
     * @param value 是否执行深度比较，不自动改变 depthWrite / transparent
     * @example
     * material.depthTest = value;
     * @returns 无返回值。
     */
    public set depthTest(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._depthTest !== value) {
            this._depthTest = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。
     * @example
     * const value = material.depthWrite;
     * @returns 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。
     */
    public get depthWrite(): boolean {
        return this._depthWrite;
    }
    /**
     * 是否记录通过测试的片元深度，默认 false；普通透明物体通常应关闭。
     * @param value 是否写入深度，不自动改变 depthTest / transparent
     * @example
     * material.depthWrite = value;
     * @returns 无返回值。
     */
    public set depthWrite(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._depthWrite !== value) {
            this._depthWrite = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 所有三角面共用的剔除状态。
     * @example
     * const value = material.cullMode;
     * @returns 所有三角面共用的剔除状态。
     */
    public get cullMode(): GPUCullMode {
        return this._cullMode;
    }
    /**
     * 所有三角面共用的剔除状态。
     * @param value 要剔除的面
     * @example
     * material.cullMode = value;
     * @returns 无返回值。
     */
    public set cullMode(value: GPUCullMode) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._cullMode !== value) {
            this._cullMode = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 追加已使用的几何类型标记；Rect2D 对应 rect，重复绑定不递增版本。
     * @param type Geometry.type
     * @example
     * material.addGeometryType(type);
     * @returns 无返回值
     */
    public addGeometryType(type: string): void {
        let tag: string;
        // 按几何或图元类型选择对应实现，不混用不同模板的规则。
        if (type === "Rect2D") {
            tag = "rect";
        } else {
            // 按几何或图元类型选择对应实现，不混用不同模板的规则。
            if (type === "Poly2D") {
                tag = "poly";
            } else {
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                if (type === "NGon2D") {
                    tag = "ngon";
                } else {
                    tag = type;
                }
            }
        }
        // 检查集合中的关联关系，避免重复处理或遗漏引用。
        if (!this._geometryTypes.has(tag)) {
            this._geometryTypes.add(tag);
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 获取指定几何类型的管线缓存键。
     * 材质 key 描述共享状态，类型后缀区分同一材质的不同几何模板。
     * @param type Geometry.type
     * @example
     * material.getPipelineKey(type);
     * @returns 当前几何对应的管线键
     */
    public getPipelineKey(type: string): string {
        let key: string | undefined = this._pipelineKeys.get(type);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (key === undefined) {
            let tag: string = type;
            // 按几何或图元类型选择对应实现，不混用不同模板的规则。
            if (type === "Rect2D") {
                tag = "rect";
            } else if (type === "Poly2D") {
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                tag = "poly";
            } else if (type === "NGon2D") {
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                tag = "ngon";
            }
            key = this.key + "_" + tag;
            this._pipelineKeys.set(type, key);
        }
        return key;
    }
    /**
     * 设置矩形合并三角面顶点着色器源码。
     * @param vertexShader 顶点着色器源码
     * @example
     * material.rectVertexShader = vertexShader;
     * @returns 无返回值。
     */
    public set rectVertexShader(vertexShader: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.rectVertexShader !== vertexShader) {
            this._shaders.rectVertexShader = vertexShader;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 获取矩形合并三角面顶点着色器源码。
     * @example
     * const value = material.rectVertexShader;
     * @returns 顶点着色器源码
     */
    public get rectVertexShader(): string | undefined {
        return this._shaders.rectVertexShader;
    }
    /**
     * 设置矩形合并三角面片元着色器源码。
     * @param fragmentShader 片元着色器源码
     * @example
     * material.rectFragmentShader = fragmentShader;
     * @returns 无返回值。
     */
    public set rectFragmentShader(fragmentShader: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.rectFragmentShader !== fragmentShader) {
            this._shaders.rectFragmentShader = fragmentShader;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 获取矩形合并三角面片元着色器源码。
     * @example
     * const value = material.rectFragmentShader;
     * @returns 片元着色器源码
     */
    public get rectFragmentShader(): string | undefined {
        return this._shaders.rectFragmentShader;
    }
    /**
     * 多边形合并三角面顶点 Shader。
     * @example
     * const value = material.polyVertexShader;
     * @returns 多边形合并三角面顶点 Shader。
     */
    public get polyVertexShader(): string | undefined {
        return this._shaders.polyVertexShader;
    }
    /**
     * 多边形合并三角面顶点 Shader。
     * @param value 多边形顶点 Shader 源码，修改后重建管线
     * @example
     * material.polyVertexShader = value;
     * @returns 无返回值。
     */
    public set polyVertexShader(value: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.polyVertexShader !== value) {
            this._shaders.polyVertexShader = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 多边形填充、边框和点型片段 Shader。
     * @example
     * const value = material.polyFragmentShader;
     * @returns 多边形填充、边框和点型片段 Shader。
     */
    public get polyFragmentShader(): string | undefined {
        return this._shaders.polyFragmentShader;
    }
    /**
     * 多边形填充、边框和点型片段 Shader。
     * @param value 多边形片段 Shader 源码，修改后重建管线
     * @example
     * material.polyFragmentShader = value;
     * @returns 无返回值。
     */
    public set polyFragmentShader(value: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.polyFragmentShader !== value) {
            this._shaders.polyFragmentShader = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 正多边形/圆环的合并三角面顶点 WGSL。
     * @example
     * const value = material.ngonVertexShader;
     * @returns 正多边形/圆环的合并三角面顶点 WGSL。
     */
    public get ngonVertexShader(): string | undefined {
        return this._shaders.ngonVertexShader;
    }
    /**
     * 正多边形/圆环的合并三角面顶点 WGSL。
     * @param value NGon 顶点源码，修改后使管线缓存键失效
     * @example
     * material.ngonVertexShader = value;
     * @returns 无返回值。
     */
    public set ngonVertexShader(value: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.ngonVertexShader !== value) {
            this._shaders.ngonVertexShader = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 正多边形/圆环的填充、边框和点型片段 WGSL。
     * @example
     * const value = material.ngonFragmentShader;
     * @returns 正多边形/圆环的填充、边框和点型片段 WGSL。
     */
    public get ngonFragmentShader(): string | undefined {
        return this._shaders.ngonFragmentShader;
    }
    /**
     * 正多边形/圆环的填充、边框和点型片段 WGSL。
     * @param value NGon 片段源码，修改后使管线缓存键失效
     * @example
     * material.ngonFragmentShader = value;
     * @returns 无返回值。
     */
    public set ngonFragmentShader(value: string | undefined) {
        // 着色器源码实际改变后更新管线键，让后续渲染选择新的模板。
        if (this._shaders.ngonFragmentShader !== value) {
            this._shaders.ngonFragmentShader = value;
            this.updateVersion("pipeline");
        } else {
            return;
        }
    }
    /**
     * 原生线开关决定是否需要附加 line-list 管线，其余分区通过 Uniform 控制。
     * @example
     * material.updateKey();
     * @returns 无返回值。
     */
    public updateKey(): void {
        /**
         * 为已经排序的几何标签增加统一分隔符。
         * @param tag 已经注册的几何类型标签
         * @example
         * FormatGeometryTag(tag);
         * @returns 带下划线前缀的几何标签。
         */
        const FormatGeometryTag = (tag: string): string => "_" + tag;
        const key: string =
            JSON.stringify([
                this.type,
                this._transparent,
                this._cullMode,
                this._depthTest,
                this._depthWrite,
                this._style.wireframe.enabled,
                this._shaders.rectVertexShader,
                this._shaders.rectFragmentShader,
                this._shaders.polyVertexShader,
                this._shaders.polyFragmentShader,
                this._shaders.ngonVertexShader,
                this._shaders.ngonFragmentShader,
            ]) + [...this._geometryTypes].sort().map(FormatGeometryTag).join("");
        // 管线状态真正变化时清空派生键缓存，否则复用原键。
        if (key !== this._key) {
            this._key = key;
            this._pipelineKeys.clear();
        }
    }
}
export default Material;
export type {
    BorderAlign,
    MaterialBuffersLike,
    MaterialChange,
    MaterialChangeKind,
    MaterialLike,
    MaterialSubscriber,
    PixelAligned,
    ShadersLike,
};
