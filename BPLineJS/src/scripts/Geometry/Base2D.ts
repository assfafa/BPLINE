import Geo from "./Geo";
import type { GeoData } from "./Geo";
import type Style from "../Style";

interface Base2DOptions {
    vertices: Float32Array;
    uv?: Float32Array;
    normal?: Float32Array;
    index?: Uint16Array | Uint32Array;
    vertexType?: Float32Array;
    position?: Float32Array;
    miterScale?: Float32Array;
    style?: Style;
}
interface Base2DLike extends GeoData {
    readonly type: "Base2D";
    /**
     * 替换完整的顶点数据。
     * @param options 顶点和属性
     * @example
     * geometry.setData({ vertices });
     * @returns 无返回值。
     */
    setData(options: Base2DOptions): void;
}

/** 用户直接提供已三角剖分的顶点；缺省属性补零，索引缺省为顺序三角形。 */
class Base2D extends Geo implements Base2DLike {
    public readonly type = "Base2D" as const;
    private _input: Base2DOptions;

    /**
     * 创建直接顶点几何体，不从三角面推导外轮廓。
     * @param options 顶点及可选属性
     * @example
     * const geometry = new Base2D({ vertices: new Float32Array([0, 0, 1, 0, 0, 1]) });
     * @returns 几何对象。
     */
    public constructor(options: Base2DOptions) {
        super(options.style);
        this._input = CopyOptions(options);
        this.updateGeometry();
    }

    /**
     * 替换顶点与属性；同尺寸更新在 Render 中复用 GPUBuffer。
     * @param options 新的完整几何描述
     * @example
     * geometry.setData({ vertices: nextVertices, uv: nextUv, index: nextIndices });
     * @returns 无返回值。
     */
    public setData(options: Base2DOptions): void {
        this._input = CopyOptions(options);
        // 显式传入样式时同步几何的生成设置。
        if (options.style !== undefined && options.style !== this.style) {
            this.style = options.style;
        }
        this.updateGeometry();
    }

    /**
     * 将输入数组装入 Geo 的统一三角面结构。
     * @example
     * geometry.updateGeometry();
     * @returns 当前几何对象。
     */
    public override updateGeometry(): this {
        const input = this._input;
        const vertices = input.vertices;
        const vertexCount = vertices.length / 2;
        this._geometry = vertices;
        this.normal = input.normal ?? new Float32Array(vertices.length);
        this.uv = input.uv ?? new Float32Array(vertices.length);
        this.position = input.position ?? new Float32Array(vertices.length);
        this.vertexType = input.vertexType ?? new Float32Array(vertexCount);
        this.miterScale = input.miterScale ?? new Float32Array(vertexCount).fill(1);
        // 没有索引时按连续三点生成一个三角形。
        if (input.index === undefined) {
            let index: Uint16Array | Uint32Array;
            // Uint16 索引的最大合法顶点编号为 65535。
            if (vertexCount > 65536) {
                index = new Uint32Array(vertexCount);
            } else {
                index = new Uint16Array(vertexCount);
            }
            // 填写顺序索引，保持用户给出的三角形顺序。
            for (let vertex = 0; vertex < vertexCount; vertex += 1) {
                index[vertex] = vertex;
            }
            this.index = index;
        } else {
            this.index = input.index;
        }
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        // 根据原始顶点计算局部包围盒，供基础材质使用。
        for (let offset = 0; offset < vertices.length; offset += 2) {
            minX = Math.min(minX, vertices[offset]);
            maxX = Math.max(maxX, vertices[offset]);
            minY = Math.min(minY, vertices[offset + 1]);
            maxY = Math.max(maxY, vertices[offset + 1]);
        }
        let width = 0;
        let height = 0;
        // 空几何使用零尺寸，避免 Infinity 进入 uniform。
        if (vertexCount > 0) {
            width = maxX - minX;
            height = maxY - minY;
        }
        this.uniformData.set([width, height, 0, this.style.edge.width]);
        super.updateGeometry();
        return this;
    }
}

/**
 * 复制并验证全部顶点数组，避免外部原地修改绕过版本通知。
 * @param options 输入数据
 * @example
 * CopyOptions(options);
 * @returns 自有数组构成的输入快照。
 */
const CopyOptions = (options: Base2DOptions): Base2DOptions => {
    const vertices = options.vertices;
    // 顶点必须由完整的 x/y 对组成。
    if (!(vertices instanceof Float32Array) || vertices.length % 2 !== 0) {
        throw new TypeError("Base2D vertices must be complete Float32Array x/y pairs.");
    }
    const vertexCount = vertices.length / 2;
    // 顺序顶点必须能组成完整三角形。
    if (options.index === undefined && vertexCount % 3 !== 0) {
        throw new RangeError("Base2D sequential vertices must form complete triangles.");
    }
    const attributes = [options.uv, options.normal, options.position];
    // 每个 vec2 属性都与顶点一一对应。
    for (const attribute of attributes) {
        // 缺省属性会在 updateGeometry 中补齐。
        if (attribute !== undefined && (!(attribute instanceof Float32Array) || attribute.length !== vertices.length)) {
            throw new RangeError("Base2D vec2 attributes must match vertices length.");
        }
    }
    // 分区标记按顶点数量校验。
    if (options.vertexType !== undefined && options.vertexType.length !== vertexCount) {
        throw new RangeError("Base2D vertexType length must match vertex count.");
    }
    // 斜接比例按顶点数量校验。
    if (options.miterScale !== undefined && options.miterScale.length !== vertexCount) {
        throw new RangeError("Base2D miterScale length must match vertex count.");
    }
    const index = options.index;
    // 显式索引必须是三角形列表，且不越界。
    if (index !== undefined) {
        // GPU 索引格式仅支持 16 位或 32 位无符号整数。
        if (!(index instanceof Uint16Array) && !(index instanceof Uint32Array)) {
            throw new TypeError("Base2D index must be Uint16Array or Uint32Array.");
        }
        // 三角形列表每三个索引为一组。
        if (index.length % 3 !== 0) {
            throw new RangeError("Base2D indices must form complete triangles.");
        }
        // 避免 GPU 索引读取越过顶点缓冲。
        for (const vertex of index) {
            // 最大索引必须小于顶点总数。
            if (vertex >= vertexCount) {
                throw new RangeError("Base2D index exceeds vertex count.");
            }
        }
    }
    let uv: Float32Array | undefined;
    let normal: Float32Array | undefined;
    let copiedIndex: Uint16Array | Uint32Array | undefined;
    let vertexType: Float32Array | undefined;
    let position: Float32Array | undefined;
    let miterScale: Float32Array | undefined;
    // 只复制用户提供的可选属性，由几何更新过程补齐缺省值。
    if (options.uv !== undefined) {
        uv = new Float32Array(options.uv);
    }
    // 法线可由调用方完整指定。
    if (options.normal !== undefined) {
        normal = new Float32Array(options.normal);
    }
    // 保留原有索引位宽。
    if (index instanceof Uint32Array) {
        copiedIndex = new Uint32Array(index);
    }
    // 16 位索引复制后保持原位宽。
    if (index instanceof Uint16Array) {
        copiedIndex = new Uint16Array(index);
    }
    // 三角面类型支持实体面、边框面和关键点面。
    if (options.vertexType !== undefined) {
        vertexType = new Float32Array(options.vertexType);
    }
    // 关键点中心和边框斜接比例可以由调用方指定。
    if (options.position !== undefined) {
        position = new Float32Array(options.position);
    }
    // 缺省斜接比例在 updateGeometry 中设为一。
    if (options.miterScale !== undefined) {
        miterScale = new Float32Array(options.miterScale);
    }
    return {
        vertices: new Float32Array(vertices),
        uv,
        normal,
        index: copiedIndex,
        vertexType,
        position,
        miterScale,
        style: options.style,
    };
};

export default Base2D;
export type { Base2DLike, Base2DOptions };
