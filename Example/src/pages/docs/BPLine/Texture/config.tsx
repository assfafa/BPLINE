import { entry } from "@/pages/docs/reference/types.ts";
import type { ReferenceConfig } from "@/pages/docs/reference/types.ts";

export const config: ReferenceConfig = {
    title: "Texture",
    intro: {
        cn: "Texture 保存图片或视频源供材质样式使用。可从 URL 异步加载，也可直接指定浏览器图片对象。",
        en: "Texture holds an image or video source for material styles. Load a URL asynchronously or provide a browser image object directly.",
    },
    code: `import { Texture } from "bplinejs";

const texture = new Texture();
await texture.load("./images/tiles.png");

// Or use an existing image source:
// texture.setSource(imageBitmap);`,
    properties: [
        entry("url: string | null", "图片来源地址；仅赋值不会自动下载。", "Image URL; assigning it does not start a download."),
        entry("source: HTMLImageElement | HTMLVideoElement | ImageBitmap | ImageData | null", "当前图片源；赋值会同步更新尺寸和加载状态。", "Current image source; assignment updates dimensions and load state."),
        entry("loaded: boolean", "图片是否可供上传。通常由 setSource 和 clearSource 维护。", "Whether the image can be uploaded. Usually maintained by setSource and clearSource."),
        entry("width: number; height: number", "图片的源像素尺寸。", "Image dimensions in source pixels."),
    ],
    methods: [
        entry("load(url): Promise<this>", "按常见视频后缀识别视频，其余按图片加载；无法从地址识别时可直接 setSource(video)。", "Detect common video extensions; otherwise load images. Use setSource(video) when the URL does not reveal its format."),
        entry("source as HTMLVideoElement", "用户自行判断 source 类型后控制 play/pause、playbackRate、currentTime；播放帧由 Render 更新上传。浏览器可能要求用户手势播放。", "Check source type to control play/pause, playbackRate and currentTime. Render uploads playback frames. Playback may require a user gesture."),
        entry("new Texture()", "创建尚未指定图片源的贴图。", "Create a texture without an image source."),
        entry("load(url: string): Promise<this>", "加载图片或常见视频后缀的 URL，失败时拒绝 Promise。", "Load an image or a recognized video URL; reject on failure."),
        entry("setSource(source: TextureSource, url?: string | null): this", "直接指定图片对象并更新宽高。", "Assign an image object directly and update its dimensions."),
        entry("clearSource(): this", "清除图片源、地址和尺寸。", "Clear the image source, URL, and dimensions."),
    ],
};
