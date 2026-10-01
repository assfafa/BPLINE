# BPLineJS and BPMatrixJS

BPLineJS is a TypeScript WebGPU 2D renderer for editable geometry and text. It supports filled shapes, borders, point markers, textures, instanced meshes, and camera controls.

- [API documentation](https://assfafa.github.io/BPLINE/#/docs/bpline): public BPLineJS and BPMatrixJS APIs.
- [Interactive examples](https://assfafa.github.io/BPLINE/#/example/basic-mesh/rectangle): geometry, text, instancing, textures, and camera controls.
- [Website](https://assfafa.github.io/BPLINE/): documentation and example entry point.

| Directory | npm package or purpose | Local port |
| --- | --- | --- |
| BPMatrixJS | bpmatrixjs: 2D math and geometry | 12111 |
| BPLineJS | bplinejs: WebGPU 2D rendering | 12112 |
| Example | Documentation and interactive examples | 12113 |

## Install from npm

Install the math and geometry library directly, or install the renderer for WebGPU scenes:

~~~bash
npm install bpmatrixjs@0.1.103
npm install bplinejs@0.1.103
~~~

`bplinejs` depends on `bpmatrixjs`; install both explicitly when importing from both packages. See the [BPMatrixJS](BPMatrixJS/README.md) and [BPLineJS](BPLineJS/README.md) quick starts for short usage examples.

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
npm run build:lib
npm pack --dry-run
~~~

`npm pack --dry-run` inspects the package without publishing it. `BPLineJS/src/scripts/Examples` contains local verification examples and is excluded from Git and the npm package.

## Font parsing

The text geometry pipeline uses [fontkit](https://github.com/foliojs/fontkit) to parse TTF, OTF, WOFF, and WOFF2 files, lay out glyphs, and read their vector outlines. fontkit is licensed under [MIT](https://github.com/foliojs/fontkit/blob/master/package.json); its copyright and permission notices must be retained when redistributing copies of its code.
