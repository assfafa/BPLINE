# BPLineJS and BPMatrixJS

BPLineJS is a TypeScript WebGPU 2D renderer and vector editor for interactive graphics, CAD-style selection, editable shapes, and text. Build scenes with filled geometry, borders, vertex handles, image or video textures, GPU instancing, custom WGSL shaders, and mouse or touch camera controls.

- [API documentation](https://assfafa.github.io/BPLINE/#/docs/bpline): public BPLineJS and BPMatrixJS APIs.
- [Interactive examples](https://assfafa.github.io/BPLINE/#/example/basic-mesh/rectangle): geometry, text, materials, instancing, textures, camera controls, selection, editors, and helper grids.
- [Website](https://assfafa.github.io/BPLINE/): documentation and example entry point.

| Directory | npm package or purpose | Local port |
| --- | --- | --- |
| BPMatrixJS | bpmatrixjs: 2D math and geometry | 12111 |
| BPLineJS | bplinejs: WebGPU 2D rendering | 12112 |
| Example | Documentation and interactive examples | 12113 |

## Features

- **2D geometry and typography:** rounded rectangles, regular polygons and rings, concave or self-intersecting polygons, open paths, direct triangle meshes, and multiline TTF/OTF/WOFF/WOFF2 text.
- **Selection and editing:** combined face, edge, vertex, and text selection; rectangle, regular-polygon, polygon, and text editors; mixed selections; editable hierarchy groups; configurable mouse and touch interaction.
- **Editor workflows:** vertex, edge, intersection, and grid snapping; world-origin movement steps and rotation steps; clipboard operations; undo/redo; keyed callbacks; JSON save/load; reversible conversion to Base2D.
- **Rendering:** instanced meshes, image and video textures, CompositeMaterial and fully custom WGSLMaterial, fixed screen-size meshes, viewport culling, scene-based quadtrees, and adaptive curve precision with configurable limits and debounce.
- **Helpers:** adaptive background grids, independent horizontal and vertical rulers, dark/light/custom themes, and observable color settings.

Start with the [combined selector](https://assfafa.github.io/BPLINE/#/example/select), [collection editor](https://assfafa.github.io/BPLINE/#/example/editor), or [helper grid](https://assfafa.github.io/BPLINE/#/example/helper/grid). Each editor and helper example includes a complete standalone TypeScript entry, including the renderer, camera, animation loop, resize handling, and cleanup. Full examples include camera controls and GUI configuration.

Text fonts must be registered before creating text geometry. Poly uses a single nonzero-winding contour and does not expose separate holes or Boolean operations; Base2D can retain inner and outer contours from an existing triangulated mesh. Editor JSON preserves hierarchy, original order, appearance, transforms, and geometry parameters; fonts and URL-less external textures need to be supplied again across sessions.

## Search keywords

WebGPU 2D renderer, TypeScript graphics library, vector graphics editor, CAD-style picking, geometry editing, text geometry, WOFF2 fonts, WGSL shaders, GPU instancing, vertex snapping, scene graph, viewport culling, quadtree, adaptive tessellation, background grid, rulers.

中文检索：WebGPU 二维渲染器、TypeScript 图形库、矢量图形编辑器、CAD 框选、几何编辑、文字几何、字体解析、实例化渲染、顶点吸附、场景树、视口裁剪、四叉树、动态精度、辅助网格、标尺。

## Install from npm

Install the math and geometry library directly, or install the renderer for WebGPU scenes:

~~~bash
npm install bpmatrixjs@0.1.103
npm install bplinejs@0.1.103
~~~

`bplinejs` depends on `bpmatrixjs`; install both explicitly when importing from both packages.

The current beta adds the editor and helper workflows described above:

~~~bash
npm install bplinejs@0.1.104-beta.16 bpmatrixjs@0.1.104-beta.13
# For the complete examples with GUI controls:
npm install lil-gui
~~~

Release notes: [BPLineJS 0.1.104-beta.16](BPLineJS/releases/0.1.104-beta.16.md) and [BPMatrixJS 0.1.104-beta.13](BPMatrixJS/releases/0.1.104-beta.13.md). Rectangle creation keeps its world origin fixed during camera changes and supports snapping with or without stepping. Text conversion preserves every outer contour and hole in editable Base2D geometry. Run browser examples in a WebGPU-capable browser using HTTPS or localhost.

## Docker

Create the development container from the repository root. Reuse an existing `BPLine` container if one is already running:

~~~bash
docker build -t bpline-dev .
docker run -d --name BPLine -p 12111:12111 -p 12112:12112 -p 12113:12113 -v "$PWD:/workspace" bpline-dev
docker exec -it -u pigeon BPLine bash
~~~

## Local development and builds

Run the following commands inside the container. Install dependencies for each project separately:

~~~bash
cd /workspace/BPMatrixJS && npm ci
cd /workspace/BPLineJS && npm ci
cd /workspace/Example && npm ci
~~~

Run `npm run dev` in each project directory to start its development server on the port listed above.

Build the documentation and example website:

~~~bash
cd /workspace/Example
npm run check
npm run build
~~~

The static site is written to `docs/` at the repository root. GitHub Pages can serve `/docs` from the current branch. The site uses hash routing, so page URLs contain `/#/`.

To build either npm library and inspect its package contents, run these commands in `BPMatrixJS` or `BPLineJS`:

~~~bash
npm run check
npm run build:lib
npm pack --dry-run
~~~

`npm pack --dry-run` inspects the package without publishing it. `BPLineJS/src/scripts/Examples` contains local verification examples and is excluded from Git and the npm package.

Each maintained library directory has an `agent.md` describing its files, class fields and defaults, constructors, functions, examples, constraints, and Chinese/English search keywords. Library builds copy these guides beside the corresponding files in `lib/` and include them in the npm package. Run `npm run guides` after source changes; `npm run guides:check` detects outdated guides. Put manual notes between the `agent-notes` markers so regeneration preserves them.

Source files place the main class directly after imports, with field defaults and the constructor before long methods. Shared ESLint rules check this layout and constructor defaults in both packages.

## Font parsing

The text geometry pipeline uses [fontkit](https://github.com/foliojs/fontkit) to parse TTF, OTF, WOFF, and WOFF2 files, lay out glyphs, and read their vector outlines. fontkit is licensed under [MIT](https://github.com/foliojs/fontkit/blob/master/package.json); its copyright and permission notices must be retained when redistributing copies of its code.

## Editor cursor icons

Editor cursors and rotation handles use SVG artwork from [Phosphor Icons](https://phosphoricons.com/), including adapted and rotated arrow icons. Phosphor Icons is licensed under the [MIT License](https://github.com/phosphor-icons/core/blob/main/LICENSE), copyright © 2023 Phosphor Icons.

The original copyright and permission notice is retained in [BPLineJS/src/scripts/Editor/cursors/LICENSE](BPLineJS/src/scripts/Editor/cursors/LICENSE) and included in the npm package. Keep that notice when redistributing these icons or their modified versions.
