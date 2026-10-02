import { SegmentDistanceSquared } from "bpmatrixjs/Utils";
import type Camera from "../../Camera";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import {
    CreateSelectableEdges,
    IsCanvasEvent,
    ProjectPoint,
} from "../SelectionGeometry";
import type { SelectPoint } from "../RectSelectTool/RectSelectGeometry";

/** 单条模型边的命中结果，距离以画布 CSS 像素计。 */
interface LineSelection {
    readonly mesh: Mesh;
    readonly edgeIndex: number;
    readonly contourIndex: number;
    readonly start: SelectPoint;
    readonly end: SelectPoint;
    readonly distance: number;
}

/** 普通 Mesh 轮廓边的屏幕半径点选工具。 */
class LineSelectTool {
    private readonly scene: Scene;
    private readonly render: Render;
    private readonly camera: Camera;
    private _radius: number;

    /** 是否允许 SelectPicker 点选，默认开启。 */
    public picker: boolean = true;

    /**
     * 绑定场景、渲染器和相机。
     * @param scene 待查询场景。
     * @param render 提供画布位置的渲染器。
     * @param camera 将世界边投影到屏幕的相机。
     * @param radius CSS 像素误差半径，默认 8。
     * @example
     * const select = new LineSelectTool(scene, render, camera, 8);
     * @returns 线段选择器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera, radius: number = 8) {
        this.scene = scene;
        this.render = render;
        this.camera = camera;
        this._radius = 8;
        this.radius = radius;
    }

    /**
     * 当前屏幕 CSS 像素误差半径。
     * @example
     * const pixels = select.radius;
     * @returns 非负 CSS 像素数。
     */
    public get radius(): number {
        return this._radius;
    }

    /**
     * 修改屏幕 CSS 像素误差半径。
     * @param value 有限非负像素数。
     * @example
     * select.radius = 12;
     * @returns 无返回值。
     */
    public set radius(value: number) {
        // 无效半径会让所有距离比较失去意义。
        if (Number.isFinite(value) && value >= 0) {
            this._radius = value;
        } else {
            throw new RangeError("LineSelectTool radius must be finite and nonnegative.");
        }
    }

    /**
     * 查询指针半径内的模型边，靠上的 Mesh 排在前面。
     * @param event 浏览器鼠标事件，使用 clientX/clientY。
     * @example
     * const edges = select.SelectPicker(event);
     * @returns 命中的 Mesh、边编号、世界端点与像素距离。
     */
    public SelectPicker(event: MouseEvent): LineSelection[] {
        const matches: LineSelection[] = [];
        // 画布外事件和关闭的选择器不遍历模型边。
        if (this.picker && IsCanvasEvent(event, this.render)) {
            const point = { x: event.clientX, y: event.clientY };
            const radiusSquared = this._radius * this._radius;
            const drawList = this.scene.ensureLists();
            // 上层 Mesh 优先；每条真实轮廓边单独给出编号。
            for (let index = drawList.length - 1; index >= 0; index -= 1) {
                const mesh = drawList[index];
                // IMesh 需要额外的实例身份，本工具只处理普通 Mesh。
                if (mesh instanceof Mesh && !(mesh instanceof IMesh)) {
                    const edges = CreateSelectableEdges(mesh);
                    // 距离在最终屏幕坐标计算，相机缩放和旋转不改变像素半径。
                    for (const edge of edges) {
                        const start = ProjectPoint(edge.start, this.camera, this.render);
                        const end = ProjectPoint(edge.end, this.camera, this.render);
                        const distanceSquared = SegmentDistanceSquared(point, start, end);
                        // 线段最近点在像素误差半径内才返回该边。
                        if (distanceSquared <= radiusSquared) {
                            matches.push({
                                mesh,
                                edgeIndex: edge.index,
                                contourIndex: edge.contourIndex,
                                start: edge.start,
                                end: edge.end,
                                distance: Math.sqrt(distanceSquared),
                            });
                        }
                    }
                }
            }
        }
        return matches;
    }
}

export default LineSelectTool;
export type { LineSelection };
