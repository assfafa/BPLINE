import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Camera reference.
 * @example
 * <BPLineCameraPage />
 * @returns Translated documentation page.
 */
const BPLineCameraPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineCameraPage;
