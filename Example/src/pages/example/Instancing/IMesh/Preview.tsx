import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { mountInstanceScene } from "./scene.ts";

interface InstancePreviewProps {
    advanced: boolean;
}

/**
 * Show the instanced mesh scene with the shared canvas and floating GUI.
 * @param props Whether to show advanced controls.
 * @example
 * <InstancePreview advanced={true} />
 * @returns Live preview.
 */
const InstancePreview = ({ advanced }: InstancePreviewProps): JSX.Element => {
    const { language } = useLocale();

    return (
        <div className="relative h-full">
            <ShapePreview advanced={advanced} controlsId="instance-controls" mountScene={mountInstanceScene} />
            <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/85 px-2 py-1 text-xs text-foreground">
                {translator.translate(language, "example.controlHint")}
            </p>
        </div>
    );
};

export default InstancePreview;
