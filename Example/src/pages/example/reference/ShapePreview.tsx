import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";

export interface SceneMountOptions {
    container: HTMLDivElement;
    guiContainer: HTMLDivElement | null;
    advanced: boolean;
    onError: (error: unknown) => void;
}

interface ShapePreviewProps {
    advanced: boolean;
    controlsId: string;
    mountScene: (options: SceneMountOptions) => () => void;
}

/**
 * Mount a BPLineJS shape scene inside one example grid cell.
 * @param props Scene mount function, controls ID, and preview mode.
 * @example
 * <ShapePreview advanced={true} controlsId="polygon-controls" mountScene={mountPolygonScene} />
 * @returns Live shape preview.
 */
const ShapePreview = ({ advanced, controlsId, mountScene }: ShapePreviewProps): JSX.Element => {
    const { language } = useLocale();
    const canvasHost = useRef<HTMLDivElement>(null);
    const guiHost = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [guiOpen, setGuiOpen] = useState(false);
    let guiElement: JSX.Element | null = null;
    let canvasClass = "absolute inset-0";
    let guiLabel = translator.translate(language, "example.showControls");
    let guiVisibilityClass = "hidden";

    // The mobile control button describes its next action.
    if (guiOpen) {
        guiLabel = translator.translate(language, "example.hideControls");
        guiVisibilityClass = "block";
    }

    /**
     * Start the scene when this cell mounts and release it on route changes.
     * @example
     * useEffect(setupPreview, [advanced, mountScene]);
     * @returns Scene cleanup when a host exists.
     */
    const setupPreview = (): (() => void) | undefined => {
        const container = canvasHost.current;
        let dispose: (() => void) | undefined;

        // The renderer requires an attached element so canvas measurements are valid.
        if (container) {
            /**
             * Keep device failures visible in the preview cell.
             * @param failure WebGPU initialization failure.
             * @example
             * reportError(new Error("WebGPU unavailable"));
             * @returns No value.
             */
            const reportError = (failure: unknown): void => {
                // Preserve the underlying device error when it has a message.
                if (failure instanceof Error) {
                    setError(failure.message);
                } else {
                    setError(String(failure));
                }
            };

            dispose = mountScene({
                container,
                guiContainer: guiHost.current,
                advanced,
                onError: reportError,
            });
        }

        return dispose;
    };

    useEffect(setupPreview, [advanced, mountScene]);

    /**
     * Let narrow screens reveal the floating controls only when needed.
     * @example
     * <button onClick={toggleGui} />
     * @returns No value.
     */
    const toggleGui = (): void => {
        // The button opens and closes the overlay without changing the canvas size.
        if (guiOpen) {
            setGuiOpen(false);
        } else {
            setGuiOpen(true);
        }
    };

    // On wide layouts the canvas centers the shape in the space beside the floating GUI.
    if (advanced) {
        canvasClass = "absolute inset-0 lg:right-[205px]";
    }

    // Keep the GUI mounted while hidden so lil-gui retains its controls.
    if (advanced) {
        guiElement = (
            <>
                <button
                    type="button"
                    aria-controls={controlsId}
                    aria-expanded={guiOpen}
                    onClick={toggleGui}
                    className="absolute right-2 top-2 z-20 rounded-md border border-border bg-background px-3 py-1.5 text-xs shadow lg:hidden"
                >
                    {guiLabel}
                </button>
                <div
                    id={controlsId}
                    ref={guiHost}
                    className={`${guiVisibilityClass} absolute right-2 top-12 z-10 max-h-[calc(100%-3.5rem)] w-[220px] max-w-[calc(100%-1rem)] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-background/95 p-2 shadow-xl lg:top-2 lg:block lg:max-h-[calc(100%-1rem)]`}
                />
            </>
        );
    }

    return (
        <div className="relative h-full min-h-0 overflow-hidden bg-muted/40">
            <div ref={canvasHost} className={canvasClass} />
            {guiElement}
            {error && (
                <div role="alert" className="absolute inset-x-4 bottom-4 rounded-md border border-destructive/30 bg-background/90 p-3 text-sm text-destructive">
                    {translator.translate(language, "example.gpuError")}{error}
                </div>
            )}
        </div>
    );
};

export default ShapePreview;
