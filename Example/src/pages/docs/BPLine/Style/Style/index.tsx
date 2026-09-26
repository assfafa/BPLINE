import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/Style/Style reference.
 * @example
 * <BPLineStyleStylePage />
 * @returns Translated documentation page.
 */
const BPLineStyleStylePage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineStyleStylePage;
