import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type Render from "../../Render";

/** 等比缩放顶点吸附的屏幕距离输入。 */
interface UniformScaleSnapOptions {
    pivot: Vec2;
    sources: readonly Vec2[];
    targets: readonly Vec2[];
    rawFactor: number;
    stepFactor: number | null;
    radius: number;
    camera: Camera;
    render: Render;
}

/**
 * 沿缩放中心到源顶点的射线，寻找能精确贴合目标顶点的倍率。
 * @param options 缩放中心、源目标顶点及屏幕容差
 * @example
 * const factor = FindUniformScaleSnap(options);
 * @returns 最近的顶点倍率；步进更近或没有命中时为 null
 */
const FindUniformScaleSnap = (options: UniformScaleSnapOptions): number | null => {
    let closestFactor: number | null = null;
    let closestDistance = options.radius + Number.EPSILON;
    // 每个源顶点保持在从中心出发的射线上，避免吸附改变等比约束。
    for (const source of options.sources) {
        const vectorX = source.x - options.pivot.x;
        const vectorY = source.y - options.pivot.y;
        const lengthSquared = vectorX * vectorX + vectorY * vectorY;
        // 中心上的顶点在缩放中不移动，无法用于求倍率。
        if (lengthSquared > Number.EPSILON) {
            const rawPoint = new Vec2(
                options.pivot.x + vectorX * options.rawFactor,
                options.pivot.y + vectorY * options.rawFactor,
            );
            const rawClient = options.camera.worldToWindow(rawPoint, options.render);
            let stepDistance = Infinity;
            // 同时开启步进时，以同一顶点的原始屏幕位置比较两种候选。
            if (options.stepFactor !== null) {
                const stepPoint = new Vec2(
                    options.pivot.x + vectorX * options.stepFactor,
                    options.pivot.y + vectorY * options.stepFactor,
                );
                const stepClient = options.camera.worldToWindow(stepPoint, options.render);
                stepDistance = Math.hypot(stepClient.x - rawClient.x, stepClient.y - rawClient.y);
            }
            // 目标顶点逐个比较，最终只采纳鼠标轨迹附近最近的精确交点。
            for (const target of options.targets) {
                const targetClient = options.camera.worldToWindow(target, options.render);
                const distance = Math.hypot(targetClient.x - rawClient.x, targetClient.y - rawClient.y);
                // 步进更近时保持网格对齐，距离超容差时保留原始缩放。
                if (distance < closestDistance && distance < stepDistance) {
                    const factor = ((target.x - options.pivot.x) * vectorX +
                        (target.y - options.pivot.y) * vectorY) / lengthSquared;
                    // 缩放不能穿过中心或写入无效倍率。
                    if (Number.isFinite(factor) && factor > 0) {
                        const aligned = new Vec2(
                            options.pivot.x + vectorX * factor,
                            options.pivot.y + vectorY * factor,
                        );
                        const alignedClient = options.camera.worldToWindow(aligned, options.render);
                        const error = Math.hypot(alignedClient.x - targetClient.x, alignedClient.y - targetClient.y);
                        // 目标必须落在可缩放的射线上，近似靠近而无法精确对齐的不算吸附。
                        if (error <= 0.5) {
                            closestDistance = distance;
                            closestFactor = factor;
                        }
                    }
                }
            }
        }
    }
    return closestFactor;
};

export { FindUniformScaleSnap };
export type { UniformScaleSnapOptions };
