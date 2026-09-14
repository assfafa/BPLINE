import TexturedStyle from "./TexturedStyle";
import { NormalizeSize } from "./PartStyle";
import type { PixelAligned } from "./types";

/** 关键点样式；总开关与顶点/边中点选择分离。 */
class PointsStyle extends TexturedStyle {
    /** 创建关闭的点型，默认选择顶点点位，UV 两轴固定不重复。 */
    public constructor() {
        super("points");
        this.addressModeU = "clamp-to-edge";
        this.addressModeV = "clamp-to-edge";
    }

    private _pixelAligned: PixelAligned = "px";
    /** px 固定像素，zoom 随相机缩放。 */
    public get pixelAligned(): PixelAligned { return this._pixelAligned; }
    /** @param value px 固定像素，zoom 随相机缩放。 */
    public set pixelAligned(value: PixelAligned) {
        if (!["px", "zoom"].includes(value)) throw new TypeError("Invalid pixel alignment.");
        if (this._pixelAligned === value) return;
        this._pixelAligned = value;
        this.notify("pixelAligned");
    }


    private _vertices: boolean = true;
    /** 是否生成顶点点位；仍受 enabled 总开关控制。 */
    public get vertices(): boolean { return this._vertices; }
    /** @param value 是否生成顶点点位；仍受 enabled 总开关控制。 */
    public set vertices(value: boolean) {

        if (this._vertices === value) return;
        this._vertices = value;
        this.notify("vertices");
    }


    private _midpoints: boolean = false;
    /** 是否生成边中点；仍受 enabled 总开关控制。 */
    public get midpoints(): boolean { return this._midpoints; }
    /** @param value 是否生成边中点；仍受 enabled 总开关控制。 */
    public set midpoints(value: boolean) {

        if (this._midpoints === value) return;
        this._midpoints = value;
        this.notify("midpoints");
    }


    private _radius: number = 2;
    /** 点半径，默认 2。 */
    public get radius(): number { return this._radius; }
    /** @param value 点半径，默认 2。 */
    public set radius(value: number) {
        value = NormalizeSize(value);
        if (this._radius === value) return;
        this._radius = value;
        this.notify("radius");
    }


    private _segments: number = 4;
    /** 点型边数，默认 4。 */
    public get segments(): number { return this._segments; }
    /** @param value 点型边数，默认 4。 */
    public set segments(value: number) {
        if (!Number.isSafeInteger(value) || value < 3) throw new RangeError("Point segments must be an integer >= 3.");
        if (this._segments === value) return;
        this._segments = value;
        this.notify("segments");
    }


    private _minPointsLength: number = 6;
    /** 顶点相邻边长度之和的严格下限。 */
    public get minPointsLength(): number { return this._minPointsLength; }
    /** @param value 顶点相邻边长度之和的严格下限。 */
    public set minPointsLength(value: number) {
        value = NormalizeSize(value);
        if (this._minPointsLength === value) return;
        this._minPointsLength = value;
        this.notify("minPointsLength");
    }


    private _minEdgePointsLength: number = 4;
    /** 边中点所在边长度的严格下限。 */
    public get minEdgePointsLength(): number { return this._minEdgePointsLength; }
    /** @param value 边中点所在边长度的严格下限。 */
    public set minEdgePointsLength(value: number) {
        value = NormalizeSize(value);
        if (this._minEdgePointsLength === value) return;
        this._minEdgePointsLength = value;
        this.notify("minEdgePointsLength");
    }

}
export default PointsStyle;
