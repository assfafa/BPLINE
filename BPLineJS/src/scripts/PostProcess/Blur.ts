import { Vec2 } from "bpmatrixjs/Math";
import type RenderTarget from "../RenderTarget";
import type PresetResources from "./PresetResources";
import shader from "./wgsls/blur.wgsl?raw";

/** 预乘颜色/Alpha 遮罩的可分离高斯；两个有界一维步骤复用同参数组的结果。 */
class Blur {
    /** @param resources 内部资源 @param key 分组步骤前缀 @param input 预乘数据输入 @param radius 物理像素半径 @param spread 物理像素扩散距离 @example Blur.apply(resources, key, input, 20, 0); @returns 模糊后的数据目标，零半径透传。 */
    public static apply(resources: PresetResources, key: string, input: RenderTarget, radius: number, spread: number = 0): RenderTarget {
        let output = input;
        // 扩散先对两个轴做最大值过滤；高斯也分轴执行，避免二维采样平方增长。
        for (const mode of ["spread", "blur"] as const) {
            let distance = radius;
            let maximum = 0;
            // 扩散阶段使用最大值，模糊阶段使用高斯权重。
            if (mode === "spread") {
                distance = Math.abs(spread);
                maximum = Math.sign(spread);
            }
            // 零距离阶段直接复用上一结果。
            if (distance > 0) {
                // 可分离滤波让两个轴的成本相加。
                for (const [axis, direction] of [["x", new Vec2(1, 0)], ["y", new Vec2(0, 1)]] as const) {
                    const step = key + ":" + mode + ":" + axis;
                    const pass = resources.step(step, shader);
                    pass.raw.value = { direction, radius: distance, maximum };
                    output = resources.draw(step, output, true, "rgba16float");
                }
            }
        }
        return output;
    }
}
export default Blur;
