import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/JoinStyle reference.
 * @example
 * <BPLineStyleJoinStylePage />
 * @returns Translated documentation page.
 */
const BPLineStyleJoinStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStyleJoinStylePage;
