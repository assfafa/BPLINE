import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Control/CameraControl reference.
 * @example
 * <BPLineControlCameraControlPage />
 * @returns Translated documentation page.
 */
const BPLineControlCameraControlPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineControlCameraControlPage;
