interface RulerTickLayout {
    start: number;
    spacing: number;
    count: number;
}

/** 每条尺子最多缓存的可见数字标签。 */
const RULER_LABEL_CAPACITY = 64;

/** 标签长度、20 个字形编号组成的固定记录。 */
const RULER_LABEL_STRIDE = 21;

/**
 * 将刻度编号转换为十进制字符串，先用整数单位组合以避开浮点尾数和 GPU 精度问题。
 * @param index 主刻度编号
 * @param step 主刻度的世界长度
 * @example
 * FormatRulerNumber(100, 0.01);
 * @returns 对应刻度的十进制表示。
 */
const FormatRulerNumber = (index: number, step: number): string => {
    let decimalCount = 0;
    // 找到能把当前刻度长度表示成整数的最小十进制倍率。
    for (; decimalCount < 12; decimalCount += 1) {
        const scaledStep = step * Math.pow(10, decimalCount);
        // 浮点乘法的微小误差不应多添一位小数。
        if (Math.abs(scaledStep - Math.round(scaledStep)) < 0.0000001) {
            break;
        }
    }
    const scale = Math.pow(10, decimalCount);
    const stepUnits = BigInt(Math.round(step * scale));
    const valueUnits = BigInt(index) * stepUnits;
    const scaleUnits = BigInt(scale);
    let magnitude = valueUnits;
    let sign = "";
    // 负号与绝对值分开处理，零刻度不会显示负零。
    if (valueUnits < 0n) {
        magnitude = -valueUnits;
        sign = "-";
    }
    const whole = String(magnitude / scaleUnits);
    // 整数刻度不附加小数点和多余的零。
    if (decimalCount === 0) {
        return sign + whole;
    } else {
        const fraction = String(magnitude % scaleUnits).padStart(decimalCount, "0");
        return sign + whole + "." + fraction;
    }
};

/**
 * 编码一个数字字符，10 是小数点，11 是负号。
 * @param character 字符
 * @example
 * EncodeRulerCharacter("5");
 * @returns SDF 字形编号；不支持的字符返回 -1。
 */
const EncodeRulerCharacter = (character: string): number => {
    const digit = character.charCodeAt(0) - 48;
    // ASCII 数字沿用其整数值。
    if (digit >= 0 && digit <= 9) {
        return digit;
    } else if (character === ".") {
        // 小数点占一个字形槽位，避免 GPU 自行推断小数位。
        return 10;
    } else if (character === "-") {
        // 负号在 CPU 上确定，不交给片元中的浮点比较。
        return 11;
    } else {
        return -1;
    }
};

/**
 * 生成屏幕刻度位置及字形缓存；世界坐标仅在 CPU 上生成标签内容。
 * @param worldAtStart 尺子中心线在屏幕起点处的世界坐标
 * @param worldPerPixel 轴向每物理像素的有符号世界增量
 * @param step 主刻度世界间距
 * @param viewportLength 对应屏幕方向的物理像素长度
 * @param dpr 设备像素比
 * @param labels 固定容量的字形缓存
 * @example
 * FillRulerLabels(worldAtStart, worldPerPixel, step, width, dpr, labels);
 * @returns 首刻度像素、间距和已编码标签数。
 */
const FillRulerLabels = (
    worldAtStart: number,
    worldPerPixel: number,
    step: number,
    viewportLength: number,
    dpr: number,
    labels: Float32Array,
): RulerTickLayout => {
    labels.fill(0);
    // 轴向几乎垂直于尺子时，该尺子无法显示有意义的数值刻度。
    if (Number.isFinite(worldAtStart) && Number.isFinite(worldPerPixel) && Math.abs(worldPerPixel) > 0.000000000000001 && step > 0) {
        const spacing = step / Math.abs(worldPerPixel);
        let phase = worldAtStart % step;
        // 负坐标也使用从零到一个周期的正相位。
        if (phase < 0) {
            phase += step;
        }
        // 二进制余数在格线处可能略小于一整个周期。
        if (Math.abs(phase - step) < step * 0.00000001) {
            phase = 0;
        }
        let start = 0;
        let direction = 1;
        // 正向与反向坐标轴选择屏幕内的第一条主刻度。
        if (worldPerPixel > 0) {
            // 非整格起点前移到下一条正向可见刻度。
            if (phase > step * 0.00000001) {
                start = (step - phase) / worldPerPixel;
            }
        } else {
            start = phase / -worldPerPixel;
            direction = -1;
        }
        let count = 0;
        // 标签间隔不足时保留刻度线，仅隐藏会重叠的数字。
        if (spacing >= 28 * dpr && Number.isFinite(spacing)) {
            count = Math.min(RULER_LABEL_CAPACITY, Math.max(0, Math.ceil((viewportLength - start) / spacing)));
            const firstIndex = Math.round((worldAtStart + worldPerPixel * start) / step);
            // 每条刻度在 CPU 上格式化，再写入固定长度的 GPU 字形表。
            for (let labelIndex = 0; labelIndex < count; labelIndex += 1) {
                const text = FormatRulerNumber(firstIndex + direction * labelIndex, step);
                // 超过二十个字形时不截断数字，以免显示错误坐标。
                if (text.length <= RULER_LABEL_STRIDE - 1) {
                    const offset = labelIndex * RULER_LABEL_STRIDE;
                    labels[offset] = text.length;
                    // 字符均已由十进制格式化器限定，可直接转成 SDF 编号。
                    for (let character = 0; character < text.length; character += 1) {
                        labels[offset + 1 + character] = EncodeRulerCharacter(text[character]);
                    }
                }
            }
        }
        return { start, spacing, count };
    } else {
        return { start: 0, spacing: 1000000000, count: 0 };
    }
};

export { FillRulerLabels, FormatRulerNumber, RULER_LABEL_CAPACITY, RULER_LABEL_STRIDE };
export type { RulerTickLayout };
