import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Material/Material reference.
 * @example
 * <BPLineMaterialMaterialPage />
 * @returns Translated documentation page.
 */
const BPLineMaterialMaterialPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineMaterialMaterialPage;
