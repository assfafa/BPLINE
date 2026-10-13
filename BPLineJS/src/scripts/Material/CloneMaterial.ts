import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type { Material2d } from "../global-types";
import type Style from "../Style";
import Texture from "../Texture";
import BaseMaterial from "./baseMaterial";
import CompositeMaterial from "./CompositeMaterial";
import type { ShaderValueRecord } from "./ShaderValues";
import WGSLMaterial from "./WGSLMaterial";

/**
 * 复制自定义材质的具名值；GPU 纹理保留共享资源引用。
 * @param values 来源传值对象
 * @example
 * const copied = CloneValues(material.raw.value);
 * @returns 数组和数学对象已独立的传值对象。
 */
const CloneValues = (values: ShaderValueRecord): ShaderValueRecord => {
    const copied: ShaderValueRecord = {};
    // 逐个保留绑定名称及顺序，防止新材质与来源共用可变数值容器。
    for (const [name, value] of Object.entries(values)) {
        // 纹理属于可共享 GPU 资源，数值、数学对象和数组独立复制。
        if (value instanceof Vec2 || value instanceof Mat3) {
            copied[name] = value.clone();
        } else if (value instanceof Float32Array) {
            // 原始数组可能由调用方继续更新，副本需持有独立存储。
            copied[name] = new Float32Array(value);
        } else if (value instanceof Texture) {
            // 纹理 GPU 资源由引擎管理，这里保留共享引用。
            copied[name] = value;
        } else {
            copied[name] = value;
        }
    }
    return copied;
};

/**
 * 保留材质类型、着色器、固定管线状态及具名值，绑定指定的独立样式。
 * @param source 来源材质
 * @param style 新材质使用的样式
 * @example
 * const material = CloneMaterial(mesh.material, style);
 * @returns 独立材质，纹理资源仍可共享。
 */
const CloneMaterial = (source: Material2d, style: Style): Material2d => {
    let copy: Material2d;
    // 复合材质需保留三段用户提供的片元函数体。
    if (source instanceof CompositeMaterial) {
        const composite = new CompositeMaterial(style);
        composite.raw.solidShader = source.raw.solidShader;
        composite.raw.edgeShader = source.raw.edgeShader;
        composite.raw.pointShader = source.raw.pointShader;
        composite.raw.value = CloneValues(source.raw.value);
        copy = composite;
    } else if (source instanceof WGSLMaterial) {
        // 完全自定义材质还需复制顶点和片元源码。
        const wgsl = new WGSLMaterial(style);
        wgsl.raw.vertexShader = source.raw.vertexShader;
        wgsl.raw.fragmentShader = source.raw.fragmentShader;
        wgsl.raw.value = CloneValues(source.raw.value);
        copy = wgsl;
    } else {
        copy = new BaseMaterial(style);
    }
    copy.transparent = source.transparent;
    copy.depthTest = source.depthTest;
    copy.depthWrite = source.depthWrite;
    copy.cullMode = source.cullMode;
    copy.rectVertexShader = source.rectVertexShader;
    copy.rectFragmentShader = source.rectFragmentShader;
    copy.polyVertexShader = source.polyVertexShader;
    copy.polyFragmentShader = source.polyFragmentShader;
    copy.ngonVertexShader = source.ngonVertexShader;
    copy.ngonFragmentShader = source.ngonFragmentShader;
    return copy;
};

export default CloneMaterial;
