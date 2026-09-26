import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Texture reference.
 * @example
 * <BPLineTexturePage />
 * @returns Translated documentation page.
 */
const BPLineTexturePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineTexturePage;
