import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountNGonScene } from "./scene.ts";

interface NGonPreviewProps {
    advanced: boolean;
}

/**
 * Show the ngon scene with shared canvas and floating GUI behavior.
 * @param props Whether to show advanced controls.
 * @example
 * <NGonPreview advanced={true} />
 * @returns Live ngon preview.
 */
const NGonPreview = ({ advanced }: NGonPreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="ngon-controls" mountScene={mountNGonScene} />;
};

export default NGonPreview;
