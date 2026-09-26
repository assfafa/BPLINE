import type { JSX } from "react";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import CodeBlock from "@/components/CodeBlock.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { methods, properties, vec2Code } from "./config.tsx";
import type { ApiEntry } from "./config.tsx";

/**
 * Document every public Vec2 member and show live arithmetic.
 * @example
 * <Vec2Page />
 * @returns Vec2 API page.
 */
const Vec2Page = (): JSX.Element => {
    const { language } = useLocale();
    const vector = new Vec2(3, 4);
    const length = vector.len();
    vector.add(new Vec2(2, 1));

    /**
     * Render one public API signature and its localized explanation.
     * @param entry Public member description.
     * @example
     * properties.map(renderApiEntry);
     * @returns API entry card.
     */
    const renderApiEntry = (entry: ApiEntry): JSX.Element => {
        return (
            <div key={entry.name} className="rounded-lg border border-border p-4">
                <code className="block overflow-x-auto text-sm font-semibold">{entry.signature}</code>
                <p className="mt-2 text-sm text-muted-foreground">{translator.translate(language, entry.description)}</p>
            </div>
        );
    };

    return (
        <article className="mx-auto max-w-5xl space-y-8 p-8">
            <h1 className="text-3xl font-semibold">{translator.translate(language, "docs.vec2Title")}</h1>
            <p className="text-muted-foreground">{translator.translate(language, "docs.vec2Intro")}</p>
            <p className="text-sm text-muted-foreground">{translator.translate(language, "docs.vec2Mutation")}</p>
            <h2 className="text-xl font-semibold">{translator.translate(language, "docs.vec2Example")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{translator.translate(language, "docs.vec2Result")}</div>
                    <strong className="mt-2 block text-2xl">{length}</strong>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{translator.translate(language, "docs.vec2Sum")}</div>
                    <strong className="mt-2 block text-2xl">({vector.x}, {vector.y})</strong>
                </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
                <CodeBlock code={vec2Code} />
            </div>
            <section className="space-y-4" aria-labelledby="vec2-properties">
                <h2 id="vec2-properties" className="text-xl font-semibold">{translator.translate(language, "docs.vec2Properties")}</h2>
                <div className="grid gap-3">
                    {properties.map(renderApiEntry)}
                </div>
            </section>
            <section className="space-y-4" aria-labelledby="vec2-methods">
                <h2 id="vec2-methods" className="text-xl font-semibold">{translator.translate(language, "docs.vec2Methods")}</h2>
                <div className="grid gap-3">
                    {methods.map(renderApiEntry)}
                </div>
            </section>
        </article>
    );
};

export default Vec2Page;
