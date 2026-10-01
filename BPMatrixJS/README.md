# BPMatrixJS

2D vectors, matrices, and geometry builders for TypeScript projects. The text geometry module accepts registered TTF, OTF, WOFF, and WOFF2 fonts.

## Install

```bash
npm install bpmatrixjs@0.1.103
```

## Quick start

```ts
import { Vec2 } from "bpmatrixjs/Math";

const position = new Vec2(10, 20);
position.add(new Vec2(5, -2));
console.log(position.x, position.y); // 15, 18
```

The package also exports `bpmatrixjs/Geometry` and `bpmatrixjs/Utils`.
