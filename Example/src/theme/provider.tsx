import { useEffect, useState } from "react";
import type { JSX, PropsWithChildren } from "react";
import { ThemeContext } from "./context.ts";
import type { Theme } from "./context.ts";
import { preferenceKeys, readStoredPreference, writeStoredPreference } from "@/storage/index.ts";

/**
 * Validate a stored theme value before using it.
 * @param value Stored string.
 * @example
 * isTheme("dark");
 * @returns Whether the value is a supported theme.
 */
const isTheme = (value: string): value is Theme => {
    return value === "light" || value === "dark";
};

/**
 * Restore a valid theme from local storage.
 * @example
 * const theme = readInitialTheme();
 * @returns Saved or default theme.
 */
const readInitialTheme = (): Theme => {
    return readStoredPreference(preferenceKeys.theme, isTheme, "light");
};

/**
 * Apply the chosen scheme to the document and share it with routed pages.
 * @param props Provider children.
 * @example
 * <ThemeProvider><App /></ThemeProvider>
 * @returns Theme context provider.
 */
export const ThemeProvider = ({ children }: PropsWithChildren): JSX.Element => {
    const [theme, setTheme] = useState<Theme>(readInitialTheme);

    /**
     * Keep Tailwind's dark selector and native controls in the same scheme.
     * @example
     * useEffect(applyTheme, [theme]);
     * @returns No cleanup function.
     */
    const applyTheme = (): void => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        writeStoredPreference(preferenceKeys.theme, theme);
    };

    useEffect(applyTheme, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
