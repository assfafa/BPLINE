import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountPolygonScene } from "./scene.ts";

interface PolygonPreviewProps {
    advanced: boolean;
}

/**
 * Show the polygon scene with shared canvas and floating GUI behavior.
 * @param props Whether to show advanced controls.
 * @example
 * <PolygonPreview advanced={true} />
 * @returns Live polygon preview.
 */
const PolygonPreview = ({ advanced }: PolygonPreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="polygon-controls" mountScene={mountPolygonScene} />;
};

export default PolygonPreview;
