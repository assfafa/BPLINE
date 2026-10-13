import type { TextAlign, TextBaseline } from "bpmatrixjs/Geometry/Text";
import type Mesh from "../../Mesh";
import Style from "../../Style";
import type { TextWritingMode } from "../../Text";
import Text from "../../Text";
import { MeasureText } from "../../Text/layout";
import type { RectEditRecord } from "../RectEditTool/data";
import { CaptureRectStyle } from "../RectEditTool/data";

/** 面向状态框架的文字记录，不暴露订阅器、字体对象或 GPU 资源。 */
interface TextEditRecord extends Omit<RectEditRecord, "radius"> {
    text: string;
    fontFamily: string;
    fontSize: number;
    letterSpacing: number;
    lineSpacing: number;
    textAlign: TextAlign;
    baseline: TextBaseline;
    writingMode: TextWritingMode;
}

interface TextEditDocument {
    version: 1;
    type: "text";
    meshes: TextEditRecord[];
}

/** @param mesh 文字实体 @param style 原始用户样式 @example CaptureText(mesh, style); @returns 可序列化文字记录。 */
const CaptureText = (mesh: Mesh, style: Style): TextEditRecord => {
    const text = mesh.data;
    const material = mesh.material;
    // 文字记录不能静默保存成普通三角面数据。
    if (text instanceof Text && material !== undefined) {
        const bounds = MeasureText(text);
        return {
            id: mesh.id, text: text.text, fontFamily: text.fontFamily, fontSize: text.fontSize,
            letterSpacing: text.letterSpacing, lineSpacing: text.lineSpacing,
            textAlign: text.textAlign, baseline: text.baseline, writingMode: text.writingMode,
            position: { x: mesh.position.x, y: mesh.position.y }, rotation: mesh.rotation,
            scale: { x: mesh.scale.x, y: mesh.scale.y }, matrix: [...mesh.ensureMatrix().data] as TextEditRecord["matrix"],
            width: bounds.width, height: bounds.height, order: mesh.order,
            precision: text.originPrecision, autoPrecision: mesh.autoPrecision, culling: mesh.culling,
            precisionMax: mesh.precisionMax,
            bounding: mesh.bounding, ignoreZoom: mesh.ignoreZoom, style: CaptureRectStyle(style),
            material: { transparent: material.transparent, depthTest: material.depthTest,
                depthWrite: material.depthWrite, cullMode: material.cullMode },
        };
    } else {
        throw new TypeError("CaptureText requires a Text Mesh with a material.");
    }
};

export { CaptureText };
export type { TextEditDocument, TextEditRecord };
