import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../Camera";
import type Render from "../Render";

/**
 * 计算当前 HelperGrid 使用的世界坐标细格间距。
 * @param camera 当前相机
 * @param render 当前渲染器
 * @example const step = ComputeMinorGridStep(camera, render);
 * @returns 有效视口的细格间距；无效时为零。
 */
const ComputeMinorGridStep = (camera: Camera, render: Render): number => {
    camera.ensureWorldMatrix();
    const width = render.canvas.width;
    const height = render.canvas.height;
    const zoom = camera.zoom;
    // 画布尚未布局时不能从像素密度推导有效网格。
    if (width > 0 && height > 0 && zoom > 0) {
        const world = camera.worldMatrix.data;
        const pixelScaleX = camera.width / (width * zoom);
        const pixelScaleY = camera.height / (height * zoom);
        const basisX = new Vec2(world[0] * pixelScaleX, world[1] * pixelScaleX);
        const basisY = new Vec2(-world[3] * pixelScaleY, -world[4] * pixelScaleY);
        const worldPerPixel = Math.max(Math.hypot(basisX.x, basisX.y), Math.hypot(basisY.x, basisY.y));
        return Math.pow(10, Math.floor(Math.log10(worldPerPixel * 48 * render.dpr)));
    } else {
        return 0;
    }
};

export { ComputeMinorGridStep };
