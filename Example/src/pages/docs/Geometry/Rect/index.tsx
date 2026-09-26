import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Geometry/Rect reference.
 * @example
 * <GeometryRectPage />
 * @returns Translated documentation page.
 */
const GeometryRectPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default GeometryRectPage;
