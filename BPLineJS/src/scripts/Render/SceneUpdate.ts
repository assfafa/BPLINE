import type Camera from "../Camera";
import type Scene from "../Scene";

/** @param scene 场景对象；祖先按版本更新，静止节点不重复计算矩阵 */
const MatrixUpdate = (scene: Scene): void => {
    scene.ensureWorldMatrix();
    for (const mesh of scene.drawList) mesh.ensureWorldMatrix();
};

/** @param scene 场景对象；按版本准备 CPU 列表，不清除任何 Render 的上传状态 */
const InitScene = (scene: Scene): void => {
    scene.ensureLists();
};

/** @param camera 相机对象；按输入和世界矩阵版本准备投影及视图矩阵 */
const InitCamera = (camera: Camera): void => {
    camera.ensureCameraMatrix();
};

export { InitCamera, InitScene, MatrixUpdate };
