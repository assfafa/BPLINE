import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import Preview from "./Preview.tsx";
import { shortCode, fullCode } from "./config.tsx";

/** @example <VideoPage /> @returns Complete copyable examples and interactive previews. */
const VideoPage = (): JSX.Element => {
    return <ExamplePage title="Video texture / 视频贴图" shortCode={shortCode} fullCode={fullCode} Preview={Preview} />;
};

export default VideoPage;
