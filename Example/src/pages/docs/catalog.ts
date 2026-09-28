/** A visible sidebar item and, when present, its documentation route. */
export interface DocumentationItem {
    label: string;
    path?: string;
    source?: string;
    children?: readonly DocumentationItem[];
}

/**
 * Register a public documentation page and its sidebar children.
 * @param label Label shown in the sidebar.
 * @param path Hash router path.
 * @param source Folder under src/pages/docs.
 * @param children Optional third-level pages.
 * @example
 * page("Math", "/docs/math", "Math");
 * @returns Documentation navigation item.
 */
const page = (
    label: string,
    path: string,
    source: string,
    children?: readonly DocumentationItem[],
): DocumentationItem => {
    return {
        label,
        path,
        source: `/src/pages/docs/${source}/index.tsx`,
        children,
    };
};

/**
 * Show a category without offering a route that has no standalone page.
 * @param label Category label.
 * @param children Public pages in the category.
 * @example
 * group("Geometry", [page("Rect2D", "/docs/bpline/geometry/rect2d", "BPLine/Geometry/Rect2D")]);
 * @returns Non-clickable documentation category.
 */
const group = (label: string, children: readonly DocumentationItem[]): DocumentationItem => {
    return { label, children };
};

/** The Math and geometry package's public documentation tree. */
export const matrixDocumentation: readonly DocumentationItem[] = [
    page("Math", "/docs/math", "Math", [
        page("Vec2", "/docs/math/vec2", "Math/Vec2"),
        page("Mat3", "/docs/math/mat3", "Math/Mat3"),
    ]),
    page("Geometry", "/docs/geometry", "Geometry", [
        page("NGon", "/docs/geometry/ngon", "Geometry/NGon"),
        page("Rect", "/docs/geometry/rect", "Geometry/Rect"),
        page("Poly", "/docs/geometry/poly", "Geometry/Poly"),
        page("Text", "/docs/geometry/text", "Geometry/Text"),
    ]),
    page("Utils", "/docs/utils", "Utils", [
        page("Inner", "/docs/utils/inner", "Utils/Inner"),
        page("Time", "/docs/utils/time", "Utils/Time"),
        page("UUID", "/docs/utils/uuid", "Utils/UUID"),
    ]),
];

/** Renderer documentation mirrors public modules under BPLineJS/src/scripts. */
export const lineDocumentation: readonly DocumentationItem[] = [
    page("BPLineJS", "/docs/bpline", "BPLine"),
    page("Camera", "/docs/bpline/camera", "BPLine/Camera"),
    page("Color", "/docs/bpline/color", "BPLine/Color"),
    group("Control", [
        page("CameraControl", "/docs/bpline/control/camera-control", "BPLine/Control/CameraControl"),
    ]),
    group("Geometry", [
        page("Geo", "/docs/bpline/geometry/geo", "BPLine/Geometry/Geo"),
        page("Rect2D", "/docs/bpline/geometry/rect2d", "BPLine/Geometry/Rect2D"),
        page("Poly2D", "/docs/bpline/geometry/poly2d", "BPLine/Geometry/Poly2D"),
        page("NGon2D", "/docs/bpline/geometry/ngon2d", "BPLine/Geometry/NGon2D"),
        page("Text", "/docs/bpline/geometry/text", "BPLine/Geometry/Text"),
    ]),
    page("Group", "/docs/bpline/group", "BPLine/Group"),
    page("IMesh", "/docs/bpline/imesh", "BPLine/IMesh"),
    group("Material", [
        page("Material", "/docs/bpline/material/material", "BPLine/Material/Material"),
        page("BaseMaterial", "/docs/bpline/material/base-material", "BPLine/Material/BaseMaterial"),
    ]),
    page("Mesh", "/docs/bpline/mesh", "BPLine/Mesh"),
    page("Object", "/docs/bpline/object", "BPLine/Object"),
    page("Raws", "/docs/bpline/raws", "BPLine/Raws"),
    page("Render", "/docs/bpline/render", "BPLine/Render"),
    page("Scene", "/docs/bpline/scene", "BPLine/Scene"),
    page("Font", "/docs/bpline/font", "BPLine/Font"),
    group("Style", [
        page("Style", "/docs/bpline/style/style", "BPLine/Style/Style"),
        page("SolidStyle", "/docs/bpline/style/solid-style", "BPLine/Style/SolidStyle"),
        page("WireframeStyle", "/docs/bpline/style/wireframe-style", "BPLine/Style/WireframeStyle"),
        page("EdgeStyle", "/docs/bpline/style/edge-style", "BPLine/Style/EdgeStyle"),
        page("PointsStyle", "/docs/bpline/style/points-style", "BPLine/Style/PointsStyle"),
        page("JoinStyle", "/docs/bpline/style/join-style", "BPLine/Style/JoinStyle"),
    ]),
    page("Texture", "/docs/bpline/texture", "BPLine/Texture"),
];
