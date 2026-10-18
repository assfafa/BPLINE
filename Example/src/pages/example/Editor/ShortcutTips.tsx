import { useState } from "react";
import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import type { Language } from "@/locale/index.ts";

/**
 * Keep every default EditorKey binding readable without covering the canvas permanently.
 * @example <ShortcutTips />
 * @returns Expandable, localized shortcut reference for the complete preview.
 */
const ShortcutTips = (): JSX.Element => {
    const { language } = useLocale();
    const [open, setOpen] = useState(false);
    const labels = Labels[language];
    let panel: JSX.Element | null = null;
    /** @example toggle(); @returns No value; retain the current editing session. */
    const toggle = (): void => {
        setOpen(!open);
    };
    // The simple preview has no keyboard adapter; only the complete preview mounts this reference.
    if (open) {
        /** @param row Default key and localized behavior @example renderRow(row); @returns One shortcut row. */
        const renderRow = (row: Shortcut): JSX.Element => (
            <div key={row.keys} className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-border/60 py-2 last:border-0">
                <dt><kbd className="font-mono text-[11px] font-semibold">{row.keys}</kbd></dt>
                <dd className="min-w-0 text-xs text-muted-foreground">{row[language]}</dd>
            </div>
        );
        panel = (
            <div id="editor-shortcut-tips" className="pointer-events-auto mt-1 min-h-0 w-full max-w-lg overflow-y-auto overscroll-contain rounded-md border border-border bg-background/95 p-3 shadow-xl">
                <p className="mb-2 text-xs text-muted-foreground">{labels.note}</p>
                <dl>{Shortcuts.map(renderRow)}</dl>
                <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">{labels.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">{labels.pointer}</p>
            </div>
        );
    }
    return (
        <aside className="pointer-events-none absolute inset-x-2 top-2 z-30 flex max-h-[calc(100%-1rem)] flex-col items-start lg:right-[240px]">
            <button type="button" onClick={toggle} aria-expanded={open} aria-controls="editor-shortcut-tips"
                className="pointer-events-auto shrink-0 rounded-md border border-border bg-background/95 px-3 py-1.5 text-xs font-medium shadow focus-visible:outline-2 focus-visible:outline-ring">
                {labels.title}
            </button>
            {panel}
        </aside>
    );
};

interface Shortcut {
    keys: string;
    cn: string;
    en: string;
}

const Labels: Record<Language, { title: string; note: string; text: string; pointer: string }> = {
    cn: {
        title: "快捷键 Tips",
        note: "未注明“按住”的操作均为单击按键。组合键需同时按住；临时操作松开即恢复，窗口失焦重置。",
        text: "文字输入时：Ctrl+A/C/X/V/Z/Y 和 Ctrl+Shift+Z 操作当前文字；Backspace/Delete 删除文字，Enter 换行，方向键移动光标，Shift+方向键扩选。",
        pointer: "单击选择，已选文字再次单击进入输入。多边形逐点单击、右键闭合。左键/单指编辑，右键/双指平移，滚轮缩放。组变换：内部移动、边角缩放、外部旋转。",
    },
    en: {
        title: "Keyboard tips",
        note: "Tap unless marked Hold. Chords require keys held together. Release restores temporary options; window blur resets them.",
        text: "During text input: Ctrl+A/C/X/V/Z/Y and Ctrl+Shift+Z edit the current text. Backspace/Delete remove text, Enter adds a line, arrows move the caret, and Shift+arrows extend the selection.",
        pointer: "Click to select; click selected text again to type. Polygon: click vertices, right-click to close. Left mouse/one finger edits; right mouse/two fingers pan; wheel zooms. Group transforms: move inside, scale edges/corners, rotate outside.",
    },
};

const Shortcuts: readonly Shortcut[] = [
    { keys: "V", cn: "查看模式", en: "View mode" },
    { keys: "E", cn: "编辑模式", en: "Edit mode" },
    { keys: "E + R", cn: "创建矩形", en: "Create rectangles" },
    { keys: "E + N", cn: "创建正多边形 / 圆环", en: "Create regular polygons / rings" },
    { keys: "E + P", cn: "创建多边形 / 折线", en: "Create polygons / polylines" },
    { keys: "E + T", cn: "创建文字", en: "Create text" },
    { keys: "E + G", cn: "创建层级 Group", en: "Create hierarchy groups" },
    { keys: "G", cn: "当前选择的组变换模式", en: "Transform the current selection as a group" },
    { keys: "Ctrl", cn: "按住增选：单击或框选", en: "Hold for additive click / marquee selection" },
    { keys: "Alt", cn: "按住减选：单击或框选", en: "Hold for subtractive click / marquee selection" },
    { keys: "−", cn: "按住后点击 B：已选 A 减去 B，B 保留；Group 不参与", en: "Hold and click B: selected A minus B; retain B; exclude Group" },
    { keys: "=", cn: "按住后点击 B：合并已选 A 与 B；Group 不参与", en: "Hold and click B: union selected A with B; exclude Group" },
    { keys: "Shift", cn: "按住限制轴向移动 / 等比缩放；Rect 中心起笔，默认中心 NGon 改为角点起笔", en: "Hold for axis / uniform constraints; draw Rect from center, default NGon from corner" },
    { keys: "C", cn: "按住临时使用中心起点", en: "Hold for a temporary center origin" },
    { keys: "M", cn: "开关多选", en: "Toggle multiple selection" },
    { keys: "F", cn: "切换新建 Poly 的闭合 / 开放", en: "Toggle closure for newly drawn Poly paths" },
    { keys: "S", cn: "开关移动与旋转步进", en: "Toggle translation and rotation steps" },
    { keys: "P", cn: "开关总吸附", en: "Toggle master snapping" },
    { keys: "P + 1", cn: "开关顶点吸附", en: "Toggle vertex snapping" },
    { keys: "P + 2", cn: "开关边线吸附", en: "Toggle edge snapping" },
    { keys: "P + 3", cn: "开关交点吸附", en: "Toggle intersection snapping" },
    { keys: "P + 4", cn: "开关网格吸附", en: "Toggle grid snapping" },
    { keys: "3 … 9", cn: "NGon 模式：设置 3 … 9 边", en: "NGon mode: set 3 … 9 sides" },
    { keys: "1 … 9 + 0", cn: "NGon 模式：同时按十位数字与 0，设置 10 … 90 边", en: "NGon mode: hold the tens digit with 0 for 10 … 90 sides" },
    { keys: "B", cn: "按下将所选几何主动降级为 Base", en: "Convert selected geometry to Base on press" },
    { keys: "Delete", cn: "删除所选实体", en: "Delete selected entities" },
    { keys: "Esc", cn: "取消手势与选择，回到编辑模式", en: "Cancel the gesture and selection; return to edit mode" },
    { keys: "Space", cn: "相机位置回到世界 (0, 0)", en: "Reset camera position to world (0, 0)" },
    { keys: "Ctrl + A", cn: "全选当前启用的实体", en: "Select all enabled entities" },
    { keys: "Ctrl + C", cn: "复制所选实体", en: "Copy selected entities" },
    { keys: "Ctrl + X", cn: "剪切所选实体", en: "Cut selected entities" },
    { keys: "Ctrl + V", cn: "在鼠标位置粘贴；无位置时错位粘贴", en: "Paste at the pointer; offset if its position is unavailable" },
    { keys: "Ctrl + Z", cn: "撤销一次编辑（包括布尔运算）", en: "Undo one edit, including a Boolean operation" },
    { keys: "Ctrl + Y", cn: "重做", en: "Redo" },
    { keys: "Ctrl + Shift + Z", cn: "重做的备用组合键", en: "Alternate redo shortcut" },
    { keys: "Ctrl + S", cn: "执行 save()，输出 JSON 并触发 onSave；不下载文件", en: "Run save(), return JSON and emit onSave; no file download" },
];

export default ShortcutTips;
