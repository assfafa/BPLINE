import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the unified BPLineJS selection API reference.
 * @example
 * <BPLineSelectPage />
 * @returns Localized selection reference page.
 */
const BPLineSelectPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineSelectPage;
