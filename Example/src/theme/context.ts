import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
    theme: Theme;
    setTheme: Dispatch<SetStateAction<Theme>>;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Read the active color scheme and its setter.
 * @example
 * const { theme, setTheme } = useTheme();
 * @returns Shared theme state.
 */
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    let result: ThemeContextValue;

    // The provider controls both the page palette and the code theme.
    if (context) {
        result = context;
    } else {
        throw new Error("useTheme requires ThemeProvider.");
    }

    return result;
};
