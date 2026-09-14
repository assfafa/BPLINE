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
     * @returns 当前时间戳
     */
    public static now(): number {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now();
        }

        return Date.now();
    }

    /**
     * 更新时间数据
     * @param current 当前时间戳
     * @returns 当前时间对象
     */
    public update(current: number = Time.now()): this {
        this.current = current;

        const elapsed = this.current - this.initial;
        this.difference = elapsed - this.past;
        this.past = elapsed;

        if (this.difference > 0) {
            this.log.push(1000 / this.difference);
        }

        if (this.log.length > this.maxLogLength) {
            this.log.splice(0, this.log.length - this.maxLogLength);
        }

        if (this.log.length > 0) {
            const total = this.log.reduce((sum: number, value: number): number => {
                return sum + value;
            }, 0);

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
