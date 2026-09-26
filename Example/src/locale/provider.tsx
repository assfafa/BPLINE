import { useEffect, useState } from "react";
import type { JSX, PropsWithChildren } from "react";
import { LocaleContext } from "./context.ts";
import { translator } from "./index.ts";
import type { Language } from "./index.ts";
import { preferenceKeys, readStoredPreference, writeStoredPreference } from "@/storage/index.ts";

/**
 * Validate a language code stored outside React state.
 * @param value Stored string.
 * @example
 * isStoredLanguage("cn");
 * @returns Whether the value names a supported dictionary.
 */
const isStoredLanguage = (value: string): value is Language => {
    return translator.isLanguage(value);
};

/**
 * Restore a supported language from local storage.
 * @example
 * const language = readInitialLanguage();
 * @returns Saved or default language.
 */
const readInitialLanguage = (): Language => {
    return readStoredPreference(preferenceKeys.language, isStoredLanguage, "en");
};

/**
 * Share the selected language with all routed pages.
 * @param props Provider children.
 * @example
 * <LocaleProvider><App /></LocaleProvider>
 * @returns Locale context provider.
 */
export const LocaleProvider = ({ children }: PropsWithChildren): JSX.Element => {
    const [language, setLanguage] = useState<Language>(readInitialLanguage);

    /**
     * Persist language changes for later visits.
     * @example
     * useEffect(saveLanguage, [language]);
     * @returns No cleanup function.
     */
    const saveLanguage = (): void => {
        writeStoredPreference(preferenceKeys.language, language);
    };

    useEffect(saveLanguage, [language]);

    return (
        <LocaleContext.Provider value={{ language, setLanguage }}>
            {children}
        </LocaleContext.Provider>
    );
};
