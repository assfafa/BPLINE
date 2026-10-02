import { Vec2 } from "bpmatrixjs/Math";
import { ContainsTrianglePoint } from "bpmatrixjs/Utils";
import type Camera from "../Camera";
import IMesh from "../IMesh";
import Mesh from "../Mesh";
import type { MeshBoundingBox, MeshLike } from "../Mesh";
import type Render from "../Render";
import type Scene from "../Scene";
import type { SelectPoint, SelectBounds } from "./RectSelectTool/RectSelectGeometry";
import {
    ContainsSelectionTriangles,
    CreateSelectionArea,
    IntersectsSelectionTriangles,
} from "./SelectionAreaGeometry";
import { CreateFillTriangles, IsCanvasEvent } from "./SelectionGeometry";
import type { RectSelectionMode } from "./RectSelectTool";

/** 三种非矩形填充几何共享的点选与面积框选流程。 */
class AreaSelectTool {
    private readonly scene: Scene;
    private readonly render: Render;
    private readonly camera: Camera;
    private readonly geometryType: string;
    private readonly autoEnableBounding: boolean;

    /** 是否允许鼠标点选，默认开启。 */
    public picker: boolean = true;
    /** 是否允许面积框选，默认开启。 */
    public selector: boolean = true;
    /** all/left 全包，any/right 相交，默认全包。 */
    public selectionMode: RectSelectionMode = "all";

    /**
     * 配置特定几何类型，并可自动为其 Mesh 开启包围盒。
     * @param scene 待查询场景。
     * @param render 提供画布位置和尺寸的渲染器。
     * @param camera 将鼠标位置换算为世界坐标的相机。
     * @param geometryType 当前工具处理的几何类型。
     * @param autoEnableBounding 自动为候选 Mesh 开启包围盒。
     * @example
     * super(scene, render, camera, "Poly2D", true);
     * @returns 面积选择工具。
     */
    protected constructor(
        scene: Scene,
        render: Render,
        camera: Camera,
        geometryType: string,
        autoEnableBounding: boolean,
    ) {
        this.scene = scene;
        this.render = render;
        this.camera = camera;
        this.geometryType = geometryType;
        this.autoEnableBounding = autoEnableBounding;
        // 构造时打开现有候选；后续新增对象在查询时按需打开。
        if (autoEnableBounding) {
            // 仅遍历当前已登记的 Mesh，避免修改其他几何的版本。
            for (const mesh of scene.ensureLists()) {
                // 当前工具只负责一种几何类型。
                if (this.accepts(mesh)) {
                    mesh.bounding = true;
                }
            }
        }
    }

    /**
     * 检查绘制条目是否是本工具负责的普通 Mesh。
     * @param candidate 场景绘制条目。
     * @example
     * const accepted = this.accepts(candidate);
     * @returns 是否可由当前面积选择器处理。
     */
    private accepts(candidate: MeshLike): candidate is Mesh {
        return candidate instanceof Mesh && !(candidate instanceof IMesh) && candidate.data?.type === this.geometryType;
    }

    /**
     * 获取可用于粗筛的世界包围盒，必要时自动开启计算。
     * @param mesh 当前候选 Mesh。
     * @example
     * const bounds = this.getBounds(mesh);
     * @returns 当前边界；调用方关闭自动启用且 Mesh 未开启时为 null。
     */
    private getBounds(mesh: Mesh): MeshBoundingBox | null {
        // 合并选择器可先统一开启所有对象的包围盒，避免重复修改版本。
        if (this.autoEnableBounding && !mesh.bounding) {
            mesh.bounding = true;
        }
        return mesh.boundingBox;
    }

    /**
     * 找出鼠标下本类型的所有填充 Mesh，绘制顺序靠后的排在前面。
     * @param event 带 clientX/clientY 的鼠标事件。
     * @example
     * const selected = tool.SelectPicker(event);
     * @returns 命中的普通 Mesh 列表。
     */
    public SelectPicker(event: MouseEvent): Mesh[] {
        const matches: Mesh[] = [];
        // 指针在画布内并且点选开启时才查询世界位置。
        if (this.picker && IsCanvasEvent(event, this.render)) {
            const world = this.camera.windowToWorld(new Vec2(event.clientX, event.clientY), this.render);
            const drawList = this.scene.ensureLists();
            // 逆序遍历保留与 RectSelectTool 相同的层级优先级。
            for (let index = drawList.length - 1; index >= 0; index -= 1) {
                const mesh = drawList[index];
                // 其他几何类型及 IMesh 需要各自的选择工具。
                if (this.accepts(mesh)) {
                    const boundingBox = this.getBounds(mesh);
                    // 先利用世界轴向范围排除大部分非命中对象。
                    if (boundingBox !== null && this.containsPoint(boundingBox, world)) {
                        const triangles = CreateFillTriangles(mesh);
                        // 多个三角面命中同一个 Mesh 时只返回一次。
                        for (const triangle of triangles) {
                            // 任一实体三角面包含指针即可确认此 Mesh 命中。
                            if (ContainsTrianglePoint(triangle, world)) {
                                matches.push(mesh);
                                break;
                            }
                        }
                    }
                }
            }
        }
        return matches;
    }

    /**
     * 判断世界点是否位于候选 Mesh 的轴向包围盒内。
     * @param bounds 候选 Mesh 的局部和世界范围。
     * @param point 鼠标对应的世界位置。
     * @example
     * const possible = this.containsPoint(bounds, point);
     * @returns 是否通过粗筛。
     */
    private containsPoint(bounds: MeshBoundingBox, point: SelectPoint): boolean {
        const world = bounds.world;
        return point.x >= world.x && point.x <= world.x + world.width &&
            point.y >= world.y && point.y <= world.y + world.height;
    }

    /**
     * 判断候选包围盒是否可能与选择框相交。
     * @param bounds 候选 Mesh 的包围盒。
     * @param selection Rect2D、Poly2D 或 NGon2D 选择范围的世界边界。
     * @example
     * const possible = this.matchesBounds(bounds, selection);
     * @returns 是否通过粗筛。
     */
    private matchesBounds(bounds: MeshBoundingBox, selection: SelectBounds): boolean {
        const world = bounds.world;
        const minX = world.x;
        const minY = world.y;
        const maxX = minX + world.width;
        const maxY = minY + world.height;
        // 包围盒可能包含边框或点型顶点；全包判断也只在此检查相交，交给实体三角面做最终判断。
        return maxX >= selection.minX && minX <= selection.maxX &&
            maxY >= selection.minY && minY <= selection.maxY;
    }

    /**
     * 使用 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域查询本类型的 Mesh。
     * @param selectionMesh 可不在场景内的选择区域 Mesh。
     * @example
     * tool.selectionMode = "right";
     * const selected = tool.Selector(selectionMesh);
     * @returns 符合全包或相交模式的 Mesh；selector 关闭时为空。
     */
    public Selector(selectionMesh: Mesh): Mesh[] {
        const matches: Mesh[] = [];
        const selection = CreateSelectionArea(selectionMesh);
        // 退化或无效形状无法定义选择范围。
        if (this.selector && selection !== undefined) {
            const complete = this.selectionMode === "all" || this.selectionMode === "left";
            const drawList = this.scene.ensureLists();
            // 单次选择区域快照由所有候选共享，避免重复剖分。
            for (let index = drawList.length - 1; index >= 0; index -= 1) {
                const mesh = drawList[index];
                // 选择框自身和其他类型不参与本工具的结果。
                if (this.accepts(mesh) && mesh !== selectionMesh) {
                    const bounds = this.getBounds(mesh);
                    // 轴向包围盒只用于拒绝不可能命中的候选。
                    if (bounds !== null && this.matchesBounds(bounds, selection.bounds)) {
                        const triangles = CreateFillTriangles(mesh);
                        let selected = false;
                        // 凹形与带孔区域按填充三角面判断，矩形沿用精确圆角边界。
                        if (complete && triangles.length > 0) {
                            selected = ContainsSelectionTriangles(selection, triangles);
                        } else if (triangles.length > 0) {
                            // 相交模式只需一块候选实体面接触选择区域。
                            selected = IntersectsSelectionTriangles(selection, triangles);
                        }
                        // 一个 Mesh 即使有多个三角形相交也只加入一次。
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

export default AreaSelectTool;
