# BPLineJS

A TypeScript WebGPU 2D renderer for editable shapes, text, borders, point markers, textures, and instanced meshes.

## Install

```bash
npm install bplinejs@0.1.103
```

Install `bpmatrixjs@0.1.103` as well if your application imports its math or geometry APIs directly.

## Quick start

Add `<div id="app"></div>` to the page, then render a rectangle:

```ts
import { BaseMaterial, Camera, Mesh, Rect2D, Render, Scene, Style } from "bplinejs";

const style = new Style();
style.solid.enabled = true;
style.solid.color.setHex("#5577ee");

const geometry = new Rect2D({ width: 180, height: 110, style });
const mesh = new Mesh(geometry, new BaseMaterial(style), false);
const scene = new Scene();
scene.add(mesh);

const render = new Render("app");
await render.ready;
render.resize();

const camera = new Camera();
camera.setViewport(render.canvas.width, render.canvas.height);
render.render(scene, camera);
```

The browser must support WebGPU. See the [API documentation and examples](https://assfafa.github.io/BPLINE/) for text, custom materials, and other geometry.
