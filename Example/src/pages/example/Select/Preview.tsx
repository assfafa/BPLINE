import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountSelectScene } from "./scene.ts";

/**
 * Show the click-only or full selection scene in the shared preview cell.
 * @param props Whether advanced gestures and GUI are enabled.
 * @example
 * <SelectPreview advanced={true} />
 * @returns Live selection preview.
 */
const SelectPreview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    return <ShapePreview advanced={advanced} controlsId="select-controls" mountScene={mountSelectScene} />;
};

export default SelectPreview;
