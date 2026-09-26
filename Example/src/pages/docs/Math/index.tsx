import type { JSX } from "react";
import { Link } from "react-router";
import CodeBlock from "@/components/CodeBlock.tsx";
import { mathImportCode } from "./config.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";

/**
 * Introduce the math section before individual API pages.
 * @example
 * <MathPage />
 * @returns Math overview page.
 */
const MathPage = (): JSX.Element => {
    const { language } = useLocale();

    return (
        <article className="mx-auto max-w-4xl space-y-6 p-8">
            <h1 className="text-3xl font-semibold">{translator.translate(language, "docs.mathTitle")}</h1>
            <p className="text-muted-foreground">{translator.translate(language, "docs.mathIntro")}</p>
            <div className="overflow-hidden rounded-lg border border-border">
                <CodeBlock code={mathImportCode} />
            </div>
            <Link to="/docs/math/vec2" className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                {translator.translate(language, "menu.vec2")}
            </Link>
            <Link to="/docs/math/mat3" className="ml-2 inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                {translator.translate(language, "menu.mat3")}
            </Link>
        </article>
    );
};

export default MathPage;
