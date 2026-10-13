import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "TextSelectTool",
    intro: { cn: "文字专用选择器。按排版矩形命中和框选；需要行列或插入位置时额外调用 SelectCaret/locate。", en: "Text selection by layout rectangles, with SelectCaret/locate for rows, columns and insertion positions." },
    code: "const hits = select.textSelectTool.SelectCaret(event);\nconsole.log(hits[0]?.row, hits[0]?.column, hits[0]?.index);",
    properties: [
        entry("picker / selector: boolean = true", "点选/框选独立开关。", "Independent picking/area-selection switches."),
        entry("selectionMode: RectSelectionMode = \"all\"", "all/left 要求完整包围，any/right 接受相交。拖动方向由上层选择逻辑处理。", "all/left requires enclosure; any/right allows intersection. The caller handles drag direction."),
    ],
    methods: [
        entry("new TextSelectTool(scene, render, camera)", "不扫描字体三角面，支持 ignoreZoom 显示矩阵。", "Avoid glyph triangle scans; respect ignoreZoom display transforms."),
        entry("SelectPicker(event: MouseEvent): Mesh[] / Selector(selectionMesh: Mesh): Mesh[]", "返回文字 Mesh，排除 noSelect、IMesh 和辅助框；选择框支持 Rect/NGon/Poly。", "Return text meshes, excluding noSelect, IMesh and helpers. Areas support Rect/NGon/Poly."),
        entry("SelectCaret(event: MouseEvent): TextSelection[] / locate(mesh: Mesh, client: Vec2): TextSelection | null", "包含 mesh、row、column、index、region；行列从 0 开始，index 为 UTF-16 插入下标，region 为局部字素 advance 区域。", "Return mesh, row, column, index and region. Rows/columns are zero-based; index is a UTF-16 insertion offset; region is the local grapheme advance area."),
    ],
    links: [],
};
