import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    build: {
        outDir: "lib",
        emptyOutDir: true,
        minify: false,
        sourcemap: true,
        rollupOptions: {
            external: ["bpmatrixjs", /^bpmatrixjs\//],
            input: {
                index: resolve(import.meta.dirname, "src/scripts/index.ts"),
                "Color/index": resolve(import.meta.dirname, "src/scripts/Color/index.ts"),
                "Style/index": resolve(import.meta.dirname, "src/scripts/Style/index.ts"),
                "Camera/index": resolve(import.meta.dirname, "src/scripts/Camera/index.ts"),
                "Geometry/index": resolve(import.meta.dirname, "src/scripts/Geometry/index.ts"),
                "Group/index": resolve(import.meta.dirname, "src/scripts/Group/index.ts"),
                "IMesh/index": resolve(import.meta.dirname, "src/scripts/IMesh/index.ts"),
                "Material/index": resolve(import.meta.dirname, "src/scripts/Material/index.ts"),
                "Mesh/index": resolve(import.meta.dirname, "src/scripts/Mesh/index.ts"),
                "Object/index": resolve(import.meta.dirname, "src/scripts/Object/index.ts"),
                "Render/index": resolve(import.meta.dirname, "src/scripts/Render/index.ts"),
                "Scene/index": resolve(import.meta.dirname, "src/scripts/Scene/index.ts"),
                "Raws/index": resolve(import.meta.dirname, "src/scripts/Raws/index.ts"),
                "Texture/index": resolve(import.meta.dirname, "src/scripts/Texture/index.ts"),
            },
            preserveEntrySignatures: "strict",
            output: {
                format: "es",
                preserveModules: true,
                preserveModulesRoot: resolve(import.meta.dirname, "src/scripts"),
                entryFileNames: "[name].js",
            },
        },
    },
});
