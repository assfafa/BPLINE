# BPMatrixJS Working Memory

- Follow root `AGENTS.md`: public documentation is limited to the root README for now. Do not recreate package README/API docs or routinely update future documentation/showcase pages; wait for an explicit documentation task around a stable release. Keep source JSDoc and necessary agent guidance.

## Package Direction

- NPM package name: `bpmatrixjs`
- Current package version: `0.1.101-beta.12`
- Library source root: `BPMatrixJS/src/scripts`
- App/demo shell outside the package root is only for local testing

## Public Import Shape

- Root import should support:
  - `import BPMatrixJS from "bpmatrixjs";`
  - `BPMatrixJS.Geometry`
  - `BPMatrixJS.Math`
  - `BPMatrixJS.Utils`
- Directory imports should also work:
  - `bpmatrixjs/Math`
  - `bpmatrixjs/Geometry`
  - `bpmatrixjs/Utils`
- File imports should also work for exported paths under `Math/*` and `Geometry/*`

## Export Naming

- Exported functions use PascalCase
- Utility-style shared functions should live under `src/scripts/Utils`

## Build Notes

- Library output directory: `BPMatrixJS/lib`
- Type declarations are generated with the library build
- `package.json` exports point at `lib`

## Geometry Notes

- NGon lives in Geometry/NGon.ts and is exported through Geometry. Public option spellings are nvMode (bounding/polar) and inter (inner radius). Other options are sides>=2, hole, outer, startAngle and solid. Two sides are an open diameter with no fill; zero radius is empty; inter is clamped to outer. Equal radii have one distinct contour and no fill.
- NGon annulus fill stitches corresponding inner/outer edges, never fans across the hole. Polar seams duplicate vertices at U=0/1. Border helpers use a normalized-radius Poly carrier before restoring coordinates to avoid fixed reference extrusion reversing small-radius triangles; inner normals and winding are flipped. Line and auxiliary point helpers merge independent loops. Tests: build:lib then node --test tests/NGon.test.mjs. No BPLineJS NGon wrapper or npm publication is included in this change.

- Poly lives in Geometry/Poly/index.ts with an explicit package subpath export. Allow empty/incomplete input and self-intersections, touches and reversing edges. Empty/incomplete paths return empty arrays with finite bounds; consecutive duplicate nodes are merged. Simple concave fills use ear clipping; an untriangulatable remainder falls back to a bounded CW triangle fan, which may overlap and does not implement Canvas fill rules. No holes/multiple contours. Never throw merely because lines cross. This permissive update is not yet published as of the beta.13 source change.
- Poly closed/solid default true. Open paths require solid=false and have butt caps. Per-node round/segments affect stroke joins only, not fill outline or independent width. Closed input normalizes CCW; output triangles are CW like Rect.
- Poly border data follows Rect's shader-extruded carrier normal/miterScale/uv contract. Closed inset/normal/outset refer to contour interior/exterior; on open paths inset is left and outset is right. Keep original coordinates, report bounds. Wide stroke offset overlaps are not Boolean-cleaned in v1.
- Poly set is atomic, regenerates fill and invalidates optional border/line/point caches; copied frozen points prevent silent parameter edits. Auxiliary points use original vertices/midpoints and adjacent-length SUM thresholds. All generated indices upgrade to Uint32Array when necessary.

- Rect geometry is centered at `(0, 0)`
- Geometry and UV buffers are returned as `Float32Array`
- Rounded rect radius is clamped to `min(width, height) / 2`
## Math Subscriptions

- Mat3 and Vec2 expose private _data through a TS-readonly data getter and copying setter.
- add(subscriber, field?) / delete(subscriber, field?) manage field-specific MathSubscriber callbacks. Vec2.add(vec2) remains arithmetic through overloads.
- Each numeric mutation commits once and notifies after GPUData is synchronized. Render consumers never belong inside this math package.
- updateVersion() explicitly commits raw JS array changes; prefer setters and methods. Do not add Proxy interception to hot-path reads.
- Build: npm run build:lib; test: node --test tests/math-versions.test.mjs. Publish prereleases with --tag beta, preserving latest.
