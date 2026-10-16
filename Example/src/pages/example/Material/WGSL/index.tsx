import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import Preview from "./Preview.tsx";
import { shortCode, fullCode } from "./config.tsx";

/** @example <WgslPage /> @returns Complete copyable examples and interactive previews. */
const WgslPage = (): JSX.Element => {
    return <ExamplePage title="WGSLMaterial" shortCode={shortCode} fullCode={fullCode} Preview={Preview} />;
};

export default WgslPage;
