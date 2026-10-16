import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountWgslScene } from "./scene.ts";

/** @param props Preview mode @example <WgslPreview advanced /> @returns Interactive preview. */
const WgslPreview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="wgsl-controls" mountScene={mountWgslScene} />;
};

export default WgslPreview;
