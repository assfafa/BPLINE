import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Geometry/Rect2D reference.
 * @example
 * <BPLineGeometryRect2DPage />
 * @returns Translated documentation page.
 */
const BPLineGeometryRect2DPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineGeometryRect2DPage;
