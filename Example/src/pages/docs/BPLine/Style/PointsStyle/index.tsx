import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/PointsStyle reference.
 * @example
 * <BPLineStylePointsStylePage />
 * @returns Translated documentation page.
 */
const BPLineStylePointsStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStylePointsStylePage;
