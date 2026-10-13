import type { Vec2Like } from "bpmatrixjs/Math/Vec2";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { Time } from "bpmatrixjs/Utils";
import type Camera from "../../Camera";
import type Render from "../../Render";
import { DEFAULT_MAX_ZOOM, DEFAULT_MIN_ZOOM } from "./ZoomLimits";

class CameraControl implements CameraControlOptions {
    camera: Camera;
    render: Render;
    is: boolean = false;
    isActive: boolean = false;
    startEvent: Vec2 = new Vec2(0, 0);
    startCamera: Vec2 = new Vec2(0, 0);
    drag: boolean = true;
    /** 是否允许鼠标左键拖动，默认开启；不影响触屏手势。 */
    public leftDrag: boolean = true;
    /** 是否允许右键像左键一样拖动，默认开启；drag 是拖动总开关。 */
    public rightDrag: boolean = true;
    /** 是否允许单指触摸拖动，默认开启；关闭后仍跟踪触点以识别双指。 */
    public oFDrag: boolean = true;
    /** 是否允许双指触摸中心拖动，默认开启；不控制双指缩放和旋转。 */
    public tFDrag: boolean = true;
    /** 是否启用平移、旋转、缩放惯性，默认开启；关闭后下次 update 立即停止。 */
    public inertia: boolean = true;
    /** 每 100ms 保留的动量比例，默认 0.3；0 立即停止，越接近 1 滑行越久。 */
    public damp: number = 0.3;
    zoom: boolean = true;
    /** 是否允许双指旋转，默认开启；不改变鼠标操作。 */
    rotate: boolean = true;
    focus: Vec2 = new Vec2(0, 0);
    startZoom: number; // 开始相机缩放比例
    zoomRate: number = 1; // 滚轮缩放灵敏度；双指按实际距离比例缩放，不套用滚轮步进。
    private _minZoom: number = DEFAULT_MIN_ZOOM;
    private _maxZoom: number = DEFAULT_MAX_ZOOM;
    private readonly _zoomChange = new Map<string, CameraZoomChange>();
    private readonly _positionChange = new Map<string, CameraPositionChange>();
    private readonly _rotationChange = new Map<string, CameraRotationChange>();
    private readonly _change = new Map<string, CameraControlChange>();
    private _changeState: CameraControlState;
    /** 回调中的主动修改延后到本批通知结束，避免事件顺序交错。 */
    private _notifyingChange: boolean = false;
    /** 拖动时锁定在鼠标下的世界坐标，不混用相机局部 position。 */
    private readonly _dragWorld: Vec2 = new Vec2(0, 0);
    /** 当前按住的触点；未选中的触点只记录位置，不参与相机变换。 */
    private readonly _touches: Map<number, Vec2> = new Map<number, Vec2>();
    /** 当前手势锁定的 pointerId，最多两个；松开后不使用其他触点补位。 */
    private _touchKeys: number[] = [];
    /** 已建立过双指手势后，直到本轮所有手指松开才允许重新选点。 */
    private _pairLocked: boolean = false;
    /** 两个触点按下处的世界坐标，用于保持缩放、旋转时贴合手指。 */
    private readonly _touchWorld: [Vec2, Vec2] = [new Vec2(0, 0), new Vec2(0, 0)];
    /** 同一帧集中处理触点，既收集同时按下的手指，也避免双指分别更新时抖动。 */
    private _touchFrame: number | undefined = undefined;
    /** 鼠标与触控共用 Pointer Events，但不会同时控制相机。 */
    private _mouseKey: number | undefined = undefined;
    /** 当前鼠标拖动使用的按键，移动期间用于响应左右键开关变化。 */
    private _mouseButton: number = 0;
    /** 统一使用 Time.now 的毫秒时钟，不创建帧数或 FPS 日志。 */
    private _motionTime: number = Time.now();
    /** 最近 100ms 的轨迹，额外保留窗口左侧一条数据以插值到准确时间边界。 */
    private readonly _motion: CameraMotionSample[] = [];
    /** 局部坐标/秒、弧度/秒、对数缩放/秒；停止后全部归零。 */
    private readonly _velocity: {
        x: number;
        y: number;
        rotation: number;
        logZoom: number;
    } = { x: 0, y: 0, rotation: 0, logZoom: 0 };
    /** 最近 100ms 的滚轮缩放增量，单个滚轮刻度也能生成惯性。 */
    private readonly _wheelMotion: WheelMotionSample[] = [];
    /** 区分滚轮焦点缩放与拖动松手后的自由运动。 */
    private _wheelInertia: boolean = false;
    /** 最后一次滚轮事件的屏幕焦点，不跟随之后的鼠标悬停移动。 */
    private readonly _wheelScreen: Vec2 = new Vec2(0, 0);
    /** 滚轮惯性期间保持落在 _wheelScreen 下的世界坐标。 */
    private readonly _wheelWorld: Vec2 = new Vec2(0, 0);
    /** 注销控制器时统一移除监听器。 */
    private readonly _events: AbortController = new AbortController();
    /** 注销后恢复容器原有的浏览器触摸行为。 */
    private readonly _touchAction: string;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param camera 本次使用的相机
     * @param render 持有画布及 GPU 资源的渲染器
     * @example
     * const cameraControl = new CameraControl(camera, render);
     * @returns 创建的 CameraControl 对象。
     */
    constructor(camera: Camera, render: Render) {
        this.camera = camera;
        this.render = render;
        this.startZoom = camera.zoom;
        this._changeState = this._captureChangeState();
        this._touchAction = render.container.style.touchAction;
        this._constrainCameraZoom();
        this.init();
    }
    /** @param key 注册标识，同名替换 @param callback 新 zoom、旧 zoom、控制器 @example control.onZoom("ui", (zoom) => console.log(zoom)); @returns 无返回值。 */
    public onZoom(key: string, callback: CameraZoomChange): void {
        this._zoomChange.set(key, callback);
    }
    /** @param key 注册标识 @example control.deleteZoom("ui"); @returns 是否移除了已有回调。 */
    public deleteZoom(key: string): boolean {
        return this._zoomChange.delete(key);
    }
    /** @param key 注册标识，同名替换 @param callback 新位置快照、旧位置快照、控制器 @example control.onPosition("ui", (position) => console.log(position.x)); @returns 无返回值，位置使用相机父级局部坐标。 */
    public onPosition(key: string, callback: CameraPositionChange): void {
        this._positionChange.set(key, callback);
    }
    /** @param key 注册标识 @example control.deletePosition("ui"); @returns 是否移除了已有回调。 */
    public deletePosition(key: string): boolean {
        return this._positionChange.delete(key);
    }
    /** @param key 注册标识，同名替换 @param callback 新弧度、旧弧度、控制器 @example control.onRotation("ui", (rotation) => console.log(rotation)); @returns 无返回值。 */
    public onRotation(key: string, callback: CameraRotationChange): void {
        this._rotationChange.set(key, callback);
    }
    /** @param key 注册标识 @example control.deleteRotation("ui"); @returns 是否移除了已有回调。 */
    public deleteRotation(key: string): boolean {
        return this._rotationChange.delete(key);
    }
    /** @param key 注册标识，同名替换 @param callback 当前快照、上次快照、控制器 @example control.onChange("render", () => render.render(scene, camera)); @returns 无返回值，一次组合变换只通知一次，外部修改在 update 时检测。 */
    public onChange(key: string, callback: CameraControlChange): void {
        this._change.set(key, callback);
    }
    /** @param key 注册标识 @example control.deleteChange("render"); @returns 是否移除了已有回调。 */
    public deleteChange(key: string): boolean {
        return this._change.delete(key);
    }
    /**
     * 控制器允许的最小累计缩放值，默认 0.0000000000001。
     * @example
     * const minimum = cameraControl.minZoom;
     * @returns 最小缩放值。
     */
    public get minZoom(): number {
        return this._minZoom;
    }
    /**
     * 设置最小累计缩放值；修改边界时立即约束当前相机。
     * @param value 大于 0 且不超过 maxZoom 的有限数
     * @example
     * cameraControl.minZoom = 0.01;
     * @returns 无返回值。
     */
    public set minZoom(value: number) {
        // 有效的上下界才可用于夹取，否则会使缩放方向和惯性失效。
        if (Number.isFinite(value) && value > 0 && value <= this._maxZoom) {
            this._minZoom = value;
            this._constrainCameraZoom();
        } else {
            throw new RangeError("minZoom 必须是大于 0 且不超过 maxZoom 的有限数。");
        }
    }
    /**
     * 控制器允许的最大累计缩放值，默认 999999999999。
     * @example
     * const maximum = cameraControl.maxZoom;
     * @returns 最大缩放值。
     */
    public get maxZoom(): number {
        return this._maxZoom;
    }
    /**
     * 设置最大累计缩放值；修改边界时立即约束当前相机。
     * @param value 不小于 minZoom 的有限数
     * @example
     * cameraControl.maxZoom = 1000000;
     * @returns 无返回值。
     */
    public set maxZoom(value: number) {
        // 保证两个界限有序，让所有输入路径使用同一段有效范围。
        if (Number.isFinite(value) && value >= this._minZoom) {
            this._maxZoom = value;
            this._constrainCameraZoom();
        } else {
            throw new RangeError("maxZoom 必须是不小于 minZoom 的有限数。");
        }
    }
    /**
     * 初始化相机控制
     * @example
     * this.init();
     * @returns 无返回值。
     */
    private init(): void {
        // 同一个 signal 关联全部监听器，dispose 中 abort 后会统一移除；它不是触点 ID。
        const signal: AbortSignal = this._events.signal;
        this.render.container.style.touchAction = "none";
        this.render.container.addEventListener("pointerdown", this._pointerDown.bind(this), { signal });
        this.render.container.addEventListener("wheel", this._scroll.bind(this), { passive: false, signal });
        this.render.container.addEventListener("contextmenu", this._contextMenu.bind(this), { signal });
        this.render.container.addEventListener("lostpointercapture", this._pointerEnd.bind(this), { signal });
        window.addEventListener("pointermove", this._pointerMove.bind(this), { signal });
        window.addEventListener("pointerup", this._pointerEnd.bind(this), { signal });
        window.addEventListener("pointercancel", this._pointerEnd.bind(this), { signal });
        window.addEventListener("blur", this._cancelPointers.bind(this), { signal });
    }
    /**
     * 开始激活相机控制
     * @param e 鼠标按下事件，使用浏览器视口坐标
     * @example
     * this._startActive(e);
     * @returns 无返回值。
     */
    private _startActive(e: MouseEvent): void {
        this.focus.set(e.clientX, e.clientY);
        // 只在拖动开关启用时建立鼠标与世界坐标的锚点。
        if (this.drag) {
            this.isActive = true;
            this._resetDragAnchor();
        }
    }
    /**
     * 处理鼠标移动事件，更新相机位置
     * @param e 鼠标移动事件，转换时同时考虑相机、父级和画布 CSS 尺寸
     * @example
     * this._startMove(e);
     * @returns 无返回值。
     */
    private _startMove(e: MouseEvent): void {
        this.focus.set(e.clientX, e.clientY);
        // 拖动激活时维护鼠标下的世界坐标，避免缩放后跳位。
        const leftMouseDrag = this._mouseButton === 0 && this.leftDrag;
        const rightMouseDrag = this._mouseButton === 2 && this.rightDrag;
        // 左右键各自受开关控制，触屏路径不读取这两个鼠标开关。
        if (this.isActive && this.drag && (leftMouseDrag || rightMouseDrag)) {
            this._moveToAnchor(this.focus, this._dragWorld);
        }
        this._notifyChange();
    }
    /**
     * 启用右键拖动时阻止菜单遮挡操作，关闭后保留浏览器菜单。
     * @param e 容器内的菜单事件
     * @example
     * this._contextMenu(e);
     * @returns 无返回值。
     */
    private _contextMenu(e: MouseEvent): void {
        // 只有真正启用右键拖动时才接管菜单。
        if (this.rightDrag && this.drag) {
            e.preventDefault();
        }
    }
    /**
     * 接收新指针；双指锁定后新增手指不会改变手势。
     * @param e 容器内的指针按下事件
     * @example
     * this._pointerDown(e);
     * @returns 无返回值。
     */
    private _pointerDown(e: PointerEvent): void {
        // 触摸与鼠标走独立状态，避免兼容鼠标事件重复拖动。
        if (e.pointerType === "touch") {
            this._mouseKey = undefined;
            this._touches.set(e.pointerId, new Vec2(e.clientX, e.clientY));
            // 单指留给编辑工具时不捕获其事件，但仍跟踪位置以便第二指加入。
            const singleTouchDrag = this._touches.size === 1 && this.oFDrag;
            const pairTouchDrag = this._touches.size === 2 && this.tFDrag;
            // 只有平移手势才接管指针，关闭的触摸通道继续向编辑工具分发事件。
            if (this.drag && (singleTouchDrag || pairTouchDrag)) {
                this.render.container.setPointerCapture(e.pointerId);
            }
            // 首指立即建立锚点；同帧的第二、第三指交给下一帧统一选点。
            if (this._touches.size === 1) {
                this._pairLocked = false;
                this._touchKeys = [e.pointerId];
                this._resetTouchAnchors();
                this._beginMotion();
            }
            this._scheduleTouch();
        } else if (this._touches.size === 0 &&
            ((e.button === 0 && this.leftDrag) || (e.button === 2 && this.rightDrag))) {
            // 鼠标左右键独立接管拖动，其他按键仍交给浏览器。
            this._mouseKey = e.pointerId;
            this._mouseButton = e.button;
            this.render.container.setPointerCapture(e.pointerId);
            this._startActive(e);
            this._beginMotion();
        }
    }
    /**
     * 更新指针位置；只有锁定的触点才能驱动当前手势。
     * @param e 指针移动事件
     * @example
     * this._pointerMove(e);
     * @returns 无返回值。
     */
    private _pointerMove(e: PointerEvent): void {
        const touch: Vec2 | undefined = this._touches.get(e.pointerId);
        // 已登记触点保留最新位置，但多余手指不触发相机更新。
        if (touch !== undefined) {
            touch.set(e.clientX, e.clientY);
            // 选点前允许收集候选，选点后仅监听锁定的两个 ID。
            if (this._pairLocked === false || this._touchKeys.includes(e.pointerId)) {
                this._scheduleTouch();
            }
        } else if (e.pointerType !== "touch" && this._touches.size === 0) {
            // 非拖动时仍记录鼠标焦点，拖动时只接收按下的同一个指针。
            if (this._mouseKey === undefined || this._mouseKey === e.pointerId) {
                this._startMove(e);
            }
        }
    }
    /**
     * 松开锁定触点时降为单指或结束，不从其他手指中寻找替补。
     * @param e 松开、取消或失去捕获的指针事件
     * @example
     * this._pointerEnd(e);
     * @returns 无返回值。
     */
    private _pointerEnd(e: PointerEvent): void {
        const selectedIndex: number = this._touchKeys.indexOf(e.pointerId);
        const controlled: boolean = selectedIndex >= 0 || this._mouseKey === e.pointerId;
        // 松手前提交最后坐标，避免最后一次移动尚在等待动画调度而丢失。
        if (controlled && e.type === "pointerup") {
            const touch: Vec2 | undefined = this._touches.get(e.pointerId);
            // 触摸需要提交整组坐标；鼠标直接复用现有移动逻辑。
            if (touch !== undefined) {
                touch.set(e.clientX, e.clientY);
                // 立即提交时取消旧任务，避免松手后再次执行同一触摸更新。
                if (this._touchFrame !== undefined) {
                    window.cancelAnimationFrame(this._touchFrame);
                }
                this._updateTouch();
            } else {
                this._startMove(e);
            }
        }
        const endingIndex: number = this._touchKeys.indexOf(e.pointerId);
        this._touches.delete(e.pointerId);
        // 双指变单指时以当前相机重新建立锚点，不延用旧的双指中心。
        if (endingIndex >= 0) {
            this._touchKeys.splice(endingIndex, 1);
            this._resetTouchAnchors();
        }
        // 只有整轮触摸结束后，下一轮才能重新选择最远触点。
        if (this._touches.size === 0) {
            this._pairLocked = false;
        }
        // 鼠标结束不干扰仍然存在的触摸手势。
        if (this._mouseKey === e.pointerId) {
            this._mouseKey = undefined;
            this.isActive = false;
        }
        // 只有本轮真正参与操作的指针结束，才改变动量状态。
        if (controlled) {
            // 双指松手事件依次到达，保留轨迹直到最后一指结束，不能提前清掉旋转尾速。
            if (e.type === "pointerup") {
                // 仍有锁定触点时继续记录，只有全部操作触点松开才释放动量。
                if (this.isActive === false) {
                    this._releaseMotion();
                }
            } else {
                // 系统取消或捕获丢失不启动惯性。
                this._stopMotion();
            }
        }
        // 主动释放捕获；重复到达的 lostpointercapture 事件不会再次改变锚点。
        if (this.render.container.hasPointerCapture(e.pointerId)) {
            this.render.container.releasePointerCapture(e.pointerId);
        }
    }
    /**
     * 将同一帧内的触摸事件合并，浏览器没有“同时 pointerdown”的单独事件。
     * @example
     * this._scheduleTouch();
     * @returns 无返回值。
     */
    private _scheduleTouch(): void {
        // 每帧只登记一次；同批多个触点能一起参与初次最远点选择。
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- 保留显式调度分支，清楚区分检查与副作用。
        if (this._touchFrame === undefined) {
            this._touchFrame = window.requestAnimationFrame(this._updateTouch.bind(this));
        }
    }
    /**
     * 初次建立双指手势时用 O(n²) 找最远点，之后只使用锁定 ID。
     * @example
     * this._selectTouchPair();
     * @returns 无返回值。
     */
    private _selectTouchPair(): void {
        const touches: [number, Vec2][] = [...this._touches];
        let maxDistance: number = -1;
        // 每一对只比较一次；不在已锁定手势的移动过程中执行。
        for (let first: number = 0; first < touches.length; first++) {
            // 从下一项开始，排除自己以及重复的反向组合。
            for (let second: number = first + 1; second < touches.length; second++) {
                const distance: number = touches[first][1].distSq(touches[second][1]);
                // 距离相同时保留先按下的组合，避免无意义换指。
                if (distance > maxDistance) {
                    maxDistance = distance;
                    this._touchKeys = [touches[first][0], touches[second][0]];
                }
            }
        }
        this._pairLocked = true;
        this._resetTouchAnchors();
    }
    /**
     * 保存选中触点的世界锚点和屏幕中心，切换手势时不改变相机。
     * @example
     * this._resetTouchAnchors();
     * @returns 无返回值。
     */
    private _resetTouchAnchors(): void {
        this.isActive = this._touchKeys.length > 0;
        this.focus.set(0, 0);
        // 最多处理两个选中触点，未选中的触点不影响中心与锚点。
        for (let index: number = 0; index < this._touchKeys.length; index++) {
            const touch: Vec2 | undefined = this._touches.get(this._touchKeys[index]);
            // 触点可能已被系统取消，只记录仍在本轮触摸中的坐标。
            if (touch !== undefined) {
                this.focus.add(touch);
                this._touchWorld[index].copy(this.camera.windowToWorld(touch, this.render));
            }
        }
        // 无选中触点时结束手势，不使用剩余未选中的手指自动续接。
        if (this.isActive) {
            this.focus.scl(1 / this._touchKeys.length);
            this.startEvent.copy(this.focus);
            this.startZoom = this.camera.zoom;
            this.camera.worldMatrix.getTranslate(this.startCamera);
        }
    }
    /**
     * 更新单指拖动或双指组合变换，缩放使用真实距离比例而非滚轮步进。
     * @example
     * this._updateTouch();
     * @returns 无返回值。
     */
    private _updateTouch(): void {
        this._touchFrame = undefined;
        // 仅在首次进入双指模式时选点，锁定后新增手指全部忽略。
        if (this._pairLocked === false && this._touches.size >= 2) {
            this._selectTouchPair();
        }
        const first: Vec2 | undefined = this._touches.get(this._touchKeys[0]);
        const second: Vec2 | undefined = this._touches.get(this._touchKeys[1]);
        // 双指变换优先；只剩一个锁定触点时恢复单指拖动。
        if (first !== undefined && second !== undefined) {
            this._transformTouchPair(first, second);
        } else if (first !== undefined) {
            // 单指平移同时受拖动总开关和单指开关控制。
            this.focus.copy(first);
            // 跟随按压点，父级变换由 _moveToAnchor 统一处理。
            if (this.drag && this.oFDrag) {
                this._moveToAnchor(first, this._touchWorld[0]);
            }
        }
        this._notifyChange();
    }
    /**
     * 让双指对应的世界线段贴合当前手指线段，并围绕中点缩放、旋转。
     * @param first 第一个锁定触点的浏览器坐标
     * @param second 第二个锁定触点的浏览器坐标
     * @example
     * this._transformTouchPair(first, second);
     * @returns 无返回值。
     */
    private _transformTouchPair(first: Vec2, second: Vec2): void {
        const anchorFirst: Vec2 = this._touchWorld[0].clone();
        const anchorSecond: Vec2 = this._touchWorld[1].clone();
        const currentFirst: Vec2 = this.camera.windowToWorld(first, this.render);
        const currentSecond: Vec2 = this.camera.windowToWorld(second, this.render);
        const centerWorld: Vec2 = anchorFirst.clone().add(anchorSecond).scl(0.5);
        const parent = this.camera.parent;
        // 先转换到父级局部空间，避免父级平移、旋转或缩放污染相机的局部参数。
        if (parent !== null) {
            parent.ensureWorldMatrix();
            const inverse = parent.worldMatrix.clone().invert();
            anchorFirst.apply(inverse);
            anchorSecond.apply(inverse);
            currentFirst.apply(inverse);
            currentSecond.apply(inverse);
        }
        const anchorDelta: Vec2 = anchorSecond.sub(anchorFirst);
        const currentDelta: Vec2 = currentSecond.sub(currentFirst);
        const anchorLength: number = anchorDelta.len();
        const currentLength: number = currentDelta.len();
        // 高倍率下世界坐标距离可以远小于 1e-6，只有真正重合或无穷值才无法求倍率。
        if (anchorLength > 0 && currentLength > 0 && Number.isFinite(anchorLength) && Number.isFinite(currentLength)) {
            const nextZoom: number = this.camera.zoom * currentLength / anchorLength;
            let reachedZoomLimit: boolean = false;
            // 用同一范围约束双指缩放；边界外的剩余指距不应阻碍反向缩放。
            if (this.zoom && nextZoom >= 0) {
                const boundedZoom: number = this._limitZoom(nextZoom);
                reachedZoomLimit = boundedZoom !== nextZoom;
                this.camera.zoom = boundedZoom;
            }
            // 相机旋转与画面旋转相反；使用最短角差避免跨越正负 PI 时整圈跳变。
            if (this.rotate) {
                const angle: number = anchorDelta.angle() - currentDelta.angle();
                this.camera.rotation += Math.atan2(Math.sin(angle), Math.cos(angle));
            }
            this.focus.copy(first).add(second).scl(0.5);
            // 禁用双指平移时仍围绕初始中心缩放、旋转，不跟随当前中点。
            if (this.drag && this.tFDrag) {
                this._moveToAnchor(this.focus, centerWorld);
            } else {
                this._moveToAnchor(this.startEvent, centerWorld);
            }
            // 到达边界后重设触点基准，使手指反向移动时立即重新缩放。
            if (reachedZoomLimit) {
                this._resetTouchAnchors();
            }
        } else {
            this._resetTouchAnchors();
        }
    }
    /**
     * 失焦或注销时结束所有指针，避免重新回到页面后继续拖动。
     * @example
     * this._cancelPointers();
     * @returns 无返回值。
     */
    private _cancelPointers(): void {
        this._stopMotion();
        const keys: number[] = [...this._touches.keys()];
        // 鼠标同样可能仍处于捕获状态，需要一并释放。
        if (this._mouseKey !== undefined) {
            keys.push(this._mouseKey);
        }
        this._touches.clear();
        this._touchKeys = [];
        this._pairLocked = false;
        this._mouseKey = undefined;
        this.isActive = false;
        // 取消尚未执行的触摸更新，防止注销后仍修改相机。
        if (this._touchFrame !== undefined) {
            window.cancelAnimationFrame(this._touchFrame);
            this._touchFrame = undefined;
        }
        // 捕获仅由本控制器登记的指针释放，不影响其他容器。
        for (const key of keys) {
            // 浏览器可能已自动释放，检查后再操作。
            if (this.render.container.hasPointerCapture(key)) {
                this.render.container.releasePointerCapture(key);
            }
        }
    }
    /**
     * 移除控制器监听并恢复容器原有触摸行为，不销毁相机或渲染器。
     * @example
     * cameraControl.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._events.abort();
        this._cancelPointers();
        this.render.container.style.touchAction = this._touchAction;
        this._zoomChange.clear();
        this._positionChange.clear();
        this._rotationChange.clear();
        this._change.clear();
    }
    /**
     * 按滚轮事件的实际位置缩放；拖动中先对齐锚点，再执行焦点缩放。
     * @param e 滚轮事件
     * @example
     * this._scroll(e);
     * @returns 无返回值。
     */
    private _scroll(e: WheelEvent): void {
        // 只在缩放控制启用时处理滚轮，关闭时保留浏览器默认行为。
        if (this.zoom && this._touches.size === 0) {
            e.preventDefault();
            this.focus.set(e.clientX, e.clientY);
            // 拖动激活时维护鼠标下的世界坐标，避免缩放后跳位。
            if (this.isActive && this.drag) {
                this._moveToAnchor(this.focus, this._dragWorld);
            }
            const scale: number = Math.max(0.1, Math.min(2, 1 - e.deltaY * this.zoomRate * 0.001));
            this._wheelZoom(scale);
        }
        this._notifyChange();
    }
    /**
     * 累计最近 100ms 滚轮输入，并让后续惯性始终围绕最后的滚轮焦点。
     * @param rate 本次滚轮产生的缩放倍率
     * @example
     * this._wheelZoom(1.1);
     * @returns 无返回值。
     */
    private _wheelZoom(rate: number): void {
        const nextZoom: number = this.camera.zoom * rate;
        // 有效倍率经范围约束后才记录动量，到达边界不能继续累积尾速。
        if (Number.isFinite(rate) && rate > 0 && rate !== 1 && Number.isFinite(this.camera.zoom)
            && this.camera.zoom > 0 && nextZoom >= 0) {
            const boundedZoom: number = this._limitZoom(nextZoom);
            // 未产生实际倍率变化时停止旧动量，避免在边界连续滚动仍积累速度。
            if (boundedZoom !== this.camera.zoom) {
                this._applyWheelZoom(boundedZoom);
            } else {
                this._stopMotion();
            }
        }
    }
    /**
     * 应用经过边界约束的滚轮缩放并记录实际产生的动量。
     * @param boundedZoom 本次滚轮最终允许的缩放值
     * @example
     * this._applyWheelZoom(2);
     * @returns 无返回值。
     */
    private _applyWheelZoom(boundedZoom: number): void {
        const now: number = Time.now();
        const logZoom: number = Math.log(boundedZoom) - Math.log(this.camera.zoom);
        const previous: WheelMotionSample | undefined = this._wheelMotion.at(-1);
        // 拖动中滚轮与平移使用同一段相机轨迹，松开指针后再释放混合动量。
        if (this.isActive) {
            this._setZoomAt(this.focus, boundedZoom);
            // 关闭惯性仍保留即时缩放，但不保留轨迹。
            if (this.inertia) {
                this._recordMotion(now);
            }
        } else {
            // 同方向且时间相邻的滚轮属于连续输入，不重复叠加动画产生的缩放。
            if (this._wheelInertia && previous !== undefined && now - previous.time <= 100
                && Math.sign(previous.logZoom) === Math.sign(logZoom)) {
                // 只累计时间窗口内的真实输入，丢弃更早的滚轮刻度。
                while (this._wheelMotion.length > 0 && this._wheelMotion[0].time < now - 100) {
                    this._wheelMotion.shift();
                }
            } else {
                this._stopMotion();
            }
            this._setZoomAt(this.focus, boundedZoom);
            // inertia 同时控制滚轮尾速，不额外增加另一个动画开关。
            if (this.inertia) {
                this._wheelMotion.push({ time: now, logZoom });
                let total: number = 0;
                // 固定 100ms 时间窗口，避免单次事件用几乎为零的间隔求出巨大速度。
                for (const sample of this._wheelMotion) {
                    total += sample.logZoom;
                }
                this._velocity.logZoom = total / 0.1;
                this._wheelScreen.copy(this.focus);
                this._wheelWorld.copy(this.camera.windowToWorld(this.focus, this.render));
                this._wheelInertia = true;
                this._motionTime = now;
            } else {
                this._stopMotion();
            }
        }
    }
    /**
     * 围绕指定屏幕点缩放，保持该点对应的世界坐标不变。
     * @param center 浏览器视口 CSS 坐标，与 clientX/clientY 一致
     * @param rate 相对当前 zoom 的正数倍率
     * @example
     * cameraControl.zoomUpdate(center, rate);
     * @returns 无返回值。
     */
    public zoomUpdate(center: Vec2, rate: number): void {
        const nextZoom: number = this.camera.zoom * rate;
        // 输入倍率必须有效，乘积下溢或上溢时由统一边界接住。
        if (Number.isFinite(rate) && rate > 0 && Number.isFinite(this.camera.zoom)
            && this.camera.zoom > 0 && nextZoom >= 0) {
            this._stopMotion();
            const boundedZoom: number = this._limitZoom(nextZoom);
            // 贴住边界时无需重新定位焦点，减少重复矩阵计算。
            if (boundedZoom !== this.camera.zoom) {
                this._setZoomAt(center, boundedZoom);
            }
            // 外部主动缩放不继承旧惯性，操作中的后续轨迹重新开始记录。
            if (this.isActive) {
                this._beginMotion();
            }
        }
        this._notifyChange();
    }
    /**
     * 应用已验证的缩放值并保持焦点，不清除调用方正在收集的动量轨迹。
     * @param center 浏览器视口 CSS 坐标
     * @param nextZoom 已验证的有限正数缩放值
     * @example
     * this._setZoomAt(this.focus, 2);
     * @returns 无返回值。
     */
    private _setZoomAt(center: Vec2, nextZoom: number): void {
        const focusWorld: Vec2 = this.camera.windowToWorld(center, this.render);
        this.startZoom = this.camera.zoom;
        this.camera.zoom = nextZoom;
        this._moveToAnchor(center, focusWorld);
        // 外部缩放可能改变按压处的世界坐标，重新建立相应拖动锚点。
        if (this._touchKeys.length > 0) {
            this._resetTouchAnchors();
        } else if (this.isActive) {
            // 鼠标拖动与滚轮混用时保持鼠标处的锚点连续。
            this._resetDragAnchor();
        }
    }
    /**
     * 把有效缩放值夹在当前控制器范围内，溢出时仍落在边界上。
     * @param value 待约束的非负缩放值
     * @example
     * const boundedZoom = this._limitZoom(1e15);
     * @returns 范围内的缩放值。
     */
    private _limitZoom(value: number): number {
        return Math.max(this._minZoom, Math.min(value, this._maxZoom));
    }
    /**
     * 配置边界改变后同步当前相机并清除过时的缩放动量。
     * @example
     * this._constrainCameraZoom();
     * @returns 无返回值。
     */
    private _constrainCameraZoom(): void {
        // 非法相机值交由开发模式诊断报告，控制器不把 NaN 隐藏成有效缩放。
        if (Number.isFinite(this.camera.zoom) && this.camera.zoom > 0) {
            const boundedZoom: number = this._limitZoom(this.camera.zoom);
            // 只有相机确实越界才中断当前轨迹和重建触点锚点。
            if (boundedZoom !== this.camera.zoom) {
                this._stopMotion();
                this.camera.zoom = boundedZoom;
                // 边界变化发生在手势中时更新世界锚点，避免下一次移动跳位。
                if (this._touchKeys.length > 0) {
                    this._resetTouchAnchors();
                } else if (this.isActive) {
                    // 鼠标拖动继续时重新记录当前焦点下的世界位置。
                    this._resetDragAnchor();
                }
            }
        }
        this._notifyChange();
    }
    /**
     * 保存当前拖动基准；相机位置保存为世界坐标，不预乘 zoom。
     * @example
     * this._resetDragAnchor();
     * @returns 无返回值。
     */
    private _resetDragAnchor(): void {
        this.startEvent.copy(this.focus);
        this._dragWorld.copy(this.camera.windowToWorld(this.focus, this.render));
        this.camera.worldMatrix.getTranslate(this.startCamera);
    }
    /**
     * 平移相机，使指定世界坐标落在目标鼠标位置。
     * @param screen 浏览器视口 CSS 坐标
     * @param anchor 需要锁定的世界坐标
     * @example
     * this._moveToAnchor(screen, anchor);
     * @returns 无返回值。
     */
    private _moveToAnchor(screen: Vec2, anchor: Vec2): void {
        const currentWorld: Vec2 = this.camera.windowToWorld(screen, this.render);
        const targetWorld: Vec2 = new Vec2(0, 0);
        this.camera.worldMatrix.getTranslate(targetWorld);
        targetWorld.add(anchor).sub(currentWorld);
        // world = parentWorld * local；写回 position 前只逆父级矩阵。
        const parent = this.camera.parent;
        // 有父节点时先处理父级变换，避免把世界坐标当作局部坐标。
        if (parent !== null) {
            parent.ensureWorldMatrix();
            targetWorld.apply(parent.worldMatrix.clone().invert());
        }
        this.camera.position.copy(targetWorld);
    }
    /**
     * 停止尚未结束的相机惯性，编辑器可在起笔时冻结当前视角。
     * @example cameraControl.stopMotion();
     * @returns 无返回值。
     */
    public stopMotion(): void {
        this._stopMotion();
    }

    /**
     * 清除动量和旧轨迹，不改变当前相机变换。
     * @example this._stopMotion();
     * @returns 无返回值。
     */
    private _stopMotion(): void {
        this._motion.length = 0;
        this._wheelMotion.length = 0;
        this._wheelInertia = false;
        this._velocity.x = 0;
        this._velocity.y = 0;
        this._velocity.rotation = 0;
        this._velocity.logZoom = 0;
    }
    /**
     * 新操作立即中断惯性，并保存带毫秒时间戳的起始相机状态。
     * @example
     * this._beginMotion();
     * @returns 无返回值。
     */
    private _beginMotion(): void {
        this._stopMotion();
        const now: number = Time.now();
        this._motionTime = now;
        // 关闭惯性时无需保留轨迹，直接拖动仍然正常工作。
        if (this.inertia && this.isActive) {
            this._recordMotion(now);
        }
    }
    /**
     * 记录相机状态并裁剪时间窗口；停住不动也要采样，避免松手使用旧速度。
     * @param now 当前毫秒时间戳，统一来自 Time.now
     * @example
     * this._recordMotion(Time.now());
     * @returns 无返回值。
     */
    private _recordMotion(now: number): void {
        const sample: CameraMotionSample = {
            time: now,
            x: this.camera.position.x,
            y: this.camera.position.y,
            rotation: this.camera.rotation,
            logZoom: Math.log(this.camera.zoom),
        };
        const last: CameraMotionSample | undefined = this._motion.at(-1);
        // 同一时间的重复记录直接覆盖，避免出现零时间长度的轨迹段。
        if (last?.time === now) {
            this._motion[this._motion.length - 1] = sample;
        } else {
            this._motion.push(sample);
        }
        const cutoff: number = now - 100;
        // 保留窗口左边最近的一条，松手时可以插值到恰好 100ms 前。
        while (this._motion.length > 2 && this._motion[1].time <= cutoff) {
            this._motion.shift();
        }
    }
    /**
     * 正常松手后按最近 100ms 的累计变化量计算每秒速度。
     * @example
     * this._releaseMotion();
     * @returns 无返回值。
     */
    private _releaseMotion(): void {
        const now: number = Time.now();
        // 未启用或没有操作起点时不凭空生成惯性。
        if (this.inertia && this._motion.length > 0) {
            this._recordMotion(now);
            const first: CameraMotionSample = this._motion[0];
            const next: CameraMotionSample | undefined = this._motion.at(1);
            const last: CameraMotionSample = this._motion[this._motion.length - 1];
            const start: number = Math.max(first.time, now - 100);
            const seconds: number = (now - start) / 1000;
            // 至少有两个不同时刻才能求速度；极短点击不会产生惯性。
            if (next !== undefined && seconds > 0.001 && next.time > first.time) {
                const ratio: number = Math.max(0, Math.min(1, (start - first.time) / (next.time - first.time)));
                // 各段位移相加等于末值减初值，不按采样条数或刷新率做平均。
                this._velocity.x = (last.x - first.x - (next.x - first.x) * ratio) / seconds;
                this._velocity.y = (last.y - first.y - (next.y - first.y) * ratio) / seconds;
                this._velocity.rotation = (last.rotation - first.rotation - (next.rotation - first.rotation) * ratio) / seconds;
                this._velocity.logZoom = (last.logZoom - first.logZoom - (next.logZoom - first.logZoom) * ratio) / seconds;
                this._motion.length = 0;
            } else {
                this._stopMotion();
            }
        } else {
            this._stopMotion();
        }
        this._motionTime = now;
    }
    /**
     * 按实际秒数积分指数衰减的速度，更新频率改变不会改变衰减时长。
     * @param seconds 距离上次更新实际经过的秒数
     * @example
     * this._applyInertia(0.016);
     * @returns 无返回值。
     */
    private _applyInertia(seconds: number): void {
        // 非法阻尼或长时间暂停直接停止，避免返回页面时跳动。
        if (Number.isFinite(this.damp) && this.damp > 0 && this.damp < 1 && seconds > 0 && seconds <= 0.25) {
            const decayRate: number = -Math.log(this.damp) / 0.1;
            const decay: number = Math.exp(-decayRate * seconds);
            const distanceTime: number = (1 - decay) / decayRate;
            const nextZoom: number = this.camera.zoom * Math.exp(this._velocity.logZoom * distanceTime);
            // 先验证相机，再允许计算结果在上下界饱和，防止惯性越过范围。
            if (Number.isFinite(this.camera.zoom) && this.camera.zoom > 0
                && nextZoom >= 0) {
                const boundedZoom: number = this._limitZoom(nextZoom);
                const reachedZoomLimit: boolean = boundedZoom !== nextZoom;
                // 滚轮只保留缩放速度；位置由焦点约束求出，不能再叠加平移动量。
                if (this._wheelInertia) {
                    // 关闭 zoom 立即结束滚轮惯性；焦点补偿不受 drag 开关影响。
                    if (this.zoom) {
                        this.camera.zoom = boundedZoom;
                        this._moveToAnchor(this._wheelScreen, this._wheelWorld);
                        // 最后一段动量只抵达边界，不再用旧速度重复触发缩放。
                        if (reachedZoomLimit) {
                            this._stopMotion();
                        }
                    } else {
                        this._stopMotion();
                    }
                } else {
                    // 关闭拖动时不延续平移动量，其他通道仍由各自开关控制。
                    if (this.drag) {
                        this.camera.position.set(
                            this.camera.position.x + this._velocity.x * distanceTime,
                            this.camera.position.y + this._velocity.y * distanceTime,
                        );
                    }
                    // 旋转速度以弧度/秒记录，不按采样次数累计。
                    if (this.rotate) {
                        this.camera.rotation += this._velocity.rotation * distanceTime;
                    }
                    // 对数空间积分使相同时间内缩放倍率一致。
                    if (this.zoom) {
                        this.camera.zoom = boundedZoom;
                    }
                }
                this._velocity.x *= decay;
                this._velocity.y *= decay;
                this._velocity.rotation *= decay;
                this._velocity.logZoom *= decay;
                // 拖动惯性还可继续平移或旋转，缩放分量在边界处单独归零。
                if (reachedZoomLimit) {
                    this._velocity.logZoom = 0;
                }
                // 足够小的尾速归零，避免无限保留没有可见效果的运动。
                if (Math.hypot(this._velocity.x, this._velocity.y) < 0.01
                    && Math.abs(this._velocity.rotation) < 0.0001
                    && Math.abs(this._velocity.logZoom) < 0.0001) {
                    this._stopMotion();
                }
            } else {
                this._stopMotion();
            }
        } else {
            this._stopMotion();
        }
    }
    /**
     * 操作中记录最近 100ms 轨迹，操作结束后按实际经过时间更新惯性。
     * 由外部动画循环调用，不自行启动另一个持续运行的动画循环。
     * @example
     * cameraControl.update();
     * @returns 无返回值。
     */
    public update(): void {
        const now: number = Time.now();
        const elapsed: number = now - this._motionTime;
        this._motionTime = now;
        // 注销或关闭惯性后不再采样，也不保留等待重新开启的旧动量。
        if (this.inertia && this._events.signal.aborted === false) {
            // 操作过程中即使相机静止也要采样，使停住 100ms 后松手不会滑行。
            if (this.isActive) {
                this._recordMotion(now);
            } else if (this._velocity.x !== 0 || this._velocity.y !== 0
                || this._velocity.rotation !== 0 || this._velocity.logZoom !== 0) {
                // 只有存在剩余速度才写相机，静止时不触发版本变化。
                // 同一个时间戳内重复调用不推进动画，也不清掉仍然有效的速度。
                if (elapsed > 0) {
                    this._applyInertia(elapsed / 1000);
                }
            }
        } else {
            this._stopMotion();
        }
        this._notifyChange();
    }

    /** @example this._captureChangeState(); @returns 独立只读的相机局部变换快照。 */
    private _captureChangeState(): CameraControlState {
        const position = Object.freeze({ x: this.camera.position.x, y: this.camera.position.y });
        return Object.freeze({ zoom: this.camera.zoom, position, rotation: this.camera.rotation });
    }

    /** @example this._notifyChange(); @returns 无返回值，仅通知实际数值变化，静止帧不分配快照。 */
    private _notifyChange(): void {
        // 注销后停止通知；回调触发的嵌套操作由当前批次结束后的循环处理。
        if (this._events.signal.aborted === false && this._notifyingChange === false) {
            this._notifyingChange = true;
            try {
                let pending = true;
                // 每批先提交快照，再通知所有订阅者，确保回调内 update 不重复触发旧事件。
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- 回调可调用 dispose，下一批必须重新读取 AbortSignal。
                while (pending && this._events.signal.aborted === false) {
                    const previous = this._changeState;
                    const zoomChanged = !Object.is(previous.zoom, this.camera.zoom);
                    const positionChanged = !Object.is(previous.position.x, this.camera.position.x) ||
                        !Object.is(previous.position.y, this.camera.position.y);
                    const rotationChanged = !Object.is(previous.rotation, this.camera.rotation);
                    // 只比较关心的数值，相机视口或缓存版本变化不算相机移动。
                    if (zoomChanged || positionChanged || rotationChanged) {
                        const current = this._captureChangeState();
                        this._changeState = current;
                        const zoomCallbacks = [...this._zoomChange.values()];
                        const positionCallbacks = [...this._positionChange.values()];
                        const rotationCallbacks = [...this._rotationChange.values()];
                        const changeCallbacks = [...this._change.values()];
                        // 焦点缩放同时更新位置，回调读取的相机已完成整次操作。
                        if (zoomChanged) {
                            // 在分发前快照回调，新增或替换订阅从下一批变化生效。
                            for (const callback of zoomCallbacks) {
                                callback(current.zoom, previous.zoom, this);
                            }
                        }
                        // 位置传纯数据副本，避免回调持有可变的 Camera.position。
                        if (positionChanged) {
                            // 同一次组合变换中位置只通知一次。
                            for (const callback of positionCallbacks) {
                                callback(current.position, previous.position, this);
                            }
                        }
                        // 旋转使用弧度，与 Camera.rotation 的原始值一致。
                        if (rotationChanged) {
                            // 多个独立订阅均收到同一对前后值。
                            for (const callback of rotationCallbacks) {
                                callback(current.rotation, previous.rotation, this);
                            }
                        }
                        // 汇总事件在各分项之后执行，一次操作覆盖全部变化。
                        for (const callback of changeCallbacks) {
                            callback(current, previous, this);
                        }
                    } else {
                        pending = false;
                    }
                }
            } finally {
                this._notifyingChange = false;
            }
        }
    }
}

/** 事件中的相机局部变换快照；只读纯数据，不共享 Camera.position。 */
interface CameraControlState {
    readonly zoom: number;
    readonly position: Readonly<{ x: number; y: number }>;
    /** 局部旋转角度，单位弧度。 */
    readonly rotation: number;
}

type CameraZoomChange = (value: number, previous: number, control: CameraControl) => void;

type CameraPositionChange = (value: CameraControlState["position"], previous: CameraControlState["position"], control: CameraControl) => void;

type CameraRotationChange = (value: number, previous: number, control: CameraControl) => void;

type CameraControlChange = (value: CameraControlState, previous: CameraControlState, control: CameraControl) => void;

/** 相机运动的时间采样；位置使用父级局部坐标，缩放使用对数以保持倍率连续。 */
interface CameraMotionSample {
    time: number;
    x: number;
    y: number;
    rotation: number;
    logZoom: number;
}

/** 滚轮输入是离散增量，按时间窗口累计，不把惯性动画自身重复计入输入。 */
interface WheelMotionSample {
    time: number;
    logZoom: number;
}

interface CameraControlOptions {
    camera: Camera; // 相机
    render: Render; // 渲染器
    is: boolean; //控制器总开关
    drag: boolean; // 是否开启拖动相机控制
    leftDrag: boolean; // 是否允许鼠标左键拖动，不影响触屏，同时受 drag 控制
    rightDrag: boolean; // 是否允许右键拖动，同时受 drag 控制
    oFDrag: boolean; // 是否允许单指触摸拖动，同时受 drag 控制
    tFDrag: boolean; // 是否允许双指触摸中心拖动，同时受 drag 控制
    inertia: boolean; // 是否启用松手后的动量动画
    damp: number; // 每 100ms 保留的动量比例，范围 0 到 1，不包含 1
    isActive: boolean; // 是否激活相机控制
    startEvent: Vec2Like; // 开始事件鼠标位置
    startCamera: Vec2Like; // 开始相机位置
    startZoom: number; // 开始相机缩放比例
    zoom: boolean; // 是否开启缩放相机控制
    rotate: boolean; // 是否开启双指旋转相机控制
    focus: Vec2Like; // 聚焦相机位置
    zoomRate: number; // 缩放相机比例
    minZoom: number; // 控制器允许的最小累计缩放值
    maxZoom: number; // 控制器允许的最大累计缩放值
    /** @param key 注册标识 @param callback 新值、旧值及控制器 @example control.onZoom("ui", callback); @returns 无返回值。 */
    onZoom(key: string, callback: CameraZoomChange): void;
    /** @param key 注册标识 @example control.deleteZoom("ui"); @returns 是否删除已有回调。 */
    deleteZoom(key: string): boolean;
    /** @param key 注册标识 @param callback 新位置、旧位置及控制器 @example control.onPosition("ui", callback); @returns 无返回值。 */
    onPosition(key: string, callback: CameraPositionChange): void;
    /** @param key 注册标识 @example control.deletePosition("ui"); @returns 是否删除已有回调。 */
    deletePosition(key: string): boolean;
    /** @param key 注册标识 @param callback 新弧度、旧弧度及控制器 @example control.onRotation("ui", callback); @returns 无返回值。 */
    onRotation(key: string, callback: CameraRotationChange): void;
    /** @param key 注册标识 @example control.deleteRotation("ui"); @returns 是否删除已有回调。 */
    deleteRotation(key: string): boolean;
    /** @param key 注册标识 @param callback 本次快照、上次快照及控制器 @example control.onChange("ui", callback); @returns 无返回值。 */
    onChange(key: string, callback: CameraControlChange): void;
    /** @param key 注册标识 @example control.deleteChange("ui"); @returns 是否删除已有回调。 */
    deleteChange(key: string): boolean;
}

export default CameraControl;
export type {
    CameraControlChange, CameraControlOptions, CameraControlState, CameraPositionChange,
    CameraRotationChange, CameraZoomChange,
};
