import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountTextureScene } from "./scene.ts";

interface TexturePreviewProps {
    advanced: boolean;
}

/**
 * Show the texture scene with the shared canvas and floating GUI.
 * @param props Whether to show advanced controls.
 * @example
 * <TexturePreview advanced={true} />
 * @returns Live preview.
 */
const TexturePreview = ({ advanced }: TexturePreviewProps): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="texture-controls" mountScene={mountTextureScene} />;
};

export default TexturePreview;
