import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { mountCameraControlScene } from "./scene.ts";

interface CameraControlPreviewProps {
    advanced: boolean;
}

/**
 * Show the camera control scene with the shared canvas and floating GUI.
 * @param props Whether to show advanced controls.
 * @example
 * <CameraControlPreview advanced={true} />
 * @returns Live preview.
 */
const CameraControlPreview = ({ advanced }: CameraControlPreviewProps): JSX.Element => {
    const { language } = useLocale();

    return (
        <div className="relative h-full">
            <ShapePreview advanced={advanced} controlsId="control-controls" mountScene={mountCameraControlScene} />
            <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/85 px-2 py-1 text-xs text-foreground">
                {translator.translate(language, "example.controlHint")}
            </p>
        </div>
    );
};

export default CameraControlPreview;
