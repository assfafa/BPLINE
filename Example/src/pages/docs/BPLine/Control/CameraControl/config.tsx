import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "CameraControl",
    intro: {
        cn: "为 Camera 绑定鼠标与触控操作，支持拖动、缩放、双指旋转和惯性。",
        en: "Bind mouse and touch gestures to a Camera for dragging, zooming, two-finger rotation, and inertia.",
    },
    code: `import { Camera, CameraControl, Render } from "bplinejs";

const container = document.getElementById("stage");
if (container) {
    const render = new Render(container);
    await render.ready;
    const camera = new Camera(container.clientWidth, container.clientHeight);
    const control = new CameraControl(camera, render);
    control.drag = true;
    control.zoom = true;
    // Call control.update() in the animation loop.
}`,
    properties: [
        entry("is: boolean; drag: boolean; zoom: boolean", "控制器总开关，以及拖动和缩放开关。", "Master switch plus drag and zoom switches."),
        entry("rightDrag: boolean; rotate: boolean", "允许右键拖动与双指旋转。", "Allow right-button drag and two-finger rotation."),
        entry("inertia: boolean; damp: number", "启用惯性并设置每 100ms 保留的动量比例。", "Enable inertia and set the momentum retained per 100 ms."),
        entry("zoomRate: number", "鼠标滚轮缩放灵敏度。", "Mouse-wheel zoom sensitivity."),
    ],
    methods: [
        entry("new CameraControl(camera: Camera, render: Render)", "把控制器连接到相机和渲染容器。", "Connect the controller to a camera and render container."),
        entry("update(): void", "每帧更新手势惯性。", "Advance gesture inertia each frame."),
        entry("zoomUpdate(center: Vec2, rate: number): void", "以指定中心应用缩放倍率。", "Apply a zoom rate around the selected center."),
        entry("dispose(): void", "解绑事件监听并停止控制器。", "Remove listeners and stop the controller."),
    ],
};
