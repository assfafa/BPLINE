# 包与入口 Package

目录：`bplinejs/.`

## 1. 文件结构与作用

包入口、源码目录、构建配置与导出路径。

| 文件 / 子目录 | 作用 |
| --- | --- |
| `AGENTS.md` | 工作约定；agent.md 是目录/API 索引，两者职责不同。 |
| `bplinejs-0.1.104-beta.17.tgz` | 本目录维护的配置、资源或验证文件。 |
| `bplinejs-0.1.104-beta.18.tgz` | 本目录维护的配置、资源或验证文件。 |
| `eslint.config.js` | 严格类型、可读性、类布局与格式检查配置。 |
| `index.html` | 本目录维护的配置、资源或验证文件。 |
| `package-lock.json` | 本目录维护的配置、资源或验证文件。 |
| `package.json` | npm 版本、依赖、脚本、files 与 exports 的发布契约。 |
| `README.md` | 本目录维护的配置、资源或验证文件。 |
| `releases/` | 对应 npm 版本的变更说明。 详见该目录的 agent.md。 |
| `src/` | 包入口、源码目录、构建配置与导出路径。 详见该目录的 agent.md。 |
| `tsconfig.eslint.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `tsconfig.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `tsconfig.lib.json` | TypeScript 检查/声明生成范围和编译选项。 |
| `vite.config.ts` | 应用或 ESM 库构建入口、资源处理与输出规则。 |
| `vite.lib.config.ts` | 应用或 ESM 库构建入口、资源处理与输出规则。 |

## 2. index 入口、案例与类接口

本目录是 npm 包根。源码入口为 `src/scripts/index.ts`，安装后的入口为 `lib/index.js`，声明入口为 `lib/index.d.ts`。

```sh
npm run check
npm run build:lib
npm run pack:check
```

## 3. 其他源码文件

### 文件：eslint.config.js


### 导出关系

```ts
export default tseslint.config(
    {
        ignores: ["dist/**", "lib/**", "node_modules/**", "eslint.config.js"],
    },
    js.configs.recommended,
    ...typedConfigs,
    {
        files: ["**/*.ts"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@stylistic": stylistic,
            readability,
        },
        rules: {
            "no-ternary": "error",
            "curly": ["error", "all"],
            "no-negated-condition": "off",
            "no-else-return": "off",
            "readability/function-documentation": "error",
            "readability/class-layout": "error",
            "readability/field-defaults": "error",
            "readability/control-comment": "error",
            "@stylistic/max-statements-per-line": ["error", { max: 1 }],
            "one-var": ["error", "never"],
            "no-sequences": "error",
            "no-cond-assign": ["error", "always"],
            // 否定条件不要作为提前退出的守卫，使用正向 if 和 else 分支。
            "no-restricted-syntax": [
                "error",
                {
                    selector: "IfStatement:matches([test.operator='!'], [test.operator='!='], [test.operator='!==']) > :matches(ReturnStatement, BreakStatement, ContinueStatement).consequent",
                    message: "请使用正向 if 条件，在 else 中 return、break 或 continue，不要通过否定条件提前退出。",
                },
                {
                    selector: "IfStatement:matches([test.operator='!'], [test.operator='!='], [test.operator='!==']) > BlockStatement.consequent > :matches(ReturnStatement, BreakStatement, ContinueStatement)",
                    message: "请使用正向 if 条件，在 else 中 return、break 或 continue，不要通过否定条件提前退出。",
                },
            ],
            "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
            "@stylistic/indent": ["error", 4],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "semi",
                        requireLast: true,
                    },
                    singleline: {
                        delimiter: "semi",
                        requireLast: false,
                    },
                    multilineDetection: "brackets",
                },
            ],
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
        },
    },
);
```

### 文件：vite.config.ts


### 导出关系

```ts
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
```

### 文件：vite.lib.config.ts


### 导出关系

```ts
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
                "Control/index": resolve(import.meta.dirname, "src/scripts/Control/index.ts"),
                "Control/CameraControl/index": resolve(import.meta.dirname, "src/scripts/Control/CameraControl/index.ts"),
                "Editor/index": resolve(import.meta.dirname, "src/scripts/Editor/index.ts"),
                "Editor/RectEditTool/index": resolve(import.meta.dirname, "src/scripts/Editor/RectEditTool/index.ts"),
                "Editor/NGonEditTool/index": resolve(import.meta.dirname, "src/scripts/Editor/NGonEditTool/index.ts"),
                "Editor/PolyEditTool/index": resolve(import.meta.dirname, "src/scripts/Editor/PolyEditTool/index.ts"),
                "Editor/TextEditTool/index": resolve(import.meta.dirname, "src/scripts/Editor/TextEditTool/index.ts"),
                "Helper/index": resolve(import.meta.dirname, "src/scripts/Helper/index.ts"),
                "Helper/HelperGrid/index": resolve(import.meta.dirname, "src/scripts/Helper/HelperGrid/index.ts"),
                "Geometry/index": resolve(import.meta.dirname, "src/scripts/Geometry/index.ts"),
                "Group/index": resolve(import.meta.dirname, "src/scripts/Group/index.ts"),
                "IMesh/index": resolve(import.meta.dirname, "src/scripts/IMesh/index.ts"),
                "Material/index": resolve(import.meta.dirname, "src/scripts/Material/index.ts"),
                "Mesh/index": resolve(import.meta.dirname, "src/scripts/Mesh/index.ts"),
                "Object/index": resolve(import.meta.dirname, "src/scripts/Object/index.ts"),
                "Render/index": resolve(import.meta.dirname, "src/scripts/Render/index.ts"),
                "Scene/index": resolve(import.meta.dirname, "src/scripts/Scene/index.ts"),
                "Select/index": resolve(import.meta.dirname, "src/scripts/Select/index.ts"),
                "Select/RectSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/RectSelectTool/index.ts"),
                "Select/NGonSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/NGonSelectTool/index.ts"),
                "Select/PolySelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/PolySelectTool/index.ts"),
                "Select/BaseSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/BaseSelectTool/index.ts"),
                "Select/TextSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/TextSelectTool/index.ts"),
                "Select/LineSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/LineSelectTool/index.ts"),
                "Select/PointSelectTool/index": resolve(import.meta.dirname, "src/scripts/Select/PointSelectTool/index.ts"),
                "Raws/index": resolve(import.meta.dirname, "src/scripts/Raws/index.ts"),
                "Texture/index": resolve(import.meta.dirname, "src/scripts/Texture/index.ts"),
                "Text/index": resolve(import.meta.dirname, "src/scripts/Text/index.ts"),
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
```

## 4. 注意事项

- 源码按 imports、class（字段/构造/方法）、类型、辅助函数、exports 排列；独立默认值写在字段声明上，构造函数保留参数赋值和初始化绑定。
- agent.md 的符号与默认值由源码生成；修改后执行 `npm run guides`，检查时执行 `npm run guides:check`。人工补充请写在 agent-notes 标记之间，重新生成会保留。
- 库构建把 src/scripts 的目录说明复制到 lib 同名目录；TS 对应 JS/声明，WGSL 作为导入资源编译。Examples 说明只保留在源码，不进入 npm。

<!-- agent-notes:start -->
暂无额外目录约定。
<!-- agent-notes:end -->

## 5. 中英文搜索关键词

```xml
<keywords language="zh">项目 包 入口 构建 导出</keywords>
<keywords language="en">package entry source build exports</keywords>
```
