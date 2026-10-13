import type { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Group from "../../Group";
import type Mesh from "../../Mesh";
import type Scene from "../../Scene";
import type { SnapGeometry } from "../Snap";
import type { PolyEditRecord } from "./data";

type PolyEditMode = "view" | "edit" | "add" | "sub" | "group";

type PolyEditOrigin = "left" | "center";

type SelectionOperation = "replace" | "add" | "sub";

type PolyHandle = "vertex" | "edge" | "body" | "rotate";

type GestureMode = "create" | "marquee" | "select" | "move" | "vertex" | "rotate" | "groupMove" | "groupScale" | "groupRotate";

type GroupHandle = "sw" | "se" | "ne" | "nw" | "s" | "e" | "n" | "w";

interface GroupAction {
    mode: GestureMode;
    handle?: GroupHandle;
}

interface PolySnapshot {
    mesh: Mesh;
    center: Vec2;
    position: Vec2;
    rotation: number;
    scale: Vec2;
    matrix: number[];
    localMatrix: number[];
    points: Float32Array;
    vertices: Vec2[];
}

type PolyMatrix = [number, number, number, number, number, number, number, number, number];

interface PolyGesture {
    mode: GestureMode;
    pointerId: number;
    startClient: Vec2;
    currentClient: Vec2;
    startWorld: Vec2;
    currentWorld: Vec2;
    moved: boolean;
    target?: Mesh;
    snapshots: PolySnapshot[];
    vertexIndex?: number;
    editPoints?: Float32Array;
    groupHandle?: GroupHandle;
    frameMatrix?: number[];
    frameCenter: Vec2 | null;
    frameRotation: number;
    lockedAxis: "x" | "y" | null;
    snapTargets?: Vec2[];
    snapGeometry?: SnapGeometry;
}

interface PolyHistoryItem {
    mesh: Mesh;
    parent: Group | Scene | null;
    data: PolyEditRecord;
}

interface PolyHistoryState {
    items: PolyHistoryItem[];
    selectedIds: number[];
}

interface PolyHistoryEntry {
    before: PolyHistoryState;
    after: PolyHistoryState;
}

interface PolyHit {
    mesh: Mesh;
    handle: PolyHandle;
    index?: number;
    point?: Vec2;
}

export type { GestureMode, GroupAction, GroupHandle, PolyEditMode, PolyEditOrigin, PolyGesture, PolyHandle, PolyHistoryEntry, PolyHistoryItem, PolyHistoryState, PolyHit, PolyMatrix, PolySnapshot, SelectionOperation };
