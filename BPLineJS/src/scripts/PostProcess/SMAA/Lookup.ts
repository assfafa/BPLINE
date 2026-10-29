import Texture from "../../Texture";
import areaBytes from "./area.txt?raw";
import searchBytes from "./search.txt?raw";

/** 官方 SMAA 1x Area/Search 表的同步 CPU 解码；详见本目录 LICENSE。 */
class Lookup {
    public readonly area: Texture;
    public readonly search: Texture;
    /** @example const lookup = new Lookup(); @returns 可直接上传的查找纹理，无网络加载。 */
    public constructor() {
        this.area = Decode(areaBytes, 160, 80, 2);
        this.search = Decode(searchBytes, 64, 16, 1);
    }
}

/** @param encoded Base64 字节 @param width 表宽度 @param height 表高度 @param channels 源通道数 @example Decode(bytes, 160, 80, 2); @returns RGBA 查找纹理，提前抵消普通图片上传的 Y 翻转。 */
const Decode = (encoded: string, width: number, height: number, channels: number): Texture => {
    const source = atob(encoded.trim());
    const rgba = new Uint8ClampedArray(width * height * 4);
    // 输入字节按官方表行序排列，图片上传会再翻转一次。
    for (let y = 0; y < height; y++) {
        // 按行扩展 RG/R 字节为 GPU 图片上传支持的 RGBA。
        for (let x = 0; x < width; x++) {
            const from = (y * width + x) * channels;
            const to = ((height - 1 - y) * width + x) * 4;
            rgba[to] = source.charCodeAt(from);
            // Area 表使用 RG，Search 表只需要 R。
            if (channels === 2) {
                rgba[to + 1] = source.charCodeAt(from + 1);
            }
            rgba[to + 3] = 255;
        }
    }
    return new Texture().setSource(new ImageData(rgba, width, height));
};
export default Lookup;
