import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Display the NGonEditTool API reference.
 * @example <Page />
 * @returns Localized API page.
 */
const Page = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default Page;
