import { Vec2 } from "bpmatrixjs/Math/Vec2";
import NGon2D from "../../Geometry/NGon2D";
import Mesh from "../../Mesh";
import { HistoryMesh } from "../History/records";
import type { SnapGeometry } from "../Snap";
import {
    CollectSnapGeometry,
    NearbySnapPoints,
    RotationSnapTargets, UniformScaleSnapTargets,
} from "../Snap";
import { FindRotationSnap } from "../Snap/RotationSnap";
import { FindUniformScaleSnap } from "../Snap/UniformScaleSnap";
import {
    ToLocal,
    ToParent,
    WorldVertices,
} from "./geometry";
import type NGonEditTool from "./index";
import type { NGonGesture } from "./types";

/** NGon 编辑器的 transforms 操作，复用主编辑器的实时配置和通知。 */
class NGonTransforms {
    private readonly _tool: NGonEditTool;
    private readonly _hooks: NGonTransformsHooks;

    /** @param tool 主编辑器 @param hooks 状态和通知入口 @example new NGonTransforms(tool, hooks); @returns 操作模块。 */
    public constructor(tool: NGonEditTool, hooks: NGonTransformsHooks) {
        this._tool = tool;
        this._hooks = hooks;
    }


    /**
     * 一次手势固定一次外部轮廓，吸附分项在指针位置附近筛选。
     * @param gesture 当前手势
     * @returns 外部对象的世界轮廓
     * @example const targets = this.getSnapGeometry(gesture);
     */
    public getSnapGeometry(gesture: NGonGesture): SnapGeometry {
        if (gesture.snapGeometry === undefined) {
            // 手势首次吸附时收集静止目标，后续移动复用同一基准集合。
            const moving = new Set(gesture.snapshots.map(HistoryMesh));
            gesture.snapGeometry = CollectSnapGeometry(this._tool.scene, moving, this._tool.camera);
        }
        return gesture.snapGeometry;
    }


    /**
     * 获取原始世界位置附近的四类吸附候选。
     * @param gesture 当前手势
     * @param world 未吸附的世界点
     * @param allowVertex 当前被编辑的正多边形是否允许顶点吸附
     * @returns 屏幕容差内的候选点
     * @example const targets = this.getSnapTargets(gesture, world, true);
     */
    public getSnapTargets(gesture: NGonGesture, world: Vec2, allowVertex: boolean): Vec2[] {
        const options = { ...this._tool.snapOptions, vertex: this._tool.snapOptions.vertex && allowVertex };
        return NearbySnapPoints(world, this.getSnapGeometry(gesture), options,
            this._tool.radius, this._tool.camera, this._tool.render);
    }


    /** @param sides 边数 @param outer 外接圆半径 @example const allowed = this.isAllowedRadius(5, 20); @returns 是否满足尺寸与面积限制。 */
    public isAllowedRadius(sides: number, outer: number): boolean {
        const diameter = outer * 2;
        const area = sides * outer * outer * Math.sin(Math.PI * 2 / sides) / 2;
        return Number.isFinite(outer) && outer >= 0 && diameter >= this._tool.minWidth && diameter <= this._tool.maxWidth &&
            diameter >= this._tool.minHeight && diameter <= this._tool.maxHeight && area <= this._tool.max;
    }


    /** @param mesh 候选 Mesh @example const valid = this.withinWorldLimits(mesh); @returns 所有外圈顶点是否在活动区域内。 */
    public withinWorldLimits(mesh: Mesh): boolean {
        let allowed = true;
        for (const point of WorldVertices(mesh, false, this._tool.camera)) {
            // 检查显示轮廓的全部顶点，旋转对象不能只比较中心。
            if (point.x < this._tool.left || point.x > this._tool.right || point.y < this._tool.bottom || point.y > this._tool.top) {
                // 任一顶点越界便拒绝整笔变换。
                allowed = false;
            }
        }
        return allowed;
    }


    /**
     * 找出移动候选中距原始鼠标轨迹最近的步进或顶点吸附修正。
     * @param gesture 当前移动手势
     * @param rawX 原始世界 X 平移
     * @param rawY 原始世界 Y 平移
     * @returns 修正后的平移向量
     * @example
     * const delta = this.moveDelta(gesture, dx, dy);
     */
    public moveDelta(gesture: NGonGesture, rawX: number, rawY: number): Vec2 {
        let result = new Vec2(rawX, rawY);
        let bestDistance = Infinity;
        const anchor = gesture.snapshots.at(0)?.center;
        // 以第一件对象中心对齐世界原点网格，多选共享同一平移量。
        if (this._tool.translationStepEnabled && this._tool.translationStep > 0 && anchor !== undefined) {
            const snappedX = Math.round((anchor.x + rawX) / this._tool.translationStep) * this._tool.translationStep;
            const snappedY = Math.round((anchor.y + rawY) / this._tool.translationStep) * this._tool.translationStep;
            const source = this._tool.camera.worldToWindow(new Vec2(anchor.x + rawX, anchor.y + rawY), this._tool.render);
            const target = this._tool.camera.worldToWindow(new Vec2(snappedX, snappedY), this._tool.render);
            bestDistance = Math.hypot(target.x - source.x, target.y - source.y);
            result = new Vec2(snappedX - anchor.x, snappedY - anchor.y);
        }
        // 顶点吸附只比较 3–9 边的来源和目标，避免近圆形的密集顶点抖动。
        if (this._tool.snap) {
            for (const snapshot of gesture.snapshots) {
                // 每个移动对象都可贡献吸附源，最终取整批中最近的候选。
                const sourceGeometry = snapshot.mesh.data;
                if (sourceGeometry instanceof NGon2D && (sourceGeometry.sides <= 9 ||
                    this._tool.snapOptions.edge || this._tool.snapOptions.intersection || this._tool.snapOptions.grid)) {
                    // 高边数轮廓跳过顶点吸附，但仍可参与边、交点与网格吸附。
                    for (const sourceVertex of snapshot.vertices) {
                        // 使用冻结顶点加原始偏移，避免吸附误差逐帧累积。
                        const proposed = new Vec2(sourceVertex.x + rawX, sourceVertex.y + rawY);
                        const proposedScreen = this._tool.camera.worldToWindow(proposed, this._tool.render);
                        for (const targetVertex of this.getSnapTargets(gesture, proposed, sourceGeometry.sides <= 9)) {
                            // 目标候选由分项开关筛选，距离统一换算为屏幕像素。
                            const targetScreen = this._tool.camera.worldToWindow(targetVertex, this._tool.render);
                            const distance = Math.hypot(targetScreen.x - proposedScreen.x, targetScreen.y - proposedScreen.y);
                            if (distance <= this._tool.radius && distance < bestDistance) {
                                // 只采用容差内且更近的候选，使整批对象保持同一位移。
                                bestDistance = distance;
                                result = new Vec2(
                                    rawX + targetVertex.x - proposed.x,
                                    rawY + targetVertex.y - proposed.y,
                                );
                            }
                        }
                    }
                }
            }
        }
        return result;
    }


    /** @param gesture 当前手势 @example this.applyMove(gesture); @returns 无返回值。 */
    public applyMove(gesture: NGonGesture): void {
        let current = gesture.currentClient;
        // 屏幕轴锁定只保留首先显著偏离的方向。
        if (this._tool.constrain) {
            const dx = current.x - gesture.startClient.x;
            const dy = current.y - gesture.startClient.y;
            if (gesture.lockedAxis === null && Math.hypot(dx, dy) > 3) {
                // 超过三像素再锁定首个移动轴，避免按下抖动决定方向。
                if (Math.abs(dx) >= Math.abs(dy)) {
                    // 首段水平分量较大时锁定横轴，否则锁定纵轴。
                    gesture.lockedAxis = "x";
                } else {
                    gesture.lockedAxis = "y";
                }
            }
            if (gesture.lockedAxis === "x") {
                // 锁定横轴时保留起始屏幕高度。
                current = new Vec2(current.x, gesture.startClient.y);
            } else if (gesture.lockedAxis === "y") {
                // 锁定纵轴时保留起始屏幕横坐标。
                current = new Vec2(gesture.startClient.x, current.y);
            }
        } else {
            gesture.lockedAxis = null;
        }
        const world = this._tool.camera.windowToWorld(current, this._tool.render);
        const delta = this.moveDelta(gesture, world.x - gesture.startWorld.x, world.y - gesture.startWorld.y);
        let valid = true;
        for (const snapshot of gesture.snapshots) {
            // 将统一世界偏移分别换算到每个对象的父级坐标。
            const target = new Vec2(snapshot.center.x + delta.x, snapshot.center.y + delta.y);
            const parentPoint = ToParent(snapshot.mesh, target);
            if (parentPoint !== null) {
                // 父级可逆时写入位置并检查活动范围。
                snapshot.mesh.position.set(parentPoint.x, parentPoint.y);
                if (!this.withinWorldLimits(snapshot.mesh)) {
                    // 任何成员越界都会回退整批移动。
                    valid = false;
                }
            } else {
                valid = false;
            }
        }
        if (valid) {
            // 全部成员合法后才发送移动和编辑通知。
            if (gesture.mode === "groupMove" && this._hooks.groupFrame !== null && gesture.frameCenter !== null) {
                // 组平移同步移动现有组框，不从变化后的包围盒重建。
                this._hooks.groupFrame.position.set(
                    gesture.frameCenter.x + delta.x,
                    gesture.frameCenter.y + delta.y,
                );
            }
            const changed = gesture.snapshots.map(HistoryMesh);
            this._hooks.emit(this._hooks.onMove, changed);
            this._hooks.emit(this._hooks.onPositionChange, changed);
            this._hooks.emit(this._hooks.onEdit, changed);
        } else {
            // 任一对象越界时整组回到按下前位置。
            for (const snapshot of gesture.snapshots) {
                snapshot.mesh.position.set(snapshot.position.x, snapshot.position.y);
            }
            if (gesture.mode === "groupMove" && this._hooks.groupFrame !== null && gesture.frameCenter !== null) {
                // 移动被拒绝时组框也回到手势开始位置。
                this._hooks.groupFrame.position.set(gesture.frameCenter.x, gesture.frameCenter.y);
            }
        }
    }


    /** @param gesture 单体半径手势 @example this.applyResize(gesture); @returns 无返回值。 */
    public applyResize(gesture: NGonGesture): void {
        const snapshot = gesture.snapshots.at(0);
        const mesh = gesture.target;
        if (mesh !== undefined && snapshot !== undefined) {
            // 有目标和初始参数时才进行半径调整。
            const geometry = this._hooks.uniqueGeometry(mesh);
            const local = ToLocal(mesh.getRenderMatrix(this._tool.camera).data, gesture.currentWorld);
            if (local !== null) {
                // 显示矩阵可逆时把鼠标位置转为半径计算坐标。
                const rawOuter = Math.hypot(local.x, local.y);
                let outer = rawOuter;
                if (this._tool.translationStepEnabled && this._tool.translationStep > 0) {
                    // 尺寸调整使用同一个平移步进配置量化半径。
                    outer = Math.round(outer / this._tool.translationStep) * this._tool.translationStep;
                }
                let sourceRadius = snapshot.outer;
                let sourceVertices = snapshot.vertices;
                if (gesture.resizeHandle === "inner") {
                    // 拖动内圈时用内圈初始半径和顶点计算比例。
                    sourceRadius = snapshot.inner;
                    sourceVertices = snapshot.innerVertices;
                }
                if (this._tool.snap && sourceRadius > 0 && (geometry.sides <= 9 ||
                    this._tool.snapOptions.edge || this._tool.snapOptions.intersection || this._tool.snapOptions.grid)) {
                    // 有非零基准半径和可用吸附项时比较缩放候选。
                    const options = { ...this._tool.snapOptions, vertex: this._tool.snapOptions.vertex && geometry.sides <= 9 };
                    let stepFactor: number | null = null;
                    if (this._tool.translationStepEnabled && this._tool.translationStep > 0) {
                        // 步进候选换算为缩放因子，与吸附产生的因子共同比较。
                        stepFactor = outer / sourceRadius;
                    }
                    const factor = FindUniformScaleSnap({
                        pivot: snapshot.center,
                        sources: sourceVertices,
                        targets: UniformScaleSnapTargets(snapshot.center, sourceVertices,
                            rawOuter / sourceRadius, this.getSnapGeometry(gesture), options,
                            this._tool.radius, this._tool.camera, this._tool.render),
                        rawFactor: rawOuter / sourceRadius,
                        stepFactor,
                        radius: this._tool.radius,
                        camera: this._tool.camera,
                        render: this._tool.render,
                    });
                    if (factor !== null) {
                        // 有效吸附比例覆盖半径候选。
                        outer = sourceRadius * factor;
                    }
                }
                let nextOuter = outer;
                let nextInner = snapshot.inner;
                // 内圈穿过外圈时，原外圈停在交叉位置，继续拖动外圈。
                if (gesture.resizeHandle === "inner") {
                    nextInner = Math.min(outer, snapshot.outer);
                    nextOuter = Math.max(outer, snapshot.outer);
                } else if (outer < snapshot.inner) {
                    // 外圈向内穿过内圈后，原内圈停在交叉位置。
                    nextInner = outer;
                    nextOuter = snapshot.inner;
                }
                if (this.isAllowedRadius(geometry.sides, nextOuter)) {
                    // 半径满足尺寸及面积限制后再更新内外圈。
                    geometry.outer = nextOuter;
                    geometry.inner = nextInner;
                    if (this.withinWorldLimits(mesh)) {
                        // 完整显示轮廓仍在活动范围内时才提交尺寸事件。
                        this._hooks.emit(this._hooks.onResize, mesh);
                        this._hooks.emit(this._hooks.onEdit, [mesh]);
                    } else {
                        geometry.outer = snapshot.outer;
                        geometry.inner = snapshot.inner;
                    }
                }
            }
        }
    }


    /** @param gesture 单体旋转手势 @example this.applyRotate(gesture); @returns 无返回值。 */
    public applyRotate(gesture: NGonGesture): void {
        const snapshot = gesture.snapshots.at(0);
        const mesh = gesture.target;
        if (mesh !== undefined && snapshot !== undefined && this._hooks.rotationEnabled) {
            // 目标存在且允许旋转时使用冻结角度，避免旋转漂移。
            const start = Math.atan2(gesture.startWorld.y - snapshot.center.y, gesture.startWorld.x - snapshot.center.x);
            const current = Math.atan2(gesture.currentWorld.y - snapshot.center.y, gesture.currentWorld.x - snapshot.center.x);
            const rawAngle = current - start;
            let rotation = snapshot.rotation + rawAngle;
            let stepAngle: number | null = null;
            if (this._tool.rotationStepEnabled && this._tool.rotationStep > 0) {
                // 先生成绝对角度的步进候选，再与方向吸附比较。
                const radians = this._tool.rotationStep * Math.PI / 180;
                rotation = Math.round(rotation / radians) * radians;
                stepAngle = rotation - snapshot.rotation;
            }
            const geometry = mesh.data;
            // 密集的 10 边以上顶点不参与吸附，避免类似圆形的对象旋转抖动。
            if (this._tool.snap && geometry instanceof NGon2D && (geometry.sides <= 9 ||
                this._tool.snapOptions.edge || this._tool.snapOptions.intersection || this._tool.snapOptions.grid)) {
                const options = { ...this._tool.snapOptions, vertex: this._tool.snapOptions.vertex && geometry.sides <= 9 };
                const snapped = FindRotationSnap({
                    pivot: snapshot.center,
                    sources: snapshot.vertices,
                    targets: RotationSnapTargets(snapshot.center, snapshot.vertices, rawAngle,
                        this.getSnapGeometry(gesture), options, this._tool.radius, this._tool.camera, this._tool.render),
                    rawAngle,
                    stepAngle,
                    cursor: gesture.currentClient,
                    radius: this._tool.radius,
                    camera: this._tool.camera,
                    render: this._tool.render,
                });
                if (snapped !== null) {
                    // 更近的方向候选替换本次旋转增量。
                    rotation = snapshot.rotation + snapped;
                }
            }
            mesh.rotation = rotation;
            if (this.withinWorldLimits(mesh)) {
                // 旋转后的轮廓合法才通知，否则恢复原始角度。
                this._hooks.emit(this._hooks.onRotate, [mesh]);
                this._hooks.emit(this._hooks.onEdit, [mesh]);
            } else {
                mesh.rotation = snapshot.rotation;
            }
        }
    }


    /** @param gesture 组等比缩放手势 @example this.applyGroupScale(gesture); @returns 无返回值。 */
    public applyGroupScale(gesture: NGonGesture): void {
        const center = gesture.frameCenter;
        if (center !== null) {
            // 组中心是缩放与旋转共同的固定基点。
            const startDistance = Math.hypot(gesture.startWorld.x - center.x, gesture.startWorld.y - center.y);
            const currentDistance = Math.hypot(gesture.currentWorld.x - center.x, gesture.currentWorld.y - center.y);
            if (startDistance > Number.EPSILON) {
                // 起始半径非零才能计算有限的缩放比例。
                const rawFactor = currentDistance / startDistance;
                let factor = rawFactor;
                let stepFactor: number | null = null;
                if (this._tool.translationStepEnabled && this._tool.translationStep > 0) {
                    // 组尺寸步进量化当前径向距离，而不是累计缩放误差。
                    const steppedDistance = Math.round(currentDistance / this._tool.translationStep) * this._tool.translationStep;
                    stepFactor = steppedDistance / startDistance;
                    factor = stepFactor;
                }
                if (this._tool.snap) {
                    // 吸附开启时收集整组选中对象的轮廓源。
                    const sources: Vec2[] = [];
                    const denseSources: Vec2[] = [];
                    for (const snapshot of gesture.snapshots) {
                        // 按每个对象的边数区分稀疏顶点和密集轮廓。
                        const geometry = snapshot.mesh.data;
                        if (geometry instanceof NGon2D) {
                            // 仅正多边形实体参与本工具组缩放吸附。
                            if (geometry.sides <= 9) {
                                // 九边及以下保留顶点吸附资格。
                                sources.push(...snapshot.vertices);
                            } else {
                                denseSources.push(...snapshot.vertices);
                            }
                        }
                    }
                    const options = { ...this._tool.snapOptions };
                    if (sources.length === 0) {
                        // 只有密集轮廓时继续边和网格判定，但关闭顶点项。
                        sources.push(...denseSources);
                        options.vertex = false;
                    }
                    const snapped = FindUniformScaleSnap({
                        pivot: center,
                        sources,
                        targets: UniformScaleSnapTargets(center, sources, rawFactor,
                            this.getSnapGeometry(gesture), options, this._tool.radius, this._tool.camera, this._tool.render),
                        rawFactor,
                        stepFactor,
                        radius: this._tool.radius,
                        camera: this._tool.camera,
                        render: this._tool.render,
                    });
                    if (snapped !== null) {
                        // 吸附求得有效比例时采用它作为统一组缩放。
                        factor = snapped;
                    }
                }
                let valid = Number.isFinite(factor) && factor > 0;
                for (const snapshot of gesture.snapshots) {
                    // 同一比例映射所有中心及内外半径，保持组内相对布局。
                    const geometry = this._hooks.uniqueGeometry(snapshot.mesh);
                    const target = new Vec2(
                        center.x + (snapshot.center.x - center.x) * factor,
                        center.y + (snapshot.center.y - center.y) * factor,
                    );
                    const parentPoint = ToParent(snapshot.mesh, target);
                    if (parentPoint !== null && this.isAllowedRadius(geometry.sides, snapshot.outer * factor)) {
                        // 局部位置可计算且新半径合法才更新该成员。
                        snapshot.mesh.position.set(parentPoint.x, parentPoint.y);
                        geometry.outer = snapshot.outer * factor;
                        geometry.inner = snapshot.inner * factor;
                        if (!this.withinWorldLimits(snapshot.mesh)) {
                            // 任一成员越界都使整笔组缩放失败。
                            valid = false;
                        }
                    } else {
                        valid = false;
                    }
                }
                if (valid) {
                    // 所有成员通过限制后统一提交组框与事件。
                    if (this._hooks.groupFrame !== null) {
                        // 组框沿用初始比例，不每帧重新计算轴对齐范围。
                        this._hooks.groupFrame.scale.set(gesture.frameScale * factor, gesture.frameScale * factor);
                    }
                    const changed = gesture.snapshots.map(HistoryMesh);
                    for (const mesh of changed) {
                        // 缩放回调逐个发送，位置和编辑回调保持整批发送。
                        this._hooks.emit(this._hooks.onScale, mesh);
                    }
                    this._hooks.emit(this._hooks.onPositionChange, changed);
                    this._hooks.emit(this._hooks.onEdit, changed);
                } else {
                    for (const snapshot of gesture.snapshots) {
                        // 失败时恢复全部成员，而不是留下部分已缩放的对象。
                        snapshot.mesh.position.set(snapshot.position.x, snapshot.position.y);
                        const geometry = snapshot.mesh.data as NGon2D;
                        geometry.outer = snapshot.outer;
                        geometry.inner = snapshot.inner;
                    }
                    if (this._hooks.groupFrame !== null) {
                        // 失败缩放同步恢复组框比例。
                        this._hooks.groupFrame.scale.set(gesture.frameScale, gesture.frameScale);
                    }
                }
            }
        }
    }


    /** @param gesture 组旋转手势 @example this.applyGroupRotate(gesture); @returns 无返回值。 */
    public applyGroupRotate(gesture: NGonGesture): void {
        const center = gesture.frameCenter;
        if (center !== null && this._hooks.rotationEnabled) {
            // 允许旋转且中心存在时才处理组旋转。
            const start = Math.atan2(gesture.startWorld.y - center.y, gesture.startWorld.x - center.x);
            const current = Math.atan2(gesture.currentWorld.y - center.y, gesture.currentWorld.x - center.x);
            const rawAngle = current - start;
            let angle = rawAngle;
            let stepAngle: number | null = null;
            if (this._tool.rotationStepEnabled && this._tool.rotationStep > 0) {
                // 角度步进先量化组旋转增量。
                const radians = this._tool.rotationStep * Math.PI / 180;
                angle = Math.round(angle / radians) * radians;
                stepAngle = angle;
            }
            if (this._tool.snap) {
                // 方向吸附以冻结轮廓比较当前鼠标指向。
                const sources: Vec2[] = [];
                const denseSources: Vec2[] = [];
                // 优先使用低边数对象；只有密集轮廓时仅参与边、交点和网格吸附。
                for (const snapshot of gesture.snapshots) {
                    const geometry = snapshot.mesh.data;
                    if (geometry instanceof NGon2D) {
                        // 只读取正多边形轮廓，其他类型的组合由集合工具接管。
                        if (geometry.sides <= 9) {
                            // 稀疏轮廓可参与顶点方向吸附。
                            sources.push(...snapshot.vertices);
                        } else {
                            denseSources.push(...snapshot.vertices);
                        }
                    }
                }
                const options = { ...this._tool.snapOptions };
                if (sources.length === 0) {
                    // 全是密集轮廓时保留其他吸附项并禁用顶点项。
                    sources.push(...denseSources);
                    options.vertex = false;
                }
                const snapped = FindRotationSnap({
                    pivot: center,
                    sources,
                    targets: RotationSnapTargets(center, sources, rawAngle,
                        this.getSnapGeometry(gesture), options, this._tool.radius, this._tool.camera, this._tool.render),
                    rawAngle,
                    stepAngle,
                    cursor: gesture.currentClient,
                    radius: this._tool.radius,
                    camera: this._tool.camera,
                    render: this._tool.render,
                });
                if (snapped !== null) {
                    // 吸附角度更合适时替代原始或步进角度。
                    angle = snapped;
                }
            }
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            let valid = true;
            for (const snapshot of gesture.snapshots) {
                // 用同一角度绕组中心映射各对象中心。
                const dx = snapshot.center.x - center.x;
                const dy = snapshot.center.y - center.y;
                const target = new Vec2(
                    center.x + dx * cosine - dy * sine,
                    center.y + dx * sine + dy * cosine,
                );
                const parentPoint = ToParent(snapshot.mesh, target);
                if (parentPoint !== null) {
                    // 成功换算到父级后同时更新位置和单体朝向。
                    snapshot.mesh.position.set(parentPoint.x, parentPoint.y);
                    snapshot.mesh.rotation = snapshot.rotation + angle;
                    if (!this.withinWorldLimits(snapshot.mesh)) {
                        // 旋转后任一对象越界都会回退整个组。
                        valid = false;
                    }
                } else {
                    valid = false;
                }
            }
            if (valid) {
                // 所有成员合法后同步组框并通知整批旋转。
                if (this._hooks.groupFrame !== null) {
                    // 让虚线框与实体共享同一累计角度。
                    this._hooks.groupFrame.rotation = gesture.frameRotation + angle;
                }
                const changed = gesture.snapshots.map(HistoryMesh);
                this._hooks.emit(this._hooks.onRotate, changed);
                this._hooks.emit(this._hooks.onPositionChange, changed);
                this._hooks.emit(this._hooks.onEdit, changed);
            } else {
                for (const snapshot of gesture.snapshots) {
                    // 失败旋转恢复每个对象的原始中心和角度。
                    snapshot.mesh.position.set(snapshot.position.x, snapshot.position.y);
                    snapshot.mesh.rotation = snapshot.rotation;
                }
                if (this._hooks.groupFrame !== null) {
                    // 失败时组框也恢复开始角度。
                    this._hooks.groupFrame.rotation = gesture.frameRotation;
                }
            }
        }
    }
}

interface NGonTransformsHooks {
    /** 主编辑器当前的 groupFrame 状态。 */
    groupFrame: Mesh | null;
    /**
     * 按注册顺序通知同一事件的全部监听。
     * @param callbacks 具名监听集合
     * @param args 本次事件参数
     * @example
     * this.emit(this._onEdit, meshes);
     * @returns 无返回值
     */
    emit<Args extends unknown[]>(callbacks: Map<string, (...args: Args) => void>, ...args: Args): void;
    /** 主编辑器当前的 onMove 状态。 */
    readonly onMove: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onPositionChange 状态。 */
    readonly onPositionChange: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onEdit 状态。 */
    readonly onEdit: Map<string, (actives: Mesh[]) => void>;
    /**
     * 分离共享几何，避免一件对象的编辑改变其他 Mesh。
     * @param mesh 目标 Mesh
     * @example
     * const geometry = this.uniqueGeometry(mesh);
     * @returns 只由该 Mesh 持有的正多边形几何
     */
    uniqueGeometry(mesh: Mesh): NGon2D;
    /** 主编辑器当前的 onResize 状态。 */
    readonly onResize: Map<string, (mesh: Mesh) => void>;
    /** 主编辑器当前的 rotationEnabled 状态。 */
    rotationEnabled: boolean;
    /** 主编辑器当前的 onRotate 状态。 */
    readonly onRotate: Map<string, (actives: Mesh[]) => void>;
    /** 主编辑器当前的 onScale 状态。 */
    readonly onScale: Map<string, (mesh: Mesh) => void>;
}

export default NGonTransforms;
export type { NGonTransformsHooks };
