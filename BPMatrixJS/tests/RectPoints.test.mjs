import assert from "node:assert/strict";
import { test } from "node:test";
import BPMatrixJS from "../lib/index.js";
import { CreateRectPointGeometry, Rect } from "../lib/Geometry/index.js";

test("vertex threshold uses the SUM of adjacent lengths, with strict greater-than", () => {
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, true, false, 105).pointCount, 4);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, true, false, 110).pointCount, 0);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, true, false, 111).pointCount, 0);
});

test("vertex and midpoint switches are independent, but cannot both be disabled", () => {
    assert.equal(CreateRectPointGeometry(10, 100).pointCount, 4);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, false, true).pointCount, 4);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, true, true).pointCount, 8);
    assert.throws(() => CreateRectPointGeometry(10, 100, 0, 2, 4, false, false), RangeError);
});

test("midpoint threshold only uses its own segment length", () => {
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, false, true, 1000, 10).pointCount, 2);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, false, true, 0, 100).pointCount, 0);
    assert.equal(CreateRectPointGeometry(10, 100, 0, 2, 4, true, true, 105, 10).pointCount, 6);
});

test("each square uses a full independent UV box, unaffected by marker radius", () => {
    const small = CreateRectPointGeometry(10, 100);
    const large = CreateRectPointGeometry(10, 100, 0, 20);
    assert.deepEqual(small.uv, large.uv);
    for (let offset = 0; offset < small.uv.length; offset += 10) {
        assert.deepEqual(Array.from(small.uv.slice(offset, offset + 10)), [0.5, 0.5, 1, 1, 1, 0, 0, 0, 0, 1]);
    }
});

test("round markers map local offsets into UV without corner stretching", () => {
    const data = CreateRectPointGeometry(100, 100, 0, 8, 32);
    for (let base = 0; base < data.geometry.length; base += 66) {
        for (let side = 1; side <= 32; side += 1) {
            const offset = base + side * 2;
            const x = data.geometry[offset] - data.geometry[base];
            const y = data.geometry[offset + 1] - data.geometry[base + 1];
            assert.ok(Math.abs(data.uv[offset] - (0.5 + x / 16)) < 1e-6);
            assert.ok(Math.abs(data.uv[offset + 1] - (0.5 + y / 16)) < 1e-6);
            assert.ok(Math.abs(Math.hypot(x, y) - 8) < 1e-5);
        }
    }
});

test("triangles stay within each marker and preserve clockwise winding", () => {
    const data = CreateRectPointGeometry(100, 100, 0, 2, 4, true, true);
    for (let offset = 0; offset < data.index.length; offset += 3) {
        const [a, b, c] = data.index.slice(offset, offset + 3);
        assert.equal(Math.floor(a / 5), Math.floor(b / 5));
        assert.equal(Math.floor(a / 5), Math.floor(c / 5));
        const ax = data.geometry[a * 2];
        const ay = data.geometry[a * 2 + 1];
        const cross = (data.geometry[b * 2] - ax) * (data.geometry[c * 2 + 1] - ay)
            - (data.geometry[b * 2 + 1] - ay) * (data.geometry[c * 2] - ax);
        assert.ok(cross < 0);
    }
});

test("rounded contour tangencies and the closing seam do not duplicate markers", () => {
    // Radius 50 gives seven segments per quarter: 28 unique points and 28 edges.
    assert.equal(CreateRectPointGeometry(100, 100, 50).pointCount, 28);
    assert.equal(CreateRectPointGeometry(100, 100, 50, 2, 4, false, true).pointCount, 28);
    assert.equal(CreateRectPointGeometry(100, 100, 50, 2, 4, true, true).pointCount, 56);
});

test("empty inputs and parameter validation", () => {
    assert.equal(CreateRectPointGeometry(0, 100).geometry.length, 0);
    assert.equal(CreateRectPointGeometry(0, 100).position.length, 0);
    assert.equal(CreateRectPointGeometry(100, 100, 0, 0).index.length, 0);
    assert.equal(CreateRectPointGeometry(100, 100, 0, 0).position.length, 0);
    assert.equal(CreateRectPointGeometry(100, 100, 0, 2, 4, true, false, Infinity).pointCount, 0);
    assert.throws(() => CreateRectPointGeometry(100, 100, 0, 2, 2), RangeError);
    assert.throws(() => CreateRectPointGeometry(100, 100, 0, 2, 4, true, false, NaN), RangeError);
});

test("position repeats each marker center and preserves geometry-relative offsets", () => {
    for (const sides of [4, 32]) {
        for (const [vertexPoints, midpointPoints] of [[true, false], [false, true], [true, true]]) {
            const data = CreateRectPointGeometry(100, 50, 0, 2, sides, vertexPoints, midpointPoints);
            const larger = CreateRectPointGeometry(100, 50, 0, 8, sides, vertexPoints, midpointPoints);
            assert.ok(data.position instanceof Float32Array);
            assert.equal(data.position.length, data.geometry.length);
            assert.deepEqual(data.position, larger.position);
            for (let base = 0; base < data.geometry.length; base += (sides + 1) * 2) {
                const center = data.geometry.slice(base, base + 2);
                for (let vertex = 0; vertex <= sides; vertex += 1) {
                    const offset = base + vertex * 2;
                    assert.deepEqual(data.position.slice(offset, offset + 2), center);
                    for (let axis = 0; axis < 2; axis += 1) {
                        const localOffset = data.geometry[offset + axis] - data.position[offset + axis];
                        const uvOffset = (data.uv[offset + axis] * 2 - 1) * data.pointRadius;
                        assert.ok(Math.abs(localOffset - uvOffset) < 1e-5);
                    }
                }
            }
        }
    }
});

test("large output switches to uint32 without index wrapping", () => {
    const data = CreateRectPointGeometry(100000, 100000, 32760);
    assert.ok(data.index instanceof Uint32Array);
    assert.ok(data.index.some((value) => value > 65535));
    assert.ok(data.index.every((value) => value < data.geometry.length / 2));
});

test("class cache is invalidated on set; both public exports are available", () => {
    const rect = new Rect(10, 100);
    const data = rect.createPointGeometry(2, 4, true, false, 105);
    assert.equal(rect.pointData, data);
    assert.equal(data.pointCount, 4);
    rect.set(20, 200);
    assert.equal(rect.pointData, undefined);
    assert.equal(Rect.CreatePointGeometry(10, 100).pointCount, 4);
    assert.equal(BPMatrixJS.Geometry.CreateRectPointGeometry, CreateRectPointGeometry);
});
