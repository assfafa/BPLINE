import type CameraControl from "../../Control/CameraControl";
import RectEditToolKey from "../RectEditTool/key";
import type TextEditTool from "./index";

/** 对象变换复用矩形快捷键，输入控件内的按键由文字会话独享。 */
class TextEditToolKey extends RectEditToolKey {
    /** 受快捷键控制的文字编辑器。 */
    public declare readonly tool: TextEditTool;

    /**
     * 注册文字对象快捷键，不拦截输入控件内的文字剪贴板、撤销和 Backspace。
     * @param tool 文字编辑器
     * @param cameraControl 可选相机控制器
     * @example const keys = new TextEditToolKey(tool, cameraControl);
     * @returns 文字快捷键控制器。
     */
    public constructor(tool: TextEditTool, cameraControl: CameraControl | null = null) {
        super(tool, cameraControl);
    }
}

export default TextEditToolKey;
export { TextEditToolKey };
