import type Camera from "../../Camera";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import { CreateSelectableVertices, IsCanvasEvent, ProjectPoint } from "../SelectionGeometry";
import type { SelectPoint } from "../RectSelectTool/RectSelectGeometry";

/** 单个模型顶点的命中结果，距离以画布 CSS 像素计。 */
interface PointSelection {
    readonly mesh: Mesh;
    readonly vertexIndex: number;
    readonly contourIndex: number;
    readonly position: SelectPoint;
    readonly distance: number;
}

/** 普通 Mesh 原始关键顶点的屏幕半径点选工具。 */
class PointSelectTool {
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
     * @param camera 将世界顶点投影到屏幕的相机。
     * @param radius CSS 像素误差半径，默认 8。
     * @example
     * const select = new PointSelectTool(scene, render, camera, 8);
     * @returns 顶点选择器。
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
            throw new RangeError("PointSelectTool radius must be finite and nonnegative.");
        }
    }

    /**
     * 查询指针半径内的关键顶点，靠上的 Mesh 排在前面。
     * @param event 浏览器鼠标事件，使用 clientX/clientY。
     * @example
     * const vertices = select.SelectPicker(event);
     * @returns 命中的 Mesh、顶点编号、世界位置与像素距离。
     */
    public SelectPicker(event: MouseEvent): PointSelection[] {
        const matches: PointSelection[] = [];
        // 画布外事件和关闭的选择器不遍历模型顶点。
        if (this.picker && IsCanvasEvent(event, this.render)) {
            const point = { x: event.clientX, y: event.clientY };
            const radiusSquared = this._radius * this._radius;
            const drawList = this.scene.ensureLists();
            // 上层 Mesh 优先；同一 Mesh 的各关键点分别返回。
            for (let index = drawList.length - 1; index >= 0; index -= 1) {
                const mesh = drawList[index];
                // IMesh 需要额外的实例身份，本工具只处理普通 Mesh。
                if (mesh instanceof Mesh && !(mesh instanceof IMesh)) {
                    const vertices = CreateSelectableVertices(mesh);
                    // 先变换到屏幕，误差半径始终用 CSS 像素表示。
                    for (const vertex of vertices) {
                        const projected = ProjectPoint(vertex.position, this.camera, this.render);
                        const dx = point.x - projected.x;
                        const dy = point.y - projected.y;
                        const distanceSquared = dx * dx + dy * dy;
                        // 只返回屏幕误差半径内的原始顶点。
                        if (distanceSquared <= radiusSquared) {
                            matches.push({
                                mesh,
                                vertexIndex: vertex.index,
                                contourIndex: vertex.contourIndex,
                                position: vertex.position,
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

export default PointSelectTool;
export type { PointSelection };
