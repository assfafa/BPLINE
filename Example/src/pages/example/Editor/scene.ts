import { CameraControl, Editor, EditorKey, Font } from "bplinejs";
import type { EditorDocument } from "bplinejs/Editor";
import GUI from "lil-gui";
import fontUrl from "@/assets/ttf/MiSans-Normal.woff2?url";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";
import SceneRuntime from "@/pages/example/reference/SceneRuntime.ts";
import { createSimpleEditor } from "./simple.ts";
import { createEditorModels } from "./models.ts";

/**
 * Mount the minimal or complete collection editor, never standalone tools.
 * @param options Preview hosts and mode.
 * @example const dispose = mountEditorScene(options);
 * @returns Cleanup for editor, keys, control, GUI and WebGPU.
 */
export const mountEditorScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new SceneRuntime(options);
    let editor: Editor | null = null;
    let control: CameraControl | null = null;
    let keys: EditorKey | null = null;
    let gui: GUI | null = null;
    let saved: EditorDocument | null = null;

    /**
     * Register a font before constructing text entities.
     * @example void initialize();
     * @returns A promise settling after preview setup.
     */
    const initialize = async (): Promise<void> => {
        try {
            // The simple example needs no font, keyboard adapter or camera control.
            if (options.advanced) {
                await Font.register("MiSans", fontUrl);
            }
            // Route changes can finish before asynchronous font registration.
            if (runtime.mounted) {
                // Both cells use the settings demonstrated by their standalone code samples.
                if (options.advanced) {
                    const collection = new Editor(runtime.scene, runtime.render, runtime.camera, { nest: true });
                    editor = collection;
                    runtime.helper = collection.helperGrid;
                    createEditorModels(collection);
                    const cameraControl = new CameraControl(runtime.camera, runtime.render);
                    control = cameraControl;
                    keys = new EditorKey(collection, cameraControl);
                    collection.textEditTool.fontFamily = "MiSans";
                    collection.textEditTool.fontSize = 18;

                    /**
                     * Keep the latest JSON document in memory.
                     * @param document Serializable editor document.
                     * @example collection.onSave("preview", receiveSave);
                     * @returns No value.
                     */
                    const receiveSave = (document: EditorDocument): void => {
                        saved = document;
                        console.log("Editor document", document);
                    };
                    collection.onSave("preview", receiveSave);

                    /**
                     * Export through the same API used by Ctrl+S.
                     * @example actions.save();
                     * @returns No value.
                     */
                    const save = (): void => {
                        collection.save();
                    };
                    /**
                     * Restore the last saved document without downloading files.
                     * @example actions.load();
                     * @returns No value.
                     */
                    const load = (): void => {
                        // Until the first save, loading is intentionally a no-op.
                        if (saved !== null) {
                            collection.load(saved);
                        }
                    };
                    /**
                     * Undo the last complete editing gesture.
                     * @example actions.undo();
                     * @returns No value.
                     */
                    const undo = (): void => {
                        collection.undo();
                    };
                    /**
                     * Restore an undone gesture.
                     * @example actions.redo();
                     * @returns No value.
                     */
                    const redo = (): void => {
                        collection.redo();
                    };
                    /**
                     * Convert the current selection to editable Base boundaries.
                     * @example actions.toBase();
                     * @returns No value.
                     */
                    const toBase = (): void => {
                        collection.toBase();
                    };
                    const actions = { save, load, undo, redo, toBase };
                    const status = { selected: 0, types: "", orderMax: 0, undoCount: 0, redoCount: 0, saved: false };
                    const transforms = {
                        activeOnly: true,
                        constrain: false,
                        rotationEnabled: true,
                        translationStep: 10,
                        rotationStep: 15,
                        translationStepEnabled: false,
                        rotationStepEnabled: false,
                    };
                    /**
                     * Apply shared transform preferences to all shape tools.
                     * @example transformGui.onChange(applyTransforms);
                     * @returns No value.
                     */
                    const applyTransforms = (): void => {
                        const tools = [collection.rectEditTool, collection.ngonEditTool, collection.polyEditTool, collection.textEditTool];
                        // The collection owns group gestures, using the same tool preferences.
                        for (const tool of tools) {
                            tool.activeOnly = transforms.activeOnly;
                            tool.constrain = transforms.constrain;
                            tool.rotationEnabled = transforms.rotationEnabled;
                            tool.translationStep = transforms.translationStep;
                            tool.rotationStep = transforms.rotationStep;
                            tool.translationStepEnabled = transforms.translationStepEnabled;
                            tool.rotationStepEnabled = transforms.rotationStepEnabled;
                        }
                    };
                    applyTransforms();

                    // GUI changes use public getters/setters so all child tools stay synchronized.
                    if (options.guiContainer) {
                        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Editor", width: 200 });
                        gui.add(collection, "shape", ["rect", "ngon", "poly", "text", "group"]).listen();
                        gui.add(collection, "activeType", ["view", "edit", "add", "sub", "group"]).listen();
                        gui.add(collection, "mult").listen();
                        gui.add(collection, "nest");
                        gui.add(collection, "raiseSelected");
                        gui.add(collection, "snap").listen();
                        const snapping = gui.addFolder("Snap options");
                        snapping.add(collection.snapOptions, "vertex").listen();
                        snapping.add(collection.snapOptions, "edge").listen();
                        snapping.add(collection.snapOptions, "intersection").listen();
                        snapping.add(collection.snapOptions, "grid").listen();
                        snapping.close();
                        gui.add(collection, "ignoreZoom");
                        gui.add(collection, "autoPrecision");
                        gui.add(collection, "order", -10, 10, 1);
                        const transformGui = gui.addFolder("Transform");
                        transformGui.add(transforms, "activeOnly").onChange(applyTransforms).listen();
                        transformGui.add(transforms, "constrain").onChange(applyTransforms).listen();
                        transformGui.add(transforms, "rotationEnabled").onChange(applyTransforms).listen();
                        transformGui.add(transforms, "translationStep", 1, 100, 1).onChange(applyTransforms).listen();
                        transformGui.add(transforms, "rotationStep", 1, 90, 1).onChange(applyTransforms).listen();
                        transformGui.add(transforms, "translationStepEnabled").onChange(applyTransforms).listen();
                        transformGui.add(transforms, "rotationStepEnabled").onChange(applyTransforms).listen();
                        transformGui.close();
                        const rect = gui.addFolder("Rect");
                        rect.add(collection.rectEditTool, "origin", ["left", "center"]).listen();
                        rect.close();
                        const ngon = gui.addFolder("NGon");
                        ngon.add(collection.ngonEditTool, "sides", 3, 90, 1).listen();
                        ngon.add(collection.ngonEditTool, "uvMode", ["bounding", "polar"]);
                        ngon.close();
                        const text = gui.addFolder("Text");
                        text.add(collection.textEditTool, "fontSize", 8, 64, 1);
                        text.add(collection.textEditTool, "letterSpacing", 0, 10, 1);
                        text.add(collection.textEditTool, "lineSpacing", 0, 20, 1);
                        text.add(collection.textEditTool, "textAlign", ["left", "center", "right"]);
                        text.close();
                        const interaction = gui.addFolder("Interaction");
                        interaction.add(collection.switches, "pick");
                        interaction.add(collection.switches, "marquee");
                        interaction.add(collection.switches, "create");
                        interaction.add(collection.switches, "move");
                        interaction.add(collection.switches, "resize");
                        interaction.add(collection.switches, "scale");
                        interaction.add(collection.switches, "rotate");
                        interaction.add(collection.switches, "insertVertex");
                        interaction.add(collection.switches, "reparent");
                        interaction.close();
                        const types = gui.addFolder("Types");
                        types.add(collection, "rect");
                        types.add(collection, "ngon");
                        types.add(collection, "poly");
                        types.add(collection, "text");
                        types.add(collection, "group");
                        types.close();
                        const document = gui.addFolder("Document");
                        document.add(status, "selected").disable().listen();
                        document.add(status, "types").disable().listen();
                        document.add(status, "orderMax").disable().listen();
                        document.add(status, "undoCount").disable().listen();
                        document.add(status, "redoCount").disable().listen();
                        document.add(status, "saved").disable().listen();
                        document.add(actions, "save");
                        document.add(actions, "load");
                        document.add(actions, "undo");
                        document.add(actions, "redo");
                        document.add(actions, "toBase");
                    }

                    /**
                     * Update camera first, then collection overlays and culling.
                     * @example runtime.update = update;
                     * @returns No value.
                     */
                    const update = (): void => {
                        cameraControl.update();
                        collection.update();
                        status.selected = collection.actives.length;
                        const types: string[] = [];
                        // Expose geometry ownership so conversion and undo are visible in the GUI.
                        for (const mesh of collection.actives) {
                            // A released entity may no longer have drawable geometry.
                            if (mesh.data !== undefined) {
                                types.push(mesh.data.type);
                            }
                        }
                        status.types = types.join(", ");
                        status.orderMax = collection.orderMax;
                        status.undoCount = collection.undoCount;
                        status.redoCount = collection.redoCount;
                        status.saved = saved !== null;
                        const settings = collection.rectEditTool;
                        transforms.activeOnly = settings.activeOnly;
                        transforms.constrain = settings.constrain;
                        transforms.rotationEnabled = settings.rotationEnabled;
                        transforms.translationStep = settings.translationStep;
                        transforms.rotationStep = settings.rotationStep;
                        transforms.translationStepEnabled = settings.translationStepEnabled;
                        transforms.rotationStepEnabled = settings.rotationStepEnabled;
                    };
                    runtime.update = update;
                } else {
                    const collection = createSimpleEditor(runtime.scene, runtime.render, runtime.camera);
                    editor = collection;
                    runtime.helper = collection.helperGrid;
                    /**
                     * Refresh the minimal editor before each render.
                     * @example runtime.update = update;
                     * @returns No value.
                     */
                    const update = (): void => {
                        collection.update();
                    };
                    runtime.update = update;
                }
                await runtime.start();
            }
        } catch (error) {
            // Deliver initialization errors only while this cell is still mounted.
            if (runtime.mounted) {
                options.onError(error);
            }
        }
    };
    void initialize();

    /**
     * Restore control switches before destroying the editing scene.
     * @example return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        keys?.destroy();
        editor?.destroy();
        control?.dispose();
        gui?.destroy();
        runtime.destroy();
    };
    return dispose;
};
