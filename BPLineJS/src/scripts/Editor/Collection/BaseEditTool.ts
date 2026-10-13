import { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import Group from "../../Group";
import CloneMaterial from "../../Material/CloneMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import Style from "../../Style";
import type { Material2d } from "../../global-types";
import type { EditSwitches } from "../EditSwitches";
import { CreateEditSwitches } from "../EditSwitches";

/** 合并编辑器专用的 Base2D 轮廓节点编辑器；不提供画图创建入口。 */
class BaseEditTool {
    /** 候选 Base2D 所在场景。 */
    public readonly scene: Scene;
    /** 坐标换算使用的渲染器。 */
    public readonly render: Render;
    /** 坐标换算使用的相机。 */
    public readonly camera: Camera;
    /** 标记轮廓节点的辅助组。 */
    public readonly frameGroup: Group = new Group(0, 0);
    /** 当前选中的 Base2D Mesh。 */
    public actives: Mesh[] = [];
    /** 顶点与轮廓边的屏幕拾取半径。 */
    public radius: number = 10;
    /** Base 轮廓的移动、拖点和插点开关。 */
    public switches: EditSwitches = CreateEditSwitches();

    private readonly _savedStyles = new Map<Mesh, SavedBaseStyle>();
    private _gesture: BaseGesture | null = null;
    private _onSelectionChange: ((actives: Mesh[]) => void) | null = null;
    private _onEdit: ((actives: Mesh[]) => void) | null = null;

    /**
     * 创建只接收外部转发事件的 Base 编辑器。
     * @param scene 编辑场景
     * @param render 当前渲染器
     * @param camera 当前相机
     * @example const base = new BaseEditTool(scene, render, camera);
     * @returns Base 编辑器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera) {
        this.scene = scene;
        this.render = render;
        this.camera = camera;
        scene.add(this.frameGroup);
    }

    /** @example const meshes = base.movingMeshes; @returns 当前实体平移手势中的 Base2D 集合。 */
    public get movingMeshes(): Mesh[] {
        const gesture = this._gesture;
        // 拖动轮廓节点会改几何，只允许实体内部平移改变父容器。
        if (gesture !== null && gesture.contourIndex === null) {
            return [gesture.mesh];
        } else {
            return [];
        }
    }

    /**
     * 接收集合平移后的编辑通知，不重复变换轮廓。
     * @param meshes 已移动的 Base2D 成员
     * @example base.notifyExternalMove([mesh]);
     * @returns 无返回值。
     */
    public notifyExternalMove(meshes: Mesh[]): void {
        // Base 目前只有统一编辑回调，空分组不触发通知。
        if (meshes.length > 0) {
            this._onEdit?.([...meshes]);
            this.update();
        }
    }

    /** @param mesh 编辑对象 @example base.sourceStyle(mesh); @returns 未覆盖关键点样式的用户样式。 */
    public sourceStyle(mesh: Mesh): Style {
        const saved = this._savedStyles.get(mesh);
        return saved?.meshStyle ?? saved?.geometryStyle ?? mesh.style ?? mesh.data?.style ?? new Style();
    }

    /**
     * 关联集合的选择状态。
     * @param callback 选择改变后的接收函数
     * @example base.onSelectionChange((meshes) => editor.sync(meshes));
     * @returns 无返回值。
     */
    public onSelectionChange(callback: (actives: Mesh[]) => void): void {
        this._onSelectionChange = callback;
    }

    /**
     * 关联集合的历史与编辑事件。
     * @param callback 几何或位置变化后的接收函数
     * @example base.onEdit((meshes) => editor.changed(meshes));
     * @returns 无返回值。
     */
    public onEdit(callback: (actives: Mesh[]) => void): void {
        this._onEdit = callback;
    }

    /**
     * 更新 Base 选择，不会自动创建任何几何。
     * @param meshes 待选 Mesh
     * @example base.select([mesh]);
     * @returns 无返回值。
     */
    public select(meshes: readonly Mesh[]): void {
        const next: Mesh[] = [];
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (const mesh of meshes) {
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (mesh.data instanceof Base2D && !mesh.noSelect && this.scene.ensureLists().includes(mesh)) {
                next.push(mesh);
            }
        }
        /** @param mesh 候选 Mesh @param index 所在位置 @example WasChanged(mesh, index); @returns 是否与原选择不一致。 */
        const WasChanged = (mesh: Mesh, index: number): boolean => mesh !== this.actives[index];
        const changed = next.length !== this.actives.length || next.some(WasChanged);
        // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
        if (changed) {
            // 先恢复离开选择集的对象，避免选中样式残留在共享资源上。
            for (const mesh of this.actives) {
                // 保留的对象继续使用当前独立点型样式。
                if (!next.includes(mesh)) {
                    this.restoreStyle(mesh);
                }
            }
            // 新增成员才分离几何和材质，避免重复复制资源。
            for (const mesh of next) {
                // 旧成员已拥有独立样式，无需再次套用。
                if (!this.actives.includes(mesh)) {
                    this.applySelectStyle(mesh);
                }
            }
            this.actives = next;
            this.update();
            this._onSelectionChange?.([...next]);
        }
    }

    /**
     * 按下轮廓节点、边或对象内部；内部三角面顶点不会命中。
     * @param event 指针事件
     * @param pickedMesh 合并选择器命中的对象，避免多选时移动错误成员
     * @example base.handlePointerDown(event, pickedMesh);
     * @returns 是否开始了编辑手势。
     */
    public handlePointerDown(event: PointerEvent, pickedMesh: Mesh | null = null): boolean {
        const client = new Vec2(event.clientX, event.clientY);
        const target = this.pickContourVertex(client);
        const edge = this.pickContourEdge(client);
        let started = false;
        // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
        if (target !== null && this.switches.resize) {
            const world = this.camera.windowToWorld(client, this.render);
            this._gesture = {
                mesh: target.mesh,
                pointerId: event.pointerId,
                startWorld: world,
                startPosition: target.mesh.position.clone(),
                contourIndex: target.contourIndex,
                vertexIndex: target.vertexIndex,
            };
            started = true;
        } else if (target === null && edge !== null && edge.mesh.data instanceof Base2D && this.switches.insertVertex) {
            // 在真正的实体边上拆分三角面，随后把新节点交给现有拖点手势。
            const geometry = edge.mesh.data;
            // 没有相邻实体面的轮廓边不建立虚假的可拖动节点。
            if (geometry.insertContourPoint(edge.contourIndex, edge.edgeIndex, edge.ratio)) {
                const world = this.camera.windowToWorld(client, this.render);
                this._gesture = {
                    mesh: edge.mesh,
                    pointerId: event.pointerId,
                    startWorld: world,
                    startPosition: edge.mesh.position.clone(),
                    contourIndex: edge.contourIndex,
                    vertexIndex: edge.edgeIndex + 1,
                };
                this._onEdit?.([edge.mesh]);
                started = true;
            }
        } else if (pickedMesh !== null && this.actives.includes(pickedMesh) && this.switches.move) {
            // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
            const world = this.camera.windowToWorld(client, this.render);
            const mesh = pickedMesh;
            this._gesture = {
                mesh,
                pointerId: event.pointerId,
                startWorld: world,
                startPosition: mesh.position.clone(),
                contourIndex: null,
                vertexIndex: null,
            };
            started = true;
        }
        return started;
    }

    /**
     * 按当前鼠标位置移动轮廓节点或 Mesh。
     * @param event 指针事件
     * @example base.handlePointerMove(event);
     * @returns 无返回值。
     */
    public handlePointerMove(event: PointerEvent): void {
        const gesture = this._gesture;
        // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
        if (gesture !== null && gesture.pointerId === event.pointerId) {
            const geometry = gesture.mesh.data;
            const world = this.camera.windowToWorld(new Vec2(event.clientX, event.clientY), this.render);
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (geometry instanceof Base2D && gesture.contourIndex !== null && gesture.vertexIndex !== null) {
                const local = WorldToLocal(gesture.mesh.getRenderMatrix(this.camera).data, world);
                // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
                if (local !== null) {
                    geometry.setContourPoint(gesture.contourIndex, gesture.vertexIndex, local.x, local.y);
                    this._onEdit?.([gesture.mesh]);
                }
            } else {
                const desiredWorld = new Vec2(
                    gesture.startWorld.x + world.x - gesture.startWorld.x,
                    gesture.startWorld.y + world.y - gesture.startWorld.y,
                );
                const parent = gesture.mesh.parent;
                let delta = new Vec2(world.x - gesture.startWorld.x, world.y - gesture.startWorld.y);
                // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
                if (parent !== null) {
                    const origin = WorldToLocal(parent.ensureWorldMatrix().data, gesture.startWorld);
                    const current = WorldToLocal(parent.ensureWorldMatrix().data, desiredWorld);
                    // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
                    if (origin !== null && current !== null) {
                        delta = new Vec2(current.x - origin.x, current.y - origin.y);
                    }
                }
                gesture.mesh.position.set(gesture.startPosition.x + delta.x, gesture.startPosition.y + delta.y);
                this._onEdit?.([gesture.mesh]);
            }
            this.update();
        }
    }

    /**
     * 结束对应指针的编辑手势。
     * @param event 指针事件
     * @example base.handlePointerUp(event);
     * @returns 无返回值。
     */
    public handlePointerUp(event: PointerEvent): void {
        // 只处理本轮指针手势，避免另一个输入修改正在编辑的对象。
        if (this._gesture?.pointerId === event.pointerId) {
            this._gesture = null;
        }
    }

    /** @example base.cancel(); @returns 无返回值。 */
    public cancel(): void {
        this._gesture = null;
    }

    /** @example base.update(); @returns 无返回值。关键点由 Base2D 的点分区跟随几何更新。 */
    public update(): void {
        // 关键点由 Style.points 和同一套 BaseMaterial 管线绘制，无独立 Mesh。
    }

    /** @param mesh 本次选中的 Base Mesh @example this.applySelectStyle(mesh); @returns 无返回值。 */
    private applySelectStyle(mesh: Mesh): void {
        const geometry = mesh.data;
        const material = mesh.material;
        // 只有 Base2D 与完整材质能切换为统一的点分区。
        if (geometry instanceof Base2D && material !== undefined) {
            // 几何或材质可能与其他对象共享，选中外观始终单独持有。
            const independent = geometry.clone();
            mesh.data = independent;
            const style = (mesh.style ?? independent.style).clone();
            style.edge.enabled = true;
            style.edge.width = 3;
            style.edge.color.setHex("#ffe66a");
            style.points.enabled = true;
            style.points.vertices = true;
            style.points.midpoints = false;
            style.points.radius = 4;
            style.points.color.setHex("#ffe66a");
            const selectionMaterial = CloneMaterial(material, style);
            this._savedStyles.set(mesh, {
                meshStyle: mesh.style,
                geometryStyle: independent.style,
                material,
                selectionMaterial,
            });
            mesh.material = selectionMaterial;
            mesh.style = style;
        }
    }

    /** @param mesh 取消选择的 Base Mesh @example this.restoreStyle(mesh); @returns 无返回值。 */
    private restoreStyle(mesh: Mesh): void {
        const saved = this._savedStyles.get(mesh);
        // 未被本工具接管的对象无需修改样式。
        if (saved !== undefined) {
            mesh.style = saved.meshStyle;
            mesh.material = saved.material;
            // 没有 Mesh 自身样式时，还原几何单独持有的原始样式。
            if (saved.meshStyle === undefined && mesh.data instanceof Base2D) {
                mesh.data.style = saved.geometryStyle;
            }
            saved.selectionMaterial.dispose();
            this._savedStyles.delete(mesh);
        }
    }

    /** @example base.destroy(); @returns 无返回值。 */
    public destroy(): void {
        this.cancel();
        this.select([]);
        this.frameGroup.removeSelf();
    }

    /**
     * 仅搜索当前选中 Base2D 的轮廓节点。
     * @param client 窗口坐标
     * @example const hit = base.pickContourVertex(client);
     * @returns 最近的边界节点或 null。
     */
    private pickContourVertex(client: Vec2): { mesh: Mesh; contourIndex: number; vertexIndex: number } | null {
        let nearest: { mesh: Mesh; contourIndex: number; vertexIndex: number } | null = null;
        let distance = this.radius;
        // 依次处理当前集合，保持对象顺序并避免遗漏成员。
        for (const mesh of this.actives) {
            const geometry = mesh.data;
            // 按几何归属执行对应操作，避免跨类型工具改动同一个 Mesh。
            if (geometry instanceof Base2D) {
                const matrix = mesh.getRenderMatrix(this.camera).data;
                const contours = geometry.contours;
                // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
                for (let contourIndex = 0; contourIndex < contours.length; contourIndex++) {
                    const contour = contours[contourIndex];
                    // 边界节点须形成可追踪的轮廓，内部剖分点不参与编辑。
                    for (let vertexIndex = 0; vertexIndex < contour.length / 2; vertexIndex++) {
                        const x = contour[vertexIndex * 2];
                        const y = contour[vertexIndex * 2 + 1];
                        const world = new Vec2(matrix[0] * x + matrix[3] * y + matrix[6],
                            matrix[1] * x + matrix[4] * y + matrix[7]);
                        const screen = this.camera.worldToWindow(world, this.render);
                        const candidateDistance = Math.hypot(screen.x - client.x, screen.y - client.y);
                        // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
                        if (candidateDistance <= distance) {
                            distance = candidateDistance;
                            nearest = { mesh, contourIndex, vertexIndex };
                        }
                    }
                }
            }
        }
        return nearest;
    }

    /**
     * 在已选 Base2D 的闭合轮廓中寻找最近的边。
     * @param client 窗口坐标
     * @example const hit = base.pickContourEdge(client);
     * @returns 边及其投影比例，或 null。
     */
    private pickContourEdge(client: Vec2): { mesh: Mesh; contourIndex: number; edgeIndex: number;
        ratio: number; } | null {
        let nearest: { mesh: Mesh; contourIndex: number; edgeIndex: number; ratio: number } | null = null;
        let distance = this.radius;
        // 只从当前选中对象提取轮廓，内部剖分边不产生编辑节点。
        for (const mesh of this.actives) {
            const geometry = mesh.data;
            // 只有实际 Base2D 轮廓能够提供可拆分的实体边。
            if (geometry instanceof Base2D) {
                const matrix = mesh.getRenderMatrix(this.camera).data;
                const contours = geometry.contours;
                // 每个闭合环分别计算边，孔轮廓不会跨环相连。
                for (let contourIndex = 0; contourIndex < contours.length; contourIndex++) {
                    const contour = contours[contourIndex];
                    const count = contour.length / 2;
                    // 包括末节点到首节点的闭合边。
                    for (let edgeIndex = 0; edgeIndex < count; edgeIndex++) {
                        const nextIndex = (edgeIndex + 1) % count;
                        const firstX = contour[edgeIndex * 2];
                        const firstY = contour[edgeIndex * 2 + 1];
                        const nextX = contour[nextIndex * 2];
                        const nextY = contour[nextIndex * 2 + 1];
                        const firstWorld = new Vec2(matrix[0] * firstX + matrix[3] * firstY + matrix[6],
                            matrix[1] * firstX + matrix[4] * firstY + matrix[7]);
                        const nextWorld = new Vec2(matrix[0] * nextX + matrix[3] * nextY + matrix[6],
                            matrix[1] * nextX + matrix[4] * nextY + matrix[7]);
                        const first = this.camera.worldToWindow(firstWorld, this.render);
                        const next = this.camera.worldToWindow(nextWorld, this.render);
                        const deltaX = next.x - first.x;
                        const deltaY = next.y - first.y;
                        const lengthSquared = deltaX * deltaX + deltaY * deltaY;
                        // 零长边不能投影，也不能在三角面上插入不同的新节点。
                        if (lengthSquared > 0) {
                            const ratio = ((client.x - first.x) * deltaX +
                                (client.y - first.y) * deltaY) / lengthSquared;
                            const clamped = Math.max(0, Math.min(1, ratio));
                            const candidateDistance = Math.hypot(client.x - first.x - deltaX * clamped,
                                client.y - first.y - deltaY * clamped);
                            // 端点由顶点优先拾取；边拖动仅在内部投影处插点。
                            if (ratio > 0 && ratio < 1 && candidateDistance <= distance) {
                                distance = candidateDistance;
                                nearest = { mesh, contourIndex, edgeIndex, ratio };
                            }
                        }
                    }
                }
            }
        }
        return nearest;
    }

    /** @param client 窗口坐标 @example const mesh = base.pickContourMesh(client); @returns 命中边界手柄所属的 Mesh。 */
    public pickContourMesh(client: Vec2): Mesh | null {
        let hit: Mesh | null = null;
        // 只让仍可编辑的轮廓部位进入集合编辑器的优先命中列表。
        if (this.switches.resize) {
            const vertex = this.pickContourVertex(client);
            // 顶点仍可编辑时优先于附近的轮廓边。
            if (vertex !== null) {
                hit = vertex.mesh;
            }
        }
        // 顶点未命中后才允许沿边插入节点。
        if (hit === null && this.switches.insertVertex) {
            hit = this.pickContourEdge(client)?.mesh ?? null;
        }
        return hit;
    }
}

interface BaseGesture {
    mesh: Mesh;
    pointerId: number;
    startWorld: Vec2;
    startPosition: Vec2;
    contourIndex: number | null;
    vertexIndex: number | null;
}

interface SavedBaseStyle {
    meshStyle: Style | undefined;
    geometryStyle: Style;
    material: Material2d;
    selectionMaterial: Material2d;
}

/**
 * 消去 Mesh 世界矩阵以编辑局部轮廓点。
 * @param matrix 当前世界矩阵
 * @param point 世界坐标
 * @example const local = WorldToLocal(matrix, point);
 * @returns 局部坐标；不可逆时返回 null。
 */
const WorldToLocal = (matrix: ArrayLike<number>, point: Vec2): Vec2 | null => {
    const determinant = matrix[0] * matrix[4] - matrix[3] * matrix[1];
    // 只允许已选的边界节点和所属 Mesh 进入编辑手势。
    if (Number.isFinite(determinant) && determinant !== 0) {
        const x = point.x - matrix[6];
        const y = point.y - matrix[7];
        return new Vec2((matrix[4] * x - matrix[3] * y) / determinant,
            (matrix[0] * y - matrix[1] * x) / determinant);
    } else {
        return null;
    }
};

export default BaseEditTool;
