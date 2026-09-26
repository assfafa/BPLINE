import { existsSync, readFileSync } from "node:fs";
import type { ServerOptions } from "node:https";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const certificatePath: URL = new URL("../.certs/server.pem", import.meta.url);
const privateKeyPath: URL = new URL("../.certs/server-key.pem", import.meta.url);
let https: ServerOptions | undefined;

// 复用本地开发证书；没有证书时仍可使用 HTTP 或执行生产构建。
if (existsSync(certificatePath) && existsSync(privateKeyPath)) {
    https = {
        cert: readFileSync(certificatePath),
        key: readFileSync(privateKeyPath),
    };
}

export default defineConfig({
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 12113,
        strictPort: true,
        https,
        fs: {
            deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.certs/**", "**/*.{key,csr,p12,pfx}"],
        },
    },
});
