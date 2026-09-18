type TimeUpdateFn = (time: Time) => void;
interface TimeLike {
    initial: number;
    current: number;
    past: number;
    difference: number;
    log: number[];
    fps: number;
    maxLogLength: number;
    onUpdate?: TimeUpdateFn;
}
/**
 * 时间工具类
 * @class
 * @implements TimeLike
 * @description 用于记录经过时间、帧间隔与平均帧率
 * @example
 * ```ts
 * const time = new Time();
 * ```
 */
class Time implements TimeLike {
    /**
     * 初始时间戳
     */
    public initial: number;
    /**
     * 当前时间戳
     */
    public current: number;
    /**
     * 已经过时间
     */
    public past: number;
    /**
     * 与上一帧的时间差
     */
    public difference: number;
    /**
     * 帧率记录
     */
    public log: number[];
    /**
     * 平均帧率
     */
    public fps: number;
    /**
     * 帧率采样数量
     */
    public maxLogLength: number;
    /**
     * 时间更新回调
     * 外部可按需挂载
     */
    public onUpdate?: TimeUpdateFn;
    /**
     * 创建时间工具
     * @param initial 初始时间戳
     * @param maxLogLength 帧率采样数量
     * @example
     * const time = new Time(initial, maxLogLength);
     * @returns 创建的 Time 对象。
     */
    public constructor(initial: number = Time.now(), maxLogLength: number = 60) {
        this.initial = initial;
        this.current = initial;
        this.past = 0;
        this.difference = 0;
        this.log = [];
        this.fps = 0;
        this.maxLogLength = Math.max(1, Math.floor(maxLogLength));
    }
    /**
     * 获取当前时间戳
     * 优先使用 performance.now
     * @example
     * time.now();
     * @returns 当前时间戳
     */
    public static now(): number {
        // 区分输入数据形态，使用与实际类型匹配的处理方式。
        if (typeof performance === "undefined" || typeof performance.now !== "function") {
            return Date.now();
        } else {
            return performance.now();
        }
    }
    /**
     * 更新时间数据
     * @param current 当前时间戳
     * @example
     * time.update(current);
     * @returns 当前时间对象
     */
    public update(current: number = Time.now()): this {
        this.current = current;
        const elapsed = this.current - this.initial;
        this.difference = elapsed - this.past;
        this.past = elapsed;
        // 时间差为正时计算帧率，避免初次更新或同一时刻除零。
        if (this.difference > 0) {
            this.log.push(1000 / this.difference);
        }
        // 历史记录超过上限时丢弃最早的数据，控制常驻内存。
        if (this.log.length > this.maxLogLength) {
            this.log.splice(0, this.log.length - this.maxLogLength);
        }
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (this.log.length > 0) {
            /**
             * 累计历史帧率采样，用于计算平均帧率。
             * @param sum 已累计的数值
             * @param value 本次输入值
             * @example
             * SumFrameRates(sum, value);
             * @returns 累计采样值。
             */
            const SumFrameRates = (sum: number, value: number): number => {
                return sum + value;
            };
            const total = this.log.reduce(SumFrameRates, 0);
            this.fps = Math.floor(total / this.log.length);
        } else {
            this.fps = 0;
        }
        this.onUpdate?.(this);
        return this;
    }
    /**
     * 重置时间状态
     * @param initial 初始时间戳
     * @example
     * time.reset(initial);
     * @returns 当前时间对象
     */
    public reset(initial: number = Time.now()): this {
        this.initial = initial;
        this.current = initial;
        this.past = 0;
        this.difference = 0;
        this.log = [];
        this.fps = 0;
        return this;
    }
}
export { Time };
export type { TimeLike, TimeUpdateFn };
