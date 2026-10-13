import type Camera from "../Camera";
import type { Geometry2d } from "../global-types";
import type { MeshLike } from "../Mesh";
import type Scene from "../Scene";

/** 每个 Render 保存自己的相机快照及防抖定时器。 */
class PrecisionManager {
    private readonly _states = new Map<Scene, PrecisionState>();

    /** @param scene 本次场景 @param camera 本次相机 @param delay 防抖毫秒，0 表示立即 @param redraw 延迟完成后的渲染入口 @example manager.update(scene, camera, 100, redraw); @returns 无返回值。 */
    public update(scene: Scene, camera: Camera, delay: number, redraw: PrecisionRedraw): void {
        let state = this._states.get(scene);
        // 场景第一次进入此 Render 时建立独立防抖状态。
        if (state === undefined) {
            state = { stamp: "", entries: new Map(), timer: null };
            this._states.set(scene, state);
        }
        const stamp = CameraStamp(camera);
        const entries = PrecisionEntries(scene);
        const changed = state.stamp !== stamp || !SameEntries(state.entries, entries);
        // 连续拖动相机只延后精度更新；视口筛选仍然每帧及时执行。
        if (changed || (delay === 0 && state.timer !== null)) {
            // 新的相机变化覆盖未执行任务，连续操作只处理最后状态。
            if (state.timer !== null) {
                window.clearTimeout(state.timer);
                state.timer = null;
            }
            state.stamp = stamp;
            state.entries = entries;
            // 没有启用自动细分的曲线时不安排任何重建任务。
            if (entries.size > 0) {
                // 零延迟在本次准备阶段更新，保证首次 DrawCall 使用新精度。
                if (delay === 0) {
                    this.apply(scene, camera, state);
                } else {
                    /** @example ApplyPendingPrecision(); @returns 无返回值，处理最近一次相机与几何状态。 */
                    const ApplyPendingPrecision = (): void => {
                        state.timer = null;
                        // 节点可能已删除或替换几何，重新收集后再处理。
                        this.apply(scene, camera, state);
                        redraw(scene, camera);
                    };
                    state.timer = window.setTimeout(ApplyPendingPrecision, delay);
                }
            }
        }
    }

    /** @param scene 场景 @param camera 当前相机 @param state 本 Render 的缓存 @example this.apply(scene, camera, state); @returns 无返回值。 */
    private apply(scene: Scene, camera: Camera, state: PrecisionState): void {
        const entries = PrecisionEntries(scene);
        // 一个 IMesh 只处理一次模板；Base 与 NGon 的形状定义不受细分精度影响。
        for (const [mesh] of entries) {
            const geometry = mesh.preparePrecisionGeometry();
            // 几何仍存在时才细分，已删除或资源清空的 Mesh 不参与。
            if (geometry !== undefined) {
                let zoom = 1;
                // 固定屏幕大小保持基准，普通几何按有效相机 zoom 放大精度。
                if (!mesh.ignoreZoom && camera.zoom > 0 && Number.isFinite(camera.zoom)) {
                    zoom = camera.zoom;
                }
                const precision = Math.min(mesh.precisionMax, Math.max(3, Math.ceil(geometry.originPrecision * zoom)));
                geometry.setRenderPrecision(precision);
            }
        }
        state.entries = PrecisionEntries(scene);
        state.stamp = CameraStamp(camera);
    }

    /** @example manager.destroy(); @returns 无返回值，清理全部延迟任务与场景引用。 */
    public destroy(): void {
        // 渲染器销毁时清理每个场景的延迟任务。
        for (const state of this._states.values()) {
            // 未执行任务要先取消，禁止销毁后生成 GPU 资源。
            if (state.timer !== null) {
                window.clearTimeout(state.timer);
            }
        }
        this._states.clear();
    }
}

type PrecisionRedraw = (scene: Scene, camera: Camera) => void;

interface PrecisionEntry {
    geometry: Geometry2d;
    origin: number;
    ignoreZoom: boolean;
    maximum: number;
}

interface PrecisionState {
    stamp: string;
    entries: Map<MeshLike, PrecisionEntry>;
    timer: number | null;
}

/** @param scene 当前场景 @example PrecisionEntries(scene); @returns 自动细分的曲线对象及其基准快照。 */
const PrecisionEntries = (scene: Scene): Map<MeshLike, PrecisionEntry> => {
    const entries = new Map<MeshLike, PrecisionEntry>();
    // 按完整场景列表收集，屏幕外曲线也保留正确的用户基准。
    for (const mesh of scene.ensureLists()) {
        const geometry = mesh.data;
        // 只细分曲线，正多边形边数和直接输入顶点不能随 zoom 变化。
        if (mesh.autoPrecision && geometry !== undefined && ["Rect2D", "Poly2D", "Text"].includes(geometry.type)) {
            entries.set(mesh, { geometry, origin: geometry.originPrecision, ignoreZoom: mesh.ignoreZoom,
                maximum: mesh.precisionMax });
        }
    }
    return entries;
};

/** @param camera 当前相机 @example CameraStamp(camera); @returns 输入、父级和显式矩阵变化的快照。 */
const CameraStamp = (camera: Camera): string => {
    camera.ensureCameraMatrix();
    return [camera.id, camera.version, camera.zoomVersion, camera.viewMatrix.version,
        camera.orthogonalMatrix.version].join("/");
};

/** @param previous 旧精度状态 @param next 新精度状态 @example SameEntries(a, b); @returns 开关、几何身份与基准是否一致。 */
const SameEntries = (previous: ReadonlyMap<MeshLike, PrecisionEntry>, next: ReadonlyMap<MeshLike, PrecisionEntry>): boolean => {
    let same = previous.size === next.size;
    // 数量不同已经说明开关或场景实体发生变化。
    if (same) {
        // 逐项比较生成资源与基准，忽略 order 和选择颜色变化。
        for (const [mesh, entry] of next) {
            const old = previous.get(mesh);
            // 资源替换、用户新精度或固定尺寸切换都需要重新计算。
            if (old?.geometry !== entry.geometry || old.origin !== entry.origin ||
                old.ignoreZoom !== entry.ignoreZoom || old.maximum !== entry.maximum) {
                same = false;
            }
        }
    }
    return same;
};

export default PrecisionManager;
