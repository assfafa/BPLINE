import ObjectNode from "../Object";
import type { ObjectNodeLike } from "../Object";
import { Mat3 } from "bpmatrixjs/Math/Mat3";
import { Vec2, type VersionedMath } from "bpmatrixjs/Math";
import type { RenderLike } from "../Render";
import { GetInner } from "bpmatrixjs/Utils";
interface CameraBuffersLike {
    uniform?: number;
}
interface CameraLike extends ObjectNodeLike {
    zoom: number;
    width: number;
    height: number;
    orthogonalMatrix: Mat3;
    viewMatrix: Mat3;
    buffers: CameraBuffersLike;
    readonly top: number;
    readonly left: number;
    readonly bottom: number;
    readonly right: number;
    /**
     * 同时更新相机视口宽高，通知投影矩阵在下一次使用前更新。
     * @param width 新视口宽度
     * @param height 新视口高度
     * @example
     * camera.setViewport(width, height);
     * @returns 无返回值。
     */
    setViewport(width: number, height: number): void;
    /**
     * 在渲染前更新版本落后的矩阵；支持相机挂在 Group/Mesh 内以及独立相机。
     * @example
     * camera.ensureCameraMatrix();
     * @returns 无返回值。
     */
    ensureCameraMatrix(): void;
    /**
     * 强制计算投影矩阵，保持 Y 正方向向上。
     * @example
     * camera.updateOrthogonalMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    updateOrthogonalMatrix(): Mat3;
    /**
     * 先确保父级与自身世界矩阵有效，再计算逆矩阵。
     * @example
     * camera.updateViewMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    updateViewMatrix(): Mat3;
    /**
     * 强制更新投影矩阵和视图矩阵。
     * @example
     * camera.updateCameraMatrix();
     * @returns 无返回值。
     */
    updateCameraMatrix(): void;
    /**
     * 世界坐标转归一化NDC坐标。
     * @param position 世界坐标。
     * @example
     * camera.worldToNdc(position);
     * @returns 归一化NDC坐标。
     */
    worldToNdc(position: Vec2): Vec2;
    /**
     * 归一化ndc坐标转世界坐标
     * @param position 归一化NDC坐标。
     * @example
     * camera.ndcToWorld(position);
     * @returns 世界坐标。
     */
    ndcToWorld(position: Vec2): Vec2;
    /**
     * 归一化NDC坐标转画布坐标。
     * @param position 归一化NDC坐标。
     * @param render 可选渲染器，按画布实际 CSS 尺寸换算；省略时使用相机宽高 / DPR
     * @example
     * camera.ndcToScreen(position, render);
     * @returns 相对画布左上角的 CSS 像素坐标。
     */
    ndcToScreen(position: Vec2, render?: RenderLike): Vec2;
    /**
     * 画布坐标转归一化NDC坐标。
     * @param position 相对画布左上角的 CSS 像素坐标
     * @param render 可选渲染器，省略时使用相机宽高 / DPR
     * @example
     * camera.screenToNdc(position, render);
     * @returns 归一化NDC坐标。
     */
    screenToNdc(position: Vec2, render?: RenderLike): Vec2;
    /**
     * 世界坐标转画布坐标。
     * @param position 世界坐标。
     * @param render 可选渲染器，支持 resize 延迟期间的 CSS 拉伸
     * @example
     * camera.worldToScreen(position, render);
     * @returns 相对画布左上角的 CSS 像素坐标。
     */
    worldToScreen(position: Vec2, render?: RenderLike): Vec2;
    /**
     * 画布坐标转世界坐标
     * @param position 相对画布左上角的 CSS 像素坐标
     * @param render 可选渲染器，按画布实际 CSS 尺寸换算
     * @example
     * camera.screenToWorld(position, render);
     * @returns 世界坐标。
     */
    screenToWorld(position: Vec2, render?: RenderLike): Vec2;
    /**
     * 世界坐标转浏览器视口坐标，适用于 DOM 定位；支持 CSS 平移/轴向缩放，不含旋转/倾斜。
     * @param position 世界坐标。
     * @param render 提供实际画布位置和尺寸的渲染器
     * @example
     * camera.worldToWindow(position, render);
     * @returns clientX/clientY 坐标，不含页面滚动偏移。
     */
    worldToWindow(position: Vec2, render: RenderLike): Vec2;
    /**
     * 浏览器视口坐标转世界坐标。
     * @param position MouseEvent.clientX/clientY，不是 pageX/pageY
     * @param render 提供实际画布位置和尺寸的渲染器
     * @example
     * camera.windowToWorld(position, render);
     * @returns 世界坐标。
     */
    windowToWorld(position: Vec2, render: RenderLike): Vec2;
}
/** 正交相机：输入沿用节点单一版本，矩阵与每个 Render 独立保存处理快照。 */
class Camera extends ObjectNode implements CameraLike {
    /** 对象类型。 */
    public readonly type: string = "Camera";
    private _width: number;
    private _height: number;
    private _zoom: number;
    private _orthogonalMatrix = new Mat3();
    private _viewMatrix = new Mat3();
    private _projectionSnapshot: number = -1;
    private _viewWorldMatrix: Mat3 | undefined;
    private _viewWorldVersion: number = -1;
    private _writingCamera: boolean = false;
    /** 保留的缓冲描述；实际 GPUBuffer 仍由 Render 持有。 */
    public buffers: CameraBuffersLike = {};
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param width 视口宽度
     * @param height 视口高度
     * @param zoom 缩放值
     * @example
     * const camera = new Camera(width, height, zoom);
     * @returns 创建的 Camera 对象。
     */
    public constructor(width: number = 100, height: number = 100, zoom: number = 1) {
        super(0, 0);
        this._width = width;
        this._height = height;
        this._zoom = zoom;
        this._orthogonalMatrix.add(this, "orthogonalMatrix");
        this._viewMatrix.add(this, "viewMatrix");
        this.updateCameraMatrix();
    }
    /**
     * 视口宽度。
     * @example
     * const value = camera.width;
     * @returns 视口宽度。
     */
    public get width(): number {
        return this._width;
    }
    /**
     * 视口宽度。
     * @param value 新宽度
     * @example
     * camera.width = value;
     * @returns 无返回值。
     */
    public set width(value: number) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._width !== value) {
            this._width = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 视口高度。
     * @example
     * const value = camera.height;
     * @returns 视口高度。
     */
    public get height(): number {
        return this._height;
    }
    /**
     * 视口高度。
     * @param value 新高度
     * @example
     * camera.height = value;
     * @returns 无返回值。
     */
    public set height(value: number) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._height !== value) {
            this._height = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 相机缩放。
     * @example
     * const value = camera.zoom;
     * @returns 相机缩放。
     */
    public get zoom(): number {
        return this._zoom;
    }
    /**
     * 相机缩放。
     * @param value 新缩放
     * @example
     * camera.zoom = value;
     * @returns 无返回值。
     */
    public set zoom(value: number) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._zoom !== value) {
            this._zoom = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 正交视口上边界。
     * @example
     * const value = camera.top;
     * @returns 正交视口上边界。
     */
    public get top(): number {
        return (this.height * 0.5) / this.zoom;
    }
    /**
     * 正交视口下边界。
     * @example
     * const value = camera.bottom;
     * @returns 正交视口下边界。
     */
    public get bottom(): number {
        return (-this.height * 0.5) / this.zoom;
    }
    /**
     * 正交视口左边界。
     * @example
     * const value = camera.left;
     * @returns 正交视口左边界。
     */
    public get left(): number {
        return (-this.width * 0.5) / this.zoom;
    }
    /**
     * 正交视口右边界。
     * @example
     * const value = camera.right;
     * @returns 正交视口右边界。
     */
    public get right(): number {
        return (this.width * 0.5) / this.zoom;
    }
    /**
     * 投影矩阵，GPU 上传比较矩阵版本。
     * @example
     * const value = camera.orthogonalMatrix;
     * @returns 投影矩阵，GPU 上传比较矩阵版本。
     */
    public get orthogonalMatrix(): Mat3 {
        return this._orthogonalMatrix;
    }
    /**
     * 投影矩阵，GPU 上传比较矩阵版本。
     * @param value 新投影矩阵，替换引用也使 Render 缓存失效
     * @example
     * camera.orthogonalMatrix = value;
     * @returns 无返回值。
     */
    public set orthogonalMatrix(value: Mat3) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._orthogonalMatrix !== value) {
            this._orthogonalMatrix.delete(this, "orthogonalMatrix");
            this._orthogonalMatrix = value;
            value.add(this, "orthogonalMatrix");
            this.onMathChange(value, "orthogonalMatrix");
        } else {
            return;
        }
    }
    /**
     * 视图矩阵，通常为世界矩阵的逆。
     * @example
     * const value = camera.viewMatrix;
     * @returns 视图矩阵，通常为世界矩阵的逆。
     */
    public get viewMatrix(): Mat3 {
        return this._viewMatrix;
    }
    /**
     * 视图矩阵，通常为世界矩阵的逆。
     * @param value 新视图矩阵
     * @example
     * camera.viewMatrix = value;
     * @returns 无返回值。
     */
    public set viewMatrix(value: Mat3) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._viewMatrix !== value) {
            this._viewMatrix.delete(this, "viewMatrix");
            this._viewMatrix = value;
            value.add(this, "viewMatrix");
            this.onMathChange(value, "viewMatrix");
        } else {
            return;
        }
    }
    /**
     * 接收数学对象的变化通知，更新对应字段的消费者版本。
     * @param source 数学对象
     * @param field 关联字段
     * @example
     * camera.onMathChange(source, field);
     * @returns 无返回值。
     */
    public override onMathChange(source: VersionedMath, field: string): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._nodeDisposed) {
            // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
            if (
                (field === "orthogonalMatrix" && source === this._orthogonalMatrix) ||
                (field === "viewMatrix" && source === this._viewMatrix)
            ) {
                // 内部矩阵同步不反向增加相机输入版本，避免计算结果触发自身重算。
                if (!this._writingCamera) {
                    this.updateVersion();
                    // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                    if (field === "orthogonalMatrix") {
                        this._projectionSnapshot = this.version;
                    } else {
                        this._viewWorldMatrix = this.worldMatrix;
                        this._viewWorldVersion = this.worldMatrix.version;
                    }
                } else {
                    return;
                }
            } else {
                super.onMathChange(source, field);
            }
        } else {
            return;
        }
    }
    /**
     * 同时更新相机视口宽高，通知投影矩阵在下一次使用前更新。
     * @param width 新视口宽度
     * @param height 新视口高度
     * @example
     * camera.setViewport(width, height);
     * @returns 无返回值。
     */
    public setViewport(width: number = 100, height: number = 100): void {
        // 尺寸改变后才更新输入版本，重复设置相同尺寸不触发重建。
        if (this._width !== width || this._height !== height) {
            this._width = width;
            this._height = height;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 相机不提供子节点容器。
     * @example
     * camera.add();
     * @returns 无返回值。
     */
    public add(): void {
        throw new Error("Camera does not support add().");
    }
    /**
     * 在渲染前更新版本落后的矩阵；支持相机挂在 Group/Mesh 内以及独立相机。
     * @example
     * camera.ensureCameraMatrix();
     * @returns 无返回值。
     */
    public ensureCameraMatrix(): void {
        this.ensureWorldMatrix();
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (this._projectionSnapshot !== this.version) {
            this.updateOrthogonalMatrix();
        }
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (
            this._viewWorldMatrix !== this.worldMatrix ||
            this._viewWorldVersion !== this.worldMatrix.version
        ) {
            this.updateViewMatrix();
        }
    }
    /**
     * 强制计算投影矩阵，保持 Y 正方向向上。
     * @example
     * camera.updateOrthogonalMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public updateOrthogonalMatrix(): Mat3 {
        this._writingCamera = true;
        try {
            this._orthogonalMatrix.set([
                (2 * this.zoom) / this.width,
                0,
                0,
                0,
                (2 * this.zoom) / this.height,
                0,
                0,
                0,
                1,
            ]);
            this._projectionSnapshot = this.version;
        } finally {
            this._writingCamera = false;
        }
        return this._orthogonalMatrix;
    }
    /**
     * 先确保父级与自身世界矩阵有效，再计算逆矩阵。
     * @example
     * camera.updateViewMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public updateViewMatrix(): Mat3 {
        this.ensureWorldMatrix();
        this._writingCamera = true;
        try {
            this._viewMatrix.copy(this.worldMatrix).invert();
            this._viewWorldMatrix = this.worldMatrix;
            this._viewWorldVersion = this.worldMatrix.version;
        } finally {
            this._writingCamera = false;
        }
        return this._viewMatrix;
    }
    /**
     * 强制更新投影矩阵和视图矩阵。
     * @example
     * camera.updateCameraMatrix();
     * @returns 无返回值。
     */
    public updateCameraMatrix(): void {
        this.updateOrthogonalMatrix();
        this.updateViewMatrix();
    }
    /**
     * 最终释放相机对所有数学对象的订阅，不销毁共享矩阵。
     * @example
     * camera.dispose();
     * @returns 无返回值。
     */
    public override dispose(): void {
        this._orthogonalMatrix.delete(this, "orthogonalMatrix");
        this._viewMatrix.delete(this, "viewMatrix");
        super.dispose();
    }
    /**
     * 世界坐标转归一化NDC坐标。
     * @param position 世界坐标。
     * @example
     * camera.worldToNdc(position);
     * @returns 归一化NDC坐标。
     */
    public worldToNdc(position: Vec2): Vec2 {
        this.ensureCameraMatrix();
        const view: Vec2 = position.clone().apply(this._viewMatrix);
        const screen: Vec2 = view.apply(this._orthogonalMatrix);
        return screen;
    }
    /**
     * 归一化NDC坐标转画布坐标。
     * @param position 归一化NDC坐标。
     * @param render 可选渲染器，按画布实际 CSS 尺寸换算；省略时使用相机宽高 / DPR
     * @example
     * camera.ndcToScreen(position, render);
     * @returns 相对画布左上角的 CSS 像素坐标。
     */
    public ndcToScreen(position: Vec2, render?: RenderLike): Vec2 {
        const dpr = GetInner().dpr;
        const rect = render?.canvas.getBoundingClientRect();
        const width = rect?.width ?? this.width / dpr;
        const height = rect?.height ?? this.height / dpr;
        return new Vec2((position.x + 1) * 0.5 * width, (1 - position.y) * 0.5 * height);
    }
    /**
     * 世界坐标转画布坐标。
     * @param position 世界坐标。
     * @param render 可选渲染器，支持 resize 延迟期间的 CSS 拉伸
     * @example
     * camera.worldToScreen(position, render);
     * @returns 相对画布左上角的 CSS 像素坐标。
     */
    public worldToScreen(position: Vec2, render?: RenderLike): Vec2 {
        const ndc: Vec2 = this.worldToNdc(position);
        const screen: Vec2 = this.ndcToScreen(ndc, render);
        return screen;
    }
    /**
     * 画布坐标转归一化NDC坐标。
     * @param position 相对画布左上角的 CSS 像素坐标
     * @param render 可选渲染器，省略时使用相机宽高 / DPR
     * @example
     * camera.screenToNdc(position, render);
     * @returns 归一化NDC坐标。
     */
    public screenToNdc(position: Vec2, render?: RenderLike): Vec2 {
        const dpr = GetInner().dpr;
        const rect = render?.canvas.getBoundingClientRect();
        const width = rect?.width ?? this.width / dpr;
        const height = rect?.height ?? this.height / dpr;
        // 画布没有有效显示尺寸时无法换算坐标，明确报告而不是除以零。
        if (width <= 0 || height <= 0) {
            throw new RangeError("Cannot convert coordinates on a zero-size canvas.");
        }
        const x = (position.x / width) * 2 - 1;
        const y = 1 - (position.y / height) * 2;
        const ndc: Vec2 = new Vec2(x, y);
        return ndc;
    }
    /**
     * 归一化ndc坐标转世界坐标
     * @param position 归一化NDC坐标。
     * @example
     * camera.ndcToWorld(position);
     * @returns 世界坐标。
     */
    public ndcToWorld(position: Vec2): Vec2 {
        this.ensureCameraMatrix();
        const view: Vec2 = position.clone().apply(this._orthogonalMatrix.clone().invert());
        const world: Vec2 = view.apply(this._viewMatrix.clone().invert());
        return world;
    }
    /**
     * 画布坐标转世界坐标
     * @param position 相对画布左上角的 CSS 像素坐标
     * @param render 可选渲染器，按画布实际 CSS 尺寸换算
     * @example
     * camera.screenToWorld(position, render);
     * @returns 世界坐标。
     */
    public screenToWorld(position: Vec2, render?: RenderLike): Vec2 {
        const ndc: Vec2 = this.screenToNdc(position, render);
        const world: Vec2 = this.ndcToWorld(ndc);
        return world;
    }
    /**
     * 世界坐标转浏览器视口坐标，适用于 DOM 定位；支持 CSS 平移/轴向缩放，不含旋转/倾斜。
     * @param position 世界坐标。
     * @param render 提供实际画布位置和尺寸的渲染器
     * @example
     * camera.worldToWindow(position, render);
     * @returns clientX/clientY 坐标，不含页面滚动偏移。
     */
    public worldToWindow(position: Vec2, render: RenderLike): Vec2 {
        const screen: Vec2 = this.worldToScreen(position, render);
        const rect: DOMRect = render.canvas.getBoundingClientRect();
        screen.x += rect.left;
        screen.y += rect.top;
        return screen;
    }
    /**
     * 浏览器视口坐标转世界坐标。
     * @param position MouseEvent.clientX/clientY，不是 pageX/pageY
     * @param render 提供实际画布位置和尺寸的渲染器
     * @example
     * camera.windowToWorld(position, render);
     * @returns 世界坐标。
     */
    public windowToWorld(position: Vec2, render: RenderLike): Vec2 {
        const screen: Vec2 = position.clone();
        const rect: DOMRect = render.canvas.getBoundingClientRect();
        screen.x -= rect.left;
        screen.y -= rect.top;
        const world: Vec2 = this.screenToWorld(screen, render);
        return world;
    }
}
export default Camera;
export type { CameraBuffersLike, CameraLike };
