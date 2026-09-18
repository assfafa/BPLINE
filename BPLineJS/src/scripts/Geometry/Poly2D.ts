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
 * @example
 * CopyPoints(points);
 * @returns 自有数组
 */
const CopyPoints = (points: Float32Array): Float32Array<ArrayBuffer> => {
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (!(points instanceof Float32Array)) {
        throw new TypeError("Poly2D points must be a Float32Array.");
    }
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (points.length % 2 !== 0) {
        throw new RangeError("Poly2D needs complete x/y pairs.");
    }
    // 按轮廓顺序处理节点，使顶点属性与生成索引保持对应。
    for (const value of points) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(value)) {
            throw new RangeError("Poly2D coordinates must be finite.");
        }
    }
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
     * @example
     * const poly2D = new Poly2D(points, style, options);
     * @returns 创建的 Poly2D 对象。
     */
    public constructor(
        points: Float32Array = new Float32Array(0),
        style?: Style | null,
        options: Poly2DOptions = {},
    ) {
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
    /**
     * 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。
     * @example
     * const value = poly2D.points;
     * @returns 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。
     */
    public get points(): Float32Array<ArrayBuffer> {
        return this._points;
    }
    /**
     * 当前自有节点数组；直接改元素后须调用 updateVersion() 或 updateGeometry()。
     * @param value 新坐标，复制并触发下一帧重建
     * @example
     * poly2D.points = value;
     * @returns 无返回值。
     */
    public set points(value: Float32Array) {
        const copied = CopyPoints(value);
        this._points = copied;
        this.updateVersion();
    }
    /**
     * 是否连接末点和首点。
     * @example
     * const value = poly2D.closed;
     * @returns 是否连接末点和首点。
     */
    public get closed(): boolean {
        return this._closed;
    }
    /**
     * 是否连接末点和首点。
     * @param value 闭合开关；开放时需要关闭 solid
     * @example
     * poly2D.closed = value;
     * @returns 无返回值。
     */
    public set closed(value: boolean) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._closed !== value) {
            // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
            if (!value && this.style.solid.enabled) {
                throw new Error("Disable solid before opening Poly2D.");
            }
            this._closed = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 当前轮廓包围盒宽度。
     * @example
     * const value = poly2D.width;
     * @returns 当前轮廓包围盒宽度。
     */
    public get width(): number {
        this.ensureGeometry();
        return this._width;
    }
    /**
     * 当前轮廓包围盒高度。
     * @example
     * const value = poly2D.height;
     * @returns 当前轮廓包围盒高度。
     */
    public get height(): number {
        this.ensureGeometry();
        return this._height;
    }
    /**
     * 中心线长度；开放路径不计算末点到首点，圆接不增加原始路径长度。
     * @example
     * const value = poly2D.perimeter;
     * @returns 中心线长度；开放路径不计算末点到首点，圆接不增加原始路径长度。
     */
    public get perimeter(): number {
        this.ensureGeometry();
        return this._perimeter;
    }
    /**
     * 按当前 Style 全量生成填充、实体边框、辅助点和 line-list，并提交单一版本。
     * join 只改变边框连接，solid 和辅助点仍使用原始节点。
     * @example
     * poly2D.updateGeometry();
     * @returns 当前几何体
     */
    public updateGeometry(): this {
        const join = this.style.join;
        const nodes: PolyNode[] = [];
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let i = 0; i < this._points.length; i += 2) {
            let segments: number = join.seg;
            // 按几何或图元类型选择对应实现，不混用不同模板的规则。
            if (join.type === "bevel") {
                segments = 1;
            }
            nodes.push({
                x: this._points[i],
                y: this._points[i + 1],
                round: join.type !== "miter",
                segments,
            });
        }
        const poly = new Poly(nodes, { closed: this._closed, solid: this.style.solid.enabled });
        let geometry;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (this.style.solid.enabled) {
            geometry = poly.data;
        } else {
            geometry = undefined;
        }
        let line;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (this.style.wireframe.enabled) {
            line = poly.createLineGeometry();
        } else {
            line = undefined;
        }
        const edge = this.style.edge;
        let border;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (edge.enabled && edge.width > 0) {
            border = poly.createBorderGeometry(edge.width, edge.uvRepeat, edge.borderAlign);
        } else {
            border = undefined;
        }
        const point = this.style.points;
        let points;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (point.enabled && (point.vertices || point.midpoints)) {
            points = poly.createPointGeometry(
                point.radius,
                point.segments,
                point.vertices,
                point.midpoints,
                point.minPointsLength,
                point.minEdgePointsLength,
            );
        } else {
            points = undefined;
        }
        const parts: {
            data: GeoPartDataLike;
            vertexType: number;
        }[] = [];
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (geometry !== undefined) {
            parts.push({ data: geometry, vertexType: 0 });
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (border !== undefined) {
            parts.push({ data: border, vertexType: 0.5 });
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (points !== undefined) {
            parts.push({ data: points, vertexType: 1 });
        }
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
