import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/**
 * Show the QuadTree reference.
 * @example <Page />
 * @returns Localized API reference.
 */
const Page = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default Page;
