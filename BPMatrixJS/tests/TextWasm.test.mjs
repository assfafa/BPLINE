import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { test } from "node:test";
import { Text, RegisterTextFont, UnregisterTextFont, HasTextFont } from "../lib/Geometry/Text/index.js";
import { GetTextFont } from "../lib/Geometry/Text/Fonts.js";

/** @param format Font format @example Fixture("woff2"); @returns Original test-font bytes. */
const Fixture = (format) => readFileSync(new URL(`./fixtures/WasmTextTest.${format}`, import.meta.url));

/** @param data Fill buffers @example Area(text.data); @returns Total area, asserting finite CW triangles. */
const Area = (data) => {
    let area = 0;
    // Every emitted triangle must be visible with the renderer's normal front-face convention.
    for (let i = 0; i < data.index.length; i += 3) {
        const a = data.index[i] * 2;
        const b = data.index[i + 1] * 2;
        const c = data.index[i + 2] * 2;
        const p = data.geometry;
        const cross = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
        assert.ok(Number.isFinite(cross) && cross < 0);
        area -= cross / 2;
    }
    return area;
};

/** @param text Text instance @example Loops(text); @returns Number of closed visible contours. */
const Loops = (text) => {
    const line = text.createLineGeometry();
    return line.geometry.length / 2 - line.index.length / 2;
};

// The same geometry validates all decoding paths, including zlib-compressed WOFF tables.
for (const format of ["ttf", "otf", "woff", "woff2"]) {
    test(`WASM ${format}: nonzero holes, overlaps, touching, crossings and cancellation`, async () => {
        const name = "Wasm-" + format;
        await RegisterTextFont(name, Fixture(format));
        const cases = [["A", 6400, 2], ["B", 15000, 1], ["C", 20000, 1], ["D", 5000, 2], ["E", 0, 0]];
        // These areas come from source contours, not the tessellation algorithm.
        for (const [character, expected, loops] of cases) {
            const text = new Text(character, 100, name);
            assert.ok(Math.abs(Area(text.data) - expected) < 0.01, `${character}: expected area ${expected}`);
            assert.equal(Loops(text), loops, character);
        }
        const low = new Text("F", 100, name, { precision: 3 });
        const high = new Text("F", 100, name, { precision: 100 });
        assert.ok(high.data.index.length > low.data.index.length);
        assert.equal(high.width, low.width);
        assert.equal(high.height, low.height);
        const boundary = new Text("A", 100, name).contours;
        assert.deepEqual(boundary.map((ring) => ring.length), [8, 8]);
        boundary[0].fill(999);
        assert.notEqual(new Text("A", 100, name).contours[0][0], 999);
        UnregisterTextFont(name);
    });
}

test("WASM glyph and whole-text caches reuse work without sharing mutable buffers", async () => {
    await RegisterTextFont("CacheTest", Fixture("ttf"));
    const font = GetTextFont("CacheTest");
    const first = new Text("AAA", 100, "CacheTest");
    assert.equal(font.cacheStats.glyphBuilds, 1);
    assert.equal(font.cacheStats.glyphHits, 2);
    const second = new Text("AAA", 100, "CacheTest");
    assert.equal(font.cacheStats.textHits, 1);
    assert.equal(font.cacheStats.glyphBuilds, 1);
    assert.notEqual(first.data.geometry, second.data.geometry);
    const expected = second.data.geometry[0];
    first.data.geometry[0] = 999;
    assert.equal(second.data.geometry[0], expected);
    assert.equal(new Text("AAA", 100, "CacheTest").data.geometry[0], expected);
    const top = new Text("AAA", 100, "CacheTest", { baseline: "top" });
    const bottom = new Text("AAA", 100, "CacheTest", { baseline: "bottom" });
    assert.equal(top.data.anchorY, top.height / 2);
    assert.equal(bottom.data.anchorY, -bottom.height / 2);
    new Text("BA", 100, "CacheTest");
    assert.equal(font.cacheStats.glyphBuilds, 2);
    new Text("A", 100, "CacheTest", { precision: 16 });
    assert.equal(font.cacheStats.glyphBuilds, 3);
    font.shape("ABA");
    font.shape("ABA");
    assert.equal(font.cacheStats.shapeHits, 1);
    font.clearCache();
    assert.equal(font.cacheStats.glyphBytes, 0);
    assert.equal(font.cacheStats.textBytes, 0);
    UnregisterTextFont("CacheTest");
    assert.throws(() => font.shape("A"), /unregistered/);
});

test("negative letter spacing unions positioned glyphs without internal borders", async () => {
    await RegisterTextFont("OverlapText", Fixture("ttf"));
    const text = new Text("AA", 100, "OverlapText", { letterSpacing: -220 });
    assert.equal(Loops(text), 2);
    assert.ok(Math.abs(Area(text.data) - 6400) < 0.01);
    UnregisterTextFont("OverlapText");
});

test("replacement, cancellation and malformed fonts preserve registration ownership", async () => {
    const bytes = Fixture("woff2");
    await RegisterTextFont("Replace", bytes);
    const original = GetTextFont("Replace");
    await assert.rejects(RegisterTextFont("Replace", new Uint8Array([1, 2, 3, 4])));
    assert.equal(GetTextFont("Replace"), original);
    await RegisterTextFont("Replace", Fixture("otf"));
    assert.notEqual(GetTextFont("Replace").version, original.version);
    assert.throws(() => original.shape("A"));
    const pending = RegisterTextFont("Cancelled", bytes);
    UnregisterTextFont("Cancelled");
    await assert.rejects(pending, /superseded/);
    assert.equal(HasTextFont("Cancelled"), false);
    const first = RegisterTextFont("Concurrent", bytes);
    const second = RegisterTextFont("Concurrent", bytes);
    const settled = await Promise.allSettled([first, second]);
    assert.equal(settled[0].status, "rejected");
    assert.equal(settled[1].status, "fulfilled");
    UnregisterTextFont("Replace");
    UnregisterTextFont("Concurrent");
});

test("registration owns bytes before awaiting and rejects truncated compressed data", async () => {
    const bytes = new Uint8Array(Fixture("woff2"));
    const pending = RegisterTextFont("Owned", bytes);
    bytes.fill(0);
    await pending;
    assert.ok(new Text("A", 16, "Owned").data.index.length > 0);
    await assert.rejects(RegisterTextFont("Broken", Fixture("woff2").subarray(0, 36)));
    await assert.rejects(RegisterTextFont("Broken", Fixture("woff").subarray(0, 80)));
    assert.equal(HasTextFont("Broken"), false);
    UnregisterTextFont("Owned");
});
