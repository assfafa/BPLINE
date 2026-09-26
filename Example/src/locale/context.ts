import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Language } from "./index.ts";

export interface LocaleContextValue {
    language: Language;
    setLanguage: Dispatch<SetStateAction<Language>>;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Access the current language and the setter that refreshes React consumers.
 * @example
 * const { language, setLanguage } = useLocale();
 * @returns Current locale context.
 */
export const useLocale = (): LocaleContextValue => {
    const context = useContext(LocaleContext);
    let locale: LocaleContextValue;

    // A missing provider would leave the menu and future pages out of sync.
    if (context) {
        locale = context;
    } else {
        throw new Error("useLocale requires LocaleProvider.");
    }

    return locale;
};
