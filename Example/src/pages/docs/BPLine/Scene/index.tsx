import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Scene reference.
 * @example
 * <BPLineScenePage />
 * @returns Translated documentation page.
 */
const BPLineScenePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineScenePage;
