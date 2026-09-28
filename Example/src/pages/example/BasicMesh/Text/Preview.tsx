import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountTextScene } from "./scene.ts";

interface TextPreviewProps {
    advanced: boolean;
}

/**
 * Show centered multiline text with optional layout and style controls.
 * @param props Whether to show the advanced preview.
 * @example
 * <TextPreview advanced={true} />
 * @returns Live text preview.
 */
const TextPreview = ({ advanced }: TextPreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="text-controls" mountScene={mountTextScene} />;
};

export default TextPreview;
