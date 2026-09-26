import type { ComponentType, JSX } from "react";
import CodeBlock from "@/components/CodeBlock.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";

interface PreviewProps {
    advanced: boolean;
}

interface ExamplePageProps {
    title: string;
    shortCode: string;
    fullCode: string;
    Preview: ComponentType<PreviewProps>;
}

/**
 * Show source and live previews in two desktop rows or four mobile rows.
 * @param props Translated title, code examples, and preview component.
 * @example
 * <ExamplePage title="Polygon" shortCode={shortCode} fullCode={fullCode} Preview={PolygonPreview} />
 * @returns Four-cell example page.
 */
const ExamplePage = ({ title, shortCode, fullCode, Preview }: ExamplePageProps): JSX.Element => {
    const { language } = useLocale();

    return (
        <article
            aria-label={title}
            className="grid min-h-full grid-cols-1 grid-rows-[repeat(4,18rem)] lg:h-full lg:min-h-0 lg:grid-cols-2 lg:grid-rows-2"
        >
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-r">
                <h2 className="shrink-0 border-b border-border px-4 py-2 text-sm font-semibold">
                    {translator.translate(language, "example.fullCode")}
                </h2>
                <CodeBlock code={fullCode} />
            </section>
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border">
                <h2 className="shrink-0 border-b border-border px-4 py-2 text-sm font-semibold">
                    {translator.translate(language, "example.advancedPreview")}
                </h2>
                <div className="min-h-0 flex-1">
                    <Preview advanced={true} />
                </div>
            </section>
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r">
                <h2 className="shrink-0 border-b border-border px-4 py-2 text-sm font-semibold">
                    {translator.translate(language, "example.simpleCode")}
                </h2>
                <CodeBlock code={shortCode} />
            </section>
            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                <h2 className="shrink-0 border-b border-border px-4 py-2 text-sm font-semibold">
                    {translator.translate(language, "example.simplePreview")}
                </h2>
                <div className="min-h-0 flex-1">
                    <Preview advanced={false} />
                </div>
            </section>
        </article>
    );
};

export default ExamplePage;
