import type Style from "./index";

/** 捕获效果值，供冻结实例、保存回显及按值合批使用。 */
class Effects {
    /** @param style 来源共享样式 @example Effects.capture(style); @returns 不持有 Style 或 Color 引用的快照。 */
    public static capture(style: Style): EffectData {
        const bloom = style.bloom;
        const shadow = style.shadow;
        return {
            bloom: { enabled: bloom.enabled, color: [bloom.color.r, bloom.color.g, bloom.color.b, bloom.color.a],
                opacity: bloom.opacity, radius: bloom.radius, intensity: bloom.intensity, threshold: bloom.threshold },
            shadow: { enabled: shadow.enabled, color: [shadow.color.r, shadow.color.g, shadow.color.b, shadow.color.a],
                opacity: shadow.opacity, blur: shadow.blur, spread: shadow.spread, offsetX: shadow.offsetX,
                offsetY: shadow.offsetY, inner: shadow.inner, outer: shadow.outer },
        };
    }

    /** @param style 接收样式 @param data 已保存的效果值 @example Effects.apply(style, data); @returns 无返回值，保持订阅链。 */
    public static apply(style: Style, data: EffectData): void {
        Effects.validate(data);
        // 通过 setter 回显，与手动修改效果完全走同一通知路径。
        for (const area of ["bloom", "shadow"] as const) {
            const source = data[area];
            const part = style[area];
            part.enabled = source.enabled;
            part.color.r = source.color[0];
            part.color.g = source.color[1];
            part.color.b = source.color[2];
            part.color.a = source.color[3];
            part.opacity = source.opacity;
        }
        style.bloom.radius = data.bloom.radius;
        style.bloom.intensity = data.bloom.intensity;
        style.bloom.threshold = data.bloom.threshold;
        style.shadow.blur = data.shadow.blur;
        style.shadow.spread = data.shadow.spread;
        style.shadow.offsetX = data.shadow.offsetX;
        style.shadow.offsetY = data.shadow.offsetY;
        style.shadow.inner = data.shadow.inner;
        style.shadow.outer = data.shadow.outer;
    }

    /** @param data 待加载的未知 JSON 值 @example Effects.validate(data); @returns 无返回值，非法效果在修改现有对象前报错。 */
    public static validate(data: unknown): void {
        const root = RequireRecord(data);
        // 校验两种效果的公共字段，避免加载一半后才发现颜色或开关无效。
        for (const area of ["bloom", "shadow"] as const) {
            const part = RequireRecord(root[area]);
            const color: unknown = part.color;
            // RGBA 使用单位区间浮点；禁止 NaN、Infinity 和缺少分量。
            if (typeof part.enabled === "boolean" && Array.isArray(color) && color.length === 4 && color.every(Unit) && Unit(part.opacity)) {
                const fields = ["radius", "intensity", "threshold"];
                // 阴影有独立扩散半径及有符号位移。
                if (area === "shadow") {
                    fields.splice(0, fields.length, "blur", "spread");
                    Require(typeof part.inner === "boolean" && typeof part.outer === "boolean" && Finite(part.offsetX) && Finite(part.offsetY));
                }
                // 无上限效果参数必须至少是有限非负值，采样量由着色器固定上界。
                for (const field of fields) {
                    const value = part[field];
                    Require(Finite(value) && value >= 0);
                }
            } else {
                throw new TypeError("Invalid postprocess style data.");
            }
        }
    }
}

interface EffectPartData {
    enabled: boolean;
    color: [number, number, number, number];
    opacity: number;
}
interface BloomData extends EffectPartData {
    radius: number;
    intensity: number;
    threshold: number;
}
interface ShadowData extends EffectPartData {
    blur: number;
    spread: number;
    offsetX: number;
    offsetY: number;
    inner: boolean;
    outer: boolean;
}
interface EffectData {
    bloom: BloomData;
    shadow: ShadowData;
}

/** @param value 待验证对象 @example RequireRecord(data); @returns 属性记录，非法对象抛错。 */
const RequireRecord = (value: unknown): Record<string, unknown> => {
    // 仅接受 JSON 对象，不接受数组、null 或基本类型。
    if (typeof value === "object" && value !== null && Array.isArray(value) === false) {
        return value as Record<string, unknown>;
    } else {
        throw new TypeError("Invalid postprocess style data.");
    }
};
/** @param value 待验证数值 @example Finite(1); @returns 是否是有限数字。 */
const Finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
/** @param value 待验证分量 @example Unit(0.5); @returns 是否位于单位区间。 */
const Unit = (value: unknown): boolean => Finite(value) && value >= 0 && value <= 1;
/** @param condition 校验结果 @example Require(true); @returns 无返回值，拒绝不合法的效果记录。 */
const Require = (condition: boolean): void => {
    // 数据验证必须先于写入现有 Style。
    if (condition === false) {
        throw new TypeError("Invalid postprocess style data.");
    }
};

export default Effects;
export type { EffectData, BloomData, ShadowData };
