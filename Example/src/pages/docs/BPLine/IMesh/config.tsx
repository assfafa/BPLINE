import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "IMesh",
    intro: {
        cn: "用一个几何与材质绘制多条实例记录。raw 选项决定是否保留可响应修改的 Raw 引用。",
        en: "Draw multiple records with one geometry and material. The raw option chooses whether editable Raw references are retained.",
    },
    detail: {
        cn: "push 返回稳定 ID；updateAt 接收连续数组中的索引。raw: false 的实例是冻结快照。",
        en: "push returns a stable ID; updateAt receives a packed-array index. Instances with raw: false are frozen snapshots.",
    },
    code: `import { BaseMaterial, IMesh, Rect2D } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math/Vec2";

const instances = new IMesh(
    new Rect2D({ width: 12, height: 12 }),
    new BaseMaterial(),
    { raw: true },
);
const id = instances.push({ position: new Vec2(20, 30) });`,
    properties: [
        entry("raw: boolean", "是否保留可修改的 Raw 记录。", "Whether editable Raw records are retained."),
        entry("raws: Raws", "当前实例记录集合。", "Current instance record collection."),
        entry("capacity: number; growthFactor: number", "实例缓冲容量与扩容系数。", "Instance capacity and growth factor."),
    ],
    methods: [
        entry("new IMesh(data: Geometry2d, material: Material2d, options?: IMeshOptions)", "创建实例网格体。", "Create an instanced mesh."),
        entry("push(options?: RawOptions): number", "添加实例并返回稳定 ID。", "Add an instance and return its stable ID."),
        entry("updateAt(index: number, options: RawOptions): void", "用完整快照替换指定索引的实例。", "Replace an instance at an index with a full snapshot."),
        entry("clear(): void", "清空实例，但保留容量。", "Remove all instances while retaining capacity."),
        entry("dispose(): void", "释放实例订阅及对象资源。", "Release instance subscriptions and resources."),
    ],
};
