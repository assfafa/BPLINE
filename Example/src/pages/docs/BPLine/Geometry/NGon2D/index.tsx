import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Geometry/NGon2D reference.
 * @example
 * <BPLineGeometryNGon2DPage />
 * @returns Translated documentation page.
 */
const BPLineGeometryNGon2DPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineGeometryNGon2DPage;
