import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Utils reference.
 * @example
 * <UtilsPage />
 * @returns Translated documentation page.
 */
const UtilsPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default UtilsPage;
