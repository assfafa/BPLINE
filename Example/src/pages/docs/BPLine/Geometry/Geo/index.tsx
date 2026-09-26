import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Geometry/Geo reference.
 * @example
 * <BPLineGeometryGeoPage />
 * @returns Translated documentation page.
 */
const BPLineGeometryGeoPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineGeometryGeoPage;
