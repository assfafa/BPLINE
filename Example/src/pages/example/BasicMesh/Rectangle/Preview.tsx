import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountRectangleScene } from "./scene.ts";

interface RectanglePreviewProps {
    advanced: boolean;
}

/**
 * Show the rectangle scene with shared canvas and floating GUI behavior.
 * @param props Whether to show advanced controls.
 * @example
 * <RectanglePreview advanced={true} />
 * @returns Live rectangle preview.
 */
const RectanglePreview = ({ advanced }: RectanglePreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="rectangle-controls" mountScene={mountRectangleScene} />;
};

export default RectanglePreview;
