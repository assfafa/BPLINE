import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { CollectRoutes, ReadVersions, repositoryRoot, siteRoot, WriteMetadata, WriteRegistry } from "./site.ts";

const tag = process.argv[2];
// Archive explicit release tags, without checking out or rebuilding historical source.
if (typeof tag === "string" && /^bplinejs-v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
    const packageSource = execFileSync("git", ["show", `${tag}:Example/package.json`], { cwd: repositoryRoot, encoding: "utf8" });
    const versions = ReadVersions(packageSource);
    const destination = join(siteRoot, versions.version);
    // A restored snapshot is immutable on repeat runs.
    if (existsSync(destination)) {
        console.log("Snapshot already exists; preserved: " + destination);
    } else {
        const scratch = join(repositoryRoot, ".local", "site-archives", versions.version);
        mkdirSync(scratch, { recursive: true });
        const archive = join(scratch, "site.tar");
        execFileSync("git", ["archive", "--format=tar", "--output", archive, tag, "docs"], { cwd: repositoryRoot });
        execFileSync("tar", ["-xf", archive, "-C", scratch]);
        const source = join(scratch, "docs");
        const html = readFileSync(join(source, "index.html"), "utf8");
        // Do not nest an already versioned entry under a new version label.
        if (html.includes("id=\"root\"") && html.includes("./assets/")) {
            console.log("Historical standalone assets verified.");
        } else {
            throw new Error("The tag does not contain a standalone historical site.");
        }
        const routes = CollectRoutes([
            execFileSync("git", ["show", `${tag}:Example/src/router/index.ts`], { cwd: repositoryRoot, encoding: "utf8" }),
            execFileSync("git", ["show", `${tag}:Example/src/pages/docs/catalog.ts`], { cwd: repositoryRoot, encoding: "utf8" }),
        ]);
        const commit = execFileSync("git", ["rev-parse", `${tag}^{commit}`], { cwd: repositoryRoot, encoding: "utf8" }).trim();
        WriteMetadata(source, { ...versions, routes, source: { tag, commit } });
        const metadata = `<meta name="bplinejs-version" content="${versions.version}" />\n    <meta name="bpmatrixjs-version" content="${versions.matrixVersion}" />`;
        const augmented = html.replace("</head>", "    " + metadata + "\n  </head>")
            .replace("</body>", "    <script type=\"module\" src=\"../archive-version.js\"></script>\n  </body>")
            .replaceAll("https://assfafa.github.io/BPLINE/", `https://assfafa.github.io/BPLINE/${versions.version}/`);
        writeFileSync(join(source, "index.html"), augmented);
        cpSync(source, destination, { recursive: true, force: false, errorOnExist: true });
        console.log(`Restored ${versions.version} from ${tag} (${commit}).`);
    }
    WriteRegistry();
} else {
    throw new Error("Usage: npm run archive -- bplinejs-v0.1.103");
}
