/** 可订阅的数学对象，不依赖渲染库或 Mesh 类型。 */
interface VersionedMath {
    readonly version: number;
}
/** 消费者；field 区分同一个数学对象被绑定到多个属性的情况。 */
interface MathSubscriber {
    /**
     * 接收数学对象的变化通知，更新对应字段的消费者版本。
     * @param source 变化来源对象
     * @param field 发生变化的关联字段
     * @example
     * mathSubscriber.onMathChange(source, field);
     * @returns 无返回值。
     */
    onMathChange(source: VersionedMath, field: string): void;
}
/** 数学对象内部订阅表；不保存任何 GPU 资源。 */
class Subscriptions {
    private readonly _subscribers = new Map<MathSubscriber, Set<string>>();
    /**
     * 关联消费者，使后续版本变化能通知该对象。
     * @param subscriber 消费者
     * @param field 关联字段
     * @example
     * subscriptions.add(subscriber, field);
     * @returns 无返回值。
     */
    public add(subscriber: MathSubscriber, field: string): void {
        let fields = this._subscribers.get(subscriber);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (fields === undefined) {
            fields = new Set<string>();
            this._subscribers.set(subscriber, fields);
        }
        fields.add(field);
    }
    /**
     * 解除消费者关联，不销毁被共享的对象。
     * @param subscriber 消费者
     * @param field 省略时解绑该消费者全部字段
     * @example
     * subscriptions.delete(subscriber, field);
     * @returns 无返回值。
     */
    public delete(subscriber: MathSubscriber, field?: string): void {
        // 根据变化字段选择更新范围，避免无关属性触发资源重建。
        if (field === undefined) {
            this._subscribers.delete(subscriber);
        } else {
            const fields = this._subscribers.get(subscriber);
            fields?.delete(field);
            // 区分空数据和有效内容，空集合不创建可绘制资源。
            if (fields?.size === 0) {
                this._subscribers.delete(subscriber);
            }
        }
    }
    /**
     * 向当前订阅者发送变化通知，由接收方安排后续更新。
     * @param source 完成数值和 GPUData 同步后的数学对象
     * @example
     * subscriptions.notify(source);
     * @returns 无返回值。
     */
    public notify(source: VersionedMath): void {
        // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
        for (const [subscriber, fields] of [...this._subscribers]) {
            // 按订阅快照逐项通知或解绑，避免回调修改集合干扰当前遍历。
            for (const field of [...fields]) {
                subscriber.onMathChange(source, field);
            }
        }
    }
}
export default Subscriptions;
export type { MathSubscriber, VersionedMath };
