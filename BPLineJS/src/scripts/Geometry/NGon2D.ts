import NGon from "bpmatrixjs/Geometry/NGon";
import type { NGonUVMode } from "bpmatrixjs/Geometry/NGon";
import Geo from "./Geo";
import type { GeoData, GeoPartDataLike } from "./Geo";
import type Style from "../Style";
interface NGon2DOptions {
    /** 外接圆半径，默认 1，允许为 0。 */
    outer?: number;
    /** 内轮廓半径，默认 0；大于 0 自动留孔，限制到 outer。 */
    inner?: number;
    /** 边数，默认 32；至少 2，2 为无填充的直径线段。 */
    sides?: number;
    /** 填充面 UV：bounding 包围盒或 polar 极坐标，默认 bounding。 */
    uvMode?: NGonUVMode;
    /** 首点角度，默认 0，单位弧度。 */
    startAngle?: number;
    /** 可选共享样式，未提供或 null 时各生成分区关闭。 */
    style?: Style | null;
}
interface NGon2DLike extends GeoData {
    outer: number;
    inner: number;
    sides: number;
    uvMode: NGonUVMode;
    startAngle: number;
    readonly width: number;
    readonly height: number;
    readonly perimeter: number;
}
/**
 * 校验半径参数，拒绝非有限数值并处理尺寸边界。
 * @param value 半径
 * @example
 * CheckRadius(value);
 * @returns 校验后的有限非负半径
 */
const CheckRadius = (value: number): number => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (value < 0 || !Number.isFinite(Math.fround(value * 2))) {
        throw new RangeError("NGon2D radii must be finite, nonnegative Float32 sizes.");
    }
    return value;
};
/**
 * 正多边形、圆盘近似或圆环；圆心为 (0,0)，填充、边框和关键点合并绘制。
 * hole/nvMode/inter 仅在内部适配 BPMatrixJS，公开接口为 inner/uvMode。
 */
class NGon2D extends Geo implements NGon2DLike {
    /** 用于材质与管线选择的几何类型。 */
    public readonly type: string = "NGon2D";
    private _outer: number;
    private _inner: number;
    private _sides: number;
    private _uvMode: NGonUVMode;
    private _startAngle: number;
    private _width: number = 0;
    private _height: number = 0;
    private _perimeter: number = 0;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param options 内外半径、边数、UV 模式、朝向和共享样式
     * @example
     * const nGon2D = new NGon2D(options);
     * @returns 创建的 NGon2D 对象。
     */
    public constructor(options: NGon2DOptions = {}) {
        // 订阅 Style 前先验证，非法参数不会留下无法释放的消费者。
        const shape = new NGon({
            outer: options.outer ?? 1,
            inter: options.inner ?? 0,
            sides: options.sides ?? 32,
            nvMode: options.uvMode ?? "bounding",
            startAngle: options.startAngle ?? 0,
            solid: false,
        });
        super(options.style ?? undefined);
        this._outer = shape.outer;
        this._inner = shape.inter;
        this._sides = shape.sides;
        this._uvMode = shape.nvMode;
        this._startAngle = shape.startAngle;
        try {
            this.updateGeometry();
        } catch (error) {
            this.dispose();
            throw error;
        }
    }
    /**
     * 外轮廓外接圆半径。
     * @example
     * const value = nGon2D.outer;
     * @returns 外轮廓外接圆半径。
     */
    public get outer(): number {
        return this._outer;
    }
    /**
     * 外轮廓外接圆半径。
     * @param value 非负外半径，缩小时同时钳制 inner，只提交一次版本
     * @example
     * nGon2D.outer = value;
     * @returns 无返回值。
     */
    public set outer(value: number) {
        CheckRadius(value);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._outer !== value) {
            this._outer = value;
            this._inner = Math.min(this._inner, value);
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 内轮廓半径；0 为实心，等于 outer 时无填充面积。
     * @example
     * const value = nGon2D.inner;
     * @returns 内轮廓半径；0 为实心，等于 outer 时无填充面积。
     */
    public get inner(): number {
        return this._inner;
    }
    /**
     * 内轮廓半径；0 为实心，等于 outer 时无填充面积。
     * @param value 非负内半径，自动限制到 outer
     * @example
     * nGon2D.inner = value;
     * @returns 无返回值。
     */
    public set inner(value: number) {
        value = Math.min(CheckRadius(value), this._outer);
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._inner !== value) {
            this._inner = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 多边形边数；增加边数可近似圆形。
     * @example
     * const value = nGon2D.sides;
     * @returns 多边形边数；增加边数可近似圆形。
     */
    public get sides(): number {
        return this._sides;
    }
    /**
     * 多边形边数；增加边数可近似圆形。
     * @param value 2 到 65536 的整数
     * @example
     * nGon2D.sides = value;
     * @returns 无返回值。
     */
    public set sides(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isInteger(value) || value < 2 || value > 65536) {
            throw new RangeError("NGon2D sides must be an integer in [2, 65536].");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._sides !== value) {
            this._sides = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 填充 UV 模式，实体边框与关键点仍使用各自 UV。
     * @example
     * const value = nGon2D.uvMode;
     * @returns 填充 UV 模式，实体边框与关键点仍使用各自 UV。
     */
    public get uvMode(): NGonUVMode {
        return this._uvMode;
    }
    /**
     * 填充 UV 模式，实体边框与关键点仍使用各自 UV。
     * @param value bounding 或 polar，变化后下一帧全量更新几何
     * @example
     * nGon2D.uvMode = value;
     * @returns 无返回值。
     */
    public set uvMode(value: NGonUVMode) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["bounding", "polar"].includes(value)) {
            throw new TypeError("Invalid NGon2D uvMode.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._uvMode !== value) {
            this._uvMode = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 第一顶点的弧度角，默认从 +X 方向起始。
     * @example
     * const value = nGon2D.startAngle;
     * @returns 第一顶点的弧度角，默认从 +X 方向起始。
     */
    public get startAngle(): number {
        return this._startAngle;
    }
    /**
     * 第一顶点的弧度角，默认从 +X 方向起始。
     * @param value 有限弧度
     * @example
     * nGon2D.startAngle = value;
     * @returns 无返回值。
     */
    public set startAngle(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isFinite(value)) {
            throw new RangeError("NGon2D startAngle must be finite.");
        }
        value %= Math.PI * 2;
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._startAngle !== value) {
            this._startAngle = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 原始外轮廓的包围盒宽度，不包含边框外扩。
     * @example
     * const value = nGon2D.width;
     * @returns 原始外轮廓的包围盒宽度，不包含边框外扩。
     */
    public get width(): number {
        this.ensureGeometry();
        return this._width;
    }
    /**
     * 原始外轮廓的包围盒高度，不包含边框外扩。
     * @example
     * const value = nGon2D.height;
     * @returns 原始外轮廓的包围盒高度，不包含边框外扩。
     */
    public get height(): number {
        this.ensureGeometry();
        return this._height;
    }
    /**
     * 内外独立轮廓的总长度，不使用圆周长近似多边形周长。
     * @example
     * const value = nGon2D.perimeter;
     * @returns 内外独立轮廓的总长度，不使用圆周长近似多边形周长。
     */
    public get perimeter(): number {
        this.ensureGeometry();
        return this._perimeter;
    }
    /**
     * 重建各生成分区并提交单一版本；开启内孔时索引不会跨越孔洞。
     * Style 颜色变化只上传样式，半径、边数和生成参数变化才重建几何。
     * @example
     * nGon2D.updateGeometry();
     * @returns 当前几何体
     */
    public updateGeometry(): this {
        const shape = new NGon({
            outer: this._outer,
            inter: this._inner,
            hole: this._inner > 0,
            sides: this._sides,
            nvMode: this._uvMode,
            startAngle: this._startAngle,
            solid: this.style.solid.enabled,
        });
        const parts: {
            data: GeoPartDataLike;
            vertexType: number;
        }[] = [];
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (this.style.solid.enabled) {
            parts.push({ data: shape.data, vertexType: 0 });
        }
        const edge = this.style.edge;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (edge.enabled && edge.width > 0) {
            parts.push({
                data: shape.createBorderGeometry(edge.width, edge.uvRepeat, edge.borderAlign),
                vertexType: 0.5,
            });
        }
        const points = this.style.points;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (points.enabled && (points.vertices || points.midpoints)) {
            parts.push({
                data: shape.createPointGeometry(
                    points.radius,
                    points.segments,
                    points.vertices,
                    points.midpoints,
                    points.minPointsLength,
                    points.minEdgePointsLength,
                ),
                vertexType: 1,
            });
        }
        let line;
        // 只为启用的样式区域生成数据，关闭区域不占用额外几何。
        if (this.style.wireframe.enabled) {
            line = shape.createLineGeometry();
        } else {
            line = undefined;
        }
        this.mergeGeometry(parts);
        this.linePoints = line;
        this._width = shape.width;
        this._height = shape.height;
        this._perimeter = shape.getPerimeter();
        // NGon 专属四个 f32；第四项仍与其他几何一样存放实体边框宽度。
        this.uniformData.set([this._outer, this._inner, this._sides, edge.width]);
        super.updateGeometry();
        return this;
    }
}
export default NGon2D;
export type { NGon2DLike, NGon2DOptions, NGonUVMode };
