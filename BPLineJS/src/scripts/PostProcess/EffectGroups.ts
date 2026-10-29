import IMesh from "../IMesh";
import type Scene from "../Scene";
import Effects, { type EffectData } from "../Style/Effects";

/** 按实际效果值而非 Style 身份合并对象；同参数的一组只绘制一次遮罩。 */
class EffectGroups {
    /** @param scene 原始场景 @param area 效果区域 @example EffectGroups.collect(scene, "bloom"); @returns 稳定场景次序的效果组。 */
    public static collect<T extends keyof EffectData>(scene: Scene, area: T): EffectGroup<T>[] {
        const groups = new Map<string, EffectGroup<T>>();
        const counts = new Map<number, number>();
        // drawList 已过滤不可见节点；离屏边缘仍有机会参与扩散。
        for (const mesh of scene.drawList) {
            counts.set(mesh.id, mesh.count);
            // 同一个 IMesh 的每条记录都可以有不同效果，冻结记录也保留纯数据快照。
            if (mesh instanceof IMesh) {
                mesh.updateInstanceData();
                // 只有有效槽位参与，预留容量不属于实例内容。
                for (let index = 0; index < mesh.count; index++) {
                    const effects = mesh.effectAt(index);
                    // 尚未赋值的槽位没有可绘制效果。
                    if (effects !== undefined) {
                        EffectGroups.append(groups, effects[area], mesh.id, index);
                    }
                }
            } else if (mesh.material !== undefined) {
                // 实际片元颜色来自材质 Style，与 Mesh 的构造同步规则保持一致。
                EffectGroups.append(groups, Effects.capture(mesh.material.style)[area], mesh.id, null);
            }
        }
        // 整个 IMesh 都属于同一组时恢复原有实例批量绘制，不逐槽提交。
        for (const group of groups.values()) {
            // 只合并完整槽位集合，混合样式仍保持精确筛选。
            for (const [id, indices] of group.selection) {
                // 全量集合可以省去实例编号筛选并保持单次 instanced draw。
                if (indices !== null && indices.length === counts.get(id)) {
                    group.selection.set(id, null);
                }
            }
        }
        return Array.from(groups.values());
    }
    /** @param groups 当前效果组 @param settings 纯数据参数 @param id Mesh ID @param instance 可选实例槽位 @example EffectGroups.append(groups, settings, mesh.id, null); @returns 无返回值，按值分组。 */
    private static append<T extends keyof EffectData>(groups: Map<string, EffectGroup<T>>, settings: EffectData[T], id: number, instance: number | null): void {
        // 总开关和完全透明的效果不触发额外渲染。
        if (settings.enabled && settings.opacity > 0 && settings.color[3] > 0) {
            const key = JSON.stringify(settings);
            let group = groups.get(key);
            // 参数键相同就追加已有组，独立 Style 也可以合批。
            if (group === undefined) {
                group = { key, settings, selection: new Map() };
                groups.set(key, group);
            }
            // 普通 Mesh 选整批，实例对象则只登记属于本组的槽位。
            if (instance === null) {
                group.selection.set(id, null);
            } else {
                const indices = group.selection.get(id) ?? [];
                indices.push(instance);
                group.selection.set(id, indices);
            }
        }
    }
}

interface EffectGroup<T extends keyof EffectData> {
    key: string;
    settings: EffectData[T];
    selection: Map<number, number[] | null>;
}
export default EffectGroups;
export type { EffectGroup };
