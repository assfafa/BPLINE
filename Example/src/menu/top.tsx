import { useRef } from "react";
import type { JSX } from "react";
import { Cancel01Icon, LanguagesIcon, Menu01Icon, MoonIcon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MenuSection } from "./section.ts";
import { useLocale } from "@/locale/context.ts";
import { languageNames, translator } from "@/locale/index.ts";
import { useTheme } from "@/theme/context.ts";

interface TopProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    selectedSection: MenuSection;
    onShowDocs: () => void;
    onShowExample: () => void;
}

/**
 * Render section selectors, the language menu, and the theme switch.
 * @param props Selected section and mobile side menu actions.
 * @example
 * <Top sidebarOpen={false} onToggleSidebar={toggleSidebar} selectedSection="docs" onShowDocs={showDocs} onShowExample={showExample} />
 * @returns Top navigation element.
 */
const Top = ({ sidebarOpen, onToggleSidebar, selectedSection, onShowDocs, onShowExample }: TopProps): JSX.Element => {
    const { language, setLanguage } = useLocale();
    const { theme, setTheme } = useTheme();
    const languageMenu = useRef<HTMLDetailsElement>(null);
    let sidebarIcon = Menu01Icon;
    let sidebarLabel = translator.translate(language, "menu.open");
    let themeIcon = MoonIcon;
    let themeLabel = translator.translate(language, "top.darkMode");

    // Announce whether the mobile menu button will open or close the drawer.
    if (sidebarOpen) {
        sidebarIcon = Cancel01Icon;
        sidebarLabel = translator.translate(language, "menu.close");
    }

    // The button shows the scheme it will activate next.
    if (theme === "dark") {
        themeIcon = Sun01Icon;
        themeLabel = translator.translate(language, "top.lightMode");
    }

    /**
     * Switch between the two document color schemes.
     * @example
     * <button onClick={toggleTheme} />
     * @returns No value.
     */
    const toggleTheme = (): void => {
        // Theme state is shared so the page and highlighted code change together.
        if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    };

    /**
     * Render a dictionary-backed language option.
     * @param entry Language code and its display name.
     * @example
     * renderLanguageOption(["en", "English"]);
     * @returns Language selection button.
     */
    const renderLanguageOption = (entry: [string, string]): JSX.Element => {
        const [code, name] = entry;

        /**
         * Update the language and close the icon menu.
         * @example
         * <button onClick={selectLanguage} />
         * @returns No value.
         */
        const selectLanguage = (): void => {
            // The list comes from languageNames, but validate before updating context.
            if (translator.isLanguage(code)) {
                setLanguage(code);
                // Close the menu after a successful selection.
                if (languageMenu.current) {
                    languageMenu.current.open = false;
                }
            }
        };

        return (
            <button
                key={code}
                type="button"
                aria-label={name}
                aria-pressed={language === code}
                onClick={selectLanguage}
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted aria-pressed:bg-muted"
            >
                {name}
            </button>
        );
    };

    return (
        <header className="h-14 border-b border-border bg-background">
            <nav
                aria-label={translator.translate(language, "top.navigation")}
                className="flex h-full w-full items-stretch"
            >
                <button
                    type="button"
                    aria-label={sidebarLabel}
                    aria-expanded={sidebarOpen}
                    aria-controls="mobile-sidebar"
                    onClick={onToggleSidebar}
                    className="flex w-12 shrink-0 items-center justify-center hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring md:hidden"
                >
                    <HugeiconsIcon icon={sidebarIcon} className="size-5" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    aria-pressed={selectedSection === "docs"}
                    onClick={onShowDocs}
                    className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"
                >
                    {translator.translate(language, "top.docs")}
                </button>
                <button
                    type="button"
                    aria-pressed={selectedSection === "example"}
                    onClick={onShowExample}
                    className="inline-flex items-center px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-muted aria-pressed:text-foreground"
                >
                    {translator.translate(language, "top.example")}
                </button>
                <div className="ml-auto flex items-stretch">
                    <details ref={languageMenu} className="relative">
                        <summary
                            aria-label={translator.translate(language, "top.language")}
                            className="flex h-full w-12 cursor-pointer list-none items-center justify-center hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
                        >
                            <HugeiconsIcon icon={LanguagesIcon} className="size-5" aria-hidden="true" />
                        </summary>
                        <div className="absolute right-0 z-30 mt-1 min-w-32 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                            {Object.entries(languageNames).map(renderLanguageOption)}
                        </div>
                    </details>
                    <button
                        type="button"
                        aria-label={themeLabel}
                        title={themeLabel}
                        onClick={toggleTheme}
                        className="flex w-12 items-center justify-center hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                        <HugeiconsIcon icon={themeIcon} className="size-5" aria-hidden="true" />
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Top;
