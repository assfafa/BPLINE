import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "HelperGridCustomStyle",
    intro: { cn: "带版本和 Color 订阅的辅助网格配色。修改颜色对象或替换引用都会通知 HelperGrid。", en: "Versioned helper colors with Color subscriptions. Color mutations and replacement notify HelperGrid." },
    code: "helper.mode = \"custom\";\nhelper.custom.gridMinorColor.setHex(\"#334455\");\nhelper.custom.rulerTextColor.setHex(\"#ffffff\");",
    properties: [
        entry("gridMinorColor / gridMajorColor: Color", "网格次线/主线，默认 #2e333d / #4a5463。", "Minor/major grid lines, default #2e333d / #4a5463."),
        entry("rulerMinorColor / rulerMajorColor / rulerTextColor: Color", "标尺次线/主线/文字，默认 #929aa6 / #c9d1de / #c9d1de。", "Ruler minor/major/text colors, default #929aa6 / #c9d1de / #c9d1de."),
        entry("version: number", "只读变更版本。", "Read-only revision."),
    ],
    methods: [
        entry("new HelperGridCustomStyle(colors?: HelperGridCustomColors)", "可选传五个 Color 引用，省略使用夜间默认值。", "Optionally supply all five Color references; defaults use the dark palette."),
        entry("setColors(colors): this", "批量替换五个颜色，只通知一次。", "Replace all five colors with one notification."),
        entry("add(subscriber): void / delete(subscriber): void / dispose(): void", "绑定、解绑、释放配色订阅，不销毁用户 Color。", "Subscribe, unsubscribe or release bindings without destroying user colors."),
    ],
    links: [],
};
