import type { Vec2 } from "bpmatrixjs/Math/Vec2";
import type Group from "../../Group";
import type Mesh from "../../Mesh";
import type Scene from "../../Scene";
import type { SnapGeometry } from "../Snap";
import type { NGonEditRecord } from "./data";

type NGonEditMode = "view" | "edit" | "add" | "sub" | "group";

type NGonEditOrigin = "left" | "center";

type SelectionOperation = "replace" | "add" | "sub";

type NGonHandle = "vertex" | "edge" | "inner" | "body" | "rotate";

type GestureMode = "create" | "marquee" | "select" | "move" | "resize" | "rotate" | "groupMove" | "groupScale" | "groupRotate";

interface NGonSnapshot {
    mesh: Mesh;
    center: Vec2;
    position: Vec2;
    rotation: number;
    outer: number;
    inner: number;
    vertices: Vec2[];
    innerVertices: Vec2[];
}

interface NGonGesture {
    mode: GestureMode;
    pointerId: number;
    startClient: Vec2;
    currentClient: Vec2;
    startWorld: Vec2;
    currentWorld: Vec2;
    fromCorner: boolean;
    moved: boolean;
    target?: Mesh;
    resizeHandle?: "inner" | "outer";
    snapshots: NGonSnapshot[];
    frameCenter: Vec2 | null;
    frameRotation: number;
    frameScale: number;
    lockedAxis: "x" | "y" | null;
    snapTargets?: Vec2[];
    snapGeometry?: SnapGeometry;
}

interface NGonHistoryItem {
    mesh: Mesh;
    parent: Group | Scene | null;
    data: NGonEditRecord;
}

interface NGonHistoryState {
    items: NGonHistoryItem[];
    selectedIds: number[];
}

interface NGonHistoryEntry {
    before: NGonHistoryState;
    after: NGonHistoryState;
}

interface NGonHit {
    mesh: Mesh;
    handle: NGonHandle;
}

export type { GestureMode, NGonEditMode, NGonEditOrigin, NGonGesture, NGonHandle, NGonHistoryEntry, NGonHistoryItem, NGonHistoryState, NGonHit, NGonSnapshot, SelectionOperation };
