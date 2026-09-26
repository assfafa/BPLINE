import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Material/BaseMaterial reference.
 * @example
 * <BPLineMaterialBaseMaterialPage />
 * @returns Translated documentation page.
 */
const BPLineMaterialBaseMaterialPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineMaterialBaseMaterialPage;
