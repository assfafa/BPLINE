import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Select",
    intro: {
        cn: "统一查询普通 Mesh 的实体面、轮廓边和关键顶点，并按当前绘制层级整理结果。",
        en: "Query faces, contour edges, and key vertices on ordinary Mesh objects, then sort matches by draw order.",
    },
    detail: {
        cn: "SelectPicker 使用鼠标事件的 clientX/clientY；Selector 接收可不在场景中的 Rect2D、Poly2D 或 NGon2D Mesh 作为选择区域。left/right 的拖框方向由调用方设置；选择器本身不跟踪拖动。当前不处理 IMesh 实例。",
        en: "SelectPicker uses clientX/clientY from a mouse event. Selector accepts a Rect2D, Poly2D, or NGon2D Mesh as the selection area, even outside the scene. Set left/right mode from your drag direction; Select does not track dragging. IMesh instances are not handled.",
    },
    code: `import { BaseMaterial, Mesh, Rect2D, Select } from "bplinejs";

const select = new Select(scene, render, camera);
const clicked = select.SelectPicker(mouseEvent);

const area = new Mesh(
    new Rect2D({ width: 300, height: 180 }),
    new BaseMaterial(),
    false,
);
select.selectionMode = "right";
const grouped = select.Selector(area);
const topFirst = Select.Sort(grouped, "desc");`,
    properties: [
        entry("selectionMode: 'all' | 'left' | 'right' | 'any'", "all/left 要求完全覆盖；any/right 接受相交或相切。默认 all。", "all/left require full coverage; any/right accept intersection or touching. Defaults to all."),
        entry("rectPicker, ngonPicker, polyPicker, basePicker: boolean", "分别启用四类实体面的点选，默认 true。", "Enable face picking per geometry type; all default to true."),
        entry("rectSelector, ngonSelector, polySelector, baseSelector: boolean", "分别启用四类实体面的框选，默认 true。", "Enable area selection per geometry type; all default to true."),
        entry("linePicker, pointPicker: boolean", "启用边和顶点的点选，默认 true；Selector 的这两组结果始终为空。", "Enable edge and vertex picking; both default to true. Selector always returns empty groups for these."),
        entry("lineSelectTool.radius; pointSelectTool.radius: number", "边和顶点的容差半径，单位为屏幕 CSS 像素，默认 8。", "Tolerance radius for edges and vertices in screen CSS pixels; defaults to 8."),
        entry("rectSelectTool; ngonSelectTool; polySelectTool; baseSelectTool; lineSelectTool; pointSelectTool", "可访问对应选择工具；各工具类也可通过 Select 的同名静态属性取得。", "Access each underlying tool; the classes are also available as static members of Select."),
    ],
    methods: [
        entry("new Select(scene: Scene, render: Render, camera: Camera)", "创建统一选择器，并按需为 NGon2D、Poly2D、Base2D 候选开启包围盒。", "Create the combined selector and enable bounds for NGon2D, Poly2D, and Base2D candidates when needed."),
        entry("SelectPicker(event: MouseEvent): SelectResult", "返回 Rect2D、NGon、Poly2D、Base2D、Line、Point 六组命中；边和点结果带 Mesh、编号、位置和像素距离。", "Return Rect2D, NGon, Poly2D, Base2D, Line, and Point groups. Edge and point hits include mesh, index, position, and pixel distance."),
        entry("Selector(selectionMesh: Mesh): SelectResult", "按选择区域的实际填充面框选四类 Mesh；支持圆角矩形、凹多边形和带内孔正多边形。", "Select four mesh types using the area's actual fill, including rounded rectangles, concave polygons, and NGons with holes."),
        entry("Select.Sort(result: SelectResult, direction?: 'asc' | 'desc'): Mesh[]", "合并去重后按深度测试阶段与场景绘制顺序排序；desc 默认顶层在前。", "Deduplicate and sort by depth-test phase and scene draw order. desc puts the topmost mesh first by default."),
    ],
    links: [
        { label: "Mesh", to: "/docs/bpline/mesh" },
        { label: "CameraControl", to: "/docs/bpline/control/camera-control" },
    ],
};
