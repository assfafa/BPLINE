import type { TranslationKey } from "@/locale/index.ts";

export interface ApiEntry {
    name: string;
    signature: string;
    description: TranslationKey;
}

export const properties: ApiEntry[] = [
    { name: "x", signature: "x: number", description: "docs.vec2Api.x" },
    { name: "y", signature: "y: number", description: "docs.vec2Api.y" },
];

export const methods: ApiEntry[] = [
    { name: "constructor", signature: "new Vec2(x?: number, y?: number): Vec2", description: "docs.vec2Api.constructor" },
    { name: "add", signature: "add(vec2: Vec2Like): this", description: "docs.vec2Api.add" },
    { name: "sub", signature: "sub(vec2: Vec2Like): this", description: "docs.vec2Api.sub" },
    { name: "mul", signature: "mul(vec2: Vec2Like): this", description: "docs.vec2Api.mul" },
    { name: "div", signature: "div(vec2: Vec2Like): this", description: "docs.vec2Api.div" },
    { name: "dot", signature: "dot(vec2: Vec2Like): number", description: "docs.vec2Api.dot" },
    { name: "crs", signature: "crs(vec2: Vec2Like): number", description: "docs.vec2Api.crs" },
    { name: "dist", signature: "dist(vec2: Vec2Like): number", description: "docs.vec2Api.dist" },
    { name: "distSq", signature: "distSq(vec2: Vec2Like): number", description: "docs.vec2Api.distSq" },
    { name: "len", signature: "len(): number", description: "docs.vec2Api.len" },
    { name: "lenSq", signature: "lenSq(): number", description: "docs.vec2Api.lenSq" },
    { name: "normal", signature: "normal(): this", description: "docs.vec2Api.normal" },
    { name: "copy", signature: "copy(vec2: Vec2Like): this", description: "docs.vec2Api.copy" },
    { name: "clone", signature: "clone(): Vec2", description: "docs.vec2Api.clone" },
    { name: "set", signature: "set(x: number, y: number): this", description: "docs.vec2Api.set" },
    { name: "setX", signature: "setX(x: number): this", description: "docs.vec2Api.setX" },
    { name: "setY", signature: "setY(y: number): this", description: "docs.vec2Api.setY" },
    { name: "apply", signature: "apply(mat3: Mat3Like): this", description: "docs.vec2Api.apply" },
    { name: "max", signature: "max(vec2: Vec2Like): this", description: "docs.vec2Api.max" },
    { name: "min", signature: "min(vec2: Vec2Like): this", description: "docs.vec2Api.min" },
    { name: "clamp", signature: "clamp(min: Vec2Like, max: Vec2Like): this", description: "docs.vec2Api.clamp" },
    { name: "scl", signature: "scl(value: number): this", description: "docs.vec2Api.scl" },
    { name: "angle", signature: "angle(vec2?: Vec2Like): number", description: "docs.vec2Api.angle" },
    { name: "equals", signature: "equals(vec2: Vec2Like): boolean", description: "docs.vec2Api.equals" },
];

export const vec2Code = `import { Vec2 } from "bpmatrixjs/Math/Vec2";

const vector = new Vec2(3, 4);
const length = vector.len(); // 5
vector.add(new Vec2(2, 1)); // vector is now (5, 5)`;
