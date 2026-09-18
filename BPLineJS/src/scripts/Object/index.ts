import { Vec2 } from "bpmatrixjs/Math/Vec2";
import { Mat3 } from "bpmatrixjs/Math/Mat3";
import type { MathSubscriber, VersionedMath } from "bpmatrixjs/Math";
import { GETID } from "../ID";
import type { AddObject } from "../global-types";
interface ObjectNodeLike extends MathSubscriber {
    readonly id: number;
    readonly type: string;
    readonly version: number;
    parent: AddObject | null;
    position: Vec2;
    rotation: number;
    scale: Vec2;
    matrix: Mat3;
    worldMatrix: Mat3;
    order: number;
    /**
     * 手动使变换失效；普通 position/scale/rotation 修改已自动通知。
     * @example
     * objectNode.updateVersion();
     * @returns 无返回值。
     */
    updateVersion(): void;
    /**
     * 参数版本改变后才生成本地矩阵。
     * @example
     * objectNode.ensureMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    ensureMatrix(): Mat3;
    /**
     * 先更新祖先，再按自身版本、父矩阵身份和版本更新世界矩阵，不遍历兄弟节点。
     * @example
     * objectNode.ensureWorldMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    ensureWorldMatrix(): Mat3;
    /**
     * 强制根据 position/rotation/scale 生成本地矩阵；覆盖手动指定的本地矩阵。
     * @example
     * objectNode.updateMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    updateMatrix(): Mat3;
    /**
     * 强制重新计算当前世界矩阵，同时保留显式修改的本地矩阵。
     * @example
     * objectNode.updateWorldMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    updateWorldMatrix(): Mat3;
    /**
     * 最终释放数学对象订阅，不移除场景节点，不销毁共享 Vec2/Mat3。
     * @example
     * objectNode.dispose();
     * @returns 无返回值。
     */
    dispose(): void;
}
/** 场景节点变换基类：参数持有一个版本，计算结果和每个消费者各存处理快照。 */
class ObjectNode implements ObjectNodeLike {
    /** 全局节点 ID。 */
    public readonly id: number = GETID();
    /** 节点类型。 */
    public readonly type: string = "ObjectNode";
    private _version: number = 0;
    private _parent: AddObject | null = null;
    private _position: Vec2;
    private _rotation: number = 0;
    private _scale: Vec2;
    private _matrix: Mat3 = new Mat3();
    private _worldMatrix: Mat3 = new Mat3();
    private _order: number = 0;
    private _localSnapshot: number = -1;
    private _worldSnapshot: number = -1;
    private _parentSnapshot: Mat3 | null = null;
    private _parentVersion: number = -1;
    // 内部计算仍会通知 Mesh，但不能把计算结果误当作用户输入再次使自己失效。
    private _writingMatrices: boolean = false;
    protected _nodeDisposed: boolean = false;
    /**
     * 创建对象并建立初始状态及依赖关联。
     * @param x 初始 X 坐标
     * @param y 初始 Y 坐标
     * @example
     * const objectNode = new ObjectNode(x, y);
     * @returns 创建的 ObjectNode 对象。
     */
    public constructor(x: number, y: number) {
        this._position = new Vec2(x, y);
        this._scale = new Vec2(1, 1);
        this._position.add(this, "position");
        this._scale.add(this, "scale");
        this._matrix.add(this, "matrix");
        this._worldMatrix.add(this, "worldMatrix");
    }
    /**
     * 节点输入版本；计算快照不会清除或回退它。
     * @example
     * const value = objectNode.version;
     * @returns 节点输入版本；计算快照不会清除或回退它。
     */
    public get version(): number {
        return this._version;
    }
    /**
     * 手动使变换失效；普通 position/scale/rotation 修改已自动通知。
     * @example
     * objectNode.updateVersion();
     * @returns 无返回值。
     */
    public updateVersion(): void {
        this._version++;
    }
    /**
     * 父节点，场景树结构请通过 Group.add/remove 修改。
     * @example
     * const value = objectNode.parent;
     * @returns 父节点，场景树结构请通过 Group.add/remove 修改。
     */
    public get parent(): AddObject | null {
        return this._parent;
    }
    /**
     * 父节点，场景树结构请通过 Group.add/remove 修改。
     * @param value 父引用，Group 维护 children 与 Scene 列表
     * @example
     * objectNode.parent = value;
     * @returns 无返回值。
     */
    public set parent(value: AddObject | null) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._parent !== value) {
            this._parent = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 位置向量，内部 set/setX/x 赋值均能通知。
     * @example
     * const value = objectNode.position;
     * @returns 位置向量，内部 set/setX/x 赋值均能通知。
     */
    public get position(): Vec2 {
        return this._position;
    }
    /**
     * 位置向量，内部 set/setX/x 赋值均能通知。
     * @param value 新位置向量，替换时解绑旧字段
     * @example
     * objectNode.position = value;
     * @returns 无返回值。
     */
    public set position(value: Vec2) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._position !== value) {
            this._position.delete(this, "position");
            this._position = value;
            value.add(this, "position");
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 本地旋转弧度。
     * @example
     * const value = objectNode.rotation;
     * @returns 本地旋转弧度。
     */
    public get rotation(): number {
        return this._rotation;
    }
    /**
     * 本地旋转弧度。
     * @param value 新旋转弧度
     * @example
     * objectNode.rotation = value;
     * @returns 无返回值。
     */
    public set rotation(value: number) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._rotation !== value) {
            this._rotation = value;
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 缩放向量，可与其他节点共享。
     * @example
     * const value = objectNode.scale;
     * @returns 缩放向量，可与其他节点共享。
     */
    public get scale(): Vec2 {
        return this._scale;
    }
    /**
     * 缩放向量，可与其他节点共享。
     * @param value 新缩放向量
     * @example
     * objectNode.scale = value;
     * @returns 无返回值。
     */
    public set scale(value: Vec2) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._scale !== value) {
            this._scale.delete(this, "scale");
            this._scale = value;
            value.add(this, "scale");
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。
     * @example
     * const value = objectNode.matrix;
     * @returns 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。
     */
    public get matrix(): Mat3 {
        return this._matrix;
    }
    /**
     * 本地矩阵；直接修改类方法会作为自定义矩阵保留，直到变换参数再次改变。
     * @param value 新本地矩阵
     * @example
     * objectNode.matrix = value;
     * @returns 无返回值。
     */
    public set matrix(value: Mat3) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._matrix !== value) {
            this._matrix.delete(this, "matrix");
            this._matrix = value;
            value.add(this, "matrix");
            this.onMathChange(value, "matrix");
        } else {
            return;
        }
    }
    /**
     * 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。
     * @example
     * const value = objectNode.worldMatrix;
     * @returns 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。
     */
    public get worldMatrix(): Mat3 {
        return this._worldMatrix;
    }
    /**
     * 世界矩阵，Mat3 通知用于更新 Mesh 连续矩阵数组。
     * @param value 新世界矩阵
     * @example
     * objectNode.worldMatrix = value;
     * @returns 无返回值。
     */
    public set worldMatrix(value: Mat3) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._worldMatrix !== value) {
            this._worldMatrix.delete(this, "worldMatrix");
            this._worldMatrix = value;
            value.add(this, "worldMatrix");
            this.onMathChange(value, "worldMatrix");
        } else {
            return;
        }
    }
    /**
     * 数学对象完成修改后通知节点；内部计算不反向增加输入版本。
     * @param source 数学对象
     * @param field position/scale/matrix/worldMatrix 关联字段
     * @example
     * objectNode.onMathChange(source, field);
     * @returns 无返回值。
     */
    public onMathChange(source: VersionedMath, field: string): void {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (!this._nodeDisposed && !this._writingMatrices) {
            // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
            if (
                (field === "position" && source === this._position) ||
                (field === "scale" && source === this._scale)
            ) {
                this.updateVersion();
            } else if (
                (field === "matrix" && source === this._matrix) ||
                (field === "worldMatrix" && source === this._worldMatrix)
            ) {
                // 只接收仍与当前字段关联的来源通知，忽略已解绑对象。
                this.updateVersion();
                this._localSnapshot = this.version;
                // 根据变化字段选择更新范围，避免无关属性触发资源重建。
                if (field === "worldMatrix") {
                    this._worldSnapshot = this.version;
                    this._parentSnapshot = this.parent?.worldMatrix ?? null;
                    this._parentVersion = this._parentSnapshot?.version ?? -1;
                }
            }
        } else {
            return;
        }
    }
    /**
     * 参数版本改变后才生成本地矩阵。
     * @example
     * objectNode.ensureMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public ensureMatrix(): Mat3 {
        // 检查生命周期状态，防止已释放对象重新建立订阅或资源。
        if (this._nodeDisposed) {
            throw new Error("Disposed node cannot be updated.");
        }
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (this._localSnapshot !== this.version) {
            this.updateMatrix();
        }
        return this._matrix;
    }
    /**
     * 强制根据 position/rotation/scale 生成本地矩阵；覆盖手动指定的本地矩阵。
     * @example
     * objectNode.updateMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public updateMatrix(): Mat3 {
        const cos: number = Math.cos(this.rotation);
        const sin: number = Math.sin(this.rotation);
        this._writingMatrices = true;
        try {
            this._matrix.set([
                cos * this.scale.x,
                sin * this.scale.x,
                0,
                -sin * this.scale.y,
                cos * this.scale.y,
                0,
                this.position.x,
                this.position.y,
                1,
            ]);
            this._localSnapshot = this.version;
            this._worldSnapshot = -1;
        } finally {
            this._writingMatrices = false;
        }
        return this._matrix;
    }
    /**
     * 先更新祖先，再按自身版本、父矩阵身份和版本更新世界矩阵，不遍历兄弟节点。
     * @example
     * objectNode.ensureWorldMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public ensureWorldMatrix(): Mat3 {
        this.parent?.ensureWorldMatrix();
        this.ensureMatrix();
        const parentMatrix: Mat3 | null = this.parent?.worldMatrix ?? null;
        const parentVersion: number = parentMatrix?.version ?? -1;
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (
            this._worldSnapshot !== this.version ||
            this._parentSnapshot !== parentMatrix ||
            this._parentVersion !== parentVersion
        ) {
            this._writingMatrices = true;
            try {
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (parentMatrix === null) {
                    this._worldMatrix.copy(this._matrix);
                } else {
                    this._worldMatrix.mul(parentMatrix, this._matrix);
                }
                this._worldSnapshot = this.version;
                this._parentSnapshot = parentMatrix;
                this._parentVersion = parentVersion;
            } finally {
                this._writingMatrices = false;
            }
        }
        return this._worldMatrix;
    }
    /**
     * 强制重新计算当前世界矩阵，同时保留显式修改的本地矩阵。
     * @example
     * objectNode.updateWorldMatrix();
     * @returns 计算得到的 Mat3 结果。
     */
    public updateWorldMatrix(): Mat3 {
        this._worldSnapshot = -1;
        return this.ensureWorldMatrix();
    }
    /**
     * 绘制排序值。
     * @example
     * const value = objectNode.order;
     * @returns 绘制排序值。
     */
    public get order(): number {
        return this._order;
    }
    /**
     * 绘制排序值。
     * @param value 新排序值；所属 Scene 递增版本，下一帧重排列表
     * @example
     * objectNode.order = value;
     * @returns 无返回值。
     */
    public set order(value: number) {
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._order !== value) {
            this._order = value;
            let current: AddObject | null = this.parent;
            // 沿父引用向上查找，直到命中目标或到达根节点。
            while (current !== null) {
                // 按几何或图元类型选择对应实现，不混用不同模板的规则。
                if (current.type === "Scene") {
                    current.updateVersion();
                    break;
                }
                current = current.parent;
            }
        } else {
            return;
        }
    }
    /**
     * 最终释放数学对象订阅，不移除场景节点，不销毁共享 Vec2/Mat3。
     * @example
     * objectNode.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._position.delete(this, "position");
        this._scale.delete(this, "scale");
        this._matrix.delete(this, "matrix");
        this._worldMatrix.delete(this, "worldMatrix");
        this._nodeDisposed = true;
    }
}
export default ObjectNode;
export type { ObjectNodeLike };
