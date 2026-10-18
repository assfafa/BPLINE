import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { URL } from "node:url";
import { Bool, Difference, Intersection, Xor, Union, Intersects, Covers, Overlaps, FastCollision, GetBounds } from "../lib/Utils/Bool/index.js";
import { Rect } from "../lib/Geometry/Rect.js";
import { NGon } from "../lib/Geometry/NGon.js";
import { Poly } from "../lib/Geometry/Poly/index.js";
import { Text, RegisterTextFont } from "../lib/Geometry/Text/index.js";

/** @param x 平移 x @param y 平移 y @example Translation(1, 2); @returns 仿射矩阵。 */
const Translation = (x, y) => [1, 0, 0, 0, 1, 0, x, y, 1];
/** @param id 标识 @param x 中心 x @param y 中心 y @param width 宽 @param height 高 @example Box("a", 0, 0, 10, 10); @returns 连续矩形输入。 */
const Box = (id, x = 0, y = 0, width = 10, height = 10) => ({
    id, type: "rect", data: { width, height }, matrix: Translation(x, y),
});
/** @param result 布尔结果 @example Area(result); @returns 实体三角面积并验证所有面为 CW。 */
const Area = (result) => {
    let total = 0;
    for (const item of result.items) {
        const { geometry: p, index } = item.data;
        assert.equal(index.length % 3, 0);
        for (let i = 0; i < index.length; i += 3) {
            const a = index[i] * 2;
            const b = index[i + 1] * 2;
            const c = index[i + 2] * 2;
            const cross = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
            assert.ok(Number.isFinite(cross) && cross < 0, "finite clockwise triangles");
            total -= cross / 2;
        }
        assert.ok(item.data.uv.every(Number.isFinite));
    }
    return total;
};
/** @param actual 实际值 @param expected 预期 @param tolerance 绝对容差 @example Near(1, 1); @returns 无返回值。 */
const Near = (actual, expected, tolerance = 1e-4) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

// Fast collision is available before initialization, but geometry operations must explicitly await ready.
assert.equal(FastCollision(Box("a"), Box("b", 100)), false);
assert.throws(() => Union([Box("a")]), /ready/);
const pending = Bool.ready();
assert.equal(pending, Bool.ready());
await pending;

test("union uses continuous contours and preserves all sources", () => {
    const a = Box("a");
    const b = Box("b", 5);
    Object.defineProperty(a.data, "geometry", { get() { throw new Error("must not access rectangle triangles"); } });
    const result = Union([a, b]);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].type, "poly");
    Near(Area(result), 150);
    assert.deepEqual(result.items[0].sources.map((s) => s.id), ["a", "b"]);
    assert.deepEqual(result.changes.map((c) => c.outputs), [[0], [0]]);
});

test("difference splits one source, removes another, preserves the third and reports masks", () => {
    const a = Box("cut");
    a.metadata = { material: "red" };
    const result = Difference([a, Box("gone", 30), Box("kept", 60)], [Box("knife", 0, 0, 2, 30), Box("eraser", 30)]);
    assert.equal(result.items.length, 3);
    Near(Area(result), 180);
    assert.deepEqual(result.changes.map((c) => c.status), ["split", "removed", "unchanged", "operand", "operand"]);
    assert.deepEqual(result.changes[0].outputs, [0, 1]);
    assert.equal(result.items[0].sourceId, "cut");
    assert.equal(result.items[1].sourceId, "cut");
    assert.equal(result.items[1].part, 1);
    assert.equal(result.items[0].metadata, a.metadata);
    assert.notEqual(result.items[0].id, result.items[1].id);
    Near(Area(Union(result.items)), 180);
});

test("multiple holes stay grouped in base and do not receive triangles", () => {
    const result = Difference([Box("plate", 0, 0, 30, 20)], [Box("hole1", -7, 0, 4, 4), Box("hole2", 7, 0, 4, 4)]);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].type, "base");
    assert.deepEqual(result.items[0].data.contourCounts, [3]);
    Near(Area(result), 568);
    assert.equal(Overlaps(result.items, [Box("test", -7, 0, 2, 2)]), false);
    assert.equal(Covers(result.items, [Box("test", 7, 0, 2, 2)]), false);
    assert.equal(Intersects(result.items, [Box("test", 7, 0, 2, 2)]), false);
});

test("disconnected union returns one base, ordinary subtraction returns separate polygons", () => {
    const merged = Union([Box("a", -20), Box("b", 20)]);
    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0].type, "base");
    assert.deepEqual(merged.items[0].data.contourCounts, [1, 1]);
    Near(Area(merged), 200);
    const split = Difference(merged.items, []);
    assert.equal(split.items.length, 2);
    assert.ok(split.items.every((item) => item.type === "poly"));
    Near(Area(split), 200);
});

test("intersection and XOR preserve the requested ownership and both mode deduplicates", () => {
    const a = [Box("same", 0)];
    const b = [Box("same", 5)];
    for (const side of ["a", "b", "both"]) {
        const result = Intersection(a, b, side);
        Near(Area(result), 50);
        assert.equal(result.items.length, 1);
        assert.equal(result.items[0].sources.length, 2);
        if (side === "b") {
            assert.equal(result.items[0].side, "b");
        }
    }
    Near(Area(Xor(a, b)), 100);
    Near(Area(Xor(a, b, "a")), 50);
    Near(Area(Xor(a, b, "b")), 50);
    const overlapWithinA = [Box("a", 0), Box("a2", 2)];
    Near(Area(Xor(overlapWithinA, [])), 120);
    Near(Area(Intersection(overlapWithinA, [Box("b", 0, 0, 30, 30)], "both")), 120);
});

test("triangle soup unions overlap regardless of winding, duplicate vertices or T junctions", () => {
    const input = { id: "soup", type: "base", data: {
        geometry: new Float64Array([0, 0, 10, 0, 0, 10, 0, 0, 0, 10, 10, 0, 10, 0, 10, 10, 5, 5]),
    } };
    const result = Union([input]);
    assert.equal(result.items[0].type, "poly");
    Near(Area(result), 75);
    const withMask = Intersection([input], [Box("clip", 2.5, 2.5, 5, 5)]);
    Near(Area(withMask), 25);
});

test("triangle rendering border and point data are excluded by vertexType", () => {
    const input = { id: 1, type: "base", data: {
        geometry: [0, 0, 2, 0, 0, 2, 100, 100, 110, 100, 100, 110],
        index: [0, 1, 2, 3, 4, 5], vertexType: [0, 0, 0, 0.5, 0.5, 0.5],
    } };
    Near(Area(Union([input])), 2);
});

test("real mathematical geometries and ring contours work without triangulating input", () => {
    const rect = { id: "rect", type: "rect", data: new Rect(10, 10, 2, 16) };
    const circle = { id: "ring", type: "ngon", data: new NGon({ sides: 64, outer: 10, inter: 5, hole: true }) };
    const polygon = { id: "poly", type: "poly", data: new Poly([[0, 0], [10, 0], [0, 10]]) };
    Near(Area(Union([polygon])), 50);
    const rounded = Area(Union([rect]));
    assert.ok(rounded > 96 && rounded < 97);
    const annulus = Union([circle]);
    assert.equal(annulus.items[0].type, "base");
    Near(Area(annulus), 64 * Math.sin(Math.PI * 2 / 64) * 75 / 2, 1e-3);
});

test("real WASM text triangle input preserves glyph holes in mixed operations", async () => {
    await RegisterTextFont("BooleanFixture", readFileSync(new URL("./fixtures/WasmTextTest.woff2", import.meta.url)));
    const text = new Text("A", 100, "BooleanFixture");
    const input = { id: "text", type: "text", data: text };
    const result = Union([input]);
    assert.equal(result.items[0].type, "base");
    Near(Area(result), 6400, 0.01);
    assert.equal(result.items[0].data.contours.length, 2);
    Near(Area(Intersection([input], [Box("large", 0, 0, 1000, 1000)])), 6400, 0.01);
    const filled = Union([input, Box("hole", 0, 0, 60, 60)]);
    Near(Area(filled), 10000, 0.01);
});

test("nested islands, nonzero and evenodd interpret multiple rings correctly", () => {
    const paths = [[0, 0, 20, 0, 20, 20, 0, 20], [5, 5, 15, 5, 15, 15, 5, 15], [8, 8, 12, 8, 12, 12, 8, 12]];
    const input = { id: 1, type: "contours", data: { contours: paths, fillRule: "evenodd" } };
    const result = Union([input]);
    Near(Area(result), 316);
    assert.equal(result.items[0].type, "base");
    assert.equal(result.items[0].data.contours.length, 3);
    input.data.fillRule = "nonzero";
    Near(Area(Union([input])), 400);
});

test("self crossing polygon produces bounded nonzero area", () => {
    const input = { id: 1, type: "poly", data: { points: [[0, 0], [10, 10], [0, 10], [10, 0]] } };
    Near(Area(Union([input])), 50);
});

test("transforms, mirrored sources and large translations preserve geometry and input", () => {
    const a = Box("a", 1e12, -1e12);
    const b = Box("b", 1e12 + 5, -1e12);
    b.matrix[0] = -1;
    const snapshot = JSON.parse(JSON.stringify([a, b]));
    const result = Union([a, b]);
    Near(Area(result), 150);
    assert.deepEqual([a, b], snapshot);
    assert.ok(result.items[0].data.geometry.every((x) => Math.abs(x) <= 10));
    Near(result.items[0].matrix[6], 1e12 + 2.5);
    Near(Area(Union(result.items)), 150);
    const rotated = Box("rotate");
    rotated.matrix = [0, 1, 0, -1, 0, 0, 0, 0, 1];
    Near(Area(Intersection([rotated], [Box("fixed")])), 100);
});

test("contact, overlap, coverage and broad collision have distinct meanings", () => {
    const a = Box("a");
    const touch = Box("b", 10);
    const pointTouch = Box("b", 10, 10);
    assert.equal(Intersects([a], [touch]), true);
    assert.equal(Intersects([a], [pointTouch]), true);
    assert.equal(Overlaps([a], [touch]), false);
    assert.equal(Intersection([a], [touch]).items.length, 0);
    assert.equal(Covers([a], [a]), true);
    assert.equal(Covers([a], [Box("inner", 0, 0, 2, 2)]), true);
    assert.equal(Covers([a], [touch]), false);
    assert.equal(Covers([Box("l", -2.5, 0, 5, 10), Box("r", 2.5, 0, 5, 10)], [a]), true);
    assert.equal(FastCollision(GetBounds(a), GetBounds(touch)), true);
    const ring = { id: "ring", type: "ngon", data: new NGon({ sides: 32, outer: 10, inter: 5, hole: true }) };
    assert.equal(FastCollision(ring, Box("inner", 0, 0, 1, 1)), true);
    assert.equal(Intersects([ring], [Box("inner", 0, 0, 1, 1)]), false);
});

test("empty geometry and full subtraction return explicit deletion without fake meshes", () => {
    assert.deepEqual(Union([]), { items: [], changes: [] });
    assert.equal(Difference([Box("a")], [Box("b")]).changes[0].status, "removed");
    assert.equal(Covers([], []), true);
    assert.equal(Covers([], [Box("b")]), false);
    assert.equal(Intersects([], [Box("b")]), false);
    assert.equal(Union([{ id: "line", type: "ngon", data: new NGon({ sides: 2 }) }]).items.length, 0);
    const empty = { id: "empty", type: "base", data: { geometry: [], index: [] } };
    assert.equal(GetBounds(empty), null);
    assert.equal(Union([empty]).changes[0].status, "removed");
});

test("invalid input rejects cleanly and next operation still works", () => {
    assert.throws(() => Union([Box("same"), Box("same")]), /unique/);
    assert.throws(() => Union([{ id: 1, type: "poly", data: { closed: false, points: [[0, 0], [1, 1]] } }]), /closed/);
    assert.throws(() => Union([{ id: 1, type: "base", data: { geometry: [0, 0, 1, 1, 2, 2], index: [0, 1, 999] } }]), /index/);
    assert.throws(() => Union([{ id: 1, type: "contours", data: { contours: [[0, 0, 1]] } }]), /paired/);
    assert.throws(() => Union([{ id: 1, type: "contours", data: { contours: [[0, 0, NaN, 1, 2, 3]] } }]), /finite/);
    assert.throws(() => Union([{ ...Box("bad"), matrix: [1, 0, 1, 0, 1, 0, 0, 0, 1] }]), /affine/);
    assert.throws(() => Intersection([Box("a")], [], "unknown"), /keep/);
    Near(Area(Union([Box("valid")])), 100);
});

test("many overlapping masks are subtracted once, not parity-cancelled", () => {
    const masks = Array.from({ length: 30 }, (_, i) => Box(`mask-${i}`, i / 10, 0, 2, 100));
    const result = Difference([Box("plate", 0, 0, 20, 20)], masks);
    Near(Area(result), 302, 0.001);
    assert.equal(result.items.length, 2);
});

test("distant huge geometry does not erase local difference or coverage", () => {
    const far = Box("far", 1e24, 1e24, 1e22, 1e22);
    const local = Box("local");
    Near(Area(Difference([local], [Box("cut", 0, 0, 2, 30), far])), 80);
    assert.equal(Covers([far, local], [Box("inner", 0, 0, 2, 2)]), true);
});
