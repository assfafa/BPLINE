import type Style from "./index";

/** 每个实例样式的 float 数；WGSL 对应十一个 vec4。 */
export const STYLE_STRIDE: number = 44;

/**
 * 将一份 Style 写入连续实例数组，不分配目标数组，也不修改 Style。
 * @param style 来源样式
 * @param target 预分配的连续 Float32Array
 * @param offset 起始 float 偏移，不是字节偏移
 */
export const WriteStyleData = (style: Style, target: Float32Array<ArrayBuffer>, offset: number = 0): void => {
    if (!Number.isSafeInteger(offset) || offset < 0 || offset + STYLE_STRIDE > target.length) {
        throw new RangeError("Style data offset exceeds the target capacity.");
    }
    target.fill(0, offset + 40, offset + 44);
    const { solid, wireframe, edge, points } = style;
    solid.color.writeTo(target, offset);
    solid.borderColor.writeTo(target, offset + 4);
    edge.color.writeTo(target, offset + 8);
    points.color.writeTo(target, offset + 12);
    wireframe.color.writeTo(target, offset + 16);
    target.set([solid.opacity, solid.borderWidth, Align(solid.borderAlign), Number(solid.pixelAligned === "zoom")], offset + 20);
    target.set([edge.opacity, edge.width, Align(edge.borderAlign), Number(edge.pixelAligned === "zoom")], offset + 24);
    target.set([points.opacity, Number(points.pixelAligned === "zoom"), 0, 0], offset + 28);
    target.set([wireframe.opacity, 0, 0, 0], offset + 32);
    target.set([Number(solid.enabled), Number(wireframe.enabled), Number(edge.enabled), Number(points.enabled)], offset + 36);
};

/**
 * 转换为 Shader 使用的边框外扩系数。
 * @param value 对齐方式
 * @returns 0、0.5 或 1
 */
const Align = (value: "inset" | "normal" | "outset"): number => value === "inset" ? 0 : value === "normal" ? 0.5 : 1;
