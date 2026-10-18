import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/** @example <Page /> @returns Localized WASM Boolean API reference. */
const Page = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default Page;
