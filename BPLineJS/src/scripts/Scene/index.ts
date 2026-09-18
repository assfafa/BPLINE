import type { AddObject, Geometry2d, Material2d } from "../global-types";
import Group from "../Group";
import type { GroupLike } from "../Group";
import Mesh from "../Mesh";
import type { MeshLike } from "../Mesh";
import type { TextureResource } from "../Texture/Layers";
type DrawList = MeshLike;
type GeometryList = Geometry2d;
type MaterialList = Material2d;
type TextureList = TextureResource;
interface SceneLike extends GroupLike {
    drawList: DrawList[];
    geometryList: GeometryList[];
    materialList: MaterialList[];
    textureList: TextureList[];
    /**
     * 版本变化后统一重建四个列表；一个 Render 处理后不影响其他 Render 的缓存快照。
     * @example
     * scene.ensureLists();
     * @returns 计算得到的 DrawList[] 结果。
     */
    ensureLists(): DrawList[];
    /**
     * 将新加入场景的节点及其后代增量写入四个列表。
     * 该方法只负责补充引用；删除节点时由 removeFromLists 处理共享资源校准。
     * @param child 新加入场景树的节点
     * @example
     * scene.addToLists(child);
     * @returns 无返回值
     */
    addToLists(child: AddObject): void;
    /**
     * 从 drawList 中移除节点及其后代包含的 Mesh。
     * 资源可能仍被其他 Mesh 共用，因此只标记下一帧重建另外三个资源列表。
     * @param child 从场景树删除的节点
     * @example
     * scene.removeFromLists(child);
     * @returns 无返回值
     */
    removeFromLists(child: AddObject): void;
    /**
     * 一次递归更新场景的 Mesh、Geometry、Material 和 Texture 四个列表。
     * Geometry、Material 与 Texture 按全局 ID 去重，供 Render 创建和回收缓存。
     * @example
     * scene.updateLists();
     * @returns 更新后的绘制列表
     */
    updateLists(): DrawList[];
    /**
     * 根据当前 drawList 重建 Geometry、Material 和 Texture 三个资源列表。
     * 资源按全局 ID 去重，避免删除共享资源时误伤仍在场景中的 Mesh。
     * @example
     * scene.updateResourceLists();
     * @returns 无返回值
     */
    updateResourceLists(): void;
    /**
     * 更新绘制列表及其关联资源列表。
     * 保留原方法名，现有调用会同步更新全部四个列表。
     * @example
     * scene.updateDrawList();
     * @returns 更新后的绘制列表
     */
    updateDrawList(): DrawList[];
    /**
     * 根据材质列表单独刷新 Texture 列表。
     * 适用于只替换 Style 中 solid、edge、points.texture 的普通渲染帧。
     * @example
     * scene.updateTextureList();
     * @returns 更新后的贴图列表
     */
    updateTextureList(): TextureList[];
    /**
     * 获取当前场景中一个材质实际使用的几何类型，供 materialList 创建管线。
     * @param materialId 材质 ID
     * @example
     * scene.getMaterialGeometryTypes(materialId);
     * @returns 几何类型只读集合；不要修改返回的内部集合
     */
    getMaterialGeometryTypes(materialId: number): ReadonlySet<string>;
    /**
     * 更新场景绘制顺序。
     * 仅按照 Mesh 的 order 从小到大重新排列 drawList，不重建其他资源列表。
     * @example
     * scene.updateDrawOrder();
     * @returns 无返回值
     */
    updateDrawOrder(): void;
}
/**
 * 场景对象
 * 作为场景树的根级容器使用
 * @class
 */
class Scene extends Group implements SceneLike {
    /**
     * 对象类型
     */
    public readonly type: string = "Scene";
    /** CPU 四个列表与贴图列表分别处理到的版本快照，不是额外版本源。 */
    private _listsSnapshot: number = -1;
    private _textureSnapshot: number = -1;
    /**
     * 当前 Scene 中材质实际搭配的几何类型，不使用材质历史类型创建闲置模板。
     */
    private readonly _materialGeometryTypes = new Map<number, Set<string>>();
    /**
     * 当前绘制列表
     */
    drawList: DrawList[] = [];
    /**
     * 当前场景使用的去重 Geometry 列表。
     * 多个 Mesh 共用同一 Geometry 时只保留一个对象引用。
     */
    geometryList: GeometryList[] = [];
    /**
     * 当前场景使用的去重 Material 列表。
     * Material 对象同时提供 id 和 key，分别用于资源销毁与 Pipeline 复用。
     */
    materialList: MaterialList[] = [];
    /**
     * 当前场景使用的去重 Texture 列表。
     */
    textureList: TextureList[] = [];
    /**
     * 创建场景对象
     * @example
     * const scene = new Scene();
     * @returns 创建的 Scene 对象。
     */
    public constructor() {
        super(0, 0);
    }
    /**
     * 版本变化后统一重建四个列表；一个 Render 处理后不影响其他 Render 的缓存快照。
     * @example
     * scene.ensureLists();
     * @returns 计算得到的 DrawList[] 结果。
     */
    public ensureLists(): DrawList[] {
        // 比较当前版本与处理快照，只同步尚未处理的变化。
        if (this._listsSnapshot !== this.version) {
            this.updateLists();
        }
        return this.drawList;
    }
    /**
     * 将新加入场景的节点及其后代增量写入四个列表。
     * 该方法只负责补充引用；删除节点时由 removeFromLists 处理共享资源校准。
     * @param child 新加入场景树的节点
     * @example
     * scene.addToLists(child);
     * @returns 无返回值
     */
    public addToLists(child: AddObject): void {
        /**
         * 收集节点引用的几何和材质，用于重建场景资源列表。
         * @param node 当前轮廓节点
         * @example
         * collect(node);
         * @returns 无返回值。
         */
        const collect = (node: AddObject): void => {
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (node instanceof Mesh && node.data !== undefined && node.material !== undefined) {
                /**
                 * 比较网格标识，避免场景绘制列表重复收集同一对象。
                 * @param mesh 待处理的网格
                 * @example
                 * HasMeshId(mesh);
                 * @returns 是否为当前网格。
                 */
                const HasMeshId = (mesh: DrawList): boolean => mesh.id === node.id;
                // 处理转向与退化边界，避免零面积三角面或不稳定法线。
                if (!this.drawList.some(HasMeshId)) {
                    this.drawList.push(node);
                }
                /**
                 * 比较几何标识，让共享几何在资源列表中只出现一次。
                 * @param geometry 几何对象或顶点数组
                 * @example
                 * HasGeometryId(geometry);
                 * @returns 是否为当前几何。
                 */
                const HasGeometryId = (geometry: GeometryList): boolean => geometry.id === node.data?.id;
                // 按资源 ID 去重，共享对象只在场景资源列表中保留一份。
                if (!this.geometryList.some(HasGeometryId)) {
                    this.geometryList.push(node.data);
                }
                /**
                 * 比较材质标识，让共享材质在资源列表中只出现一次。
                 * @param material 材质对象
                 * @example
                 * HasMaterialId(material);
                 * @returns 是否为当前材质。
                 */
                const HasMaterialId = (material: MaterialList): boolean => material.id === node.material?.id;
                // 按资源 ID 去重，共享对象只在场景资源列表中保留一份。
                if (!this.materialList.some(HasMaterialId)) {
                    this.materialList.push(node.material);
                }
                this.addMaterialGeometryType(node.material.id, node.data.type);
                // 逐项处理 GetMeshTextures(node)，保持集合中的既定顺序。
                for (const texture of GetMeshTextures(node)) {
                    /**
                     * 比较贴图标识，避免共享图片被重复收集。
                     * @param item 当前处理的元素
                     * @example
                     * HasTextureId(item);
                     * @returns 是否为当前贴图。
                     */
                    const HasTextureId = (item: TextureList): boolean => item.id === texture.id;
                    // 处理转向与退化边界，避免零面积三角面或不稳定法线。
                    if (!this.textureList.some(HasTextureId)) {
                        this.textureList.push(texture);
                    }
                }
            }
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (node instanceof Group) {
                // 沿父子关系处理节点，保持场景列表与节点树一致。
                for (const nextChild of node.children) {
                    collect(nextChild);
                }
            }
        };
        collect(child);
        this.updateDrawOrder();
    }
    /**
     * 从 drawList 中移除节点及其后代包含的 Mesh。
     * 资源可能仍被其他 Mesh 共用，因此只标记下一帧重建另外三个资源列表。
     * @param child 从场景树删除的节点
     * @example
     * scene.removeFromLists(child);
     * @returns 无返回值
     */
    public removeFromLists(child: AddObject): void {
        const removedMeshIds: Set<number> = new Set<number>();
        /**
         * 收集节点引用的几何和材质，用于重建场景资源列表。
         * @param node 当前轮廓节点
         * @example
         * collect(node);
         * @returns 无返回值。
         */
        const collect = (node: AddObject): void => {
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (node instanceof Mesh) {
                removedMeshIds.add(node.id);
            }
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (node instanceof Group) {
                // 沿父子关系处理节点，保持场景列表与节点树一致。
                for (const nextChild of node.children) {
                    collect(nextChild);
                }
            }
        };
        collect(child);
        // 区分空数据和有效内容，空集合不创建可绘制资源。
        if (removedMeshIds.size !== 0) {
            /**
             * 沿父级链确认网格是否仍属于当前场景。
             * @param mesh 待处理的网格
             * @example
             * KeepSceneMesh(mesh);
             * @returns 是否保留在当前场景的绘制列表中。
             */
            const KeepSceneMesh = (mesh: DrawList): boolean => {
                return !removedMeshIds.has(mesh.id);
            };
            this.drawList = this.drawList.filter(KeepSceneMesh);
            this.updateVersion();
        } else {
            return;
        }
    }
    /**
     * 一次递归更新场景的 Mesh、Geometry、Material 和 Texture 四个列表。
     * Geometry、Material 与 Texture 按全局 ID 去重，供 Render 创建和回收缓存。
     * @example
     * scene.updateLists();
     * @returns 更新后的绘制列表
     */
    public updateLists(): DrawList[] {
        this.updateVersion();
        const drawList: DrawList[] = [];
        /**
         * 收集节点引用的几何和材质，用于重建场景资源列表。
         * @param child 待收集资源的子节点
         * @example
         * collect(child);
         * @returns 无返回值。
         */
        const collect = (child: AddObject): void => {
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (child instanceof Mesh && child.data !== undefined && child.material !== undefined) {
                drawList.push(child);
            }
            // 区分输入数据形态，使用与实际类型匹配的处理方式。
            if (child instanceof Group) {
                // 沿父子关系处理节点，保持场景列表与节点树一致。
                for (const nextChild of child.children) {
                    collect(nextChild);
                }
            }
        };
        // 沿父子关系处理节点，保持场景列表与节点树一致。
        for (const child of this.children) {
            collect(child);
        }
        this.drawList = drawList;
        this.updateResourceLists();
        this.updateDrawOrder();
        this._listsSnapshot = this.version;
        return this.drawList;
    }
    /**
     * 根据当前 drawList 重建 Geometry、Material 和 Texture 三个资源列表。
     * 资源按全局 ID 去重，避免删除共享资源时误伤仍在场景中的 Mesh。
     * @example
     * scene.updateResourceLists();
     * @returns 无返回值
     */
    public updateResourceLists(): void {
        this._materialGeometryTypes.clear();
        const geometryList: GeometryList[] = [];
        const materialList: MaterialList[] = [];
        const textureList: TextureList[] = [];
        const geometryIds: Set<number> = new Set<number>();
        const materialIds: Set<number> = new Set<number>();
        const textureIds: Set<number> = new Set<number>();
        // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
        for (const mesh of this.drawList) {
            const geometry: GeometryList | undefined = mesh.data;
            const material: MaterialList | undefined = mesh.material;
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (geometry !== undefined && !geometryIds.has(geometry.id)) {
                geometryIds.add(geometry.id);
                geometryList.push(geometry);
            }
            // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
            if (material !== undefined) {
                // 检查集合中的关联关系，避免重复处理或遗漏引用。
                if (!materialIds.has(material.id)) {
                    materialIds.add(material.id);
                    materialList.push(material);
                }
                // 逐项处理 GetMeshTextures(mesh)，保持集合中的既定顺序。
                for (const texture of GetMeshTextures(mesh)) {
                    // 检查集合中的关联关系，避免重复处理或遗漏引用。
                    if (!textureIds.has(texture.id)) {
                        textureIds.add(texture.id);
                        textureList.push(texture);
                    }
                }
                // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
                if (geometry !== undefined) {
                    this.addMaterialGeometryType(material.id, geometry.type);
                }
            } else {
                continue;
            }
        }
        this.geometryList = geometryList;
        this.materialList = materialList;
        this.textureList = textureList;
        this._textureSnapshot = this.version;
    }
    /**
     * 更新绘制列表及其关联资源列表。
     * 保留原方法名，现有调用会同步更新全部四个列表。
     * @example
     * scene.updateDrawList();
     * @returns 更新后的绘制列表
     */
    public updateDrawList(): DrawList[] {
        return this.updateLists();
    }
    /**
     * 根据材质列表单独刷新 Texture 列表。
     * 适用于只替换 Style 中 solid、edge、points.texture 的普通渲染帧。
     * @example
     * scene.updateTextureList();
     * @returns 更新后的贴图列表
     */
    public updateTextureList(): TextureList[] {
        // Material -> Mesh 通知增加 Scene 版本，静止帧不扫描材质版本。
        if (this._textureSnapshot === this.version) {
            return this.textureList;
        } else {
            const previousTextureList: TextureList[] = this.textureList;
            const textureList: TextureList[] = [];
            const textureIds: Set<number> = new Set<number>();
            // 按场景既定顺序处理网格，不在资源准备阶段改变绘制层级。
            for (const mesh of this.drawList) {
                // 逐项处理 GetMeshTextures(mesh)，保持集合中的既定顺序。
                for (const texture of GetMeshTextures(mesh)) {
                    // 检查集合中的关联关系，避免重复处理或遗漏引用。
                    if (!textureIds.has(texture.id)) {
                        textureIds.add(texture.id);
                        textureList.push(texture);
                    }
                }
            }
            this.textureList = textureList;
            // 贴图引用集合变化时通知资源收集，避免稳定帧重复清理。
            if (!HaveSameTextureIds(previousTextureList, textureList)) {
                this.updateVersion();
            }
            this._textureSnapshot = this.version;
            return this.textureList;
        }
    }
    /**
     * 获取当前场景中一个材质实际使用的几何类型，供 materialList 创建管线。
     * @param materialId 材质 ID
     * @example
     * scene.getMaterialGeometryTypes(materialId);
     * @returns 几何类型只读集合；不要修改返回的内部集合
     */
    public getMaterialGeometryTypes(materialId: number): ReadonlySet<string> {
        return this._materialGeometryTypes.get(materialId) ?? new Set<string>();
    }
    /**
     * 记录一个实际 Mesh 的材质与几何类型组合。
     * @param materialId 材质 ID
     * @param geometryType 几何类型
     * @example
     * this.addMaterialGeometryType(materialId, geometryType);
     * @returns 无返回值。
     */
    private addMaterialGeometryType(materialId: number, geometryType: string): void {
        let types = this._materialGeometryTypes.get(materialId);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (types === undefined) {
            types = new Set<string>();
            this._materialGeometryTypes.set(materialId, types);
        }
        types.add(geometryType);
    }
    /**
     * 更新场景绘制顺序。
     * 仅按照 Mesh 的 order 从小到大重新排列 drawList，不重建其他资源列表。
     * @example
     * scene.updateDrawOrder();
     * @returns 无返回值
     */
    public updateDrawOrder(): void {
        /**
         * 按 order 比较网格；相同排序值保留原列表顺序。
         * @param left 比较时的左侧输入
         * @param right 比较时的右侧输入
         * @example
         * CompareMeshOrder(left, right);
         * @returns 排序比较值。
         */
        const CompareMeshOrder = (left: DrawList, right: DrawList): number => {
            return left.order - right.order;
        };
        this.drawList.sort(CompareMeshOrder);
    }
}
/**
 * 获取网格使用的单层图片或实例层表；列表由调用者按 ID 去重。
 * @param mesh 普通或实例网格
 * @example
 * GetMeshTextures(mesh);
 * @returns 材质引用的贴图列表
 */
const GetMeshTextures = (mesh: MeshLike): TextureResource[] => {
    /**
     * 过滤未提供的图片引用，并收窄为有效贴图资源类型。
     * @param texture 贴图对象
     * @example
     * IsTextureResource(texture);
     * @returns 是否存在有效贴图资源。
     */
    const IsTextureResource = (texture: TextureResource | undefined): texture is TextureResource =>
        texture !== undefined;
    return mesh.textures.filter(IsTextureResource);
};
/**
 * 比较两个贴图列表是否包含相同 ID。
 * @param left 左侧贴图列表
 * @param right 右侧贴图列表
 * @example
 * HaveSameTextureIds(left, right);
 * @returns 是否包含相同贴图 ID
 */
const HaveSameTextureIds = (left: readonly TextureResource[], right: readonly TextureResource[]): boolean => {
    // 数量相同时才继续比较引用身份，数量不同已能确定集合发生变化。
    if (left.length === right.length) {
        /**
         * 提取贴图稳定标识，用于比较引用集合。
         * @param texture 贴图对象
         * @example
         * GetTextureId(texture);
         * @returns 贴图 ID。
         */
        const GetTextureId = (texture: TextureResource): number => texture.id;
        const rightIds: Set<number> = new Set<number>(right.map(GetTextureId));
        /**
         * 检查原集合的每个贴图是否仍存在于新集合。
         * @param texture 贴图对象
         * @example
         * HasMatchingTextureId(texture);
         * @returns 是否仍包含该贴图 ID。
         */
        const HasMatchingTextureId = (texture: TextureResource): boolean => rightIds.has(texture.id);
        return left.every(HasMatchingTextureId);
    } else {
        return false;
    }
};
export default Scene;
export type { DrawList, GeometryList, MaterialList, SceneLike, TextureList };
