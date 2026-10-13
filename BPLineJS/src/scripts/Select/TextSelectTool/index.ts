import { Mat3, Vec2 } from "bpmatrixjs/Math";
import type Camera from "../../Camera";
import IMesh from "../../IMesh";
import Mesh from "../../Mesh";
import type Render from "../../Render";
import type Scene from "../../Scene";
import Text from "../../Text";
import type { TextCell } from "../../Text/layout";
import { MeasureText } from "../../Text/layout";
import type { RectSelectionMode } from "../RectSelectTool";
import type { RectFootprint } from "../RectSelectTool/RectSelectGeometry";
import { ContainsWorldPoint } from "../RectSelectTool/RectSelectGeometry";
import {
    ContainsSelectionTriangles, CreateSelectionArea, IntersectsSelectionTriangles,
    RectFootprintTriangles,
} from "../SelectionAreaGeometry";
import { IsCanvasEvent } from "../SelectionGeometry";
import { CreateSelectionMatrix, CreateSelectionPoint } from "../SelectionSpace";

/** 文字只以排版矩形进行点选与框选，不读取字形三角面。 */
class TextSelectTool {
    /** 是否允许点选，默认开启。 */
    public picker: boolean = true;
    /** 是否允许框选，默认开启。 */
    public selector: boolean = true;
    /** 完整包围或任意相交，与其他面选择器一致。 */
    public selectionMode: RectSelectionMode = "all";
    private readonly _scene: Scene;
    private readonly _render: Render;
    private readonly _camera: Camera;

    /**
     * 创建只检查文字包围框的选择器。
     * @param scene 待选择场景
     * @param render 画布与屏幕尺寸
     * @param camera 显示矩阵对应相机
     * @example const tool = new TextSelectTool(scene, render, camera);
     * @returns 文字选择器。
     */
    public constructor(scene: Scene, render: Render, camera: Camera) {
        this._scene = scene;
        this._render = render;
        this._camera = camera;
    }

    /** @param event 窗口鼠标坐标 @example const meshes = tool.SelectPicker(event); @returns 从上到下命中的文字 Mesh。 */
    public SelectPicker(event: MouseEvent): Mesh[] {
        const matches: Mesh[] = [];
        // 输入控件之外的窗口事件仍须限定到实际画布内。
        if (this.picker && IsCanvasEvent(event, this._render)) {
            const world = this._camera.windowToWorld(new Vec2(event.clientX, event.clientY), this._render);
            const point = CreateSelectionPoint(world, this._camera);
            const candidates = this._scene.ensureLists();
            // 绘制顺序逆序，确保重叠文字的上层先返回。
            for (let index = candidates.length - 1; index >= 0; index--) {
                const mesh = candidates[index];
                // 字体 Mesh 和实例模板具有不同编辑身份。
                if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh.data instanceof Text) {
                    const footprint = CreateTextFootprint(mesh, CreateSelectionMatrix(mesh, this._camera));
                    // 空格与空文字也可按最小排版框选中。
                    if (footprint !== null && ContainsWorldPoint(footprint, point)) {
                        matches.push(mesh);
                    }
                }
            }
        }
        return matches;
    }

    /** @param selectionMesh Rect、NGon 或 Poly 选择范围 @example tool.Selector(frame); @returns 包围盒满足框选模式的文字 Mesh。 */
    public Selector(selectionMesh: Mesh): Mesh[] {
        const matches: Mesh[] = [];
        const area = CreateSelectionArea(selectionMesh, CreateSelectionMatrix(selectionMesh, this._camera));
        // 仅有效的选择区域参与面求交；文字候选始终只有矩形两块面。
        if (this.selector && area !== undefined) {
            const complete = this.selectionMode === "all" || this.selectionMode === "left";
            const candidates = this._scene.ensureLists();
            // 保持逆绘制顺序，重叠文字上层优先。
            for (let index = candidates.length - 1; index >= 0; index--) {
                const mesh = candidates[index];
                // 独立框选不接收辅助框与实例模板。
                if (mesh instanceof Mesh && !(mesh instanceof IMesh) && !mesh.noSelect && mesh !== selectionMesh) {
                    const footprint = CreateTextFootprint(mesh, CreateSelectionMatrix(mesh, this._camera));
                    // 只有文字类型生成排版矩形。
                    if (footprint !== null) {
                        const triangles = RectFootprintTriangles(footprint);
                        let matched = false;
                        // CAD 全包与相交只检查四个矩形角，不扫描字形。
                        if (complete) {
                            matched = ContainsSelectionTriangles(area, triangles);
                        } else {
                            matched = IntersectsSelectionTriangles(area, triangles);
                        }
                        // 命中排版区域后只报告一次文字对象。
                        if (matched) {
                            matches.push(mesh);
                        }
                    }
                }
            }
        }
        return matches;
    }

    /**
     * 把已选文字中的屏幕位置解析成最近的字符区域和插入位置。
     * @param mesh 文字 Mesh
     * @param client 鼠标窗口坐标
     * @example const caret = tool.locate(mesh, new Vec2(event.clientX, event.clientY));
     * @returns 行列、UTF-16 下标和局部字符区域；非文字或退化变换返回 null。
     */
    public locate(mesh: Mesh, client: Vec2): TextSelection | null {
        const text = mesh.data;
        let result: TextSelection | null = null;
        // 光标解析也只处理普通字体几何，不把 Base 顶点视为字符。
        if (text instanceof Text) {
            const values = mesh.getRenderMatrix(this._camera).data;
            const determinant = values[0] * values[4] - values[3] * values[1];
            // 可逆显示矩阵才能把鼠标映射到文字局部坐标。
            if (Number.isFinite(determinant) && determinant !== 0) {
                const world = this._camera.windowToWorld(client, this._render);
                const dx = world.x - values[6];
                const dy = world.y - values[7];
                const x = (values[4] * dx - values[3] * dy) / determinant;
                const y = (values[0] * dy - values[1] * dx) / determinant;
                let best: TextCell | null = null;
                let distance = Infinity;
                // 字符 advance 区域独立于字形内孔，空格可成为选区的一部分。
                for (const cell of MeasureText(text).cells) {
                    const horizontal = Math.max(cell.left - x, 0, x - cell.right);
                    const vertical = Math.max(cell.bottom - y, 0, y - cell.top);
                    const candidate = horizontal * horizontal + vertical * vertical;
                    // 只保留最近字符区域，字形内孔不影响光标定位。
                    if (candidate < distance) {
                        best = cell;
                        distance = candidate;
                    }
                }
                // 找到字符或空行插入区域后返回原文位置。
                if (best !== null) {
                    let index = best.index;
                    let column = best.column;
                    let afterCharacter = x > (best.left + best.right) / 2;
                    // 竖排从上往下插入，使用字符下半区而非横排的右半区。
                    if (text.writingMode === "vertical-rl") {
                        afterCharacter = y < (best.bottom + best.top) / 2;
                    }
                    // 后半区对应该完整字素之后的插入点。
                    if (afterCharacter && best.end > best.index) {
                        index = best.end;
                        column += 1;
                    }
                    result = { mesh, row: best.row, column, index, region: { ...best } };
                }
            }
        }
        return result;
    }

    /** @param event 鼠标事件 @example const hits = tool.SelectCaret(event); @returns 命中文字的字符区域和最近光标位置。 */
    public SelectCaret(event: MouseEvent): TextSelection[] {
        const result: TextSelection[] = [];
        const client = new Vec2(event.clientX, event.clientY);
        // 面选择先筛选候选，再对命中的文字解析光标。
        for (const mesh of this.SelectPicker(event)) {
            const caret = this.locate(mesh, client);
            // 退化变换不提供光标结果。
            if (caret !== null) {
                result.push(caret);
            }
        }
        return result;
    }
}

/** 原文行列从零开始；index 是 UTF-16 插入下标，region 是文字局部的字符 advance 区域。 */
interface TextSelection {
    mesh: Mesh;
    row: number;
    column: number;
    index: number;
    region: TextCell;
}

/** @param mesh 文字对象 @param matrix 可选显示/归一矩阵 @example CreateTextFootprint(mesh); @returns 排版矩形，非文字返回 null。 */
const CreateTextFootprint = (mesh: Mesh, matrix: Mat3 = mesh.ensureWorldMatrix()): RectFootprint | null => {
    const text = mesh.data;
    // 这里只读取排版元数据，不要求 Mesh 开启三角面包围盒。
    if (text instanceof Text) {
        const layout = MeasureText(text);
        const values = matrix.data;
        const centerX = (layout.left + layout.right) / 2;
        const centerY = (layout.bottom + layout.top) / 2;
        const centered = new Mat3();
        centered.set([values[0], values[1], 0, values[3], values[4], 0,
            values[6] + values[0] * centerX + values[3] * centerY,
            values[7] + values[1] * centerX + values[4] * centerY, 1]);
        const corners = [];
        // 四个角直接生成排版矩形，不读取字体轮廓。
        for (const [x, y] of [[layout.left, layout.bottom], [layout.right, layout.bottom],
            [layout.right, layout.top], [layout.left, layout.top]]) {
            corners.push({ x: values[0] * x + values[3] * y + values[6],
                y: values[1] * x + values[4] * y + values[7] });
        }
        /** @param point 一个角点 @example X(point); @returns 横坐标。 */
        const X = (point: { x: number; y: number }): number => point.x;
        /** @param point 一个角点 @example Y(point); @returns 纵坐标。 */
        const Y = (point: { x: number; y: number }): number => point.y;
        return { width: layout.width, height: layout.height, radius: 0, worldMatrix: centered, corners,
            bounds: { minX: Math.min(...corners.map(X)), maxX: Math.max(...corners.map(X)),
                minY: Math.min(...corners.map(Y)), maxY: Math.max(...corners.map(Y)) } };
    } else {
        return null;
    }
};

export default TextSelectTool;
export { CreateTextFootprint };
export type { TextSelection };
