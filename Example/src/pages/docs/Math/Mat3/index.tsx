import type { JSX } from "react";
import { Mat3 } from "bpmatrixjs/Math/Mat3";
import { Vec2 } from "bpmatrixjs/Math/Vec2";
import CodeBlock from "@/components/CodeBlock.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { mat3Code, methods } from "./config.tsx";
import type { ApiEntry } from "./config.tsx";

/**
 * Round floating-point output for the transform example.
 * @param value Computed coordinate.
 * @example
 * formatCoordinate(9.0000000001);
 * @returns Coordinate rounded to two decimal places.
 */
const formatCoordinate = (value: number): number => {
    return Number(value.toFixed(2));
};

/**
 * Document the user-facing Mat3 API with a live 2D transform.
 * @example
 * <Mat3Page />
 * @returns Mat3 API page.
 */
const Mat3Page = (): JSX.Element => {
    const { language } = useLocale();
    const transform = new Mat3();
    transform.setTranslate(new Vec2(12, 8));
    transform.setRotation(Math.PI / 2);
    transform.setScale(new Vec2(2, 3));
    const transformed = new Vec2(2, 1).apply(transform);
    const restored = transformed.clone().apply(transform.clone().invert());

    /**
     * Render a Mat3 operation and its localized explanation.
     * @param entry Public operation description.
     * @example
     * methods.map(renderApiEntry);
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
            <h1 className="text-3xl font-semibold">{translator.translate(language, "docs.mat3Title")}</h1>
            <p className="text-muted-foreground">{translator.translate(language, "docs.mat3Intro")}</p>
            <p className="text-sm text-muted-foreground">{translator.translate(language, "docs.mat3Layout")}</p>
            <section className="space-y-4" aria-labelledby="mat3-example">
                <h2 id="mat3-example" className="text-xl font-semibold">{translator.translate(language, "docs.mat3Example")}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border p-4">
                        <div className="text-sm text-muted-foreground">{translator.translate(language, "docs.mat3Point")}</div>
                        <strong className="mt-2 block text-2xl">({formatCoordinate(transformed.x)}, {formatCoordinate(transformed.y)})</strong>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                        <div className="text-sm text-muted-foreground">{translator.translate(language, "docs.mat3Restored")}</div>
                        <strong className="mt-2 block text-2xl">({formatCoordinate(restored.x)}, {formatCoordinate(restored.y)})</strong>
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
                    <CodeBlock code={mat3Code} />
                </div>
            </section>
            <section className="space-y-4" aria-labelledby="mat3-methods">
                <h2 id="mat3-methods" className="text-xl font-semibold">{translator.translate(language, "docs.mat3Methods")}</h2>
                <p className="text-sm text-muted-foreground">{translator.translate(language, "docs.mat3Order")}</p>
                <div className="grid gap-3">
                    {methods.map(renderApiEntry)}
                </div>
            </section>
        </article>
    );
};

export default Mat3Page;
