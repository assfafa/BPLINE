import type { Language } from "@/locale/index.ts";

export type LocalizedText = Record<Language, string>;

export interface ReferenceEntry {
    signature: string;
    description: LocalizedText;
}

export interface ReferenceLink {
    label: string;
    to: string;
}

export interface ReferenceConfig {
    title: string;
    intro: LocalizedText;
    detail?: LocalizedText;
    code?: string;
    properties?: ReferenceEntry[];
    methods?: ReferenceEntry[];
    links?: ReferenceLink[];
}

/**
 * Keep a public signature and its two concise explanations together.
 * @param signature Public TypeScript signature.
 * @param cn Chinese explanation.
 * @param en English explanation.
 * @example
 * entry("len(): number", "返回长度。", "Return length.");
 * @returns Localized reference entry.
 */
export const entry = (signature: string, cn: string, en: string): ReferenceEntry => {
    return { signature, description: { cn, en } };
};
