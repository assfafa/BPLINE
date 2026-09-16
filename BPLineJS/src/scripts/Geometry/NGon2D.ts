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

/** @param value 半径 @returns 校验后的有限非负半径 */
const CheckRadius = (value: number): number => {
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

    /** @param options 内外半径、边数、UV 模式、朝向和共享样式 */
    public constructor(options: NGon2DOptions = {}) {
        // 订阅 Style 前先验证，非法参数不会留下无法释放的消费者。
        const shape = new NGon({
            outer: options.outer ?? 1, inter: options.inner ?? 0,
            sides: options.sides ?? 32, nvMode: options.uvMode ?? "bounding",
            startAngle: options.startAngle ?? 0, solid: false,
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

    /** 外轮廓外接圆半径。 */
    public get outer(): number { return this._outer; }
    /** @param value 非负外半径，缩小时同时钳制 inner，只提交一次版本 */
    public set outer(value: number) {
        CheckRadius(value);
        if (this._outer === value) return;
        this._outer = value;
        this._inner = Math.min(this._inner, value);
        this.updateVersion();
    }
    /** 内轮廓半径；0 为实心，等于 outer 时无填充面积。 */
    public get inner(): number { return this._inner; }
    /** @param value 非负内半径，自动限制到 outer */
    public set inner(value: number) {
        value = Math.min(CheckRadius(value), this._outer);
        if (this._inner === value) return;
        this._inner = value;
        this.updateVersion();
    }
    /** 多边形边数；增加边数可近似圆形。 */
    public get sides(): number { return this._sides; }
    /** @param value 2 到 65536 的整数 */
    public set sides(value: number) {
        if (!Number.isInteger(value) || value < 2 || value > 65536) throw new RangeError("NGon2D sides must be an integer in [2, 65536].");
        if (this._sides === value) return;
        this._sides = value;
        this.updateVersion();
    }
    /** 填充 UV 模式，实体边框与关键点仍使用各自 UV。 */
    public get uvMode(): NGonUVMode { return this._uvMode; }
    /** @param value bounding 或 polar，变化后下一帧全量更新几何 */
    public set uvMode(value: NGonUVMode) {
        if (!["bounding", "polar"].includes(value)) throw new TypeError("Invalid NGon2D uvMode.");
        if (this._uvMode === value) return;
        this._uvMode = value;
        this.updateVersion();
    }
    /** 第一顶点的弧度角，默认从 +X 方向起始。 */
    public get startAngle(): number { return this._startAngle; }
    /** @param value 有限弧度 */
    public set startAngle(value: number) {
        if (!Number.isFinite(value)) throw new RangeError("NGon2D startAngle must be finite.");
        value %= Math.PI * 2;
        if (this._startAngle === value) return;
        this._startAngle = value;
        this.updateVersion();
    }
    /** 原始外轮廓的包围盒宽度，不包含边框外扩。 */
    public get width(): number { this.ensureGeometry(); return this._width; }
    /** 原始外轮廓的包围盒高度，不包含边框外扩。 */
    public get height(): number { this.ensureGeometry(); return this._height; }
    /** 内外独立轮廓的总长度，不使用圆周长近似多边形周长。 */
    public get perimeter(): number { this.ensureGeometry(); return this._perimeter; }

    /**
     * 重建各生成分区并提交单一版本；开启内孔时索引不会跨越孔洞。
     * Style 颜色变化只上传样式，半径、边数和生成参数变化才重建几何。
     * @returns 当前几何体
     */
    public updateGeometry(): this {
        const shape = new NGon({
            outer: this._outer, inter: this._inner, hole: this._inner > 0,
            sides: this._sides, nvMode: this._uvMode, startAngle: this._startAngle,
            solid: this.style.solid.enabled,
        });
        const parts: { data: GeoPartDataLike; vertexType: number }[] = [];
        if (this.style.solid.enabled) parts.push({ data: shape.data, vertexType: 0 });
        const edge = this.style.edge;
        if (edge.enabled && edge.width > 0) {
            parts.push({ data: shape.createBorderGeometry(edge.width, edge.uvRepeat, edge.borderAlign), vertexType: 0.5 });
        }
        const points = this.style.points;
        if (points.enabled && (points.vertices || points.midpoints)) {
            parts.push({
                data: shape.createPointGeometry(points.radius, points.segments, points.vertices, points.midpoints, points.minPointsLength, points.minEdgePointsLength),
                vertexType: 1,
            });
        }
        const line = this.style.wireframe.enabled ? shape.createLineGeometry() : undefined;
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
