import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "UUID",
    intro: {
        cn: "生成标识字符串，适合为对象和本地记录分配 ID。",
        en: "Generate an identifier string for objects and local records.",
    },
    code: `import { UUID } from "bpmatrixjs/Utils";

const id = UUID();`,
    methods: [
        entry("UUID(): string", "返回新生成的 UUID 字符串。", "Return a newly generated UUID string."),
    ],
};
