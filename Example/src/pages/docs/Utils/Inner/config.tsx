import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Inner",
    intro: {
        cn: "读取设备像素比和窗口像素尺寸，并把屏幕坐标转换为画布像素坐标。函数都从 bpmatrixjs/Utils 导入。",
        en: "Read device pixel ratio and viewport pixels, or convert screen coordinates to canvas pixels. Import all functions from bpmatrixjs/Utils.",
    },
    code: `import {
    ConvertEventToCanvasCoord,
    GetDevicePixelRatio,
    GetInner,
} from "bpmatrixjs/Utils";

const dpr = GetDevicePixelRatio();
const { width, height } = GetInner();
const point = ConvertEventToCanvasCoord(20, 30, dpr);`,
    methods: [
        entry("GetDevicePixelRatio(): number", "返回当前设备像素比；无 window 时返回 1。", "Return the device pixel ratio, or 1 without window."),
        entry("GetInner(): Readonly<InnerSize>", "返回乘以像素比后的窗口宽高，以及 dpr。", "Return viewport width and height in device pixels, plus dpr."),
        entry("ConvertEventToCanvasCoord(x: number, y: number, dpr?: number): CanvasCoord", "把屏幕坐标按像素比换算并四舍五入为画布像素。", "Scale and round screen coordinates to canvas pixels."),
    ],
};
