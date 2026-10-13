import { NormalizeSize } from "./PartStyle";
import TexturedStyle from "./TexturedStyle";
import type { PixelAligned } from "./types";

/** 关键点样式；总开关与顶点/边中点选择分离。 */
class PointsStyle extends TexturedStyle {
    /** 点标记的 U 轴 UV 固定在一张贴图内。 */
    protected override _addressModeU: GPUAddressMode = "clamp-to-edge";
    /** 点标记的 V 轴 UV 固定在一张贴图内。 */
    protected override _addressModeV: GPUAddressMode = "clamp-to-edge";
    private _pixelAligned: PixelAligned = "px";
    private _vertices: boolean = true;
    private _midpoints: boolean = false;
    private _radius: number = 2;
    private _segments: number = 4;
    private _minPointsLength: number = 6;
    private _minEdgePointsLength: number = 4;
    /**
     * 创建关闭的点型，默认选择顶点点位，UV 两轴固定不重复。
     * @example
     * const pointsStyle = new PointsStyle();
     * @returns 创建的 PointsStyle 对象。
     */
    public constructor() {
        super("points");
    }
    /**
     * 复制关键点形状、过滤阈值和贴图设置。
     * @param source 来源关键点样式
     * @example
     * target.copy(source);
     * @returns 当前关键点样式。
     */
    public override copy(source: PointsStyle): this {
        super.copy(source);
        this.pixelAligned = source.pixelAligned;
        this.vertices = source.vertices;
        this.midpoints = source.midpoints;
        this.radius = source.radius;
        this.segments = source.segments;
        this.minPointsLength = source.minPointsLength;
        this.minEdgePointsLength = source.minEdgePointsLength;
        return this;
    }

    /**
     * 创建独立的关键点样式。
     * @example
     * const duplicate = pointsStyle.clone();
     * @returns 新关键点样式。
     */
    public override clone(): PointsStyle {
        return new PointsStyle().copy(this);
    }
    /**
     * px 固定像素，zoom 随相机缩放。
     * @example
     * const value = pointsStyle.pixelAligned;
     * @returns px 固定像素，zoom 随相机缩放。
     */
    public get pixelAligned(): PixelAligned {
        return this._pixelAligned;
    }
    /**
     * px 固定像素，zoom 随相机缩放。
     * @param value px 固定像素，zoom 随相机缩放。
     * @example
     * pointsStyle.pixelAligned = value;
     * @returns 无返回值。
     */
    public set pixelAligned(value: PixelAligned) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["px", "zoom"].includes(value)) {
            throw new TypeError("Invalid pixel alignment.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._pixelAligned !== value) {
            this._pixelAligned = value;
            this.notify("pixelAligned");
        } else {
            return;
        }
    }
    /**
     * 是否生成顶点点位；仍受 enabled 总开关控制。
     * @example
     * const value = pointsStyle.vertices;
     * @returns 是否生成顶点点位；仍受 enabled 总开关控制。
     */
    public get vertices(): boolean {
        return this._vertices;
    }
    /**
     * 是否生成顶点点位；仍受 enabled 总开关控制。
     * @param value 是否生成顶点点位；仍受 enabled 总开关控制。
     * @example
     * pointsStyle.vertices = value;
     * @returns 无返回值。
     */
    public set vertices(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._vertices !== value) {
            this._vertices = value;
            this.notify("vertices");
        } else {
            return;
        }
    }
    /**
     * 是否生成边中点；仍受 enabled 总开关控制。
     * @example
     * const value = pointsStyle.midpoints;
     * @returns 是否生成边中点；仍受 enabled 总开关控制。
     */
    public get midpoints(): boolean {
        return this._midpoints;
    }
    /**
     * 是否生成边中点；仍受 enabled 总开关控制。
     * @param value 是否生成边中点；仍受 enabled 总开关控制。
     * @example
     * pointsStyle.midpoints = value;
     * @returns 无返回值。
     */
    public set midpoints(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._midpoints !== value) {
            this._midpoints = value;
            this.notify("midpoints");
        } else {
            return;
        }
    }
    /**
     * 点半径，默认 2。
     * @example
     * const value = pointsStyle.radius;
     * @returns 点半径，默认 2。
     */
    public get radius(): number {
        return this._radius;
    }
    /**
     * 点半径，默认 2。
     * @param value 点半径，默认 2。
     * @example
     * pointsStyle.radius = value;
     * @returns 无返回值。
     */
    public set radius(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._radius !== value) {
            this._radius = value;
            this.notify("radius");
        } else {
            return;
        }
    }
    /**
     * 点型边数，默认 4。
     * @example
     * const value = pointsStyle.segments;
     * @returns 点型边数，默认 4。
     */
    public get segments(): number {
        return this._segments;
    }
    /**
     * 点型边数，默认 4。
     * @param value 点型边数，默认 4。
     * @example
     * pointsStyle.segments = value;
     * @returns 无返回值。
     */
    public set segments(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isSafeInteger(value) || value < 3) {
            throw new RangeError("Point segments must be an integer >= 3.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._segments !== value) {
            this._segments = value;
            this.notify("segments");
        } else {
            return;
        }
    }
    /**
     * 顶点相邻边长度之和的严格下限。
     * @example
     * const value = pointsStyle.minPointsLength;
     * @returns 顶点相邻边长度之和的严格下限。
     */
    public get minPointsLength(): number {
        return this._minPointsLength;
    }
    /**
     * 顶点相邻边长度之和的严格下限。
     * @param value 顶点相邻边长度之和的严格下限。
     * @example
     * pointsStyle.minPointsLength = value;
     * @returns 无返回值。
     */
    public set minPointsLength(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._minPointsLength !== value) {
            this._minPointsLength = value;
            this.notify("minPointsLength");
        } else {
            return;
        }
    }
    /**
     * 边中点所在边长度的严格下限。
     * @example
     * const value = pointsStyle.minEdgePointsLength;
     * @returns 边中点所在边长度的严格下限。
     */
    public get minEdgePointsLength(): number {
        return this._minEdgePointsLength;
    }
    /**
     * 边中点所在边长度的严格下限。
     * @param value 边中点所在边长度的严格下限。
     * @example
     * pointsStyle.minEdgePointsLength = value;
     * @returns 无返回值。
     */
    public set minEdgePointsLength(value: number) {
        value = NormalizeSize(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._minEdgePointsLength !== value) {
            this._minEdgePointsLength = value;
            this.notify("minEdgePointsLength");
        } else {
            return;
        }
    }
}

export default PointsStyle;
