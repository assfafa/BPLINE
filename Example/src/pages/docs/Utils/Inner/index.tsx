import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Utils/Inner reference.
 * @example
 * <UtilsInnerPage />
 * @returns Translated documentation page.
 */
const UtilsInnerPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default UtilsInnerPage;
