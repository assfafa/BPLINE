import type { Vec2 } from "bpmatrixjs/Math/Vec2";
import type { Material2d } from "../../global-types";
import type Group from "../../Group";
import type Mesh from "../../Mesh";
import type Scene from "../../Scene";
import type Style from "../../Style";
import type { ResizeHandle } from "../cursors";
import type { SnapGeometry } from "../Snap";
import type { RectEditRecord } from "./data";

type RectEditMode = "view" | "edit" | "add" | "sub" | "group";

type RectEditOrigin = "left" | "center";

type SelectionOperation = "replace" | "add" | "sub";

type RectHandle = ResizeHandle | "body";

type GestureMode = "create" | "marquee" | "select" | "move" | "resize" | "rotate" | "rotateRect" | "scale";

interface ResizeEdges {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

type MatrixValues = [number, number, number, number, number, number, number, number, number];

interface RectBounds {
    left: number;
    right: number;
    bottom: number;
    top: number;
}

interface ScreenBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

interface DrawFrame {
    center: Vec2;
    width: number;
    height: number;
    rotation: number;
    bounds: RectBounds;
    matrix: [number, number, number, number, number, number, number, number, number];
}

interface RectHit {
    mesh: Mesh;
    handle: RectHandle;
}

interface RankedMesh {
    mesh: Mesh;
    rank: number;
    layer: number;
}

interface MeshSnapshot {
    mesh: Mesh;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    localMatrix: number[];
    worldMatrix: number[];
}

interface GroupAction {
    mode: "scale" | "move" | "rotate" | "select";
    handle?: ResizeHandle;
}

interface AffineTransform {
    xx: number;
    xy: number;
    yx: number;
    yy: number;
    x: number;
    y: number;
    basisXX: number;
    basisXY: number;
    basisYX: number;
    basisYY: number;
}

interface GroupCandidate {
    state: MeshSnapshot;
    localMatrix: MatrixValues;
    positionChanged: boolean;
    basisChanged: boolean;
}

interface EditGesture {
    mode: GestureMode;
    pointerId: number;
    startClient: Vec2;
    currentClient: Vec2;
    startWorld: Vec2;
    currentWorld: Vec2;
    moved: boolean;
    lockedAxis?: "horizontal" | "vertical";
    snapshots: MeshSnapshot[];
    bounds: RectBounds | null;
    frame?: Vec2[];
    frameState?: MeshSnapshot;
    target?: Mesh;
    handle?: RectHandle;
    width?: number;
    height?: number;
    matrix?: ArrayLike<number>;
    rotationPointerAngle?: number;
    rotationTotal?: number;
    snapSources?: Vec2[];
    snapTargets?: Vec2[];
    snapGeometry?: SnapGeometry;
}

interface MoveSnapCandidate {
    deltaX: number;
    deltaY: number;
    distance: number;
}

interface SavedStyle {
    mesh: Style | undefined;
    geometry: Style;
    material: Material2d;
    selectionMaterial: Material2d;
}

interface RectEditHistoryItem {
    mesh: Mesh;
    parent: Group | Scene | null;
    data: RectEditRecord;
}

interface RectEditHistoryState {
    items: RectEditHistoryItem[];
    selectedIds: number[];
}

interface RectEditHistoryEntry {
    before: RectEditHistoryState;
    after: RectEditHistoryState;
}

export type { AffineTransform, DrawFrame, EditGesture, GestureMode, GroupAction, GroupCandidate, MatrixValues, MeshSnapshot, MoveSnapCandidate, RankedMesh, RectBounds, RectEditHistoryEntry, RectEditHistoryItem, RectEditHistoryState, RectEditMode, RectEditOrigin, RectHandle, RectHit, ResizeEdges, SavedStyle, ScreenBounds, SelectionOperation };
