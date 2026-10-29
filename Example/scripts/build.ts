import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "vite";
import { CollectRoutes, exampleRoot, ReadVersions, siteRoot, WriteMetadata, WriteRegistry } from "./site.ts";

const versions = ReadVersions(readFileSync(join(exampleRoot, "package.json"), "utf8"));
// Never publish an old installed package under a newly edited version label.
for (const [name, expected] of [["bplinejs", versions.version], ["bpmatrixjs", versions.matrixVersion]]) {
    const installed = JSON.parse(readFileSync(join(exampleRoot, "node_modules", name, "package.json"), "utf8")) as { version: string };
    // An install is required before building a changed dependency version.
    if (installed.version !== expected) {
        throw new Error(`Install ${name}@${expected} before building the website.`);
    }
}

// Vite empties only docs/<current-version>; sibling archives are never rebuilt.
await build({ root: exampleRoot, configFile: join(exampleRoot, "vite.config.ts") });
const output = join(siteRoot, versions.version);
const routes = CollectRoutes([
    readFileSync(join(exampleRoot, "src/router/index.ts"), "utf8"),
    readFileSync(join(exampleRoot, "src/pages/docs/catalog.ts"), "utf8"),
]);
WriteMetadata(output, { ...versions, routes });
const htmlPath = join(output, "index.html");
const html = readFileSync(htmlPath, "utf8").replaceAll("https://assfafa.github.io/BPLINE/", `https://assfafa.github.io/BPLINE/${versions.version}/`);
writeFileSync(htmlPath, html);

// These tiny shared entry/selector scripts can discover new versions without touching archived bundles.
await build({
    configFile: false,
    root: exampleRoot,
    publicDir: false,
    build: {
        outDir: siteRoot,
        emptyOutDir: false,
        lib: {
            entry: { "site-entry": join(exampleRoot, "src/version/entry.ts"), "archive-version": join(exampleRoot, "src/version/archive.ts") },
            formats: ["es"],
            /** @param _format Module format. @param name Entry name. @example fileName("es", "site-entry"); @returns A stable shared entry filename. */
            fileName: (_format, name) => {
                return `${name}.js`;
            },
        },
        rollupOptions: { output: { chunkFileNames: "site-[name].js" } },
    },
});
copyFileSync(join(exampleRoot, "public/favicon.svg"), join(siteRoot, "favicon.svg"));
const registered = WriteRegistry();

/** @param entry Registered package pair. @example registered.map(VersionName); @returns Renderer version for the build report. */
const VersionName = (entry: { version: string }): string => {
    return entry.version;
};
console.log(`Built ${versions.version}; available snapshots: ${registered.map(VersionName).join(", ")}`);
