import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Geometry/NGon reference.
 * @example
 * <GeometryNGonPage />
 * @returns Translated documentation page.
 */
const GeometryNGonPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default GeometryNGonPage;
