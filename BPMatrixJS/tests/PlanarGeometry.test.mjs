import assert from "node:assert/strict";
import { test } from "node:test";
import {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
} from "../lib/Utils/index.js";

test("triangle overlap respects winding, containment, separation and touching", () => {
    const first = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }];
    const sameReversed = [...first].reverse();
    const contained = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }];
    const distant = [{ x: 8, y: 8 }, { x: 10, y: 8 }, { x: 8, y: 10 }];
    const touching = [{ x: 4, y: 0 }, { x: 6, y: 0 }, { x: 4, y: 2 }];

    assert.equal(SignedDoubleArea(first), 16);
    assert.equal(SignedDoubleArea(sameReversed), -16);
    assert.equal(TriangleOverlapArea(first, sameReversed), 8);
    assert.equal(TriangleOverlapArea(first, contained), 2);
    assert.equal(TriangleOverlapArea(first, distant), 0);
    assert.equal(TriangleOverlapArea(first, touching), 0);
});

test("convex separation and point containment include touching boundaries", () => {
    const square = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
    const distant = [{ x: 6, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 2 }, { x: 6, y: 2 }];
    const touching = [{ x: 4, y: 1 }, { x: 6, y: 1 }, { x: 6, y: 3 }, { x: 4, y: 3 }];
    const triangle = [square[0], square[1], square[3]];

    assert.equal(HasSeparatingAxis(square, distant), true);
    assert.equal(HasSeparatingAxis(square, touching), false);
    assert.equal(ContainsTrianglePoint(triangle, { x: 2, y: 2 }), true);
    assert.equal(ContainsTrianglePoint(triangle, { x: 3, y: 3 }), false);
});

test("segment distance clamps to endpoints and handles zero length", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 0 };

    assert.equal(SegmentDistanceSquared({ x: 2, y: 3 }, start, end), 9);
    assert.equal(SegmentDistanceSquared({ x: 6, y: 0 }, start, end), 4);
    assert.equal(SegmentDistanceSquared({ x: 3, y: 4 }, start, start), 25);
});
