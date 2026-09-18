import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import type { ServerOptions } from "node:https";
import { defineConfig } from "vite";

const certificatePath: URL = new URL("../.certs/server.pem", import.meta.url);
const privateKeyPath: URL = new URL("../.certs/server-key.pem", import.meta.url);
let https: ServerOptions | undefined;

// 本地证书不进入 Git；未配置证书的开发环境仍可正常启动 HTTP 或执行构建。
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
        port: 12112,
        strictPort: true,
        https,
        fs: {
            deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.certs/**", "**/*.{key,csr,p12,pfx}"],
        },
    },
});
