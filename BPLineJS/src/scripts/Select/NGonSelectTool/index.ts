import type Camera from "../../Camera";
import type Render from "../../Render";
import type Scene from "../../Scene";
import AreaSelectTool from "../AreaSelectTool";

/** NGon2D 普通 Mesh 的点选与 Rect2D 框选工具。 */
class NGonSelectTool extends AreaSelectTool {
    /**
     * 建立选择器并可自动开启候选 Mesh 的包围盒。
     * @param scene 待查询场景。
     * @param render 提供画布尺寸的渲染器。
     * @param camera 当前相机。
     * @param autoEnableBounding 默认 true；合并选择器统一开启时传 false。
     * @example
     * const select = new NGonSelectTool(scene, render, camera);
     * @returns NGon2D 选择器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera, autoEnableBounding: boolean = true) {
        super(scene, render, camera, "NGon2D", autoEnableBounding);
    }
}

export default NGonSelectTool;
