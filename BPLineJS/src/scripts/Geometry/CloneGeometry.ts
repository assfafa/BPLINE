import type { Geometry2d } from "../global-types";
import Text from "../Text";
import Base2D from "./Base2D";
import NGon2D from "./NGon2D";
import Poly2D from "./Poly2D";
import Rect2D from "./Rect2D";

/**
 * 按实际类型复制二维几何，保留各类型的生成参数。
 * @param source 来源几何
 * @example
 * const copied = CloneGeometry(mesh.data);
 * @returns 独立的几何与样式。
 */
const CloneGeometry = (source: Geometry2d): Geometry2d => {
    // 直接顶点、文字和各参数化形状各自负责复制自己的输入。
    if (source instanceof Base2D) {
        return source.clone();
    } else if (source instanceof Rect2D) {
        // 矩形复制宽高、圆角等参数，而非只复制生成后的顶点。
        return source.clone();
    } else if (source instanceof Poly2D) {
        // 多边形保留原始轮廓，后续仍可参数化编辑。
        return source.clone();
    } else if (source instanceof NGon2D) {
        // 正多边形保留半径和边数。
        return source.clone();
    } else if (source instanceof Text) {
        // 文本保留字体、排版与源字符串。
        return source.clone();
    } else {
        throw new TypeError(`Unsupported geometry type: ${source.type}`);
    }
};

export default CloneGeometry;
