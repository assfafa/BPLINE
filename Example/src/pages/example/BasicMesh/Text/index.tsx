import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import TextPreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair font registration and text geometry code with live previews.
 * @example
 * <TextPage />
 * @returns Four-cell text example page.
 */
const TextPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.textTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={TextPreview} />;
};

export default TextPage;
