/** A published site snapshot, identified by the renderer package version. */
export interface SiteVersion {
    version: string;
    matrixVersion: string;
}

export interface SiteVersions {
    latest: string;
    versions: SiteVersion[];
}

/** @param value Candidate directory name. @example IsVersion("0.1.104"); @returns Whether it is a pinned, safe package version. */
export const IsVersion = (value: unknown): value is string => {
    return typeof value === "string" && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
};

/** @param page Current page URL. @param version Current snapshot version. @example SiteRoot(new URL(location.href), "0.1.104"); @returns The shared directory containing all version roots. */
export const SiteRoot = (page: URL, version: string): URL => {
    const directory = new URL(".", page);
    // Published pages live one directory below the shared entry; development remains at its root.
    if (directory.pathname.endsWith(`/${version}/`)) {
        return new URL("../", directory);
    } else {
        return directory;
    }
};

/** @param root Shared site directory. @param signal Optional lifetime cancellation. @example await LoadVersions(root); @returns Validated snapshot choices and latest version. */
export const LoadVersions = async (root: URL, signal?: AbortSignal): Promise<SiteVersions> => {
    const response = await fetch(new URL("versions.json", root), { cache: "no-cache", signal });
    // A missing registry must not be mistaken for a valid empty version list.
    if (response.ok) {
        const data: unknown = await response.json();
        // Validate fetched JSON before using it to build navigation destinations.
        if (typeof data === "object" && data !== null) {
            const record = data as Record<string, unknown>;
            // Only registered version directories may be selected.
            if (IsVersion(record.latest) && Array.isArray(record.versions)) {
                const versions: SiteVersion[] = [];
                // Ignore malformed entries without allowing arbitrary URL paths.
                for (const value of record.versions as unknown[]) {
                    // Version records carry the two package versions for this snapshot.
                    if (typeof value === "object" && value !== null) {
                        const item = value as Record<string, unknown>;
                        // Only exact package versions participate in navigation.
                        if (IsVersion(item.version) && IsVersion(item.matrixVersion)) {
                            versions.push({ version: item.version, matrixVersion: item.matrixVersion });
                        }
                    }
                }
                /** @param item Registered snapshot. @example versions.some(IsLatest); @returns Whether it matches the declared latest version. */
                const IsLatest = (item: SiteVersion): boolean => {
                    return item.version === record.latest;
                };
                // The latest entry must also exist in the validated list.
                if (versions.some(IsLatest)) {
                    return { latest: record.latest, versions };
                }
            }
        }
        throw new TypeError("Invalid site version registry.");
    } else {
        throw new Error("Unable to load site versions.");
    }
};

/** @param root Shared site directory. @param version Destination version. @param current Current route and query. @param signal Optional lifetime cancellation. @example await VersionURL(root, "0.1.103", new URL(location.href)); @returns A destination retaining supported routes and falling back within the same section. */
export const VersionURL = async (root: URL, version: string, current: URL, signal?: AbortSignal): Promise<URL> => {
    // Validate before interpolating the directory name into a URL.
    if (IsVersion(version)) {
        const destination = new URL(`${version}/`, root);
        const response = await fetch(new URL("site.json", destination), { signal });
        // Snapshot metadata describes only routes that actually existed in that version.
        if (response.ok) {
            const data: unknown = await response.json();
            // A mismatch must not navigate to an unrelated or partially deployed snapshot.
            if (typeof data === "object" && data !== null) {
                const record = data as Record<string, unknown>;
                // Routes are used as an allowlist for old versions missing newer examples.
                if (record.version === version && Array.isArray(record.routes)) {
                    const hash = current.hash.slice(1);
                    const route = hash.split(/[?]/, 1)[0];
                    destination.search = current.search;
                    // Retain a deep link when it exists in both versions.
                    if (record.routes.includes(route)) {
                        destination.hash = hash;
                    } else if (route.startsWith("/example")) {
                        // Keep visitors in the example section when a newer page did not exist yet.
                        destination.hash = "/example/basic-mesh/rectangle";
                    } else {
                        destination.hash = "/docs/bpline";
                    }
                    return destination;
                }
            }
        }
        throw new Error("Unable to load the selected site version.");
    } else {
        throw new TypeError("Invalid site version.");
    }
};
