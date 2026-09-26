import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import InstancePreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full instanced mesh code with live previews.
 * @example
 * <InstancePage />
 * @returns Four-cell example page.
 */
const InstancePage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.instanceTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={InstancePreview} />;
};

export default InstancePage;
