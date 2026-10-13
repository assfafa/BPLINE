import type Mesh from "../../Mesh";
import type { RectEditMode } from "../RectEditTool";
import type { TextEditDocument } from "./data";

/** 具名回调表独立于输入和变换实现，删除同名监听不会影响其他接收者。 */
class TextEditEvents {
    protected readonly _onSelect = new Map<string, (active: Mesh[], actives: Mesh[]) => void>();
    protected readonly _onDeselect = new Map<string, (removed: Mesh[], actives: Mesh[]) => void>();
    protected readonly _onSelectionChange = new Map<string, (actives: Mesh[]) => void>();
    protected readonly _onMove = new Map<string, (actives: Mesh[]) => void>();
    protected readonly _onResize = new Map<string, (mesh: Mesh) => void>();
    protected readonly _onScale = new Map<string, (mesh: Mesh) => void>();
    protected readonly _onRotate = new Map<string, (actives: Mesh[]) => void>();
    protected readonly _onPositionChange = new Map<string, (actives: Mesh[]) => void>();
    protected readonly _onEdit = new Map<string, (actives: Mesh[]) => void>();
    protected readonly _onAdd = new Map<string, (mesh: Mesh) => void>();
    protected readonly _onRemove = new Map<string, (old: Mesh) => void>();
    protected readonly _onDestroy = new Map<string, () => void>();
    protected readonly _onModeChange = new Map<string, (mode: RectEditMode) => void>();
    protected readonly _onSave = new Map<string, (data: TextEditDocument) => void>();
    protected readonly _onBase = new Map<string, (mesh: Mesh) => void>();

    /** @param key 监听名 @param callback 接收刚降级的文字 Mesh @example tool.onBase("ui", (mesh) => inspect(mesh)); @returns 无返回值。 */
    public onBase(key: string, callback: (mesh: Mesh) => void): void {
        this._onBase.set(key, callback);
    }

    /** @param key 监听名 @example tool.onBaseDelete("ui"); @returns 是否删除监听。 */
    public onBaseDelete(key: string): boolean {
        return this._onBase.delete(key);
    }

    /** @internal @param mesh 已降级的对象 @example tool.notifyBase(mesh); @returns 无返回值，触发具名降级监听。 */
    public notifyBase(mesh: Mesh): void {
        this.emit(this._onBase, mesh);
    }

    /**
     * 注册或替换新增选择和完整选择集的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onSelect("panel", () => {});
     * @returns 无返回值。
     */
    public onSelect(key: string, callback: (active: Mesh[], actives: Mesh[]) => void): void {
        this._onSelect.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onSelectDelete("panel"); @returns 是否删除已有监听。 */
    public onSelectDelete(key: string): boolean {
        return this._onSelect.delete(key);
    }

    /**
     * 注册或替换取消选择和剩余选择集的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onDeselect("panel", () => {});
     * @returns 无返回值。
     */
    public onDeselect(key: string, callback: (removed: Mesh[], actives: Mesh[]) => void): void {
        this._onDeselect.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onDeselectDelete("panel"); @returns 是否删除已有监听。 */
    public onDeselectDelete(key: string): boolean {
        return this._onDeselect.delete(key);
    }

    /**
     * 注册或替换完整选择集的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onSelectionChange("panel", () => {});
     * @returns 无返回值。
     */
    public onSelectionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onSelectionChange.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onSelectionChangeDelete("panel"); @returns 是否删除已有监听。 */
    public onSelectionChangeDelete(key: string): boolean {
        return this._onSelectionChange.delete(key);
    }

    /**
     * 注册或替换被移动文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onMove("panel", () => {});
     * @returns 无返回值。
     */
    public onMove(key: string, callback: (actives: Mesh[]) => void): void {
        this._onMove.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onMoveDelete("panel"); @returns 是否删除已有监听。 */
    public onMoveDelete(key: string): boolean {
        return this._onMove.delete(key);
    }

    /**
     * 注册或替换被改尺寸文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onResize("panel", () => {});
     * @returns 无返回值。
     */
    public onResize(key: string, callback: (mesh: Mesh) => void): void {
        this._onResize.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onResizeDelete("panel"); @returns 是否删除已有监听。 */
    public onResizeDelete(key: string): boolean {
        return this._onResize.delete(key);
    }

    /**
     * 注册或替换被缩放文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onScale("panel", () => {});
     * @returns 无返回值。
     */
    public onScale(key: string, callback: (mesh: Mesh) => void): void {
        this._onScale.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onScaleDelete("panel"); @returns 是否删除已有监听。 */
    public onScaleDelete(key: string): boolean {
        return this._onScale.delete(key);
    }

    /**
     * 注册或替换被旋转文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onRotate("panel", () => {});
     * @returns 无返回值。
     */
    public onRotate(key: string, callback: (actives: Mesh[]) => void): void {
        this._onRotate.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onRotateDelete("panel"); @returns 是否删除已有监听。 */
    public onRotateDelete(key: string): boolean {
        return this._onRotate.delete(key);
    }

    /**
     * 注册或替换位置变化文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onPositionChange("panel", () => {});
     * @returns 无返回值。
     */
    public onPositionChange(key: string, callback: (actives: Mesh[]) => void): void {
        this._onPositionChange.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onPositionChangeDelete("panel"); @returns 是否删除已有监听。 */
    public onPositionChangeDelete(key: string): boolean {
        return this._onPositionChange.delete(key);
    }

    /**
     * 注册或替换发生编辑的文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onEdit("panel", () => {});
     * @returns 无返回值。
     */
    public onEdit(key: string, callback: (actives: Mesh[]) => void): void {
        this._onEdit.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onEditDelete("panel"); @returns 是否删除已有监听。 */
    public onEditDelete(key: string): boolean {
        return this._onEdit.delete(key);
    }

    /**
     * 注册或替换新建文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onAdd("panel", () => {});
     * @returns 无返回值。
     */
    public onAdd(key: string, callback: (mesh: Mesh) => void): void {
        this._onAdd.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onAddDelete("panel"); @returns 是否删除已有监听。 */
    public onAddDelete(key: string): boolean {
        return this._onAdd.delete(key);
    }

    /**
     * 注册或替换被删除文字的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onRemove("panel", () => {});
     * @returns 无返回值。
     */
    public onRemove(key: string, callback: (old: Mesh) => void): void {
        this._onRemove.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onRemoveDelete("panel"); @returns 是否删除已有监听。 */
    public onRemoveDelete(key: string): boolean {
        return this._onRemove.delete(key);
    }

    /**
     * 注册或替换工具销毁的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onDestroy("panel", () => {});
     * @returns 无返回值。
     */
    public onDestroy(key: string, callback: () => void): void {
        this._onDestroy.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onDestroyDelete("panel"); @returns 是否删除已有监听。 */
    public onDestroyDelete(key: string): boolean {
        return this._onDestroy.delete(key);
    }

    /**
     * 注册或替换新的编辑模式的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onModeChange("panel", () => {});
     * @returns 无返回值。
     */
    public onModeChange(key: string, callback: (mode: RectEditMode) => void): void {
        this._onModeChange.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onModeChangeDelete("panel"); @returns 是否删除已有监听。 */
    public onModeChangeDelete(key: string): boolean {
        return this._onModeChange.delete(key);
    }

    /**
     * 注册或替换可序列化文字文档的监听。
     * @param key 监听名称
     * @param callback 事件接收函数
     * @example tool.onSave("panel", () => {});
     * @returns 无返回值。
     */
    public onSave(key: string, callback: (data: TextEditDocument) => void): void {
        this._onSave.set(key, callback);
    }

    /** @param key 监听名称 @example tool.onSaveDelete("panel"); @returns 是否删除已有监听。 */
    public onSaveDelete(key: string): boolean {
        return this._onSave.delete(key);
    }

    /** @param map 事件回调表 @param args 当前事件参数 @example this.emit(this._onEdit, meshes); @returns 无返回值。 */
    protected emit<Args extends unknown[]>(map: Map<string, (...args: Args) => void>, ...args: Args): void {
        // 快照允许接收者在回调中替换或删除监听。
        for (const callback of [...map.values()]) {
            callback(...args);
        }
    }
}

export default TextEditEvents;
