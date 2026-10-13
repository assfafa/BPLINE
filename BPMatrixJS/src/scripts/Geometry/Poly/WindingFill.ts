import type { Path } from "./Path.js";
import type { PolyNode } from "./types.js";

interface FillMesh {
    points: PolyNode[];
    indices: number[];
}

interface Crossing {
    start: PolyNode;
    end: PolyNode;
    y: number;
    winding: number;
}

/**
 * 计算两段轮廓边的交点横坐标；共线重叠返回重叠区间的两端。
 * @param a 第一段起点
 * @param b 第一段终点
 * @param c 第二段起点
 * @param d 第二段终点
 * @param tolerance 坐标容差
 * @example
 * const cuts = IntersectionXs(a, b, c, d, tolerance);
 * @returns 无交点时为空数组，否则为需要切分的横坐标
 */
const IntersectionXs = (
    a: PolyNode,
    b: PolyNode,
    c: PolyNode,
    d: PolyNode,
    tolerance: number,
): number[] => {
    const abX = b.x - a.x;
    const abY = b.y - a.y;
    const cdX = d.x - c.x;
    const cdY = d.y - c.y;
    const acX = c.x - a.x;
    const acY = c.y - a.y;
    const denominator = abX * cdY - abY * cdX;
    const scale = Math.max(Math.hypot(abX, abY) * Math.hypot(cdX, cdY), 1);
    const areaTolerance = Math.max(scale * 1e-12, Number.EPSILON);

    // 平行边可能只是分离，也可能沿同一条直线重叠。
    if (Math.abs(denominator) <= areaTolerance) {
        const collinearArea = acX * abY - acY * abX;
        // 只有共线边才可能共享一段边界。
        if (Math.abs(collinearArea) <= areaTolerance) {
            const overlapStart = Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));
            const overlapEnd = Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x));
            // 重叠边的端点也是扫描带的切分点。
            if (overlapStart <= overlapEnd + tolerance) {
                const firstMinY = Math.min(a.y, b.y);
                const firstMaxY = Math.max(a.y, b.y);
                const secondMinY = Math.min(c.y, d.y);
                const secondMaxY = Math.max(c.y, d.y);
                // 竖直共线边还必须在纵向相交。
                if (firstMinY <= secondMaxY + tolerance && secondMinY <= firstMaxY + tolerance) {
                    return [overlapStart, overlapEnd];
                }
            }
        }
        return [];
    }

    const firstFraction = (acX * cdY - acY * cdX) / denominator;
    const secondFraction = (acX * abY - acY * abX) / denominator;
    const fractionTolerance = 1e-10;
    // 端点接触也要切分；否则相邻扫描带的边界可能改变次序。
    if (
        firstFraction >= -fractionTolerance && firstFraction <= 1 + fractionTolerance &&
        secondFraction >= -fractionTolerance && secondFraction <= 1 + fractionTolerance
    ) {
        return [a.x + firstFraction * abX];
    }
    return [];
};

/**
 * 计算边在指定横坐标的纵坐标。
 * @param crossing 非竖直轮廓边
 * @param x 横坐标
 * @example
 * const y = EdgeY(crossing, x);
 * @returns 边上的纵坐标
 */
const EdgeY = (crossing: Crossing, x: number): number => {
    const fraction = (x - crossing.start.x) / (crossing.end.x - crossing.start.x);
    return crossing.start.y + fraction * (crossing.end.y - crossing.start.y);
};

/**
 * 将非退化三角形按 Poly 正面所需的顺时针绕序写入网格。
 * @param mesh 输出网格
 * @param a 第一顶点
 * @param b 第二顶点
 * @param c 第三顶点
 * @param areaTolerance 最小两倍面积
 * @example
 * AddTriangle(mesh, a, b, c, areaTolerance);
 * @returns 无返回值
 */
const AddTriangle = (
    mesh: FillMesh,
    a: PolyNode,
    b: PolyNode,
    c: PolyNode,
    areaTolerance: number,
): void => {
    const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    // 扫描带在交点处会收缩为三角形，零面积的另一半不应写入 GPU。
    if (Math.abs(area) > areaTolerance) {
        const firstIndex = mesh.points.length;
        mesh.points.push(a, b, c);
        // 输出约定为顺时针，扫描带本身可能给出任一绕向。
        if (area > 0) {
            mesh.indices.push(firstIndex, firstIndex + 2, firstIndex + 1);
        } else {
            mesh.indices.push(firstIndex, firstIndex + 1, firstIndex + 2);
        }
    }
};

/**
 * 对自交单轮廓执行非零环绕填充：在顶点和交点的 X 处切带，再按边的有向穿越数填充。
 * 普通简单轮廓返回 undefined，让原有耳切路径继续处理。
 * @param path 已规范化的闭合 Poly 路径
 * @example
 * const mesh = WindingFill(path);
 * @returns 自交路径的填充网格；简单路径为 undefined
 */
const WindingFill = (path: Path): FillMesh | undefined => {
    const points = path.points;
    const cuts: number[] = [];
    const size = Math.max(path.width, path.height);
    const tolerance = Math.max(size * 1e-10, Number.EPSILON);
    let hasIntersection = false;

    // 顶点与所有非相邻边的交点一起切分，确保带内边的上下顺序不再变化。
    for (let firstIndex = 0; firstIndex < points.length; firstIndex++) {
        const first = points[firstIndex];
        const firstEnd = points[(firstIndex + 1) % points.length];
        cuts.push(first.x);
        const firstMinX = Math.min(first.x, firstEnd.x);
        const firstMaxX = Math.max(first.x, firstEnd.x);
        const firstMinY = Math.min(first.y, firstEnd.y);
        const firstMaxY = Math.max(first.y, firstEnd.y);
        let secondLimit = points.length;
        // 第一条与最后一条边共享端点，同样应排除相邻交点。
        if (firstIndex === 0) {
            secondLimit = points.length - 1;
        }
        // 包围盒预筛掉大多数边对，避免普通多边形反复做交点除法。
        for (let secondIndex = firstIndex + 2; secondIndex < secondLimit; secondIndex++) {
            const second = points[secondIndex];
            const secondEnd = points[(secondIndex + 1) % points.length];
            const secondMinX = Math.min(second.x, secondEnd.x);
            const secondMaxX = Math.max(second.x, secondEnd.x);
            const secondMinY = Math.min(second.y, secondEnd.y);
            const secondMaxY = Math.max(second.y, secondEnd.y);
            // 只有两轴投影都相交的边才可能改变填充拓扑。
            if (
                firstMinX <= secondMaxX + tolerance && secondMinX <= firstMaxX + tolerance &&
                firstMinY <= secondMaxY + tolerance && secondMinY <= firstMaxY + tolerance
            ) {
                const intersections = IntersectionXs(first, firstEnd, second, secondEnd, tolerance);
                // 存在非相邻边交点时才启用扫描剖分。
                if (intersections.length > 0) {
                    hasIntersection = true;
                    cuts.push(...intersections);
                }
            }
        }
    }
    // 简单多边形保留原有耳切结果及顶点排列。
    if (hasIntersection === false) {
        return undefined;
    }

    /**
     * 比较两个扫描带边界的横坐标。
     * @param a 第一横坐标
     * @param b 第二横坐标
     * @example
     * cuts.sort(CompareNumbers);
     * @returns 升序比较结果
     */
    const CompareNumbers = (a: number, b: number): number => a - b;
    cuts.sort(CompareNumbers);
    const uniqueCuts: number[] = [];
    // 消除同一顶点或交点的重复横坐标，避免零宽扫描带。
    for (const cut of cuts) {
        const previous = uniqueCuts.at(-1);
        // 坐标容差与原始包围盒尺度一致。
        if (previous === undefined || cut - previous > tolerance) {
            uniqueCuts.push(cut);
        }
    }

    const mesh: FillMesh = { points: [], indices: [] };
    // 每个扫描带内部边的上下次序固定，可以用环绕数确定填充区间。
    for (let cutIndex = 0; cutIndex < uniqueCuts.length - 1; cutIndex++) {
        const left = uniqueCuts[cutIndex];
        const right = uniqueCuts[cutIndex + 1];
        const middle = left + (right - left) / 2;
        const crossings: Crossing[] = [];

        // 竖边不穿过扫描带内部；其边界已经由相邻切分位置覆盖。
        for (let edgeIndex = 0; edgeIndex < points.length; edgeIndex++) {
            const start = points[edgeIndex];
            const end = points[(edgeIndex + 1) % points.length];
            const minimum = Math.min(start.x, end.x);
            const maximum = Math.max(start.x, end.x);
            // 只接纳跨越带中线的边，避开顶点上的半开区间歧义。
            if (middle > minimum && middle < maximum) {
                let winding = -1;
                // 从下往上扫时，向右的边让环绕数增加。
                if (end.x > start.x) {
                    winding = 1;
                }
                const crossing: Crossing = {
                    start,
                    end,
                    y: 0,
                    winding,
                };
                crossing.y = EdgeY(crossing, middle);
                crossings.push(crossing);
            }
        }
        /**
         * 按扫描带中线的纵坐标排列轮廓边。
         * @param a 第一条边
         * @param b 第二条边
         * @example
         * crossings.sort(CompareCrossings);
         * @returns 升序比较结果
         */
        const CompareCrossings = (a: Crossing, b: Crossing): number => a.y - b.y;
        crossings.sort(CompareCrossings);
        let winding = 0;
        let lower: Crossing | undefined;
        let crossingIndex = 0;
        // 同高度边必须一次更新环绕数，以免重合边产生假填充带。
        while (crossingIndex < crossings.length) {
            const groupStart = crossingIndex;
            const groupY = crossings[groupStart].y;
            let change = 0;
            // 组合重合边的贡献，允许反向重描抵消。
            while (crossingIndex < crossings.length && Math.abs(crossings[crossingIndex].y - groupY) <= tolerance) {
                change += crossings[crossingIndex].winding;
                crossingIndex++;
            }
            const nextWinding = winding + change;
            // 零与非零之间的变化才是当前填充区间的边界。
            if (winding === 0 && nextWinding !== 0) {
                lower = crossings[groupStart];
            } else {
                // 环绕数返回零时，用上下两条边封闭扫描带。
                if (winding !== 0 && nextWinding === 0 && lower !== undefined) {
                    const upper = crossings[groupStart];
                    const lowerLeft = { x: left, y: EdgeY(lower, left) };
                    const lowerRight = { x: right, y: EdgeY(lower, right) };
                    const upperRight = { x: right, y: EdgeY(upper, right) };
                    const upperLeft = { x: left, y: EdgeY(upper, left) };
                    AddTriangle(mesh, lowerLeft, lowerRight, upperRight, path.epsilon);
                    AddTriangle(mesh, lowerLeft, upperRight, upperLeft, path.epsilon);
                    lower = undefined;
                }
            }
            winding = nextWinding;
        }
    }
    return mesh;
};

export { WindingFill };
export type { FillMesh };
