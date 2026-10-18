import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "EditorKey / shape keys",
    intro: { cn: "Window 键盘输入适配器。组合键允许同时按住，点击动作以按下和松开为一组；窗口失焦重置临时模式。", en: "Window keyboard adapter. Chords use held keys; click actions complete on press and release. Blur resets temporary state." },
    detail: { cn: "文本输入、普通输入框和 IME 期间避免编辑器快捷键冲突。快捷键字符串采用 KeyboardEvent.code，Control/Alt/Shift 表示修饰键；不依赖按键显示字符。", en: "Keyboard shortcuts avoid conflicts with native text inputs and IME. Bindings use KeyboardEvent.code with Control/Alt/Shift modifiers rather than displayed characters." },
    code: "import { EditorKey } from \"bplinejs/Editor\";\nconst keys = new EditorKey(editor, cameraControl);\nkeys.viewCode = \"KeyQ\";\nkeys.saveCode = \"Control+KeyS\";",
    properties: [
        entry("rectCode / ngonCode / polyCode / textCode / createGroupCode", "默认 KeyE+KeyR / KeyE+KeyN / KeyE+KeyP / KeyE+KeyT / KeyE+KeyG。切换创建类型。", "Default KeyE+KeyR / KeyE+KeyN / KeyE+KeyP / KeyE+KeyT / KeyE+KeyG creation shortcuts."),
        entry("viewCode = \"KeyV\" / editCode = \"KeyE\" / groupCode = \"KeyG\"", "查看、编辑、所选组变换。", "View, edit and selected-group transform modes."),
        entry("addCode = \"Control\" / subCode = \"Alt\" / constrainCode = \"Shift\"", "按住增选/减选/轴向与等比约束；Shift 还改变 Rect/NGon 绘制起点。", "Hold for additive/subtractive selection or axis/uniform constraints. Shift also changes Rect/NGon drawing origins."),
        entry("subtractCode = \"Minus\" / unionCode = \"Equal\" (EditorKey only)", "集合专属：已有选择 A 时按住 - 点击 B 执行 A-B（B 保留），按住 = 点击 B 合并双方；松开/失焦/进入输入控件恢复，Ctrl+-/= 留给浏览器缩放。Group 不参与。", "Collection only: hold - and click B for selected A-B, retaining B; hold = and click B for union. Release, blur or entering an input restores the state. Ctrl+-/= retains browser zoom behavior. Groups are excluded."),
        entry("centerCode = \"KeyC\" / multCode = \"KeyM\" / closedCode = \"KeyF\"", "C 临时切换起点；M 点击切换多选；F 切换 Poly 是否闭合。", "C temporarily changes origin; M toggles multiple selection; F toggles Poly closure."),
        entry("stepCode = \"KeyS\" / snapCode = \"KeyP\"", "点击切换步进/总吸附；KeyP+Digit1/2/3/4 分别切换顶点/边/交点/网格吸附。", "Toggle stepping/master snapping. KeyP+Digit1/2/3/4 toggles vertex/edge/intersection/grid snapping."),
        entry("sideCodes: Map<number, string>", "NGon：Digit3…Digit9 对应 3…9 边；Digit1+Digit0…Digit9+Digit0 对应 10…90 边。", "NGon: Digit3…Digit9 sets 3…9 sides; Digit1+Digit0…Digit9+Digit0 sets 10…90 sides."),
        entry("removeCode = \"Delete\" / baseCode = \"KeyB\" / cancelCode = \"Escape\"", "删除所选 / 主动降级 Base / 取消手势。B 在首次按下生效，长按不重复；Backspace 留给文字输入。", "Remove selected / convert to Base / cancel gesture. B acts on the initial press without repeating. Backspace is reserved for text input."),
        entry("copyCode / cutCode / pasteCode / selectAllCode / saveCode", "Control+KeyC/X/V/A/S；保存仅执行 editor.save() 并抛出 onSave。", "Control+KeyC/X/V/A/S. Saving only invokes editor.save() and emits onSave."),
        entry("undoCode / redoCode / redoAlternateCode", "Control+KeyZ / Control+KeyY / Control+Shift+KeyZ；文字输入中由原生文本历史接管。", "Control+KeyZ / Control+KeyY / Control+Shift+KeyZ. Native text history owns these during input."),
        entry("cameraResetCode = \"Space\"", "点击让相机 position 回到 (0,0)，需要提供控制器。", "Return camera position to (0,0); requires a controller."),
    ],
    methods: [
        entry("new EditorKey(editor, cameraControl = null)", "传控制器后，在编辑行为时关闭 leftDrag/oFDrag，保留 rightDrag/tFDrag 与滚轮；窗口失焦恢复。", "With a controller, editing disables leftDrag/oFDrag while preserving rightDrag/tFDrag and wheel zoom. Blur restores controls."),
        entry("new RectEditToolKey / NGonEditToolKey / PolyEditToolKey / TextEditToolKey(tool, cameraControl = null)", "独立编辑器键盘类；公共按键字段同上，类型独属快捷键只在对应工具使用。", "Standalone keyboard adapters use the common key fields above; shape-specific shortcuts apply to the relevant tool."),
        entry("destroy(): void", "解除 Window 事件，恢复临时开关和控制器状态。", "Remove window listeners and restore temporary modes and controller switches."),
    ],
    links: [],
};
