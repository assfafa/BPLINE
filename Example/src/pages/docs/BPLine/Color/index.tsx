import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Color reference.
 * @example
 * <BPLineColorPage />
 * @returns Translated documentation page.
 */
const BPLineColorPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineColorPage;
