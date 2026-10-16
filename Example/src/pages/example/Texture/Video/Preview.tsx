import type { JSX } from "react";
import ShapePreview from "@/pages/example/reference/ShapePreview.tsx";
import { mountVideoScene } from "./scene.ts";

/** @param props Preview mode @example <VideoPreview advanced /> @returns Interactive preview. */
const VideoPreview = ({ advanced }: { advanced: boolean }): JSX.Element => {
    return <div className="relative h-full">
        <ShapePreview advanced={advanced} controlsId="video-controls" mountScene={mountVideoScene} />
        <a href="https://peach.blender.org/about/" target="_blank" rel="noreferrer" className="absolute bottom-1 right-2 z-20 rounded bg-background/90 px-1 text-[10px] text-muted-foreground">
            Big Buck Bunny © 2008 Blender Foundation · CC BY 3.0 · 10s excerpt
        </a>
    </div>;
};

export default VideoPreview;
