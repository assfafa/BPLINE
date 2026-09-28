import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the BPLineJS text geometry API.
 * @example
 * <LineTextPage />
 * @returns Translated text reference page.
 */
const LineTextPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default LineTextPage;
