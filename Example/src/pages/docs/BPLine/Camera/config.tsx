import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Camera",
    intro: {
        cn: "二维正交相机，控制视口尺寸、缩放和坐标转换；继承 ObjectNode 的 position、rotation 与 scale。",
        en: "A 2D orthographic camera with viewport, zoom, and coordinate conversions. It inherits position, rotation, and scale from ObjectNode.",
    },
    code: `import { Camera } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const camera = new Camera(800, 600, 1);
camera.position.set(40, 20);
const screen = camera.worldToScreen(new Vec2(100, 50));`,
    properties: [
        entry("width: number; height: number", "视口逻辑宽高。", "Logical viewport width and height."),
        entry("zoom: number", "正交相机缩放倍率。", "Orthographic zoom factor."),
        entry("top / bottom / left / right: number", "当前正交视野边界。", "Current orthographic view bounds."),
    ],
    methods: [
        entry("new Camera(width?: number, height?: number, zoom?: number)", "创建正交相机。", "Create an orthographic camera."),
        entry("setViewport(width?: number, height?: number): void", "更新视口尺寸。", "Update viewport dimensions."),
        entry("worldToNdc(position: Vec2): Vec2", "世界坐标转归一化设备坐标。", "Convert world coordinates to normalized device coordinates."),
        entry("ndcToWorld(position: Vec2): Vec2", "归一化设备坐标转世界坐标。", "Convert normalized device coordinates to world coordinates."),
        entry("worldToScreen(position: Vec2, render?: Render): Vec2", "世界坐标转屏幕坐标。", "Convert world coordinates to screen coordinates."),
        entry("screenToWorld(position: Vec2, render?: Render): Vec2", "屏幕坐标转世界坐标。", "Convert screen coordinates to world coordinates."),
        entry("screenToNdc(position: Vec2, render?: Render): Vec2", "屏幕坐标转归一化设备坐标。", "Convert screen coordinates to normalized device coordinates."),
        entry("ndcToScreen(position: Vec2, render?: Render): Vec2", "归一化设备坐标转屏幕坐标。", "Convert normalized device coordinates to screen coordinates."),
        entry("worldToWindow(position: Vec2, render: Render): Vec2", "世界坐标转浏览器窗口坐标。", "Convert world coordinates to browser window coordinates."),
        entry("windowToWorld(position: Vec2, render: Render): Vec2", "浏览器窗口坐标转世界坐标。", "Convert browser window coordinates to world coordinates."),
        entry("dispose(): void", "释放相机订阅关系。", "Release camera subscriptions."),
    ],
};
