# BPLineJS and BPMatrixJS

BPLineJS is a TypeScript WebGPU 2D renderer and vector editor for interactive graphics, CAD-style selection, editable shapes, and text. Build scenes with filled geometry, borders, vertex handles, image or video textures, GPU instancing, custom WGSL shaders, and mouse or touch camera controls.

- [API documentation](https://assfafa.github.io/BPLINE/#/docs/bpline): public BPLineJS and BPMatrixJS APIs.
- [Interactive examples](https://assfafa.github.io/BPLINE/#/example/basic-mesh/rectangle): geometry, text, materials, post-processing, instancing, textures, camera controls, selection, editors, and helper grids.
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
- **Offscreen and post-processing:** RenderTarget inputs for materials, custom WgslPass stages, per-object Bloom and Shadow, SMAA/FXAA anti-aliasing, and automatic or explicit HDR canvas output. Equal effect settings share rendering work; Bloom respects occlusion and keeps the strongest complete glow color.
- **Helpers:** adaptive background grids, independent horizontal and vertical rulers, dark/light/custom themes, and observable color settings.

Start with the [combined selector](https://assfafa.github.io/BPLINE/#/example/select), [collection editor](https://assfafa.github.io/BPLINE/#/example/editor), or [helper grid](https://assfafa.github.io/BPLINE/#/example/helper/grid). Each editor and helper example includes a complete standalone TypeScript entry with renderer, camera, animation loop and resize handling. Full examples include camera controls and GUI configuration. The [post-processing API](https://assfafa.github.io/BPLINE/#/docs/bpline/post-process) links to live Bloom, Shadow, SMAA, FXAA and custom WgslPass examples with simple and full GUI versions.

Text fonts must be registered before creating text geometry. Poly uses a single nonzero-winding contour without separate holes; Base2D can retain inner and outer contours from an existing triangulated mesh. BPMatrixJS provides Boolean operations separately through `Utils/Bool`, with source tracking and support for mixed contours and triangle meshes. Editor JSON preserves hierarchy, original order, appearance, transforms, and geometry parameters; fonts and URL-less external textures need to be supplied again across sessions.

## Search keywords

WebGPU 2D renderer, TypeScript graphics library, vector graphics editor, CAD-style picking, geometry editing, text geometry, WOFF2 fonts, WGSL shaders, GPU instancing, vertex snapping, scene graph, viewport culling, quadtree, adaptive tessellation, background grid, rulers, offscreen rendering, post-processing, bloom, shadow, SMAA, FXAA, HDR.

中文检索：WebGPU 二维渲染器、TypeScript 图形库、矢量图形编辑器、CAD 框选、几何编辑、文字几何、字体解析、实例化渲染、顶点吸附、场景树、视口裁剪、四叉树、动态精度、辅助网格、标尺、离屏渲染、后处理、发光、阴影、抗锯齿、高动态范围。

## Install from npm

Install the math and geometry library directly, or install the renderer for WebGPU scenes:

~~~bash
npm install bpmatrixjs@0.1.104
npm install bplinejs@0.1.104
~~~

`bplinejs` depends on `bpmatrixjs`; install both explicitly when importing from both packages.

Version 0.1.104 includes the editor, helper, offscreen rendering, and post-processing workflows described above:

~~~bash
npm install bplinejs@0.1.104 bpmatrixjs@0.1.104
# For the complete examples with GUI controls:
npm install lil-gui
~~~

Release notes: [BPLineJS 0.1.104](BPLineJS/releases/0.1.104.md) and [BPMatrixJS 0.1.104](BPMatrixJS/releases/0.1.104.md). Text parsing, shaping, and triangulation use WebAssembly with reusable caches. Await font registration before creating text synchronously. BPMatrixJS provides WASM Boolean operations for contours and triangle meshes through `bpmatrixjs/Utils/Bool`; await `Bool.ready()` before use. The collection editor supports subtraction and union with shared undo history; select A, hold `-` and click B to cut A while retaining B, or hold `=` and click B to merge both. Its complete example includes all keyboard tips. Run browser examples in a WebGPU-capable browser using HTTPS or localhost.

Create offscreen inputs with `new RenderTarget(scene, camera)` and draw them with `render.renderPass(target)`. Materials accept the target directly. Add built-in or custom passes to `new PostProcess(render)`, then call `post.render(target)` to display the result. Bloom and Shadow settings belong to `style.bloom` and `style.shadow`. `render.hdr` defaults to `"auto"` and also accepts `true` or `false`; `hdrAvailable` reports browser detection, while `hdrEnabled` reports an accepted extended canvas configuration. Ordinary material colors stay unchanged; actual HDR brightness still depends on the browser and display path.

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

The build reads the exact `bplinejs` and `bpmatrixjs` versions from `Example/package.json` and verifies the installed packages. It writes the current site to `docs/<bplinejs-version>/`, preserving all other version directories. GitHub Pages serves `/docs` from the current branch. For example, version 0.1.104 lives at `/BPLINE/0.1.104/#/docs/bpline`; the version directory precedes the URL hash so each snapshot loads its own JavaScript and assets.

The top navigation switches between completed versions listed in `docs/versions.json`. It retains a page when available in the destination version, otherwise opens that version's document or example home. The shared root redirects existing bookmarks to the latest snapshot. Version 0.1.103 was restored from its original Git tag, retaining its historical assets and case list.

To restore another historical standalone website that was already committed in a release tag, run `npm run archive -- bplinejs-v0.1.103` from `Example`, then `npm run build`. Existing archived version directories are preserved. `npm run preview` serves the full versioned site locally.

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

Text registration, shaping, curve sampling, and triangulation run in WebAssembly. Await `RegisterTextFont(name, bytes)` in BPMatrixJS or `Font.register(name, url)` in BPLineJS before creating text. Repeated glyphs and identical text layouts reuse bounded caches. TTF, OTF, WOFF, and WOFF2 are supported.

Run `npm run build:wasm:text` in BPMatrixJS to compile the C++ sources with Emscripten. The Dockerfile provides the compiler. Verified dependency sources and object files stay in the project's `.local/wasm-text` directory. Third-party notices are retained in [Geometry/Wasm/LICENSE](BPMatrixJS/src/scripts/Geometry/Wasm/LICENSE) and included in the package.

Boolean operations use Rust iOverlay and iTriangle under MIT. Run `npm run build:wasm:bool` to compile the locked dependencies; the verified Rust toolchain and caches stay in `.local/wasm-bool`. Complete dependency notices are retained in [Utils/Bool/LICENSE](BPMatrixJS/src/scripts/Utils/Bool/LICENSE). `npm run build:wasm` builds both native modules, and `npm run build:lib` builds both before compiling TypeScript. npm consumers receive the prebuilt WASM modules and need no native toolchain.

In BPMatrixJS, `npm pack` and `npm publish` run `prepack` automatically: build WASM, compile TypeScript, then package the matching outputs. A failed build stops packaging. Do not use `--ignore-scripts` when preparing a release.

## Editor cursor icons

Editor cursors and rotation handles use SVG artwork from [Phosphor Icons](https://phosphoricons.com/), including adapted and rotated arrow icons. Phosphor Icons is licensed under the [MIT License](https://github.com/phosphor-icons/core/blob/main/LICENSE), copyright © 2023 Phosphor Icons.

The original copyright and permission notice is retained in [BPLineJS/src/scripts/Editor/cursors/LICENSE](BPLineJS/src/scripts/Editor/cursors/LICENSE) and included in the npm package. Keep that notice when redistributing these icons or their modified versions.

## SMAA attribution

The SMAA 1x Medium pass uses the MIT-licensed [iryoku/smaa](https://github.com/iryoku/smaa) implementation and lookup tables. Its copyright and permission notice is retained in [PostProcess/SMAA/LICENSE](BPLineJS/src/scripts/PostProcess/SMAA/LICENSE) and copied into the npm package.
