import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import NGonPreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full ngon code with their live previews.
 * @example
 * <NGonPage />
 * @returns Four-cell ngon example page.
 */
const NGonPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.ngonTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={NGonPreview} />;
};

export default NGonPage;
