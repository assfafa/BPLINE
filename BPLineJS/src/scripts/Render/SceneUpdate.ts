import type Camera from "../Camera";
import type Scene from "../Scene";
/**
 * 更新场景节点的世界矩阵，供后续缓冲上传使用。
 * @param scene 场景对象；祖先按版本更新，静止节点不重复计算矩阵
 * @example
 * MatrixUpdate(scene);
 * @returns 无返回值。
 */
const MatrixUpdate = (scene: Scene): void => {
    scene.ensureWorldMatrix();
    // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
    for (const mesh of scene.drawList) {
        mesh.ensureWorldMatrix();
    }
};
/**
 * 刷新场景资源列表，让渲染准备阶段使用当前引用关系。
 * @param scene 场景对象；按版本准备 CPU 列表，不清除任何 Render 的上传状态
 * @example
 * InitScene(scene);
 * @returns 无返回值。
 */
const InitScene = (scene: Scene): void => {
    scene.ensureLists();
};
/**
 * 确保相机投影及视图矩阵与当前输入参数一致。
 * @param camera 相机对象；按输入和世界矩阵版本准备投影及视图矩阵
 * @example
 * InitCamera(camera);
 * @returns 无返回值。
 */
const InitCamera = (camera: Camera): void => {
    camera.ensureCameraMatrix();
};
export { InitCamera, InitScene, MatrixUpdate };
