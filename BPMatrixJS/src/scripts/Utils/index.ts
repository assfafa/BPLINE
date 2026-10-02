/**
 * 数值钳制
 * @param value 当前值
 * @param min 最小值
 * @param max 最大值
 * @example
 * Clamp(value, min, max);
 * @returns 钳制结果
 */
const Clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};
export { ConvertEventToCanvasCoord, GetDevicePixelRatio, GetInner } from "./Inner.js";
export { UUID } from "./UUID.js";
export { Clamp };
export { Time } from "./Time.js";
export {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
} from "./PlanarGeometry.js";
export type { Point2D, Triangle2D } from "./PlanarGeometry.js";
export type { CanvasCoord, InnerSize } from "./Inner.js";
export type { TimeLike, TimeUpdateFn } from "./Time.js";
