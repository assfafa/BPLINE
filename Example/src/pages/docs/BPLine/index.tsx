import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine reference.
 * @example
 * <BPLinePage />
 * @returns Translated documentation page.
 */
const BPLinePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLinePage;
