import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Geometry/Poly reference.
 * @example
 * <GeometryPolyPage />
 * @returns Translated documentation page.
 */
const GeometryPolyPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default GeometryPolyPage;
