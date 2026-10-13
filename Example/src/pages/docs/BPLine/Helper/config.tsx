import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Helper",
    intro: { cn: "辅助对象模块。HelperGrid 由屏幕空间背景网格和独立标尺 Mesh 组成，可直接使用或访问 editor.helperGrid。", en: "Helper module. HelperGrid combines a screen-space background grid with a separate ruler mesh, usable directly or via editor.helperGrid." },
    code: "import { HelperGrid, HelperGridCustomStyle } from \"bplinejs/Helper\";\nconst helper = new HelperGrid(scene, render, camera);",
    properties: [

    ],
    methods: [

    ],
    links: [{ "label":"HelperGrid","to":"/docs/bpline/helper/grid" },{ "label":"Helper example","to":"/example/helper/grid" }],
};
