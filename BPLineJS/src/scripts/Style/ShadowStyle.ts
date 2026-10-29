import PartStyle, { NormalizeSize } from "./PartStyle";

/** 对象专属shadow参数，由对应后处理通道按值合批；不改变几何。 */
class ShadowStyle extends PartStyle {
    /** 阴影默认半透明，不影响其他样式区域的默认值。 */
    protected override _opacity: number = 0.5;
    /** 屏幕 CSS px 模糊半径，默认 12。 */
    private _blur: number = 12;
    /** 屏幕 CSS px 扩散距离，非负，默认 0。 */
    private _spread: number = 0;
    /** 屏幕 CSS px 水平偏移，正值向右，默认 4。 */
    private _offsetX: number = 4;
    /** 屏幕 CSS px 垂直偏移，正值向上，默认 -4。 */
    private _offsetY: number = -4;
    /** 是否显示轮廓内阴影，默认 false。 */
    private _inner: boolean = false;
    /** 是否显示轮廓外阴影，默认 true。 */
    private _outer: boolean = true;
    /** @example const part = new ShadowStyle(); @returns 默认关闭的效果样式。 */
    public constructor() {
        super("shadow");
        this.color.setHex("#000000");
    }
    /** @example style.shadow.blur; @returns 屏幕 CSS px 模糊半径。 */
    public get blur(): number {
        return this._blur;
    }
    /** @param value 屏幕 CSS px 模糊半径 @example style.shadow.blur = 12; @returns 无返回值，通知样式消费者。 */
    public set blur(value: number) {
        value = NormalizeSize(value);
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._blur !== value) {
            this._blur = value;
            this.notify("blur");
        }
    }
    /** @example style.shadow.spread; @returns 屏幕 CSS px 扩散距离，非负。 */
    public get spread(): number {
        return this._spread;
    }
    /** @param value 屏幕 CSS px 扩散距离，非负 @example style.shadow.spread = 0; @returns 无返回值，通知样式消费者。 */
    public set spread(value: number) {
        value = NormalizeSize(value);
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._spread !== value) {
            this._spread = value;
            this.notify("spread");
        }
    }
    /** @example style.shadow.offsetX; @returns 屏幕 CSS px 水平偏移，正值向右。 */
    public get offsetX(): number {
        return this._offsetX;
    }
    /** @param value 屏幕 CSS px 水平偏移，正值向右 @example style.shadow.offsetX = 4; @returns 无返回值，通知样式消费者。 */
    public set offsetX(value: number) {
        // 有符号位移允许负值，但拒绝不能进入 uniform 的数值。
        if (Number.isFinite(value) === false) {
            throw new RangeError("Shadow offset must be finite.");
        }
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._offsetX !== value) {
            this._offsetX = value;
            this.notify("offsetX");
        }
    }
    /** @example style.shadow.offsetY; @returns 屏幕 CSS px 垂直偏移，正值向上。 */
    public get offsetY(): number {
        return this._offsetY;
    }
    /** @param value 屏幕 CSS px 垂直偏移，正值向上 @example style.shadow.offsetY = -4; @returns 无返回值，通知样式消费者。 */
    public set offsetY(value: number) {
        // 有符号位移允许负值，但拒绝不能进入 uniform 的数值。
        if (Number.isFinite(value) === false) {
            throw new RangeError("Shadow offset must be finite.");
        }
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._offsetY !== value) {
            this._offsetY = value;
            this.notify("offsetY");
        }
    }
    /** @example style.shadow.inner; @returns 是否显示轮廓内阴影。 */
    public get inner(): boolean {
        return this._inner;
    }
    /** @param value 是否显示轮廓内阴影 @example style.shadow.inner = false; @returns 无返回值，通知样式消费者。 */
    public set inner(value: boolean) {
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._inner !== value) {
            this._inner = value;
            this.notify("inner");
        }
    }
    /** @example style.shadow.outer; @returns 是否显示轮廓外阴影。 */
    public get outer(): boolean {
        return this._outer;
    }
    /** @param value 是否显示轮廓外阴影 @example style.shadow.outer = true; @returns 无返回值，通知样式消费者。 */
    public set outer(value: boolean) {
        // 数值真正变化才使下一帧重新分组和同步参数。
        if (this._outer !== value) {
            this._outer = value;
            this.notify("outer");
        }
    }
    /** @param source 来源效果样式 @example style.shadow.copy(source); @returns 当前效果样式，颜色独立。 */
    public override copy(source: ShadowStyle): this {
        super.copy(source);
        this.blur = source.blur;
        this.spread = source.spread;
        this.offsetX = source.offsetX;
        this.offsetY = source.offsetY;
        this.inner = source.inner;
        this.outer = source.outer;
        return this;
    }
    /** @example style.shadow.clone(); @returns 独立的新效果样式。 */
    public override clone(): ShadowStyle {
        return new ShadowStyle().copy(this);
    }
}

export default ShadowStyle;
