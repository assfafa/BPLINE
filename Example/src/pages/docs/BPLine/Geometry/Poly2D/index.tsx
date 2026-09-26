import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Geometry/Poly2D reference.
 * @example
 * <BPLineGeometryPoly2DPage />
 * @returns Translated documentation page.
 */
const BPLineGeometryPoly2DPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineGeometryPoly2DPage;
