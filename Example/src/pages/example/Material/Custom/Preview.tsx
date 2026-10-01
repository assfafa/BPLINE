import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountCustomMaterialScene } from "./scene.ts";

interface CustomMaterialPreviewProps {
    advanced: boolean;
}

/**
 * Show the simple and complete shader scenes in the shared preview layout.
 * @param props Whether to mount the complete scene and controls.
 * @example
 * <CustomMaterialPreview advanced={true} />
 * @returns Live shader preview.
 */
const CustomMaterialPreview = ({ advanced }: CustomMaterialPreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="custom-material-controls" mountScene={mountCustomMaterialScene} />;
};

export default CustomMaterialPreview;
