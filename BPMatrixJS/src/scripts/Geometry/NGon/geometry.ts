import type {
    PolyGeometryData,
    PolyNode,
} from "../Poly/types.js";
import type { Bounds, NGonOptions, Part, Settings } from "./types.js";

/**
 * 校验并整理几何选项，保证后续生成器使用一致的参数。
 * @param options 待验证参数
 * @example
 * Normalize(options);
 * @returns 规范化参数，先验证再更新对象
 */
const Normalize = (options: Required<NGonOptions>): Settings => {
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isInteger(options.sides) || options.sides < 2 || options.sides > 65536) {
        throw new RangeError("NGon sides must be an integer in [2, 65536].");
    }
    // 按 UV 模式选择角度映射或包围盒映射。
    if (!new Set<string>(["bounding", "polar"]).has(options.nvMode)) {
        throw new TypeError("Invalid NGon nvMode.");
    }
    // 区分输入数据形态，使用与实际类型匹配的处理方式。
    if (typeof options.hole !== "boolean" || typeof options.solid !== "boolean") {
        throw new TypeError("NGon switches must be boolean.");
    }
    // 逐项处理 [options.outer, options.inter]，保持集合中的既定顺序。
    for (const radius of [options.outer, options.inter]) {
        // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
        if (radius < 0 || !Number.isFinite(Math.fround(radius * 2))) {
            throw new RangeError("NGon radii must be finite, nonnegative Float32 sizes.");
        }
    }
    // 校验数值有效性，防止非有限值进入几何或 GPU 数据。
    if (!Number.isFinite(options.startAngle)) {
        throw new RangeError("NGon startAngle must be finite.");
    }
    return Object.freeze({
        ...options,
        startAngle: options.startAngle % (Math.PI * 2),
        inter: Math.min(options.inter, options.outer),
    });
};

/**
 * 按边数和起始角生成等边形轮廓节点。
 * @param settings 参数
 * @param radius 半径
 * @example
 * Nodes(settings, radius);
 * @returns 逆时针节点，圆心保持在原点
 */
const Nodes = (settings: Settings, radius: number): PolyNode[] => {
    // 区分直角、圆角或零尺寸，避免生成退化圆弧。
    if (radius === 0) {
        return [];
    } else {
        /**
         * 按节点下标计算角度，在指定半径上生成轮廓点。
         * @param _ 当前元素，此回调只使用下标
         * @param i 当前元素下标
         * @example
         * CreatePolygonNode(_, i);
         * @returns 轮廓节点坐标。
         */
        const CreatePolygonNode = (_: unknown, i: number): PolyNode => {
            const angle = settings.startAngle + (i * Math.PI * 2) / settings.sides;
            return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
        };
        return Array.from({ length: settings.sides }, CreatePolygonNode);
    }
};

/**
 * 计算轮廓包围盒，供 UV 映射和尺寸查询使用。
 * @param nodes 外圈节点
 * @example
 * GetBounds(nodes);
 * @returns 实际包围盒，空集返回零
 */
const GetBounds = (nodes: readonly PolyNode[]): Bounds => {
    // 区分空数据和有效内容，空集合不创建可绘制资源。
    if (nodes.length === 0) {
        return { width: 0, height: 0, minX: 0, minY: 0 };
    } else {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        // 逐项处理 nodes，保持集合中的既定顺序。
        for (const p of nodes) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, width: maxX - minX, height: maxY - minY };
    }
};

/**
 * 创建保留包围盒信息但不包含可绘制顶点的几何结果。
 * @param bounds 包围盒
 * @example
 * Empty(bounds);
 * @returns 空几何，退化或关闭填充时使用
 */
const Empty = (bounds: Bounds): PolyGeometryData => ({
    ...bounds,
    closed: true,
    geometry: new Float32Array(0),
    normal: new Float32Array(0),
    uv: new Float32Array(0),
    index: new Uint16Array(0),
});

/**
 * 圆盘使用中心扇形，圆环逐段缝合内外圈；不会用扇形跨过内孔。
 * @param settings 参数
 * @param nodes 外圈节点
 * @param bounds 包围盒
 * @example
 * Fill(settings, nodes, bounds);
 * @returns CW 三角面，polar 在 U=0/1 的接缝复制顶点
 */
const Fill = (settings: Settings, nodes: readonly PolyNode[], bounds: Bounds): PolyGeometryData => {
    let inner;
    // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
    if (settings.hole) {
        inner = settings.inter;
    } else {
        inner = 0;
    }
    // 按边数处理点型和退化轮廓，四边形保持轴对齐外观。
    if (settings.solid && settings.sides !== 2 && settings.outer !== 0 && inner !== settings.outer) {
        const geometry: number[] = [];
        const normal: number[] = [];
        const uv: number[] = [];
        const indices: number[] = [];
        /**
         * 写入一个顶点的坐标及配套属性，返回新顶点下标。
         * @param p 坐标
         * @param u 极坐标 U
         * @param v 极坐标 V
         * @param sign 外法线方向
         * @example
         * Vertex(p, u, v, sign);
         * @returns 顶点索引
         */
        const Vertex = (p: PolyNode, u: number, v: number, sign: number): number => {
            const id = geometry.length / 2;
            const length = Math.hypot(p.x, p.y);
            geometry.push(p.x, p.y);
            let normalX: number = 0;
            let normalY: number = 0;
            // 区分空数据和有效内容，空集合不创建可绘制资源。
            if (length !== 0) {
                normalX = (sign * p.x) / length;
                normalY = (sign * p.y) / length;
            }
            normal.push(normalX, normalY);
            // 按 UV 模式选择角度映射或包围盒映射。
            if (settings.nvMode === "polar") {
                uv.push(u, v);
            } else {
                uv.push((p.x - bounds.minX) / bounds.width, (p.y - bounds.minY) / bounds.height);
            }
            return id;
        };
        // 按当前范围逐项处理，确保下标不越过有效数据。
        for (let i = 0; i <= settings.sides; i++) {
            // 接缝严格复用首点坐标，避免 sin(2π) 带来的微小裂缝。
            const p = nodes[i % settings.sides];
            const u = i / settings.sides;
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner > 0) {
                Vertex({ x: (p.x * inner) / settings.outer, y: (p.y * inner) / settings.outer }, u, 0, -1);
            }
            Vertex(p, u, 1, 1);
        }
        let center;
        // 按 UV 模式选择角度映射或包围盒映射。
        if (inner === 0 && settings.nvMode === "bounding") {
            center = Vertex({ x: 0, y: 0 }, 0.5, 0, 0);
        } else {
            center = -1;
        }
        // 按索引顺序处理三角面，保持绕序及属性下标一致。
        for (let i = 0; i < settings.sides; i++) {
            // 只为有效内圈生成独立轮廓，避免填充面跨过孔洞。
            if (inner > 0) {
                const a = i * 2;
                indices.push(a, a + 3, a + 1, a, a + 2, a + 3);
            } else {
                // 极坐标在中心有奇点，每扇区独立中心 U，避免跨越接缝的大跨度插值。
                let c;
                // 包围盒 UV 复用中心顶点；极坐标模式按扇区创建中心，避免跨接缝插值。
                if (center >= 0) {
                    c = center;
                } else {
                    c = Vertex({ x: 0, y: 0 }, (i + 0.5) / settings.sides, 0, 0);
                }
                indices.push(c, i + 1, i);
            }
        }
        let index: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
        // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
        if (geometry.length / 2 > 65536) {
            index = new Uint32Array(indices);
        } else {
            index = new Uint16Array(indices);
        }
        return {
            ...bounds,
            closed: true,
            geometry: new Float32Array(geometry),
            normal: new Float32Array(normal),
            uv: new Float32Array(uv),
            index,
        };
    } else {
        return Empty(bounds);
    }
};

/**
 * 合并独立内外轮廓，索引仅做偏移，不额外连接两圈。
 * @param parts 内外圈数据
 * @param bounds 完整外圈包围盒
 * @example
 * Merge(parts, bounds);
 * @returns 合并数组及可选辅助属性
 */
const Merge = (
    parts: readonly Part[],
    bounds: Bounds,
): PolyGeometryData & {
    miterScale: Float32Array<ArrayBuffer>;
    position: Float32Array<ArrayBuffer>;
} => {
    /**
     * 累计几何分区的顶点数，用于一次分配合并数组。
     * @param sum 已累计的数值
     * @param p 当前轮廓节点或几何分区
     * @example
     * CountVertices(sum, p);
     * @returns 累计顶点数。
     */
    const CountVertices = (sum: number, p: Part): number => sum + p.geometry.length / 2;
    const vertices = parts.reduce(CountVertices, 0);
    /**
     * 累计几何分区的索引数，用于一次分配索引数组。
     * @param sum 已累计的数值
     * @param p 当前轮廓节点或几何分区
     * @example
     * CountIndices(sum, p);
     * @returns 累计索引数。
     */
    const CountIndices = (sum: number, p: Part): number => sum + p.index.length;
    const count = parts.reduce(CountIndices, 0);
    let index: Uint16Array<ArrayBuffer> | Uint32Array<ArrayBuffer>;
    // 顶点下标超出 Uint16 范围时使用 Uint32，避免索引截断。
    if (vertices > 65536) {
        index = new Uint32Array(count);
    } else {
        index = new Uint16Array(count);
    }
    const result = {
        ...Empty(bounds),
        geometry: new Float32Array(vertices * 2),
        normal: new Float32Array(vertices * 2),
        uv: new Float32Array(vertices * 2),
        index,
        miterScale: new Float32Array(vertices).fill(1),
        position: new Float32Array(vertices * 2),
    };
    let offset = 0;
    let indexOffset = 0;
    // 逐个处理独立几何分区，合并时保留各自的轮廓边界。
    for (const p of parts) {
        result.geometry.set(p.geometry, offset * 2);
        result.normal.set(p.normal, offset * 2);
        result.uv.set(p.uv, offset * 2);
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (p.miterScale !== undefined) {
            result.miterScale.set(p.miterScale, offset);
        }
        // 存在有效引用时处理对应资源，缺省情况由备用分支接管。
        if (p.position !== undefined) {
            result.position.set(p.position, offset * 2);
        }
        // 逐项处理 p.index，保持集合中的既定顺序。
        for (const index of p.index) {
            result.index[indexOffset++] = index + offset;
        }
        offset += p.geometry.length / 2;
    }
    return result;
};

export { Empty, Fill, GetBounds, Merge, Nodes, Normalize };
