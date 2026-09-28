import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the BPLineJS font registry API.
 * @example
 * <FontPage />
 * @returns Translated font reference page.
 */
const FontPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default FontPage;
