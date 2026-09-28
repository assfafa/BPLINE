/** 文字几何以可见包围盒中心为局部原点，坐标单位由 fontSize 决定。 */
type TextAlign = "left" | "center" | "right";
type TextBaseline = "top" | "middle" | "bottom";

interface TextOptions {
    readonly lineSpacing?: number;
    readonly letterSpacing?: number;
    readonly textAlign?: TextAlign;
    readonly baseline?: TextBaseline;
}

interface TextGeometryData {
    geometry: Float32Array;
    normal: Float32Array;
    uv: Float32Array;
    index: Uint16Array | Uint32Array;
    width: number;
    height: number;
    minX: number;
    minY: number;
    advanceWidth: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    letterSpacing: number;
    textAlign: TextAlign;
    baseline: TextBaseline;
    /** 按 textAlign 从居中包围盒选取的水平锚点。 */
    anchorX: number;
    /** 按 baseline 从居中包围盒选取的垂直锚点。 */
    anchorY: number;
}

type TextBorderAlign = "inset" | "normal" | "outset";

interface TextBorderGeometryData extends TextGeometryData {
    miterScale: Float32Array;
    lineWidth: number;
    uvRepeat: number;
    align: TextBorderAlign;
}

interface TextLineGeometryData extends TextGeometryData {
    uvRepeat: number;
}

interface TextPointGeometryData extends TextGeometryData {
    position: Float32Array;
    pointRadius: number;
    sides: number;
    pointCount: number;
}

interface TextLike {
    readonly text: string;
    readonly fontSize: number;
    readonly fontFamily: string;
    readonly width: number;
    readonly height: number;
    readonly advanceWidth: number;
    readonly lineSpacing: number;
    readonly letterSpacing: number;
    readonly textAlign: TextAlign;
    readonly baseline: TextBaseline;
    readonly data: TextGeometryData;
    readonly borderData: TextBorderGeometryData | undefined;
    readonly lineData: TextLineGeometryData | undefined;
    readonly pointData: TextPointGeometryData | undefined;
    /**
     * 更改文字参数并使附加几何缓存失效。
     * @param text 单行文字
     * @param fontSize 字号
     * @param fontFamily 已注册的字体名称
     * @param options 行距、字距及对齐方式
     * @example
     * textGeometry.set("你好", 32, "MiSans");
     * @returns 当前文字几何生成器
     */
    set(text: string, fontSize?: number, fontFamily?: string, options?: TextOptions): this;
    /**
     * 获取所有可见字形边界的周长。
     * @example
     * textGeometry.getPerimeter();
     * @returns 总边界长度
     */
    getPerimeter(): number;
    /**
     * 生成文字边框的 Shader 外扩载体。
     * @param lineWidth 边框宽度
     * @param uvRepeat 每条闭合边界的 UV 重复次数
     * @param align 边框相对填充区域的方向
     * @example
     * textGeometry.createBorderGeometry(2, 1, "normal");
     * @returns 边框几何数据
     */
    createBorderGeometry(lineWidth?: number, uvRepeat?: number, align?: TextBorderAlign): TextBorderGeometryData;
    /**
     * 生成所有可见字形边界的 line-list。
     * @param uvRepeat 每条闭合边界的 UV 重复次数
     * @example
     * textGeometry.createLineGeometry(1);
     * @returns 线框几何数据
     */
    createLineGeometry(uvRepeat?: number): TextLineGeometryData;
    /**
     * 沿字形边界生成独立点型，供关键点显示。
     * @param pointRadius 点型半径
     * @param sides 点型边数
     * @param vertexPoints 是否显示边界顶点
     * @param midpointPoints 是否显示边界线段中点
     * @param vertexThreshold 相邻边长之和的严格下限
     * @param midpointThreshold 当前边长的严格下限
     * @example
     * textGeometry.createPointGeometry(2, 4, true, false, 0, 0);
     * @returns 点位几何数据
     */
    createPointGeometry(
        pointRadius?: number,
        sides?: number,
        vertexPoints?: boolean,
        midpointPoints?: boolean,
        vertexThreshold?: number,
        midpointThreshold?: number,
    ): TextPointGeometryData;
}

export type {
    TextAlign,
    TextBaseline,
    TextOptions,
    TextGeometryData,
    TextBorderAlign,
    TextBorderGeometryData,
    TextLineGeometryData,
    TextPointGeometryData,
    TextLike,
};
