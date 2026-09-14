import ObjectNode from "../Object";
import type { ObjectNodeLike } from "../Object";
import { Mat3 } from "bpmatrixjs/Math/Mat3";
import type { VersionedMath } from "bpmatrixjs/Math";

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
    setViewport(width: number, height: number): void;
    ensureCameraMatrix(): void;
    updateOrthogonalMatrix(): Mat3;
    updateViewMatrix(): Mat3;
    updateCameraMatrix(): void;
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

    /** @param width 视口宽度 @param height 视口高度 @param zoom 缩放值 */
    public constructor(width: number = 100, height: number = 100, zoom: number = 1) {
        super(0, 0);
        this._width = width;
        this._height = height;
        this._zoom = zoom;
        this._orthogonalMatrix.add(this, "orthogonalMatrix");
        this._viewMatrix.add(this, "viewMatrix");
        this.updateCameraMatrix();
    }

    /** 视口宽度。 */
    public get width(): number { return this._width; }
    /** @param value 新宽度 */
    public set width(value: number) {
        if (this._width === value) return;
        this._width = value;
        this.updateVersion();
    }
    /** 视口高度。 */
    public get height(): number { return this._height; }
    /** @param value 新高度 */
    public set height(value: number) {
        if (this._height === value) return;
        this._height = value;
        this.updateVersion();
    }
    /** 相机缩放。 */
    public get zoom(): number { return this._zoom; }
    /** @param value 新缩放 */
    public set zoom(value: number) {
        if (this._zoom === value) return;
        this._zoom = value;
        this.updateVersion();
    }
    /** 正交视口上边界。 */
    public get top(): number { return this.height * 0.5 / this.zoom; }
    /** 正交视口下边界。 */
    public get bottom(): number { return -this.height * 0.5 / this.zoom; }
    /** 正交视口左边界。 */
    public get left(): number { return -this.width * 0.5 / this.zoom; }
    /** 正交视口右边界。 */
    public get right(): number { return this.width * 0.5 / this.zoom; }

    /** 投影矩阵，GPU 上传比较矩阵版本。 */
    public get orthogonalMatrix(): Mat3 { return this._orthogonalMatrix; }
    /** @param value 新投影矩阵，替换引用也使 Render 缓存失效 */
    public set orthogonalMatrix(value: Mat3) {
        if (this._orthogonalMatrix === value) return;
        this._orthogonalMatrix.delete(this, "orthogonalMatrix");
        this._orthogonalMatrix = value;
        value.add(this, "orthogonalMatrix");
        this.onMathChange(value, "orthogonalMatrix");
    }
    /** 视图矩阵，通常为世界矩阵的逆。 */
    public get viewMatrix(): Mat3 { return this._viewMatrix; }
    /** @param value 新视图矩阵 */
    public set viewMatrix(value: Mat3) {
        if (this._viewMatrix === value) return;
        this._viewMatrix.delete(this, "viewMatrix");
        this._viewMatrix = value;
        value.add(this, "viewMatrix");
        this.onMathChange(value, "viewMatrix");
    }

    /** @param source 数学对象 @param field 关联字段 */
    public override onMathChange(source: VersionedMath, field: string): void {
        if (this._nodeDisposed) return;
        if ((field === "orthogonalMatrix" && source === this._orthogonalMatrix)
            || (field === "viewMatrix" && source === this._viewMatrix)) {
            if (this._writingCamera) return;
            this.updateVersion();
            if (field === "orthogonalMatrix") this._projectionSnapshot = this.version;
            else {
                this._viewWorldMatrix = this.worldMatrix;
                this._viewWorldVersion = this.worldMatrix.version;
            }
        } else super.onMathChange(source, field);
    }

    /** @param width 新视口宽度 @param height 新视口高度 */
    public setViewport(width: number = 100, height: number = 100): void {
        if (this._width === width && this._height === height) return;
        this._width = width;
        this._height = height;
        this.updateVersion();
    }
    /** 相机不提供子节点容器。 */
    public add(): void { throw new Error("Camera does not support add()."); }

    /** 在渲染前更新版本落后的矩阵；支持相机挂在 Group/Mesh 内以及独立相机。 */
    public ensureCameraMatrix(): void {
        this.ensureWorldMatrix();
        if (this._projectionSnapshot !== this.version) this.updateOrthogonalMatrix();
        if (this._viewWorldMatrix !== this.worldMatrix || this._viewWorldVersion !== this.worldMatrix.version) {
            this.updateViewMatrix();
        }
    }

    /** 强制计算投影矩阵，保持 Y 正方向向上。 */
    public updateOrthogonalMatrix(): Mat3 {
        this._writingCamera = true;
        try {
            this._orthogonalMatrix.set([
                2 * this.zoom / this.width, 0, 0,
                0, 2 * this.zoom / this.height, 0,
                0, 0, 1,
            ]);
            this._projectionSnapshot = this.version;
        } finally {
            this._writingCamera = false;
        }
        return this._orthogonalMatrix;
    }

    /** 先确保父级与自身世界矩阵有效，再计算逆矩阵。 */
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

    /** 强制更新投影矩阵和视图矩阵。 */
    public updateCameraMatrix(): void {
        this.updateOrthogonalMatrix();
        this.updateViewMatrix();
    }

    /** 最终释放相机对所有数学对象的订阅，不销毁共享矩阵。 */
    public override dispose(): void {
        this._orthogonalMatrix.delete(this, "orthogonalMatrix");
        this._viewMatrix.delete(this, "viewMatrix");
        super.dispose();
    }
}
export default Camera;
export type { CameraBuffersLike, CameraLike };
