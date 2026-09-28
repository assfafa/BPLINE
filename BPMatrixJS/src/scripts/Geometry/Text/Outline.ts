import { GLU_TESS, GL_LINE_LOOP, GL_TRIANGLES, GluTesselator, WINDING } from "libtess-ts";
import type { PathCommand } from "fontkit";
import { GetTextFont } from "./Fonts.js";
import type { TextAlign } from "./types.js";

type TextPoint = readonly [number, number];

interface TextOutline {
    contours: TextPoint[][];
    triangles: TextPoint[];
    width: number;
    height: number;
    minX: number;
    minY: number;
    advanceWidth: number;
    perimeter: number;
}

/**
 * 求控制点相对弦的距离，作为曲线细分的停止条件。
 * @param point 控制点
 * @param start 弦起点
 * @param end 弦终点
 * @example
 * ControlDistance(point, start, end);
 * @returns 距离
 */
const ControlDistance = (point: TextPoint, start: TextPoint, end: TextPoint): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    // 零长度弦仍可能包含向外弯曲的控制点。
    if (length > 0) {
        return Math.abs(dx * (start[1] - point[1]) - dy * (start[0] - point[0])) / length;
    } else {
        return Math.hypot(point[0] - start[0], point[1] - start[1]);
    }
};

/**
 * 将互不重复的点追加到当前轮廓。
 * @param points 当前轮廓
 * @param point 新点
 * @example
 * PushPoint(points, point);
 * @returns 无返回值
 */
const PushPoint = (points: TextPoint[], point: TextPoint): void => {
    // GPU 顶点为 Float32；超出其有限范围的坐标直接拒绝。
    if (!Number.isFinite(Math.fround(point[0])) || !Number.isFinite(Math.fround(point[1]))) {
        throw new RangeError("Text coordinates must fit finite Float32 values.");
    }
    const last = points.at(-1);
    // 连续重合点会产生退化边，剖分和法线都不需要它们。
    if (last?.[0] !== point[0] || last[1] !== point[1]) {
        points.push(point);
    }
};

/**
 * 递归细分二次 Bézier，误差以最终几何单位衡量。
 * @param points 输出轮廓
 * @param start 起点
 * @param control 控制点
 * @param end 终点
 * @param tolerance 容许误差
 * @param depth 当前递归深度
 * @example
 * FlattenQuadratic(points, start, control, end, 0.5, 0);
 * @returns 无返回值
 */
const FlattenQuadratic = (
    points: TextPoint[],
    start: TextPoint,
    control: TextPoint,
    end: TextPoint,
    tolerance: number,
    depth: number,
): void => {
    // 递归上限阻止异常字体产生无限顶点；正常曲线按误差停止。
    if (ControlDistance(control, start, end) <= tolerance || depth >= 12) {
        PushPoint(points, end);
    } else {
        const first: TextPoint = [(start[0] + control[0]) * 0.5, (start[1] + control[1]) * 0.5];
        const second: TextPoint = [(control[0] + end[0]) * 0.5, (control[1] + end[1]) * 0.5];
        const middle: TextPoint = [(first[0] + second[0]) * 0.5, (first[1] + second[1]) * 0.5];
        FlattenQuadratic(points, start, first, middle, tolerance, depth + 1);
        FlattenQuadratic(points, middle, second, end, tolerance, depth + 1);
    }
};

/**
 * 递归细分三次 Bézier，两个控制点都必须接近端点弦。
 * @param points 输出轮廓
 * @param start 起点
 * @param firstControl 第一个控制点
 * @param secondControl 第二个控制点
 * @param end 终点
 * @param tolerance 容许误差
 * @param depth 当前递归深度
 * @example
 * FlattenCubic(points, start, firstControl, secondControl, end, 0.5, 0);
 * @returns 无返回值
 */
const FlattenCubic = (
    points: TextPoint[],
    start: TextPoint,
    firstControl: TextPoint,
    secondControl: TextPoint,
    end: TextPoint,
    tolerance: number,
    depth: number,
): void => {
    const firstDistance = ControlDistance(firstControl, start, end);
    const secondDistance = ControlDistance(secondControl, start, end);
    // 控制点接近弦时用直线近似，否则用 de Casteljau 拆半。
    if (Math.max(firstDistance, secondDistance) <= tolerance || depth >= 12) {
        PushPoint(points, end);
    } else {
        const a: TextPoint = [(start[0] + firstControl[0]) * 0.5, (start[1] + firstControl[1]) * 0.5];
        const b: TextPoint = [(firstControl[0] + secondControl[0]) * 0.5, (firstControl[1] + secondControl[1]) * 0.5];
        const c: TextPoint = [(secondControl[0] + end[0]) * 0.5, (secondControl[1] + end[1]) * 0.5];
        const d: TextPoint = [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
        const e: TextPoint = [(b[0] + c[0]) * 0.5, (b[1] + c[1]) * 0.5];
        const middle: TextPoint = [(d[0] + e[0]) * 0.5, (d[1] + e[1]) * 0.5];
        FlattenCubic(points, start, a, d, middle, tolerance, depth + 1);
        FlattenCubic(points, middle, e, c, end, tolerance, depth + 1);
    }
};

/**
 * 将一个字形的路径命令转成独立闭合轮廓。
 * @param commands fontkit 路径命令
 * @param originX 字形 X 位置，输出单位
 * @param originY 字形 Y 位置，输出单位
 * @param scale 字体单位到输出单位的比例
 * @param tolerance 曲线误差
 * @returns 字形轮廓
 * @example
 * FlattenPath(glyph.path.commands, 0, 0, 0.032, 0.5);
 */
const FlattenPath = (
    commands: readonly PathCommand[],
    originX: number,
    originY: number,
    scale: number,
    tolerance: number,
): TextPoint[][] => {
    const contours: TextPoint[][] = [];
    let current: TextPoint[] = [];
    let last: TextPoint = [0, 0];
    /**
     * 转换字体局部坐标为输出坐标。
     * @param x 字体 X
     * @param y 字体 Y
     * @example
     * Place(x, y);
     * @returns 输出坐标
     */
    const Place = (x: number, y: number): TextPoint => [originX + x * scale, originY + y * scale];
    /**
     * 结束当前轮廓并移除闭合重复点。
     * @example
     * FinishContour();
     * @returns 无返回值
     */
    const FinishContour = (): void => {
        // 空白字形和退化轮廓不参与剖分。
        if (current.length >= 3) {
            const first = current[0];
            const end = current.at(-1);
            // 闭合命令可能已经把起点作为末点输出。
            if (end?.[0] === first[0] && end[1] === first[1]) {
                current.pop();
            }
            // 删除闭合重复点后，仍须保留至少三个不同顶点。
            if (current.length >= 3) {
                contours.push(current);
            }
        }
        current = [];
    };
    // 每个 moveTo 开始独立轮廓；不能将字母的孔连成同一条路径。
    for (const command of commands) {
        const values = command.args;
        // 新轮廓以 moveTo 开始，原轮廓需要先结算。
        if (command.command === "moveTo") {
            FinishContour();
            last = Place(values[0], values[1]);
            PushPoint(current, last);
        } else if (command.command === "lineTo") {
            // 直线端点直接写入，连续重复点由 PushPoint 清理。
            last = Place(values[0], values[1]);
            PushPoint(current, last);
        } else if (command.command === "quadraticCurveTo") {
            // 二次曲线按误差递归采样。
            const control = Place(values[0], values[1]);
            const end = Place(values[2], values[3]);
            FlattenQuadratic(current, last, control, end, tolerance, 0);
            last = end;
        } else if (command.command === "bezierCurveTo") {
            // 三次曲线的两个控制点都参与误差检查。
            const firstControl = Place(values[0], values[1]);
            const secondControl = Place(values[2], values[3]);
            const end = Place(values[4], values[5]);
            FlattenCubic(current, last, firstControl, secondControl, end, tolerance, 0);
            last = end;
        } else {
            FinishContour();
        }
    }
    FinishContour();
    return contours;
};

/**
 * 使用 nonzero 填充规则同时取得填充三角面与真正可见的边界。
 * @param input 字体原始轮廓
 * @example
 * Tessellate(input);
 * @returns 三角面顶点和闭合边界
 */
const Tessellate = (input: readonly TextPoint[][]): Pick<TextOutline, "triangles" | "contours"> => {
    const triangles: TextPoint[] = [];
    const contours: TextPoint[][] = [];
    // 空格等没有轮廓的字形不需要创建剖分器。
    if (input.length > 0) {
        const tess = new GluTesselator();
        let mode = 0;
        let boundary: TextPoint[] = [];
        let error = 0;
        tess.gluTessNormal(0, 0, 1);
        /**
         * 区分三角面与边界环的回调批次。
         * @param type GL 图元类型
         * @example
         * OnBegin(GL_TRIANGLES);
         * @returns 无返回值
         */
        const OnBegin = (type: number): void => {
            mode = type;
            boundary = [];
        };
        /**
         * 收集填充三角面或实际边界的顶点。
         * @param data 剖分器传出的二维坐标
         * @example
         * OnVertex([0, 0]);
         * @returns 无返回值
         */
        const OnVertex = (data: unknown): void => {
            const point = data as TextPoint;
            // 两次渲染调用依次输出三角面与边界环。
            if (mode === GL_TRIANGLES) {
                triangles.push(point);
            } else if (mode === GL_LINE_LOOP) {
                // 边界环不包含填充内部边，适合线框和关键点。
                PushPoint(boundary, point);
            }
        };
        /**
         * 结算一条完整的可见边界环。
         * @example
         * OnEnd();
         * @returns 无返回值
         */
        const OnEnd = (): void => {
            // 保留每个独立字形外圈及内孔的实际填充边界。
            if (mode === GL_LINE_LOOP && boundary.length >= 3) {
                contours.push(boundary);
            }
        };
        /**
         * 返回交叉处新生成的边界顶点。
         * @param coords 三维坐标，文字只用 X/Y
         * @example
         * OnCombine([0, 0, 0]);
         * @returns 二维坐标
         */
        const OnCombine = (coords: [number, number, number]): TextPoint => [coords[0], coords[1]];
        /**
         * 记录剖分器错误，避免输出孔洞错误的几何。
         * @param code 剖分器错误码
         * @example
         * OnError(100156);
         * @returns 无返回值
         */
        const OnError = (code: number): void => {
            error = code;
        };
        tess.gluTessCallback(GLU_TESS.BEGIN, OnBegin);
        tess.gluTessCallback(GLU_TESS.VERTEX, OnVertex);
        tess.gluTessCallback(GLU_TESS.END, OnEnd);
        tess.gluTessCallback(GLU_TESS.COMBINE, OnCombine);
        tess.gluTessCallback(GLU_TESS.ERROR, OnError);
        tess.gluTessBeginPolygon();
        // 所有轮廓属于同一个填充域，交叠区由 nonzero 规则消除。
        for (const contour of input) {
            tess.gluTessBeginContour();
            // 输入轮廓方向原样保留，nonzero 规则依赖每条路径的绕序。
            for (const point of contour) {
                tess.gluTessVertex([point[0], point[1]], point);
            }
            tess.gluTessEndContour();
        }
        tess.compute(WINDING.NONZERO);
        tess.renderTriangles();
        tess.renderBoundary();
        tess.gluDeleteTess();
        // 解析错误不能退化为错误填充，尤其是孔洞区域。
        if (error !== 0) {
            throw new Error("Text contour tessellation failed: " + String(error));
        }
    }
    return { triangles, contours };
};

/**
 * 排列多行字形，并提取填充三角面、实际边界与度量。
 * @param text 支持换行的文字
 * @param fontSize 几何字号
 * @param fontFamily 已注册字体名称
 * @param lineSpacing 行间附加距离
 * @param letterSpacing 相邻字形间的附加距离
 * @param textAlign 每行相对最大行宽的对齐方式
 * @param tolerance 曲线细分误差
 * @example
 * CreateTextOutline("MiSans", 32, "MiSans", 0, 0, "center", 0.5);
 * @returns 可用于各类文字几何的共享轮廓
 */
const CreateTextOutline = (
    text: string,
    fontSize: number,
    fontFamily: string,
    lineSpacing: number = 0,
    letterSpacing: number = 0,
    textAlign: TextAlign = "center",
    tolerance: number = 0.5,
): TextOutline => {
    // 字号必须明确且有限，防止不可绘制的数据进入 GPU 缓冲。
    if (!Number.isFinite(Math.fround(fontSize)) || fontSize < 0) {
        throw new RangeError("fontSize must be finite and nonnegative.");
    } else if (!Number.isFinite(Math.fround(lineSpacing)) || lineSpacing < 0) {
        // 行距属于输出坐标，必须在追加到字体行高之前校验。
        throw new RangeError("lineSpacing must be finite and nonnegative.");
    } else if (!Number.isFinite(Math.fround(letterSpacing))) {
        // 字距允许负值，但无穷和 NaN 会污染轮廓坐标。
        throw new RangeError("letterSpacing must be finite.");
    } else if (!["left", "center", "right"].includes(textAlign)) {
        // 对齐名称控制行起点，拒绝运行时无效的字符串。
        throw new RangeError("textAlign must be left, center or right.");
    } else if (!Number.isFinite(tolerance) || tolerance <= 0) {
        // 曲线容差必须大于零，才能限制采样密度。
        throw new RangeError("tolerance must be finite and positive.");
    }
    const font = GetTextFont(fontFamily);
    const scale = fontSize / font.unitsPerEm;
    const input: TextPoint[][] = [];
    const lines = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
    /**
     * 逐行调用 fontkit 的字距和塑形逻辑。
     * @param line 一行文字
     * @example
     * ShapeLine("你好");
     * @returns 已排列的字形序列
     */
    const ShapeLine = (line: string) => font.layout(line);
    const runs = lines.map(ShapeLine);
    /**
     * 计算包含额外字间距的一行排版宽度。
     * @param run 已排列字形
     * @example
     * GetLineAdvance(run);
     * @returns 输出单位下的行宽
     */
    const GetLineAdvance = (run: ReturnType<typeof ShapeLine>): number =>
        run.advanceWidth * scale + Math.max(0, run.glyphs.length - 1) * letterSpacing;
    let maximumAdvance = 0;
    // 最大排版宽度用于使每行文字相对整批文字水平居中。
    for (const run of runs) {
        maximumAdvance = Math.max(maximumAdvance, GetLineAdvance(run));
    }
    const lineHeight = (font.ascent - font.descent + font.lineGap) * scale + lineSpacing;
    // 保持每行的字距和原始字形位置，换行只改变本行的起点。
    for (let lineIndex = 0; lineIndex < runs.length; lineIndex += 1) {
        const run = runs[lineIndex];
        let penX = 0;
        // 每行相对最大行宽对齐；最后再统一把可见包围盒移到原点。
        if (textAlign === "center") {
            penX = (maximumAdvance - GetLineAdvance(run)) * 0.5;
        } else if (textAlign === "right") {
            // 右对齐保留每行右边界相同，行内字距仍由 fontkit 决定。
            penX = maximumAdvance - GetLineAdvance(run);
        }
        let penY = -lineIndex * lineHeight;
        // 字形定位使用 fontkit 的排版位移和字距结果，不按字符码直接等距排布。
        for (let index = 0; index < run.glyphs.length; index += 1) {
            const glyph = run.glyphs[index];
            const position = run.positions[index];
            // 零字号保留排版元数据，但不创建退化三角面。
            if (fontSize > 0) {
                input.push(...FlattenPath(
                    glyph.path.commands,
                    penX + position.xOffset * scale,
                    penY + position.yOffset * scale,
                    scale,
                    tolerance,
                ));
            }
            penX += position.xAdvance * scale;
            penY += position.yAdvance * scale;
            // 字间距只加在相邻字形之间，不延长每行末尾。
            if (index + 1 < run.glyphs.length) {
                penX += letterSpacing;
            }
        }
    }
    const result = Tessellate(input);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let perimeter = 0;
    // 实际可见边界定义包围盒和边框长度，空格只增加排版宽度。
    for (const contour of result.contours) {
        // 每条闭合环包括最后一个顶点到首点的长度。
        for (let index = 0; index < contour.length; index += 1) {
            const point = contour[index];
            const next = contour[(index + 1) % contour.length];
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
            perimeter += Math.hypot(next[0] - point[0], next[1] - point[1]);
        }
    }
    // 纯空白文字保持有限包围盒，但保留 advanceWidth。
    if (result.contours.length === 0) {
        minX = 0;
        minY = 0;
        maxX = 0;
        maxY = 0;
    }
    // 极大文本即使各顶点有限，包围盒跨度仍可能溢出 Float32。
    if (!Number.isFinite(Math.fround(maxX - minX)) || !Number.isFinite(Math.fround(maxY - minY))) {
        throw new RangeError("Text bounds must fit finite Float32 values.");
    }
    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    /**
     * 将实际可见边界的中心平移到原点。
     * @param point 原始坐标
     * @example
     * CenterPoint(point);
     * @returns 居中坐标
     */
    const CenterPoint = (point: TextPoint): TextPoint => [point[0] - centerX, point[1] - centerY];
    /**
     * 居中单个可见轮廓。
     * @param contour 原始轮廓
     * @example
     * CenterContour(contour);
     * @returns 居中轮廓
     */
    const CenterContour = (contour: TextPoint[]): TextPoint[] => contour.map(CenterPoint);
    return {
        triangles: result.triangles.map(CenterPoint),
        contours: result.contours.map(CenterContour),
        width: maxX - minX,
        height: maxY - minY,
        minX: minX - centerX,
        minY: minY - centerY,
        advanceWidth: maximumAdvance,
        perimeter,
    };
};

export { CreateTextOutline };
export type { TextOutline, TextPoint };
