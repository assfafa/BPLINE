import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the direct-vertex geometry reference.
 * @example
 * <Base2DPage />
 * @returns Base2D API page.
 */
const Base2DPage = (): JSX.Element => <ReferencePage config={config} />;

export default Base2DPage;
