import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import RectanglePreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full rectangle code with their live previews.
 * @example
 * <RectanglePage />
 * @returns Four-cell rectangle example page.
 */
const RectanglePage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.rectangleTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={RectanglePreview} />;
};

export default RectanglePage;
