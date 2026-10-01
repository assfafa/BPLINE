import type { JSX } from "react";
import { NavLink } from "react-router";
import type { MenuSection } from "./section.ts";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import { lineDocumentation, matrixDocumentation } from "@/pages/docs/catalog.ts";
import type { DocumentationItem } from "@/pages/docs/catalog.ts";

interface LeftProps {
    section: MenuSection;
    onNavigate?: () => void;
}

/**
 * Render the second and third level public documentation links.
 * @param items Pages and category labels to show.
 * @param depth Nesting depth below a package heading.
 * @param onNavigate Called after the user selects a page.
 * @example
 * renderDocumentationItems(matrixDocumentation, 0);
 * @returns Sidebar links and labels.
 */
const renderDocumentationItems = (
    items: readonly DocumentationItem[],
    depth: number,
    onNavigate?: () => void,
): JSX.Element[] => {
    const nodes: JSX.Element[] = [];

    // Category headings remain visible but are not clickable without a page.
    for (const item of items) {
        let label: JSX.Element;
        let className = "block px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted aria-[current=page]:bg-muted";
        // Child pages use an indented, quieter style to show the hierarchy.
        if (depth > 0) {
            className = "block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground";
        }

        // Only entries with real routes become links.
        if (item.path) {
            label = (
                <NavLink to={item.path} end onClick={onNavigate} className={className}>
                    {item.label}
                </NavLink>
            );
        } else {
            label = <span className={className}>{item.label}</span>;
        }

        let children: JSX.Element[] = [];
        // Expand public third-level pages beneath their category.
        if (item.children) {
            children = renderDocumentationItems(item.children, depth + 1, onNavigate);
        }

        nodes.push(
            <div key={item.path ?? item.label}>
                {label}
                {children}
            </div>,
        );
    }

    return nodes;
};

/**
 * Show the relevant second and third level routes for the active section.
 * @param props Selected menu group and optional navigation callback.
 * @example
 * <Left section="docs" />
 * @returns Side navigation element.
 */
const Left = ({ section: activeSection, onNavigate }: LeftProps): JSX.Element => {
    const { language } = useLocale();
    // The first catalog entry is the BPLineJS overview, rendered as its package heading.
    const linePages = lineDocumentation.slice(1);
    const packageHeadingClass = "block bg-muted/50 px-4 py-3 text-sm font-bold tracking-wide text-foreground";
    let section: JSX.Element = (
        <>
            <NavLink
                to="/docs/bpline"
                onClick={onNavigate}
                className={packageHeadingClass}
            >
                BPLineJS
            </NavLink>
            {renderDocumentationItems(linePages, 0, onNavigate)}
            <div className="mt-3 border-t border-border pt-3">
                <span className={packageHeadingClass}>
                    BPMatrixJS
                </span>
                {renderDocumentationItems(matrixDocumentation, 0, onNavigate)}
            </div>
        </>
    );

    // The example group is a label because it has no standalone page.
    if (activeSection === "example") {
        section = (
            <>
                <span className="block px-4 py-2 text-sm font-semibold text-foreground">
                    {translator.translate(language, "menu.basicMesh")}
                </span>
                <NavLink
                    to="/example/basic-mesh/rectangle"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.rectangle")}
                </NavLink>
                <NavLink
                    to="/example/basic-mesh/polygon"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.polygon")}
                </NavLink>
                <NavLink
                    to="/example/basic-mesh/ngon"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.ngon")}
                </NavLink>
                <NavLink
                    to="/example/basic-mesh/text"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.text")}
                </NavLink>
                <span className="mt-3 block border-t border-border px-4 py-2 text-sm font-semibold text-foreground">
                    {translator.translate(language, "menu.materials")}
                </span>
                <NavLink
                    to="/example/material/custom"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.customMaterial")}
                </NavLink>
                <span className="mt-3 block border-t border-border px-4 py-2 text-sm font-semibold text-foreground">
                    {translator.translate(language, "menu.instancing")}
                </span>
                <NavLink
                    to="/example/instancing/imesh"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.instance")}
                </NavLink>
                <span className="mt-3 block border-t border-border px-4 py-2 text-sm font-semibold text-foreground">
                    {translator.translate(language, "menu.texture")}
                </span>
                <NavLink
                    to="/example/texture/image"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.imageTexture")}
                </NavLink>
                <span className="mt-3 block border-t border-border px-4 py-2 text-sm font-semibold text-foreground">
                    {translator.translate(language, "menu.controls")}
                </span>
                <NavLink
                    to="/example/control/camera"
                    onClick={onNavigate}
                    className="block py-2 pr-4 pl-8 text-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
                >
                    {translator.translate(language, "menu.cameraControl")}
                </NavLink>
            </>
        );
    }

    return (
        <aside className="h-full w-56 shrink-0 overflow-y-auto border-r border-border bg-background">
            <nav aria-label={translator.translate(language, "menu.navigation")} className="py-3">
                {section}
            </nav>
        </aside>
    );
};

export default Left;
