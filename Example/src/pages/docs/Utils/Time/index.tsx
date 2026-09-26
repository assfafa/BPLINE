import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Utils/Time reference.
 * @example
 * <UtilsTimePage />
 * @returns Translated documentation page.
 */
const UtilsTimePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default UtilsTimePage;
