import assert from "node:assert/strict";
import { test } from "node:test";
import {
    ContainsPolygonPoint,
    InverseTransformPoint2D,
    ProjectSegmentPoint,
    TransformPoint2D,
} from "../lib/Utils/index.js";

test("affine inverse preserves large translations, rotation and reflection", () => {
    const matrix = [0, 2, 0, 3, 0, 0, 1e9, -1e9, 1];
    const local = { x: 0.125, y: -0.25 };
    const world = TransformPoint2D(matrix, local);
    const restored = InverseTransformPoint2D(matrix, world);

    assert.equal(world.x, 1e9 - 0.75);
    assert.equal(world.y, -1e9 + 0.25);
    assert.equal(restored.x, local.x);
    assert.equal(restored.y, local.y);
    assert.equal(InverseTransformPoint2D([0, 0, 0, 0, 1, 0, 0, 0, 1], local), null);
    assert.equal(InverseTransformPoint2D([Infinity, 0, 0, 0, 1, 0, 0, 0, 1], local), null);
    assert.equal(InverseTransformPoint2D([1, 0, 0, 0, 1, 0, Infinity, 0, 1], local), null);
    assert.equal(InverseTransformPoint2D([1, 0, 0, 0, 1, 0, 0, 0, 1], { x: NaN, y: 0 }), null);
    assert.equal(InverseTransformPoint2D([1e-310, 0, 0, 0, 1, 0, 0, 0, 1], { x: 1, y: 0 }), null);
});

test("segment projection clamps both endpoints and returns an independent degenerate point", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 0 };
    const middle = ProjectSegmentPoint({ x: 2, y: 8 }, start, end);
    const before = ProjectSegmentPoint({ x: -2, y: 8 }, start, end);
    const after = ProjectSegmentPoint({ x: 6, y: 8 }, start, end);
    const single = ProjectSegmentPoint({ x: 6, y: 8 }, start, start);

    assert.deepEqual([middle.x, middle.y], [2, 0]);
    assert.deepEqual([before.x, before.y], [0, 0]);
    assert.deepEqual([after.x, after.y], [4, 0]);
    single.x = 10;
    assert.equal(start.x, 0);
});

test("polygon containment preserves concavity, winding and repeated contour semantics", () => {
    const contour = [
        { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 },
        { x: 1, y: 1 }, { x: 1, y: 4 }, { x: 0, y: 4 },
    ];
    const inside = { x: 0.5, y: 3 };
    const notch = { x: 3, y: 3 };
    const twice = [...contour, ...contour];

    assert.equal(ContainsPolygonPoint(inside, contour), true);
    assert.equal(ContainsPolygonPoint(inside, [...contour].reverse()), true);
    assert.equal(ContainsPolygonPoint(notch, contour), false);
    assert.equal(ContainsPolygonPoint(inside, twice, "nonzero"), true);
    assert.equal(ContainsPolygonPoint(inside, twice, "evenodd"), false);
    assert.equal(ContainsPolygonPoint(inside, []), false);
    assert.equal(ContainsPolygonPoint(inside, [{ x: 0, y: 0 }]), false);
});
