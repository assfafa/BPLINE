interface InnerSize {
    width: number;
    height: number;
    dpr: number;
}
interface CanvasCoord {
    dprx: number;
    dpry: number;
    x: number;
    y: number;
}
/**
 * 获取当前设备像素比
 * 服务端或无窗口环境下默认返回 1
 * @example
 * GetDevicePixelRatio();
 * @returns 设备像素比
 */
const GetDevicePixelRatio = (): number => {
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (typeof window === "undefined") {
        return 1;
    } else {
        return window.devicePixelRatio || 1;
    }
};
/**
 * 获取当前窗口实际像素尺寸
 * 宽高会乘以设备像素比
 * @example
 * GetInner();
 * @returns 当前窗口尺寸信息
 */
const GetInner = (): Readonly<InnerSize> => {
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (typeof window === "undefined") {
        return Object.freeze({
            width: 0,
            height: 0,
            dpr: 1,
        });
    } else {
        const dpr = GetDevicePixelRatio();
        return Object.freeze({
            width: Math.round(window.innerWidth * dpr),
            height: Math.round(window.innerHeight * dpr),
            dpr,
        });
    }
};
/**
 * 将屏幕坐标转换为画布像素坐标
 * 默认会按当前设备像素比进行换算
 * @param x 屏幕 X 坐标
 * @param y 屏幕 Y 坐标
 * @param dpr 设备像素比
 * @example
 * ConvertEventToCanvasCoord(x, y, dpr);
 * @returns 转换后的画布坐标
 */
const ConvertEventToCanvasCoord = (
    x: number,
    y: number,
    dpr: number = GetDevicePixelRatio(),
): CanvasCoord => {
    const coordX = Math.round(x * dpr);
    const coordY = Math.round(y * dpr);
    return {
        dprx: coordX,
        dpry: coordY,
        x: coordX,
        y: coordY,
    };
};
export { ConvertEventToCanvasCoord, GetDevicePixelRatio, GetInner };
export type { CanvasCoord, InnerSize };
