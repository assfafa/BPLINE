import { Vec2 } from "bpmatrixjs/Math/Vec2";
import Group from "../../Group";
import Mesh from "../../Mesh";
import { CreateGroupFrame } from "../NGonEditTool/geometry";

/** 拥有独立矩形范围的空层级节点；子对象由普通 Group.children 管理。 */
class EditorGroup extends Group {
    /** 局部矩形范围宽度。 */
    public readonly width: number;
    /** 局部矩形范围高度。 */
    public readonly height: number;
    /** 跟随本组变换的虚线边框。 */
    public readonly frame: Mesh;

    /**
     * 创建一个可嵌套的空层级组。
     * @param x 组中心的父级 X 坐标
     * @param y 组中心的父级 Y 坐标
     * @param width 局部范围宽度
     * @param height 局部范围高度
     * @example const group = new EditorGroup(0, 0, 100, 80);
     * @returns 编辑器组。
     */
    public constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = Math.max(width, 0.001);
        this.height = Math.max(height, 0.001);
        this.frame = CreateGroupFrame({
            left: -this.width / 2,
            right: this.width / 2,
            bottom: -this.height / 2,
            top: this.height / 2,
            center: new Vec2(0, 0),
            width: this.width,
            height: this.height,
        });
        this.add(this.frame);
    }

    /** @example const fixed = group.ignoreZoom; @returns 组范围是否抵消相机 zoom，默认关闭。 */
    public get ignoreZoom(): boolean {
        return this.frame.ignoreZoom;
    }

    /** @param value 是否保持组框的屏幕尺寸 @example group.ignoreZoom = true; @returns 无返回值。 */
    public set ignoreZoom(value: boolean) {
        this.frame.ignoreZoom = value;
    }

    /** @example group.disposeFrame(); @returns 无返回值。 */
    public disposeFrame(): void {
        this.frame.removeSelf();
        this.frame.dispose();
    }
}

export default EditorGroup;
