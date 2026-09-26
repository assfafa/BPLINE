import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Render reference.
 * @example
 * <BPLineRenderPage />
 * @returns Translated documentation page.
 */
const BPLineRenderPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineRenderPage;
