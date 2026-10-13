import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type Camera from "../../Camera";
import Base2D from "../../Geometry/Base2D";
import WGSLMaterial from "../../Material/WGSLMaterial";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import Style from "../../Style";
import { ComputeMinorGridStep } from "../GridStep";
import type { HelperGridCustomColors, HelperGridCustomStyleSubscriber } from "./CustomStyle";
import HelperGridCustomStyle from "./CustomStyle";
import { FillRulerLabels, RULER_LABEL_CAPACITY, RULER_LABEL_STRIDE } from "./RulerLabels";
import gridFragmentShader from "./gridFragment.wgsl?raw";
import gridVertexShader from "./gridVertex.wgsl?raw";
import rulerFragmentShader from "./rulerFragment.wgsl?raw";

/** 网格与标尺各由一件 Mesh 绘制，分别拥有材质和排序层级。 */
class HelperGrid implements HelperGridCustomStyleSubscriber {
    private readonly _gridStyle: Style = CreateHelperStyle();
    private readonly _rulerStyle: Style = CreateHelperStyle();
    private readonly _gridGeometry: Base2D = new Base2D({ vertices: SCREEN_TRIANGLES, style: this._gridStyle });
    private readonly _rulerGeometry: Base2D = new Base2D({ vertices: SCREEN_TRIANGLES, style: this._rulerStyle });
    /** 网格的自定义 WGSL 材质。 */
    public readonly material: WGSLMaterial = new WGSLMaterial(this._gridStyle);
    /** 世界网格背景 Mesh；始终不参与选择器拾取。 */
    public readonly mesh: Mesh = new Mesh(this._gridGeometry, this.material, this._gridStyle);
    /** 标尺独立的自定义 WGSL 材质。 */
    public readonly rulerMaterial: WGSLMaterial = new WGSLMaterial(this._rulerStyle);
    /** 屏幕标尺 Mesh，默认盖在场景内容上。 */
    public readonly rulerMesh: Mesh = new Mesh(this._rulerGeometry, this.rulerMaterial, this._rulerStyle);
    /** 网格所在的渲染器。 */
    public readonly render: Render;
    /** 坐标和缩放基准相机。 */
    public readonly camera: Camera;
    private readonly _transform: Mat3 = new Mat3();
    private readonly _rulerConfig: Mat3 = new Mat3();
    private readonly _viewport: Vec2 = new Vec2(1, 1);
    private readonly _horizontalTicks: Vec2 = new Vec2(0, 1000000000);
    private readonly _verticalTicks: Vec2 = new Vec2(0, 1000000000);
    private readonly _horizontalLabels: Float32Array = new Float32Array(RULER_LABEL_CAPACITY * RULER_LABEL_STRIDE);
    private readonly _verticalLabels: Float32Array = new Float32Array(RULER_LABEL_CAPACITY * RULER_LABEL_STRIDE);
    private readonly _custom: HelperGridCustomStyle = new HelperGridCustomStyle();
    private readonly _customColors: Float32Array<ArrayBuffer> = new Float32Array(20);
    private _mode: HelperGridMode = "dark";
    private _minorPerMajor: number = 10;
    private _ruler: boolean = true;
    private _horizontalRuler: HorizontalRuler = "bottom";
    private _verticalRuler: VerticalRuler = "left";
    private _snapshot: GridSnapshot | null = null;
    private _destroyed: boolean = false;

    /**
     * 创建屏幕背景与独立标尺。每个 Render 应创建自己的 HelperGrid。
     * @param scene 目标场景
     * @param render 画布和 DPR 来源
     * @param camera 当前相机
     * @example
     * const grid = new HelperGrid(scene, render, camera);
     * @returns 网格对象。
     */
    public constructor(scene: Scene, render: Render, camera: Camera) {
        this.render = render;
        this.camera = camera;

        this.material.raw.vertexShader = gridVertexShader;
        this.material.raw.fragmentShader = gridFragmentShader;
        this.material.depthTest = true;
        this.material.depthWrite = true;
        this.material.cullMode = "none";
        this.material.raw.value = {
            transform: this._transform,
            viewport: this._viewport,
            minorStep: 10,
            majorStep: 100,
            dpr: 1,
            mode: 1,
            customColors: this._customColors,
        };
        this.mesh.noSelect = true;
        this.mesh.culling = false;
        // 不透明深度对象逆序提交，最低 order 使网格只填充尚未占用的像素。
        this.mesh.order = -Number.MAX_SAFE_INTEGER;
        scene.add(this.mesh);

        this.rulerMaterial.raw.vertexShader = gridVertexShader;
        this.rulerMaterial.raw.fragmentShader = rulerFragmentShader;
        // Cent Browser 对该标尺中的 discard 会整层不显示，改用透明输出并开启混合。
        this.rulerMaterial.transparent = true;
        this.rulerMaterial.cullMode = "none";
        this.rulerMaterial.raw.value = {
            config: this._rulerConfig,
            horizontalTicks: this._horizontalTicks,
            verticalTicks: this._verticalTicks,
            horizontalLabels: this._horizontalLabels,
            verticalLabels: this._verticalLabels,
            customColors: this._customColors,
        };
        this.rulerMesh.noSelect = true;
        this.rulerMesh.culling = false;
        // 独立标尺最后覆盖在模型与编辑辅助框之上，可由调用者单独调整 order。
        this.rulerMesh.order = Number.MAX_SAFE_INTEGER;
        scene.add(this.rulerMesh);
        this._custom.add(this);
        this.syncCustomColors();
        this.update();
    }

    /** @example grid.mode = "light"; @returns 当前日间、夜间或自定义模式。 */
    public get mode(): HelperGridMode {
        return this._mode;
    }

    /** @param value 日间、夜间或自定义模式 @example grid.mode = "custom"; @returns 无返回值。 */
    public set mode(value: HelperGridMode) {
        this._mode = value;
        // 两个材质独立，但共享同一个主题状态。
        if (value === "dark") {
            this.material.raw.value.mode = 1;
        } else if (value === "custom") {
            // custom 读取五个用户颜色，预设模式不读取这些值。
            this.material.raw.value.mode = 2;
            this.syncCustomColors();
        } else {
            this.material.raw.value.mode = 0;
        }
        this.syncRulerConfig();
    }

    /** @example grid.custom.gridMinorColor.setHex("#303030"); @returns 当前自定义配色对象。 */
    public get custom(): HelperGridCustomStyle {
        return this._custom;
    }

    /** @param value 五个 Color 配色引用 @example grid.custom = colors; @returns 无返回值。 */
    public set custom(value: HelperGridCustomColors) {
        // 原配色对象保持稳定，外部订阅与直接读取的引用不会失效。
        this._custom.setColors(value);
    }

    /**
     * 将 Color 的原地修改转交给材质数组更新。
     * @param style 变化来源配色对象
     * @example
     * grid.onHelperGridCustomStyleChange(grid.custom);
     * @returns 无返回值。
     */
    public onHelperGridCustomStyleChange(style: HelperGridCustomStyle): void {
        // 只在自定义模式上传颜色；重新进入 custom 时会读取最新值。
        if (this._mode === "custom" && style === this._custom) {
            this.syncCustomColors();
        }
    }

    /** @example this.syncCustomColors(); @returns 无返回值。 */
    private syncCustomColors(): void {
        // 五个 RGBA 依次供网格与标尺片元读取，原地更新沿用现有绑定布局。
        this._custom.gridMinorColor.writeTo(this._customColors, 0);
        this._custom.gridMajorColor.writeTo(this._customColors, 4);
        this._custom.rulerMinorColor.writeTo(this._customColors, 8);
        this._custom.rulerMajorColor.writeTo(this._customColors, 12);
        this._custom.rulerTextColor.writeTo(this._customColors, 16);
        this.material.raw.touchValue("customColors");
        this.rulerMaterial.raw.touchValue("customColors");
    }

    /** @example grid.minorPerMajor = 10; @returns 每条主栅格线之间的次栅格数。 */
    public get minorPerMajor(): number {
        return this._minorPerMajor;
    }

    /** @param value 正整数且至少为 2 @example grid.minorPerMajor = 5; @returns 无返回值。 */
    public set minorPerMajor(value: number) {
        // 主栅格至少跨两个次栅格，避免两种线完全重合。
        if (!Number.isInteger(value) || value < 2) {
            throw new RangeError("HelperGrid minorPerMajor must be an integer of at least 2.");
        }
        this._minorPerMajor = value;
        this.syncRulerConfig();
        this._snapshot = null;
    }

    /** @example grid.ruler = false; @returns 是否绘制尺子。 */
    public get ruler(): boolean {
        return this._ruler;
    }

    /** @param value 是否绘制尺子 @example grid.ruler = true; @returns 无返回值。 */
    public set ruler(value: boolean) {
        this._ruler = value;
        // 只更新标尺配置，背景网格继续绘制。
        this.syncRulerConfig();
    }

    /** @example grid.horizontalRuler = "top"; @returns 横尺所在边。 */
    public get horizontalRuler(): HorizontalRuler {
        return this._horizontalRuler;
    }

    /** @param value 横尺位置或隐藏 @example grid.horizontalRuler = "none"; @returns 无返回值。 */
    public set horizontalRuler(value: HorizontalRuler) {
        this._horizontalRuler = value;
        // 尺子换边后，刻度的世界坐标采样线也随之更新。
        this.syncRulerConfig();
        this._snapshot = null;
    }

    /** @example grid.verticalRuler = "right"; @returns 竖尺所在边。 */
    public get verticalRuler(): VerticalRuler {
        return this._verticalRuler;
    }

    /** @param value 竖尺位置或隐藏 @example grid.verticalRuler = "none"; @returns 无返回值。 */
    public set verticalRuler(value: VerticalRuler) {
        this._verticalRuler = value;
        // 尺子换边后，刻度的世界坐标采样线也随之更新。
        this.syncRulerConfig();
        this._snapshot = null;
    }

    /**
     * 把标尺配置打包为一个 mat3 uniform，避免超过每阶段 uniform 绑定数量上限。
     * @example
     * grid.syncRulerConfig();
     * @returns 无返回值。
     */
    private syncRulerConfig(): void {
        let mode = 0;
        let ruler = 0;
        let horizontal = 0;
        let vertical = 0;
        // 日夜颜色由同一配置矩阵传入标尺着色器。
        if (this._mode === "dark") {
            mode = 1;
        } else if (this._mode === "custom") {
            // 自定义模式占用第三个数值，两个片元保持一致。
            mode = 2;
        }
        // 标尺总开关与两个方向的布局开关分别编码。
        if (this._ruler) {
            ruler = 1;
        }
        // 横尺的边号决定像素空间中的绘制起点。
        if (this._horizontalRuler === "bottom") {
            horizontal = 1;
        } else if (this._horizontalRuler === "top") {
            // 顶部标尺对应独立的屏幕侧边编号。
            horizontal = 2;
        }
        // 竖尺的边号决定像素空间中的绘制起点。
        if (this._verticalRuler === "left") {
            vertical = 1;
        } else if (this._verticalRuler === "right") {
            // 右侧标尺对应独立的屏幕侧边编号。
            vertical = 2;
        }
        this._rulerConfig.set([
            this._viewport.x, this._viewport.y, this.render.dpr,
            mode, ruler, horizontal,
            vertical, this._minorPerMajor, 0,
        ]);
    }

    /**
     * 将相机的双精度世界位置折叠为周期相位，并重新生成可见尺子数字。
     * @example
     * grid.update();
     * @returns 无返回值。
     */
    public update(): void {
        // 仅存活的网格需要同步相机与画布。
        if (this._destroyed === false) {
            this.camera.ensureWorldMatrix();
            const width = this.render.canvas.width;
            const height = this.render.canvas.height;
            const zoom = this.camera.zoom;
            const dpr = this.render.dpr;
            const matrix = this.camera.worldMatrix;
            const previous = this._snapshot;
            let changed = true;
            // 有上次快照时才逐项比较，避免每帧重建字形缓存。
            if (previous !== null) {
                changed = previous.worldVersion !== matrix.version || previous.zoom !== zoom ||
                    previous.cameraWidth !== this.camera.width || previous.cameraHeight !== this.camera.height ||
                    previous.viewportWidth !== width || previous.viewportHeight !== height || previous.dpr !== dpr;
            }
            // 静止帧不重新格式化文字，也不更新 GPU 传值。
            if (changed && width > 0 && height > 0 && zoom > 0) {
                const world = matrix.data;
                const pixelScaleX = this.camera.width / (width * zoom);
                const pixelScaleY = this.camera.height / (height * zoom);
                const basisX = new Vec2(world[0] * pixelScaleX, world[1] * pixelScaleX);
                const basisY = new Vec2(-world[3] * pixelScaleY, -world[4] * pixelScaleY);
                const minorStep = ComputeMinorGridStep(this.camera, this.render);
                const majorStep = minorStep * this._minorPerMajor;
                const phaseX = GridPhase(world[6], majorStep);
                const phaseY = GridPhase(world[7], majorStep);
                this._transform.set([
                    basisX.x, basisX.y, 0,
                    basisY.x, basisY.y, 0,
                    phaseX, phaseY, 1,
                ]);
                this._viewport.set(width, height);
                this.material.raw.value.minorStep = minorStep;
                this.material.raw.value.majorStep = majorStep;
                this.material.raw.value.dpr = dpr;
                this.syncRulerConfig();

                let horizontalY = height - 12 * dpr;
                let verticalX = 16 * dpr;
                // 标尺换边时，其数字所引用的世界坐标也同步换到对应的屏幕边。
                if (this._horizontalRuler === "top") {
                    horizontalY = 12 * dpr;
                }
                // 右侧标尺与左侧使用不同的世界坐标截面。
                if (this._verticalRuler === "right") {
                    verticalX = width - 16 * dpr;
                }
                const horizontalWorldAtStart = world[6] - basisX.x * width * 0.5 +
                    basisY.x * (horizontalY - height * 0.5);
                const verticalWorldAtStart = world[7] + basisX.y * (verticalX - width * 0.5) -
                    basisY.y * height * 0.5;
                const horizontal = FillRulerLabels(
                    horizontalWorldAtStart, basisX.x, majorStep, width, dpr, this._horizontalLabels,
                );
                const vertical = FillRulerLabels(
                    verticalWorldAtStart, basisY.y, majorStep, height, dpr, this._verticalLabels,
                );
                this._horizontalTicks.set(horizontal.start, horizontal.spacing);
                this._verticalTicks.set(vertical.start, vertical.spacing);
                this.rulerMaterial.raw.touchValue("horizontalLabels");
                this.rulerMaterial.raw.touchValue("verticalLabels");
                this._snapshot = {
                    worldVersion: matrix.version,
                    zoom,
                    cameraWidth: this.camera.width,
                    cameraHeight: this.camera.height,
                    viewportWidth: width,
                    viewportHeight: height,
                    dpr,
                };
            }
        }
    }

    /**
     * 移除两层辅助 Mesh 并解除各自的材质与几何订阅。
     * @example
     * grid.destroy();
     * @returns 无返回值。
     */
    public destroy(): void {
        // 工具关闭后只移除自己的两件场景对象。
        if (!this._destroyed) {
            this._destroyed = true;
            this.mesh.removeSelf();
            this.rulerMesh.removeSelf();
            this.mesh.dispose();
            this.rulerMesh.dispose();
            this.material.dispose();
            this.rulerMaterial.dispose();
            this._custom.delete(this);
            this._custom.dispose();
            this._gridGeometry.dispose();
            this._rulerGeometry.dispose();
        }
    }
}

type HelperGridMode = "dark" | "light" | "custom";

type HorizontalRuler = "bottom" | "top" | "none";

type VerticalRuler = "left" | "right" | "none";

interface GridSnapshot {
    worldVersion: number;
    zoom: number;
    cameraWidth: number;
    cameraHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    dpr: number;
}

const SCREEN_TRIANGLES = new Float32Array([
    -1, -1, 1, -1, 1, 1,
    -1, -1, 1, 1, -1, 1,
]);

/**
 * 将可能为负数的世界坐标折叠到当前主栅格周期，避免大坐标进入 GPU。
 * @param coordinate 世界坐标
 * @param step 主栅格间距
 * @example
 * GridPhase(-105, 100);
 * @returns 位于零和 step 之间的相位。
 */
const GridPhase = (coordinate: number, step: number): number => {
    let phase = coordinate % step;
    // 负世界坐标也需要与零点栅格共用相同相位。
    if (phase < 0) {
        phase += step;
    }
    return phase;
};

/** @example const style = CreateHelperStyle(); @returns 开启实体面的独立辅助样式，网格与标尺不共享材质。 */
const CreateHelperStyle = (): Style => {
    const style = new Style();
    style.solid.enabled = true;
    return style;
};

export default HelperGrid;
export { HelperGridCustomStyle };
export type { HelperGridCustomColors, HelperGridMode, HorizontalRuler, VerticalRuler };
