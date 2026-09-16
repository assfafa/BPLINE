import assert from "node:assert/strict";
import { test } from "node:test";
import BPMatrixJS from "../lib/index.js";
import NGon, { CreateNGonGeometry, GetNGonPerimeter } from "../lib/Geometry/NGon.js";

const Cross = (data, a, b, c) => {
    const p = data.geometry;
    return (p[b * 2] - p[a * 2]) * (p[c * 2 + 1] - p[a * 2 + 1])
        - (p[b * 2 + 1] - p[a * 2 + 1]) * (p[c * 2] - p[a * 2]);
};

const Validate = (data) => {
    assert.equal(data.normal.length, data.geometry.length);
    assert.equal(data.uv.length, data.geometry.length);
    for (const values of [data.geometry, data.normal, data.uv]) {
        for (const value of values) assert.ok(Number.isFinite(value));
    }
    for (const index of data.index) assert.ok(index < data.geometry.length / 2);
};

test("filled disks and annuli have clockwise triangles and the correct area", () => {
    for (const sides of [3, 4, 5, 32]) {
        for (const hole of [false, true]) {
            for (const nvMode of ["bounding", "polar"]) {
                const data = CreateNGonGeometry({ sides, outer: 10, inter: 4, hole, nvMode });
                Validate(data);
                let area = 0;
                for (let i = 0; i < data.index.length; i += 3) {
                    const [a, b, c] = data.index.slice(i, i + 3);
                    const cross = Cross(data, a, b, c);
                    assert.ok(cross < 0);
                    area -= cross / 2;
                    if (hole) {
                        // Every face lies in one angular sector, outside the inner polygon.
                        const x = (data.geometry[a * 2] + data.geometry[b * 2] + data.geometry[c * 2]) / 3;
                        const y = (data.geometry[a * 2 + 1] + data.geometry[b * 2 + 1] + data.geometry[c * 2 + 1]) / 3;
                        assert.ok(Math.hypot(x, y) > 4 * Math.cos(Math.PI / sides));
                    }
                }
                const expected = sides * Math.sin(2 * Math.PI / sides) / 2 * (100 - (hole ? 16 : 0));
                assert.ok(Math.abs(area - expected) < 0.0001);
                assert.ok(data.uv.every((value) => value >= 0 && value <= 1));
            }
        }
    }
});

test("polar seams duplicate positions without triangles spanning the U seam", () => {
    for (const hole of [false, true]) {
        const sides = 12;
        const data = CreateNGonGeometry({ sides, hole, outer: 10, inter: 4, nvMode: "polar" });
        const stride = hole ? 4 : 2;
        assert.deepEqual(data.geometry.slice(0, stride), data.geometry.slice(sides * stride, (sides + 1) * stride));
        assert.equal(data.uv[0], 0);
        assert.equal(data.uv[sides * stride], 1);
        for (let i = 0; i < data.index.length; i += 3) {
            const u = Array.from(data.index.slice(i, i + 3), (index) => data.uv[index * 2]);
            assert.ok(Math.max(...u) - Math.min(...u) <= 1 / sides + 1e-7);
        }
    }
});

test("annulus line loops remain separate and normals point out of the material", () => {
    const shape = new NGon({ sides: 8, outer: 10, inter: 4, hole: true });
    const line = shape.createLineGeometry(3);
    Validate(line);
    assert.equal(line.index.length, 32);
    for (let i = 0; i < line.index.length; i += 2) {
        assert.equal(line.index[i] < 9, line.index[i + 1] < 9);
    }
    for (let i = 0; i < line.geometry.length / 2; i++) {
        const dot = line.geometry[2 * i] * line.normal[2 * i] + line.geometry[2 * i + 1] * line.normal[2 * i + 1];
        assert.ok(i < 9 ? dot > 0 : dot < 0);
    }
    assert.ok(Math.abs(shape.getPerimeter() - 16 * 14 * Math.sin(Math.PI / 8)) < 1e-10);
});

test("extruded inner and outer strokes keep clockwise faces for every alignment", () => {
    for (const outer of [0.01, 0.1, 1, 10]) {
        const shape = new NGon({ sides: 8, outer, inter: outer * 0.4, hole: true });
        for (const [align, factor] of [["inset", 0], ["normal", 0.5], ["outset", 1]]) {
            const border = shape.createBorderGeometry(outer * 0.02, 1, align);
            Validate(border);
            const expanded = new Float32Array(border.geometry);
            for (let i = 0; i < expanded.length / 2; i++) {
                const offset = outer * 0.02 * border.miterScale[i] * (border.uv[i * 2 + 1] === 0 ? factor - 1 : factor);
                expanded[i * 2] += border.normal[i * 2] * offset;
                expanded[i * 2 + 1] += border.normal[i * 2 + 1] * offset;
            }
            for (let i = 0; i < border.index.length; i += 3) {
                assert.ok(Cross({ geometry: expanded }, ...border.index.slice(i, i + 3)) < 0);
            }
        }
    }
});

test("auxiliary markers include both contours with independent center and UV data", () => {
    const shape = new NGon({ sides: 4, hole: true, outer: 10, inter: 4 });
    const points = shape.createPointGeometry(1, 4, true, true);
    Validate(points);
    assert.equal(points.pointCount, 16);
    assert.equal(points.position.length, points.geometry.length);
    // Square marker trigonometry can leave a sub-epsilon negative zero at a corner.
    assert.ok(points.uv.every((value) => value >= -1e-7 && value <= 1 + 1e-7));
    assert.equal(shape.createPointGeometry(1, 4, true, false, 20).pointCount, 4);
    assert.equal(shape.createPointGeometry(1, 4, false, true, 0, 10).pointCount, 4);
    assert.throws(() => shape.createPointGeometry(1, 4, false, false), /Enable vertexPoints or midpointPoints/);
});

test("degenerate inputs stay finite, bounds clamp and invalid updates are atomic", () => {
    const segment = new NGon({ sides: 2, outer: 10 });
    assert.equal(segment.data.index.length, 0);
    assert.equal(segment.createLineGeometry().index.length, 2);
    assert.equal(segment.getPerimeter(), 20);
    const empty = new NGon({ outer: 0, hole: true });
    for (const data of [empty.data, empty.createLineGeometry(), empty.createBorderGeometry(1), empty.createPointGeometry()]) {
        Validate(data);
        assert.equal(data.index.length, 0);
    }
    const shape = new NGon({ outer: 4, inter: 10, hole: true });
    assert.equal(shape.inter, 4);
    assert.equal(shape.data.index.length, 0);
    const data = shape.data;
    for (const options of [{ sides: 1 }, { sides: 2.5 }, { outer: -1 }, { inter: NaN }, { nvMode: "invalid" }, { startAngle: Infinity }]) {
        assert.throws(() => shape.set(options));
        assert.equal(shape.data, data);
    }
    shape.createLineGeometry();
    shape.set({ inter: 2, sides: 8 });
    assert.equal(shape.lineData, undefined);
    assert.ok(shape.data.index.length > 0);
    shape.solid = false;
    assert.equal(shape.data.index.length, 0);
});

test("large rings select Uint32 indices and namespace exports match direct imports", () => {
    const data = CreateNGonGeometry({ sides: 32768, hole: true });
    assert.ok(data.index instanceof Uint32Array);
    Validate(data);
    assert.equal(BPMatrixJS.Geometry.NGon, NGon);
    assert.equal(BPMatrixJS.Geometry.GetNGonPerimeter, GetNGonPerimeter);
});
