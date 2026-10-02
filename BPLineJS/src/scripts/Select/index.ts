import type Camera from "../Camera";
import IMesh from "../IMesh";
import Mesh from "../Mesh";
import type Render from "../Render";
import type Scene from "../Scene";
import BaseSelectTool from "./BaseSelectTool";
import LineSelectTool from "./LineSelectTool";
import type { LineSelection } from "./LineSelectTool";
import NGonSelectTool from "./NGonSelectTool";
import PointSelectTool from "./PointSelectTool";
import type { PointSelection } from "./PointSelectTool";
import PolySelectTool from "./PolySelectTool";
import RectSelectTool from "./RectSelectTool";
import type { RectSelectionMode } from "./RectSelectTool";

/** 六类点选结果；同一个 Mesh 可以同时出现于面、边和点结果中。 */
interface SelectResult {
    Rect2D: Mesh[];
    NGon: Mesh[];
    Poly2D: Mesh[];
    Base2D: Mesh[];
    Line: LineSelection[];
    Point: PointSelection[];
}

type SelectSortDirection = "asc" | "desc";

/** 统一管理面、边、点选择器及其包围盒、开关和结果排序。 */
class Select {
    /** 可单独创建的矩形选择器。 */
    public static readonly RectSelectTool = RectSelectTool;
    /** 可单独创建的正多边形选择器。 */
    public static readonly NGonSelectTool = NGonSelectTool;
    /** 可单独创建的多边形选择器。 */
    public static readonly PolySelectTool = PolySelectTool;
    /** 可单独创建的自定义顶点面选择器。 */
    public static readonly BaseSelectTool = BaseSelectTool;
    /** 可单独创建的边选择器。 */
    public static readonly LineSelectTool = LineSelectTool;
    /** 可单独创建的顶点选择器。 */
    public static readonly PointSelectTool = PointSelectTool;

    /** 结果保留创建时的场景绘制顺序，避免 Sort 需要额外传入 Scene。 */
    private static readonly resultDrawLists: WeakMap<SelectResult, readonly Mesh[]> =
        new WeakMap<SelectResult, readonly Mesh[]>();

    private readonly scene: Scene;
    public readonly rectSelectTool: RectSelectTool;
    public readonly ngonSelectTool: NGonSelectTool;
    public readonly polySelectTool: PolySelectTool;
    public readonly baseSelectTool: BaseSelectTool;
    public readonly lineSelectTool: LineSelectTool;
    public readonly pointSelectTool: PointSelectTool;

    private _rectPicker: boolean = true;
    private _rectSelector: boolean = true;
    private _ngonPicker: boolean = true;
    private _ngonSelector: boolean = true;
    private _polyPicker: boolean = true;
    private _polySelector: boolean = true;
    private _basePicker: boolean = true;
    private _baseSelector: boolean = true;
    private _linePicker: boolean = true;
    private _pointPicker: boolean = true;
    private _selectionMode: RectSelectionMode = "all";

    /**
     * 创建六个选择器，并集中为现有非矩形面 Mesh 开启包围盒。
     * @param scene 待查询场景。
     * @param render 提供 Canvas 位置和尺寸的渲染器。
     * @param camera 屏幕与世界坐标之间转换所用的相机。
     * @example
     * const select = new Select(scene, render, camera);
     * @returns 统一选择器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera) {
        this.scene = scene;
        this.rectSelectTool = new RectSelectTool(scene, render, camera);
        // 非矩形工具不分别打开包围盒；这一层统一处理现有和后续 Mesh。
        this.ngonSelectTool = new NGonSelectTool(scene, render, camera, false);
        this.polySelectTool = new PolySelectTool(scene, render, camera, false);
        this.baseSelectTool = new BaseSelectTool(scene, render, camera, false);
        this.lineSelectTool = new LineSelectTool(scene, render, camera);
        this.pointSelectTool = new PointSelectTool(scene, render, camera);
        this.enableBounding();
    }

    /**
     * 为三个使用轴向粗筛的面选择器开启包围盒，重复查询不重复修改版本。
     * @example
     * this.enableBounding();
     * @returns 无返回值。
     */
    private enableBounding(): void {
        // 每次统一入口查询前处理新加入场景的 Mesh，单个 Mesh 仅在关闭时被开启。
        for (const candidate of this.scene.ensureLists()) {
            // 实例网格由独立实例数据渲染，现有面积工具仅能处理普通 Mesh。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh)) {
                const geometryType = candidate.data?.type;
                // 只有三个非矩形面工具读取 Mesh.boundingBox。
                if (geometryType === "NGon2D" || geometryType === "Poly2D" || geometryType === "Base2D") {
                    // 开启过的候选不再修改版本，避免每次选择都触发资源更新。
                    if (!candidate.bounding) {
                        candidate.bounding = true;
                    }
                }
            }
        }
    }

    /**
     * 按几何类型分别返回鼠标下的面、边和顶点命中。
     * @param event 带 clientX/clientY 的鼠标事件。
     * @example
     * const hits = select.SelectPicker(event);
     * @returns 六组命中，其中边和点包含所属 Mesh 与局部编号。
     */
    public SelectPicker(event: MouseEvent): SelectResult {
        this.enableBounding();
        const result: SelectResult = {
            Rect2D: this.rectSelectTool.SelectPicker(event),
            NGon: this.ngonSelectTool.SelectPicker(event),
            Poly2D: this.polySelectTool.SelectPicker(event),
            Base2D: this.baseSelectTool.SelectPicker(event),
            Line: this.lineSelectTool.SelectPicker(event),
            Point: this.pointSelectTool.SelectPicker(event),
        };
        Select.resultDrawLists.set(result, this.getOrdinaryDrawList());
        return result;
    }

    /**
     * 以 Rect2D、Poly2D 或 NGon2D Mesh 的填充区域查询四类面；边和点组保持为空。
     * @param selectionMesh 作为选择范围的 Mesh，可以不在场景中。
     * @example
     * const hits = select.Selector(selectionMesh);
     * @returns 按几何类型分组的框选结果。
     */
    public Selector(selectionMesh: Mesh): SelectResult {
        this.enableBounding();
        const result: SelectResult = {
            Rect2D: this.rectSelectTool.Selector(selectionMesh),
            NGon: this.ngonSelectTool.Selector(selectionMesh),
            Poly2D: this.polySelectTool.Selector(selectionMesh),
            Base2D: this.baseSelectTool.Selector(selectionMesh),
            Line: [],
            Point: [],
        };
        Select.resultDrawLists.set(result, this.getOrdinaryDrawList());
        return result;
    }

    /**
     * 截取普通 Mesh 的当前顺序，供返回结果在后续改动场景后仍能稳定排序。
     * @example
     * const drawList = this.getOrdinaryDrawList();
     * @returns 从下到上的普通 Mesh 列表。
     */
    private getOrdinaryDrawList(): Mesh[] {
        const drawList: Mesh[] = [];
        // IMesh 内部实例需要独立身份；当前六种工具只处理普通 Mesh。
        for (const candidate of this.scene.ensureLists()) {
            // 快照不收录组节点或实例网格，否则索引与可返回的 Mesh 不一致。
            if (candidate instanceof Mesh && !(candidate instanceof IMesh)) {
                drawList.push(candidate);
            }
        }
        return drawList;
    }

    /**
     * 将各组结果合并为无重复 Mesh，并按实际深度层级与绘制顺序排序。
     * asc 为底层在前，desc 为顶层在前；关闭深度测试的覆盖层总在测试层之上。
     * @param result SelectPicker 或 Selector 的分组结果。
     * @param direction 排序方向，默认 desc。
     * @example
     * const topFirst = Select.Sort(select.SelectPicker(event), "desc");
     * @returns 去重后的普通 Mesh 列表。
     */
    public static Sort(result: SelectResult, direction: SelectSortDirection = "desc"): Mesh[] {
        const uniqueMeshes = new Set<Mesh>();
        // 同一对象的实体、边和顶点可能同时命中，最终只返回一个 Mesh。
        for (const mesh of result.Rect2D) {
            uniqueMeshes.add(mesh);
        }
        // 各类型独立返回，汇总时保留每一个实际命中的 Mesh。
        for (const mesh of result.NGon) {
            uniqueMeshes.add(mesh);
        }
        // 多边形命中可能和半径内的边、点命中重合。
        for (const mesh of result.Poly2D) {
            uniqueMeshes.add(mesh);
        }
        // 直接顶点构建的三角面也参与最终层级比较。
        for (const mesh of result.Base2D) {
            uniqueMeshes.add(mesh);
        }
        // 同一 Mesh 的多条边只应在总列表中占一个位置。
        for (const hit of result.Line) {
            uniqueMeshes.add(hit.mesh);
        }
        // 同一 Mesh 的多个顶点同样只应占一个位置。
        for (const hit of result.Point) {
            uniqueMeshes.add(hit.mesh);
        }
        const drawRanks = new Map<Mesh, number>();
        const drawList = Select.resultDrawLists.get(result);
        // Scene.drawList 已按 order 排好，相同 order 保留稳定的插入顺序。
        if (drawList !== undefined) {
            // 缓存每个对象在实际绘制列表中的位置，避免排序比较反复扫描。
            for (let index = 0; index < drawList.length; index += 1) {
                drawRanks.set(drawList[index], index);
            }
        }
        const meshes = Array.from(uniqueMeshes);
        /**
         * 比较绘制层级和层内顺序；透明绘制仍由既有深度规则决定遮挡。
         * @param left 比较时的左侧 Mesh。
         * @param right 比较时的右侧 Mesh。
         * @example
         * meshes.sort(CompareMeshes);
         * @returns 升序的层级差。
         */
        const CompareMeshes = (left: Mesh, right: Mesh): number => {
            let leftLayer = -1;
            let rightLayer = -1;
            // 有材质且关闭深度测试的 Mesh 在最后一个绘制阶段作为覆盖层。
            if (left.material !== undefined) {
                // 开启测试时深度值随 drawList 排名上升而靠前。
                if (left.material.depthTest) {
                    leftLayer = 0;
                } else {
                    leftLayer = 1;
                }
            }
            // 右侧对象必须使用同一阶段规则才能正确比较。
            if (right.material !== undefined) {
                // 最后绘制的未测试对象会覆盖已通过深度测试的内容。
                if (right.material.depthTest) {
                    rightLayer = 0;
                } else {
                    rightLayer = 1;
                }
            }
            let comparison = leftLayer - rightLayer;
            // 同一绘制阶段由场景顺序决定深度或混合覆盖关系。
            if (comparison === 0) {
                const leftRank = drawRanks.get(left);
                const rightRank = drawRanks.get(right);
                // 正常结果带快照；用户自行组装结果时退化为按 order 排序。
                if (leftRank !== undefined && rightRank !== undefined) {
                    comparison = leftRank - rightRank;
                } else {
                    comparison = left.order - right.order;
                }
            }
            // 用户选择从顶到底时翻转一次比较值，不改变命中数组。
            if (direction === "desc") {
                return -comparison;
            } else {
                return comparison;
            }
        };
        meshes.sort(CompareMeshes);
        return meshes;
    }

    /** @example select.rectPicker = false; @returns 当前矩形点选开关。 */
    public get rectPicker(): boolean {
        return this._rectPicker;
    }
    /** @param value 是否启用矩形点选。 @example select.rectPicker = false; @returns 无返回值。 */
    public set rectPicker(value: boolean) {
        this._rectPicker = value;
        this.rectSelectTool.picker = value;
    }

    /** @example select.rectSelector = false; @returns 当前矩形框选开关。 */
    public get rectSelector(): boolean {
        return this._rectSelector;
    }
    /** @param value 是否启用矩形框选。 @example select.rectSelector = false; @returns 无返回值。 */
    public set rectSelector(value: boolean) {
        this._rectSelector = value;
        this.rectSelectTool.selector = value;
    }

    /** @example select.ngonPicker = false; @returns 当前正多边形点选开关。 */
    public get ngonPicker(): boolean {
        return this._ngonPicker;
    }
    /** @param value 是否启用正多边形点选。 @example select.ngonPicker = false; @returns 无返回值。 */
    public set ngonPicker(value: boolean) {
        this._ngonPicker = value;
        this.ngonSelectTool.picker = value;
    }

    /** @example select.ngonSelector = false; @returns 当前正多边形框选开关。 */
    public get ngonSelector(): boolean {
        return this._ngonSelector;
    }
    /** @param value 是否启用正多边形框选。 @example select.ngonSelector = false; @returns 无返回值。 */
    public set ngonSelector(value: boolean) {
        this._ngonSelector = value;
        this.ngonSelectTool.selector = value;
    }

    /** @example select.polyPicker = false; @returns 当前多边形点选开关。 */
    public get polyPicker(): boolean {
        return this._polyPicker;
    }
    /** @param value 是否启用多边形点选。 @example select.polyPicker = false; @returns 无返回值。 */
    public set polyPicker(value: boolean) {
        this._polyPicker = value;
        this.polySelectTool.picker = value;
    }

    /** @example select.polySelector = false; @returns 当前多边形框选开关。 */
    public get polySelector(): boolean {
        return this._polySelector;
    }
    /** @param value 是否启用多边形框选。 @example select.polySelector = false; @returns 无返回值。 */
    public set polySelector(value: boolean) {
        this._polySelector = value;
        this.polySelectTool.selector = value;
    }

    /** @example select.basePicker = false; @returns 当前自定义面点选开关。 */
    public get basePicker(): boolean {
        return this._basePicker;
    }
    /** @param value 是否启用自定义面点选。 @example select.basePicker = false; @returns 无返回值。 */
    public set basePicker(value: boolean) {
        this._basePicker = value;
        this.baseSelectTool.picker = value;
    }

    /** @example select.baseSelector = false; @returns 当前自定义面框选开关。 */
    public get baseSelector(): boolean {
        return this._baseSelector;
    }
    /** @param value 是否启用自定义面框选。 @example select.baseSelector = false; @returns 无返回值。 */
    public set baseSelector(value: boolean) {
        this._baseSelector = value;
        this.baseSelectTool.selector = value;
    }

    /** @example select.linePicker = false; @returns 当前边点选开关。 */
    public get linePicker(): boolean {
        return this._linePicker;
    }
    /** @param value 是否启用边点选。 @example select.linePicker = false; @returns 无返回值。 */
    public set linePicker(value: boolean) {
        this._linePicker = value;
        this.lineSelectTool.picker = value;
    }

    /** @example select.pointPicker = false; @returns 当前顶点点选开关。 */
    public get pointPicker(): boolean {
        return this._pointPicker;
    }
    /** @param value 是否启用顶点点选。 @example select.pointPicker = false; @returns 无返回值。 */
    public set pointPicker(value: boolean) {
        this._pointPicker = value;
        this.pointSelectTool.picker = value;
    }

    /** @example select.selectionMode = "right"; @returns 所有面框选工具共用的模式。 */
    public get selectionMode(): RectSelectionMode {
        return this._selectionMode;
    }
    /** @param value all/left 为全包，any/right 为相交。 @example select.selectionMode = "right"; @returns 无返回值。 */
    public set selectionMode(value: RectSelectionMode) {
        this._selectionMode = value;
        this.rectSelectTool.selectionMode = value;
        this.ngonSelectTool.selectionMode = value;
        this.polySelectTool.selectionMode = value;
        this.baseSelectTool.selectionMode = value;
    }
}

export default Select;
export type { SelectResult, SelectSortDirection, RectSelectionMode, LineSelection, PointSelection };
