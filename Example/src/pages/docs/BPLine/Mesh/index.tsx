import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Mesh reference.
 * @example
 * <BPLineMeshPage />
 * @returns Translated documentation page.
 */
const BPLineMeshPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineMeshPage;
