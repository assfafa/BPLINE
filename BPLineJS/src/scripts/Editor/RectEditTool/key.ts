import type CameraControl from "../../Control/CameraControl";
import type RectEditTool from "./index";
import type { RectEditMode } from "./index";

/**
 * RectEditTool 的可改键盘快捷键。组合键用加号连接 KeyboardEvent.code，
 * 例如 `Control+KeyV`；单独的 Control、Alt、Shift 同时匹配左右修饰键。
 */
class RectEditToolKey {
    /** 使用快捷键的编辑器。 */
    public readonly tool: RectKeyTarget;
    /** 点击后切到查看模式。 */
    public viewCode: string = "KeyV";
    /** 点击后切到编辑模式。 */
    public editCode: string = "KeyE";
    /** 点击后进入组变换模式。 */
    public groupCode: string = "KeyG";
    /** 按住时增选，松开后恢复原模式。 */
    public addCode: string = "Control";
    /** 按住时减选，松开后恢复原模式。 */
    public subCode: string = "Alt";
    /** 按住时锁定移动轴、四角宽高比，并让画框以按下点为中心。 */
    public constrainCode: string = "Shift";
    /** 点击后同时切换平移和旋转步进。 */
    public stepCode: string = "KeyS";
    /** 点击后切换吸附总开关。 */
    public snapCode: string = "KeyP";
    /** 点击后切换顶点吸附，默认 P+1。 */
    public snapVertexCode: string = "KeyP+Digit1";
    /** 点击后切换边线吸附，默认 P+2。 */
    public snapEdgeCode: string = "KeyP+Digit2";
    /** 点击后切换交点吸附，默认 P+3。 */
    public snapIntersectionCode: string = "KeyP+Digit3";
    /** 点击后切换细格吸附，默认 P+4。 */
    public snapGridCode: string = "KeyP+Digit4";
    /** 点击后切换多选开关。 */
    public multCode: string = "KeyM";
    /** 点击后删除当前选中集合。 */
    public removeCode: string = "Delete";
    /** 点击后把相机位置移回世界原点。 */
    public cameraResetCode: string = "Space";
    /** 按住时以中心为新建起点，松开回到 left。 */
    public centerCode: string = "KeyC";
    /** 复制当前选中矩形。 */
    public copyCode: string = "Control+KeyC";
    /** 粘贴复制的矩形。 */
    public pasteCode: string = "Control+KeyV";
    /** 剪切当前选中矩形。 */
    public cutCode: string = "Control+KeyX";
    /** 撤销上一批编辑。 */
    public undoCode: string = "Control+KeyZ";
    /** 重做上一批编辑。 */
    public redoCode: string = "Control+Shift+KeyZ";
    /** 重做的备用组合键。 */
    public redoAlternateCode: string = "Control+KeyY";
    /** 生成 JSON 并触发 onSave。 */
    public saveCode: string = "Control+KeyS";
    /** 首次按下时主动降级已选几何，默认 B；文字输入框内不接管。 */
    public baseCode: string = "KeyB";
    /** 全选本工具可编辑的对象，输入控件内保留原生文字全选。 */
    public selectAllCode: string = "Control+KeyA";

    private readonly _events: AbortController = new AbortController();
    private readonly _pressed = new Set<string>();
    private readonly _armedClicks = new Map<ClickAction, string>();
    private _previousMode: RectEditMode | null = null;
    private _previousConstrain: boolean | null = null;
    private _centerHeld: boolean = false;
    private _addOrder: number = 0;
    private _subOrder: number = 0;
    private _pressOrder: number = 0;
    private _destroyed: boolean = false;
    private readonly _cameraControl: CameraControl | null;
    private readonly _originalLeftDrag: boolean;
    private readonly _originalOFDrag: boolean;
    private static _nextListenerId: number = 0;
    private readonly _modeListenerKey: string = `RectEditToolKey:${String(RectEditToolKey._nextListenerId)}`;

    /**
     * 注册窗口级快捷键，使用 destroy 可移除监听。
     * @param tool 受快捷键控制的矩形编辑器
     * @param cameraControl 可选相机控制器；编辑时交出左键和单指，查看时恢复原开关
     * @example
     * const keys = new RectEditToolKey(tool);
     * @returns 快捷键控制器。
     */
    public constructor(tool: RectKeyTarget, cameraControl: CameraControl | null = null) {
        this.tool = tool;
        this._cameraControl = cameraControl;
        this._originalLeftDrag = cameraControl?.leftDrag ?? false;
        this._originalOFDrag = cameraControl?.oFDrag ?? false;
        RectEditToolKey._nextListenerId += 1;
        this.tool.onModeChange(this._modeListenerKey, this.syncCameraControl.bind(this));
        this.syncCameraControl();
        const signal = this._events.signal;
        window.addEventListener("keydown", this.handleKeyDown.bind(this), { signal });
        window.addEventListener("keyup", this.handleKeyUp.bind(this), { signal });
        window.addEventListener("blur", this.handleBlur.bind(this), { signal });
    }

    /**
     * 把组合键拆成独立的 KeyboardEvent.code。
     * @param code 单键或加号连接的组合键
     * @example
     * const keys = this.codes("Control+KeyV");
     * @returns 去掉空白与空项的按键列表。
     */
    private codes(code: string): string[] {
        const parts: string[] = [];
        // 空片段不应使一组自定义按键意外生效。
        for (const segment of code.split("+")) {
            const part = segment.trim();
            // 连续加号和纯空白不代表有效的键盘按键。
            if (part.length > 0) {
                parts.push(part);
            }
        }
        return parts;
    }

    /**
     * 判断实际按键是否符合配置，未指定左右的修饰键两侧通用。
     * @param configuredCode 配置中的一个按键
     * @param pressedCode KeyboardEvent.code
     * @example
     * const matches = this.matchesCode("Control", "ControlRight");
     * @returns 是否匹配。
     */
    private matchesCode(configuredCode: string, pressedCode: string): boolean {
        // 不带左右后缀的修饰键同时接受键盘两侧，普通键严格匹配 code。
        if (configuredCode === "Control" || configuredCode === "Alt" || configuredCode === "Shift") {
            return pressedCode === `${configuredCode}Left` || pressedCode === `${configuredCode}Right`;
        } else {
            return configuredCode === pressedCode;
        }
    }

    /**
     * 所有组合键成员同时按住才算生效。
     * @param code 待判断的按键配置
     * @example
     * const active = this.isPressed(this.addCode);
     * @returns 该组合当前是否完整按下。
     */
    private isPressed(code: string): boolean {
        const parts = this.codes(code);
        let complete = parts.length > 0;
        // 每一段都必须在实际按键集合中找到对应键。
        for (const part of parts) {
            let matched = false;
            // 左右修饰键由 matchesCode 归一化，其他键保持原始 code。
            for (const pressedCode of this._pressed) {
                // 某一实际按键足以满足当前组合段。
                if (this.matchesCode(part, pressedCode)) {
                    matched = true;
                }
            }
            // 任意一段缺失时不执行组合动作。
            if (!matched) {
                complete = false;
            }
        }
        return complete;
    }

    /**
     * 判断是否仍按着任一键盘修饰键，供独立单键排除浏览器组合操作。
     * @example
     * const modified = this.hasPressedModifier();
     * @returns 当前是否按住 Ctrl、Alt、Shift 或 Meta。
     */
    private hasPressedModifier(): boolean {
        return this.isPressed("Control") || this.isPressed("Alt") || this.isPressed("Shift") ||
            this._pressed.has("MetaLeft") || this._pressed.has("MetaRight");
    }

    /** @param code 快捷键配置 @example this.hasConfiguredModifier("Control+KeyP"); @returns 是否显式包含修饰键。 */
    private hasConfiguredModifier(code: string): boolean {
        let configured = false;
        // 自定义组合只有显式写入修饰键才可在浏览器组合中执行。
        for (const part of this.codes(code)) {
            // 左右修饰键沿用 KeyboardEvent.code 前缀。
            if (part.startsWith("Control") || part.startsWith("Alt") ||
                part.startsWith("Shift") || part.startsWith("Meta")) {
                configured = true;
            }
        }
        return configured;
    }

    /**
     * 当前按键是否是某配置组合的一部分。
     * @param code 按键配置
     * @param pressedCode 本次变化的实际按键
     * @example
     * const involved = this.includesCode(this.viewCode, event.code);
     * @returns 是否属于这个组合。
     */
    private includesCode(code: string, pressedCode: string): boolean {
        let included = false;
        // 只处理当前变化的键所属的快捷键，其他候选继续等待。
        for (const part of this.codes(code)) {
            // 按键可对应组合中的任意一段。
            if (this.matchesCode(part, pressedCode)) {
                included = true;
            }
        }
        return included;
    }

    /** @example const bindings = this.clickBindings(); @returns 当前可自定义的点击操作配置。 */
    private clickBindings(): ClickBinding[] {
        return [
            { action: "view", code: this.viewCode },
            { action: "edit", code: this.editCode },
            { action: "group", code: this.groupCode },
            { action: "mult", code: this.multCode },
            { action: "step", code: this.stepCode },
            { action: "snap", code: this.snapCode },
            { action: "snapVertex", code: this.snapVertexCode },
            { action: "snapEdge", code: this.snapEdgeCode },
            { action: "snapIntersection", code: this.snapIntersectionCode },
            { action: "snapGrid", code: this.snapGridCode },
            { action: "remove", code: this.removeCode },
            { action: "cameraReset", code: this.cameraResetCode },
            { action: "copy", code: this.copyCode },
            { action: "paste", code: this.pasteCode },
            { action: "cut", code: this.cutCode },
            { action: "undo", code: this.undoCode },
            { action: "redo", code: this.redoCode },
            { action: "redo", code: this.redoAlternateCode },
            { action: "save", code: this.saveCode },
            { action: "selectAll", code: this.selectAllCode },
        ];
    }

    /**
     * 仅在按键首次按下且完整组合成立时记录点击候选。
     * @param pressedCode 本次按下的实际按键
     * @example
     * this.armClicks(event.code);
     * @returns 无返回值。
     */
    private armClicks(pressedCode: string): void {
        const candidates: ClickBinding[] = [];
        const modified = this.hasPressedModifier();
        // 浏览器组合键中途加入修饰键时，撤销未显式配置修饰键的吸附操作。
        if (modified) {
            // 候选来自此前按键，仍需在当前修饰键状态下再次筛查。
            for (const [action, code] of this._armedClicks) {
                // 默认 P 系列不拦截浏览器自己的 Ctrl/Alt/Shift 快捷键。
                if (action.startsWith("snap") && !this.hasConfiguredModifier(code)) {
                    this._armedClicks.delete(action);
                }
            }
        }
        // 只在本次按下补齐的组合上开始一次点击手势。
        for (const binding of this.clickBindings()) {
            const blockedSnap = binding.action.startsWith("snap") && modified &&
                !this.hasConfiguredModifier(binding.code);
            // 浏览器组合里的 P、尚未按齐或与当前键无关的快捷键均不武装。
            if (!blockedSnap && this.includesCode(binding.code, pressedCode) && this.isPressed(binding.code)) {
                candidates.push(binding);
            }
        }
        let longest = 0;
        // 重叠快捷键以更完整的组合为准，避免 Ctrl+V 又触发单独 V。
        for (const binding of candidates) {
            longest = Math.max(longest, this.codes(binding.code).length);
        }
        for (const [action, code] of this._armedClicks) {
            // 长组合覆盖短组合，避免同一次松开执行两个重叠动作。
            if (this.codes(code).length < longest) {
                this._armedClicks.delete(action);
            }
        }
        // 等长组合可以各自待命，允许用户映射不同按键动作。
        for (const binding of candidates) {
            // 只记录最具体的匹配。
            if (this.codes(binding.code).length === longest) {
                this._armedClicks.set(binding.action, binding.code);
            }
        }
    }

    /**
     * 按住增选和减选时暂存原模式，两个键一起按时以后按下的为准。
     * @example
     * this.syncMode();
     * @returns 无返回值。
     */
    private syncMode(): void {
        const add = this.isPressed(this.addCode);
        const sub = this.isPressed(this.subCode);
        // 临时模式始终记住进入前的状态，松开最后一个修饰键再恢复。
        if (add || sub) {
            this._previousMode ??= this.tool.activeType;
            let mode: RectEditMode = "add";
            // 两个临时模式并存时，以最近按下的那个为准。
            if (sub && (!add || this._subOrder > this._addOrder)) {
                mode = "sub";
            }
            // 同一模式不重复赋值，以免取消当前指针手势。
            if (this.tool.activeType !== mode) {
                this.tool.activeType = mode;
            }
        } else if (this._previousMode !== null) {
            // 原模式可能是 group，恢复时让编辑器自行重建组框。
            this.tool.activeType = this._previousMode;
            this._previousMode = null;
        }
    }

    /** @example this.syncTemporaryOptions(); @returns 无返回值。 */
    private syncTemporaryOptions(): void {
        const constrained = this.isPressed(this.constrainCode);
        // Shift 暂时覆盖用户已有的约束开关，松开后恢复手动状态。
        if (constrained) {
            this._previousConstrain ??= this.tool.constrain;
            this.tool.constrain = true;
        } else if (this._previousConstrain !== null) {
            // 单独配置为 true 的约束不会被一次 Shift 操作永久关闭。
            this.tool.constrain = this._previousConstrain;
            this._previousConstrain = null;
        }
        const centered = this.isPressed(this.centerCode) && !this.isPressed("Control");
        // 中心起点仅在 C 完整按住期间生效。
        if (centered) {
            this.tool.origin = "center";
            this._centerHeld = true;
        } else if (this._centerHeld) {
            // 此快捷键按要求回到 left，不保留进入前的起点选项。
            this.tool.origin = "left";
            this._centerHeld = false;
        }
    }

    /**
     * 点击动作在完整的按下与松开之后执行一次。
     * @param action 已完成的动作
     * @example
     * this.activateClick("view");
     * @returns 无返回值。
     */
    private activateClick(action: ClickAction): void {
        // 模式点击可发生在 Ctrl 或 Alt 按住期间，先更新待恢复值。
        if (action === "view" || action === "edit" || action === "group") {
            // 按住 Ctrl/Alt 时更新待恢复模式，松开修饰键后才真正切换。
            if (this._previousMode !== null) {
                this._previousMode = action;
            } else {
                this.tool.activeType = action;
            }
        } else if (action === "mult") {
            // 多选是持久开关，每次完整点击翻转一次。
            this.tool.mult = !this.tool.mult;
        } else if (action === "step") {
            // 一种步进若仍关闭，本次点击先把平移和旋转步进统一打开。
            const enabled = !(this.tool.translationStepEnabled && this.tool.rotationStepEnabled);
            this.tool.translationStepEnabled = enabled;
            this.tool.rotationStepEnabled = enabled;
        } else if (action === "snap") {
            // 单独 P 才切换吸附；Ctrl+P 等浏览器组合键不应顺带改变编辑状态。
            const configuredChord = this.codes(this.snapCode).length > 1;
            const plainClick = this.hasPressedModifier() === false;
            // 自定义组合快捷键按其配置执行；默认单键只接受无修饰键的点击。
            if (configuredChord || plainClick) {
                this.tool.snap = !this.tool.snap;
            }
        } else if (action === "snapVertex") {
            // 分项开关不改变总开关，便于预先配置下次启用的吸附类型。
            this.tool.snapOptions.vertex = !this.tool.snapOptions.vertex;
        } else if (action === "snapEdge") {
            // 边线吸附与轮廓顶点独立。
            this.tool.snapOptions.edge = !this.tool.snapOptions.edge;
        } else if (action === "snapIntersection") {
            // 交点仅由实际轮廓边产生。
            this.tool.snapOptions.intersection = !this.tool.snapOptions.intersection;
        } else if (action === "snapGrid") {
            // 网格使用 HelperGrid 当前缩放对应的细格。
            this.tool.snapOptions.grid = !this.tool.snapOptions.grid;
        } else if (action === "remove") {
            // 统一调用编辑器删除入口，保留通知与后续撤销接入点。
            this.tool.removeSelected();
        } else if (action === "copy") {
            // 复制只更新内存剪贴板，不改变场景。
            this.tool.copySelected();
        } else if (action === "paste") {
            // 粘贴经 push 统一进入编辑历史。
            this.tool.paste();
        } else if (action === "cut") {
            // 剪切使用删除入口，保持回调和撤销一致。
            this.tool.cutSelected();
        } else if (action === "undo") {
            // 每次点击只撤销一批编辑。
            this.tool.undo();
        } else if (action === "redo") {
            // 重做保持原来的 Mesh 引用。
            this.tool.redo();
        } else if (action === "save") {
            // 保存只抛出 JSON 给回调，不触发浏览器下载。
            this.tool.save();
        } else if (action === "selectAll") {
            // 全选沿用编辑器公开入口，保留选择回调与单选规则。
            this.tool.selectAll();
        } else {
            // 相机归零只改变平移位置，不重置视口缩放和角度。
            this.tool.camera.position.set(0, 0);
        }
    }

    /** @example this.syncCameraControl(); @returns 无返回值。 */
    private syncCameraControl(): void {
        const control = this._cameraControl;
        // 只接管编辑相关的左键和单指，右键与双指保留给控制器。
        if (control !== null) {
            // 查看模式恢复调用方原先的拖动权限，其余模式由编辑器接收输入。
            if (this.tool.activeType === "view") {
                control.leftDrag = this._originalLeftDrag;
                control.oFDrag = this._originalOFDrag;
            } else {
                control.leftDrag = false;
                control.oFDrag = false;
            }
        }
    }

    /**
     * 忽略文本输入目标，避免编辑快捷键干扰表单输入。
     * @param target 键盘事件目标
     * @example
     * const editing = this.isTextInput(event.target);
     * @returns 目标是否是文本或表单控件。
     */
    private isTextInput(target: EventTarget | null): boolean {
        // 输入框和可编辑节点保留浏览器自己的文字输入行为。
        if (target instanceof HTMLElement) {
            return target.isContentEditable || target.closest("input, textarea, select") !== null;
        } else {
            return false;
        }
    }

    /**
     * 与点击快捷键区分，降级在首次完整按下时执行。
     * @param pressedCode 刚按下的实际按键
     * @example const converted = this.activateBase("KeyB");
     * @returns 是否接管本次降级快捷键。
     */
    private activateBase(pressedCode: string): boolean {
        let extraModifier = false;
        // 默认 B 不抢占 Ctrl+B 等浏览器组合；自定义组合要求修饰键明确出现。
        for (const pressed of this._pressed) {
            const modifier = pressed.startsWith("Control") || pressed.startsWith("Alt") ||
                pressed.startsWith("Shift") || pressed.startsWith("Meta");
            // 未配置的修饰键意味着此输入属于另一个组合。
            if (modifier && this.includesCode(this.baseCode, pressed) === false) {
                extraModifier = true;
            }
        }
        const matched = this.includesCode(this.baseCode, pressedCode) &&
            this.isPressed(this.baseCode) && extraModifier === false;
        // 自动重复已被 keydown 入口过滤，同一按住周期不会重复转换。
        if (matched) {
            // 自定义映射重叠时，立即动作替代待松开的点击动作。
            for (const [action, code] of this._armedClicks) {
                // 本轮按下键所属的待执行点击不能在松开时再执行。
                if (this.includesCode(code, pressedCode)) {
                    this._armedClicks.delete(action);
                }
            }
            this.tool.toBase();
        }
        return matched;
    }

    /**
     * 首次按下记录按键和待完成的点击操作。
     * @param event 窗口键盘事件
     * @example
     * this.handleKeyDown(event);
     * @returns 无返回值。
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // 自动重复不属于新的点击，表单输入也不接管。
        if (!this._destroyed && !event.repeat && !this.isTextInput(event.target) && !this._pressed.has(event.code)) {
            const addWasPressed = this.isPressed(this.addCode);
            const subWasPressed = this.isPressed(this.subCode);
            this._pressed.add(event.code);
            // 组合刚刚补齐时记录先后次序，解决 Ctrl 与 Alt 同时按住的优先级。
            if (!addWasPressed && this.isPressed(this.addCode)) {
                this._addOrder = ++this._pressOrder;
            }
            // 减选键也使用相同的先后次序机制。
            if (!subWasPressed && this.isPressed(this.subCode)) {
                this._subOrder = ++this._pressOrder;
            }
            this.syncMode();
            this.syncTemporaryOptions();
            this.armClicks(event.code);
            // 主动降级独立于松开点击，在首次按下时立即更新几何。
            if (this.activateBase(event.code)) {
                event.preventDefault();
            }
            // 阻止 Space 滚动和组合键默认行为；对象操作仍在松开时执行。
            if (this.isPressed(this.removeCode) || this.isPressed(this.cameraResetCode) ||
                this.isPressed(this.copyCode) || this.isPressed(this.pasteCode) ||
                this.isPressed(this.cutCode) || this.isPressed(this.undoCode) ||
                this.isPressed(this.redoCode) || this.isPressed(this.redoAlternateCode) ||
                this.isPressed(this.saveCode) || this.isPressed(this.selectAllCode)) {
                event.preventDefault();
            }
        }
    }

    /**
     * 松开组合中的任意一键才确认一次点击，然后同步按住状态。
     * @param event 窗口键盘事件
     * @example
     * this.handleKeyUp(event);
     * @returns 无返回值。
     */
    private handleKeyUp(event: KeyboardEvent): void {
        // 未在本控制器按下的键不允许完成点击动作。
        if (!this._destroyed && this._pressed.has(event.code)) {
            const completed: ClickAction[] = [];
            // 在删除当前按键之前判断完整组合，保证点击只执行一次。
            for (const [action, code] of this._armedClicks) {
                // 当前松开键必须属于该组合。
                if (this.includesCode(code, event.code) && this.isPressed(code) && this.isTextInput(event.target) === false) {
                    completed.push(action);
                }
            }
            this._pressed.delete(event.code);
            // 仅撤销涉及当前松开键的候选，其他仍按住的点击组合继续等待。
            for (const [action, code] of this._armedClicks) {
                // 组合已断开或本次完成后都应解除武装。
                if (this.includesCode(code, event.code) || !this.isPressed(code)) {
                    this._armedClicks.delete(action);
                }
            }
            this.syncMode();
            this.syncTemporaryOptions();
            // 所有点击均在键松开后执行，浏览器默认动作在必要时被阻止。
            for (const action of completed) {
                this.activateClick(action);
                // 快捷键已接管删除和相机复位，松开时阻止浏览器再处理此事件。
                if (action === "remove" || action === "cameraReset" || action === "copy" ||
                    action === "paste" || action === "cut" || action === "undo" ||
                    action === "redo" || action === "save" || action === "selectAll") {
                    event.preventDefault();
                }
            }
        }
    }

    /** @example this.handleBlur(); @returns 无返回值。 */
    private handleBlur(): void {
        // 失焦既取消未完成点击，也恢复所有临时模式和操作约束。
        this._pressed.clear();
        this._armedClicks.clear();
        this.syncMode();
        this.syncTemporaryOptions();
    }

    /** @example keys.destroy(); @returns 无返回值。 */
    public destroy(): void {
        // 反复销毁不能再访问已撤销的事件控制器。
        if (!this._destroyed) {
            this.handleBlur();
            this._events.abort();
            this.tool.onModeChangeDelete(this._modeListenerKey);
            // 不永久改写外部控制器的配置。
            if (this._cameraControl !== null) {
                this._cameraControl.leftDrag = this._originalLeftDrag;
                this._cameraControl.oFDrag = this._originalOFDrag;
            }
            this._destroyed = true;
        }
    }
}

/** 矩形与文字共用的快捷键结构，内容保存格式由具体工具决定。 */
type RectKeyTarget = Pick<RectEditTool, "activeType" | "camera" | "constrain" | "copySelected" |
    "cutSelected" | "mult" | "onModeChange" | "onModeChangeDelete" | "origin" | "paste" |
    "redo" | "removeSelected" | "rotationStepEnabled" | "snap" | "snapOptions" |
    "translationStepEnabled" | "undo" | "selectAll" | "toBase"> & {
    /** @example target.save(); @returns 各工具的可序列化文档。 */
        save(): unknown;
    };

type ClickAction = "view" | "edit" | "group" | "mult" | "remove" | "cameraReset" |
    "copy" | "paste" | "cut" | "undo" | "redo" | "save" | "selectAll" | "step" | "snap" |
    "snapVertex" | "snapEdge" | "snapIntersection" | "snapGrid";

interface ClickBinding {
    action: ClickAction;
    code: string;
}

export default RectEditToolKey;
