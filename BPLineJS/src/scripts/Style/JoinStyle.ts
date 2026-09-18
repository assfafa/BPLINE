import type { PartSubscriber } from "./types";
/** miter 尖角斜接、round 圆接、bevel 切角连接。 */
type JoinType = "miter" | "round" | "bevel";
/** 多边形节点连接样式，只控制几何拓扑，不拥有颜色、宽度或 GPU 缓存。 */
class JoinStyle {
    private _type: JoinType = "miter";
    private _seg: number = 8;
    private readonly _subscribers = new Set<PartSubscriber>();
    /**
     * 默认尖角；bevel 切掉尖端，但不会断开边框。
     * @example
     * const value = joinStyle.type;
     * @returns 默认尖角；bevel 切掉尖端，但不会断开边框。
     */
    public get type(): JoinType {
        return this._type;
    }
    /**
     * 默认尖角；bevel 切掉尖端，但不会断开边框。
     * @param value 节点连接类型
     * @example
     * joinStyle.type = value;
     * @returns 无返回值。
     */
    public set type(value: JoinType) {
        // 拒绝未支持的枚举值，避免 CPU 配置与着色器模式不一致。
        if (!["miter", "round", "bevel"].includes(value)) {
            throw new TypeError("Invalid join type.");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._type !== value) {
            this._type = value;
            this.notify("type");
        } else {
            return;
        }
    }
    /**
     * 每个圆接的细分段数，默认 8；不影响填充面或原生线框。
     * @example
     * const value = joinStyle.seg;
     * @returns 每个圆接的细分段数，默认 8；不影响填充面或原生线框。
     */
    public get seg(): number {
        return this._seg;
    }
    /**
     * 每个圆接的细分段数，默认 8；不影响填充面或原生线框。
     * @param value 1 到 4096 的整数，只有 round 使用此精度
     * @example
     * joinStyle.seg = value;
     * @returns 无返回值。
     */
    public set seg(value: number) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (!Number.isInteger(value) || value < 1 || value > 4096) {
            throw new RangeError("Join seg must be an integer in [1, 4096].");
        }
        // 仅在属性实际改变时更新状态，避免重复订阅和版本递增。
        if (this._seg !== value) {
            this._seg = value;
            this.notify("seg");
        } else {
            return;
        }
    }
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param subscriber 通常为所属 Style
     * @example
     * joinStyle.add(subscriber);
     * @returns 无返回值。
     */
    public add(subscriber: PartSubscriber): void {
        this._subscribers.add(subscriber);
    }
    /**
     * 解除消费者关联，不销毁被共享的对象。
     * @param subscriber 要解绑的 Style
     * @example
     * joinStyle.delete(subscriber);
     * @returns 无返回值。
     */
    public delete(subscriber: PartSubscriber): void {
        this._subscribers.delete(subscriber);
    }
    /**
     * 清理订阅，不销毁其他对象。
     * @example
     * joinStyle.dispose();
     * @returns 无返回值。
     */
    public dispose(): void {
        this._subscribers.clear();
    }
    /**
     * 向当前订阅者发送变化通知，由接收方安排后续更新。
     * @param field 改变的字段
     * @example
     * this.notify(field);
     * @returns 无返回值。
     */
    private notify(field: string): void {
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const subscriber of [...this._subscribers]) {
            subscriber.onPartChange("join", field);
        }
    }
}
export default JoinStyle;
export type { JoinType };
