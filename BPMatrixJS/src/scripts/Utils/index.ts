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
export type { CanvasCoord, InnerSize } from "./Inner.js";
export {
    ContainsTrianglePoint,
    HasSeparatingAxis,
    SegmentDistanceSquared,
    SignedDoubleArea,
    TriangleOverlapArea,
} from "./PlanarGeometry.js";
export type { Point2D, Triangle2D } from "./PlanarGeometry.js";
export { ContainsPolygonPoint, InverseTransformPoint2D, ProjectSegmentPoint, TransformPoint2D } from "./PointGeometry.js";
export type { PolygonFillRule } from "./PointGeometry.js";
export { CheckPrecision } from "./Precision.js";
export { Time } from "./Time.js";
export type { TimeLike, TimeUpdateFn } from "./Time.js";
export { UUID } from "./UUID.js";
export { Bool, Covers, Difference, FastCollision, GetBounds, Intersection, Intersects, Overlaps, Union, Xor } from "./Bool/index.js";
export type { BoolBounds, BoolChange, BoolContour, BoolFillRule, BoolGeometry, BoolGeometryData, BoolId, BoolInput, BoolKeep, BoolResult, BoolSide, BoolSource, BoolTriangles } from "./Bool/index.js";
export { Clamp };
