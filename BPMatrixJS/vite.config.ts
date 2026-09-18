import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import type { ServerOptions } from "node:https";
import { defineConfig } from "vite";

const certificatePath: URL = new URL("../.certs/server.pem", import.meta.url);
const privateKeyPath: URL = new URL("../.certs/server-key.pem", import.meta.url);
let https: ServerOptions | undefined;

// 两个项目共用本机证书；没有本地证书时不影响其他环境启动和构建。
if (existsSync(certificatePath) && existsSync(privateKeyPath)) {
    https = {
        cert: readFileSync(certificatePath),
        key: readFileSync(privateKeyPath),
    };
}

export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 12111,
        strictPort: true,
        https,
        fs: {
            deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.certs/**", "**/*.{key,csr,p12,pfx}"],
        },
    },
});
