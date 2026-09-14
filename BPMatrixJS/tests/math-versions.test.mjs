import assert from "node:assert/strict";
import test from "node:test";
import { Vec2 } from "../lib/Math/Vec2.js";
import { Mat3 } from "../lib/Math/Mat3.js";

test("Vec2 operations notify once with complete components; add also retains arithmetic", () => {
    const vector = new Vec2(1, 2);
    const changes = [];
    const observer = { onMathChange: (source, field) => changes.push([source.x, source.y, field]) };
    vector.add(observer, "position").add(observer, "position");
    vector.set(3, 4);
    assert.deepEqual(changes, [[3, 4, "position"]]);
    vector.add({ x: 1, y: 2 });
    assert.deepEqual(vector.data, [4, 6]);
    assert.equal(changes.length, 2);
    const input = [8, 10];
    vector.data = input;
    input[0] = 500;
    assert.equal(vector.x, 8);
    vector.x = 8;
    assert.equal(changes.length, 3);
    for (const operation of [
        () => vector.sub({ x: 1, y: 1 }), () => vector.mul({ x: 2, y: 3 }),
        () => vector.div({ x: 2, y: 3 }), () => vector.copy({ x: 2, y: 4 }),
        () => vector.scl(2), () => vector.normal(), () => vector.setX(7), () => vector.setY(8),
        () => vector.apply(new Mat3().setTranslate({ x: 10, y: 20 })),
    ]) {
        const version = vector.version;
        const count = changes.length;
        operation();
        assert.equal(vector.version, version + 1);
        assert.equal(changes.length, count + 1);
    }
    vector.add(observer, "scale");
    vector.delete(observer, "position");
    changes.length = 0;
    vector.set(5, 6);
    assert.deepEqual(changes, [[5, 6, "scale"]]);
    vector.delete(observer);
    vector.set(6, 7);
    assert.equal(changes.length, 1);
});

test("Mat3 methods sync GPUData before one notification and preserve readonly-view identity", () => {
    const matrix = new Mat3();
    const data = matrix.data;
    let notifications = 0;
    const observer = {
        onMathChange: (source) => {
            notifications++;
            assert.deepEqual(Array.from(source.GPUData), [
                ...source.data.slice(0, 3).map(Math.fround), 0,
                ...source.data.slice(3, 6).map(Math.fround), 0,
                ...source.data.slice(6, 9).map(Math.fround), 0,
            ]);
        },
    };
    matrix.add(observer).add(observer);
    const input = [2, 0, 0, 0, 3, 0, 10, 20, 1];
    matrix.data = input;
    input[6] = 999;
    assert.equal(matrix.data[6], 10);
    assert.equal(matrix.data, data);
    assert.equal(notifications, 1);
    matrix.set(matrix.data);
    assert.equal(notifications, 1);
    for (const operation of [
        () => matrix.setRotation(0.5), () => matrix.setScale({ x: 4, y: 5 }),
        () => matrix.setTranslate({ x: 7, y: 8 }), () => matrix.transpose(),
        () => matrix.invert(), () => matrix.mul(2), () => matrix.mul(new Mat3().setTranslate({ x: 3, y: 4 })),
        () => matrix.identity(),
    ]) {
        const version = matrix.version;
        operation();
        assert.equal(matrix.version, version + 1);
    }
    const count = notifications;
    matrix.delete(observer);
    matrix.mul(2);
    assert.equal(notifications, count);
});

test("Mat3 output Vec2 is committed atomically", () => {
    const matrix = new Mat3().setTranslate({ x: 5, y: 6 }).setScale({ x: 3, y: 4 });
    const result = new Vec2();
    let count = 0;
    result.add({ onMathChange: () => count++ });
    matrix.getTranslate(result);
    assert.deepEqual(result.data, [5, 6]);
    assert.equal(count, 1);
    matrix.getScale(result);
    assert.deepEqual(result.data, [3, 4]);
    assert.equal(count, 2);
});
