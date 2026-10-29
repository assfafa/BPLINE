import type { JSX } from "react";
import ReferencePage from "@/pages/docs/reference/index.tsx";
import { config } from "./config.tsx";

/** @example <Page /> @returns The bilingual RenderTarget API reference. */
const Page = (): JSX.Element => {
    return <ReferencePage config={config} />;
};

export default Page;
