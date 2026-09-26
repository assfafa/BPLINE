import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/WireframeStyle reference.
 * @example
 * <BPLineStyleWireframeStylePage />
 * @returns Translated documentation page.
 */
const BPLineStyleWireframeStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStyleWireframeStylePage;
