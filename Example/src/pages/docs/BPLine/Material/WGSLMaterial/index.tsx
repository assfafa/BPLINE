import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the complete WGSL material reference.
 * @example
 * <WGSLMaterialPage />
 * @returns WGSLMaterial API page.
 */
const WGSLMaterialPage = (): JSX.Element => <ReferencePage config={config} />;

export default WGSLMaterialPage;
