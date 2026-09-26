import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import TexturePreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full texture code with live previews.
 * @example
 * <TexturePage />
 * @returns Four-cell example page.
 */
const TexturePage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.textureTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={TexturePreview} />;
};

export default TexturePage;
