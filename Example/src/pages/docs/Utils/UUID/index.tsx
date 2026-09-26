import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public Utils/UUID reference.
 * @example
 * <UtilsUUIDPage />
 * @returns Translated documentation page.
 */
const UtilsUUIDPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default UtilsUUIDPage;
