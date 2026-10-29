import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { useLocale } from "@/locale/context.ts";
import { translator } from "@/locale/index.ts";
import VersionMenu from "./Menu.ts";

/** @example <VersionSwitcher /> @returns The package-configured site version selector. */
const VersionSwitcher = (): JSX.Element => {
    const { language } = useLocale();
    const host = useRef<HTMLDivElement>(null);

    /** @example useEffect(mountMenu, [language]); @returns Selector cleanup for language or route-shell changes. */
    const mountMenu = (): (() => void) | undefined => {
        // React owns the slot while the native selector also works inside historical bundles.
        if (host.current) {
            const menu = new VersionMenu(host.current, {
                version: __SITE_VERSION__,
                matrixVersion: __MATRIX_VERSION__,
                label: translator.translate(language, "top.version"),
                error: translator.translate(language, "top.versionError"),
                development: import.meta.env.DEV,
            });
            /** @example dispose(); @returns No value; detach the previous language's menu. */
            const dispose = (): void => {
                menu.destroy();
            };
            return dispose;
        }
    };
    useEffect(mountMenu, [language]);
    return <div ref={host} />;
};

export default VersionSwitcher;
