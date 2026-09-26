import type { TranslationKey } from "@/locale/index.ts";

export interface ApiEntry {
    name: string;
    signature: string;
    description: TranslationKey;
}

export const methods: ApiEntry[] = [
    { name: "constructor", signature: "new Mat3(data?: Mat3Data): Mat3", description: "docs.mat3Api.constructor" },
    { name: "identity", signature: "identity(): this", description: "docs.mat3Api.identity" },
    { name: "set", signature: "set(data: Mat3Data): this", description: "docs.mat3Api.set" },
    { name: "setTranslate", signature: "setTranslate(vec2: Vec2Like): this", description: "docs.mat3Api.setTranslate" },
    { name: "setScale", signature: "setScale(vec2: Vec2Like): this", description: "docs.mat3Api.setScale" },
    { name: "setRotation", signature: "setRotation(angle: number): this", description: "docs.mat3Api.setRotation" },
    { name: "getTranslate", signature: "getTranslate(vec2?: Vec2Like): Vec2Like", description: "docs.mat3Api.getTranslate" },
    { name: "getScale", signature: "getScale(vec2?: Vec2Like): Vec2Like", description: "docs.mat3Api.getScale" },
    { name: "getRotation", signature: "getRotation(): number", description: "docs.mat3Api.getRotation" },
    { name: "mul", signature: "mul(value: number | Mat3Like, mat3?: Mat3Like): this", description: "docs.mat3Api.mul" },
    { name: "transpose", signature: "transpose(): this", description: "docs.mat3Api.transpose" },
    { name: "det", signature: "det(): number", description: "docs.mat3Api.det" },
    { name: "invert", signature: "invert(): this", description: "docs.mat3Api.invert" },
    { name: "copy", signature: "copy(mat3: Mat3Like): this", description: "docs.mat3Api.copy" },
    { name: "clone", signature: "clone(): Mat3", description: "docs.mat3Api.clone" },
    { name: "equals", signature: "equals(mat3: Mat3Like): boolean", description: "docs.mat3Api.equals" },
];

export const mat3Code = `import { Mat3 } from "bpmatrixjs/Math/Mat3";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const transform = new Mat3();
transform.setTranslate(new Vec2(12, 8));
transform.setRotation(Math.PI / 2);
transform.setScale(new Vec2(2, 3));

const point = new Vec2(2, 1);
const transformed = point.clone().apply(transform); // (9, 12)
const restored = transformed.clone().apply(transform.clone().invert()); // (2, 1)`;
