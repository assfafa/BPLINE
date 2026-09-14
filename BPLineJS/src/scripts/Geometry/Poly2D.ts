import Poly from "bpmatrixjs/Geometry/Poly";
import type { PolyNode } from "bpmatrixjs/Geometry/Poly";
import Geo from "./Geo";
import type { GeoData, GeoPartDataLike } from "./Geo";
import type Style from "../Style";

interface Poly2DOptions {
    /** 默认闭合；开放路径不能启用 style.solid.enabled。 */
    closed?: boolean;
}

interface Poly2DLike extends GeoData {
    points: Float32Array;
    closed: boolean;
    readonly width: number;
    readonly height: number;
    readonly perimeter: number;
}

/**
 * 验证并复制 [x,y,x,y,...] 输入，防止调用方修改原数组后静默改变几何。
 * @param points 有序单轮廓坐标，只接收 Float32Array
 * @returns 自有数组
 */
const CopyPoints = (points: Float32Array): Float32Array<ArrayBuffer> => {
    if (!(points instanceof Float32Array)) throw new TypeError("Poly2D points must be a Float32Array.");
    if (points.length % 2 !== 0) throw new RangeError("Poly2D needs complete x/y pairs.");
    for (const value of points) if (!Number.isFinite(value)) throw new RangeError("Poly2D coordinates must be finite.");
    return new Float32Array(points);
};

/** 单轮廓多边形/开放折线，使用通用三角面填充和实体边框，不使用矩形 SDF。 */
class Poly2D extends Geo implements Poly2DLike {
    /** 对象及管线选择类型。 */
    public readonly type: string = "Poly2D";
    private _points: Float32Array<ArrayBuffer>;
    private _closed: boolean;
    private _width: number = 0;
    private _height: number = 0;
    private _perimeter: number = 0;

    /**
     * 创建多边形，不平移输入坐标。
     * @param points 有序平面坐标 [x,y,...]，默认空数组；点数不足暂不生成，输入会复制
     * @param style 可省略或传 null，此时创建全部分区关闭的 Style
     * @param options 可选闭合设置，默认 true；开放路径使用 closed:false
     */
    public constructor(points: Float32Array = new Float32Array(0), style?: Style | null, options: Poly2DOptions = {}) {
        const copied = CopyPoints(points);
        super(style ?? undefined);
        this._points = copied;
        this._closed = options.closed ?? true;
        try {
            this.updateGeometry();
        } catch (error) {
            this.dispose();
            throw error;
        }
    }

    /** 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。 */
    public get points(): Float32Array<ArrayBuffer> { return this._points; }
    /** @param value 新坐标，复制并触发下一帧重建 */
    public set points(value: Float32Array) {
        const copied = CopyPoints(value);
        this._points = copied;
        this.updateVersion();
    }
    /** 是否连接末点和首点。 */
    public get closed(): boolean { return this._closed; }
    /** @param value 闭合开关；开放时需要关闭 solid */
    public set closed(value: boolean) {
        if (this._closed === value) return;
        if (!value && this.style.solid.enabled) throw new Error("Disable solid before opening Poly2D.");
        this._closed = value;
        this.updateVersion();
    }
    /** 当前轮廓包围盒宽度。 */
    public get width(): number { this.ensureGeometry(); return this._width; }
    /** 当前轮廓包围盒高度。 */
    public get height(): number { this.ensureGeometry(); return this._height; }
    /** 中心线长度；开放路径不计算末点到首点，圆接不增加原始路径长度。 */
    public get perimeter(): number { this.ensureGeometry(); return this._perimeter; }

    /**
     * 按当前 Style 全量生成填充、实体边框、辅助点和 line-list，并提交单一版本。
     * join 只改变边框连接，solid 和辅助点仍使用原始节点。
     * @returns 当前几何体
     */
    public updateGeometry(): this {
        const join = this.style.join;
        const nodes: PolyNode[] = [];
        for (let i = 0; i < this._points.length; i += 2) {
            nodes.push({ x: this._points[i], y: this._points[i + 1], round: join.type !== "miter", segments: join.type === "bevel" ? 1 : join.seg });
        }
        const poly = new Poly(nodes, { closed: this._closed, solid: this.style.solid.enabled });
        const geometry = this.style.solid.enabled ? poly.data : undefined;
        const line = this.style.wireframe.enabled ? poly.createLineGeometry() : undefined;
        const edge = this.style.edge;
        const border = edge.enabled && edge.width > 0 ? poly.createBorderGeometry(edge.width, edge.uvRepeat, edge.borderAlign) : undefined;
        const point = this.style.points;
        const points = point.enabled && (point.vertices || point.midpoints)
            ? poly.createPointGeometry(point.radius, point.segments, point.vertices, point.midpoints, point.minPointsLength, point.minEdgePointsLength)
            : undefined;
        const parts: { data: GeoPartDataLike; vertexType: number }[] = [];
        if (geometry !== undefined) parts.push({ data: geometry, vertexType: 0 });
        if (border !== undefined) parts.push({ data: border, vertexType: 0.5 });
        if (points !== undefined) parts.push({ data: points, vertexType: 1 });
        this.mergeGeometry(parts);
        this.linePoints = line;
        this._width = poly.width;
        this._height = poly.height;
        this._perimeter = poly.getPerimeter();
        // 沿用四个 f32 的几何 Uniform，第三项不用于多边形，UV 已由生成器给出。
        this.uniformData.set([poly.width, poly.height, 0, edge.width]);
        super.updateGeometry();
        return this;
    }
}

export default Poly2D;
export type { Poly2DLike, Poly2DOptions };
