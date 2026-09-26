import { useState } from "react";
import type { JSX } from "react";
import { Outlet, useLocation } from "react-router";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import Left from "./left.tsx";
import { sectionFromPath } from "./section.ts";
import type { MenuSection } from "./section.ts";
import Top from "./top.tsx";

interface SectionSelection {
    pathname: string;
    section: MenuSection;
}

/**
 * Place routed content beside the selected side menu under the top menu.
 * @example
 * <Menu />
 * @returns Application shell.
 */
const Menu = (): JSX.Element => {
    const { language } = useLocale();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selection, setSelection] = useState<SectionSelection | null>(null);
    let activeSection = sectionFromPath(location.pathname);
    let mobileSidebar: JSX.Element | null = null;

    // A top-menu choice applies to the current page without changing its URL.
    if (selection?.pathname === location.pathname) {
        activeSection = selection.section;
    }

    /**
     * Toggle the floating navigation on narrow screens.
     * @example
     * <Top onToggleSidebar={toggleSidebar} />
     * @returns No value.
     */
    const toggleSidebar = (): void => {
        // The same button opens and closes the mobile drawer.
        if (sidebarOpen) {
            setSidebarOpen(false);
        } else {
            setSidebarOpen(true);
        }
    };

    /**
     * Close the floating navigation after a backdrop click.
     * @example
     * <button onClick={closeSidebar} />
     * @returns No value.
     */
    const closeSidebar = (): void => {
        setSidebarOpen(false);
    };

    /**
     * Show document links and open the narrow-screen drawer without changing pages.
     * @example
     * <Top onShowDocs={showDocs} />
     * @returns No value.
     */
    const showDocs = (): void => {
        setSelection({ pathname: location.pathname, section: "docs" });
        // Top-level choices reveal their links on narrow screens.
        if (window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(true);
        }
    };

    /**
     * Show example links and open the narrow-screen drawer without changing pages.
     * @example
     * <Top onShowExample={showExample} />
     * @returns No value.
     */
    const showExample = (): void => {
        setSelection({ pathname: location.pathname, section: "example" });
        // Keep the drawer open when switching between top-level choices.
        if (window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(true);
        }
    };

    /**
     * Let a page link navigate and close the floating menu.
     * @example
     * <Left section="docs" onNavigate={navigateFromLeft} />
     * @returns No value.
     */
    const navigateFromLeft = (): void => {
        // Preserve the selected group until the new pathname takes effect.
        setSidebarOpen(false);
    };

    // Keep closed mobile links outside the focus order and accessibility tree.
    if (sidebarOpen) {
        mobileSidebar = (
            <>
                <button
                    type="button"
                    aria-label={translator.translate(language, "menu.close")}
                    onClick={closeSidebar}
                    className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/40 md:hidden"
                />
                <div id="mobile-sidebar" className="fixed bottom-0 left-0 top-14 z-40 w-56 shadow-xl md:hidden">
                    <Left section={activeSection} onNavigate={navigateFromLeft} />
                </div>
            </>
        );
    }

    return (
        <div className="flex h-dvh min-h-0 flex-col bg-background text-foreground">
            <Top
                selectedSection={activeSection}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={toggleSidebar}
                onShowDocs={showDocs}
                onShowExample={showExample}
            />
            <div className="flex min-h-0 flex-1">
                <div className="hidden h-full md:block">
                    <Left section={activeSection} onNavigate={navigateFromLeft} />
                </div>
                {mobileSidebar}
                <main className="min-h-0 min-w-0 flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Menu;
