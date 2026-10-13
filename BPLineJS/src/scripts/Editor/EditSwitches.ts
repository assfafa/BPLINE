/** 编辑器指针交互的独立开关；程序调用 select、push 等方法不受影响。 */
interface EditSwitches {
    /** 是否允许点击命中对象并改变选择。 */
    pick: boolean;
    /** 是否允许拖框增减选择。 */
    marquee: boolean;
    /** 是否允许从画布新建几何或层级组。 */
    create: boolean;
    /** 是否允许拖动实体或选中组。 */
    move: boolean;
    /** 是否允许修改单体边角、半径或轮廓顶点。 */
    resize: boolean;
    /** 是否允许缩放选中组或层级组。 */
    scale: boolean;
    /** 是否允许旋转单体、选中组或层级组。 */
    rotate: boolean;
    /** 是否允许在多边形或 Base 轮廓边上插入顶点。 */
    insertVertex: boolean;
    /** 是否允许拖放对象改变父容器。 */
    reparent: boolean;
}

/**
 * 为独立工具创建一份默认全开的交互配置。
 * @example
 * const switches = CreateEditSwitches();
 * @returns 可直接修改的开关集合。
 */
const CreateEditSwitches = (): EditSwitches => ({
    pick: true,
    marquee: true,
    create: true,
    move: true,
    resize: true,
    scale: true,
    rotate: true,
    insertVertex: true,
    reparent: true,
});

export { CreateEditSwitches };
export type { EditSwitches };
