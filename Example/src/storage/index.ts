/** Keys are shared by preference readers and writers. */
export const preferenceKeys = {
    language: "bpline.example.language",
    theme: "bpline.example.theme",
} as const;

/**
 * Read and validate one persistent preference, falling back when storage is unavailable.
 * @param key Stable local storage key.
 * @param isValid Validator for the stored string.
 * @param fallback Value used for missing or invalid data.
 * @example
 * const theme = readStoredPreference(preferenceKeys.theme, isTheme, "light");
 * @returns Valid stored value or the fallback.
 */
export const readStoredPreference = <Value extends string>(
    key: string,
    isValid: (value: string) => value is Value,
    fallback: Value,
): Value => {
    try {
        const storedValue = window.localStorage.getItem(key);

        // Saved values may belong to an older version of the application.
        if (storedValue !== null && isValid(storedValue)) {
            return storedValue;
        } else {
            return fallback;
        }
    } catch {
        // Private browsing or storage policy can deny access.
        return fallback;
    }
};

/**
 * Save a preference while allowing the application to work without storage access.
 * @param key Stable local storage key.
 * @param value Current preference value.
 * @example
 * writeStoredPreference(preferenceKeys.theme, "dark");
 * @returns No value.
 */
export const writeStoredPreference = (key: string, value: string): void => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // The in-memory React state remains usable when persistence is denied.
    }
};
