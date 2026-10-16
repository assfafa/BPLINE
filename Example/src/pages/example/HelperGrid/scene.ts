import { CameraControl } from "bplinejs";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";
import SceneRuntime from "@/pages/example/reference/SceneRuntime.ts";
import { createSimpleHelper } from "./simple.ts";

/**
 * Mount standalone grid and rulers with optional camera and color controls.
 * @param options Hosts, advanced mode and error reporting.
 * @example const dispose = mountHelperScene(options);
 * @returns Cleanup for helper, control, GUI and GPU.
 */
export const mountHelperScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new SceneRuntime(options);
    const helper = createSimpleHelper(runtime.scene, runtime.render, runtime.camera);
    runtime.helper = helper;
    let control: CameraControl | null = null;
    let gui: GUI | null = null;

    // The full example demonstrates camera interaction and independent ruler placement.
    if (options.advanced) {
        const cameraControl = new CameraControl(runtime.camera, runtime.render);
        control = cameraControl;
        /**
         * Update the screen-space helper after camera gestures.
         * @example runtime.update = update;
         * @returns No value.
         */
        const update = (): void => {
            cameraControl.update();
            helper.update();
        };
        runtime.update = update;

        // Color edits explicitly select the custom palette, including Color subscriptions.
        if (options.guiContainer) {
            gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "HelperGrid", width: 200 });
            gui.add(helper, "mode", ["dark", "light", "custom"]).listen();
            gui.add(helper, "minorPerMajor", 2, 20, 1);
            gui.add(helper, "ruler");
            gui.add(helper, "horizontalRuler", ["bottom", "top", "none"]);
            gui.add(helper, "verticalRuler", ["left", "right", "none"]);
            gui.add(runtime.camera, "zoom", 0.1, 8, 0.1).listen();
            const colors = {
                gridMinorColor: "#2e333d",
                gridMajorColor: "#4a5463",
                rulerMinorColor: "#929aa6",
                rulerMajorColor: "#c9d1de",
                rulerTextColor: "#c9d1de",
            };
            /**
             * Apply the five custom colors as observable Color mutations.
             * @example gui.addColor(colors, "gridMajorColor").onChange(applyColors);
             * @returns No value.
             */
            const applyColors = (): void => {
                helper.mode = "custom";
                helper.custom.gridMinorColor.setHex(colors.gridMinorColor);
                helper.custom.gridMajorColor.setHex(colors.gridMajorColor);
                helper.custom.rulerMinorColor.setHex(colors.rulerMinorColor);
                helper.custom.rulerMajorColor.setHex(colors.rulerMajorColor);
                helper.custom.rulerTextColor.setHex(colors.rulerTextColor);
            };
            const palette = gui.addFolder("Custom colors");
            palette.addColor(colors, "gridMinorColor").onChange(applyColors);
            palette.addColor(colors, "gridMajorColor").onChange(applyColors);
            palette.addColor(colors, "rulerMinorColor").onChange(applyColors);
            palette.addColor(colors, "rulerMajorColor").onChange(applyColors);
            palette.addColor(colors, "rulerTextColor").onChange(applyColors);
        }
    } else {
        /**
         * Keep default rulers matched to the current viewport.
         * @example runtime.update = update;
         * @returns No value.
         */
        const update = (): void => {
            helper.update();
        };
        runtime.update = update;
    }
    void runtime.start();

    /**
     * Remove both helper meshes and stop animation.
     * @example return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        helper.destroy();
        control?.dispose();
        gui?.destroy();
        runtime.destroy();
    };
    return dispose;
};
