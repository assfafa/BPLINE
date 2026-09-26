import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/SolidStyle reference.
 * @example
 * <BPLineStyleSolidStylePage />
 * @returns Translated documentation page.
 */
const BPLineStyleSolidStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStyleSolidStylePage;
