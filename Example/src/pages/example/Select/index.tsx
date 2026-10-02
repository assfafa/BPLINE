import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { fullCode, shortCode } from "./config.tsx";
import SelectPreview from "./Preview.tsx";

/**
 * Pair the unified Select API code with click and area-selection previews.
 * @example
 * <SelectPage />
 * @returns Four-cell selection example page.
 */
const SelectPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.selectTitle");
    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={SelectPreview} />;
};

export default SelectPage;
