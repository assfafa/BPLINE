import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type Mesh from "../../Mesh";
import type Render from "../../Render";
import Text, { Font } from "../../Text";
import { MeasureText } from "../../Text/layout";
import textCursorUrl from "../cursors/cursor-text.svg?url";

/** 原生输入控件承接 IME、光标拖选和文字剪贴板；历史仅限当前文字内容。 */
class TextInput {
    /** 当前输入控件，应用可读取原生 selectionStart/End。 */
    public readonly element: HTMLTextAreaElement = document.createElement("textarea");
    private readonly _mesh: Mesh;
    private readonly _camera: Camera;
    private readonly _render: Render;
    private readonly _onChange: () => void;
    private readonly _onFinish: () => void;
    private readonly _onBeforeChange: () => void;
    private readonly _onSave: () => void;
    private readonly _events: AbortController = new AbortController();
    private readonly _undo: InputState[] = [];
    private readonly _redo: InputState[] = [];
    private readonly _selectionStyle: HTMLStyleElement = document.createElement("style");
    private _before: InputState;
    private _composing: boolean = false;
    private _destroyed: boolean = false;

    /**
     * 创建透明输入面，由真实字体渲染光标和选区背景。
     * @param mesh 当前文字
     * @param camera 相机
     * @param render 渲染器
     * @param color 用户文字颜色
     * @param onBeforeChange 修改前保存对象历史
     * @param onChange 修改后同步几何
     * @param onFinish Escape 结束输入
     * @param onSave Ctrl+S 输出当前文字文档
     * @example const input = new TextInput(mesh, camera, render, color, before, changed, finish, save);
     * @returns 文字输入会话。
     */
    public constructor(mesh: Mesh, camera: Camera, render: Render, color: string,
        onBeforeChange: () => void, onChange: () => void, onFinish: () => void, onSave: () => void) {
        this._mesh = mesh;
        this._camera = camera;
        this._render = render;
        this._onChange = onChange;
        this._onBeforeChange = onBeforeChange;
        this._onFinish = onFinish;
        this._onSave = onSave;
        this.element.className = "bpline-text-input";
        this._selectionStyle.textContent = ".bpline-text-input::selection { background: #3876c9; color: inherit; }";
        document.head.append(this._selectionStyle);
        this.element.setAttribute("aria-label", "Text editor");
        this.element.wrap = "off";
        this.element.spellcheck = false;
        this.element.style.cssText = "position:fixed;left:0;top:0;margin:0;padding:0;border:0;outline:0;resize:none;overflow:hidden;background:transparent;transform-origin:0 0;z-index:100;box-sizing:content-box;white-space:pre;";
        this.element.style.color = color;
        this.element.style.caretColor = color;
        this.element.style.cursor = `url("${textCursorUrl}") 16 16, text`;
        const text = mesh.data as Text;
        this.element.value = text.text;
        document.body.append(this.element);
        this._before = this.capture();
        const signal = this._events.signal;
        this.element.addEventListener("beforeinput", this.beforeInput.bind(this), { signal });
        this.element.addEventListener("input", this.input.bind(this), { signal });
        // 只接管 keydown；keyup 冒泡让编辑器释放进入输入前按住的 Shift/C 等临时状态。
        this.element.addEventListener("keydown", this.keyDown.bind(this), { signal });
        this.element.addEventListener("wheel", this.forwardWheel.bind(this), { passive: false, signal });
        this.element.addEventListener("compositionstart", this.compositionStart.bind(this), { signal });
        this.element.addEventListener("compositionend", this.compositionEnd.bind(this), { signal });
        this.update();
        this.element.focus({ preventScroll: true });
        this.element.setSelectionRange(text.text.length, text.text.length);
        /** @example Ready(); @returns 无返回值。加载字体后刷新布局。 */
        const Ready = (): void => {
            // 已切换到另一个对象时不再触碰旧输入控件。
            if (!this._destroyed) {
                this.update();
            }
        };
        void Font.browserFace(text.fontFamily).then(Ready).catch(console.error);
    }

    /** @example input.update(); @returns 无返回值。按显示矩阵更新输入面，不修改对象世界变换。 */
    public update(): void {
        const text = this._mesh.data;
        // 类型移交 Base 后由拥有者结束此会话。
        if (text instanceof Text && !this._destroyed) {
            const layout = MeasureText(text);
            const matrix = this._mesh.getRenderMatrix(this._camera).data;
            const left = layout.inputLeft;
            const top = layout.inputTop;
            const origin = this._camera.worldToWindow(new Vec2(
                matrix[6] + matrix[0] * left + matrix[3] * top,
                matrix[7] + matrix[1] * left + matrix[4] * top), this._render);
            const horizontal = this._camera.worldToWindow(new Vec2(
                matrix[6] + matrix[0] * (left + 1) + matrix[3] * top,
                matrix[7] + matrix[1] * (left + 1) + matrix[4] * top), this._render);
            const vertical = this._camera.worldToWindow(new Vec2(
                matrix[6] + matrix[0] * left + matrix[3] * (top - 1),
                matrix[7] + matrix[1] * left + matrix[4] * (top - 1)), this._render);
            this.element.style.transform = `matrix(${String(horizontal.x - origin.x)},${String(horizontal.y - origin.y)},${String(vertical.x - origin.x)},${String(vertical.y - origin.y)},${String(origin.x)},${String(origin.y)})`;
            this.element.style.fontFamily = JSON.stringify(text.fontFamily);
            this.element.style.fontSize = `${String(Math.max(text.fontSize, 0.001))}px`;
            this.element.style.lineHeight = `${String(Math.max(layout.lineHeight, 0.001))}px`;
            this.element.style.letterSpacing = `${String(text.letterSpacing)}px`;
            this.element.style.textAlign = text.textAlign;
            this.element.style.width = `${String(layout.inputWidth)}px`;
            this.element.style.height = `${String(layout.inputHeight)}px`;
        }
    }

    /** @param index 原文 UTF-16 插入位置 @example input.setCaret(3); @returns 无返回值。 */
    public setCaret(index: number): void {
        this.element.setSelectionRange(index, index);
    }

    /** @example input.destroy(); @returns 无返回值。 */
    public destroy(): void {
        this._destroyed = true;
        this._events.abort();
        this.element.remove();
        this._selectionStyle.remove();
    }

    /** @example const state = this.capture(); @returns 原文和选区的纯数据快照。 */
    private capture(): InputState {
        return { value: this.element.value, start: this.element.selectionStart, end: this.element.selectionEnd };
    }
    /** @example this.beforeInput(); @returns 无返回值。原生改动前保存选区。 */
    private beforeInput(): void {
        // 一次中文组合输入整体撤销，而非逐个拼音字母。
        if (!this._composing) {
            this._before = this.capture();
            this._onBeforeChange();
        }
    }
    /** @example this.input(); @returns 无返回值。同步已提交的文字。 */
    private input(): void {
        const text = this._mesh.data;
        // 组合输入结束后才写几何，避免拼音候选改变已提交内容。
        if (text instanceof Text && !this._composing) {
            // 实际原文变化才写几何和历史，光标移动不产生编辑记录。
            if (text.text !== this.element.value) {
                this._undo.push(this._before);
                this._redo.length = 0;
                text.text = this.element.value;
                this._onChange();
                this.update();
            }
        }
    }
    /** @example this.compositionStart(); @returns 无返回值。 */
    private compositionStart(): void {
        this._before = this.capture();
        this._onBeforeChange();
        this._composing = true;
    }
    /** @example this.compositionEnd(); @returns 无返回值。 */
    private compositionEnd(): void {
        this._composing = false;
        this.input();
    }
    /**
     * 输入面位于 body，主动把滚轮交给渲染容器里的相机控制器。
     * @param event 输入面上的滚轮事件
     * @example this.forwardWheel(event);
     * @returns 无返回值，仅当容器接管滚轮时阻止输入面的默认滚动。
     */
    private forwardWheel(event: WheelEvent): void {
        const forwarded = new WheelEvent("wheel", {
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            deltaMode: event.deltaMode,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            button: event.button,
            buttons: event.buttons,
        });
        // 副本不冒泡；页面的普通冒泡监听仍由原事件触发。
        const allowDefault = this._render.container.dispatchEvent(forwarded);
        // 没有控制器或缩放已关闭时，仍保留原生默认行为。
        if (allowDefault === false) {
            event.preventDefault();
        }
    }

    /** @param event 输入控件的键盘事件 @example this.keyDown(event); @returns 无返回值。 */
    private keyDown(event: KeyboardEvent): void {
        event.stopPropagation();
        // 输入模式的 Backspace/Delete、剪贴板与方向键只作用于文字。
        if (event.key === "Escape" && !event.isComposing) {
            event.preventDefault();
            this._onFinish();
        } else if ((event.ctrlKey || event.metaKey) && event.code === "KeyS" && !event.isComposing) {
            // 保存只输出数据，不让浏览器弹出保存网页窗口。
            event.preventDefault();
            // 长按不重复输出同一份文档。
            if (!event.repeat) {
                this._onSave();
            }
        } else if ((event.ctrlKey || event.metaKey) && !event.isComposing &&
            (event.code === "KeyZ" || event.code === "KeyY")) {
            // 输入时的撤销重做只恢复文字和选区，不冒泡到对象历史。
            event.preventDefault();
            let source = this._undo;
            let destination = this._redo;
            // Ctrl+Y 和 Ctrl+Shift+Z 都恢复文字，不触发对象历史。
            if (event.code === "KeyY" || event.shiftKey) {
                source = this._redo;
                destination = this._undo;
            }
            const state = source.pop();
            const text = this._mesh.data;
            // 存在历史且对象仍是文字才恢复输入内容。
            if (state !== undefined && text instanceof Text) {
                this._onBeforeChange();
                destination.push(this.capture());
                this.element.value = state.value;
                this.element.setSelectionRange(state.start, state.end);
                text.text = state.value;
                this._onChange();
                this.update();
            }
        }
    }
}

interface InputState { value: string; start: number; end: number }

export default TextInput;
