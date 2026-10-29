import PartStyle, { NormalizeSize } from "./PartStyle";

/** 对象专属bloom参数，由对应后处理通道按值合批；不改变几何。 */
class BloomStyle extends PartStyle {
    /** 屏幕 CSS px 模糊半径，默认 20。 */
    private _radius: number = 20;
    /** 非负发光强度，默认 1。 */
    private _intensity: number = 1;
    /** 亮度阈值，0 表示全部可见像素参与，默认 0。 */
    private _threshold: number = 0;
    /** @example const part = new BloomStyle(); @returns 默认关闭的效果样式。 */
    public constructor() {
        super("bloom");
    }
    /** @example style.bloom.radius; @returns 屏幕 CSS px 模糊半径。 */
    public get radius(): number {
        return this._radius;
    }
    /** @param value 屏幕 CSS px 模糊半径 @example style.bloom.radius = 20; @returns 无返回值，通知样式消费者。 */
    public set radius(value: number) {
        value = NormalizeSize(value);
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._radius !== value) {
            this._radius = value;
            this.notify("radius");
        }
    }
    /** @example style.bloom.intensity; @returns 非负发光强度。 */
    public get intensity(): number {
        return this._intensity;
    }
    /** @param value 非负发光强度 @example style.bloom.intensity = 1; @returns 无返回值，通知样式消费者。 */
    public set intensity(value: number) {
        value = NormalizeSize(value);
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._intensity !== value) {
            this._intensity = value;
            this.notify("intensity");
        }
    }
    /** @example style.bloom.threshold; @returns 亮度阈值，0 表示全部可见像素参与。 */
    public get threshold(): number {
        return this._threshold;
    }
    /** @param value 亮度阈值，0 表示全部可见像素参与 @example style.bloom.threshold = 0; @returns 无返回值，通知样式消费者。 */
    public set threshold(value: number) {
        value = NormalizeSize(value);
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._threshold !== value) {
            this._threshold = value;
            this.notify("threshold");
        }
    }
    /** @param source 来源效果样式 @example style.bloom.copy(source); @returns 当前效果样式，颜色独立。 */
    public override copy(source: BloomStyle): this {
        super.copy(source);
        this.radius = source.radius;
        this.intensity = source.intensity;
        this.threshold = source.threshold;
        return this;
    }
    /** @example style.bloom.clone(); @returns 独立的新效果样式。 */
    public override clone(): BloomStyle {
        return new BloomStyle().copy(this);
    }
}

export default BloomStyle;
