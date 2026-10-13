import assert from "node:assert/strict";
import { test } from "node:test";
import { Poly } from "../lib/Geometry/Poly/index.js";

/**
 * 检查采样点是否被顺时针三角面覆盖。
 * @param a 第一顶点
 * @param b 第二顶点
 * @param c 第三顶点
 * @param x 采样横坐标
 * @param y 采样纵坐标
 * @example
 * triangleContains(a, b, c, x, y);
 * @returns 是否在三角面内
 */
const triangleContains = (a, b, c, x, y) => {
    const first = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    const second = (c.x - b.x) * (y - b.y) - (c.y - b.y) * (x - b.x);
    const third = (a.x - c.x) * (y - c.y) - (a.y - c.y) * (x - c.x);
    return first <= 0 && second <= 0 && third <= 0;
};

/**
 * 查询输出三角网是否覆盖采样点。
 * @param data Poly 填充数据
 * @param x 采样横坐标
 * @param y 采样纵坐标
 * @example
 * meshContains(poly.data, x, y);
 * @returns 是否被至少一个三角面覆盖
 */
const meshContains = (data, x, y) => {
    // 逐面判断，避免只比较总体面积而遗漏局部溢出。
    for (let i = 0; i < data.index.length; i += 3) {
        const vertices = [data.index[i], data.index[i + 1], data.index[i + 2]];
        const points = vertices.map((index) => ({
            x: data.geometry[index * 2],
            y: data.geometry[index * 2 + 1],
        }));
        if (triangleContains(points[0], points[1], points[2], x, y)) {
            return true;
        }
    }
    return false;
};

/**
 * 用独立的水平射线环绕数作为填充真值。
 * @param points 原始单轮廓
 * @param x 采样横坐标
 * @param y 采样纵坐标
 * @example
 * windingAt(points, x, y);
 * @returns 有向环绕数
 */
const windingAt = (points, x, y) => {
    let winding = 0;
    // 从下向上与从上向下穿过采样射线的边分别贡献相反符号。
    for (let i = 0; i < points.length; i++) {
        const first = points[i];
        const second = points[(i + 1) % points.length];
        const cross = (second.x - first.x) * (y - first.y) - (second.y - first.y) * (x - first.x);
        if (first.y <= y && second.y > y && cross > 0) {
            winding++;
        }
        if (first.y > y && second.y <= y && cross < 0) {
            winding--;
        }
    }
    return winding;
};

/**
 * 排除轮廓边界附近受浮点舍入影响的采样点。
 * @param a 边起点
 * @param b 边终点
 * @param x 采样横坐标
 * @param y 采样纵坐标
 * @example
 * distanceToSegment(a, b, x, y);
 * @returns 采样点到边的最短距离
 */
const distanceToSegment = (a, b, x, y) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const fraction = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSquared));
    return Math.hypot(x - a.x - fraction * dx, y - a.y - fraction * dy);
};

/**
 * 对整个包围盒采样，比较剖分结果与非零环绕规则。
 * @param points 原始单轮廓
 * @param step 采样间隔
 * @example
 * verifyFill(points, 2);
 * @returns 用于检查其余几何数据的 Poly 实例
 */
const verifyFill = (points, step = 2) => {
    const poly = new Poly(points);
    const data = poly.data;
    assert.equal(data.normal.length, data.geometry.length);
    assert.equal(data.uv.length, data.geometry.length);
    // 每个输出面都必须保持渲染器要求的顺时针绕向。
    for (let i = 0; i < data.index.length; i += 3) {
        const a = data.index[i] * 2;
        const b = data.index[i + 1] * 2;
        const c = data.index[i + 2] * 2;
        const area = (data.geometry[b] - data.geometry[a]) * (data.geometry[c + 1] - data.geometry[a + 1])
            - (data.geometry[b + 1] - data.geometry[a + 1]) * (data.geometry[c] - data.geometry[a]);
        assert.ok(area < 0, `triangle ${i / 3} should face clockwise`);
    }
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    // 分散采样点以避免恰好落在规则网格上的交点。
    for (let x = minX + 0.37; x < maxX; x += step) {
        for (let y = minY + 0.63; y < maxY; y += step) {
            let farFromEdge = true;
            // 边界不计入填充差异，因为 GPU 浮点顶点与双精度真值会有舍入差。
            for (let i = 0; i < points.length; i++) {
                if (distanceToSegment(points[i], points[(i + 1) % points.length], x, y) < 0.001) {
                    farFromEdge = false;
                }
            }
            // 只验证明确位于内部或外部的采样位置。
            if (farFromEdge) {
                const expected = windingAt(points, x, y) !== 0;
                const actual = meshContains(data, x, y);
                assert.equal(actual, expected, `fill mismatch at (${x}, ${y})`);
            }
        }
    }
    return poly;
};

test("self-intersecting pentagram uses nonzero winding without outer spill", () => {
    const circle = Array.from({ length: 5 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
        return { x: Math.cos(angle) * 100, y: Math.sin(angle) * 100 };
    });
    const points = [circle[0], circle[2], circle[4], circle[1], circle[3]];
    const poly = verifyFill(points);
    assert.ok(poly.data.index.length > 9);
    assert.equal(meshContains(poly.data, 0, 0), true);
    assert.equal(poly.points.length, 5);
    assert.equal(poly.createLineGeometry().index.length, 10);
});

test("self-crossing bow tie and concave simple contour match their winding", () => {
    verifyFill([
        { x: -60, y: -60 }, { x: 60, y: 60 },
        { x: -60, y: 60 }, { x: 60, y: -60 },
    ]);
    verifyFill([
        { x: -70, y: -50 }, { x: 70, y: -50 },
        { x: 70, y: 50 }, { x: 0, y: 0 }, { x: -70, y: 50 },
    ]);
});

test("touching loops and reversed star paths retain nonzero regions", () => {
    verifyFill([
        { x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 },
        { x: 0, y: 0 }, { x: -50, y: 0 }, { x: -50, y: -50 }, { x: 0, y: -50 },
    ]);
    const circle = Array.from({ length: 7 }, (_, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / 7;
        return { x: Math.cos(angle) * 80, y: Math.sin(angle) * 80 };
    });
    const star = [0, 3, 6, 2, 5, 1, 4].map((index) => circle[index]);
    verifyFill(star);
    verifyFill([...star].reverse());
});

test("opposite retracing cancels the filled region", () => {
    const vertices = [
        { x: -40, y: -40 }, { x: 40, y: -40 },
        { x: 40, y: 40 }, { x: -40, y: 40 },
    ];
    const retraced = [
        vertices[0], vertices[1], vertices[2], vertices[3],
        vertices[0], vertices[3], vertices[2], vertices[1],
    ];
    const poly = verifyFill(retraced);
    assert.equal(poly.data.index.length, 0);
});
