import type Style from "./index";

/** 样式通知区域，whole 表示更换整个 Style。 */
export type StyleArea = "solid" | "wireframe" | "edge" | "points" | "join" | "whole";
/** 边框对齐方式。 */
export type BorderAlign = "inset" | "normal" | "outset";
/** px 固定屏幕像素，zoom 跟随相机缩放。 */
export type PixelAligned = "px" | "zoom";
/** 不携带 GPU 缓存的样式变化通知。 */
export interface StyleChange {
    readonly source: Style;
    readonly area: StyleArea;
    readonly field: string;
}
/** 开放式订阅协议；Geometry、Material 和未来 IMesh 都可实现。 */
export interface StyleSubscriber {
    onStyleChange(change: StyleChange): void;
}
/** 分区通知接收者，通常是所属 Style。 */
export interface PartSubscriber {
    onPartChange(area: Exclude<StyleArea, "whole">, field: string): void;
}
