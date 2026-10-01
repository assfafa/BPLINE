import type { JSX } from "react";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import CustomMaterialPreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair custom shader source with its live simple and full scenes.
 * @example
 * <CustomMaterialPage />
 * @returns Four-cell custom material example page.
 */
const CustomMaterialPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.customMaterialTitle");
    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={CustomMaterialPreview} />;
};

export default CustomMaterialPage;
