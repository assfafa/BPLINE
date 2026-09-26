import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Time",
    intro: {
        cn: "记录累计时间、帧间隔和平均 FPS；每帧调用 update() 更新。",
        en: "Track elapsed time, frame delta, and average FPS by calling update() once per frame.",
    },
    code: `import { Time } from "bpmatrixjs/Utils";

const time = new Time();
// Inside the animation loop:
time.update();
const delta = time.difference;
const fps = time.fps;`,
    properties: [
        entry("initial: number; current: number", "起始与当前时间戳。", "Initial and current timestamps."),
        entry("past: number; difference: number", "累计经过时间与上一帧间隔。", "Elapsed time and the latest frame delta."),
        entry("fps: number; maxLogLength: number", "平均帧率与参与平均的最大采样数。", "Average FPS and the maximum sample count."),
        entry("onUpdate?: (time: Time) => void", "每次更新后调用的可选回调。", "Optional callback after each update."),
    ],
    methods: [
        entry("new Time(initial?: number, maxLogLength?: number)", "创建计时器，默认从当前时间开始并保留 60 次采样。", "Create a timer starting now with 60 samples by default."),
        entry("Time.now(): number", "返回 performance.now()，不可用时使用 Date.now()。", "Use performance.now(), falling back to Date.now()."),
        entry("update(current?: number): this", "记录新时间、间隔与平均帧率，并调用 onUpdate。", "Record time, delta, and average FPS, then call onUpdate."),
        entry("reset(initial?: number): this", "清空统计并从新起点重新计时。", "Clear samples and restart from a new timestamp."),
    ],
};
