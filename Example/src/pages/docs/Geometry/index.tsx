import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Geometry reference.
 * @example
 * <GeometryPage />
 * @returns Translated documentation page.
 */
const GeometryPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default GeometryPage;
