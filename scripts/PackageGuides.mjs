import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? ".");
const source = join(root, "src/scripts");
const output = join(root, "lib");

/** @param directory 源码目录 @returns 本次复制的说明数。 @example CopyGuides(source); */
const CopyGuides = (directory) => {
    const path = relative(source, directory).replaceAll("\\", "/");
    let count = 0;
    // 本地案例和字体资源不属于库输出，也不携带其目录说明。
    if (path === "Examples" || path.startsWith("Examples/")) {
        return 0;
    } else if (path === "Geometry/Wasm/build" || path === "Geometry/Wasm/src" || path === "Utils/Bool/build" || path === "Utils/Bool/src") {
        // Native source/build guides stay in the repository; runtime outputs contain only deployable files.
        return 0;
    } else {
        const guide = join(directory, "agent.md");
        if (existsSync(guide)) {
            const target = join(output, path);
            mkdirSync(target, { recursive: true });
            copyFileSync(guide, join(target, "agent.md"));
            count++;
        } else {
            throw new Error("Missing directory guide: " + guide);
        }
        // 随附第三方许可必须与编译后的实现一起发布；模型和字体不在此复制。
        const license = join(directory, "LICENSE");
        if (existsSync(license)) {
            copyFileSync(license, join(output, path, "LICENSE"));
        }
        // 递归维护的源码目录，排除规则与目录说明保持一致。
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                count += CopyGuides(join(directory, entry.name));
            }
        }
        return count;
    }
};

console.log("Packaged directory guides: " + String(CopyGuides(source)) + ".");
