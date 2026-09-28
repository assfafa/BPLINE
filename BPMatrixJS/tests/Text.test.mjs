import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";
import BPMatrixJS from "../lib/index.js";
import {
    CreateTextBorderGeometry,
    CreateTextGeometry,
    CreateTextLineGeometry,
    CreateTextPointGeometry,
    GetTextPerimeter,
    HasTextFont,
    RegisterTextFont,
    Text,
    UnregisterTextFont,
} from "../lib/Geometry/index.js";

const fontBytes = readFileSync(new URL("./fixtures/MiSans-subset.woff2", import.meta.url));
RegisterTextFont("MiSansTest", fontBytes);

/**
 * 计算一个三角面的有向两倍面积。
 * @param data 几何缓冲
 * @param offset 三角面索引偏移
 * @example
 * TriangleCross(data, 0);
 * @returns 有向两倍面积
 */
const TriangleCross = (data, offset) => {
    const a = data.index[offset] * 2;
    const b = data.index[offset + 1] * 2;
    const c = data.index[offset + 2] * 2;
    const points = data.geometry;
    return (points[b] - points[a]) * (points[c + 1] - points[a + 1])
        - (points[b + 1] - points[a + 1]) * (points[c] - points[a]);
};

/**
 * 判断局部原点是否落在任意填充三角面内。
 * @param data 填充几何
 * @example
 * ContainsOrigin(data);
 * @returns 原点是否被覆盖
 */
const ContainsOrigin = (data) => {
    // CW 三角面内的点相对每条有向边均在右侧。
    for (let offset = 0; offset < data.index.length; offset += 3) {
        let inside = true;
        for (let side = 0; side < 3; side += 1) {
            const first = data.index[offset + side] * 2;
            const second = data.index[offset + (side + 1) % 3] * 2;
            const cross = (data.geometry[second] - data.geometry[first]) * -data.geometry[first + 1]
                - (data.geometry[second + 1] - data.geometry[first + 1]) * -data.geometry[first];
            if (cross > 0) {
                inside = false;
            }
        }
        if (inside) {
            return true;
        }
    }
    return false;
};

test("reference WOFF2 produces centered CW fill and preserves O's hole", () => {
    const data = CreateTextGeometry("O", 64, "MiSansTest");
    assert.ok(data.index.length > 0);
    assert.ok(Math.abs(data.minX + data.width * 0.5) < 1e-5);
    assert.ok(Math.abs(data.minY + data.height * 0.5) < 1e-5);
    assert.equal(ContainsOrigin(data), false);
    // 与 Rect 相同，正面索引使用顺时针绕序。
    for (let offset = 0; offset < data.index.length; offset += 3) {
        assert.ok(TriangleCross(data, offset) < 0);
    }
});

test("line, border and point geometry follow visible contours", () => {
    const line = CreateTextLineGeometry("O", 64, "MiSansTest");
    const border = CreateTextBorderGeometry("O", 64, "MiSansTest", 2);
    const points = CreateTextPointGeometry("O", 64, "MiSansTest");
    // O 有外边界和内孔；每个闭合环都复制一个 UV 接缝。
    assert.equal(line.geometry.length / 2, line.index.length / 2 + 2);
    assert.equal(border.geometry.length / 2, line.geometry.length);
    assert.equal(border.miterScale.length, border.geometry.length / 2);
    assert.equal(points.pointCount, line.index.length / 2);
    assert.equal(points.position.length, points.geometry.length);
    assert.ok(GetTextPerimeter("O", 64, "MiSansTest") > 0);
    // 按 Shader 的居中边框外扩方式还原坐标，确认两个轮廓均保持 CW 正面。
    for (let offset = 0; offset < border.index.length; offset += 3) {
        const corners = [];
        for (let side = 0; side < 3; side += 1) {
            const vertex = border.index[offset + side];
            const direction = vertex % 2 === 0 ? -1 : 1;
            const expansion = direction * border.lineWidth * 0.5 * border.miterScale[vertex];
            corners.push([
                border.geometry[vertex * 2] + border.normal[vertex * 2] * expansion,
                border.geometry[vertex * 2 + 1] + border.normal[vertex * 2 + 1] * expansion,
            ]);
        }
        const cross = (corners[1][0] - corners[0][0]) * (corners[2][1] - corners[0][1])
            - (corners[1][1] - corners[0][1]) * (corners[2][0] - corners[0][0]);
        assert.ok(cross <= 0);
    }
});

test("multiline spacing, horizontal alignment and baseline anchors", () => {
    const compact = CreateTextGeometry("B\n中", 40, "MiSansTest");
    const spaced = CreateTextGeometry("B\n中", 40, "MiSansTest", { lineSpacing: 12 });
    assert.ok(spaced.height > compact.height + 11);
    const lettered = CreateTextGeometry("BO", 40, "MiSansTest", { letterSpacing: 8 });
    const ordinary = CreateTextGeometry("BO", 40, "MiSansTest");
    assert.ok(lettered.width > ordinary.width + 7);
    const anchored = CreateTextGeometry("BO\n中", 40, "MiSansTest", {
        textAlign: "right",
        baseline: "top",
    });
    assert.ok(Math.abs(anchored.anchorX - anchored.width * 0.5) < 1e-5);
    assert.ok(Math.abs(anchored.anchorY - anchored.height * 0.5) < 1e-5);
    assert.ok(Math.abs(anchored.minX + anchored.width * 0.5) < 1e-5);
    assert.ok(Math.abs(anchored.minY + anchored.height * 0.5) < 1e-5);
    const left = CreateTextGeometry("B\n中中", 40, "MiSansTest", { textAlign: "left" });
    const right = CreateTextGeometry("B\n中中", 40, "MiSansTest", { textAlign: "right" });
    const topVertices = (data) => {
        const xs = [];
        for (let index = 0; index < data.geometry.length; index += 2) {
            if (data.geometry[index + 1] > 0) {
                xs.push(data.geometry[index]);
            }
        }
        return Math.min(...xs);
    };
    assert.ok(topVertices(right) > topVertices(left) + 40);
});

test("class cache, registration and public exports", () => {
    const value = new Text("B", 32, "MiSansTest");
    const border = value.createBorderGeometry();
    assert.equal(value.borderData, border);
    value.set("中", 48, undefined, { baseline: "bottom" });
    assert.equal(value.borderData, undefined);
    assert.equal(value.data.anchorY, -value.data.height * 0.5);
    assert.equal(Text.CreateGeometry("O", 32, "MiSansTest").text, "O");
    assert.equal(BPMatrixJS.Geometry.Text, Text);
    assert.equal(HasTextFont("MiSansTest"), true);
    assert.throws(() => CreateTextGeometry("x", 32, "UnknownFont"));
});

test("empty and invalid values do not create broken buffers", () => {
    const empty = CreateTextGeometry("  ", 32, "MiSansTest");
    assert.equal(empty.index.length, 0);
    assert.equal(empty.width, 0);
    assert.ok(empty.advanceWidth > 0);
    assert.throws(() => CreateTextGeometry("B", -1, "MiSansTest"), RangeError);
    assert.throws(() => CreateTextGeometry("B", 32, "MiSansTest", { lineSpacing: -1 }), RangeError);
    assert.throws(() => CreateTextPointGeometry("B", 32, "MiSansTest", 2, 2), RangeError);
});

test("font registration may be removed and restored", () => {
    assert.equal(UnregisterTextFont("MiSansTest"), true);
    assert.equal(HasTextFont("MiSansTest"), false);
    RegisterTextFont("MiSansTest", fontBytes);
    assert.equal(HasTextFont("MiSansTest"), true);
});
