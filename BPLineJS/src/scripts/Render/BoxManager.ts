import type Camera from "../Camera";
import type Scene from "../Scene";

/** 合并连续相机变化的 box 查询；等待期间保守绘制，避免新进入视口的实体被旧结果裁掉。 */
class BoxManager {
    private readonly _states = new Map<Scene, BoxState>();

    /** @param scene 当前场景 @param delay 防抖毫秒 @param redraw 查询完成后的重绘入口 @example manager.update(scene, 100, redraw); @returns 无返回值。 */
    public update(scene: Scene, delay: number, redraw: BoxRedraw): void {
        const camera = scene.box;
        const previous = this._states.get(scene);
        // quad 与关闭筛选不受 box 防抖控制，也不能保留旧相机任务。
        if (camera === null) {
            this.cancel(previous);
            this._states.delete(scene);
            scene.updateSpatialLists();
        } else {
            camera.ensureCameraMatrix();
            const stamp = [camera.version, camera.zoomVersion, camera.viewMatrix.version,
                camera.orthogonalMatrix.version].join("/");
            // 首次启用或更换筛选相机立即查询，避免第一帧使用空结果。
            if (previous?.camera !== camera) {
                this.cancel(previous);
                this._states.set(scene, { camera, stamp, delay, timer: null });
                scene.updateSpatialLists(true);
            } else {
                const changed = previous.stamp !== stamp;
                const delayChanged = previous.delay !== delay;
                previous.stamp = stamp;
                previous.delay = delay;
                // 连续相机操作只保留最后一次定时器，零延迟立即恢复逐帧查询。
                if (delay === 0) {
                    this.cancel(previous);
                    scene.updateSpatialLists();
                } else if (changed || (delayChanged && previous.timer !== null)) {
                    // 新输入或延迟配置变化需要重排最后一次查询。
                    this.cancel(previous);
                    /** @example ApplyBox(); @returns 无返回值，仅刷新仍使用此相机的场景。 */
                    const ApplyBox = (): void => {
                        previous.timer = null;
                        // 切换 box/quad 后不允许旧回调重新启用过期的筛选。
                        if (scene.box === camera) {
                            scene.updateSpatialLists(true);
                            redraw(scene);
                        }
                    };
                    previous.timer = window.setTimeout(ApplyBox, delay);
                    scene.boxDrawList = scene.ensureLists();
                } else if (previous.timer !== null) {
                    // 等待时使用最新有序列表，新增/删除/排序不会被旧裁剪结果掩盖。
                    scene.boxDrawList = scene.ensureLists();
                } else {
                    // 静止相机下仍及时响应实体变换、样式、添加和删除。
                    scene.updateSpatialLists();
                }
            }
        }
    }

    /** @param state 待取消状态 @example this.cancel(state); @returns 无返回值，清除待执行回调。 */
    private cancel(state: BoxState | undefined): void {
        // 状态可尚未创建，重复销毁或关闭开关不应产生副作用。
        if (state !== undefined && state.timer !== null) {
            window.clearTimeout(state.timer);
            state.timer = null;
        }
    }

    /** @example manager.destroy(); @returns 无返回值，释放全部计时器与场景引用。 */
    public destroy(): void {
        // 销毁 Render 后不能由计时器重新创建资源。
        for (const state of this._states.values()) {
            this.cancel(state);
        }
        this._states.clear();
    }
}

interface BoxState {
    camera: Camera;
    stamp: string;
    delay: number;
    timer: number | null;
}

type BoxRedraw = (scene: Scene) => void;

export default BoxManager;
