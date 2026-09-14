import SolidStyle from "./SolidStyle";
import WireframeStyle from "./WireframeStyle";
import EdgeStyle from "./EdgeStyle";
import PointsStyle from "./PointsStyle";
import JoinStyle from "./JoinStyle";
import type { PartSubscriber, StyleArea, StyleSubscriber } from "./types";

/** 共享样式；四个显示分区与节点连接样式独立持有参数，通过订阅链通知使用者。 */
class Style implements PartSubscriber {
    private readonly _solid: SolidStyle;
    private readonly _wireframe: WireframeStyle;
    private readonly _edge: EdgeStyle;
    private readonly _points: PointsStyle;
    private readonly _join: JoinStyle;
    private readonly _subscribers = new Set<StyleSubscriber>();
    private _version: number = 0;

    /** 构建四个关闭的显示分区及默认尖角连接，并订阅它们的变化。 */
    public constructor() {
        this._solid = new SolidStyle();
        this._wireframe = new WireframeStyle();
        this._edge = new EdgeStyle();
        this._points = new PointsStyle();
        this._join = new JoinStyle();
        this._solid.add(this);
        this._wireframe.add(this);
        this._edge.add(this);
        this._points.add(this);
        this._join.add(this);
    }
    /** 实体面与 SDF 样式。 */
    public get solid(): SolidStyle { return this._solid; }
    /** 原生线框样式。 */
    public get wireframe(): WireframeStyle { return this._wireframe; }
    /** 实体三角面边框样式。 */
    public get edge(): EdgeStyle { return this._edge; }
    /** 关键点样式。 */
    public get points(): PointsStyle { return this._points; }
    /** 多边形连接类型和精度，由 Geometry.style 决定，不随实例单独生成。 */
    public get join(): JoinStyle { return this._join; }
    /** 任意分区变化时递增的单一版本。 */
    public get version(): number { return this._version; }

    /** @param subscriber 几何、材质或未来实现通知协议的 IMesh */
    public add(subscriber: StyleSubscriber): void { this._subscribers.add(subscriber); }
    /** @param subscriber 解除订阅的对象，不销毁资源 */
    public delete(subscriber: StyleSubscriber): void { this._subscribers.delete(subscriber); }

    /**
     * 最终停止使用时释放整条订阅链，不销毁共享颜色、贴图或 GPU 缓存。
     * 仅在所有 Geometry / Material 均停止使用该 Style 后调用，不应再复用。
     */
    public dispose(): void {
        this._solid.dispose();
        this._wireframe.dispose();
        this._edge.dispose();
        this._points.dispose();
        this._join.dispose();
        this._subscribers.clear();
    }

    /**
     * 将分区变化转发给使用者；接收者自行判断是否影响 CPU 几何。
     * @param area 变化区域
     * @param field 变化字段
     */
    public onPartChange(area: Exclude<StyleArea, "whole">, field: string): void {
        this._version++;
        const change = Object.freeze({ source: this, area, field });
        for (const subscriber of [...this._subscribers]) subscriber.onStyleChange(change);
    }
}
export default Style;
export { SolidStyle, WireframeStyle, EdgeStyle, PointsStyle, JoinStyle };
export type { JoinType } from "./JoinStyle";
export { WriteStyleData, STYLE_STRIDE } from "./WriteStyleData";
export type { StyleArea, StyleChange, StyleSubscriber, BorderAlign, PixelAligned, PartSubscriber } from "./types";
