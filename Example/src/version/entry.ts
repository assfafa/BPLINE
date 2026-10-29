import { LoadVersions, VersionURL } from "./navigation.ts";

/** @example await OpenLatest(); @returns Redirect the shared entry while preserving valid bookmarks. */
const OpenLatest = async (): Promise<void> => {
    const current = new URL(window.location.href);
    const root = new URL(".", current);
    try {
        const registry = await LoadVersions(root);
        const destination = await VersionURL(root, registry.latest, current);
        window.location.replace(destination.href);
    } catch {
        const fallback = document.querySelector<HTMLAnchorElement>("a[data-latest]");
        // The generated fallback remains usable even if the registry request fails.
        if (fallback) {
            const destination = new URL(fallback.href);
            // Preserve existing hash bookmarks during a transient registry failure.
            if (current.hash.length > 1) {
                destination.hash = current.hash;
            }
            destination.search = current.search;
            window.location.replace(destination.href);
        }
    }
};

void OpenLatest();
