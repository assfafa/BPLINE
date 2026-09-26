import { cn } from "./cn.ts";
import { en } from "./en.ts";

const dictionaries = { cn, en };

export type Language = keyof typeof dictionaries;

type LeafPaths<Tree> = {
    [Key in keyof Tree & string]: Tree[Key] extends string
        ? Key
        : Tree[Key] extends object
            ? `${Key}.${LeafPaths<Tree[Key]>}`
            : never;
}[keyof Tree & string];

export type TranslationKey = LeafPaths<typeof cn>;

/** Names shown in the language selector; adding a dictionary requires a name. */
export const languageNames: Record<Language, string> = {
    cn: "中文",
    en: "English",
};

/** Resolve typed message paths from the selected dictionary. */
export class Translator {
    /**
     * Check a value from the language selector against available dictionaries.
     * @param value Candidate language code.
     * @example
     * translator.isLanguage("cn");
     * @returns Whether the language has a dictionary.
     */
    public isLanguage(value: string): value is Language {
        return Object.hasOwn(dictionaries, value);
    }

    /**
     * Read a message from any dictionary group or nested group.
     * @param language Active language.
     * @param key Dot-separated message path.
     * @example
     * translator.translate("cn", "top.docs");
     * @returns Translated message.
     */
    public translate(language: Language, key: TranslationKey): string {
        let value: unknown = dictionaries[language];

        // Traverse each dictionary group so new nested groups need no new methods.
        for (const segment of key.split(".")) {
            // A typed key should always exist in both dictionaries; fail clearly if data is malformed.
            if (typeof value === "object" && value !== null && segment in value) {
                value = (value as Record<string, unknown>)[segment];
            } else {
                throw new Error(`Missing translation: ${language}.${key}`);
            }
        }

        // Only string leaves are valid translations.
        if (typeof value === "string") {
            return value;
        } else {
            throw new Error(`Translation is not text: ${language}.${key}`);
        }
    }
}

export const translator = new Translator();
