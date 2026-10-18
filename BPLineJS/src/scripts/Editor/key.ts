import type CameraControl from "../Control/CameraControl";
import type Editor from "./index";
import type { BooleanOperation, EditorMode, EditorShape } from "./index";

/** 合并编辑器唯一的窗口快捷键监听器，避免三个独立工具重复响应组合键。 */
class EditorKey {
    /** 受快捷键控制的合并编辑器。 */
    public readonly editor: Editor;
    /** E 与 R 同时按下切换 Rect 编辑。 */
    public rectCode: string = "KeyE+KeyR";
    /** E 与 N 同时按下切换 NGon 编辑。 */
    public ngonCode: string = "KeyE+KeyN";
    /** E 与 P 同时按下切换 Poly 编辑。 */
    public polyCode: string = "KeyE+KeyP";
    /** E 与 T 同时按下切换文字编辑。 */
    public textCode: string = "KeyE+KeyT";
    /** 对象删除键，文字输入内 Delete 仅编辑内容。 */
    public removeCode: string = "Delete";
    /** 对象剪贴板复制、粘贴与剪切组合键。 */
    public copyCode: string = "Control+KeyC";
    /** 粘贴对象组合键。 */
    public pasteCode: string = "Control+KeyV";
    /** 剪切对象组合键。 */
    public cutCode: string = "Control+KeyX";
    /** 跨几何类型撤销组合键。 */
    public undoCode: string = "Control+KeyZ";
    /** 跨几何类型重做组合键。 */
    public redoCode: string = "Control+KeyY";
    /** 重做的备用组合键。 */
    public redoAlternateCode: string = "Control+Shift+KeyZ";
    /** 全选当前启用的可编辑实体。 */
    public selectAllCode: string = "Control+KeyA";
    /** 输出集合 JSON 并触发 editor.onSave，不触发浏览器保存页面。 */
    public saveCode: string = "Control+KeyS";
    /** 首次按下时主动降级已选几何，默认 B；输入文字时不接管。 */
    public baseCode: string = "KeyB";
    /** 取消当前编辑手势和选择。 */
    public cancelCode: string = "Escape";
    /** 点击后把相机位置移回世界原点。 */
    public cameraResetCode: string = "Space";
    /** 按住时临时以中心为新建起点，松开恢复原配置。 */
    public centerCode: string = "KeyC";
    /** E 与 G 同时按下切换真实 Group 层级编辑。 */
    public createGroupCode: string = "KeyE+KeyG";
    /** 单独松开 E 切换编辑模式。 */
    public editCode: string = "KeyE";
    /** 单独松开 V 切换查看模式。 */
    public viewCode: string = "KeyV";
    /** 单独松开 G 切换组模式。 */
    public groupCode: string = "KeyG";
    /** 按住时增选。 */
    public addCode: string = "Control";
    /** 按住时减选。 */
    public subCode: string = "Alt";
    /** 按住 - 后点击 B，以当前选择 A 减去 B，保留 B。可改为 NumpadSubtract 等键位。 */
    public subtractCode: string = "Minus";
    /** 按住 = 后点击 B，合并当前选择 A 与 B。 */
    public unionCode: string = "Equal";
    /** 按住时启用轴向约束。 */
    public constrainCode: string = "Shift";
    /** 点击后切换吸附。 */
    public snapCode: string = "KeyP";
    /** 切换顶点吸附分项。 */
    public snapVertexCode: string = "KeyP+Digit1";
    /** 切换边线吸附分项。 */
    public snapEdgeCode: string = "KeyP+Digit2";
    /** 切换交点吸附分项。 */
    public snapIntersectionCode: string = "KeyP+Digit3";
    /** 切换网格吸附分项。 */
    public snapGridCode: string = "KeyP+Digit4";
    /** 点击后切换步进。 */
    public stepCode: string = "KeyS";
    /** 点击后切换多选。 */
    public multCode: string = "KeyM";
    /** 点击后切换 Poly2D 新建路径是否闭合。 */
    public closedCode: string = "KeyF";
    /** NGon 新建边数：3–9 单键，10–90 使用十位键与 0。 */
    public sideCodes = new Map<number, string>();

    private readonly _pressed = new Set<string>();
    private readonly _pendingActions = new Map<string, PendingAction>();
    private readonly _previousConstrain = new Map<TemporaryTarget, boolean>();
    private readonly _previousOrigin = new Map<TemporaryTarget, "left" | "center">();
    private readonly _usedInChord = new Set<string>();
    private readonly _events: AbortController = new AbortController();
    private readonly _cameraControl: CameraControl | null;
    private readonly _originalLeftDrag: boolean;
    private readonly _originalOFDrag: boolean;
    private _modifierMode: EditorMode | null = null;
    private _booleanOverride: boolean = false;
    private _previousBooleanOperation: BooleanOperation | null = null;
    private static _nextListenerId: number = 0;
    private readonly _modeListenerKey: string = `EditorKey:${String(EditorKey._nextListenerId)}`;

    /**
     * 注册一组窗口快捷键，并可选同步相机左键与单指开关。
     * @param editor 合并编辑器
     * @param cameraControl 可选的相机控制器
     * @example const keys = new EditorKey(editor, cameraControl);
     * @returns 快捷键控制器。
     */
    public constructor(editor: Editor, cameraControl: CameraControl | null = null) {
        this.editor = editor;
        // 与独立 NGon 编辑器保持相同的低边数映射。
        for (let sides = 3; sides <= 9; sides++) {
            this.sideCodes.set(sides, `Digit${String(sides)}`);
        }
        // 高边数只提供 10–90 的十位组合，不建立密集顶点快捷键。
        for (let tens = 1; tens <= 9; tens++) {
            this.sideCodes.set(tens * 10, `Digit${String(tens)}+Digit0`);
        }
        this._cameraControl = cameraControl;
        this._originalLeftDrag = cameraControl?.leftDrag ?? false;
        this._originalOFDrag = cameraControl?.oFDrag ?? false;
        EditorKey._nextListenerId += 1;
        editor.onModeChange(this._modeListenerKey, this.syncCameraControl.bind(this));
        const signal = this._events.signal;
        window.addEventListener("keydown", this.handleKeyDown.bind(this), { signal });
        window.addEventListener("keyup", this.handleKeyUp.bind(this), { signal });
        window.addEventListener("blur", this.handleBlur.bind(this), { signal });
        window.addEventListener("focusin", this.handleFocus.bind(this), { signal });
        editor.render.canvas.addEventListener("pointerdown", this.handleEditorPointerDown.bind(this),
            { signal, capture: true });
        this.syncCameraControl();
    }

    /** @param event 画布按下事件 @example keys.handleEditorPointerDown(event); @returns 无返回值。 */
    private handleEditorPointerDown(event: PointerEvent): void {
        const control = this._cameraControl;
        // 编辑手势开始前结束滚轮和拖动尾速，避免顶点跟随仍在运动的相机抖动。
        if (control !== null && this.editor.activeType !== "view" &&
            (event.pointerType === "touch" || (event.pointerType === "mouse" && event.button === 0))) {
            control.stopMotion();
        }
    }

    /**
     * 记录键位并优先处理编辑器类型组合键。
     * @param event 键盘按下事件
     * @example keys.handleKeyDown(event);
     * @returns 无返回值。
     */
    public handleKeyDown(event: KeyboardEvent): void {
        // 区分单键、组合键和修饰键的生命周期，防止误触发。
        if (IsTypingTarget(event.target)) {
            return;
        }
        const code = NormalizeCode(event.code);
        const wasPressed = this._pressed.has(code);
        this._pressed.add(code);
        this.syncTemporaryOptions();
        const browserModifier = this._pressed.has("Control") || this._pressed.has("Alt") ||
            this._pressed.has("Meta");
        // 浏览器组合即使未由编辑器接管，也不能在先松开修饰键后触发普通单键。
        if (browserModifier) {
            // 已按下的字母也覆盖，处理先按字母、后按 Ctrl 的顺序。
            for (const pressed of this._pressed) {
                this._usedInChord.add(pressed);
            }
        }
        const shapes: { code: string; shape: EditorShape }[] = [
            { code: this.rectCode, shape: "rect" },
            { code: this.ngonCode, shape: "ngon" },
            { code: this.polyCode, shape: "poly" },
            { code: this.textCode, shape: "text" },
            { code: this.createGroupCode, shape: "group" },
        ];
        let used = this.queueAction(code);
        // 布尔是按住状态，不排入 keyup 点击队列，长按自动重复不会重复运算。
        if (this._booleanOverride) {
            used = true;
            this._usedInChord.add(code);
        }
        // 主动降级在首次完整按下时执行，不等待松开，也不接受自动重复。
        if (wasPressed === false && event.repeat === false && this.activateBase(code)) {
            used = true;
        }
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (const item of shapes) {
            const parts = item.code.split("+");
            /** @param part 组合键中的一段 @example IsPressed("KeyE"); @returns 此键是否仍按住。 */
            const IsPressed = (part: string): boolean => this._pressed.has(NormalizeCode(part));
            // 区分单键、组合键和修饰键的生命周期，防止误触发。
            if (parts.length > 1 && parts.every(IsPressed) && this.hasExtraModifier(parts) === false) {
                this.editor.shape = item.shape;
                this.editor.activeType = "edit";
                this.syncCameraControl();
                // 依次处理当前集合，保持对象顺序并避免遗漏成员。
                for (const part of parts) {
                    this._usedInChord.add(NormalizeCode(part));
                }
                used = true;
            }
        }
        // 区分按住与点击操作，组合键不应触发单键动作。
        if (code === NormalizeCode(this.constrainCode) || code === NormalizeCode(this.centerCode)) {
            used = true;
        }
        // 区分按住与点击操作，组合键不应触发单键动作。
        if (code === NormalizeCode(this.addCode) || code === NormalizeCode(this.subCode)) {
            this._modifierMode ??= this.editor.activeType;
            // 区分按住与点击操作，组合键不应触发单键动作。
            if (code === NormalizeCode(this.subCode)) {
                this.editor.activeType = "sub";
            } else {
                this.editor.activeType = "add";
            }
            used = true;
        }
        // 区分单键、组合键和修饰键的生命周期，防止误触发。
        if (used) {
            event.preventDefault();
        }
    }

    /**
     * 仅在完整按下并松开后执行单键切换，组合键中的 E/P 不单独触发。
     * @param event 键盘松开事件
     * @example keys.handleKeyUp(event);
     * @returns 无返回值。
     */
    public handleKeyUp(event: KeyboardEvent): void {
        const code = NormalizeCode(event.code);
        const actions: PendingAction[] = [];
        // 组合中任意一键松开完成一次点击；不完整或失焦的组合不会执行。
        for (const [chord, pending] of this._pendingActions) {
            // 只结束包含本次松开键的候选，其他按住的组合继续等待。
            if (pending.parts.includes(code)) {
                /** @param part 组合中的按键 @example IsPressed("Control"); @returns 是否仍按住。 */
                const IsPressed = (part: string): boolean => this._pressed.has(part);
                // 输入控件内的组合仍由原生文字输入处理。
                if (pending.parts.every(IsPressed) && IsTypingTarget(event.target) === false) {
                    actions.push(pending);
                }
                this._pendingActions.delete(chord);
            }
        }
        const wasPressed = this._pressed.delete(code);
        // 已完成的组合各执行一次，长按的重复 keydown 不会增加点击数量。
        for (const pending of actions) {
            pending.action();
        }
        const usedInChord = this._usedInChord.delete(code);
        this.syncTemporaryOptions();
        // 区分按住与点击操作，组合键不应触发单键动作。
        if (code === NormalizeCode(this.addCode) || code === NormalizeCode(this.subCode)) {
            let otherModifier = this.addCode;
            // 区分按住与点击操作，组合键不应触发单键动作。
            if (code === NormalizeCode(this.addCode)) {
                otherModifier = this.subCode;
            }
            // 区分按住与点击操作，组合键不应触发单键动作。
            if (this._pressed.has(NormalizeCode(otherModifier))) {
                // 区分按住与点击操作，组合键不应触发单键动作。
                if (NormalizeCode(otherModifier) === NormalizeCode(this.subCode)) {
                    this.editor.activeType = "sub";
                } else {
                    this.editor.activeType = "add";
                }
            } else if (this._modifierMode !== null) {
                // 当前模式独占此类输入，避免多个编辑器同时响应。
                this.editor.activeType = this._modifierMode;
                this._modifierMode = null;
            }
        } else if (wasPressed && !usedInChord && !IsTypingTarget(event.target) &&
            this._pressed.has("Control") === false && this._pressed.has("Alt") === false &&
            this._pressed.has("Meta") === false) {
            // 区分单键、组合键和修饰键的生命周期，防止误触发。
            // 区分按住与点击操作，组合键不应触发单键动作。
            if (code === NormalizeCode(this.editCode)) {
                this.editor.activeType = "edit";
            } else if (code === NormalizeCode(this.viewCode)) {
                // 区分按住与点击操作，组合键不应触发单键动作。
                this.editor.activeType = "view";
            } else if (code === NormalizeCode(this.groupCode)) {
                // 区分按住与点击操作，组合键不应触发单键动作。
                this.editor.activeType = "group";
            } else if (code === NormalizeCode(this.snapCode)) {
                // 与独立工具一致，默认 P 不附带执行 Shift+P 的浏览器组合。
                if (this._pressed.has("Shift") === false) {
                    this.editor.snap = !this.editor.snap;
                }
            } else if (code === NormalizeCode(this.stepCode)) {
                // 候选仅在对应功能启用时参与计算，减少无效工作。
                this.setStep(!this.editor.rectEditTool.translationStepEnabled);
            } else if (code === NormalizeCode(this.multCode)) {
                // 区分按住与点击操作，组合键不应触发单键动作。
                this.editor.mult = !this.editor.mult;
            } else if (code === NormalizeCode(this.closedCode)) {
                // 区分按住与点击操作，组合键不应触发单键动作。
                this.editor.polyEditTool.closed = !this.editor.polyEditTool.closed;
            }
        }
        // 区分单键、组合键和修饰键的生命周期，防止误触发。
        if (wasPressed) {
            event.preventDefault();
        }
        this.syncCameraControl();
    }

    /** @example keys.handleBlur(); @returns 无返回值。 */
    public handleBlur(): void {
        this._pressed.clear();
        this._pendingActions.clear();
        this._usedInChord.clear();
        this.syncTemporaryOptions();
        // 当前模式独占此类输入，避免多个编辑器同时响应。
        if (this._modifierMode !== null) {
            this.editor.activeType = this._modifierMode;
            this._modifierMode = null;
        }
        this.syncCameraControl();
    }

    /** @param event 焦点进入事件 @example this.handleFocus(event); @returns 无返回值，文字控件接管按键时撤销临时模式。 */
    private handleFocus(event: FocusEvent): void {
        // 按住符号键后进入文字输入也不能留下几何布尔状态。
        if (IsTypingTarget(event.target)) {
            this.handleBlur();
        }
    }

    /** @example keys.destroy(); @returns 无返回值。 */
    public destroy(): void {
        this._events.abort();
        this.editor.onModeChangeDelete(this._modeListenerKey);
        this.handleBlur();
        // 区分单键、组合键和修饰键的生命周期，防止误触发。
        if (this._cameraControl !== null) {
            this._cameraControl.leftDrag = this._originalLeftDrag;
            this._cameraControl.oFDrag = this._originalOFDrag;
        }
    }

    /** @param code 本次按下的键 @example this.activateBase("KeyB"); @returns 是否执行了主动降级。 */
    private activateBase(code: string): boolean {
        const parts = this.baseCode.split("+").map(NormalizeCode);
        /** @param part 配置中的单键 @example Pressed("KeyB"); @returns 是否仍按下。 */
        const Pressed = (part: string): boolean => this._pressed.has(part);
        const matched = parts.includes(code) && parts.every(Pressed) && this.hasExtraModifier(parts) === false;
        // 当前输入必须补齐整个配置，其他键不触发降级。
        if (matched) {
            // 自定义键位重叠时清除待点击操作，避免松开时再切换模式。
            for (const [chord, pending] of this._pendingActions) {
                // 同一按键组合由立即降级接管。
                if (pending.parts.includes(code)) {
                    this._pendingActions.delete(chord);
                }
            }
            // 标记所有组合成员，松开修饰键后不再执行普通字母键动作。
            for (const part of parts) {
                this._usedInChord.add(part);
            }
            this.editor.toBase();
        }
        return matched;
    }

    /** @param code 本次按下的键 @example this.queueAction("KeyZ"); @returns 是否命中了对象操作组合。 */
    private queueAction(code: string): boolean {
        const actions: [string, () => unknown][] = [
            [this.removeCode, this.editor.removeSelected.bind(this.editor)],
            [this.copyCode, this.editor.copySelected.bind(this.editor)],
            [this.pasteCode, this.editor.paste.bind(this.editor)],
            [this.cutCode, this.editor.cutSelected.bind(this.editor)],
            [this.undoCode, this.editor.undo.bind(this.editor)],
            [this.redoCode, this.editor.redo.bind(this.editor)],
            [this.redoAlternateCode, this.editor.redo.bind(this.editor)],
            [this.selectAllCode, this.editor.selectAll.bind(this.editor)],
            [this.saveCode, this.editor.save.bind(this.editor)],
            [this.cancelCode, this.cancelEdit.bind(this)],
            [this.cameraResetCode, this.resetCamera.bind(this)],
            [this.snapVertexCode, this.toggleSnap.bind(this, "vertex")],
            [this.snapEdgeCode, this.toggleSnap.bind(this, "edge")],
            [this.snapIntersectionCode, this.toggleSnap.bind(this, "intersection")],
            [this.snapGridCode, this.toggleSnap.bind(this, "grid")],
        ];
        const hasModifier = this._pressed.has("Control") || this._pressed.has("Alt") ||
            this._pressed.has("Shift") || this._pressed.has("Meta");
        // 数字键只在 NGon 新建模式生效，P 分项和浏览器组合不同时改变边数。
        if (this.editor.shape === "ngon" && hasModifier === false &&
            this.isChordPressed(this.snapCode) === false) {
            // 映射与独立编辑器一致，也允许用户自定义每个边数的按键。
            for (const [sides, chord] of this.sideCodes) {
                actions.push([chord, this.setSides.bind(this, sides)]);
            }
        }
        let match: PendingAction | null = null;
        // 先找最完整的组合，再取消之前被它覆盖的候选。
        for (const [chord, action] of actions) {
            const parts = chord.split("+").map(NormalizeCode);
            /** @param part 组合中的键 @example Pressed("Control"); @returns 是否仍按下。 */
            const Pressed = (part: string): boolean => this._pressed.has(part);
            // 仅首个完整匹配的组合排队，避免同一次松开执行两个动作。
            if (parts.includes(code) && parts.every(Pressed) && this.hasExtraModifier(parts) === false) {
                // Ctrl+Shift+Z、P+数字和数字+0 均覆盖先前较短的候选。
                if (match === null || parts.length > match.parts.length) {
                    match = { parts, action };
                }
            }
        }
        // 修饰键中途加入时，撤销未显式配置该修饰键的待执行操作。
        for (const [chord, pending] of this._pendingActions) {
            let overlapping = false;
            // 新长组合中的任意一键都可能与旧短组合重叠。
            if (match !== null) {
                // 只替换共享按键的操作，不打断无关且仍按住的组合。
                for (const part of pending.parts) {
                    // 一个共享键已足以表示本轮组合被更具体的配置接管。
                    if (match.parts.includes(part)) {
                        overlapping = true;
                    }
                }
            }
            // 被覆盖或追加了未配置修饰键的候选不再等待松开。
            if (overlapping || this.hasExtraModifier(pending.parts)) {
                this._pendingActions.delete(chord);
            }
        }
        let matched = false;
        // 组合中的键在松开时不再触发 E、V、P、S 等单键动作。
        if (match !== null) {
            this._pendingActions.set(match.parts.join("+"), match);
            // 保留到各键分别松开，防止先松开修饰键后又触发普通模式。
            for (const part of match.parts) {
                this._usedInChord.add(part);
            }
            matched = true;
        }
        return matched;
    }

    /** @param parts 组合中显式配置的按键 @example this.hasExtraModifier(["Control", "KeyA"]); @returns 是否还有未配置的修饰键。 */
    private hasExtraModifier(parts: readonly string[]): boolean {
        let extra = false;
        // 默认单键不应抢占 Ctrl/Alt/Meta/Shift 的浏览器组合。
        for (const modifier of ["Control", "Alt", "Meta", "Shift"]) {
            // 用户显式配置的修饰键才属于当前组合。
            if (this._pressed.has(modifier) && parts.includes(modifier) === false) {
                extra = true;
            }
        }
        return extra;
    }

    /** @param chord 单键或加号组合 @example this.isChordPressed("KeyP+Digit1"); @returns 组合是否完整按住。 */
    private isChordPressed(chord: string): boolean {
        const parts = chord.split("+").map(NormalizeCode);
        /** @param part 组合中的按键 @example IsPressed("KeyP"); @returns 是否仍按住。 */
        const IsPressed = (part: string): boolean => this._pressed.has(part);
        return parts.every(IsPressed);
    }

    /** @example this.syncTemporaryOptions(); @returns 无返回值，更新按住的约束和中心起点并恢复原配置。 */
    private syncTemporaryOptions(): void {
        this.syncBooleanOperation();
        const tools = [this.editor.rectEditTool, this.editor.ngonEditTool,
            this.editor.polyEditTool, this.editor.textEditTool];
        const constrained = this.isChordPressed(this.constrainCode);
        const centered = this.isChordPressed(this.centerCode) && this._pressed.has("Control") === false;
        // 每个工具分别保存原设置，松开快捷键后恢复调用方手动配置。
        for (const tool of tools) {
            // 同一按住期间只捕获一次约束原值。
            if (constrained) {
                // 第一次覆盖才记录原状态，避免重复 keydown 把 true 当作原值。
                if (this._previousConstrain.has(tool) === false) {
                    this._previousConstrain.set(tool, tool.constrain);
                }
                tool.constrain = true;
            } else {
                const previous = this._previousConstrain.get(tool);
                // 没有覆盖记录的工具无需改动。
                if (previous !== undefined) {
                    tool.constrain = previous;
                    this._previousConstrain.delete(tool);
                }
            }
            // Ctrl+C 只做复制，不顺带把绘制起点改为中心。
            if (centered) {
                // 各工具默认起点可能不同，按下前的设置分别记录。
                if (this._previousOrigin.has(tool) === false) {
                    this._previousOrigin.set(tool, tool.origin);
                }
                tool.origin = "center";
            } else {
                const previous = this._previousOrigin.get(tool);
                // 松开或失焦时恢复原起点，不强制改成同一个模式。
                if (previous !== undefined) {
                    tool.origin = previous;
                    this._previousOrigin.delete(tool);
                }
            }
        }
    }

    /** @example this.syncBooleanOperation(); @returns 无返回值，同步按住的布尔操作，松开和失焦恢复原值。 */
    private syncBooleanOperation(): void {
        let operation: BooleanOperation | null = null;
        const bindings: { code: string; operation: BooleanOperation }[] = [
            { code: this.unionCode, operation: "union" },
            { code: this.subtractCode, operation: "difference" },
        ];
        // 显式组合可自定义；未配置的 Ctrl/Meta 等修饰键保留浏览器缩放语义。
        for (const binding of bindings) {
            const parts = binding.code.split("+").map(NormalizeCode);
            // 两个操作同时按住时减法优先，松开后回到仍然按住的另一项。
            if (this.isChordPressed(binding.code) && this.hasExtraModifier(parts) === false) {
                operation = binding.operation;
            }
        }
        // 首次覆盖保存程序配置，重复 keydown 不改写恢复值。
        if (operation !== null) {
            // 没有按住覆盖时才读取原值。
            if (this._booleanOverride === false) {
                this._previousBooleanOperation = this.editor.booleanOperation;
                this._booleanOverride = true;
            }
            this.editor.booleanOperation = operation;
        } else if (this._booleanOverride) {
            // 松开、失焦或额外修饰键进入时立即退出按住操作。
            this.editor.booleanOperation = this._previousBooleanOperation;
            this._booleanOverride = false;
        }
    }

    /** @param option 吸附分项 @example this.toggleSnap("vertex"); @returns 无返回值。 */
    private toggleSnap(option: keyof Editor["snapOptions"]): void {
        this.editor.snapOptions[option] = !this.editor.snapOptions[option];
    }

    /** @param sides 下一次创建的 NGon 边数 @example this.setSides(6); @returns 无返回值。 */
    private setSides(sides: number): void {
        this.editor.ngonEditTool.sides = sides;
    }

    /** @example this.resetCamera(); @returns 无返回值，只复位位置并停止旧惯性。 */
    private resetCamera(): void {
        this._cameraControl?.stopMotion();
        this.editor.camera.position.set(0, 0);
    }

    /** @example this.cancelEdit(); @returns 无返回值，取消手势、选择并回到普通编辑模式。 */
    private cancelEdit(): void {
        this.editor.cancel();
        this.editor.select([]);
        this.editor.activeType = "edit";
    }

    /** @param enabled 世界步进和旋转步进开关 @example this.setStep(true); @returns 无返回值。 */
    private setStep(enabled: boolean): void {
        this.editor.rectEditTool.translationStepEnabled = enabled;
        this.editor.rectEditTool.rotationStepEnabled = enabled;
        this.editor.ngonEditTool.translationStepEnabled = enabled;
        this.editor.ngonEditTool.rotationStepEnabled = enabled;
        this.editor.polyEditTool.translationStepEnabled = enabled;
        this.editor.polyEditTool.rotationStepEnabled = enabled;
        this.editor.textEditTool.translationStepEnabled = enabled;
        this.editor.textEditTool.rotationStepEnabled = enabled;
    }

    /** @example this.syncCameraControl(); @returns 无返回值。 */
    private syncCameraControl(): void {
        const control = this._cameraControl;
        // 区分单键、组合键和修饰键的生命周期，防止误触发。
        if (control !== null) {
            // 区分单键、组合键和修饰键的生命周期，防止误触发。
            if (this.editor.activeType === "view") {
                control.leftDrag = this._originalLeftDrag;
                control.oFDrag = this._originalOFDrag;
            } else {
                control.leftDrag = false;
                control.oFDrag = false;
            }
        }
    }
}

interface PendingAction {
    parts: string[];
    action: () => unknown;
}

interface TemporaryTarget {
    constrain: boolean;
    origin: "left" | "center";
}

/** @param code KeyboardEvent.code 或不区分左右的修饰键 @example NormalizeCode("ControlLeft"); @returns 规范键名。 */
const NormalizeCode = (code: string): string => {
    // 区分按住与点击操作，组合键不应触发单键动作。
    if (code === "ControlLeft" || code === "ControlRight") {
        return "Control";
    } else if (code === "AltLeft" || code === "AltRight") {
        // 区分按住与点击操作，组合键不应触发单键动作。
        return "Alt";
    } else if (code === "ShiftLeft" || code === "ShiftRight") {
        // 区分按住与点击操作，组合键不应触发单键动作。
        return "Shift";
    } else if (code === "MetaLeft" || code === "MetaRight") {
        // Meta 也参与浏览器组合排除，避免 Cmd+P 等误触发单键编辑操作。
        return "Meta";
    } else {
        return code;
    }
};

/** @param target 事件目标 @example IsTypingTarget(event.target); @returns 是否是输入控件。 */
const IsTypingTarget = (target: EventTarget | null): boolean => {
    // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
    if (target instanceof HTMLElement) {
        return target.isContentEditable || target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    } else {
        return false;
    }
};

export default EditorKey;
export { EditorKey };
