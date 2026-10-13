import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { mountEditorScene } from "./scene.ts";

/**
 * Show the interactive Editor preview and usage hint.
 * @param props Whether to enable GUI and camera controls.
 * @example <Preview advanced={true} />
 * @returns Preview cell.
 */
const Preview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    const { language } = useLocale();
    let hint = translator.translate(language, "example.editorSimpleHint");
    // The simple preview has no camera control or keyboard adapter.
    if (advanced) {
        hint = translator.translate(language, "example.editorHint");
    }
    return (
        <div className="relative h-full">
            <ShapePreview advanced={advanced} controlsId="editor-controls" mountScene={mountEditorScene} />
            <p className="pointer-events-none absolute bottom-8 left-8 max-w-[70%] rounded bg-black/60 px-2 py-1 text-[10px] text-white lg:max-w-[calc(100%-270px)]">
                {hint}
            </p>
        </div>
    );
};

export default Preview;
