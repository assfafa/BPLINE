import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import PolygonPreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full polygon code with their live previews.
 * @example
 * <PolygonPage />
 * @returns Four-cell polygon example page.
 */
const PolygonPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.polygonTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={PolygonPreview} />;
};

export default PolygonPage;
