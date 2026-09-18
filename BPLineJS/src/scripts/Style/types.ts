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
    /**
     * 接收共享样式的字段变化，通知当前对象的使用者。
     * @param change 变化来源、区域及字段信息
     * @example
     * styleSubscriber.onStyleChange(change);
     * @returns 无返回值。
     */
    onStyleChange(change: StyleChange): void;
}
/** 分区通知接收者，通常是所属 Style。 */
export interface PartSubscriber {
    /**
     * 接收样式分区变化，向共享 Style 的消费者转发通知。
     * @param area 样式分区标识
     * @param field 发生变化的关联字段
     * @example
     * partSubscriber.onPartChange(area, field);
     * @returns 无返回值。
     */
    onPartChange(area: Exclude<StyleArea, "whole">, field: string): void;
}
