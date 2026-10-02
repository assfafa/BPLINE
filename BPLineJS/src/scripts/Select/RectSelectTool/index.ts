import { Vec2 } from "bpmatrixjs/Math";
import type Camera from "../../Camera";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import {
    ContainsFootprint,
    ContainsWorldPoint,
    CreateRectFootprint,
    IntersectsFootprints,
} from "./RectSelectGeometry";
import type { RectFootprint } from "./RectSelectGeometry";
import {
    ContainsSelectionTriangles,
    CreateSelectionArea,
    IntersectsSelectionTriangles,
    RectFootprintTriangles,
} from "../SelectionAreaGeometry";

/**
 * all / left 要求完整包围；any / right 允许任意相交。
 * left 表示从左向右拖框，right 表示从右向左拖框。
 * 拖动方向由调用方设置，Selector 不追踪鼠标拖动。
 */
type RectSelectionMode = "all" | "left" | "right" | "any";

/** 场景中的普通 Rect2D Mesh 点选与框选工具。 */
class RectSelectTool {
    private readonly scene: Scene;
    private readonly render: Render;
    private readonly camera: Camera;

    /** 是否允许 SelectPicker 点选，默认开启。 */
    public picker: boolean = true;

    /** 是否允许 Selector 框选，默认开启。 */
    public selector: boolean = true;

    /** 框选模式，默认要求被完整包围。 */
    public selectionMode: RectSelectionMode = "all";

    /**
     * 绑定选择工具使用的场景、画布和相机。
     * @param scene 要查询的场景。
     * @param render 提供 Canvas 位置与尺寸的渲染器。
     * @param camera 将浏览器窗口坐标换算到场景世界坐标的相机。
     * @example
     * const select = new RectSelectTool(scene, render, camera);
     * @returns Rect2D 选择工具。
     */
    public constructor(scene: Scene, render: Render, camera: Camera) {
        this.scene = scene;
        this.render = render;
        this.camera = camera;
    }

    /**
     * 查找鼠标事件位置下的所有普通 Rect2D Mesh，drawList 靠后的排在前面。
     * 可由 window 的 mousedown、click 或 dblclick 事件处理器直接调用。
     * @param event 带 clientX/clientY 的鼠标事件。
     * @example
     * window.addEventListener("click", (event) => console.log(select.SelectPicker(event)));
     * @returns 命中的 Rect2D Mesh 列表；事件在画布外或 picker 关闭时为空。
     */
    public SelectPicker(event: MouseEvent): Mesh[] {
        const matches: Mesh[] = [];
        // 点选开关只控制点选，便于编辑器拖框期间暂停单击选择。
        if (this.picker) {
            const canvasBounds = this.render.canvas.getBoundingClientRect();
            // window 事件也会来自侧栏，必须限定到实际画布范围。
            if (
                canvasBounds.width > 0 &&
                canvasBounds.height > 0 &&
                event.clientX >= canvasBounds.left &&
                event.clientX <= canvasBounds.right &&
                event.clientY >= canvasBounds.top &&
                event.clientY <= canvasBounds.bottom
            ) {
                const windowPoint = new Vec2(event.clientX, event.clientY);
                const worldPoint = this.camera.windowToWorld(windowPoint, this.render);
                const drawList = this.scene.ensureLists();
                // 绘制列表顺序由低到高；逆向查询让上层对象优先返回。
                for (let index = drawList.length - 1; index >= 0; index -= 1) {
                    const mesh = drawList[index];
                    // IMesh 的单个实例不等于模板 Mesh，留给实例选择工具处理。
                    if (mesh instanceof Mesh && !(mesh instanceof IMesh)) {
                        const footprint = CreateRectFootprint(mesh);
                        // 只有实际 Rect2D 的填充轮廓会参与命中。
                        if (footprint !== undefined && ContainsWorldPoint(footprint, worldPoint)) {
                            matches.push(mesh);
                        }
                    }
                }
            }
        }
        return matches;
    }

    /**
     * 用 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域框选普通 Rect2D Mesh。
     * left/all 为完全包围，right/any 为任意相交；结果按 drawList 逆序排列。
     * @param selectionMesh 作为选择范围的 Mesh，可以不在 Scene 内。
     * @example
     * select.selectionMode = "right";
     * const selected = select.Selector(selectionMesh);
     * @returns 被框选的 Rect2D Mesh 列表；selector 关闭时为空，不包括选择框自身。
     */
    public Selector(selectionMesh: Mesh): Mesh[] {
        const selection = CreateSelectionArea(selectionMesh);
        const matches: Mesh[] = [];
        // 无效或退化的选择框没有可用的二维范围。
        if (this.selector && selection !== undefined) {
            const complete = this.selectionMode === "all" || this.selectionMode === "left";
            const drawList = this.scene.ensureLists();
            // 与点选保持相同的绘制列表逆序结果。
            for (let index = drawList.length - 1; index >= 0; index -= 1) {
                const mesh = drawList[index];
                // 排除选择框自身以及需要逐实例计算的 IMesh。
                if (mesh instanceof Mesh && !(mesh instanceof IMesh) && mesh !== selectionMesh) {
                    const candidate: RectFootprint | undefined = CreateRectFootprint(mesh);
                    // 候选圆角矩形先按世界轴向包围盒排除远处对象。
                    if (candidate !== undefined) {
                        let selected: boolean;
                        const overlapsBounds = candidate.bounds.maxX >= selection.bounds.minX &&
                            candidate.bounds.minX <= selection.bounds.maxX &&
                            candidate.bounds.maxY >= selection.bounds.minY &&
                            candidate.bounds.minY <= selection.bounds.maxY;
                        // 矩形之间沿用解析圆角判定，其他框形使用填充三角面。
                        if (overlapsBounds && selection.rectangle !== undefined && complete) {
                            selected = ContainsFootprint(selection.rectangle, candidate);
                        } else if (overlapsBounds && selection.rectangle !== undefined) {
                            // 矩形相交沿用粗筛和圆角凸轮廓的专用路径。
                            selected = IntersectsFootprints(selection.rectangle, candidate);
                        } else if (overlapsBounds && complete) {
                            // 非矩形全包根据候选圆角轮廓的填充面积判断。
                            selected = ContainsSelectionTriangles(selection, RectFootprintTriangles(candidate));
                        } else if (overlapsBounds) {
                            // 凹形和带孔选择区域对候选实体面逐块求交。
                            selected = IntersectsSelectionTriangles(selection, RectFootprintTriangles(candidate));
                        } else {
                            selected = false;
                        }
                        // 只返回真正通过当前选择模式的对象。
                        if (selected) {
                            matches.push(mesh);
                        }
                    }
                }
            }
        }
        return matches;
    }
}

export default RectSelectTool;
export type { RectSelectionMode };
