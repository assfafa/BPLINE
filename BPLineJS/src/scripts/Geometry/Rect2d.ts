
import {
    CreateRectBorderGeometry,
    CreateRectGeometry,
    CreateRectLineGeometry,
    CreateRectPointGeometry,
    GetRectPerimeter,
} from "bpmatrixjs/Geometry/Rect";
import Geo from "./Geo";
import type Style from "../Style";
import type { GeoData, GeoPartDataLike } from "./Geo";

/**
 * 矩形初始化选项；所有生成开关均默认关闭，辅助点型独立于面与边框。
 */
interface Rect2dOptions {
    /** 矩形宽度，默认 1，允许为 0。 */
    width?: number;
    /** 矩形高度，默认 1，允许为 0。 */
    height?: number;
    /** 圆角半径，默认 1，生成时限制到半宽和半高的较小值。 */
    radius?: number;
    /** 共享样式；未传入时全部生成分区关闭。 */
    style?: Style;
}

interface Rect2dLike extends GeoData {
    width: number;
    height: number;
    radius: number;
    readonly perimeter: number;
}


class Rect2d extends Geo implements Rect2dLike {
    /**
     * 对象类型
     */
    public readonly type: string = "Rect2d";

    /**
     * 矩形宽度。
     */
    private _width: number;

    /**
     * 矩形高度。
     */
    private _height: number;

    /**
     * 矩形圆角半径。
     */
    private _radius: number;

    /**
     * 创建矩形几何体并生成首个 CPU 数据版本。
     * @param options 宽高、圆角、几何生成开关与辅助点型参数
     */
    public constructor(options: Rect2dOptions = {}) {
        super(options.style);
        this._width = options.width ?? 1;
        this._height = options.height ?? 1;
        this._radius = options.radius ?? 1;
        this.updateGeometry();
    }

    /**
     * 重新生成矩形三角面、UV、索引与 Shader 参数。
     * 完成后提交 CPU 数据版本，通知所有 Render 更新缓存。
     * @returns 当前矩形几何体
     */
    public updateGeometry(): this {
        // 参数规范化不依赖填充面，边框独立生成时也使用相同的合法尺寸。
        this._width = Number.isFinite(this._width) ? Math.max(0, this._width) : 0;
        this._height = Number.isFinite(this._height) ? Math.max(0, this._height) : 0;
        this._radius = Number.isFinite(this._radius)
            ? Math.max(0, Math.min(this._radius, this._width * 0.5, this._height * 0.5))
            : 0;
        const geometry = this.style.solid.enabled
            ? CreateRectGeometry(this._width, this._height, this._radius)
            : undefined;

        this.linePoints = this.style.wireframe.enabled
            ? CreateRectLineGeometry(this._width, this._height, this._radius, 1)
            : undefined;
        const border = this.style.edge.enabled && this.style.edge.width > 0
            ? CreateRectBorderGeometry(
                this._width,
                this._height,
                this._radius,
                this.style.edge.width,
                this.style.edge.uvRepeat,
                this.style.edge.borderAlign,
            )
            : undefined;
        // 两个点位开关都关闭时不调用生成器，避免触发其参数校验。
        const points = this.style.points.enabled && (this.style.points.vertices || this.style.points.midpoints)
            ? CreateRectPointGeometry(
                this._width, this._height, this._radius,
                this.style.points.radius, this.style.points.segments,
                this.style.points.vertices, this.style.points.midpoints,
                this.style.points.minPointsLength, this.style.points.minEdgePointsLength,
            )
            : undefined;
        const parts: { data: GeoPartDataLike; vertexType: number }[] = [];
        if (geometry !== undefined) parts.push({ data: geometry, vertexType: 0 });
        if (border !== undefined) parts.push({ data: border, vertexType: 0.5 });
        if (points !== undefined) parts.push({ data: points, vertexType: 1 });
        this.mergeGeometry(parts);
        // Rect2d Shader 参数：宽度、高度、圆角半径、wide 三角面边框宽度。
        this.uniformData.set([this._width, this._height, this._radius, this.style.edge.width]);
        super.updateGeometry();
        return this;
    }

    /**
     * 设置矩形宽度并递增几何体版本。
     * @param width 矩形宽度
     */
    public set width(width: number) {
        if (this._width === width) {
            return;
        }

        this._width = width;
        this.updateVersion();
    }

    /**
     * 获取矩形宽度。
     * @returns 矩形宽度
     */
    public get width(): number {
        return this._width;
    }

    /**
     * 设置矩形高度并递增几何体版本。
     * @param height 矩形高度
     */
    public set height(height: number) {
        if (this._height === height) {
            return;
        }

        this._height = height;
        this.updateVersion();
    }

    /**
     * 获取矩形高度。
     * @returns 矩形高度
     */
    public get height(): number {
        return this._height;
    }

    /**
     * 设置圆角半径并递增几何体版本。
     * @param radius 圆角半径
     */
    public set radius(radius: number) {
        if (this._radius === radius) {
            return;
        }

        this._radius = radius;
        this.updateVersion();
    }

    /**
     * 获取圆角半径。
     * @returns 圆角半径
     */
    public get radius(): number {
        return this._radius;
    }

    /**
     * 获取矩形实际离散轮廓的只读周长。
     * 结果使用与矩形几何体相同的圆角限制和分段规则。
     * @returns 矩形轮廓周长
     */
    public get perimeter(): number {
        return GetRectPerimeter(this._width, this._height, this._radius);
    }
}
export default Rect2d;
export type { Rect2dLike, Rect2dOptions };
