import type { PartSubscriber } from "./types";

/** miter 尖角斜接、round 圆接、bevel 切角连接。 */
type JoinType = "miter" | "round" | "bevel";

/** 多边形节点连接样式，只控制几何拓扑，不拥有颜色、宽度或 GPU 缓存。 */
class JoinStyle {
    private _type: JoinType = "miter";
    private _seg: number = 8;
    private readonly _subscribers = new Set<PartSubscriber>();

    /** 默认尖角；bevel 切掉尖端，但不会断开边框。 */
    public get type(): JoinType { return this._type; }
    /** @param value 节点连接类型 */
    public set type(value: JoinType) {
        if (!["miter", "round", "bevel"].includes(value)) throw new TypeError("Invalid join type.");
        if (this._type === value) return;
        this._type = value;
        this.notify("type");
    }
    /** 每个圆接的细分段数，默认 8；不影响填充面或原生线框。 */
    public get seg(): number { return this._seg; }
    /** @param value 1 到 4096 的整数，只有 round 使用此精度 */
    public set seg(value: number) {
        if (!Number.isInteger(value) || value < 1 || value > 4096) throw new RangeError("Join seg must be an integer in [1, 4096].");
        if (this._seg === value) return;
        this._seg = value;
        this.notify("seg");
    }
    /** @param subscriber 通常为所属 Style */
    public add(subscriber: PartSubscriber): void { this._subscribers.add(subscriber); }
    /** @param subscriber 要解绑的 Style */
    public delete(subscriber: PartSubscriber): void { this._subscribers.delete(subscriber); }
    /** 清理订阅，不销毁其他对象。 */
    public dispose(): void { this._subscribers.clear(); }
    /** @param field 改变的字段 */
    private notify(field: string): void {
        for (const subscriber of [...this._subscribers]) subscriber.onPartChange("join", field);
    }
}

export default JoinStyle;
export type { JoinType };
