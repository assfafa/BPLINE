import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Raws reference.
 * @example
 * <BPLineRawsPage />
 * @returns Translated documentation page.
 */
const BPLineRawsPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineRawsPage;
