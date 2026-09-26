import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/EdgeStyle reference.
 * @example
 * <BPLineStyleEdgeStylePage />
 * @returns Translated documentation page.
 */
const BPLineStyleEdgeStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStyleEdgeStylePage;
