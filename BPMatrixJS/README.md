# bpmatrixjs

TypeScript 2D math, rectangle and single-contour polygon geometry utilities.

## Poly

```ts
import Poly from "bpmatrixjs/Geometry/Poly";

const poly = new Poly([
    { x: -100, y: -60, round: true, segments: 8 },
    { x: 100, y: -60 },
    { x: 40, y: 0 },
    { x: 100, y: 60, round: true, segments: 12 },
    { x: -100, y: 60 },
]);
const fill = poly.data;
const border = poly.createBorderGeometry(10, 2, "normal");
const line = poly.createLineGeometry(2);
const points = poly.createPointGeometry(2, 4, true, true, 6, 4);

const open = new Poly([[0, 0], [100, 0], [100, 100]], {
    closed: false,
    solid: false,
});
```

- Input is one ordered contour, not WebGPU point-list topology. Concave simple polygons are supported by ear clipping; holes, self-intersections, touching nonadjacent edges and reversing edges are rejected.
- `closed` and `solid` default true. An open solid is invalid; open paths have butt caps and never generate a closing edge. A repeated final copy of the first node is removed for closed contours.
- Each node accepts `round=false` and `segments=8` (integer 1..4096). They control stroke joins only, not the fill outline or per-node width. Round joins subdivide the outer side of a turn; the inner side uses an intersection. Sharp joins use a miter and can extend far at acute corners.
- Input coordinates are preserved, not centered automatically. Closed contours normalize to counterclockwise order; triangle indices are clockwise, matching Rect. `points` is a copied, frozen view; use `set(points, options)` to replace it. Omitted set options preserve existing switches.
- `data`, `borderData`, `lineData`, `pointData` follow Rect's on-demand cache pattern. `set` recreates fill and invalidates all three extra caches. `width` and `height` are readonly bounding-box dimensions.
- Every result contains geometry/normal/uv/index plus width/height/minX/minY/closed. Indices automatically become Uint32Array above 65536 vertices. Fill UVs use the original bounding box, without stretching individual triangles.
- Border geometry is a shader-extruded carrier, NOT pre-expanded positions. Expand each vertex by `normal * miterScale * lineWidth * (uv.y === 0 ? align - 1 : align)`, with inset/normal/outset mapped to 0/0.5/1. Closed inset/outset mean inside/outside; open paths use left/right relative to input direction. Centerline geometry and unit normals can be reused for fixed-pixel rendering.
- Stroke U spans `uvRepeat` over the centerline length, V spans 0..1 across width. Round joins keep U at the node's distance; perimeter does not include the offset arc. Noninteger UV repeats need not match at a closed seam.
- Native `lineData` contains line-list indices for the original path, not rounded stroke joins. Auxiliary points use original vertices and edge midpoints. Vertex thresholds compare the SUM of adjacent edge lengths; an open endpoint counts its one edge. Both point switches cannot be false. Each marker has independent bounding-box UVs and repeated `position` center coordinates, just like Rect markers.
- `getPerimeter()` returns closed perimeter or open total length. Standalone exports are `CreatePolyGeometry`, `CreatePolyBorderGeometry`, `CreatePolyLineGeometry`, `CreatePolyPointGeometry`, `GetPolyPerimeter`; they are also available through `BPMatrixJS.Geometry`. Border/line/point/length helpers default to no fill validation (`solid=false`), and accept options last.
- Large widths, short edges and narrow concavities can make offset strokes overlap; this version does not perform Boolean cleanup of the offset region. Ear clipping and contour validation target moderate node counts, not a linear-time massive-path tessellator. No polygon SDF shader is included.

## Math Versions

Mat3 and Vec2 use a private _data array. The data getter exposes a TypeScript-readonly view; assigning data copies values and emits an update. Mat3 synchronizes its padded 12-float GPUData before notifying consumers.

```ts
import { Vec2, Mat3, type MathSubscriber } from "bpmatrixjs/Math";

const position = new Vec2(1, 2);
const observer: MathSubscriber = {
    onMathChange(source, field): void {
        console.log(field, source.version);
    },
};
position.add(observer, "position");
position.set(3, 4); // One complete update.
position.add({ x: 1, y: 2 }); // Arithmetic add is preserved.
position.delete(observer, "position");

const matrix = new Mat3();
matrix.add(observer, "matrix");
matrix.data = [1, 0, 0, 0, 1, 0, 10, 20, 1];
```

Subscriptions are keyed by consumer and field, so a shared vector can safely serve position and scale. Clones copy numbers, not subscriptions. Equal assignments do not increment versions; multi-component operations notify after all components are committed.

Do not mutate data indices or GPUData directly. The getter is readonly at the TypeScript boundary, not a runtime Proxy. JavaScript callers that deliberately edit the underlying data must call updateVersion() afterward.

## Build

```sh
npm run build:lib
npm run lint
node --test tests/math-versions.test.mjs
npm pack --dry-run
```

The library includes ESM and declarations. Prereleases use the beta dist-tag.
