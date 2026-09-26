import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the public BPLine/IMesh reference.
 * @example
 * <BPLineIMeshPage />
 * @returns Translated documentation page.
 */
const BPLineIMeshPage = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default BPLineIMeshPage;
