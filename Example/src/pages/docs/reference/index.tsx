import type { JSX } from "react";
import { Link, useLocation } from "react-router";
import CodeBlock from "@/components/CodeBlock.tsx";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import type { ReferenceConfig, ReferenceEntry, ReferenceLink } from "./types.ts";
import { getClassRelations } from "./inheritance.ts";

interface ReferencePageProps {
    config: ReferenceConfig;
}

/**
 * Render a translated API page from a curated public reference.
 * @param props Page content and public API entries.
 * @example
 * <ReferencePage config={config} />
 * @returns Reference article.
 */
const ReferencePage = ({ config }: ReferencePageProps): JSX.Element => {
    const { language } = useLocale();
    const { pathname } = useLocation();
    let detail: JSX.Element | null = null;
    let inheritance: JSX.Element | null = null;
    let example: JSX.Element | null = null;
    let properties: JSX.Element | null = null;
    let methods: JSX.Element | null = null;
    let links: JSX.Element | null = null;

    /**
     * Show a public signature and the explanation for the selected language.
     * @param entry Public API entry.
     * @example
     * config.methods?.map(renderEntry);
     * @returns API entry card.
     */
    const renderEntry = (entry: ReferenceEntry): JSX.Element => {
        return (
            <div key={entry.signature} className="rounded-lg border border-border p-4">
                <code className="block overflow-x-auto text-sm font-semibold">{entry.signature}</code>
                <p className="mt-2 text-sm text-muted-foreground">{entry.description[language]}</p>
            </div>
        );
    };

    /**
     * Link to a related reference page.
     * @param link Related page label and route.
     * @example
     * config.links?.map(renderLink);
     * @returns Local documentation link.
     */
    const renderLink = (link: ReferenceLink): JSX.Element => {
        return (
            <Link key={link.to} to={link.to} className="inline-flex rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                {link.label}
            </Link>
        );
    };

    const relations = getClassRelations(pathname);
    // Show links only when a documented public class has a base or derived class.
    if (relations) {
        let parent: JSX.Element | null = null;
        let children: JSX.Element | null = null;

        // The base class link explains where inherited members are documented.
        if (relations.parent) {
            parent = (
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {translator.translate(language, "docs.referenceExtends")}
                    </span>
                    {renderLink(relations.parent)}
                </div>
            );
        }

        // Derived classes link back to their own focused API pages.
        if (relations.children.length > 0) {
            children = (
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {translator.translate(language, "docs.referenceDerived")}
                    </span>
                    {relations.children.map(renderLink)}
                </div>
            );
        }

        inheritance = (
            <section className="space-y-3 rounded-lg border border-border p-4" aria-label={translator.translate(language, "docs.referenceInheritance")}>
                <h2 className="text-lg font-semibold">{translator.translate(language, "docs.referenceInheritance")}</h2>
                {parent}
                {children}
            </section>
        );
    }

    // Show focused explanations only when the subject needs extra context.
    if (config.detail) {
        detail = <p className="text-sm text-muted-foreground">{config.detail[language]}</p>;
    }

    // Import examples use the same syntax highlighting as the existing Math pages.
    if (config.code) {
        example = (
            <section className="space-y-4" aria-label={translator.translate(language, "docs.referenceExample")}>
                <h2 className="text-xl font-semibold">{translator.translate(language, "docs.referenceExample")}</h2>
                <div className="overflow-hidden rounded-lg border border-border">
                    <CodeBlock code={config.code} />
                </div>
            </section>
        );
    }

    // Internal bookkeeping fields stay outside the public-property list.
    if (config.properties && config.properties.length > 0) {
        properties = (
            <section className="space-y-4" aria-label={translator.translate(language, "docs.referenceProperties")}>
                <h2 className="text-xl font-semibold">{translator.translate(language, "docs.referenceProperties")}</h2>
                <div className="grid gap-3">{config.properties.map(renderEntry)}</div>
            </section>
        );
    }

    // Each method entry describes behavior rather than implementation state.
    if (config.methods && config.methods.length > 0) {
        methods = (
            <section className="space-y-4" aria-label={translator.translate(language, "docs.referenceMethods")}>
                <h2 className="text-xl font-semibold">{translator.translate(language, "docs.referenceMethods")}</h2>
                <div className="grid gap-3">{config.methods.map(renderEntry)}</div>
            </section>
        );
    }

    // Overview pages link directly to their supported subtopics.
    if (config.links && config.links.length > 0) {
        links = (
            <nav aria-label={translator.translate(language, "docs.referenceExplore")} className="flex flex-wrap gap-2">
                {config.links.map(renderLink)}
            </nav>
        );
    }

    return (
        <article className="mx-auto max-w-5xl space-y-8 p-8">
            <h1 className="text-3xl font-semibold">{config.title}</h1>
            <p className="text-muted-foreground">{config.intro[language]}</p>
            {detail}
            {inheritance}
            {example}
            {properties}
            {methods}
            {links}
        </article>
    );
};

export default ReferencePage;
