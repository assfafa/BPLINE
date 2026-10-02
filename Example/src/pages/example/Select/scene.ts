import {
    BaseMaterial,
    Camera,
    CameraControl,
    Mesh,
    NGon2D,
    Poly2D,
    Rect2D,
    Render,
    Scene,
    Select,
} from "bplinejs";
import type { SelectResult } from "bplinejs";
import { Vec2 } from "bpmatrixjs/Math";
import GUI from "lil-gui";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";
import { createModels } from "./models.ts";

type SelectionShape = "point" | "rect" | "poly" | "ngon";
type Coverage = "cad" | "all" | "any";

/**
 * Mount either the short click example or the full selection API example.
 * @param options Preview host, GUI host, preview mode, and error callback.
 * @example
 * const dispose = mountSelectScene(options);
 * @returns Cleanup for GPU resources, controls, and event listeners.
 */
export const mountSelectScene = (options: SceneMountOptions): (() => void) => {
    const render = new Render(options.container, "production");
    render.backgroundColor = { r: 0.055, g: 0.075, b: 0.13, a: 1 };
    const scene = new Scene();
    createModels(scene, options.advanced);
    const camera = new Camera();
    camera.zoom = 1.08;
    const select = new Select(scene, render, camera);
    let control: CameraControl | undefined;
    // The short example is intentionally limited to click selection.
    if (options.advanced) {
        control = new CameraControl(camera, render);
    }
    const parameters: { shape: SelectionShape; coverage: Coverage } = { shape: "point", coverage: "cad" };
    let gui: GUI | undefined;
    let highlighted: Mesh[] = [];
    const originalOrders = new Map<Mesh, number>();
    let dragStart: Vec2 | undefined;
    let dragPointerId: number | undefined;
    const polyPoints: Vec2[] = [];
    let animationFrame = 0;
    let mounted = true;

    const status = document.createElement("div");
    status.style.cssText = "position:absolute;left:8px;top:8px;z-index:2;pointer-events:none;color:#fff;background:#111a2bcc;padding:5px 8px;border-radius:5px;font:11px/1.4 sans-serif;white-space:pre-line";
    status.textContent = "Click a shape to select";
    options.container.appendChild(status);

    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    overlay.style.cssText = "position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible";
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("fill", "#ffeb5726");
    outline.setAttribute("stroke", "#ffeb57");
    outline.setAttribute("stroke-width", "2");
    outline.setAttribute("stroke-dasharray", "5 4");
    overlay.appendChild(outline);
    options.container.appendChild(overlay);

    /**
     * Keep the selection outline aligned with the camera and canvas cell.
     * @param points World-space outline points.
     * @param closed Whether to join the last point back to the first.
     * @example
     * showOutline(points, true);
     * @returns No value.
     */
    const showOutline = (points: readonly Vec2[], closed: boolean): void => {
        const bounds = options.container.getBoundingClientRect();
        const commands: string[] = [];
        // Project every world vertex so camera panning and zoom keep the preview accurate.
        for (let index = 0; index < points.length; index += 1) {
            const projected = camera.worldToWindow(points[index], render);
            let command = "L";
            // The first vertex starts the SVG path; later vertices extend it.
            if (index === 0) {
                command = "M";
            }
            commands.push(`${command}${String(projected.x - bounds.left)} ${String(projected.y - bounds.top)}`);
        }
        // Three or more vertices can show a filled selection area.
        if (closed && points.length >= 3) {
            commands.push("Z");
        }
        outline.setAttribute("d", commands.join(" "));
    };

    /**
     * Convert a browser pointer position into the world used by selection meshes.
     * @param event Mouse or pointer event in viewport coordinates.
     * @example
     * const world = worldAt(event);
     * @returns World position beneath the pointer.
     */
    const worldAt = (event: MouseEvent): Vec2 => {
        return camera.windowToWorld(new Vec2(event.clientX, event.clientY), render);
    };

    /**
     * Turn a center and radius into the same 100-sided contour used by NGon2D.
     * @param center World-space center.
     * @param radius World-space radius.
     * @example
     * showOutline(circlePoints(center, 40), true);
     * @returns One hundred outline vertices.
     */
    const circlePoints = (center: Vec2, radius: number): Vec2[] => {
        const points: Vec2[] = [];
        // Preview and geometry share the same vertex count and initial angle.
        for (let index = 0; index < 100; index += 1) {
            const angle = index * Math.PI * 2 / 100;
            points.push(new Vec2(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle)));
        }
        return points;
    };

    /**
     * Remove the last highlight and restore each mesh's original draw order.
     * @example
     * clearSelection();
     * @returns No value.
     */
    const clearSelection = (): void => {
        // Restore both style and order so successive picks do not accumulate highlights.
        for (const mesh of highlighted) {
            // Some external meshes may lack a Style, but still appear in a result.
            if (mesh.style !== undefined) {
                mesh.style.edge.enabled = false;
            }
            const originalOrder = originalOrders.get(mesh);
            // The simple preview never changes order, so only advanced results have a saved value.
            if (originalOrder !== undefined) {
                mesh.order = originalOrder;
            }
        }
        highlighted = [];
        originalOrders.clear();
    };

    /**
     * Apply a Select result to the preview using the same yellow border in both modes.
     * @param result Grouped face, edge, and vertex hits.
     * @example
     * showSelection(select.SelectPicker(event));
     * @returns No value.
     */
    const showSelection = (result: SelectResult): void => {
        clearSelection();
        // Advanced mode demonstrates Select.Sort; simple mode keeps only grouped face hits.
        if (options.advanced) {
            highlighted = Select.Sort(result);
        } else {
            // The short example only demonstrates grouped face picking, without sorting or layer changes.
            highlighted = [...result.Rect2D, ...result.NGon, ...result.Poly2D, ...result.Base2D];
        }
        // Yellow borders are the visual feedback in both preview modes.
        for (const mesh of highlighted) {
            // A valid style can expose a generated edge for this individual mesh.
            if (mesh.style !== undefined) {
                mesh.style.edge.enabled = true;
            }
            // Only the full API preview changes scene draw order.
            if (options.advanced) {
                originalOrders.set(mesh, mesh.order);
                mesh.order = 1;
            }
        }
        status.textContent = `${String(highlighted.length)} selected`;
    };

    /**
     * Build a temporary selection mesh outside the displayed scene.
     * @param geometry Fill geometry describing the area.
     * @param x World-space X position.
     * @param y World-space Y position.
     * @example
     * selectArea(new Rect2D({ width: 100, height: 80 }), 0, 0);
     * @returns No value.
     */
    const selectArea = (geometry: Rect2D | Poly2D | NGon2D, x: number, y: number): void => {
        const frame = new Mesh(geometry, new BaseMaterial(), false);
        frame.position.set(x, y);
        showSelection(select.Selector(frame));
    };

    /**
     * Refresh the current drag outline in world space.
     * @param pointer Latest browser pointer position.
     * @example
     * previewDrag(event);
     * @returns No value.
     */
    const previewDrag = (pointer: MouseEvent): void => {
        // A pending drag is the only gesture with a temporary drag outline.
        if (dragStart !== undefined) {
            const start = camera.windowToWorld(dragStart, render);
            const end = worldAt(pointer);
            // Rectangles use opposite corners in world coordinates.
            if (parameters.shape === "rect") {
                showOutline([
                    new Vec2(start.x, start.y),
                    new Vec2(end.x, start.y),
                    new Vec2(end.x, end.y),
                    new Vec2(start.x, end.y),
                ], true);
            } else {
                // The circle preview follows the same center and radius as its NGon mesh.
                if (parameters.shape === "ngon") {
                    const radius = Math.hypot(end.x - start.x, end.y - start.y);
                    showOutline(circlePoints(start, radius), true);
                }
            }
        }
    };

    /**
     * Switch between point picking and the three area gestures.
     * @example
     * gui.add(parameters, "shape").onChange(changeShape);
     * @returns No value.
     */
    const changeShape = (): void => {
        dragStart = undefined;
        dragPointerId = undefined;
        polyPoints.length = 0;
        outline.setAttribute("d", "");
        // Camera panning gives the left button to area creation and the polygon's right button to closure.
        if (control !== undefined) {
            control.leftDrag = parameters.shape === "point";
            // Right click closes a polygon, while the other modes retain right-button camera panning.
            control.rightDrag = parameters.shape !== "poly";
        }
        // Keep the in-canvas instruction aligned with the selected gesture.
        if (parameters.shape === "point") {
            status.textContent = "Click to select · drag to pan";
        } else {
            // Polygon closure uses the right button, while drag frames leave it for the camera.
            if (parameters.shape === "poly") {
                status.textContent = "Left click: add vertex · right click: close";
            } else {
                status.textContent = "Left drag: select · right drag: pan";
            }
        }
    };

    /**
     * Pick with the unified Select API when the current gesture is a click.
     * @param event Canvas click event.
     * @example
     * options.container.addEventListener("click", handleClick);
     * @returns No value.
     */
    const handleClick = (event: MouseEvent): void => {
        // CameraControl can retarget a captured click to the container.
        if (parameters.shape === "point" && (event.target === render.canvas || event.target === options.container)) {
            showSelection(select.SelectPicker(event));
        }
    };

    /**
     * Start a rectangle/circle drag or add one polygon vertex.
     * @param event Pointer event on the canvas.
     * @example
     * options.container.addEventListener("pointerdown", handlePointerDown);
     * @returns No value.
     */
    const handlePointerDown = (event: PointerEvent): void => {
        // GUI clicks and touch gestures belong to their own controls.
        if (options.advanced && event.pointerType !== "touch" && event.target === render.canvas) {
            // Polygon vertices are committed one click at a time.
            if (parameters.shape === "poly") {
                // Left adds a node and right ends the contour.
                if (event.button === 0) {
                    polyPoints.push(worldAt(event));
                    showOutline(polyPoints, polyPoints.length >= 3);
                    status.textContent = `${String(polyPoints.length)} vertices · right click to close`;
                    event.preventDefault();
                } else {
                    // Right-click closure does not start camera panning.
                    if (event.button === 2) {
                        finishPolygon();
                        event.preventDefault();
                    }
                }
            } else {
                // Rectangle and circle gestures begin at the pressed world point.
                if (parameters.shape !== "point" && event.button === 0) {
                    dragStart = new Vec2(event.clientX, event.clientY);
                    dragPointerId = event.pointerId;
                    previewDrag(event);
                    options.container.setPointerCapture(event.pointerId);
                    event.preventDefault();
                }
            }
        }
    };

    /**
     * Close the clicked polygon and submit its filled area to Select.
     * @example
     * finishPolygon();
     * @returns No value.
     */
    const finishPolygon = (): void => {
        // Fewer than three nodes cannot define a filled selection region.
        if (polyPoints.length >= 3) {
            const coordinates = new Float32Array(polyPoints.length * 2);
            // Poly2D accepts interleaved world coordinates; its temporary Mesh stays at the origin.
            for (let index = 0; index < polyPoints.length; index += 1) {
                coordinates[index * 2] = polyPoints[index].x;
                coordinates[index * 2 + 1] = polyPoints[index].y;
            }
            // The CAD direction option has no drag direction for a clicked polygon.
            if (parameters.coverage === "any") {
                select.selectionMode = "any";
            } else {
                select.selectionMode = "all";
            }
            selectArea(new Poly2D(coordinates), 0, 0);
        }
        polyPoints.length = 0;
        outline.setAttribute("d", "");
    };

    /**
     * Update the active frame or the next polygon segment.
     * @param event Moving pointer.
     * @example
     * window.addEventListener("pointermove", handlePointerMove);
     * @returns No value.
     */
    const handlePointerMove = (event: PointerEvent): void => {
        // A captured drag takes precedence over a polygon's rubber-band segment.
        if (dragPointerId === event.pointerId && dragStart !== undefined) {
            previewDrag(event);
        } else {
            // Hover previews the next edge without committing another vertex.
            if (parameters.shape === "poly" && polyPoints.length > 0 && event.pointerType !== "touch") {
                showOutline([...polyPoints, worldAt(event)], false);
            }
        }
    };

    /**
     * Turn a completed drag into a rectangle or a 100-sided circular area.
     * @param event Released pointer.
     * @example
     * window.addEventListener("pointerup", handlePointerUp);
     * @returns No value.
     */
    const handlePointerUp = (event: PointerEvent): void => {
        // Ignore pointer releases that do not belong to this area drag.
        if (dragStart !== undefined && dragPointerId === event.pointerId) {
            const startPointer = dragStart;
            dragStart = undefined;
            dragPointerId = undefined;
            outline.setAttribute("d", "");
            // Release the pointer so normal clicks resume after this drag.
            if (options.container.hasPointerCapture(event.pointerId)) {
                options.container.releasePointerCapture(event.pointerId);
            }
            const distance = Math.hypot(event.clientX - startPointer.x, event.clientY - startPointer.y);
            // A very short drag remains a point pick.
            if (distance <= 3) {
                showSelection(select.SelectPicker(event));
            } else {
                const start = camera.windowToWorld(startPointer, render);
                const end = worldAt(event);
                // CAD mode uses horizontal rectangle drag direction; other areas use explicit coverage.
                if (parameters.coverage === "cad" && parameters.shape === "rect") {
                    // The first side of a left-to-right drag must fully contain a candidate.
                    if (event.clientX >= startPointer.x) {
                        select.selectionMode = "left";
                    } else {
                        select.selectionMode = "right";
                    }
                } else {
                    // Any overlap is shared by all three selection shapes.
                    if (parameters.coverage === "any") {
                        select.selectionMode = "any";
                    } else {
                        select.selectionMode = "all";
                    }
                }
                // The release creates exactly one invisible selection Mesh.
                if (parameters.shape === "rect") {
                    const width = Math.abs(end.x - start.x);
                    const height = Math.abs(end.y - start.y);
                    // A zero-area rectangle cannot select a filled mesh.
                    if (width > 0 && height > 0) {
                        selectArea(new Rect2D({ width, height }), (start.x + end.x) / 2, (start.y + end.y) / 2);
                    }
                } else {
                    // A 100-sided NGon approximates a circular area around the pressed point.
                    if (parameters.shape === "ngon") {
                        const radius = Math.hypot(end.x - start.x, end.y - start.y);
                        // Avoid passing a degenerate radius to the selection algorithm.
                        if (radius > 0) {
                            selectArea(new NGon2D({ outer: radius, sides: 100 }), start.x, start.y);
                        }
                    }
                }
            }
        }
    };

    /**
     * Drop an interrupted drag without selecting a partly drawn area.
     * @param event Cancelled pointer.
     * @example
     * window.addEventListener("pointercancel", handlePointerCancel);
     * @returns No value.
     */
    const handlePointerCancel = (event: PointerEvent): void => {
        // An unrelated pointer cannot cancel the active frame.
        if (dragPointerId === event.pointerId) {
            dragStart = undefined;
            dragPointerId = undefined;
            outline.setAttribute("d", "");
        }
    };

    /**
     * Reserve the context-menu gesture for closing a polygon.
     * @param event Browser context-menu event.
     * @example
     * options.container.addEventListener("contextmenu", handleContextMenu);
     * @returns No value.
     */
    const handleContextMenu = (event: MouseEvent): void => {
        // The polygon's right-click closure should not open the browser menu.
        if (parameters.shape === "poly") {
            event.preventDefault();
        }
    };

    /**
     * Resize the canvas and align the camera's physical-pixel viewport.
     * @example
     * resizeObserver.observe(options.container);
     * @returns No value.
     */
    const updateViewport = (): void => {
        render.resize();
        const bounds = options.container.getBoundingClientRect();
        camera.setViewport(Math.max(1, bounds.width * render.dpr), Math.max(1, bounds.height * render.dpr));
        overlay.setAttribute("width", String(bounds.width));
        overlay.setAttribute("height", String(bounds.height));
    };
    const resizeObserver = new ResizeObserver(updateViewport);

    // Only the full API preview exposes selection switches and tolerances.
    if (options.advanced && options.guiContainer) {
        gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Select", width: 200 });
        gui.add(parameters, "shape", { Pick: "point", Rectangle: "rect", Polygon: "poly", Circle: "ngon" }).name("Gesture").onChange(changeShape);
        gui.add(parameters, "coverage", { "CAD direction": "cad", "Fully inside": "all", "Any overlap": "any" }).name("Coverage");
        gui.add(select, "rectPicker").name("Rect pick");
        gui.add(select, "ngonPicker").name("NGon pick");
        gui.add(select, "polyPicker").name("Poly pick");
        gui.add(select, "linePicker").name("Edge pick");
        gui.add(select, "pointPicker").name("Vertex pick");
        gui.add(select.lineSelectTool, "radius", 0, 25, 1).name("Edge radius");
        gui.add(select.pointSelectTool, "radius", 0, 25, 1).name("Vertex radius");
    } else {
        select.linePicker = false;
        select.pointPicker = false;
    }

    options.container.addEventListener("click", handleClick);
    options.container.addEventListener("pointerdown", handlePointerDown);
    options.container.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    resizeObserver.observe(options.container);

    /**
     * Draw continuously while the preview remains mounted.
     * @example
     * animationFrame = requestAnimationFrame(drawFrame);
     * @returns No value.
     */
    const drawFrame = (): void => {
        // A stale animation callback must not draw after React unmounts its canvas.
        if (mounted) {
            // The short preview has no camera controller.
            if (control !== undefined) {
                control.update();
            }
            render.render(scene, camera);
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Start rendering after WebGPU initialization.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleReady = (): void => {
        // Device creation can resolve after the route has already unmounted.
        if (mounted) {
            updateViewport();
            animationFrame = requestAnimationFrame(drawFrame);
        }
    };

    /**
     * Report an initialization failure to the preview cell.
     * @param error WebGPU failure.
     * @example
     * void render.ready.then(handleReady, handleError);
     * @returns No value.
     */
    const handleError = (error: unknown): void => {
        // Ignore late failures from an already disposed render instance.
        if (mounted) {
            options.onError(error);
        }
    };
    void render.ready.then(handleReady, handleError);

    /**
     * Release all browser listeners, controls, and GPU resources for this cell.
     * @example
     * return dispose;
     * @returns No value.
     */
    const dispose = (): void => {
        mounted = false;
        cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        options.container.removeEventListener("click", handleClick);
        options.container.removeEventListener("pointerdown", handlePointerDown);
        options.container.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);
        clearSelection();
        // GUI and CameraControl each own browser listeners.
        if (gui !== undefined) {
            gui.destroy();
        }
        // Dispose only the controller created for the advanced preview.
        if (control !== undefined) {
            control.dispose();
        }
        overlay.remove();
        status.remove();
        render.destroy();
    };
    return dispose;
};
