/**
 * 校验曲线细分精度，限制单条圆弧的最大顶点数。
 * @param value 每条圆弧的精度，或文字曲线的误差倍率
 * @example const precision = CheckPrecision(16);
 * @returns 1 至 4095 之间的整数，非法输入抛出 RangeError。
 */
const CheckPrecision = (value: number): number => {
    // 保留 Uint16 矩形边框索引的安全余量，并拒绝无法结束的细分输入。
    if (Number.isInteger(value) && value >= 1 && value <= 4095) {
        return value;
    } else {
        throw new RangeError("precision must be an integer in [1, 4095].");
    }
};

export { CheckPrecision };
