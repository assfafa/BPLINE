import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const exampleRoot: string = dirname(dirname(fileURLToPath(import.meta.url)));
export const repositoryRoot: string = dirname(exampleRoot);
export const siteRoot: string = join(repositoryRoot, "docs");
export const versionPattern: RegExp = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** @param source Package JSON text. @example ReadVersions(readFileSync(path, "utf8")); @returns Exact renderer and matrix versions, never a semver range. */
export const ReadVersions = (source: string): PackageVersions => {
    const data = JSON.parse(source) as { dependencies: Record<string, string> };
    const version = data.dependencies.bplinejs;
    const matrixVersion = data.dependencies.bpmatrixjs;
    // A label must identify the installed implementation, not a floating dependency range.
    if (versionPattern.test(version) && versionPattern.test(matrixVersion)) {
        return { version, matrixVersion };
    } else {
        throw new TypeError("Pin bplinejs and bpmatrixjs to exact versions before building the site.");
    }
};

/** @param sources Router and documentation catalog source text. @example CollectRoutes([router, catalog]); @returns The real hash routes available in one historical or current snapshot. */
export const CollectRoutes = (sources: string[]): string[] => {
    const routes = new Set<string>(["/", "/docs", "/example"]);
    // Parse the source tree so formatting changes do not affect the route allowlist.
    for (const source of sources) {
        const tree = ts.createSourceFile("routes.ts", source, ts.ScriptTarget.Latest, true);
        /** @param node Current syntax node. @example Visit(tree); @returns No value; collect literal router paths and catalog page paths. */
        const Visit = (node: ts.Node): void => {
            // Router paths are literal properties; redirects count as supported bookmarks too.
            if (ts.isPropertyAssignment(node) && node.name.getText(tree) === "path" && ts.isStringLiteral(node.initializer)) {
                routes.add("/" + node.initializer.text.replace(/^\//, ""));
            }
            // Documentation page helpers receive their public path as the second argument.
            if (ts.isCallExpression(node) && node.expression.getText(tree) === "page") {
                const path = node.arguments.at(1);
                // Categories without real destinations are excluded from the metadata.
                if (path && ts.isStringLiteral(path)) {
                    routes.add(path.text);
                }
            }
            ts.forEachChild(node, Visit);
        };
        Visit(tree);
    }
    return Array.from(routes).sort();
};

/** @param directory Snapshot directory. @param metadata Package versions, routes and optional archive provenance. @example WriteMetadata(output, metadata); @returns No value; keep the snapshot self-describing. */
export const WriteMetadata = (directory: string, metadata: SiteMetadata): void => {
    writeFileSync(join(directory, "site.json"), JSON.stringify({ schemaVersion: 1, ...metadata }, null, 4) + "\n");
};

/** @param left First snapshot. @param right Second snapshot. @example versions.sort(CompareVersions); @returns Descending version order, with a release ahead of its prereleases. */
export const CompareVersions = (left: PackageVersions, right: PackageVersions): number => {
    const [leftCore, ...leftPrerelease] = left.version.split("-");
    const [rightCore, ...rightPrerelease] = right.version.split("-");
    const coreOrder = rightCore.localeCompare(leftCore, "en", { numeric: true });
    // Compare major/minor/patch before prerelease suffixes.
    if (coreOrder === 0) {
        // A stable release sorts before prereleases with the same core version.
        if (leftPrerelease.length === 0 && rightPrerelease.length > 0) {
            return -1;
        } else if (rightPrerelease.length === 0 && leftPrerelease.length > 0) {
            // The right-hand entry is the stable release.
            return 1;
        } else {
            return rightPrerelease.join("-").localeCompare(leftPrerelease.join("-"), "en", { numeric: true });
        }
    } else {
        return coreOrder;
    }
};

/** @example WriteRegistry(); @returns Registered versions, without rewriting any archived snapshot. */
export const WriteRegistry = (): PackageVersions[] => {
    const versions: PackageVersions[] = [];
    // Only self-described version directories are selectable; loose build assets are ignored.
    for (const entry of readdirSync(siteRoot, { withFileTypes: true })) {
        const metadataPath = join(siteRoot, entry.name, "site.json");
        // Both the directory and its metadata must identify the same exact package version.
        if (entry.isDirectory() && versionPattern.test(entry.name) && existsSync(metadataPath)) {
            const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as SiteMetadata;
            // Fail a mismatched snapshot rather than publish a misleading selector option.
            if (metadata.version === entry.name && versionPattern.test(metadata.matrixVersion)) {
                versions.push({ version: metadata.version, matrixVersion: metadata.matrixVersion });
            } else {
                throw new TypeError("Invalid snapshot metadata: " + metadataPath);
            }
        }
    }
    versions.sort(CompareVersions);
    // The root redirect must point to a real, completed snapshot.
    if (versions.length > 0) {
        const latest = versions[0].version;
        writeFileSync(join(siteRoot, "versions.json"), JSON.stringify({ schemaVersion: 1, latest, versions }, null, 4) + "\n");
        writeFileSync(join(siteRoot, ".nojekyll"), "");
        writeFileSync(join(siteRoot, "index.html"), `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Versioned BPLineJS and BPMatrixJS documentation and interactive examples." />
    <title>BPLineJS documentation and examples</title>
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
</head>
<body>
    <p><a data-latest href="./${latest}/#/docs/bpline">Open BPLineJS ${latest}</a></p>
    <script type="module" src="./site-entry.js"></script>
</body>
</html>
`);
        return versions;
    } else {
        throw new Error("No completed site snapshots are available.");
    }
};

export interface PackageVersions {
    version: string;
    matrixVersion: string;
}

export interface SiteMetadata extends PackageVersions {
    routes: string[];
    source?: { tag: string; commit: string };
}
