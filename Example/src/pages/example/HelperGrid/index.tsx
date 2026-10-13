import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { fullCode, shortCode } from "./config.tsx";
import Preview from "./Preview.tsx";

/**
 * Pair live HelperGrid previews with their actual source.
 * @example <Page />
 * @returns Simple and complete example page.
 */
const Page = (): JSX.Element => {
    const { language } = useLocale();
    return <ExamplePage title={translator.translate(language, "example.helperGridTitle")} shortCode={shortCode} fullCode={fullCode} Preview={Preview} />;
};

export default Page;
