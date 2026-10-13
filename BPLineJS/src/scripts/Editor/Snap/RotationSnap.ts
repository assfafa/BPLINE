import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type Render from "../../Render";

/** 按指针绕中心的屏幕距离选择旋转角度。 */
interface RotationSnapOptions {
    /** 旋转中心的世界坐标。 */
    pivot: Vec2;
    /** 按下时被旋转对象的世界顶点。 */
    sources: readonly Vec2[];
    /** 不参与本次旋转的目标世界顶点。 */
    targets: readonly Vec2[];
    /** 鼠标产生的原始旋转增量，单位弧度。 */
    rawAngle: number;
    /** 角度步进产生的候选增量；没有启用时为 null。 */
    stepAngle: number | null;
    /** 当前鼠标窗口坐标。 */
    cursor: Vec2;
    /** 允许的屏幕像素距离。 */
    radius: number;
    /** 当前相机。 */
    camera: Camera;
    /** 当前渲染器。 */
    render: Render;
}

/**
 * 旋转只改变顶点方向：找出能让源顶点和目标顶点同向的角度。
 * @param options 旋转中心、源与目标顶点、鼠标和屏幕容差
 * @example
 * const angle = FindRotationSnap({ pivot, sources, targets, rawAngle, stepAngle, cursor, radius, camera, render });
 * @returns 比步进更靠近鼠标方向的顶点吸附角度；否则为 null
 */
const FindRotationSnap = (options: RotationSnapOptions): number | null => {
    const pivotClient = options.camera.worldToWindow(options.pivot, options.render);
    const cursorRadius = Math.hypot(options.cursor.x - pivotClient.x, options.cursor.y - pivotClient.y);
    let snapped: number | null = null;
    let bestDistance = options.radius;
    // 指针靠近中心时方向不稳定，保持原始角度或角度步进。
    if (cursorRadius > Number.EPSILON && Number.isFinite(cursorRadius) && options.radius >= 0) {
        // 顶点吸附与角度步进同时开启时，只采用鼠标方向上更近的结果。
        if (options.stepAngle !== null) {
            const stepDifference = options.stepAngle - options.rawAngle;
            bestDistance = Math.min(bestDistance, 2 * cursorRadius * Math.abs(Math.sin(stepDifference / 2)));
        }
        // 每个源顶点只提供一条射线，目标顶点的半径不影响旋转角度。
        for (const source of options.sources) {
            const sourceX = source.x - options.pivot.x;
            const sourceY = source.y - options.pivot.y;
            // 位于中心的源点绕自身旋转不会改变方向。
            if (Math.hypot(sourceX, sourceY) > Number.EPSILON) {
                const sourceAngle = Math.atan2(sourceY, sourceX);
                // 一个源顶点可以和任意一个外部目标方向对齐。
                for (const target of options.targets) {
                    const targetX = target.x - options.pivot.x;
                    const targetY = target.y - options.pivot.y;
                    // 与中心重合的目标没有可吸附的方向。
                    if (Math.hypot(targetX, targetY) > Number.EPSILON) {
                        const targetAngle = Math.atan2(targetY, targetX);
                        const candidate = targetAngle - sourceAngle;
                        const difference = Math.atan2(
                            Math.sin(candidate - options.rawAngle),
                            Math.cos(candidate - options.rawAngle),
                        );
                        const distance = 2 * cursorRadius * Math.abs(Math.sin(difference / 2));
                        // 只接受容差内且比当前步进或顶点候选更靠近鼠标方向的角度。
                        if (distance <= options.radius && distance < bestDistance) {
                            bestDistance = distance;
                            snapped = options.rawAngle + difference;
                        }
                    }
                }
            }
        }
    }
    return snapped;
};

export { FindRotationSnap };
export type { RotationSnapOptions };
