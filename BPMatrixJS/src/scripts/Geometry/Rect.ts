import { CheckPrecision } from "../Utils/index.js";
import { CreateEmptyGeometryData, CreateRectBorderGeometry, CreateRectGeometry, CreateRectLineGeometry, CreateRectPointGeometry, DefaultRectPrecision, GetRectPerimeter } from "./Rect/geometry.js";
import type { RectBorderAlign, RectBorderGeometryData, RectGeometryData, RectLike, RectLineGeometryData, RectPointGeometryData } from "./Rect/types.js";

/**
 * 矩形几何生成器。
 * 按需维护填充三角面、边框三角面、line-list 轮廓和线框点位数据。
 * @class
 * @implements RectLike
 */
class Rect implements RectLike {
    private _width: number = 0;
    private _height: number = 0;
    private _radius: number = 0;
    private _precision: number = 8;
    private _originPrecision: number = 8;
    private _data: RectGeometryData = CreateEmptyGeometryData();
    private _borderData: RectBorderGeometryData | undefined;
    private _lineData: RectLineGeometryData | undefined;
    private _pointData: RectPointGeometryData | undefined;
    /**
     * 创建矩形几何生成器。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @example
     * const rect = new Rect(width, height, radius);
     * @returns 创建的 Rect 对象。
     */
    public constructor(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)) {
        this.set(width, height, radius, precision);
    }
    /** @example rect.precision; @returns 当前圆角每段的细分数。 */
    public get precision(): number {
        return this._precision;
    }
    /** @param value 新精度，重新生成所有几何缓存 @example rect.precision = 16; @returns 无返回值。 */
    public set precision(value: number) {
        this.set(this.width, this.height, this.radius, CheckPrecision(value));
    }
    /** @example rect.originPrecision; @returns 用户最后指定的基准精度。 */
    public get originPrecision(): number {
        return this._originPrecision;
    }
    /**
     * 更新矩形参数并重新生成填充三角面。
     * 已生成的边框、line 和点位数据会失效，需要按需重新生成。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用当前精度，范围 1–4095
     * @example
     * rect.set(width, height, radius);
     * @returns 当前矩形生成器
     */
    public set(width: number, height: number, radius: number = 0, precision: number = this.precision): this {
        this._data = CreateRectGeometry(width, height, radius, precision);
        this._width = this._data.width;
        this._height = this._data.height;
        this._radius = this._data.radius;
        this._precision = this._data.precision;
        this._originPrecision = this._precision;
        this._borderData = undefined;
        this._lineData = undefined;
        this._pointData = undefined;
        return this;
    }
    /**
     * 生成由顶点着色器扩宽的矩形边框载体三角面。
     * geometry 中每个中心轮廓点重复两次，normal 保存单位外法线，
     * miterScale 保存直角连接处的扩展补偿倍率，
     * UV 的 V 分量使用 0 和 1 区分内外侧顶点。
     * U 沿完整闭合轮廓按 uvRepeat 重复，V 横跨线宽固定为 0 到 1。
     * @param lineWidth 边框宽度
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @param align 边框相对原始轮廓的对齐方式
     * @example
     * rect.createBorderGeometry(lineWidth, uvRepeat, align);
     * @returns 边框三角面数据
     */
    public createBorderGeometry(
        lineWidth: number,
        uvRepeat: number = 1,
        align: RectBorderAlign = "normal",
    ): RectBorderGeometryData {
        this._borderData = CreateRectBorderGeometry(
            this._width,
            this._height,
            this._radius,
            lineWidth,
            uvRepeat,
            align,
            this.precision,
        );
        return this._borderData;
    }
    /**
     * 生成矩形轮廓的 line-list 顶点与索引。
     * U 沿完整闭合轮廓按 uvRepeat 重复。
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @example
     * rect.createLineGeometry(uvRepeat);
     * @returns line-list 轮廓数据
     */
    public createLineGeometry(uvRepeat: number = 1): RectLineGeometryData {
        this._lineData = CreateRectLineGeometry(this._width, this._height, this._radius, uvRepeat, this.precision);
        return this._lineData;
    }
    /**
     * 在线框顶点及线段中点生成独立点型三角面，不会自动生成其他缓存。
     * @param pointRadius 点型半径，默认 2；四边形为半宽、半高
     * @param sides 点型边数，默认 4 为正方形，增加边数可近似圆形
     * @param vertexPoints 是否生成顶点点位，默认开启
     * @param midpointPoints 是否生成线段中点点位，默认关闭；两个开关不能同时关闭
     * @param vertexThreshold 顶点相邻两条边的长度之和必须严格大于此值
     * @param midpointThreshold 中点所在单条边的长度必须严格大于此值
     * @example
     * rect.createPointGeometry(pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 点位三角面数据，并保存到 pointData
     */
    public createPointGeometry(
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
    ): RectPointGeometryData {
        this._pointData = CreateRectPointGeometry(
            this._width,
            this._height,
            this._radius,
            pointRadius,
            sides,
            vertexPoints,
            midpointPoints,
            vertexThreshold,
            midpointThreshold,
            this.precision,
        );
        return this._pointData;
    }
    /**
     * 获取当前矩形实际离散轮廓的周长。
     * 结果使用与几何生成相同的圆角分段，可直接用于计算 UV 重复次数。
     * @example
     * rect.getPerimeter();
     * @returns 当前矩形轮廓周长
     */
    public getPerimeter(): number {
        return GetRectPerimeter(this._width, this._height, this._radius, this.precision);
    }
    /**
     * 获取矩形宽度。
     * @example
     * const value = rect.width;
     * @returns 经过限制的矩形宽度
     */
    public get width(): number {
        return this._width;
    }
    /**
     * 获取矩形高度。
     * @example
     * const value = rect.height;
     * @returns 经过限制的矩形高度
     */
    public get height(): number {
        return this._height;
    }
    /**
     * 获取圆角半径。
     * @example
     * const value = rect.radius;
     * @returns 经过限制的圆角半径
     */
    public get radius(): number {
        return this._radius;
    }
    /**
     * 获取填充三角面数据。
     * @example
     * const value = rect.data;
     * @returns 填充三角面数据
     */
    public get data(): RectGeometryData {
        return this._data;
    }
    /**
     * 获取最近一次生成的边框三角面数据。
     * @example
     * const value = rect.borderData;
     * @returns 边框三角面数据，尚未生成时为 undefined
     */
    public get borderData(): RectBorderGeometryData | undefined {
        return this._borderData;
    }
    /**
     * 获取最近一次生成的 line-list 数据。
     * @example
     * const value = rect.lineData;
     * @returns line-list 数据，尚未生成时为 undefined
     */
    public get lineData(): RectLineGeometryData | undefined {
        return this._lineData;
    }
    /**
     * 获取最近一次生成的点位三角面。
     * @example
     * const value = rect.pointData;
     * @returns 点位数据，尚未生成或矩形参数改变后为 undefined
     */
    public get pointData(): RectPointGeometryData | undefined {
        return this._pointData;
    }
    /**
     * 获取指定矩形实际离散轮廓的周长。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @example
     * rect.GetPerimeter(width, height, radius);
     * @returns 矩形轮廓周长
     */
    public static GetPerimeter(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): number {
        return GetRectPerimeter(width, height, radius, precision);
    }
    /**
     * 直接生成矩形填充三角面。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @example
     * rect.CreateGeometry(width, height, radius);
     * @returns 填充三角面数据
     */
    public static CreateGeometry(width: number, height: number, radius: number = 0, precision: number = DefaultRectPrecision(width, height, radius)): RectGeometryData {
        return CreateRectGeometry(width, height, radius, precision);
    }
    /**
     * 直接生成由顶点着色器扩宽的矩形边框载体三角面。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @param lineWidth 边框宽度
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @param align 边框相对原始轮廓的对齐方式
     * @example
     * rect.CreateBorderGeometry(width, height, radius, lineWidth, uvRepeat, align);
     * @returns 边框三角面数据
     */
    public static CreateBorderGeometry(
        width: number,
        height: number,
        radius: number = 0,
        lineWidth: number = 1,
        uvRepeat: number = 1,
        align: RectBorderAlign = "normal",
        precision: number = DefaultRectPrecision(width, height, radius, lineWidth, align),
    ): RectBorderGeometryData {
        return CreateRectBorderGeometry(width, height, radius, lineWidth, uvRepeat, align, precision);
    }
    /**
     * 直接生成矩形 line-list 轮廓。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @param uvRepeat 贴图沿完整轮廓顺向重复次数
     * @example
     * rect.CreateLineGeometry(width, height, radius, uvRepeat);
     * @returns line-list 轮廓数据
     */
    public static CreateLineGeometry(
        width: number,
        height: number,
        radius: number = 0,
        uvRepeat: number = 1,
        precision: number = DefaultRectPrecision(width, height, radius),
    ): RectLineGeometryData {
        return CreateRectLineGeometry(width, height, radius, uvRepeat, precision);
    }
    /**
     * 直接生成矩形线框点位。
     * @param width 矩形宽度
     * @param height 矩形高度
     * @param radius 矩形圆角半径
     * @param precision 圆角分段数，省略时沿用半径推算，范围 1–4095
     * @param pointRadius 点型半径，四边形为半宽、半高
     * @param sides 点型边数，默认 4
     * @param vertexPoints 是否生成顶点点位
     * @param midpointPoints 是否生成中点点位；不能与 vertexPoints 同时关闭
     * @param vertexThreshold 相邻两条边长度之和的严格下限
     * @param midpointThreshold 中点所在边长度的严格下限
     * @example
     * rect.CreatePointGeometry(width, height, radius, pointRadius, sides, vertexPoints, midpointPoints, vertexThreshold, midpointThreshold);
     * @returns 点位三角面数据
     */
    public static CreatePointGeometry(
        width: number,
        height: number,
        radius: number = 0,
        pointRadius: number = 2,
        sides: number = 4,
        vertexPoints: boolean = true,
        midpointPoints: boolean = false,
        vertexThreshold: number = 0,
        midpointThreshold: number = 0,
        precision: number = DefaultRectPrecision(width, height, radius),
    ): RectPointGeometryData {
        return CreateRectPointGeometry(
            width,
            height,
            radius,
            pointRadius,
            sides,
            vertexPoints,
            midpointPoints,
            vertexThreshold,
            midpointThreshold,
            precision,
        );
    }
}

export {
    CreateRectBorderGeometry,
    CreateRectGeometry,
    CreateRectLineGeometry,
    CreateRectPointGeometry,
    GetRectPerimeter,
    Rect,
};

export type {
    RectBorderAlign,
    RectBorderGeometryData,
    RectGeometryData,
    RectLike,
    RectLineGeometryData,
    RectPointGeometryData,
};
