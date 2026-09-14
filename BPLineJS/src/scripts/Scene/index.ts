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
    ensureLists(): DrawList[];
    addToLists(child: AddObject): void;
    removeFromLists(child: AddObject): void;
    updateLists(): DrawList[];
    updateResourceLists(): void;
    updateDrawList(): DrawList[];
    updateTextureList(): TextureList[];
    getMaterialGeometryTypes(materialId: number): ReadonlySet<string>;
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
     */
    public constructor() {
        super(0, 0);
    }

    /** 版本变化后统一重建四个列表；一个 Render 处理后不影响其他 Render 的缓存快照。 */
    public ensureLists(): DrawList[] {
        if (this._listsSnapshot !== this.version) this.updateLists();
        return this.drawList;
    }

    /**
     * 将新加入场景的节点及其后代增量写入四个列表。
     * 该方法只负责补充引用；删除节点时由 removeFromLists 处理共享资源校准。
     * @param child 新加入场景树的节点
     * @returns 无返回值
     */
    public addToLists(child: AddObject): void {
        const collect = (node: AddObject): void => {
            if (node instanceof Mesh && node.data !== undefined && node.material !== undefined) {
                if (!this.drawList.some((mesh: DrawList): boolean => mesh.id === node.id)) {
                    this.drawList.push(node);
                }

                if (!this.geometryList.some((geometry: GeometryList): boolean => geometry.id === node.data?.id)) {
                    this.geometryList.push(node.data);
                }

                if (!this.materialList.some((material: MaterialList): boolean => material.id === node.material?.id)) {
                    this.materialList.push(node.material);
                }
                this.addMaterialGeometryType(node.material.id, node.data.type);

                for (const texture of GetMeshTextures(node)) {
                    if (!this.textureList.some((item: TextureList): boolean => item.id === texture.id)) {
                        this.textureList.push(texture);
                    }
                }
            }

            if (node instanceof Group) {
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
     * @returns 无返回值
     */
    public removeFromLists(child: AddObject): void {
        const removedMeshIds: Set<number> = new Set<number>();
        const collect = (node: AddObject): void => {
            if (node instanceof Mesh) {
                removedMeshIds.add(node.id);
            }

            if (node instanceof Group) {
                for (const nextChild of node.children) {
                    collect(nextChild);
                }
            }
        };

        collect(child);

        if (removedMeshIds.size === 0) {
            return;
        }

        this.drawList = this.drawList.filter((mesh: DrawList): boolean => {
            return !removedMeshIds.has(mesh.id);
        });
        this.updateVersion();
    }

    /**
     * 一次递归更新场景的 Mesh、Geometry、Material 和 Texture 四个列表。
     * Geometry、Material 与 Texture 按全局 ID 去重，供 Render 创建和回收缓存。
     * @returns 更新后的绘制列表
     */
    public updateLists(): DrawList[] {
        this.updateVersion();
        const drawList: DrawList[] = [];
        const collect = (child: AddObject): void => {
            if (child instanceof Mesh && child.data !== undefined && child.material !== undefined) {
                drawList.push(child);
            }

            if (child instanceof Group) {
                for (const nextChild of child.children) {
                    collect(nextChild);
                }
            }
        };

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

        for (const mesh of this.drawList) {
            const geometry: GeometryList | undefined = mesh.data;
            const material: MaterialList | undefined = mesh.material;

            if (geometry !== undefined && !geometryIds.has(geometry.id)) {
                geometryIds.add(geometry.id);
                geometryList.push(geometry);
            }

            if (material === undefined) {
                continue;
            }

            if (!materialIds.has(material.id)) {
                materialIds.add(material.id);
                materialList.push(material);
            }

            for (const texture of GetMeshTextures(mesh)) {
                if (!textureIds.has(texture.id)) {
                    textureIds.add(texture.id);
                    textureList.push(texture);
                }
            }

            if (geometry !== undefined) this.addMaterialGeometryType(material.id, geometry.type);
        }

        this.geometryList = geometryList;
        this.materialList = materialList;
        this.textureList = textureList;
        this._textureSnapshot = this.version;
    }

    /**
     * 更新绘制列表及其关联资源列表。
     * 保留原方法名，现有调用会同步更新全部四个列表。
     * @returns 更新后的绘制列表
     */
    public updateDrawList(): DrawList[] {
        return this.updateLists();
    }

    /**
     * 根据材质列表单独刷新 Texture 列表。
     * 适用于只替换 Style 中 solid、edge、points.texture 的普通渲染帧。
     * @returns 更新后的贴图列表
     */
    public updateTextureList(): TextureList[] {
        // Material -> Mesh 通知增加 Scene 版本，静止帧不扫描材质版本。
        if (this._textureSnapshot === this.version) return this.textureList;

        const previousTextureList: TextureList[] = this.textureList;
        const textureList: TextureList[] = [];
        const textureIds: Set<number> = new Set<number>();

        for (const mesh of this.drawList) {
            for (const texture of GetMeshTextures(mesh)) {
                if (!textureIds.has(texture.id)) {
                    textureIds.add(texture.id);
                    textureList.push(texture);
                }
            }

        }

        this.textureList = textureList;
        if (!HaveSameTextureIds(previousTextureList, textureList)) {
            this.updateVersion();
        }
        this._textureSnapshot = this.version;
        return this.textureList;
    }

    /**
     * 获取当前场景中一个材质实际使用的几何类型，供 materialList 创建管线。
     * @param materialId 材质 ID
     * @returns 几何类型只读集合；不要修改返回的内部集合
     */
    public getMaterialGeometryTypes(materialId: number): ReadonlySet<string> {
        return this._materialGeometryTypes.get(materialId) ?? new Set<string>();
    }

    /**
     * 记录一个实际 Mesh 的材质与几何类型组合。
     * @param materialId 材质 ID
     * @param geometryType 几何类型
     */
    private addMaterialGeometryType(materialId: number, geometryType: string): void {
        let types = this._materialGeometryTypes.get(materialId);
        if (types === undefined) {
            types = new Set<string>();
            this._materialGeometryTypes.set(materialId, types);
        }
        types.add(geometryType);
    }

    /**
     * 更新场景绘制顺序。
     * 仅按照 Mesh 的 order 从小到大重新排列 drawList，不重建其他资源列表。
     * @returns 无返回值
     */
    public updateDrawOrder(): void {
        this.drawList.sort((left: DrawList, right: DrawList): number => {
            return left.order - right.order;
        });

    }

}

/**
 * 获取网格使用的单层图片或实例层表；列表由调用者按 ID 去重。
 * @param mesh 普通或实例网格
 * @returns 材质引用的贴图列表
 */
const GetMeshTextures = (mesh: MeshLike): TextureResource[] => {
    return mesh.textures.filter((texture): texture is TextureResource => texture !== undefined);
};

/**
 * 比较两个贴图列表是否包含相同 ID。
 * @param left 左侧贴图列表
 * @param right 右侧贴图列表
 * @returns 是否包含相同贴图 ID
 */
const HaveSameTextureIds = (left: readonly TextureResource[], right: readonly TextureResource[]): boolean => {
    if (left.length !== right.length) {
        return false;
    }

    const rightIds: Set<number> = new Set<number>(right.map((texture: TextureResource): number => texture.id));

    return left.every((texture: TextureResource): boolean => rightIds.has(texture.id));
};

export default Scene;
export type { DrawList, GeometryList, MaterialList, SceneLike, TextureList };
