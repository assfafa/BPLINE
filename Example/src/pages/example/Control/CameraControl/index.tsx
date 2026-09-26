import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import ExamplePage from "@/pages/example/reference/ExamplePage.tsx";
import CameraControlPreview from "./Preview.tsx";
import { fullCode, shortCode } from "./config.tsx";

/**
 * Pair short and full camera control code with live previews.
 * @example
 * <CameraControlPage />
 * @returns Four-cell example page.
 */
const CameraControlPage = (): JSX.Element => {
    const { language } = useLocale();
    const title = translator.translate(language, "example.controlTitle");

    return <ExamplePage title={title} shortCode={shortCode} fullCode={fullCode} Preview={CameraControlPreview} />;
};

export default CameraControlPage;
