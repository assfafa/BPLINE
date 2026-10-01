import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the per-section shader material reference.
 * @example
 * <CompositeMaterialPage />
 * @returns CompositeMaterial API page.
 */
const CompositeMaterialPage = (): JSX.Element => <ReferencePage config={config} />;

export default CompositeMaterialPage;
