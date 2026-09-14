/** 可订阅的数学对象，不依赖渲染库或 Mesh 类型。 */
interface VersionedMath {
    readonly version: number;
}

/** 消费者；field 区分同一个数学对象被绑定到多个属性的情况。 */
interface MathSubscriber {
    onMathChange(source: VersionedMath, field: string): void;
}

/** 数学对象内部订阅表；不保存任何 GPU 资源。 */
class Subscriptions {
    private readonly _subscribers = new Map<MathSubscriber, Set<string>>();

    /** @param subscriber 消费者 @param field 关联字段 */
    public add(subscriber: MathSubscriber, field: string): void {
        let fields = this._subscribers.get(subscriber);
        if (fields === undefined) {
            fields = new Set<string>();
            this._subscribers.set(subscriber, fields);
        }
        fields.add(field);
    }

    /** @param subscriber 消费者 @param field 省略时解绑该消费者全部字段 */
    public delete(subscriber: MathSubscriber, field?: string): void {
        if (field === undefined) this._subscribers.delete(subscriber);
        else {
            const fields = this._subscribers.get(subscriber);
            fields?.delete(field);
            if (fields?.size === 0) this._subscribers.delete(subscriber);
        }
    }

    /** @param source 完成数值和 GPUData 同步后的数学对象 */
    public notify(source: VersionedMath): void {
        for (const [subscriber, fields] of [...this._subscribers]) {
            for (const field of [...fields]) subscriber.onMathChange(source, field);
        }
    }
}

export default Subscriptions;
export type { MathSubscriber, VersionedMath };
