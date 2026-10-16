import { BaseMaterial, Mesh, Rect2D, Style, Texture } from "bplinejs";
import GUI from "lil-gui";
import videoUrl from "@/assets/video/big-buck-bunny-10s.mp4?url";
import SceneRuntime from "@/pages/example/reference/SceneRuntime.ts";
import type { SceneMountOptions } from "@/pages/example/reference/ShapePreview.tsx";

/** @param options Preview hosts and controls @example mountVideoScene(options); @returns Video, GUI and GPU cleanup. */
export const mountVideoScene = (options: SceneMountOptions): (() => void) => {
    const runtime = new SceneRuntime(options);
    const texture = new Texture();
    const style = new Style();
    style.solid.enabled = true;
    style.solid.texture = texture;
    const mesh = new Mesh(new Rect2D({ width: 300, height: 169, radius: 10 }), new BaseMaterial(), style);
    runtime.scene.add(mesh);
    let video: HTMLVideoElement | null = null;
    let gui: GUI | null = null;
    /** @example isMounted(); @returns Whether the asynchronous startup still owns the preview. */
    const isMounted = (): boolean => runtime.mounted;
    const parameters = { position: 0, speed: 1, loop: true };
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Play / Pause";
    button.className = "absolute bottom-3 left-3 z-10 rounded border border-border bg-background px-3 py-1 text-foreground";
    options.container.append(button);
    /** @example play(); @returns Playback promise; blocked autoplay remains user-controllable. */
    const play = async (): Promise<void> => {
        try {
            await video?.play();
        } catch {
            button.textContent = "Play";
        }
    };
    /** @example toggle(); @returns No value; user gesture controls the source DOM. */
    const toggle = (): void => {
        // Before the first frame loads, the button remains harmless.
        if (video !== null) {
            // Paused playback starts through a user gesture for restrictive browsers.
            if (video.paused) {
                void play();
            } else {
                video.pause();
            }
        }
    };
    button.addEventListener("click", toggle);
    /** @param seconds Target position @example seek(2); @returns No value. */
    const seek = (seconds: number): void => {
        // Keep the range inside the loaded ten-second clip.
        if (video !== null) {
            video.currentTime = Math.min(video.duration, Math.max(0, seconds));
        }
    };
    /** @example update(); @returns No value; reflect playback and upload video frames via Render. */
    const update = (): void => {
        // Texture.source retains the same DOM while its video frames change.
        if (video !== null) {
            video.playbackRate = parameters.speed;
            video.loop = parameters.loop;
            parameters.position = video.currentTime;
            button.textContent = "Pause";
            // A paused video keeps its last frame visible.
            if (video.paused) {
                button.textContent = "Play";
            }
        }
    };
    runtime.update = update;
    /** @example initialize(); @returns Startup completion. */
    const initialize = async (): Promise<void> => {
        try {
            await texture.load(videoUrl, "video");
            const source = texture.source;
            // A route can unmount while the first frame is loading.
            if (runtime.mounted && source instanceof HTMLVideoElement) {
                video = source;
                video.muted = true;
                video.playsInline = true;
                video.loop = true;
                // Advanced controls operate directly on the public video DOM.
                if (options.advanced && options.guiContainer) {
                    gui = new GUI({ autoPlace: false, container: options.guiContainer, title: "Video texture", width: 200 });
                    gui.add(parameters, "position", 0, video.duration, 0.01).listen().onChange(seek);
                    gui.add(parameters, "speed", 0.25, 2, 0.25);
                    gui.add(parameters, "loop");
                }
                await runtime.start();
                // A route can also unmount during GPU initialization.
                if (isMounted()) {
                    await play();
                }
            } else if (source instanceof HTMLVideoElement) {
                // Release a late network result after its owning preview has gone away.
                source.pause();
                source.removeAttribute("src");
                source.load();
                texture.clearSource();
            }
        } catch (error) {
            // Ignore initialization results belonging to an already removed preview.
            if (runtime.mounted) {
                options.onError(error);
            }
        }
    };
    void initialize();
    /** @example dispose(); @returns No value; stop decoding and release event subscriptions. */
    const dispose = (): void => {
        button.removeEventListener("click", toggle);
        button.remove();
        gui?.destroy();
        // Removing src stops the network/decoder while a paused last frame alone would not.
        if (video !== null) {
            video.pause();
            video.removeAttribute("src");
            video.load();
        }
        texture.clearSource();
        runtime.destroy();
    };
    return dispose;
};
