import type { Vec2Like } from "bpmatrixjs/Math/Vec2";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import type Render from "../../Render";
import { Time } from "bpmatrixjs/Utils";
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
    rightDrag: boolean; // 是否允许右键拖动，同时受 drag 控制
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
}
class CameraControl implements CameraControlOptions {
    camera: Camera;
    render: Render;
    is: boolean;
    isActive: boolean;
    startEvent: Vec2;
    startCamera: Vec2;
    drag: boolean;
    /** 是否允许右键像左键一样拖动，默认开启；drag 是拖动总开关。 */
    public rightDrag: boolean = true;
    /** 是否启用平移、旋转、缩放惯性，默认开启；关闭后下次 update 立即停止。 */
    public inertia: boolean = true;
    /** 每 100ms 保留的动量比例，默认 0.3；0 立即停止，越接近 1 滑行越久。 */
    public damp: number = 0.3;
    zoom: boolean;
    /** 是否允许双指旋转，默认开启；不改变鼠标操作。 */
    rotate: boolean;
    focus: Vec2;
    startZoom: number; // 开始相机缩放比例
    zoomRate: number; // 滚轮缩放灵敏度；双指按实际距离比例缩放，不套用滚轮步进。
    /** 拖动时锁定在鼠标下的世界坐标，不混用相机局部 position。 */
    private readonly _dragWorld: Vec2 = new Vec2(0, 0);
    /** 当前按住的触点；未选中的触点只记录位置，不参与相机变换。 */
    private readonly _touches = new Map<number, Vec2>();
    /** 当前手势锁定的 pointerId，最多两个；松开后不使用其他触点补位。 */
    private _touchKeys: number[] = [];
    /** 已建立过双指手势后，直到本轮所有手指松开才允许重新选点。 */
    private _pairLocked: boolean = false;
    /** 两个触点按下处的世界坐标，用于保持缩放、旋转时贴合手指。 */
    private readonly _touchWorld: [Vec2, Vec2] = [new Vec2(0, 0), new Vec2(0, 0)];
    /** 同一帧集中处理触点，既收集同时按下的手指，也避免双指分别更新时抖动。 */
    private _touchFrame: number | undefined;
    /** 鼠标与触控共用 Pointer Events，但不会同时控制相机。 */
    private _mouseKey: number | undefined;
    /** 当前鼠标拖动使用的按键，移动期间用于响应 rightDrag 开关变化。 */
    private _mouseButton: number = 0;
    /** 统一使用 Time.now 的毫秒时钟，不创建帧数或 FPS 日志。 */
    private _motionTime: number = Time.now();
    /** 最近 100ms 的轨迹，额外保留窗口左侧一条数据以插值到准确时间边界。 */
    private readonly _motion: CameraMotionSample[] = [];
    /** 局部坐标/秒、弧度/秒、对数缩放/秒；停止后全部归零。 */
    private readonly _velocity = { x: 0, y: 0, rotation: 0, logZoom: 0 };
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
        this.is = false;
        this.drag = true;
        this.isActive = false;
        this.zoom = true;
        this.rotate = true;
        this.startEvent = new Vec2(0, 0);
        this.startCamera = new Vec2(0, 0);
        this.startZoom = camera.zoom;
        this.focus = new Vec2(0, 0);
        this.zoomRate = 1;
        this.camera = camera;
        this.render = render;
        this._touchAction = render.container.style.touchAction;
        this.init();
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
        if (this.isActive && this.drag && (this._mouseButton === 0 || this.rightDrag)) {
            this._moveToAnchor(this.focus, this._dragWorld);
        }
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
            this.render.container.setPointerCapture(e.pointerId);
            // 首指立即建立锚点；同帧的第二、第三指交给下一帧统一选点。
            if (this._touches.size === 1) {
                this._pairLocked = false;
                this._touchKeys = [e.pointerId];
                this._resetTouchAnchors();
                this._beginMotion();
            }
            this._scheduleTouch();
        } else if ((e.button === 0 || (e.button === 2 && this.rightDrag)) && this._touches.size === 0) {
            // 右键复用左键拖动，其他鼠标按键不接管。
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
            // 单指只响应 drag，关闭时不移动相机。
            this.focus.copy(first);
            // 跟随按压点，父级变换由 _moveToAnchor 统一处理。
            if (this.drag) {
                this._moveToAnchor(first, this._touchWorld[0]);
            }
        }
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
        // 重合触点没有可靠的方向和倍率；跳过变换并重新建立可用的基准。
        if (anchorLength > 0.000001 && currentLength > 0.000001) {
            const nextZoom: number = this.camera.zoom * currentLength / anchorLength;
            // 缩放只受 zoom 开关控制，实际距离翻倍时画面同步放大两倍。
            if (this.zoom && Number.isFinite(nextZoom) && nextZoom > 0) {
                this.camera.zoom = nextZoom;
            }
            // 相机旋转与画面旋转相反；使用最短角差避免跨越正负 PI 时整圈跳变。
            if (this.rotate) {
                const angle: number = anchorDelta.angle() - currentDelta.angle();
                this.camera.rotation += Math.atan2(Math.sin(angle), Math.cos(angle));
            }
            this.focus.copy(first).add(second).scl(0.5);
            // drag 关闭仍允许围绕初始双指中心缩放、旋转，但不跟随中点平移。
            if (this.drag) {
                this._moveToAnchor(this.focus, centerWorld);
            } else {
                this._moveToAnchor(this.startEvent, centerWorld);
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
        // 零增量不打断现有惯性，非法倍率不写入相机。
        if (Number.isFinite(rate) && rate > 0 && rate !== 1 && Number.isFinite(nextZoom) && nextZoom > 0) {
            const now: number = Time.now();
            const logZoom: number = Math.log(rate);
            const previous: WheelMotionSample | undefined = this._wheelMotion.at(-1);
            // 拖动中滚轮与平移使用同一段相机轨迹，松开指针后再释放混合动量。
            if (this.isActive) {
                this._setZoomAt(this.focus, nextZoom);
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
                this._setZoomAt(this.focus, nextZoom);
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
        // 仅接受有限正数倍率，避免生成无法求逆的相机投影。
        if (Number.isFinite(rate) && rate > 0 && Number.isFinite(nextZoom) && nextZoom > 0) {
            this._stopMotion();
            this._setZoomAt(center, nextZoom);
            // 外部主动缩放不继承旧惯性，操作中的后续轨迹重新开始记录。
            if (this.isActive) {
                this._beginMotion();
            }
        }
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
     * 清除动量和旧轨迹，不改变当前相机变换。
     * @example
     * this._stopMotion();
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
            // 先验证缩放，避免无穷大或零值使后续相机矩阵不可逆。
            if (Number.isFinite(nextZoom) && nextZoom > 0) {
                // 滚轮只保留缩放速度；位置由焦点约束求出，不能再叠加平移动量。
                if (this._wheelInertia) {
                    // 关闭 zoom 立即结束滚轮惯性；焦点补偿不受 drag 开关影响。
                    if (this.zoom) {
                        this.camera.zoom = nextZoom;
                        this._moveToAnchor(this._wheelScreen, this._wheelWorld);
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
                        this.camera.zoom = nextZoom;
                    }
                }
                this._velocity.x *= decay;
                this._velocity.y *= decay;
                this._velocity.rotation *= decay;
                this._velocity.logZoom *= decay;
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
    }
}
export default CameraControl;
export type { CameraControlOptions };
